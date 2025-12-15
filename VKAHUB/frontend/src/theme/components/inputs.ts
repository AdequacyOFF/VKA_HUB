import { TextInput, PasswordInput, Textarea, NumberInput } from '@mantine/core';

/**
 * Input component theme overrides for VTB glass morphism design
 */

export const TextInputTheme = TextInput.extend({
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

export const PasswordInputTheme = PasswordInput.extend({
  classNames: {
    input: 'glass-input',
  },
  styles: {
    input: {
      '&::placeholder': {
        color: 'rgba(255, 255, 255, 0.6)',
      },
    },
    visibilityToggle: {
      color: '#00D9FF',
      '&:hover': {
        backgroundColor: 'rgba(0, 217, 255, 0.1)',
      },
    },
  },
  defaultProps: {
    size: 'md',
  },
});

export const TextareaTheme = Textarea.extend({
  classNames: {
    input: 'glass-input',
  },
  styles: {
    input: {
      minHeight: '100px',
      '&::placeholder': {
        color: 'rgba(255, 255, 255, 0.6)',
      },
    },
  },
  defaultProps: {
    size: 'md',
  },
});

export const NumberInputTheme = NumberInput.extend({
  classNames: {
    input: 'glass-input',
  },
  styles: {
    input: {
      '&::placeholder': {
        color: 'rgba(255, 255, 255, 0.6)',
      },
    },
    control: {
      color: '#00D9FF',
      border: 'none',
      '&:hover': {
        backgroundColor: 'rgba(0, 217, 255, 0.1)',
      },
    },
  },
  defaultProps: {
    size: 'md',
  },
});
