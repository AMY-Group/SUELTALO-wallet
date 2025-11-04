# SUÉLTALO - EAS Build Configuration

Configuración optimizada para builds de producción con Expo Application Services (EAS).

---

## 📱 app.json - Configuración Oficial

```json
{
  "expo": {
    "name": "SUÉLTALO",
    "slug": "sueltalo",
    "scheme": "sueltalo",
    "version": "0.1.0",
    "orientation": "portrait",
    "backgroundColor": "#000000",
    "icon": "./assets/brand/icon-1024.png",
    "userInterfaceStyle": "dark",
    "newArchEnabled": true,
    "splash": {
      "image": "./assets/brand/splash-2732.png",
      "resizeMode": "contain",
      "backgroundColor": "#000000"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/brand/adaptive-icon-foreground.png",
        "backgroundImage": "./assets/brand/adaptive-icon-background.png"
      },
      "package": "com.sueltalo.wallet",
      "edgeToEdgeEnabled": true
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.sueltalo.wallet",
      "icon": "./assets/brand/icon-1024.png"
    },
    "web": {
      "bundler": "metro",
      "output": "static",
      "favicon": "./assets/brand/icon-1024.png"
    },
    "plugins": [
      "expo-router"
    ],
    "experiments": {
      "typedRoutes": true
    },
    "extra": {
      "eas": {
        "projectId": "<YOUR_EAS_PROJECT_ID>"
      }
    }
  }
}
```

---

## 🚀 eas.json - Build Configuration

Crear archivo `eas.json` en la raíz del proyecto frontend:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      },
      "android": {
        "buildType": "apk"
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      },
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "distribution": "store",
      "ios": {
        "autoIncrement": true
      },
      "android": {
        "buildType": "aab"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "1234567890",
        "appleTeamId": "ABCDE12345"
      },
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

---

## 📋 Pre-Build Checklist

### 1. Assets Verificados ✅
- [x] `icon-1024.png` (1024x1024) con transparencia
- [x] `splash-2732.png` (2732x2732) safe zone 1200x1200
- [x] `adaptive-icon-foreground.png` (1024x1024)
- [x] `adaptive-icon-background.png` (1024x1024) negro puro

### 2. App Configuration ✅
- [x] `name`: "SUÉLTALO"
- [x] `slug`: "sueltalo"
- [x] `version`: "0.1.0"
- [x] `backgroundColor`: "#000000"
- [x] Bundle ID iOS: `com.sueltalo.wallet`
- [x] Package Android: `com.sueltalo.wallet`

### 3. Dependencias
```bash
cd frontend
yarn install
```

### 4. EAS CLI Setup
```bash
npm install -g eas-cli
eas login
eas init
```

---

## 🔨 Build Commands

### Android Internal (APK)

```bash
cd frontend

# Development build
eas build --platform android --profile development

# Preview build (internal testing)
eas build --platform android --profile preview

# Production build (AAB for Play Store)
eas build --platform android --profile production
```

### iOS Internal (Simulator + TestFlight)

```bash
cd frontend

# Development build (simulator)
eas build --platform ios --profile development

# Preview build (TestFlight internal)
eas build --platform ios --profile preview

# Production build (App Store)
eas build --platform ios --profile production
```

### Build Both Platforms

```bash
eas build --platform all --profile preview
```

---

## 📦 Build Profiles Explained

### Development
- **Purpose**: Local development and testing
- **Android**: APK for direct installation
- **iOS**: Simulator build
- **Distribution**: Internal only

### Preview (Internal Testing)
- **Purpose**: Internal team testing before production
- **Android**: APK for testers
- **iOS**: TestFlight internal
- **Distribution**: Internal testers only

### Production
- **Purpose**: Store submission
- **Android**: AAB (Android App Bundle) for Play Store
- **iOS**: IPA for App Store Connect
- **Distribution**: Public stores

---

## 🎯 Release Notes v0.1.0

### Features
- ✅ Billetera Solana Devnet integrada
- ✅ Envío y recepción de SOL
- ✅ Sistema de recompensas SLT (0.1 SLT por USDC)
- ✅ Onboarding interactivo para migrantes, freelancers y PYMEs
- ✅ Diseño urbano neón con degradados cyan-magenta-purple
- ✅ Historial de transacciones
- ✅ Mock KYC con progresión automática

### Technical Stack
- React Native 0.79.5
- Expo SDK ~53.0
- Solana Web3.js
- FastAPI backend
- MongoDB database

