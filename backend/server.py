from fastapi import FastAPI, APIRouter, HTTPException, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta
import time
import asyncio
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="SUÉLTALO Crypto Wallet API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

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
    """Create or register a new wallet"""
    try:
        # Check if wallet already exists
        existing_wallet = await db.wallets.find_one({"public_key": wallet.public_key})
        if existing_wallet:
            return WalletResponse(**existing_wallet)
        
        wallet_data = WalletResponse(
            public_key=wallet.public_key,
            address=wallet.address
        )
        
        await db.wallets.insert_one(wallet_data.dict())
        return wallet_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create wallet: {str(e)}")

@api_router.get("/wallet/{public_key}", response_model=WalletResponse)
async def get_wallet(public_key: str):
    """Get wallet information"""
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
    """Get wallet balances for all tokens"""
    try:
        wallet = await db.wallets.find_one({"public_key": public_key})
        if not wallet:
            # Create wallet if it doesn't exist
            wallet_data = WalletResponse(
                public_key=public_key,
                address=public_key
            )
            await db.wallets.insert_one(wallet_data.dict())
            wallet = wallet_data.dict()
        
        # In a real implementation, you would query Solana RPC for actual balances
        # For now, return stored balances with some mock updates
        return {
            "public_key": public_key,
            "balances": {
                "SOL": wallet.get("balance_sol", 0.0),
                "USDC": wallet.get("balance_usdc", 0.0),
                "SLT": wallet.get("balance_slt", 0.0)
            },
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get balance: {str(e)}")

# Transaction endpoints
@api_router.post("/transaction", response_model=TransactionResponse)
async def create_transaction(transaction: TransactionCreate):
    """Create a new transaction record"""
    try:
        # Calculate SLT reward for USDC transactions
        reward_slt = 0.0
        if transaction.token_type == "USDC" and transaction.amount > 0:
            # Give 0.1 SLT per USDC transferred
            reward_slt = transaction.amount * 0.1
        
        transaction_data = TransactionResponse(
            from_address=transaction.from_address,
            to_address=transaction.to_address,
            amount=transaction.amount,
            token_type=transaction.token_type,
            signature=transaction.signature,
            reward_slt=reward_slt
        )
        
        await db.transactions.insert_one(transaction_data.dict())
        
        # Update sender's SLT balance with reward
        if reward_slt > 0:
            await db.wallets.update_one(
                {"public_key": transaction.from_address},
                {"$inc": {"balance_slt": reward_slt}}
            )
        
        return transaction_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create transaction: {str(e)}")

@api_router.get("/wallet/{public_key}/transactions", response_model=List[TransactionResponse])
async def get_wallet_transactions(public_key: str, limit: int = 50):
    """Get transaction history for a wallet"""
    try:
        transactions = await db.transactions.find({
            "$or": [
                {"from_address": public_key},
                {"to_address": public_key}
            ]
        }).sort("timestamp", -1).limit(limit).to_list(limit)
        
        return [TransactionResponse(**tx) for tx in transactions]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get transactions: {str(e)}")

@api_router.put("/transaction/{transaction_id}/status")
async def update_transaction_status(transaction_id: str, status: str, signature: Optional[str] = None):
    """Update transaction status"""
    try:
        update_data = {"status": status, "updated_at": datetime.utcnow()}
        if signature:
            update_data["signature"] = signature
        
        result = await db.transactions.update_one(
            {"id": transaction_id},
            {"$set": update_data}
        )
        
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
    """Start KYC process (Mock implementation)"""
    try:
        kyc_record = {
            "id": str(uuid.uuid4()),
            "wallet_address": kyc_data.wallet_address,
            "email": kyc_data.email,
            "full_name": kyc_data.full_name,
            "status": "pending",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        await db.kyc_records.insert_one(kyc_record)
        
        return {
            "success": True,
            "kyc_id": kyc_record["id"],
            "status": "pending",
            "message": "KYC process started. Please check back later for status updates."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start KYC: {str(e)}")

@api_router.get("/kyc/status/{wallet_address}")
async def get_kyc_status(wallet_address: str):
    """Get KYC status for a wallet (Mock implementation)"""
    try:
        kyc_record = await db.kyc_records.find_one({"wallet_address": wallet_address})
        
        if not kyc_record:
            return {
                "wallet_address": wallet_address,
                "status": "not_started",
                "message": "KYC process not started for this wallet"
            }
        
        # Mock status progression for demo
        created_time = kyc_record["created_at"]
        time_elapsed = (datetime.utcnow() - created_time).total_seconds()
        
        if time_elapsed > 300:  # 5 minutes
            status = "approved"
        elif time_elapsed > 60:  # 1 minute
            status = "under_review"
        else:
            status = "pending"
        
        # Update status in database
        await db.kyc_records.update_one(
            {"wallet_address": wallet_address},
            {"$set": {"status": status, "updated_at": datetime.utcnow()}}
        )
        
        return {
            "wallet_address": wallet_address,
            "status": status,
            "created_at": created_time.isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get KYC status: {str(e)}")

# SLT Token management
@api_router.post("/slt/airdrop")
async def airdrop_slt(wallet_address: str, amount: float):
    """Airdrop SLT tokens to a wallet"""
    try:
        # Update wallet SLT balance
        result = await db.wallets.update_one(
            {"public_key": wallet_address},
            {"$inc": {"balance_slt": amount}},
            upsert=True
        )
        
        # Record the airdrop as a transaction
        airdrop_tx = TransactionResponse(
            from_address="SYSTEM_AIRDROP",
            to_address=wallet_address,
            amount=amount,
            token_type="SLT",
            status="confirmed"
        )
        
        await db.transactions.insert_one(airdrop_tx.dict())
        
        return {
            "success": True,
            "message": f"Airdropped {amount} SLT to {wallet_address}",
            "transaction_id": airdrop_tx.id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to airdrop SLT: {str(e)}")

# Health check
@api_router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "SUÉLTALO Crypto Wallet API"
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)