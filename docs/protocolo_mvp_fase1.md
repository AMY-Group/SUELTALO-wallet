# Protocolo SUÉLTALO — MVP Fase 1

# 1) Objetivo del MVP (Fase 1)

Entregar una **wallet no-custodial** en **Solana Devnet** con:

* Creación/Importación de wallet.
* **Enviar/recibir SOL y SPL** (USDC-MOCK + SLT).
* **Rewards on-chain**: 0.1 **SLT** por cada 1 USDC enviado (validado on-chain).
* **KYC Mock** con estados y tiempos simulados.
* **Límites anti-abuso** (por tx, por usuario, global).
* **Branding SUÉLTALO** (icon, splash, OG) y UX mobile lista para demos.

Resultado: flujo de valor completo "pago → verificación → recompensa → balance".

---

# 2) Arquitectura (alto nivel)

**Frontend (Expo/React Native)**

* Expo Router, SecureStore, QR (recibir), envío SOL/SPL.
* Pantallas: onboarding, home (balances), send, receive, transactions, rewards, KYC.

**Backend (FastAPI + MongoDB)**

* Servicio Solana Devnet (RPC público).
* Airdrops SLT, verificación de transacciones USDC, rate-limits, idempotencia.
* Webhook Helius (HMAC) con replay-protection.

**Blockchain (Solana Devnet)**

* **SLT**: SPL token (decimals = 6); mint authority en tesorería backend.
* **USDC-MOCK**: SPL token (decimals = 6) para MVP.

**Infra / DevOps**

* Deploy backend (Docker + Kaniko) aislado del monorepo.
* CI (pytest) + Playbooks cURL; Expo CI para prebuild web (no bloquea Kaniko).

---

# 3) Módulos del Protocolo

## 3.1 Wallet & Onboarding

* **Create/Import** (seed local, no sale del dispositivo).
* SecureStore/AsyncStorage con **PIN/Biometría** (lock al volver a foreground).
* **Address Book** mínimo (opcional F1.1).

## 3.2 Core Payments

* **Enviar SOL** (transfer simple).
* **Enviar SPL** (mint configurable: USDC-MOCK, SLT).
* **Recibir**: dirección + **QR**, botón copiar.

## 3.3 Rewards Engine (SLT)

* **Regla**: por cada **USDC-MOCK** enviado y confirmado on-chain ⇒ **0.1 SLT**.
* **Cálculo**: on-chain parsing de la tx; idempotencia por `signature`.
* **Entrega**: **airdrop** desde tesorería → ATA del usuario.
* **Límites**:

  * `MAX_SLT_PER_TX = 10 SLT`
  * `USER_DAILY_SLT_CAP = 100 SLT`
  * `GLOBAL_DAILY_SLT_CAP = 10,000 SLT`

## 3.4 KYC Mock (para demos)

* Estados: `pending → under_review → approved`.
* Timers: `pending→review=1 min`, `review→approved=5 min`.
* Persistencia en MongoDB. (Producción: pluggable con proveedor KYC.)

## 3.5 Webhook & Firma

* Endpoint: `/api/devnet/webhook/helius`.
* Firma **HMAC SHA-256** (tolerante): `body`, `ts.body`, `id.ts.body`; hex/base64.
* **Window** 5 min + **replay** bloqueado por `event_id`.

## 3.6 Observabilidad

* Logs estructurados (ruta, ms, status, user/addr hash).
* Airdrop stats por address.
* Healthcheck `/api/health`.

---

# 4) APIs (contratos y ejemplos)

> Base URL de ejemplo: `https://<backend>/api`

### Health

* `GET /health` → `{ ok, env, rpc }`

### Balances

* `GET /devnet/balance/{address}`

```json
{ "address":"...", "sol_balance": 0.123, "slt_balance": 5.0, "usdc_balance": 12.5, "timestamp":"..." }
```

### Verify Transaction (USDC → Reward)

* `POST /devnet/verify-transaction`

```json
{ "signature": "5tR9...abc" }
```

**Resp:**

```json
{ "signature":"...", "valid":true, "usdcAmount":5.0, "rewardedSLT":0.5, "details":{...} }
```

### Airdrop SLT (controlado)

* `POST /devnet/airdrop-slt`

```json
{ "recipient_address":"9P9k...", "amount":5.0, "trigger_tx_signature":"5tR9...abc" }
```

**Errores estándar**: `exceeds MAX_SLT_PER_TX`, `USER_DAILY_SLT_CAP exceeded`, `GLOBAL_DAILY_SLT_CAP exceeded`, `idempotent: already processed`.

### Airdrop Stats (usuario)

* `GET /devnet/airdrop-stats/{address}`

```json
{ "address":"...", "today": 7.5, "lifetime": 52.3, "last": [{ "ts":"...", "amount":0.5, "tx":"..." }] }
```

### KYC Mock

* `POST /kyc/start` → `{ "request_id":"...", "status":"pending" }`
* `GET /kyc/status/{request_id}` → `{ "status":"under_review|approved" }`

### Webhook Helius

* `POST /devnet/webhook/helius` (headers: `X-Helius-Signature`, `X-Helius-Timestamp`, `X-Helius-Event-Id`)
  → `{ "ok": true, "mode": "ts+hex" }`

---

# 5) Datos (Esquemas mínimos)

**wallets**

```
{ _id, address, created_at, last_seen_at, kyc_status }
```

**transactions**

```
{ _id, signature, from, to, mint, amount, decimals, parsed, confirmed_at }
```

