import { Notification, Alert } from '@mantine/core';

/**
 * Feedback component theme overrides for VTB glass morphism design
 */

export const NotificationTheme = Notification.extend({
  styles: {
    root: {
      background: 'rgba(10, 31, 68, 0.95)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(0, 217, 255, 0.3)',
      borderRadius: '12px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    },
    title: {
      color: '#ffffff',
      fontWeight: 600,
    },
    description: {
      color: 'rgba(255, 255, 255, 0.9)',
    },
    closeButton: {
      color: '#00D9FF',
      '&:hover': {
        background: 'rgba(0, 217, 255, 0.1)',
        color: '#33E3FF',
      },
    },
    icon: {
      background: 'transparent',
    },
  },
  defaultProps: {
    color: 'cyan',
  },
});

export const AlertTheme = Alert.extend({
  styles: {
    root: {
      background: 'rgba(10, 31, 68, 0.8)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      border: '1px solid rgba(0, 217, 255, 0.3)',
      borderRadius: '12px',
    },
    title: {
      color: '#ffffff',
      fontWeight: 600,
    },
    message: {
      color: 'rgba(255, 255, 255, 0.9)',
    },
    closeButton: {
      color: '#00D9FF',
      '&:hover': {
        background: 'rgba(0, 217, 255, 0.1)',
        color: '#33E3FF',
      },
    },
    icon: {
      color: '#00D9FF',
    },
  },
  defaultProps: {
    color: 'cyan',
  },
});
