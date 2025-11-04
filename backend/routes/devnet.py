from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional, Dict, Any
import os
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from ..security.webhook import verify_signature

router = APIRouter()

# Mongo connection (must use MONGO_URL from env)
MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME", "test_database")
if not MONGO_URL:
    raise RuntimeError("MONGO_URL environment variable is required")
_client = AsyncIOMotorClient(MONGO_URL)
_db = _client[DB_NAME]


class AirdropRequest(BaseModel):
    wallet_address: str
    amount: float = 10.0


class VerifyTxRequest(BaseModel):
    from_address: str
    to_address: str
    amount: float
    token_type: str  # 'SOL' | 'USDC' | 'SLT'
    signature: Optional[str] = None


@router.get("/devnet/balance/{address}")
async def get_balance(address: str) -> Dict[str, Any]:
    wallet = await _db.wallets.find_one({"public_key": address})
    if not wallet:
        # auto-create wallet with zero balances
        wallet = {
            "id": address,
            "public_key": address,
            "address": address,
            "created_at": datetime.utcnow(),
            "balance_sol": 0.0,
            "balance_usdc": 0.0,
            "balance_slt": 0.0,
        }
        await _db.wallets.insert_one(wallet)
    return {
        "address": address,
        "balances": {
            "SOL": wallet.get("balance_sol", 0.0),
            "USDC": wallet.get("balance_usdc", 0.0),
            "SLT": wallet.get("balance_slt", 0.0),
        },
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.post("/devnet/airdrop-slt")
async def airdrop_slt(req: AirdropRequest) -> Dict[str, Any]:
    await _db.wallets.update_one(
        {"public_key": req.wallet_address},
        {"$inc": {"balance_slt": float(req.amount)}},
        upsert=True,
    )
    tx = {
        "id": f"airdrop_{req.wallet_address}_{datetime.utcnow().timestamp()}",
        "from_address": "SYSTEM_AIRDROP",
        "to_address": req.wallet_address,
        "amount": float(req.amount),
        "token_type": "SLT",
        "status": "confirmed",
        "timestamp": datetime.utcnow(),
    }
    await _db.transactions.insert_one(tx)
    return {"success": True, "transaction_id": tx["id"], "message": "Airdrop successful"}


@router.post("/devnet/verify-transaction")
async def verify_transaction(req: VerifyTxRequest) -> Dict[str, Any]:
    # For devnet mock, we simply record and mark as pending
    tx = req.dict()
    tx["id"] = f"tx_{datetime.utcnow().timestamp()}"
    tx["status"] = "pending"
    tx["timestamp"] = datetime.utcnow()
    await _db.transactions.insert_one(tx)
    return {"verified": True, "transaction_id": tx["id"], "status": tx["status"]}


@router.get("/devnet/airdrop-stats/{address}")
async def airdrop_stats(address: str) -> Dict[str, Any]:
    count = await _db.transactions.count_documents({"to_address": address, "from_address": "SYSTEM_AIRDROP"})
    total = 0.0
    cursor = _db.transactions.find({"to_address": address, "from_address": "SYSTEM_AIRDROP"})
    async for doc in cursor:
        total += float(doc.get("amount", 0.0))
    return {"address": address, "airdrops": int(count), "total_slt": total}


@router.post("/devnet/webhook/helius")
async def helius_webhook(request: Request):
    # Validate signature if provided in headers
    secret = os.environ.get("HELIUS_WEBHOOK_SECRET", "")
    raw = await request.body()
    sig = request.headers.get("x-signature", "")
    ts = request.headers.get("x-timestamp")
    eid = request.headers.get("x-event-id")

    if secret:
        result = verify_signature(raw, sig, secret, timestamp=ts, event_id=eid)
        if not result.get("valid"):
            raise HTTPException(status_code=401, detail="Invalid webhook signature")

    # Store event for audit
    try:
        payload = await request.json()
    except Exception:
        payload = {"raw": raw.decode(errors="ignore")}
    doc = {
        "id": f"evt_{datetime.utcnow().timestamp()}",
        "headers": dict(request.headers),
        "payload": payload,
        "received_at": datetime.utcnow(),
    }
    await _db.webhook_events.insert_one(doc)
    return {"received": True}
