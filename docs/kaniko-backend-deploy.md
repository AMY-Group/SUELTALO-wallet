# PR-K1 — Backend Docker Aislado

Documentación para deploy del backend aislado del monorepo.

---

## 🎯 **Objetivo**

Aislar el backend para que Kaniko:
- ✅ Solo procese `/app/backend`
- ✅ NO toque `node_modules` de frontend
- ✅ NO procese bindings nativos de mobile
- ✅ Build más rápido y limpio

---

## 📁 **Archivos Creados**

### **1. /app/backend/Dockerfile**

```dockerfile
FROM python:3.11-slim AS base
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app
# solo backend, NO copies todo el repo
COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

COPY . .
EXPOSE 8001
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001"]
```

### **2. /app/backend/.dockerignore**

```
__pycache__/
*.pyc
*.pyo
.env
tests/
.pytest_cache/
*.log
.git/
.gitignore
README.md
*.md
.vscode/
.idea/
```

---

## 🚀 **Configuración Kaniko**

### **Para Emergent Deploy**

Si Emergent usa Kaniko internamente, asegúrate que el deploy apunte a:

```yaml
context: ./app/backend
dockerfile: ./app/backend/Dockerfile
```

### **Para CI/CD Manual (GitHub Actions)**

Crear `.github/workflows/deploy-backend.yml`:

```yaml
name: Deploy Backend

on:
  push:
    branches: [main]
    paths:
      - 'app/backend/**'

jobs:
  build-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build with Kaniko
        uses: aevea/action-kaniko@master
        with:
          image: sueltalo-backend
          tag: ${{ github.sha }}
          context: ./app/backend
          dockerfile: ./app/backend/Dockerfile
          cache: true
          cache_copy_layers: true
          snapshot_mode: redo
          verbosity: debug
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
```

### **Comando Kaniko Directo**

```bash
docker run \
  -v $(pwd):/workspace \
  -v ~/.docker/config.json:/kaniko/.docker/config.json:ro \
  gcr.io/kaniko-project/executor:latest \
  --context=/workspace/app/backend \
  --dockerfile=/workspace/app/backend/Dockerfile \
  --destination=registry.example.com/sueltalo-backend:$(git rev-parse --short HEAD) \
  --cache=true \
  --cache-copy-layers \
  --snapshot-mode=redo \
  --verbosity=debug
```

---

## 🧪 **Testing Local**

### **Opción 1: Docker Build Local**

```bash
# Desde el root del proyecto
docker build -t sueltalo-backend:test -f app/backend/Dockerfile app/backend

# Verificar imagen
docker images | grep sueltalo-backend

# Run local
docker run -p 8001:8001 \
  -e MONGO_URL="mongodb://host.docker.internal:27017" \
  -e DB_NAME="test_database" \
  -e SOLANA_TREASURY_PUBKEY="ERXnmYXWkMeWGJR54RUX7qUvfkz7qEBhVW4aAx6wcvv8" \
  -e SOLANA_SLT_MINT="9P9kuseXSQPEdmrmy2DJ2NYa4tvf69yZVnbDu1VApi84" \
  -e SOLANA_USDC_MOCK_MINT="2C9UWeZwQ8W3pjV65uJcpWYWdqw2sghqiq2MvBGNW2qr" \
  sueltalo-backend:test
```

### **Opción 2: Con docker-compose**

Crear `/app/docker-compose.yml`:

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8001:8001"
    environment:
      - MONGO_URL=mongodb://mongo:27017
      - DB_NAME=sueltalo_db
      - SOLANA_TREASURY_PUBKEY=ERXnmYXWkMeWGJR54RUX7qUvfkz7qEBhVW4aAx6wcvv8
      - SOLANA_SLT_MINT=9P9kuseXSQPEdmrmy2DJ2NYa4tvf69yZVnbDu1VApi84
      - SOLANA_USDC_MOCK_MINT=2C9UWeZwQ8W3pjV65uJcpWYWdqw2sghqiq2MvBGNW2qr
    depends_on:
      - mongo
    
  mongo:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
```

**Ejecutar:**

```bash
cd /app
docker-compose up --build
```

---

## ✅ **Criterios de Aceptación**

### **1. Kaniko Build OK sin tocar Node**

**Verificar:**
```bash
# En los logs de Kaniko NO debe aparecer:
# - "node_modules"
# - "@solana/web3.js"
# - "bigint"
# - Warnings de bindings nativos

