"""
Solana Devnet Integration Service
Handles wallet management, token operations, and blockchain interactions
Uses HTTP RPC API for maximum compatibility
"""

import httpx
import base58
import asyncio
import json
from typing import Optional, Dict, Any, Tuple, List
from datetime import datetime, timedelta
import logging
import os
from pathlib import Path
import hashlib
import hmac

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
        self.mint_address = Pubkey.from_string(mint_address)
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
    """
    
    def __init__(self, rpc_url: str = "https://api.devnet.solana.com"):
        self.rpc_url = rpc_url
        self.client = AsyncClient(rpc_url, commitment=Confirmed)
        self.treasury_keypair: Optional[Keypair] = None
        self.slt_mint: Optional[Pubkey] = None
        self.usdc_mock_mint: Optional[Pubkey] = None
        self.slt_adapter: Optional[TokenAdapter] = None
        self.usdc_adapter: Optional[TokenAdapter] = None
        
        # Airdrop tracking (in production, use Redis)
        self.airdrop_history: Dict[str, list] = {}
        self.processed_signatures: set = set()
    
    async def initialize(self, treasury_private_key: Optional[str] = None):
        """
        Initialize the service with treasury wallet and token mints
        """
        try:
            # Load or create treasury keypair
            if treasury_private_key:
                # Load from private key (base58 encoded)
                private_key_bytes = base58.b58decode(treasury_private_key)
                self.treasury_keypair = Keypair.from_bytes(private_key_bytes)
            else:
                # Generate new treasury keypair
                self.treasury_keypair = Keypair()
                logger.warning(
                    f"Generated new treasury keypair: {self.treasury_keypair.pubkey()}"
                )
                logger.warning(
                    f"Private key (save this!): {base58.b58encode(bytes(self.treasury_keypair)).decode()}"
                )
            
            logger.info(f"Treasury wallet: {self.treasury_keypair.pubkey()}")
            
            # Check treasury balance
            balance = await self.get_sol_balance(str(self.treasury_keypair.pubkey()))
            logger.info(f"Treasury balance: {balance} SOL")
            
            if balance < 1.0:
                logger.warning("Treasury balance low. Consider requesting airdrop.")
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to initialize Solana service: {e}")
            raise
    
    async def create_slt_token(self) -> str:
        """
        Create SLT token with 6 decimals
        Treasury wallet has mint and freeze authority
        """
        try:
            from spl.token.instructions import initialize_mint, InitializeMintParams
            from solders.system_program import create_account, CreateAccountParams
            
            # Create mint account
            mint_keypair = Keypair()
            
            # Calculate rent
            from spl.token._layouts import MINT_LAYOUT
            mint_space = MINT_LAYOUT.sizeof()
            
            rent_response = await self.client.get_minimum_balance_for_rent_exemption(mint_space)
            lamports = rent_response.value
            
            # Create account for mint
            create_account_ix = create_account(
                CreateAccountParams(
                    from_pubkey=self.treasury_keypair.pubkey(),
                    to_pubkey=mint_keypair.pubkey(),
                    lamports=lamports,
                    space=mint_space,
                    owner=TOKEN_PROGRAM_ID,
                )
            )
            
            # Initialize mint
            init_mint_ix = initialize_mint(
                InitializeMintParams(
                    program_id=TOKEN_PROGRAM_ID,
                    mint=mint_keypair.pubkey(),
                    decimals=SLT_DECIMALS,
                    mint_authority=self.treasury_keypair.pubkey(),
                    freeze_authority=self.treasury_keypair.pubkey(),
                )
            )
            
            # Build and send transaction
            recent_blockhash = (await self.client.get_latest_blockhash()).value.blockhash
            
            transaction = Transaction()
            transaction.recent_blockhash = recent_blockhash
            transaction.fee_payer = self.treasury_keypair.pubkey()
            transaction.add(create_account_ix)
            transaction.add(init_mint_ix)
            
            # Sign with both keypairs
            transaction.sign(self.treasury_keypair, mint_keypair)
            
            # Send transaction
            response = await self.client.send_transaction(transaction)
            signature = response.value
            
            # Confirm transaction
            await self.client.confirm_transaction(signature)
            
            self.slt_mint = mint_keypair.pubkey()
            self.slt_adapter = TokenAdapter(str(self.slt_mint), SLT_DECIMALS, is_mock=False)
            
            logger.info(f"SLT token created: {self.slt_mint}")
            logger.info(f"Transaction signature: {signature}")
            
            return str(self.slt_mint)
            
        except Exception as e:
            logger.error(f"Failed to create SLT token: {e}")
            raise
    
    async def create_usdc_mock_token(self) -> str:
        """
        Create USDC-MOCK token with 6 decimals
        """
        try:
            from spl.token.instructions import initialize_mint, InitializeMintParams
            from solders.system_program import create_account, CreateAccountParams
            
            mint_keypair = Keypair()
            
            from spl.token._layouts import MINT_LAYOUT
            mint_space = MINT_LAYOUT.sizeof()
            
            rent_response = await self.client.get_minimum_balance_for_rent_exemption(mint_space)
            lamports = rent_response.value
            
            create_account_ix = create_account(
                CreateAccountParams(
                    from_pubkey=self.treasury_keypair.pubkey(),
                    to_pubkey=mint_keypair.pubkey(),
                    lamports=lamports,
                    space=mint_space,
                    owner=TOKEN_PROGRAM_ID,
                )
            )
            
            init_mint_ix = initialize_mint(
                InitializeMintParams(
                    program_id=TOKEN_PROGRAM_ID,
                    mint=mint_keypair.pubkey(),
                    decimals=USDC_DECIMALS,
                    mint_authority=self.treasury_keypair.pubkey(),
                    freeze_authority=self.treasury_keypair.pubkey(),
                )
            )
            
            recent_blockhash = (await self.client.get_latest_blockhash()).value.blockhash
            
            transaction = Transaction()
            transaction.recent_blockhash = recent_blockhash
            transaction.fee_payer = self.treasury_keypair.pubkey()
            transaction.add(create_account_ix)
            transaction.add(init_mint_ix)
            
            transaction.sign(self.treasury_keypair, mint_keypair)
            
            response = await self.client.send_transaction(transaction)
            signature = response.value
            
            await self.client.confirm_transaction(signature)
            
            self.usdc_mock_mint = mint_keypair.pubkey()
            self.usdc_adapter = TokenAdapter(str(self.usdc_mock_mint), USDC_DECIMALS, is_mock=True)
            
            logger.info(f"USDC-MOCK token created: {self.usdc_mock_mint}")
            logger.info(f"Transaction signature: {signature}")
            
            return str(self.usdc_mock_mint)
            
        except Exception as e:
            logger.error(f"Failed to create USDC-MOCK token: {e}")
            raise
    
    async def get_sol_balance(self, address: str) -> float:
        """Get SOL balance for an address"""
        try:
            pubkey = Pubkey.from_string(address)
            response = await self.client.get_balance(pubkey)
            lamports = response.value
            return lamports / LAMPORTS_PER_SOL
        except Exception as e:
            logger.error(f"Failed to get SOL balance: {e}")
            return 0.0
    
    async def get_token_balance(self, owner_address: str, mint_address: str) -> float:
        """Get SPL token balance for an address"""
        try:
            owner_pubkey = Pubkey.from_string(owner_address)
            mint_pubkey = Pubkey.from_string(mint_address)
            
            # Get associated token address
            ata = get_associated_token_address(owner_pubkey, mint_pubkey)
            
            # Get token account balance
            response = await self.client.get_token_account_balance(ata)
            
            if response.value:
                amount = int(response.value.amount)
                decimals = response.value.decimals
                return amount / (10 ** decimals)
            else:
                return 0.0
                
        except Exception as e:
            logger.debug(f"No token account found or error: {e}")
            return 0.0
    
    async def send_sol(
        self, 
        from_keypair_bytes: bytes, 
        to_address: str, 
        amount: float
    ) -> Tuple[bool, str]:
        """
        Send SOL from one address to another
        """
        try:
            from_keypair = Keypair.from_bytes(from_keypair_bytes)
            to_pubkey = Pubkey.from_string(to_address)
            
            lamports = int(amount * LAMPORTS_PER_SOL)
            
            # Create transfer instruction
            transfer_ix = transfer(
                TransferParams(
                    from_pubkey=from_keypair.pubkey(),
                    to_pubkey=to_pubkey,
                    lamports=lamports,
                )
            )
            
            # Build transaction
            recent_blockhash = (await self.client.get_latest_blockhash()).value.blockhash
            
            transaction = Transaction()
            transaction.recent_blockhash = recent_blockhash
            transaction.fee_payer = from_keypair.pubkey()
            transaction.add(transfer_ix)
            
            # Sign transaction
            transaction.sign(from_keypair)
            
            # Send transaction
            response = await self.client.send_transaction(transaction)
            signature = response.value
            
            # Confirm transaction
            await self.client.confirm_transaction(signature)
            
            logger.info(f"SOL transfer successful: {signature}")
            return True, str(signature)
            
        except Exception as e:
            logger.error(f"Failed to send SOL: {e}")
            return False, str(e)
    
    async def send_spl_token(
        self,
        from_keypair_bytes: bytes,
        to_address: str,
        mint_address: str,
        amount: float,
        decimals: int = 6
    ) -> Tuple[bool, str]:
        """
        Send SPL token from one address to another
        """
        try:
            from_keypair = Keypair.from_bytes(from_keypair_bytes)
            to_pubkey = Pubkey.from_string(to_address)
            mint_pubkey = Pubkey.from_string(mint_address)
            
            # Get associated token addresses
            from_ata = get_associated_token_address(from_keypair.pubkey(), mint_pubkey)
            to_ata = get_associated_token_address(to_pubkey, mint_pubkey)
            
            # Check if destination ATA exists, create if not
            to_account_info = await self.client.get_account_info(to_ata)
            
            instructions = []
            
            if not to_account_info.value:
                # Create destination ATA
                create_ata_ix = create_associated_token_account(
                    payer=from_keypair.pubkey(),
                    owner=to_pubkey,
                    mint=mint_pubkey,
                )
                instructions.append(create_ata_ix)
            
            # Transfer tokens
            base_amount = int(amount * (10 ** decimals))
            
            transfer_ix = spl_transfer(
                SPLTransferParams(
                    program_id=TOKEN_PROGRAM_ID,
                    source=from_ata,
                    dest=to_ata,
                    owner=from_keypair.pubkey(),
                    amount=base_amount,
                )
            )
            instructions.append(transfer_ix)
            
            # Build transaction
            recent_blockhash = (await self.client.get_latest_blockhash()).value.blockhash
            
            transaction = Transaction()
            transaction.recent_blockhash = recent_blockhash
            transaction.fee_payer = from_keypair.pubkey()
            
            for ix in instructions:
                transaction.add(ix)
            
            # Sign transaction
            transaction.sign(from_keypair)
            
            # Send transaction
            response = await self.client.send_transaction(transaction)
            signature = response.value
            
            # Confirm transaction
            await self.client.confirm_transaction(signature)
            
            logger.info(f"SPL token transfer successful: {signature}")
            return True, str(signature)
            
        except Exception as e:
            logger.error(f"Failed to send SPL token: {e}")
            return False, str(e)
    
    async def airdrop_slt(
        self,
        recipient_address: str,
        amount: float,
        trigger_tx_signature: Optional[str] = None
    ) -> Tuple[bool, str, Optional[str]]:
        """
        Airdrop SLT tokens with idempotency, caps, and on-chain verification
        
        Returns: (success, message, transaction_signature)
        """
        try:
            if not self.slt_mint:
                return False, "SLT token not initialized", None
            
            # Idempotency check
            if trigger_tx_signature:
                if trigger_tx_signature in self.processed_signatures:
                    return False, "Transaction already processed (idempotency)", None
            
            # Amount validation
            base_amount = int(amount * SLT_MULTIPLIER)
            
            if base_amount > SINGLE_AIRDROP_MAX:
                return False, f"Amount exceeds single airdrop limit ({SINGLE_AIRDROP_MAX / SLT_MULTIPLIER} SLT)", None
            
            # Daily cap check
            today = datetime.utcnow().date().isoformat()
            user_key = f"{recipient_address}:{today}"
            
            daily_total = sum(self.airdrop_history.get(user_key, []))
            
            if daily_total + base_amount > DAILY_AIRDROP_CAP_PER_USER:
                remaining = (DAILY_AIRDROP_CAP_PER_USER - daily_total) / SLT_MULTIPLIER
                return False, f"Daily airdrop cap exceeded. Remaining: {remaining} SLT", None
            
            # On-chain verification if trigger transaction provided
            if trigger_tx_signature:
                is_valid = await self.verify_transaction_on_chain(trigger_tx_signature)
                if not is_valid:
                    return False, "Trigger transaction not found or invalid on-chain", None
            
            # Perform airdrop
            recipient_pubkey = Pubkey.from_string(recipient_address)
            
            # Get or create recipient's ATA
            recipient_ata = get_associated_token_address(recipient_pubkey, self.slt_mint)
            
            # Check if ATA exists
            ata_info = await self.client.get_account_info(recipient_ata)
            
            instructions = []
            
            if not ata_info.value:
                # Create ATA
                create_ata_ix = create_associated_token_account(
                    payer=self.treasury_keypair.pubkey(),
                    owner=recipient_pubkey,
                    mint=self.slt_mint,
                )
                instructions.append(create_ata_ix)
            
            # Mint tokens to recipient
            mint_ix = mint_to(
                MintToParams(
                    program_id=TOKEN_PROGRAM_ID,
                    mint=self.slt_mint,
                    dest=recipient_ata,
                    mint_authority=self.treasury_keypair.pubkey(),
                    amount=base_amount,
                )
            )
            instructions.append(mint_ix)
            
            # Build and send transaction
            recent_blockhash = (await self.client.get_latest_blockhash()).value.blockhash
            
            transaction = Transaction()
            transaction.recent_blockhash = recent_blockhash
            transaction.fee_payer = self.treasury_keypair.pubkey()
            
            for ix in instructions:
                transaction.add(ix)
            
            transaction.sign(self.treasury_keypair)
            
            response = await self.client.send_transaction(transaction)
            signature = response.value
            
            await self.client.confirm_transaction(signature)
            
            # Update tracking
            if trigger_tx_signature:
                self.processed_signatures.add(trigger_tx_signature)
            
            if user_key not in self.airdrop_history:
                self.airdrop_history[user_key] = []
            self.airdrop_history[user_key].append(base_amount)
            
            logger.info(f"SLT airdrop successful: {amount} SLT to {recipient_address}")
            logger.info(f"Transaction signature: {signature}")
            
            return True, f"Airdropped {amount} SLT successfully", str(signature)
            
        except Exception as e:
            logger.error(f"Failed to airdrop SLT: {e}")
            return False, str(e), None
    
    async def verify_transaction_on_chain(self, signature: str) -> bool:
        """
        Verify that a transaction exists and is confirmed on-chain
        """
        try:
            response = await self.client.get_transaction(
                signature,
                encoding="json",
                max_supported_transaction_version=0
            )
            
            if response.value is None:
                logger.warning(f"Transaction not found: {signature}")
                return False
            
            # Check if transaction was successful
            if response.value.meta and response.value.meta.err:
                logger.warning(f"Transaction failed: {signature}")
                return False
            
            logger.info(f"Transaction verified on-chain: {signature}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to verify transaction: {e}")
            return False
    
    async def request_sol_airdrop(self, address: str, amount: float = 1.0) -> Tuple[bool, str]:
        """
        Request SOL airdrop from Devnet faucet
        """
        try:
            pubkey = Pubkey.from_string(address)
            lamports = int(amount * LAMPORTS_PER_SOL)
            
            response = await self.client.request_airdrop(pubkey, lamports)
            signature = response.value
            
            # Wait for confirmation
            await self.client.confirm_transaction(signature)
            
            logger.info(f"SOL airdrop successful: {amount} SOL to {address}")
            return True, str(signature)
            
        except Exception as e:
            logger.error(f"Failed to request SOL airdrop: {e}")
            return False, str(e)
    
    async def get_transaction_details(self, signature: str) -> Optional[Dict[str, Any]]:
        """
        Get detailed transaction information
        """
        try:
            response = await self.client.get_transaction(
                signature,
                encoding="jsonParsed",
                max_supported_transaction_version=0
            )
            
            if not response.value:
                return None
            
            tx = response.value
            
            return {
                "signature": signature,
                "slot": tx.slot,
                "block_time": tx.block_time,
                "meta": tx.meta,
                "transaction": tx.transaction,
            }
            
        except Exception as e:
            logger.error(f"Failed to get transaction details: {e}")
            return None
    
    async def close(self):
        """Close the RPC client connection"""
        await self.client.close()


# Global instance
solana_service = SolanaService()
