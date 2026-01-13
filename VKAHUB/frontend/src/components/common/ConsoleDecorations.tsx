import { ReactNode } from 'react';

// Console Corner Brackets Component
export function ConsoleCorners() {
  return (
    <>
      <div className="console-corner-tl" />
      <div className="console-corner-tr" />
      <div className="console-corner-bl" />
      <div className="console-corner-br" />
    </>
  );
}

// Console Grid Background Wrapper
interface ConsoleGridWrapperProps {
  children: ReactNode;
  className?: string;
}

export function ConsoleGridWrapper({ children, className = '' }: ConsoleGridWrapperProps) {
  return (
    <div className={`console-grid ${className}`}>
      {children}
    </div>
  );
}

// Console Lines (Vertical) Wrapper
export function ConsoleVerticalLines({ children, className = '' }: ConsoleGridWrapperProps) {
  return (
    <div className={`console-lines-vertical ${className}`}>
      {children}
    </div>
  );
}

// Console Status Bar (with blinking cursor)
interface ConsoleStatusBarProps {
  children: ReactNode;
  className?: string;
}

export function ConsoleStatusBar({ children, className = '' }: ConsoleStatusBarProps) {
  return (
    <div className={`console-status-bar ${className}`}>
      {children}
    </div>
  );
}

// Blinking Console Cursor
export function ConsoleCursor() {
  return <span className="console-cursor" />;
}

// Neon Glow Text
interface NeonTextProps {
  children: ReactNode;
  className?: string;
}

export function NeonText({ children, className = '' }: NeonTextProps) {
  return (
    <span className={`neon-glow ${className}`}>
      {children}
    </span>
  );
}

// Floating Icon Container
interface FloatingIconProps {
  src: string;
  alt?: string;
  size?: number;
  position?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
  opacity?: number;
  className?: string;
}

export function FloatingIcon({
  src,
  alt = '',
  size = 150,
  position = {},
  opacity = 0.15,
  className = ''
}: FloatingIconProps) {
  const style: React.CSSProperties = {
    width: `${size}px`,
    height: 'auto',
    opacity,
    ...position,
  };

  return (
    <img
      src={src}
      alt={alt}
      className={`floating-icon ${className}`}
      style={style}
    />
  );
}

// Scan Line Effect
export function ScanLine() {
  return <div className="scan-line" />;
}

// Pixel Border Wrapper
interface PixelBorderProps {
  children: ReactNode;
  className?: string;
}

export function PixelBorder({ children, className = '' }: PixelBorderProps) {
  return (
    <div className={`pixel-border ${className}`}>
      {children}
    </div>
  );
}
