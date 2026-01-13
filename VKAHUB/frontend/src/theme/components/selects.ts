import { Select, MultiSelect } from '@mantine/core';

/**
 * Select and MultiSelect component theme overrides for VTB glass morphism design
 * Based on existing MultiSelectRoles and MultiSelectSkills styling patterns
 */

export const SelectTheme = Select.extend({
  classNames: {
    input: 'glass-input',
  },
  styles: {
    option: {
      color: '#ffffff',
      padding: '12px 16px',
      '&:hover': {
        background: 'rgba(0, 217, 255, 0.1)',
      },
      '&[data-combobox-selected="true"]': {
        background: 'rgba(0, 217, 255, 0.3)',
        color: '#00D9FF',
        fontWeight: 600,
      },
    },
    dropdown: {
      background: 'rgba(10, 31, 68, 0.95)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(0, 217, 255, 0.3)',
      borderRadius: '0px',
      boxShadow: '0 12px 48px rgba(0, 0, 0, 0.4)',
    },
  },
  defaultProps: {
    size: 'md',
  },
});

export const MultiSelectTheme = MultiSelect.extend({
  classNames: {
    input: 'glass-input',
  },
  styles: {
    pill: {
      background: 'rgba(0, 217, 255, 0.2)',
      color: '#00D9FF',
      border: '1px solid #00D9FF',
      fontWeight: 500,
    },
    pillsList: {
      gap: '8px',
    },
    option: {
      color: '#ffffff',
      padding: '12px 16px',
      '&:hover': {
        background: 'rgba(0, 217, 255, 0.1)',
      },
      '&[data-combobox-selected="true"]': {
        background: 'rgba(0, 217, 255, 0.3)',
        color: '#00D9FF',
        fontWeight: 600,
      },
    },
    dropdown: {
      background: 'rgba(10, 31, 68, 0.95)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(0, 217, 255, 0.3)',
      borderRadius: '0px',
      boxShadow: '0 12px 48px rgba(0, 0, 0, 0.4)',
    },
  },
  defaultProps: {
    size: 'md',
    searchable: true,
    clearable: true,
  },
});
