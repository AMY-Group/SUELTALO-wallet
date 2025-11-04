# SUÉLTALO - Theme Usage Guide

Guía de uso del tema oficial de SUÉLTALO para desarrollo consistente.

---

## 📦 Importar el Tema

```typescript
import { theme, colors, gradients, spacing, borderRadius } from '@/constants/theme';
```

---

## 🎨 Uso de Colores

### En componentes React Native

```tsx
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/constants/theme';

const MyComponent = () => (
  <View style={styles.container}>
    <Text style={styles.text}>SUÉLTALO</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    borderColor: colors.border.default,
    borderWidth: 1,
  },
  text: {
    color: colors.text.primary,
  },
});
```

### Degradados con LinearGradient

```tsx
import { LinearGradient } from 'expo-linear-gradient';
import { gradients } from '@/constants/theme';

const NeonButton = () => (
  <LinearGradient
    colors={gradients.neon}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={styles.button}
  >
    <Text>Enviar SOL</Text>
  </LinearGradient>
);
```

---

## 🌈 Gradientes Disponibles

```typescript
// Degradado principal (cyan → magenta → purple)
gradients.neon // ["#00F5FF", "#FF00FF", "#8B5CF6"]

// Variantes de un solo color
gradients.cyan     // ["#00F5FF", "#0096FF"]
gradients.magenta  // ["#FF00FF", "#C026D3"]
gradients.purple   // ["#8B5CF6", "#6366F1"]

// Reversa
gradients.neonReverse // ["#8B5CF6", "#FF00FF", "#00F5FF"]
```

---

## 📏 Spacing (Sistema de 8pt)

```tsx
import { spacing } from '@/constants/theme';

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,        // 16px
    marginVertical: spacing.lg, // 24px
    gap: spacing.sm,            // 8px
  },
});

// Valores disponibles:
spacing.xs   // 4px
spacing.sm   // 8px
spacing.md   // 16px
spacing.lg   // 24px
spacing.xl   // 32px
spacing.xxl  // 48px
```

---

## 🔘 Border Radius

```tsx
import { borderRadius } from '@/constants/theme';

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.md, // 12px
  },
  button: {
    borderRadius: borderRadius.full, // 9999px (circular)
  },
});

// Valores:
borderRadius.sm   // 8px
borderRadius.md   // 12px
borderRadius.lg   // 16px
borderRadius.xl   // 24px
borderRadius.full // 9999px
```

---

## ✍️ Tipografía

```tsx
import { typography } from '@/constants/theme';

const styles = StyleSheet.create({
  title: {
    fontSize: typography.fontSizes.xxl,       // 24px
    fontWeight: typography.fontWeights.bold,  // "700"
  },
  body: {
    fontSize: typography.fontSizes.md,        // 16px
    fontWeight: typography.fontWeights.regular, // "400"
  },
});

// Font Sizes:
typography.fontSizes.xs    // 12px
typography.fontSizes.sm    // 14px
typography.fontSizes.md    // 16px
typography.fontSizes.lg    // 18px
typography.fontSizes.xl    // 20px
typography.fontSizes.xxl   // 24px
typography.fontSizes.xxxl  // 32px

// Font Weights:
typography.fontWeights.regular  // "400"
typography.fontWeights.medium   // "500"
typography.fontWeights.semibold // "600"
typography.fontWeights.bold     // "700"
```

---

## 🌟 Efectos Neon (Shadows)

```tsx
import { shadows } from '@/constants/theme';

const styles = StyleSheet.create({
  neonCard: {
    // Glow cyan neón
    shadowColor: '#00F5FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10, // Android
  },
});

// Shadows disponibles:
shadows.neon.cyan    // "0 0 20px rgba(0, 245, 255, 0.5)"
shadows.neon.magenta // "0 0 20px rgba(255, 0, 255, 0.5)"
shadows.neon.purple  // "0 0 20px rgba(139, 92, 246, 0.5)"
shadows.card         // "0 4px 6px rgba(0, 0, 0, 0.3)"
shadows.elevated     // "0 10px 15px rgba(0, 0, 0, 0.4)"
```

---

## 🎭 Superficies (Cards & Overlays)

