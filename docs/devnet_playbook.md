# Devnet API Playbook

Playbook de `curl` para QA de endpoints Solana Devnet.

---

## 🔐 Webhook Signature Testing

### Test 1: Body-only signature (hex)

```bash
# Generate signature
PAYLOAD='{"test":"data","amount":123}'
SECRET="test_secret_key_change_in_production"
SIG=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$SECRET" | awk '{print $2}')

curl -X POST http://localhost:8001/api/devnet/webhook/helius \
  -H "Content-Type: application/json" \
  -H "X-Helius-Signature: $SIG" \
  -H "X-Helius-Event-Id: evt_$(date +%s)" \
  -H "X-Helius-Timestamp: $(date +%s)" \
  -d "$PAYLOAD"

# Expected: {"ok":true,"mode":"body:hex","event_id":"evt_..."}
```

### Test 2: Timestamp-prefixed signature (ts+hex)

```bash
PAYLOAD='{"test":"data2"}'
TS=$(date +%s)
SECRET="test_secret_key_change_in_production"

# Create message: timestamp.payload
MSG="${TS}.${PAYLOAD}"
SIG=$(echo -n "$MSG" | openssl dgst -sha256 -hmac "$SECRET" | awk '{print $2}')

curl -X POST http://localhost:8001/api/devnet/webhook/helius \
  -H "Content-Type: application/json" \
  -H "X-Helius-Signature: $SIG" \
  -H "X-Helius-Event-Id: evt_ts_$(date +%s)" \
  -H "X-Helius-Timestamp: $TS" \
  -d "$PAYLOAD"

# Expected: {"ok":true,"mode":"ts+hex","event_id":"evt_ts_..."}
```

### Test 3: Full event signature (id+ts+hex)

```bash
PAYLOAD='{"test":"full"}'
TS=$(date +%s)
EID="evt_full_123"
SECRET="test_secret_key_change_in_production"

# Create message: event_id.timestamp.payload
MSG="${EID}.${TS}.${PAYLOAD}"
SIG=$(echo -n "$MSG" | openssl dgst -sha256 -hmac "$SECRET" | awk '{print $2}')

curl -X POST http://localhost:8001/api/devnet/webhook/helius \
  -H "Content-Type: application/json" \
  -H "X-Helius-Signature: $SIG" \
  -H "X-Helius-Event-Id: $EID" \
  -H "X-Helius-Timestamp: $TS" \
  -d "$PAYLOAD"

# Expected: {"ok":true,"mode":"id+ts+hex","event_id":"evt_full_123"}
```

### Test 4: Replay attack (should fail)

```bash
# Repeat Test 3 with same event_id
curl -X POST http://localhost:8001/api/devnet/webhook/helius \
  -H "Content-Type: application/json" \
  -H "X-Helius-Signature: $SIG" \
  -H "X-Helius-Event-Id: $EID" \
  -H "X-Helius-Timestamp: $TS" \
  -d "$PAYLOAD"

# Expected: HTTP 409 - {"detail":"Replay attack detected"}
```

### Test 5: Invalid signature (should fail)

```bash
curl -X POST http://localhost:8001/api/devnet/webhook/helius \
  -H "Content-Type: application/json" \
  -H "X-Helius-Signature: invalid_signature_12345" \
  -H "X-Helius-Event-Id: evt_invalid" \
  -H "X-Helius-Timestamp: $(date +%s)" \
  -d '{"test":"invalid"}'

# Expected: HTTP 401 - {"detail":"invalid signature"}
```

---

## 💰 Balance Query

```bash
# Query SOL, SLT, USDC balances
curl http://localhost:8001/api/devnet/balance/11111111111111111111111111111111 | jq

# Expected:
# {
#   "address": "11111111111111111111111111111111",
#   "sol_balance": 0.000000001,
#   "slt_balance": 0.0,
#   "usdc_balance": 0.0,
#   "timestamp": "2025-11-04T..."
# }
```

---

## ✅ Verify Transaction + Reward Calculation

```bash
# Verify a USDC-MOCK transaction and calculate SLT reward
curl -X POST http://localhost:8001/api/devnet/verify-transaction \
  -H "Content-Type: application/json" \
  -d '{"signature":"<valid_tx_signature>"}' | jq

# Expected (if USDC transfer detected):
# {
#   "signature": "<signature>",
#   "valid": true,
#   "rewardedSLT": 0.5,  # 0.1 SLT per USDC
#   "usdcAmount": 5.0,
#   "data": {...}
# }
```

