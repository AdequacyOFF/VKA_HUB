import '@mantine/core';
import { ButtonProps, PaperProps } from '@mantine/core';
import { ForwardRefExoticComponent, RefAttributes } from 'react';

type VTBVariant = 'primary' | 'secondary' | 'glass';
type VTBCardVariant = 'default' | 'primary' | 'secondary' | 'accent';

declare global {
  // Disable strict JSX attribute checking for our custom components
  namespace React {
    interface Attributes {
      [key: string]: any;
    }
  }
}

export {};
