import { Paper } from '@mantine/core';
import type { PaperProps } from '@mantine/core';
import { CSSProperties, ReactNode } from 'react';

type VTBCardVariant = 'default' | 'primary' | 'secondary' | 'accent';

export interface VTBCardProps extends PaperProps {
  variant?: VTBCardVariant;
  hover?: boolean;
  style?: CSSProperties;
  children?: ReactNode;
}

export function VTBCard({
  children,
  variant = 'default',
  hover = true,
  className = '',
  style,
  ...props
}: VTBCardProps) {

  const getVariantClass = () => {
    switch (variant) {
      case 'primary':
        return 'vtb-card-primary';
      case 'secondary':
        return 'vtb-card-secondary';
      case 'accent':
        return 'vtb-card-accent';
      default:
        return 'glass-card';
    }
  };

  return (
    <Paper
      {...props}
      className={`${getVariantClass()} ${className}`}
      p="xl"
      radius="lg"
      style={{
        cursor: hover ? 'pointer' : 'default',
        ...style,
      }}
    >
      {children}
    </Paper>
  );
}
