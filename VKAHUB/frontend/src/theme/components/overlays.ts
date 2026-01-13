import { Modal, Popover, Menu } from '@mantine/core';

/**
 * Overlay component theme overrides for VTB glass morphism design
 * Based on existing ConfirmModal glass styling
 */

export const ModalTheme = Modal.extend({
  classNames: {
    content: 'glass-modal',
  },
  styles: {
    content: {
      background: 'rgba(10, 31, 68, 0.95)',
      backdropFilter: 'blur(30px)',
      WebkitBackdropFilter: 'blur(30px)',
      border: '1px solid rgba(0, 217, 255, 0.3)',
      borderRadius: '0px',
      boxShadow: '0 12px 48px rgba(0, 0, 0, 0.4)',
    },
    header: {
      background: 'transparent',
      borderBottom: '1px solid rgba(0, 217, 255, 0.2)',
      paddingBottom: '16px',
      marginBottom: '24px',
    },
    title: {
      color: '#ffffff',
      fontSize: '1.5rem',
      fontWeight: 700,
    },
    close: {
      color: '#00D9FF',
      '&:hover': {
        background: 'rgba(0, 217, 255, 0.1)',
        color: '#33E3FF',
      },
    },
    body: {
      color: '#ffffff',
    },
  },
  defaultProps: {
    centered: true,
    overlayProps: {
      backgroundOpacity: 0.7,
      blur: 8,
    },
  },
});

export const PopoverTheme = Popover.extend({
  styles: {
    dropdown: {
      background: 'rgba(10, 31, 68, 0.95)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(0, 217, 255, 0.3)',
      borderRadius: '0px',
      boxShadow: '0 12px 48px rgba(0, 0, 0, 0.4)',
      color: '#ffffff',
    },
  },
  defaultProps: {
    shadow: 'xl',
  },
});

export const MenuTheme = Menu.extend({
  styles: {
    dropdown: {
      background: 'rgba(10, 31, 68, 0.95)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(0, 217, 255, 0.3)',
      borderRadius: '0px',
      boxShadow: '0 12px 48px rgba(0, 0, 0, 0.4)',
      padding: '8px',
    },
    item: {
      color: '#ffffff',
      borderRadius: '0px',
      padding: '12px 16px',
      '&:hover': {
        background: 'rgba(0, 217, 255, 0.1)',
        color: '#00D9FF',
      },
      '&[data-hovered="true"]': {
        background: 'rgba(0, 217, 255, 0.1)',
        color: '#00D9FF',
      },
    },
    itemLabel: {
      color: 'inherit',
    },
    itemIcon: {
      color: '#00D9FF',
    },
    divider: {
      borderColor: 'rgba(0, 217, 255, 0.2)',
    },
  },
  defaultProps: {
    shadow: 'xl',
  },
});
