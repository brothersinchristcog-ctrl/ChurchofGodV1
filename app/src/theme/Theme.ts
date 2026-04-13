/**
 * Church of God (COG) Mobile App
 * Design System & Theme Configuration
 */

export const Colors = {
  // BRAND COLORS
  primary: '#1a2d5a', // Deep Navy
  accent: '#c0392b',  // Vibrant Red
  gold: '#f0a500',    // Golden Yellow
  
  // UI COLORS
  background: '#f8f9fa',
  surface: '#ffffff',
  text: '#1a1a1a',
  textSecondary: '#6c757d',
  border: '#e9ecef',
  
  // STATUS COLORS
  success: '#27ae60',
  error: '#e74c3c',
  pending: '#f39c12',
  
  // TRANSPARENTS
  overlay: 'rgba(0, 0, 0, 0.5)',
  whiteAlpha: 'rgba(255, 255, 255, 0.8)',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Typography = {
  // We will use Google Fonts 'Inter'
  fonts: {
    regular: 'Inter-Regular',
    medium: 'Inter-Medium',
    bold: 'Inter-Bold',
  },
  sizes: {
    h1: 32,
    h2: 24,
    h3: 20,
    body: 16,
    caption: 12,
  },
};

export const Theme = {
  Colors,
  Spacing,
  Typography,
};

export default Theme;