**airdrops**

```
{ _id, address, amount_slt, trigger_signature, created_at, day_key }
```

**kyc_records**

```
{ _id, user_ref, status, started_at, reviewed_at, approved_at }
```

**webhook_events**

```
{ event_id, received_at, signature_hash, valid, mode, replayed }
```

---

# 6) Seguridad (MVP hardening)

* **No-custodial real**: seed/keys solo en el dispositivo (SecureStore).
* **PIN/Biometría** al reingresar. Timeout 2 min (configurable).
* **Rate-limit** por IP y por address en endpoints críticos.
* **HMAC webhook** + **replay-protection** + **window** temporal.
* **.env** con secrets; nunca en commit. Rotación simple (devnet).
* **CORS** solo desde dominio de app (lista blanca).
* **Límites de recompensa** (por tx/usuario/global) con **idempotencia**.

> Nota: el **Anti-Rug Protocol** completo (multisig, timelocks, LPLocker, BurnVault) queda documentado para Fase 2; en Fase 1 basta con **mint authority** bajo custodia de tesorería segura y logs de emisión.

---

# 7) Token SLT (MVP)

* **Red**: Solana Devnet.
* **Decimals**: 6.
* **Mint/Freeze authority**: tesorería backend.
* **Uso**: recompensa transaccional (métrica de engagement).
* **Suministro inicial**: 1,000,000 SLT (ajustable).
* **Política**: sin transfer-tax; solo emisión por rewards/airdrops controlados.

*(Metadatos con Metaplex + logo: opcional en F1, recomendable si habrá showcases.)*

---

# 8) Límites y Reglas (anti-abuso)

* `MAX_SLT_PER_TX = 10`
* `USER_DAILY_SLT_CAP = 100`
* `GLOBAL_DAILY_SLT_CAP = 10_000`
* Idempotencia por `trigger_tx_signature`.
* **Blocklist** temporal por abuso (opcional F1.1).

---

# 9) Métricas y KPIs (Fase 1)

**Producto**

* **DAU/WAU** (wallets activas).
* **GTV** devnet (volumen USDC-MOCK).
* **#Tx** SOL / SPL.
* **SLT emitido (hoy / lifetime)**.
* **Tiempo TTFT** (tap-to-first-tx).
* **Conversión KYC Mock** (start→approved).

**Confiabilidad**

* Éxito de airdrop (%).
* Fallos por firma HMAC / replay.
* Latencia P95 de endpoints.

---

# 10) QA & UAT (guión mínimo)

1. Crear wallet → **faucet SOL** → balance > 0.
2. Enviar **0.001 SOL** a otra cuenta → signature visible.
3. Enviar **1.50 USDC-MOCK** → `verify-transaction` → **rewardedSLT = 0.15** → `airdrop-slt` ejecutado.
4. Probar error **>10 SLT** → mensaje `exceeds MAX_SLT_PER_TX`.
5. Forzar **100 SLT día** → siguiente intento bloqueado.
6. Webhook firmado (body o ts.body) → `200 { ok: true, mode }`.
7. Bloqueo por biometría/PIN al volver de background.

---

# 11) Entregables (debe existir en el repo)

* `apps/mobile/` con:

  * `app.json`/`app.config.ts` (icon/splash/adaptive).
  * `services/wallet.ts` (sendSOL, sendSPL, getBalances).
  * `(wallet)/home.tsx`, `send.tsx`, `receive.tsx`, `rewards.tsx`, `kyc.tsx`.
  * **Brand assets** (logo, wordmark, OG web opcional).

* `app/backend/` con:

  * `server.py`, `routes/devnet.py`, `services/solana_service.py`.
  * `security/webhook.py`.
  * `requirements.txt`.
  * `.env.example`.
  * **Tests**: `tests/test_webhook_sig.py`.

* `scripts/create_mints.ts` (mints Devnet).

* `docs/devnet_playbook.md` (cURL, QA).

* `docs/protocolo_mvp_fase1.md` (este documento).

---

# 12) Roadmap inmediato (F1 → F1.1/F2)

**F1.1 (rápido)**

* Notificaciones push (en éxito de reward).
* Multi-wallet (perfiles).
* Blocklist / throttle avanzado.
* Metadatos de SLT con **logo on-chain** (Metaplex).

**Fase 2 (Foundation de protocolo)**

* **Anti-Rug Protocol** operativo (multisig, timelock de parámetros, LPLocker, BurnVault con reportes).
* Integrar **USDC real** (devnet) o proveedor de faucet estable.
* SCRS (Score Credit Web3) **mínimo**: scoring heurístico off-chain con inputs on-chain.
* KYT/sanctions screening vía partner (sólo flags, no custodia).
* Programas Anchor (on-chain) para rewards & accounting (en vez de backend-mint).

---

# 13) Aceptación del MVP (Definition of Done)

* ✅ App móvil corre en Expo Go (iOS/Android).
* ✅ Crear/importar wallet, **faucet**, enviar SOL/SPL.
* ✅ `verify-transaction` + **reward** SLT con límites activos.
* ✅ Webhook HMAC validado y **replay-protected**.
* ✅ Branding SUÉLTALO aplicado (icon/splash/OG).
* ✅ QA Playbook completo sin fallas.
* ✅ CI backend con tests en verde.

---

**Versión**: 1.0.0  
**Fecha**: 2025-11-04  
**Estado**: Fase 1 - MVP Fundacional