### Known Limitations
- Devnet only (no mainnet transactions)
- Mock USDC token
- KYC simulation only

---

## 🔐 iOS Signing & Credentials

### Required for iOS Builds

1. **Apple Developer Account**
   - Account holder email
   - Apple Team ID

2. **App Store Connect**
   - App-specific password
   - ASC App ID

3. **Certificates & Profiles**
   - Distribution certificate
   - Provisioning profile
   - Push notification certificate (if needed)

### Setup with EAS

```bash
# EAS will handle credentials automatically
eas build --platform ios --profile production

# Or configure manually
eas credentials
```

---

## 🤖 Android Signing

### Required for Android Builds

1. **Google Play Console Account**
   - Service account JSON key

2. **Keystore**
   - EAS will generate automatically
   - Or upload existing keystore

### Setup with EAS

```bash
# First production build - EAS creates keystore
eas build --platform android --profile production

# Download keystore backup
eas credentials
```

---

## 📊 Build Status Monitoring

### Check Build Progress

```bash
# List all builds
eas build:list

# View specific build
eas build:view <build-id>

# View build logs
eas build:logs <build-id>
```

### Download Build Artifacts

```bash
# After build completes
eas build:download <build-id>
```

---

## 🚢 Submission to Stores

### Android (Google Play)

```bash
# Submit to Play Console
eas submit --platform android

# Or manually upload AAB to Google Play Console
```

**Manual Steps:**
1. Create app in Play Console
2. Upload AAB
3. Fill store listing
4. Submit for review

### iOS (App Store)

```bash
# Submit to App Store Connect
eas submit --platform ios

# Or use Xcode/Transporter
```

**Manual Steps:**
1. Create app in App Store Connect
2. Upload build
3. Fill app information
4. Submit for review

---

## 🧪 Testing Builds

### Android APK Testing

1. Download APK from EAS dashboard
2. Transfer to Android device
3. Enable "Install from Unknown Sources"
4. Install APK
5. Test all features

### iOS TestFlight

1. Build completes → Auto-uploaded to TestFlight
2. Add internal testers in App Store Connect
3. Testers receive email invitation
4. Install via TestFlight app
5. Collect feedback

---

## 📝 Version Management

### Incrementing Version

```json
// app.json
{
  "expo": {
    "version": "0.1.1",  // Update manually
    "ios": {
      "buildNumber": "2"  // iOS build number
    },
    "android": {
      "versionCode": 2    // Android version code
    }
  }
}
```

### Auto-increment (Production only)

```json
// eas.json - production profile
{
  "build": {
    "production": {
      "ios": {
        "autoIncrement": true  // Auto-increments buildNumber
      }
    }
  }
}
```

---

## 🐛 Common Issues & Solutions

### Issue: "Icon not found"
**Solution**: Verify asset paths in app.json match actual file locations

### Issue: "Build failed: Metro bundler error"
**Solution**: 
```bash
cd frontend
rm -rf node_modules
yarn install
yarn cache clean
```

### Issue: "Android build timeout"
**Solution**: Increase build timeout in eas.json:
```json
{
  "build": {
    "production": {
      "android": {
        "resourceClass": "large"
      }
    }
  }
}
```

### Issue: "iOS signing error"
**Solution**: Run `eas credentials` and verify certificates

---

## 📚 Resources

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Submit Documentation](https://docs.expo.dev/submit/introduction/)
- [App Store Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Play Store Policies](https://play.google.com/about/developer-content-policy/)

---

## ✅ Pre-Submission Checklist

### App Store (iOS)
- [ ] Privacy Policy URL
- [ ] Support URL
- [ ] Marketing URL (optional)
- [ ] App description (max 4000 chars)
- [ ] Keywords (max 100 chars)
- [ ] Screenshots (6.5", 6.7", 5.5")
- [ ] App icon (no transparency)
- [ ] Age rating completed
- [ ] Export compliance

### Play Store (Android)
- [ ] Privacy Policy URL
- [ ] App description (max 4000 chars)
- [ ] Short description (max 80 chars)
- [ ] Screenshots (phone, tablet)
- [ ] Feature graphic (1024x500)
- [ ] App icon (512x512)
- [ ] Content rating completed
- [ ] Target audience selected

---

**Version**: 0.1.0  
**Last Updated**: 2025-11-04  
**Status**: Ready for Internal Testing 🚀
