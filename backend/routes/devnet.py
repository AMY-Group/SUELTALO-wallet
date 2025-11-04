"""
Solana Devnet API Routes
Handles blockchain operations, airdrops, and webhooks
"""

from fastapi import APIRouter, HTTPException, Header, Request, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import logging
import time

from services.solana_service import solana_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/devnet", tags=["devnet"])

# Request/Response Models
class BalanceRequest(BaseModel):
    address: str

class BalanceResponse(BaseModel):
    address: str
    sol_balance: float
    slt_balance: float = 0.0
    usdc_balance: float = 0.0
    timestamp: str

class AirdropRequest(BaseModel):
    recipient_address: str
    amount: float
    trigger_tx_signature: Optional[str] = None

class AirdropResponse(BaseModel):
    success: bool
    message: str
    amount: float = 0.0
    recipient: str

class FaucetRequest(BaseModel):
    address: str
    amount: float = 1.0

class TransactionVerifyRequest(BaseModel):
    signature: str

# Routes
@router.get("/balance/{address}", response_model=BalanceResponse)
async def get_devnet_balance(address: str):
    """Get real-time balance from Solana Devnet"""
    try:
        sol_balance = await solana_service.get_sol_balance(address)
        
        slt_balance = 0.0
        usdc_balance = 0.0
        
        if solana_service.slt_mint:
            slt_balance = await solana_service.get_token_balance(address, solana_service.slt_mint)
        
        if solana_service.usdc_mock_mint:
            usdc_balance = await solana_service.get_token_balance(address, solana_service.usdc_mock_mint)
        
        return BalanceResponse(
            address=address,
            sol_balance=sol_balance,
            slt_balance=slt_balance,
            usdc_balance=usdc_balance,
            timestamp=datetime.utcnow().isoformat()
        )
    except Exception as e:
        logger.error(f"Failed to get balance: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/airdrop-slt", response_model=AirdropResponse)
async def request_slt_airdrop(request: AirdropRequest, background_tasks: BackgroundTasks):
    """
    Request SLT airdrop with idempotency and verification
    """
    try:
        # Validate airdrop
        is_valid, message = await solana_service.validate_airdrop(
            request.recipient_address,
            request.amount,
            request.trigger_tx_signature
        )
        
        if not is_valid:
            return AirdropResponse(
                success=False,
                message=message,
                recipient=request.recipient_address
            )
        
        # Record airdrop
        await solana_service.record_airdrop(
            request.recipient_address,
            request.amount,
            request.trigger_tx_signature
        )
        
        # In production, this would mint tokens on-chain
        # For now, frontend handles the actual minting via web3.js
        
        return AirdropResponse(
            success=True,
            message="Airdrop approved. Proceed with on-chain minting.",
            amount=request.amount,
            recipient=request.recipient_address
        )
        
    except Exception as e:
        logger.error(f"Failed to process airdrop: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/faucet")
async def request_sol_faucet(request: FaucetRequest):
    """Request SOL from devnet faucet (client-side via requestAirdrop)"""
    return {
        "message": "Use requestAirdrop from client",
        "rpc_url": "https://api.devnet.solana.com",
        "address": request.address,
        "amount": request.amount
    }


@router.post("/verify-transaction")
async def verify_transaction(request: TransactionVerifyRequest):
    """Verify a transaction on-chain and calculate SLT reward if USDC-MOCK transfer"""
    try:
        is_valid, tx_data = await solana_service.verify_transaction_on_chain(request.signature)
        
        if not is_valid:
            raise HTTPException(status_code=404, detail="Transaction not found or invalid")
        
        # Calculate reward if USDC transfer found
        rewarded_slt = 0.0
        usdc_amount = await solana_service.get_usdc_transfer_amount(tx_data)
        
        if usdc_amount and usdc_amount > 0:
            rewarded_slt = await solana_service.calculate_slt_reward(usdc_amount)
        
        return {
            "signature": request.signature,
            "valid": True,
            "rewardedSLT": rewarded_slt,
            "usdcAmount": usdc_amount or 0.0,
            "data": tx_data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to verify transaction: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/airdrop-stats/{address}")
async def get_airdrop_stats(address: str):
    """Get airdrop statistics for an address"""
    try:
        stats = await solana_service.get_recent_airdrop_stats(address)
        return stats
    except Exception as e:
        logger.error(f"Failed to get airdrop stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/webhook/helius")
async def helius_webhook(
    request: Request,
    x_helius_signature: Optional[str] = Header(None, alias="X-Helius-Signature"),
    x_helius_event_id: Optional[str] = Header(None, alias="X-Helius-Event-Id"),
    x_helius_timestamp: Optional[str] = Header(None, alias="X-Helius-Timestamp")
):
    """
    Helius webhook endpoint with signature verification and replay protection
    """
    try:
        # Get payload
        payload = await request.body()
        
        # Verify required headers
        if not x_helius_signature or not x_helius_event_id or not x_helius_timestamp:
            raise HTTPException(status_code=400, detail="Missing required webhook headers")
        
        # Verify signature
        is_valid = solana_service.verify_webhook_signature(payload, x_helius_signature)
        if not is_valid:
            raise HTTPException(status_code=401, detail="Invalid webhook signature")
        
        # Replay protection - check timestamp
        current_time = int(time.time())
        event_time = int(x_helius_timestamp)
        
        REPLAY_TIME_WINDOW = 300  # 5 minutes
        if abs(current_time - event_time) > REPLAY_TIME_WINDOW:
            raise HTTPException(status_code=400, detail="Webhook event timestamp outside allowed window")
        
        # Check if event already processed
        if x_helius_event_id in solana_service.processed_signatures:
            raise HTTPException(status_code=409, detail="Replay attack detected")
        
        # Mark event as seen
        solana_service.processed_signatures.add(x_helius_event_id)
        
        # Parse webhook data
        data = await request.json()
        
        # Process webhook event
        # This would trigger automatic airdrops based on confirmed transactions
        logger.info(f"Helius webhook received: {x_helius_event_id}")
        
        # TODO: Process transaction and trigger SLT airdrop if USDC-MOCK transfer detected
        
        return {"status": "success", "event_id": x_helius_event_id}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to process webhook: {e}")
        raise HTTPException(status_code=500, detail=str(e))
