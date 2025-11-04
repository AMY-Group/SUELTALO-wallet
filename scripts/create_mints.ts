// scripts/create_mints.ts
import { Connection, Keypair, clusterApiUrl } from "@solana/web3.js";
import { createMint, getOrCreateAssociatedTokenAccount, mintTo } from "@solana/spl-token";
import * as fs from "fs";

(async () => {
  const conn = new Connection(clusterApiUrl("devnet"), "confirmed");
  
  // Load treasury keypair from file if exists, otherwise generate
  let treasury: Keypair;
  const treasuryPath = "./treasury-keypair.json";
  
  if (fs.existsSync(treasuryPath)) {
    const treasuryData = JSON.parse(fs.readFileSync(treasuryPath, "utf-8"));
    treasury = Keypair.fromSecretKey(Uint8Array.from(treasuryData));
    console.log("✅ Loaded existing treasury keypair");
  } else {
    treasury = Keypair.generate();
    fs.writeFileSync(treasuryPath, JSON.stringify(Array.from(treasury.secretKey)));
    console.log("✅ Generated new treasury keypair");
  }

  console.log("Treasury Public Key:", treasury.publicKey.toBase58());

  // Request airdrop for treasury
  console.log("\n⏳ Requesting SOL airdrop...");
  try {
    const airdropSig = await conn.requestAirdrop(treasury.publicKey, 2e9); // 2 SOL
    await conn.confirmTransaction(airdropSig);
    console.log("✅ Airdrop confirmed");
  } catch (e) {
    console.log("⚠️  Airdrop may have failed (rate limit), checking balance...");
  }

  const balance = await conn.getBalance(treasury.publicKey);
  console.log(`Treasury Balance: ${balance / 1e9} SOL`);

  if (balance < 0.1e9) {
    console.error("❌ Insufficient balance. Request airdrop from https://faucet.solana.com");
    process.exit(1);
  }

  // Create SLT token (6 decimals)
  console.log("\n⏳ Creating SLT token...");
  const sltMint = await createMint(
    conn,
    treasury,
    treasury.publicKey,
    treasury.publicKey, // freeze authority
    6 // decimals
  );
  console.log("✅ SLT_MINT:", sltMint.toBase58());

  // Create USDC-MOCK token (6 decimals)
  console.log("\n⏳ Creating USDC-MOCK token...");
  const usdcMock = await createMint(
    conn,
    treasury,
    treasury.publicKey,
    treasury.publicKey, // freeze authority
    6 // decimals
  );
  console.log("✅ USDC_MOCK_MINT:", usdcMock.toBase58());

  // Mint initial supply of SLT to treasury
  console.log("\n⏳ Minting initial SLT supply...");
  const sltAta = await getOrCreateAssociatedTokenAccount(
    conn,
    treasury,
    sltMint,
    treasury.publicKey
  );
  await mintTo(
    conn,
    treasury,
    sltMint,
    sltAta.address,
    treasury.publicKey,
    1_000_000_000_000n // 1 million SLT (6 decimals)
  );
  console.log("✅ Minted 1,000,000 SLT to treasury");

  // Mint initial supply of USDC-MOCK to treasury
  console.log("\n⏳ Minting initial USDC-MOCK supply...");
  const usdcAta = await getOrCreateAssociatedTokenAccount(
    conn,
    treasury,
    usdcMock,
    treasury.publicKey
  );
  await mintTo(
    conn,
    treasury,
    usdcMock,
    usdcAta.address,
    treasury.publicKey,
    100_000_000_000n // 100,000 USDC-MOCK (6 decimals)
  );
  console.log("✅ Minted 100,000 USDC-MOCK to treasury");

  console.log("\n" + "=".repeat(60));
  console.log("📋 COPY THESE VALUES TO backend/.env:");
  console.log("=".repeat(60));
  console.log(`SOLANA_TREASURY_PUBKEY="${treasury.publicKey.toBase58()}"`);
  console.log(`SOLANA_SLT_MINT="${sltMint.toBase58()}"`);
  console.log(`SOLANA_USDC_MOCK_MINT="${usdcMock.toBase58()}"`);
  console.log("=".repeat(60));

  console.log("\n✅ Setup complete! Update your .env file and restart the backend.");
})();
