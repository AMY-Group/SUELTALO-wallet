from fastapi import FastAPI, APIRouter, HTTPException, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime
import time
import asyncio

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Import shared DB (single connection)
from db import db, client

# Create the main app without a prefix
app = FastAPI(title="SUÉLTALO Crypto Wallet API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Import Solana service
from services.solana_service import solana_service

# Import devnet routes
from routes.devnet import router as devnet_router

# Models
class WalletCreate(BaseModel):
    public_key: str
    address: str

class WalletResponse(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    public_key: str
    address: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    balance_sol: float = 0.0
    balance_usdc: float = 0.0
    balance_slt: float = 0.0

class TransactionCreate(BaseModel):
    from_address: str
    to_address: str
    amount: float
    token_type: str  # 'SOL', 'USDC', 'SLT'
    signature: Optional[str] = None

class TransactionResponse(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    from_address: str
    to_address: str
    amount: float
    token_type: str
    signature: Optional[str] = None
    status: str = "pending"  # pending, confirmed, failed
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    reward_slt: float = 0.0

class KYCStart(BaseModel):
    wallet_address: str
    email: str
    full_name: str

class KYCStatus(BaseModel):
    wallet_address: str
    status: str  # "pending", "approved", "rejected"
    created_at: datetime
    updated_at: datetime

# Wallet endpoints
@api_router.post("/wallet", response_model=WalletResponse)
async def create_wallet(wallet: WalletCreate):
    try:
        existing_wallet = await db.wallets.find_one({"public_key": wallet.public_key})
        if existing_wallet:
            return WalletResponse(**existing_wallet)

        wallet_data = WalletResponse(public_key=wallet.public_key, address=wallet.address)
        await db.wallets.insert_one(wallet_data.dict())
        return wallet_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create wallet: {str(e)}")

@api_router.get("/wallet/{public_key}", response_model=WalletResponse)
async def get_wallet(public_key: str):
    try:
        wallet = await db.wallets.find_one({"public_key": public_key})
        if not wallet:
            raise HTTPException(status_code=404, detail="Wallet not found")
        return WalletResponse(**wallet)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get wallet: {str(e)}")

@api_router.get("/wallet/{public_key}/balance")
async def get_wallet_balance(public_key: str):
    try:
        wallet = await db.wallets.find_one({"public_key": public_key})
        if not wallet:
            wallet_data = WalletResponse(public_key=public_key, address=public_key)
            await db.wallets.insert_one(wallet_data.dict())
            wallet = wallet_data.dict()

        return {
            "public_key": public_key,
            "balances": {
                "SOL": wallet.get("balance_sol", 0.0),
                "USDC": wallet.get("balance_usdc", 0.0),
                "SLT": wallet.get("balance_slt", 0.0),
            },
            "timestamp": datetime.utcnow().isoformat(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get balance: {str(e)}")

# Transaction endpoints
@api_router.post("/transaction", response_model=TransactionResponse)
async def create_transaction(transaction: TransactionCreate):
    try:
        reward_slt = 0.0
        if transaction.token_type == "USDC" and transaction.amount > 0:
            reward_slt = transaction.amount * 0.1

        transaction_data = TransactionResponse(
            from_address=transaction.from_address,
            to_address=transaction.to_address,
            amount=transaction.amount,
            token_type=transaction.token_type,
            signature=transaction.signature,
            reward_slt=reward_slt,
        )

        await db.transactions.insert_one(transaction_data.dict())

        if reward_slt > 0:
            await db.wallets.update_one(
                {"public_key": transaction.from_address},
                {"$inc": {"balance_slt": reward_slt}},
            )

        return transaction_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create transaction: {str(e)}")

@api_router.get("/wallet/{public_key}/transactions", response_model=List[TransactionResponse])
async def get_wallet_transactions(public_key: str, limit: int = 50):
    try:
        transactions = (
            await db.transactions.find({
                "$or": [
                    {"from_address": public_key},
                    {"to_address": public_key},
                ]
            })
            .sort("timestamp", -1)
            .limit(limit)
            .to_list(limit)
        )
        return [TransactionResponse(**tx) for tx in transactions]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get transactions: {str(e)}")

@api_router.put("/transaction/{transaction_id}/status")
async def update_transaction_status(transaction_id: str, status: str, signature: Optional[str] = None):
    try:
        update_data = {"status": status, "updated_at": datetime.utcnow()}
        if signature:
            update_data["signature"] = signature

        result = await db.transactions.update_one({"id": transaction_id}, {"$set": update_data})
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Transaction not found")
        return {"success": True, "message": "Transaction status updated"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update transaction: {str(e)}")

# KYC endpoints (Mock implementation)
@api_router.post("/kyc/start")
async def start_kyc(kyc_data: KYCStart):
    try:
        kyc_record = {
            "id": str(uuid.uuid4()),
            "wallet_address": kyc_data.wallet_address,
            "email": kyc_data.email,
            "full_name": kyc_data.full_name,
            "status": "pending",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        await db.kyc_records.insert_one(kyc_record)
        return {
            "success": True,
            "kyc_id": kyc_record["id"],
            "status": "pending",
            "message": "KYC process started. Please check back later for status updates.",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start KYC: {str(e)}")

@api_router.get("/kyc/status/{wallet_address}")
async def get_kyc_status(wallet_address: str):
    try:
        kyc_record = await db.kyc_records.find_one({"wallet_address": wallet_address})
        if not kyc_record:
            return {
                "wallet_address": wallet_address,
                "status": "not_started",
                "message": "KYC process not started for this wallet",
            }
        created_time = kyc_record["created_at"]
        time_elapsed = (datetime.utcnow() - created_time).total_seconds()
        if time_elapsed > 300:
            status = "approved"
        elif time_elapsed > 60:
            status = "under_review"
        else:
            status = "pending"
        await db.kyc_records.update_one(
            {"wallet_address": wallet_address},
            {"$set": {"status": status, "updated_at": datetime.utcnow()}},
        )
        return {
            "wallet_address": wallet_address,
            "status": status,
            "created_at": created_time.isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get KYC status: {str(e)}")

# SLT Token management
@api_router.post("/slt/airdrop")
async def airdrop_slt(wallet_address: str, amount: float):
    try:
        await db.wallets.update_one(
            {"public_key": wallet_address},
            {"$inc": {"balance_slt": amount}},
            upsert=True,
        )
        airdrop_tx = TransactionResponse(
            from_address="SYSTEM_AIRDROP",
            to_address=wallet_address,
            amount=amount,
            token_type="SLT",
            status="confirmed",
        )
        await db.transactions.insert_one(airdrop_tx.dict())
        return {
            "success": True,
            "message": f"Airdropped {amount} SLT to {wallet_address}",
            "transaction_id": airdrop_tx.id,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to airdrop SLT: {str(e)}")

# Health check
@api_router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "SUÉLTALO Crypto Wallet API",
    }

# Include routers
app.include_router(api_router)
app.include_router(devnet_router, prefix="/api")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    try:
        treasury_pubkey = os.getenv("SOLANA_TREASURY_PUBKEY")
        slt_mint = os.getenv("SOLANA_SLT_MINT")
        usdc_mock_mint = os.getenv("SOLANA_USDC_MOCK_MINT")
        webhook_secret = os.getenv("HELIUS_WEBHOOK_SECRET")
        if not treasury_pubkey:
            logger.warning("SOLANA_TREASURY_PUBKEY not set, using mock mode")
            treasury_pubkey = "11111111111111111111111111111111"
        await solana_service.initialize(
            treasury_pubkey=treasury_pubkey,
            slt_mint=slt_mint,
            usdc_mock_mint=usdc_mock_mint,
            webhook_secret=webhook_secret,
        )
        logger.info("Solana service initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize Solana service: {e}")

@app.on_event("shutdown")
async def shutdown_event():
    client.close()
    await solana_service.close()

if __name__ == "__main__":
    import uvicorn
    # For Railway, respect PORT if provided
    port = int(os.environ.get("PORT", "8001"))
    uvicorn.run(app, host="0.0.0.0", port=port)
