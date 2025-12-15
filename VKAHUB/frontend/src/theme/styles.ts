import { CSSProperties } from 'react';

/**
 * Shared style utilities for VTB glass morphism theme
 */

export const glassInputStyles: CSSProperties = {
  background: 'rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.3)',
  color: '#ffffff',
  transition: 'all 0.3s ease',
};

export const glassInputFocusStyles: CSSProperties = {
  borderColor: '#00D9FF',
  boxShadow: '0 0 0 2px rgba(0, 217, 255, 0.3)',
};

export const glassDropdownStyles: CSSProperties = {
  background: 'rgba(10, 31, 68, 0.95)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(0, 217, 255, 0.3)',
  borderRadius: '12px',
  boxShadow: '0 12px 48px rgba(0, 0, 0, 0.4)',
};

export const glassOptionStyles: CSSProperties = {
  color: '#ffffff',
  transition: 'all 0.2s ease',
};

export const glassOptionHoverStyles: CSSProperties = {
  background: 'rgba(0, 217, 255, 0.1)',
};

export const glassOptionSelectedStyles: CSSProperties = {
  background: 'rgba(0, 217, 255, 0.3)',
  color: '#00D9FF',
  fontWeight: 600,
};

export const glassOverlayStyles: CSSProperties = {
  background: 'rgba(10, 31, 68, 0.95)',
  backdropFilter: 'blur(30px)',
  WebkitBackdropFilter: 'blur(30px)',
  border: '1px solid rgba(0, 217, 255, 0.3)',
  borderRadius: '24px',
  boxShadow: '0 12px 48px rgba(0, 0, 0, 0.4)',
};

export const cyanAccentStyles: CSSProperties = {
  color: '#00D9FF',
  fontWeight: 600,
};

export const cyanGradientBackgroundStyles: CSSProperties = {
  background: 'linear-gradient(135deg, #00D9FF 0%, #33E3FF 100%)',
  color: '#0A1F44',
};

export const cyanGlowShadow = '0 8px 24px rgba(0, 217, 255, 0.4)';
export const cyanGlowShadowHover = '0 12px 32px rgba(0, 217, 255, 0.6)';

/**
 * Helper function to create glass morphism styles with custom blur
 */
export const createGlassStyles = (blur: number = 20): CSSProperties => ({
  backdropFilter: `blur(${blur}px)`,
  WebkitBackdropFilter: `blur(${blur}px)`,
  transition: 'all 0.3s ease',
});

/**
 * Helper function to create hover lift effect
 */
export const createHoverLiftStyles = (translateY: number = -2): CSSProperties => ({
  transform: `translateY(${translateY}px)`,
  transition: 'all 0.3s ease',
});