```tsx
import { colors } from '@/constants/theme';

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface.card,     // rgba(255, 255, 255, 0.05)
    borderRadius: borderRadius.md,
  },
  modal: {
    backgroundColor: colors.surface.overlay,  // rgba(0, 0, 0, 0.8)
  },
  elevated: {
    backgroundColor: colors.surface.elevated, // rgba(255, 255, 255, 0.1)
  },
});
```

---

## 🚨 Estados (Success, Warning, Error)

```tsx
import { colors } from '@/constants/theme';

const StatusBadge = ({ type }: { type: 'success' | 'warning' | 'error' }) => {
  const badgeColor = {
    success: colors.success,
    warning: colors.warning,
    error: colors.error,
  }[type];

  return (
    <View style={{ backgroundColor: badgeColor, padding: 8 }}>
      <Text>{type}</Text>
    </View>
  );
};
```

---

## ⏱️ Animaciones

```tsx
import { Animated } from 'react-native';
import { animations } from '@/constants/theme';

const fadeIn = () => {
  Animated.timing(fadeAnim, {
    toValue: 1,
    duration: animations.normal, // 300ms
    useNativeDriver: true,
  }).start();
};

// Duraciones:
animations.fast   // 150ms
animations.normal // 300ms
animations.slow   // 500ms
```

---

## 🎨 Ejemplo Completo: Neon Card

```tsx
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, spacing, borderRadius, typography } from '@/constants/theme';

const NeonCard = ({ balance, token }: { balance: string; token: string }) => (
  <View style={styles.cardContainer}>
    <LinearGradient
      colors={gradients.neon}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientBorder}
    >
      <View style={styles.cardInner}>
        <Text style={styles.label}>Balance</Text>
        <Text style={styles.amount}>{balance}</Text>
        <Text style={styles.token}>{token}</Text>
      </View>
    </LinearGradient>
  </View>
);

const styles = StyleSheet.create({
  cardContainer: {
    padding: 2, // Border width
  },
  gradientBorder: {
    borderRadius: borderRadius.lg,
    padding: 2,
  },
  cardInner: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg - 2,
    padding: spacing.lg,
  },
  label: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  amount: {
    fontSize: typography.fontSizes.xxxl,
    fontWeight: typography.fontWeights.bold,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  token: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.regular,
    color: colors.text.primary,
  },
});

export default NeonCard;
```

---

## 🎯 Best Practices

### ✅ DO

- Usar colores del tema para consistencia
- Aplicar sistema de spacing de 8pt
- Usar gradientes neon para CTAs importantes
- Mantener contraste accesible (texto sobre fondos)
- Usar `colors.surface` para cards y modales

### ❌ DON'T

- Hardcodear colores hex en componentes
- Mezclar spacing arbitrario (usar valores del tema)
- Sobrecargar con demasiados gradientes
- Usar colores puros sin transparencia en superficies
- Ignorar estados hover/press en interactive elements

---

## 🔄 Modo Claro (Futuro)

El tema actualmente está optimizado para **dark mode**. Si necesitas implementar modo claro:

```typescript
// Crear theme-light.ts
export const lightTheme = {
  colors: {
    bg: "#FFFFFF",
    primary: "#00D1E0",  // Cyan más oscuro
    secondary: "#E600E6", // Magenta más oscuro
    accent: "#7C3AED",    // Purple más oscuro
    text: "#1F2937",      // Gris oscuro
  },
  // ... resto del tema adaptado
};
```

---

## 📱 Testing de Colores

Para visualizar todos los colores del tema:

```tsx
import { colors } from '@/constants/theme';

const ColorPalette = () => (
  <View>
    {Object.entries(colors.neon).map(([name, color]) => (
      <View key={name} style={{ backgroundColor: color, padding: 16 }}>
        <Text>{name}: {color}</Text>
      </View>
    ))}
  </View>
);
```

---

## 📚 Referencias

- **Theme file**: `/frontend/constants/theme.ts`
- **Brand assets**: `/frontend/assets/brand/`
- **Documentación de branding**: `/docs/brand-assets-guide.md`

---

**Versión**: 1.0.0  
**Última actualización**: 2025-11-04