---

## 🎁 SLT Airdrop with Limits

### Test MAX_SLT_PER_TX (10 SLT)

```bash
# Should succeed
curl -X POST http://localhost:8001/api/devnet/airdrop-slt \
  -H "Content-Type: application/json" \
  -d '{"recipient_address":"test_user_1","amount":9.0}' | jq

# Should fail (exceeds limit)
curl -X POST http://localhost:8001/api/devnet/airdrop-slt \
  -H "Content-Type: application/json" \
  -d '{"recipient_address":"test_user_1","amount":11.0}' | jq

# Expected: {"success":false,"message":"Amount exceeds MAX_SLT_PER_TX (10.0 SLT)",...}
```

### Test USER_DAILY_SLT_CAP (100 SLT)

```bash
# Request 10 SLT ten times (total 100 SLT)
for i in {1..10}; do
  curl -s -X POST http://localhost:8001/api/devnet/airdrop-slt \
    -H "Content-Type: application/json" \
    -d '{"recipient_address":"daily_test_user","amount":10.0}' | jq -r '.message'
done

# 11th request should fail
curl -X POST http://localhost:8001/api/devnet/airdrop-slt \
  -H "Content-Type: application/json" \
  -d '{"recipient_address":"daily_test_user","amount":10.0}' | jq

# Expected: {"success":false,"message":"USER_DAILY_SLT_CAP exceeded. Remaining: 0.0 SLT",...}
```

### Test Idempotency

```bash
# First request with signature
curl -X POST http://localhost:8001/api/devnet/airdrop-slt \
  -H "Content-Type: application/json" \
  -d '{
    "recipient_address":"test_user_2",
    "amount":5.0,
    "trigger_tx_signature":"unique_tx_sig_123"
  }' | jq

# Second request with same signature (should be rejected if tx valid on-chain)
curl -X POST http://localhost:8001/api/devnet/airdrop-slt \
  -H "Content-Type: application/json" \
  -d '{
    "recipient_address":"test_user_2",
    "amount":5.0,
    "trigger_tx_signature":"unique_tx_sig_123"
  }' | jq

# Expected: {"success":false,"message":"Transaction already processed (idempotency)",...}
# OR "Trigger transaction not found or invalid on-chain" if not on blockchain
```

---

## 📊 Airdrop Stats

```bash
curl http://localhost:8001/api/devnet/airdrop-stats/daily_test_user | jq

# Expected:
# {
#   "address": "daily_test_user",
#   "date": "2025-11-04",
#   "total_received_today": 100.0,
#   "remaining_today": 0.0,
#   "cap_per_day": 100.0,
#   "max_per_transaction": 10.0
# }
```

---

## 🏥 Health Check

```bash
curl http://localhost:8001/api/health | jq

# Expected:
# {
#   "status": "healthy",
#   "timestamp": "2025-11-04T...",
#   "service": "SUÉLTALO Crypto Wallet API"
# }
```

---

## 🔧 Expected Headers for Helius Webhook

| Header | Description | Required |
|--------|-------------|----------|
| `X-Helius-Signature` | HMAC SHA-256 signature (hex or base64) | Yes |
| `X-Helius-Event-Id` | Unique event identifier | Recommended |
| `X-Helius-Timestamp` | Unix timestamp | Recommended |

**Signature Modes Supported:**
1. `body:hex` - HMAC(secret, body)
2. `body:b64` - Base64(HMAC(secret, body))
3. `ts+hex` - HMAC(secret, timestamp + "." + body)
4. `ts+b64` - Base64(HMAC(secret, timestamp + "." + body))
5. `id+ts+hex` - HMAC(secret, event_id + "." + timestamp + "." + body)
6. `id+ts+b64` - Base64(HMAC(secret, event_id + "." + timestamp + "." + body))

**Response:**
```json
{
  "ok": true,
  "mode": "<detected_mode>",
  "event_id": "<event_id>"
}
```

---

## 📝 Notes

- All caps (MAX_SLT_PER_TX, USER_DAILY_SLT_CAP, GLOBAL_DAILY_SLT_CAP) are enforced server-side
- Timestamp window for webhooks: 5 minutes (300 seconds)
- Idempotency is guaranteed by `trigger_tx_signature` or `event_id`
- Replay attacks are detected and rejected with HTTP 409
