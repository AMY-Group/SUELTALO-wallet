/**
 * SUÉLTALO - Official Theme
 * Crypto Wallet LATAM - Neon Urban Design
 */

export const theme = {
  colors: {
    bg: "#000000",
    primary: "#00F5FF",
    secondary: "#FF00FF",
    accent: "#8B5CF6",
    text: "#E5E7EB",
  },
  gradient: ["#00F5FF", "#FF00FF", "#8B5CF6"],
};

// Extended theme with semantic colors
export const colors = {
  // Base
  background: "#000000",
  
  // Brand gradients
  neon: {
    cyan: "#00F5FF",
    magenta: "#FF00FF",
    purple: "#8B5CF6",
  },
  
  // Semantic colors
  primary: "#00F5FF",     // Cyan neon
  secondary: "#FF00FF",   // Magenta
  accent: "#8B5CF6",      // Purple
  
  // Text
  text: {
    primary: "#E5E7EB",   // Light gray
    secondary: "#9CA3AF", // Medium gray
    muted: "#6B7280",     // Dark gray
  },
  
  // UI States
  success: "#10B981",     // Green
  warning: "#F59E0B",     // Amber
  error: "#EF4444",       // Red
  info: "#3B82F6",        // Blue
  
  // Surface colors
  surface: {
    card: "rgba(255, 255, 255, 0.05)",
    elevated: "rgba(255, 255, 255, 0.1)",
    overlay: "rgba(0, 0, 0, 0.8)",
  },
  
  // Border
  border: {
    default: "rgba(255, 255, 255, 0.1)",
    focus: "#00F5FF",
  },
};

// Gradients
export const gradients = {
  // Primary neon gradient (cyan → magenta → purple)
  neon: ["#00F5FF", "#FF00FF", "#8B5CF6"],
  
  // Alternative gradients
  cyan: ["#00F5FF", "#0096FF"],
  magenta: ["#FF00FF", "#C026D3"],
  purple: ["#8B5CF6", "#6366F1"],
  
  // Reversed
  neonReverse: ["#8B5CF6", "#FF00FF", "#00F5FF"],
};

// Spacing (8pt grid system)
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Border radius
export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

// Typography
export const typography = {
  fontSizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  fontWeights: {
    regular: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },
};

// Shadows (neon glow effects)
export const shadows = {
  neon: {
    cyan: "0 0 20px rgba(0, 245, 255, 0.5)",
    magenta: "0 0 20px rgba(255, 0, 255, 0.5)",
    purple: "0 0 20px rgba(139, 92, 246, 0.5)",
  },
  card: "0 4px 6px rgba(0, 0, 0, 0.3)",
  elevated: "0 10px 15px rgba(0, 0, 0, 0.4)",
};

// Animation durations
export const animations = {
  fast: 150,
  normal: 300,
  slow: 500,
};

export default theme;
