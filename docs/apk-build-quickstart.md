# SUÉLTALO - Guía Rápida para APK Build

Esta guía te llevará paso a paso para crear tu primera APK de SUÉLTALO.

---

## ⚡ Quick Start - Build APK en 5 minutos

### Paso 1: Instalar EAS CLI (si no lo tienes)

```bash
npm install -g eas-cli
```

### Paso 2: Login a Expo

```bash
eas login
```

Ingresa tu email y password de Expo. Si no tienes cuenta:
- Créala en https://expo.dev/signup
- O usa `eas register` desde la terminal

### Paso 3: Navegar al proyecto

```bash
cd /app/frontend
```

### Paso 4: Inicializar EAS (primera vez)

```bash
eas init
```

Esto creará un Project ID y lo agregará a tu `app.json` automáticamente.

### Paso 5: Build APK Preview

```bash
eas build --platform android --profile preview
```

**¿Qué pasará?**
1. EAS subirá tu código a sus servidores
2. Te preguntará si quieres generar un keystore (di **Yes**)
3. Compilará la APK (~15 minutos)
4. Te dará un link para descargar

---

## 📱 Descargar e Instalar APK

Una vez que el build termine:

1. **Descarga la APK:**
   ```bash
   # Opción 1: Desde el link del build
   # EAS te dará un link directo
   
   # Opción 2: Descargar con EAS CLI
   eas build:download --platform android --profile preview
   ```

2. **Transferir al dispositivo:**
   ```bash
   # Por USB
   adb install sueltalo-preview.apk
   
   # O envía el archivo a tu teléfono por email/drive
   ```

3. **Instalar en Android:**
   - Habilita "Fuentes desconocidas" en Configuración
   - Toca el archivo APK
   - Sigue las instrucciones de instalación

---

## 🎯 Comandos Útiles EAS

### Ver historial de builds
```bash
eas build:list
```

### Ver logs de un build específico
```bash
eas build:view <build-id>
```

### Cancelar un build en progreso
```bash
eas build:cancel <build-id>
```

### Descargar última APK
```bash
eas build:download --platform android --latest
```

---

## 🔧 Troubleshooting

### Error: "Project not configured"
```bash
# Ejecutar:
eas init
```

### Error: "Not logged in"
```bash
# Ejecutar:
eas login
```

### Error: "Invalid keystore"
```bash
# Generar nuevo keystore:
eas credentials
# Seleccionar: Android > Production > Generate new keystore
```

### Build falla por dependencias
```bash
# En el proyecto:
cd /app/frontend
rm -rf node_modules yarn.lock
yarn install
eas build --platform android --profile preview --clear-cache
```

---

## 📊 Estado Actual del Proyecto

**Listo para build:**
- ✅ `app.json` configurado
- ✅ `eas.json` creado con profiles
- ✅ Assets de branding integrados
- ✅ Package name: `com.sueltalo.wallet`
- ✅ Version: 0.1.0

**Lo que EAS hará automáticamente:**
- ✅ Generar keystore (primera vez)
- ✅ Compilar APK
- ✅ Firmar con keystore
- ✅ Optimizar assets
- ✅ Subir a servidores Expo

---

## 🚀 Builds Alternativos

### Build Production (AAB para Play Store)
```bash
eas build --platform android --profile production
```

### Build para iOS TestFlight
```bash
eas build --platform ios --profile preview
```

### Build para ambas plataformas
```bash
eas build --platform all --profile preview
```

---

## 📝 Notas Importantes

**Primera vez:**
- EAS te pedirá generar un keystore
- Guárdalo bien (EAS lo hace automáticamente)
- El build tarda ~15 minutos

**Builds subsecuentes:**
- Serán más rápidos (~10 minutos)
- Usarán el mismo keystore
- Puedes incrementar version en `app.json`

**Límites gratis:**
- Expo: 30 builds/mes gratis
- Después: planes de pago o self-hosted

---

## ✅ Checklist Pre-Build

- [x] EAS CLI instalado
- [x] Cuenta Expo creada
- [x] app.json configurado
- [x] eas.json creado
- [x] Assets de branding presentes
- [ ] **Ejecutar `eas login`**
- [ ] **Ejecutar `eas init`**
- [ ] **Ejecutar `eas build`**

---

## 🎉 ¡Listo para Build!

**Comando final:**
```bash
cd /app/frontend
eas build --platform android --profile preview
```

**Tiempo estimado:** ~15 minutos

**Output esperado:**
```
✔ Build finished
Build URL: https://expo.dev/accounts/.../builds/...
APK download: https://expo.dev/.../artifacts/...apk
```

---

## 📞 Siguiente Paso: Testing

Una vez instalada la APK:

1. **Abre SUÉLTALO en tu Android**
2. **Prueba el onboarding**
3. **Crea una wallet**
4. **Verifica que se vean los assets y branding**
5. **Prueba navegación entre pantallas**

Si encuentras issues, revisa logs:
```bash
adb logcat | grep -i sueltalo
```

---

**Versión**: 0.1.0  
**Última actualización**: 2025-11-04  
**Build profile**: preview (internal testing)

¡Todo listo para tu primera build! 🚀
