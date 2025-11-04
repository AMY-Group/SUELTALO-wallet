# SUÉLTALO - Brand Assets Guide

Assets de branding oficiales para SUÉLTALO Crypto Wallet.

---

## 📦 Assets Generados

### Mobile App (`/app/frontend/assets/brand/`)

| Asset | Dimensiones | Uso | Tamaño |
|-------|-------------|-----|--------|
| `logo-primary.png` | 2048x2048 | Logo oficial alta resolución | 762 KB |
| `wordmark-light.png` | 2048x2048 | Texto "SUÉLTALO" con degradé | 3.1 MB |
| `icon-1024.png` | 1024x1024 | App icon iOS/Android | 1.4 MB |
| `splash-2732.png` | 2732x2732 | Splash screen (safe zone 1200x1200) | 806 KB |
| `adaptive-icon-foreground.png` | 1024x1024 | Android adaptive icon foreground | 1.4 MB |
| `adaptive-icon-background.png` | 1024x1024 | Android adaptive icon background (#000) | 398 B |

### Web App (`/app/web/public/`)

| Asset | Dimensiones | Uso | Tamaño |
|-------|-------------|-----|--------|
| `favicon.ico` | 32x32 | Browser favicon | 4.2 KB |
| `icon-512.png` | 512x512 | PWA icon, manifest | 88 KB |
| `og-image.png` | 1200x630 | Open Graph / social media | 114 KB |

---

## 🎨 Especificaciones de Diseño

### Colores de Brand

```
Degradado Principal:
- Cyan neón: #00F5FF (inicio)
- Azul: #0096FF (medio)
- Purple: #8B5CF6 (medio)
- Magenta: #FF00FF (final)

Fondo:
- Negro puro: #000000
```

### Tipografía

- **Logo text**: Sans-serif bold con degradé cyan→purple
- **Effect**: Glow/neon effect con partículas

---

## 📱 Configuración Expo (app.json)

```json
{
  "expo": {
    "name": "SUÉLTALO",
    "slug": "sueltalo",
    "version": "0.1.0",
    "icon": "./assets/brand/icon-1024.png",
    "splash": {
      "image": "./assets/brand/splash-2732.png",
      "backgroundColor": "#000000"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/brand/adaptive-icon-foreground.png",
        "backgroundColor": "#000000"
      },
      "package": "com.sueltalo.wallet"
    },
    "ios": {
      "bundleIdentifier": "com.sueltalo.wallet",
      "icon": "./assets/brand/icon-1024.png"
    }
  }
}
```

---

## 🖼️ Uso de Assets

### En componentes React Native

```tsx
import { Image } from 'react-native';

// Logo principal
<Image 
  source={require('@/assets/brand/logo-primary.png')} 
  style={{ width: 200, height: 200 }}
  resizeMode="contain"
/>

// Wordmark
<Image 
  source={require('@/assets/brand/wordmark-light.png')} 
  style={{ width: 300, height: 80 }}
  resizeMode="contain"
/>
```

### En HTML/Web

```html
<!-- Favicon -->
<link rel="icon" href="/favicon.ico" />

<!-- PWA icon -->
<link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png" />

<!-- Open Graph -->
<meta property="og:image" content="/og-image.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
```

---

## 🔧 Regenerar Assets

Si necesitas regenerar los assets desde los originales:

```bash
cd /tmp/brand_assets

# Asegúrate de tener los originales:
# - logo_original.png (1080x1080)
# - wordmark_original.png (1080x1080)

# Ejecutar script de generación:
bash generate_assets.sh
```

---

## 📋 Checklist de Deployment

### iOS App Store
- [x] Icon 1024x1024 (`icon-1024.png`)
- [x] Splash screen (`splash-2732.png`)
- [x] Bundle identifier: `com.sueltalo.wallet`

### Android Play Store
- [x] Adaptive icon foreground (`adaptive-icon-foreground.png`)
- [x] Adaptive icon background (`adaptive-icon-background.png`)
- [x] Package name: `com.sueltalo.wallet`

### Web/PWA
- [x] Favicon 32x32 (`favicon.ico`)
- [x] Icon 512x512 (`icon-512.png`)
- [x] OG image 1200x630 (`og-image.png`)

---

## 🎯 Safe Zones

### Splash Screen (2732x2732)
- **Safe zone central**: 1200x1200 (logo visible en todos los dispositivos)
- **Background**: Negro puro (#000000)

### Adaptive Icon (Android)
- **Foreground**: 1024x1024 (logo con transparencia)
- **Background**: 1024x1024 (negro puro)
- **Safe zone**: Circular 660px de diámetro desde el centro

---

## 📐 Dimensiones Recomendadas

### Mobile Screens
- **Thumbnail**: 120x120
- **List item**: 60x60
- **Header logo**: 160x40 (wordmark)
- **Splash**: Full screen con safe zone

### Web
- **Header logo**: 180x45 (wordmark)
- **Footer icon**: 40x40
- **Profile avatar**: 80x80

---

## 🚀 Export para Marketing

Para materiales de marketing, usa:
- **Logo principal**: `logo-primary.png` (2048x2048)
- **Wordmark**: `wordmark-light.png` (2048x2048)

Ambos tienen fondo transparente y alta resolución para impresión y digital.

---

## 📞 Contacto

Para solicitudes de branding personalizadas o assets adicionales, contactar al equipo de diseño.

**Versión**: 0.1.0  
**Última actualización**: 2025-11-04
