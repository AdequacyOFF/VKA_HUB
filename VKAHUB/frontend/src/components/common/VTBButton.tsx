import { Button } from '@mantine/core';
import type { ButtonProps } from '@mantine/core';
import { forwardRef } from 'react';

type VTBVariant = 'primary' | 'secondary' | 'glass';

type VTBButtonProps = ButtonProps & {
  variant?: VTBVariant;
};

export const VTBButton = forwardRef<HTMLButtonElement, VTBButtonProps>(function VTBButton(
  {
    variant = 'primary',
    className = '',
    children,
    ...props
  },
  ref
) {
  const getVariantClass = () => {
    switch (variant) {
      case 'primary':
        return 'vtb-button-primary';
      case 'secondary':
        return 'vtb-button-secondary';
      case 'glass':
        return 'glass-button';
      default:
        return 'vtb-button-primary';
    }
  };

  return (
    <Button
      ref={ref}
      {...props}
      className={`${getVariantClass()} ${className}`.trim()}
      size="md"
      radius={0}
      variant="filled"
    >
      {children}
    </Button>
  );
});
