"""
Solana Devnet Integration Service
Handles token management, airdrops, and on-chain verification via HTTP RPC
"""

import httpx
import base58
import json
from typing import Optional, Dict, Any, Tuple, List
from datetime import datetime, timedelta
import logging
import hmac
import hashlib

logger = logging.getLogger(__name__)

# Constants
LAMPORTS_PER_SOL = 1_000_000_000
SLT_DECIMALS = 6
SLT_MULTIPLIER = 10 ** SLT_DECIMALS
USDC_DECIMALS = 6
USDC_MULTIPLIER = 10 ** USDC_DECIMALS

# Airdrop caps and limits
DAILY_AIRDROP_CAP_PER_USER = 100 * SLT_MULTIPLIER  # 100 SLT per day per user
SINGLE_AIRDROP_MAX = 10 * SLT_MULTIPLIER  # 10 SLT max per transaction
AIRDROP_RATE = 0.1  # 0.1 SLT per 1 USDC-MOCK


class TokenAdapter:
    """
    Adapter pattern for token operations
    Allows easy switch between USDC-MOCK and real USDC
    """
    
    def __init__(self, mint_address: str, decimals: int, is_mock: bool = True):
        self.mint_address = mint_address
        self.decimals = decimals
        self.is_mock = is_mock
        self.multiplier = 10 ** decimals
    
    def to_base_units(self, amount: float) -> int:
        """Convert human-readable amount to base units"""
        return int(amount * self.multiplier)
    
    def from_base_units(self, amount: int) -> float:
        """Convert base units to human-readable amount"""
        return amount / self.multiplier


