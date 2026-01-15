import { Badge, Checkbox, Card, Paper, Tabs, ActionIcon, FileInput } from '@mantine/core';

/**
 * Secondary component theme overrides for VTB glass morphism design
 */

export const BadgeTheme = Badge.extend({
  styles: {
    root: {
      border: '1px solid rgba(0, 217, 255, 0.3)',
    },
  },
  defaultProps: {
    variant: 'light',
    color: 'cyan',
  },
  vars: (theme, props) => {
    if (props.variant === 'gradient') {
      return {
        root: {
          '--badge-bg': 'linear-gradient(135deg, #00D9FF 0%, #33E3FF 100%)',
          '--badge-color': '#0A1F44',
        },
      };
    }
    return {
      root: {},
    };
  },
});

export const CheckboxTheme = Checkbox.extend({
  styles: {
    input: {
      background: 'rgba(255, 255, 255, 0.1)',
      border: '2px solid rgba(255, 255, 255, 0.3)',
      cursor: 'pointer',
      '&:checked': {
        background: 'linear-gradient(135deg, #00D9FF 0%, #33E3FF 100%)',
        borderColor: '#00D9FF',
      },
      '&:hover': {
        borderColor: '#00D9FF',
      },
    },
    label: {
      color: '#ffffff',
      cursor: 'pointer',
    },
  },
  defaultProps: {
    color: 'cyan',
  },
});

export const CardTheme = Card.extend({
  classNames: {
    root: 'glass-card',
  },
  styles: {
    root: {
      color: '#ffffff',
    },
  },
  defaultProps: {
    shadow: 'xl',
    radius: 0,
  },
});

export const PaperTheme = Paper.extend({
  classNames: {
    root: 'glass-card',
  },
  styles: {
    root: {
      color: '#ffffff',
    },
  },
  defaultProps: {
    shadow: 'md',
    radius: 0,
  },
});

export const TabsTheme = Tabs.extend({
  styles: {
    root: {
      color: '#ffffff',
    },
    tab: {
      color: 'rgba(255, 255, 255, 0.7)',
      border: 'none',
      fontWeight: 500,
      transition: 'all 0.2s ease',
      '&:hover': {
        background: 'rgba(0, 217, 255, 0.1)',
        color: '#00D9FF',
      },
      '&[data-active="true"]': {
        color: '#00D9FF',
        borderColor: '#00D9FF',
        fontWeight: 600,
      },
    },
    tabLabel: {
      fontSize: '1rem',
    },
    panel: {
      color: '#ffffff',
      paddingTop: '1.5rem',
    },
  },
  defaultProps: {
    color: 'cyan',
    variant: 'default',
  },
});

export const ActionIconTheme = ActionIcon.extend({
  styles: {
    root: {
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      color: '#00D9FF',
      transition: 'all 0.3s ease',
      '&:hover': {
        background: 'rgba(0, 217, 255, 0.2)',
        borderColor: '#00D9FF',
        transform: 'scale(1.05)',
      },
    },
  },
  defaultProps: {
    color: 'cyan',
    variant: 'subtle',
  },
});

export const FileInputTheme = FileInput.extend({
  classNames: {
    input: 'glass-input',
  },
  styles: {
    input: {
      '&::placeholder': {
        color: 'rgba(255, 255, 255, 0.6)',
      },
    },
  },
  defaultProps: {
    size: 'md',
  },
});
