# SUÉLTALO - Crypto Wallet LATAM

Billetera cripto móvil construida con Expo (React Native) + FastAPI + MongoDB + Solana Devnet.

---

## 🚀 Devnet Boot (PR-3)

### Crear tokens SLT y USDC-MOCK en Devnet

**Requisitos previos:**
```bash
cd scripts
npm install @solana/web3.js @solana/spl-token typescript ts-node
```

**Ejecutar script:**
```bash
npx ts-node create_mints.ts
```

**Salida esperada:**
```
✅ Generated new treasury keypair
Treasury Public Key: <pubkey>
⏳ Requesting SOL airdrop...
✅ Airdrop confirmed
Treasury Balance: 2 SOL
⏳ Creating SLT token...
✅ SLT_MINT: <slt_mint_address>
⏳ Creating USDC-MOCK token...
✅ USDC_MOCK_MINT: <usdc_mock_mint_address>
✅ Minted 1,000,000 SLT to treasury
✅ Minted 100,000 USDC-MOCK to treasury

============================================================
📋 COPY THESE VALUES TO backend/.env:
============================================================
SOLANA_TREASURY_PUBKEY="<pubkey>"
SOLANA_SLT_MINT="<slt_mint>"
SOLANA_USDC_MOCK_MINT="<usdc_mock_mint>"
============================================================
```

**Actualizar `.env`:**
```bash
cp backend/.env.example backend/.env
# Editar backend/.env con los valores generados
```

**Reiniciar backend:**
```bash
sudo supervisorctl restart backend
```

---

## 🔧 Variables de Entorno

### Backend (`backend/.env`)

```bash
# MongoDB
MONGO_URL="mongodb://localhost:27017"
DB_NAME="test_database"

# Solana Devnet (generar con create_mints.ts)
SOLANA_TREASURY_PUBKEY=""
SOLANA_SLT_MINT=""
SOLANA_USDC_MOCK_MINT=""

# Helius Webhook
HELIUS_WEBHOOK_SECRET="<secure_random_string>"
```

---

## 🧪 Testing

### Webhook Signature Tests (PR-2)
```bash
cd /app
python3 tests/test_webhook_sig.py
```

**Salida esperada:**
```
Running webhook signature tests...
✅ test_body_only_b64 PASSED (mode: body:b64)
✅ test_ts_prefix_hex PASSED (mode: ts+hex)
✅ test_invalid_sig PASSED
✅ test_event_id_ts_body PASSED (mode: id+ts+hex)
✅ test_padding_tolerance PASSED (mode: body:b64+pad)

🎉 All tests passed!
```

---

## 📡 API Endpoints

### Health Check
```bash
GET /api/health
```

### Devnet Endpoints
```bash
GET /api/devnet/balance/{address}
POST /api/devnet/airdrop-slt
POST /api/devnet/verify-transaction
POST /api/devnet/webhook/helius
GET /api/devnet/airdrop-stats/{address}
```

Ver documentación completa: `docs/devnet_playbook.md`

---

## 🏗️ Stack Tecnológico

**Frontend:**
- Expo SDK ~53.0
- React Native 0.79.5
- Solana Web3.js
- React Navigation

**Backend:**
- FastAPI 0.110.1
- Motor (MongoDB async driver)
- httpx (HTTP client)

**Blockchain:**
- Solana Devnet
- SPL Tokens (SLT, USDC-MOCK)

---

## 📝 License

MIT