class SolanaService:
    """
    Main Solana service for Devnet operations
    Uses HTTP RPC for blockchain queries and verification
    """
    
    def __init__(self, rpc_url: str = "https://api.devnet.solana.com"):
        self.rpc_url = rpc_url
        self.client = httpx.AsyncClient(timeout=30.0)
        self.treasury_pubkey: Optional[str] = None
        self.slt_mint: Optional[str] = None
        self.usdc_mock_mint: Optional[str] = None
        self.slt_adapter: Optional[TokenAdapter] = None
        self.usdc_adapter: Optional[TokenAdapter] = None
        
        # Airdrop tracking (in production, use Redis)
        self.airdrop_history: Dict[str, list] = {}
        self.processed_signatures: set = set()
        
        # Helius webhook secret
        self.webhook_secret: Optional[str] = None
    
    async def initialize(
        self,
        treasury_pubkey: str,
        slt_mint: Optional[str] = None,
        usdc_mock_mint: Optional[str] = None,
        webhook_secret: Optional[str] = None
    ):
        """
        Initialize the service with treasury wallet and token mints
        """
        try:
            self.treasury_pubkey = treasury_pubkey
            self.webhook_secret = webhook_secret
            
            if slt_mint:
                self.slt_mint = slt_mint
                self.slt_adapter = TokenAdapter(slt_mint, SLT_DECIMALS, is_mock=False)
                logger.info(f"SLT mint configured: {slt_mint}")
            
            if usdc_mock_mint:
                self.usdc_mock_mint = usdc_mock_mint
                self.usdc_adapter = TokenAdapter(usdc_mock_mint, USDC_DECIMALS, is_mock=True)
                logger.info(f"USDC-MOCK mint configured: {usdc_mock_mint}")
            
            logger.info(f"Treasury wallet: {treasury_pubkey}")
            
            # Check treasury balance
            balance = await self.get_sol_balance(treasury_pubkey)
            logger.info(f"Treasury balance: {balance} SOL")
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to initialize Solana service: {e}")
            raise
    
    async def _rpc_call(self, method: str, params: List[Any]) -> Dict[str, Any]:
        """
        Make a JSON-RPC call to Solana
        """
        payload = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": method,
            "params": params
        }
        
        response = await self.client.post(self.rpc_url, json=payload)
        response.raise_for_status()
        
        result = response.json()
        
        if "error" in result:
            raise Exception(f"RPC Error: {result['error']}")
        
        return result.get("result")
    
    async def get_sol_balance(self, address: str) -> float:
        """Get SOL balance for an address"""
        try:
            result = await self._rpc_call("getBalance", [address])
            lamports = result.get("value", 0)
            return lamports / LAMPORTS_PER_SOL
        except Exception as e:
            logger.error(f"Failed to get SOL balance: {e}")
            return 0.0
    
    async def get_token_balance(self, owner_address: str, mint_address: str) -> float:
        """Get SPL token balance for an address"""
        try:
            # Get token accounts by owner
            result = await self._rpc_call(
                "getTokenAccountsByOwner",
                [
                    owner_address,
                    {"mint": mint_address},
                    {"encoding": "jsonParsed"}
                ]
            )
            
            accounts = result.get("value", [])
            
            if not accounts:
                return 0.0
            
            # Get balance from first account
            account = accounts[0]
            token_amount = account["account"]["data"]["parsed"]["info"]["tokenAmount"]
            
            return float(token_amount["uiAmount"])
            
        except Exception as e:
            logger.debug(f"No token account found or error: {e}")
            return 0.0
    
    async def verify_transaction_on_chain(self, signature: str) -> Tuple[bool, Optional[Dict]]:
        """
        Verify that a transaction exists and is confirmed on-chain
        Returns: (is_valid, transaction_details)
        """
        try:
            result = await self._rpc_call(
                "getTransaction",
                [
                    signature,
                    {
                        "encoding": "jsonParsed",
                        "maxSupportedTransactionVersion": 0
                    }
                ]
            )
            
            if not result:
                logger.warning(f"Transaction not found: {signature}")
                return False, None
            
            # Check if transaction was successful
            meta = result.get("meta", {})
            if meta.get("err"):
                logger.warning(f"Transaction failed: {signature}")
                return False, None
            
            logger.info(f"Transaction verified on-chain: {signature}")
            return True, result
            
        except Exception as e:
            logger.error(f"Failed to verify transaction: {e}")
            return False, None
    
    async def get_usdc_transfer_amount(self, transaction_data: Dict) -> Optional[float]:
        """
        Extract USDC transfer amount from a parsed transaction
        """
        try:
            if not self.usdc_mock_mint:
                return None
            
            meta = transaction_data.get("meta", {})
            pre_balances = meta.get("preTokenBalances", [])
            post_balances = meta.get("postTokenBalances", [])
            
            # Find USDC-MOCK transfers
            for pre, post in zip(pre_balances, post_balances):
                if pre.get("mint") == self.usdc_mock_mint:
                    pre_amount = float(pre.get("uiTokenAmount", {}).get("uiAmount", 0))
                    post_amount = float(post.get("uiTokenAmount", {}).get("uiAmount", 0))
                    
                    if post_amount < pre_amount:
                        # This is the sender
                        transfer_amount = pre_amount - post_amount
                        return transfer_amount
            
            return None
            
        except Exception as e:
            logger.error(f"Failed to extract USDC amount: {e}")
            return None
    
    async def calculate_slt_reward(self, usdc_amount: float) -> float:
        """
        Calculate SLT reward based on USDC transfer
        """
        return usdc_amount * AIRDROP_RATE
    
    async def validate_airdrop(
        self,
        recipient_address: str,
        amount: float,
        trigger_tx_signature: Optional[str] = None
    ) -> Tuple[bool, str]:
        """
        Validate airdrop request with idempotency, caps, and verification
        Returns: (is_valid, message)
        """
        try:
            # Idempotency check
            if trigger_tx_signature:
                if trigger_tx_signature in self.processed_signatures:
                    return False, "Transaction already processed (idempotency)"
            
            # Amount validation
            base_amount = int(amount * SLT_MULTIPLIER)
            
            if base_amount > SINGLE_AIRDROP_MAX:
                return False, f"Amount exceeds single airdrop limit ({SINGLE_AIRDROP_MAX / SLT_MULTIPLIER} SLT)"
            
            # Daily cap check
            today = datetime.utcnow().date().isoformat()
            user_key = f"{recipient_address}:{today}"
            
            daily_total = sum(self.airdrop_history.get(user_key, []))
            
            if daily_total + base_amount > DAILY_AIRDROP_CAP_PER_USER:
                remaining = (DAILY_AIRDROP_CAP_PER_USER - daily_total) / SLT_MULTIPLIER
                return False, f"Daily airdrop cap exceeded. Remaining: {remaining} SLT"
            
            # On-chain verification if trigger transaction provided
            if trigger_tx_signature:
                is_valid, tx_data = await self.verify_transaction_on_chain(trigger_tx_signature)
                if not is_valid:
                    return False, "Trigger transaction not found or invalid on-chain"
                
                # Verify USDC transfer in transaction
                usdc_amount = await self.get_usdc_transfer_amount(tx_data)
                if not usdc_amount or usdc_amount <= 0:
                    return False, "No valid USDC transfer found in transaction"
                
                # Verify reward calculation
                expected_reward = await self.calculate_slt_reward(usdc_amount)
                if abs(amount - expected_reward) > 0.001:  # Allow small floating point difference
                    return False, f"Reward amount mismatch. Expected: {expected_reward}, Got: {amount}"
            
            return True, "Airdrop validated successfully"
            
        except Exception as e:
            logger.error(f"Failed to validate airdrop: {e}")
            return False, str(e)
    
    async def record_airdrop(
        self,
        recipient_address: str,
        amount: float,
        trigger_tx_signature: Optional[str] = None
    ) -> bool:
        """
        Record an airdrop in the tracking system
        """
        try:
            base_amount = int(amount * SLT_MULTIPLIER)
            
            # Update tracking
            if trigger_tx_signature:
                self.processed_signatures.add(trigger_tx_signature)
            
            today = datetime.utcnow().date().isoformat()
            user_key = f"{recipient_address}:{today}"
            
            if user_key not in self.airdrop_history:
                self.airdrop_history[user_key] = []
            
            self.airdrop_history[user_key].append(base_amount)
            
            logger.info(
                f"Recorded airdrop: {amount} SLT to {recipient_address} "
                f"(trigger: {trigger_tx_signature or 'manual'})"
            )
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to record airdrop: {e}")
            return False
    
    def verify_webhook_signature(self, payload: bytes, signature: str) -> bool:
        """
        Verify Helius webhook signature using HMAC
        """
        if not self.webhook_secret:
            logger.warning("Webhook secret not configured")
            return False
        
        try:
            expected_signature = hmac.new(
                self.webhook_secret.encode(),
                payload,
                hashlib.sha256
            ).hexdigest()
            
            return hmac.compare_digest(expected_signature, signature)
            
        except Exception as e:
            logger.error(f"Failed to verify webhook signature: {e}")
            return False
    
    async def get_transaction_details(self, signature: str) -> Optional[Dict[str, Any]]:
        """
        Get detailed transaction information
        """
        try:
            result = await self._rpc_call(
                "getTransaction",
                [
                    signature,
                    {
                        "encoding": "jsonParsed",
                        "maxSupportedTransactionVersion": 0
                    }
                ]
            )
            
            return result
            
        except Exception as e:
            logger.error(f"Failed to get transaction details: {e}")
            return None
    
    async def get_recent_airdrop_stats(self, address: str) -> Dict[str, Any]:
        """
        Get airdrop statistics for an address
        """
        today = datetime.utcnow().date().isoformat()
        user_key = f"{address}:{today}"
        
        daily_total = sum(self.airdrop_history.get(user_key, []))
        
        return {
            "address": address,
            "date": today,
            "total_received_today": daily_total / SLT_MULTIPLIER,
            "remaining_today": (DAILY_AIRDROP_CAP_PER_USER - daily_total) / SLT_MULTIPLIER,
            "cap_per_day": DAILY_AIRDROP_CAP_PER_USER / SLT_MULTIPLIER,
            "max_per_transaction": SINGLE_AIRDROP_MAX / SLT_MULTIPLIER
        }
    
    async def close(self):
        """Close the HTTP client connection"""
        await self.client.aclose()


# Global instance
solana_service = SolanaService()
