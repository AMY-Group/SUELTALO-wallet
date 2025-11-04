"""
Solana Devnet API Routes
Handles blockchain operations, airdrops, and webhooks
"""

from fastapi import APIRouter, HTTPException, Header, Request, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, timezone
import logging
import time

from services.solana_service import solana_service
from security.webhook import verify_signature

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
async def helius_webhook(request: Request):
    """
    Helius webhook endpoint with signature verification and replay protection
    """
    try:
        # Get raw body for signature verification
        body = await request.body()
        
        # Get headers (case-insensitive)
        sig = request.headers.get("x-helius-signature") or request.headers.get("X-Helius-Signature") or ""
        ts = request.headers.get("x-helius-timestamp") or request.headers.get("X-Helius-Timestamp") or ""
        eid = request.headers.get("x-helius-event-id") or request.headers.get("X-Helius-Event-Id") or ""
        
        # Verify required headers
        if not sig:
            raise HTTPException(status_code=400, detail="missing signature")
        
        # Replay protection - check timestamp
        WINDOW_SEC = 300  # 5 minutes
        if ts:
            try:
                now = int(datetime.now(tz=timezone.utc).timestamp())
                if abs(now - int(ts)) > WINDOW_SEC:
                    raise HTTPException(status_code=401, detail="timestamp outside window")
            except ValueError:
                raise HTTPException(status_code=401, detail="invalid timestamp")
        
        # Verify signature using robust verifier
        if not solana_service.webhook_secret:
            logger.warning("Webhook secret not configured")
            raise HTTPException(status_code=500, detail="Webhook not configured")
        
        result = verify_signature(
            body, 
            sig, 
            solana_service.webhook_secret,
            timestamp=ts if ts else None,
            event_id=eid if eid else None
        )
        
        if not result.get("valid"):
            logger.warning(f"Invalid webhook signature - tried all modes")
            raise HTTPException(status_code=401, detail="invalid signature")
        
        # Check if event already processed (replay protection)
        if eid and eid in solana_service.processed_signatures:
            logger.info(f"Event already processed (idempotent): {eid}")
            raise HTTPException(status_code=409, detail="Replay attack detected")
        
        # Mark event as seen
        if eid:
            solana_service.processed_signatures.add(eid)
        
        # Parse webhook data (after signature verification)
        data = await request.json()
        
        # Process webhook event
        # TODO: Process transaction and trigger SLT airdrop if USDC-MOCK transfer detected
        logger.info(f"Helius webhook received: {eid} (mode: {result.get('mode')})")
        
        return {
            "ok": True,
            "mode": result.get("mode"),
            "event_id": eid
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to process webhook: {e}")
        raise HTTPException(status_code=500, detail=str(e))
