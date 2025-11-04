# SUÉLTALO MVP Fase 1 - Checklist de Verificación

Checklist ejecutable para validar el cumplimiento del Protocolo MVP Fase 1.

---

## 📋 Definition of Done (DoD)

### ✅ 1. App Móvil Funcionando

- [ ] **App corre en Expo Go (iOS)**
  - Instalar Expo Go desde App Store
  - Escanear QR code
  - App carga sin crashes
  
- [ ] **App corre en Expo Go (Android)**
  - Instalar Expo Go desde Play Store
  - Escanear QR code
  - App carga sin crashes

**Verificación:**
```bash
cd frontend
expo start
# Escanear QR desde dispositivo
```

**Criterio:** App visible en dispositivo, splash screen → onboarding.

---

### ✅ 2. Wallet: Crear/Importar + Faucet

- [ ] **Crear wallet desde scratch**
  - Botón "Crear Wallet" funcional
  - Seed phrase generada (12/24 palabras)
  - Wallet address visible
  - Guardado en SecureStore/AsyncStorage

- [ ] **Importar wallet existente**
  - Botón "Importar Wallet"
  - Input de seed phrase
  - Wallet restaurada correctamente

- [ ] **Solicitar SOL de faucet**
  - Balance inicial = 0 SOL
  - Request airdrop (Devnet)
  - Balance > 0 después de airdrop

**Verificación:**
```bash
# Desde backend
curl "http://localhost:8001/api/devnet/balance/<wallet_address>"
# Expected: sol_balance > 0
```

**Criterio:** Wallet creada, balance SOL > 0.

---

### ✅ 3. Enviar SOL/SPL

- [ ] **Enviar SOL**
  - Input: destinatario, cantidad
  - Transaction firmada
  - Signature visible
  - Balance actualizado

- [ ] **Enviar USDC-MOCK**
  - Mint: configurado en backend
  - Transaction exitosa
  - Balance USDC decrementado

**Verificación:**
```bash
# Transaction signature obtenida
curl -X POST "http://localhost:8001/api/devnet/verify-transaction" \
  -H "Content-Type: application/json" \
  -d '{"signature":"<tx_signature>"}'

# Expected: {"valid": true, ...}
```

**Criterio:** Transaction confirmada on-chain, signature válida.

---

### ✅ 4. Verify-Transaction + Reward SLT

- [ ] **Enviar 1.5 USDC-MOCK**
  - Transaction completada
  - Signature guardada

- [ ] **Verify transaction**
  ```bash
  POST /api/devnet/verify-transaction
  {"signature": "<sig>"}
  ```
  - Response: `valid: true`
  - `usdcAmount: 1.5`
  - `rewardedSLT: 0.15` (0.1 por cada USDC)

- [ ] **Airdrop SLT ejecutado**
  ```bash
  POST /api/devnet/airdrop-slt
  {
    "recipient_address": "<addr>",
    "amount": 0.15,
    "trigger_tx_signature": "<sig>"
  }
  ```
  - Response: `success: true`
  - Balance SLT incrementado

**Verificación:**
```bash
curl "http://localhost:8001/api/devnet/balance/<address>"
# Expected: slt_balance = 0.15
```

**Criterio:** Reward SLT acreditado, balance visible.

---

### ✅ 5. Límites Anti-Abuso Activos

- [ ] **MAX_SLT_PER_TX (10 SLT)**
  ```bash
  POST /api/devnet/airdrop-slt
  {"recipient_address": "...", "amount": 15.0}
  ```
  - Response: `"exceeds MAX_SLT_PER_TX"`
  - Status: 200 (controlled error)

- [ ] **USER_DAILY_SLT_CAP (100 SLT)**
  - Hacer 10 requests de 10 SLT
  - Request #11 rechazada
  - Response: `"USER_DAILY_SLT_CAP exceeded"`

- [ ] **GLOBAL_DAILY_SLT_CAP (10,000 SLT)**
  - Verificar tracking global
  - Stats endpoint retorna totales

**Verificación:**
```bash
curl "http://localhost:8001/api/devnet/airdrop-stats/<address>"
# Expected: 
# {
#   "total_received_today": 100.0,
#   "remaining_today": 0.0,
#   "cap_per_day": 100.0
# }
```

**Criterio:** Todos los límites funcionan, mensajes claros.

---

### ✅ 6. Webhook HMAC + Replay Protection

- [ ] **Firma HMAC válida (body)**
  ```bash
  PAYLOAD='{"test":"data"}'
  SIG=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "test_secret_key_change_in_production" | awk '{print $2}')
  
  curl -X POST "http://localhost:8001/api/devnet/webhook/helius" \
    -H "Content-Type: application/json" \
    -H "X-Helius-Signature: $SIG" \
    -H "X-Helius-Event-Id: evt_$(date +%s)" \
    -H "X-Helius-Timestamp: $(date +%s)" \
    -d "$PAYLOAD"
  ```
  - Response: `{"ok": true, "mode": "body:hex"}`
  - Status: 200

- [ ] **Replay attack bloqueado**
  - Repetir request con mismo event_id
  - Response: `{"detail": "Replay attack detected"}`
  - Status: 409

- [ ] **Firma inválida rechazada**
  - Signature incorrecta
  - Status: 401

