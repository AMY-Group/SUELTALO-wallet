import asyncio
from typing import Optional


class _SolanaService:
    def __init__(self) -> None:
        self.initialized = False
        self.treasury_pubkey: Optional[str] = None
        self.slt_mint: Optional[str] = None
        self.usdc_mock_mint: Optional[str] = None
        self.webhook_secret: Optional[str] = None

    async def initialize(
        self,
        treasury_pubkey: str,
        slt_mint: Optional[str] = None,
        usdc_mock_mint: Optional[str] = None,
        webhook_secret: Optional[str] = None,
    ) -> None:
        # In real implementation, we would create RPC clients, load mints, etc.
        await asyncio.sleep(0)  # allow context switch
        self.initialized = True
        self.treasury_pubkey = treasury_pubkey
        self.slt_mint = slt_mint
        self.usdc_mock_mint = usdc_mock_mint
        self.webhook_secret = webhook_secret

    async def close(self) -> None:
        await asyncio.sleep(0)
        self.initialized = False


solana_service = _SolanaService()