# Debe mostrar solo:
# - "Copying requirements.txt"
# - "RUN pip install..."
# - "Copying server.py, routes/, services/, security/"
```

**Señales de éxito:**
- ✅ Build completa en < 3 minutos
- ✅ No errores de Node/npm
- ✅ Imagen final < 500MB

### **2. /health responde 200 tras deploy**

**Test manual:**
```bash
# Después del deploy
curl https://api.sueltalo.emergent.sh/api/health

# Expected:
{
  "status": "healthy",
  "timestamp": "2025-11-04T...",
  "service": "SUÉLTALO Crypto Wallet API"
}
```

**Test automatizado:**
```bash
#!/bin/bash
# test-health.sh

BACKEND_URL="https://api.sueltalo.emergent.sh"

echo "Testing backend health..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $BACKEND_URL/api/health)

if [ "$RESPONSE" -eq 200 ]; then
  echo "✅ Health check PASSED (200)"
  exit 0
else
  echo "❌ Health check FAILED ($RESPONSE)"
  exit 1
fi
```

---

## 📊 **Comparativa: Antes vs Después**

| Métrica | Antes (Full Monorepo) | Después (Backend Solo) |
|---------|----------------------|------------------------|
| **Context size** | ~500MB (todo) | ~5MB (backend) |
| **Build time** | 10-15 min | 2-3 min |
| **Errores Node** | ✅ Frecuentes | ❌ Eliminados |
| **Cache hits** | ⚠️ Bajos | ✅ Altos |
| **Imagen final** | ~800MB | ~350MB |

---

## 🔧 **Troubleshooting**

### **Error: "Cannot find requirements.txt"**

**Causa:** Context incorrecto

**Solución:**
```bash
# Asegurar que context sea app/backend
--context=./app/backend
```

### **Error: "Module 'security' not found"**

**Causa:** COPY . . no incluyó subdirectorios

**Solución:** Verificar que `.dockerignore` NO excluya carpetas necesarias

### **Error: "MongoDB connection failed"**

**Causa:** Variable de entorno no pasada

**Solución:**
```bash
# En deploy, asegurar que se pasan las env vars:
- MONGO_URL
- DB_NAME
- SOLANA_*
```

---

## 🚀 **Deploy a Emergent**

### **Paso 1: Verificar archivos**

```bash
ls -la /app/backend/Dockerfile
ls -la /app/backend/.dockerignore
```

### **Paso 2: Configurar Emergent**

En el dashboard de Emergent, configura:

**Build Settings:**
- Context: `app/backend`
- Dockerfile: `app/backend/Dockerfile`

**Environment Variables:**
```
MONGO_URL=<emergent_provides>
DB_NAME=sueltalo_production
SOLANA_TREASURY_PUBKEY=ERXnmYXWkMeWGJR54RUX7qUvfkz7qEBhVW4aAx6wcvv8
SOLANA_SLT_MINT=9P9kuseXSQPEdmrmy2DJ2NYa4tvf69yZVnbDu1VApi84
SOLANA_USDC_MOCK_MINT=2C9UWeZwQ8W3pjV65uJcpWYWdqw2sghqiq2MvBGNW2qr
HELIUS_WEBHOOK_SECRET=<your_secret>
```

### **Paso 3: Deploy**

```bash
# Presiona "Deploy" en Emergent
# O usa CLI:
emergent deploy --service backend
```

### **Paso 4: Verificar**

```bash
# Health check
curl https://api.sueltalo.emergent.sh/api/health

# Test endpoint
curl https://api.sueltalo.emergent.sh/api/devnet/balance/11111111111111111111111111111111
```

---

## 📝 **Checklist Pre-Deploy**

- [x] Dockerfile creado en `/app/backend/Dockerfile`
- [x] .dockerignore creado en `/app/backend/.dockerignore`
- [ ] Variables de entorno configuradas en Emergent
- [ ] Context de build apunta a `app/backend`
- [ ] Test local exitoso con Docker
- [ ] Health endpoint responde 200

---

## 🎯 **Resultado Esperado**

**Después del deploy:**

```bash
✅ Build completed in 2-3 minutes
✅ No Node.js warnings
✅ Image size: ~350MB
✅ Health check: 200 OK
✅ All API endpoints working
```

---

## 📚 **Referencias**

- [Kaniko Documentation](https://github.com/GoogleContainerTools/kaniko)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Multi-stage Builds](https://docs.docker.com/build/building/multi-stage/)

---

**Versión**: 1.0.0  
**Fecha**: 2025-11-04  
**PR**: K1 - Backend Docker Aislado