**Verificación:**
```bash
# Ver tests/test_webhook_sig.py
python3 tests/test_webhook_sig.py
# Expected: All tests passed!
```

**Criterio:** Webhook seguro, idempotente, replay-protected.

---

### ✅ 7. Branding SUÉLTALO Aplicado

- [ ] **Icon (1024x1024)**
  - `/frontend/assets/brand/icon-1024.png`
  - Visible en app.json
  - Aparece en launcher

- [ ] **Splash Screen (2732x2732)**
  - `/frontend/assets/brand/splash-2732.png`
  - Safe zone 1200x1200
  - Aparece al abrir app

- [ ] **Adaptive Icons (Android)**
  - Foreground: `/frontend/assets/brand/adaptive-icon-foreground.png`
  - Background: `/frontend/assets/brand/adaptive-icon-background.png`
  - Configurado en app.json

- [ ] **OG Image (Web - opcional)**
  - 1200x630
  - Para social sharing

**Verificación:**
```bash
ls -lh /app/frontend/assets/brand/
# Expected:
# icon-1024.png
# splash-2732.png
# adaptive-icon-foreground.png
# adaptive-icon-background.png
```

**Criterio:** Todos los assets presentes, app con branding SUÉLTALO.

---

### ✅ 8. QA Playbook Completo

- [ ] **Escenario 1: First-time user**
  - Crear wallet → SOL faucet → balance > 0
  - ✅ PASS

- [ ] **Escenario 2: Enviar SOL**
  - Enviar 0.001 SOL → signature visible
  - ✅ PASS

- [ ] **Escenario 3: USDC → SLT Reward**
  - Enviar 1.5 USDC → verify → reward 0.15 SLT
  - ✅ PASS

- [ ] **Escenario 4: Límites**
  - >10 SLT → bloqueado
  - 100 SLT/día → bloqueado
  - ✅ PASS

- [ ] **Escenario 5: Webhook**
  - Firma válida → 200 OK
  - Replay → 409 Conflict
  - ✅ PASS

- [ ] **Escenario 6: KYC Mock (opcional)**
  - Start KYC → pending
  - 1 min → under_review
  - 5 min → approved
  - ✅ PASS

- [ ] **Escenario 7: Biometría/PIN (pendiente)**
  - Lock al volver de background
  - ⏳ TODO

**Verificación:**
```bash
# Ejecutar playbook completo
bash scripts/qa-playbook.sh
```

**Criterio:** Todos los escenarios PASS.

---

### ✅ 9. CI Backend Tests en Verde

- [ ] **Webhook signature tests**
  ```bash
  cd /app
  python3 tests/test_webhook_sig.py
  ```
  - Expected: `🎉 All tests passed!`

- [ ] **Health check test**
  ```bash
  curl http://localhost:8001/api/health
  ```
  - Expected: `{"status":"healthy"}`

- [ ] **Endpoints tests**
  - Balance: ✅
  - Verify-transaction: ✅
  - Airdrop-slt: ✅
  - Webhook: ✅

**Verificación:**
```bash
# CI workflow (GitHub Actions)
pytest tests/ -v
# O local:
cd backend
pytest
```

**Criterio:** CI en verde, 0 tests fallidos.

---

## 📊 Resumen de Estado

### Backend ✅
- [x] Dockerfile aislado
- [x] Solana service inicializado
- [x] 6 endpoints funcionando
- [x] Webhook HMAC + replay protection
- [x] Límites anti-abuso activos
- [x] Tests pasando

### Frontend ⏳
- [x] Assets de branding
- [x] app.json configurado
- [ ] Wallet create/import (mock actual)
- [ ] Enviar SOL/SPL (mock actual)
- [ ] Rewards UI
- [ ] PIN/Biometría

### Blockchain ✅
- [x] SLT token configurado (simulated)
- [x] USDC-MOCK configurado (simulated)
- [x] Treasury wallet
- [ ] Tokens creados en Devnet real (pending)

---

## 🎯 Próximas Acciones

### Prioritarias (P0):
1. [ ] **Frontend: Integrar @solana/web3.js real**
   - sendSOL, sendSPL con transacciones reales
   - Conectar a backend /api/devnet/*

2. [ ] **Crear tokens reales en Devnet**
   - Ejecutar `scripts/create_mints.ts` con RPC real
   - Actualizar .env con mints reales

3. [ ] **Testing E2E**
   - Flujo completo: create wallet → airdrop SOL → send USDC → reward SLT
   - Verificar en Solana Explorer

### Siguientes (P1):
4. [ ] **PIN/Biometría**
   - Implementar lock screen
   - Timeout 2 min

5. [ ] **KYC Mock UI**
   - Pantalla KYC con estados
   - Integrar con backend

6. [ ] **Deploy a Emergent**
   - Context: app/backend
   - Variables de entorno configuradas

---

## ✅ Criterio Final de Aceptación

**El MVP Fase 1 está COMPLETO cuando:**

✅ Todos los checkboxes arriba marcados  
✅ App funciona end-to-end en dispositivo real  
✅ Rewards SLT funcionando on-chain  
✅ CI en verde  
✅ Branding aplicado  
✅ QA Playbook 100% PASS  

**Fecha objetivo DoD:** TBD  
**Versión:** 0.1.0
