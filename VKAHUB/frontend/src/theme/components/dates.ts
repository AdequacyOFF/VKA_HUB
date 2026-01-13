import { DateInput, DateTimePicker, DatePickerInput } from '@mantine/dates';

/**
 * Date component theme overrides for VTB glass morphism design
 */

export const DateInputTheme = DateInput.extend({
  classNames: {
    input: 'glass-input',
  },
  styles: {
    calendar: {
      background: 'rgba(10, 31, 68, 0.95)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(0, 217, 255, 0.3)',
      borderRadius: '0px',
      boxShadow: '0 12px 48px rgba(0, 0, 0, 0.4)',
    },
    calendarHeader: {
      color: '#ffffff',
    },
    calendarHeaderControl: {
      color: '#00D9FF',
      '&:hover': {
        background: 'rgba(0, 217, 255, 0.1)',
      },
    },
    calendarHeaderLevel: {
      color: '#ffffff',
      fontWeight: 600,
      '&:hover': {
        background: 'rgba(0, 217, 255, 0.1)',
      },
    },
    monthCell: {
      color: '#ffffff',
      '&:hover': {
        background: 'rgba(0, 217, 255, 0.1)',
      },
      '&[data-selected="true"]': {
        background: 'rgba(0, 217, 255, 0.3)',
        color: '#00D9FF',
        fontWeight: 600,
      },
    },
    yearCell: {
      color: '#ffffff',
      '&:hover': {
        background: 'rgba(0, 217, 255, 0.1)',
      },
      '&[data-selected="true"]': {
        background: 'rgba(0, 217, 255, 0.3)',
        color: '#00D9FF',
        fontWeight: 600,
      },
    },
    day: {
      color: '#ffffff',
      '&:hover': {
        background: 'rgba(0, 217, 255, 0.1)',
      },
      '&[data-selected="true"]': {
        background: 'linear-gradient(135deg, #00D9FF 0%, #33E3FF 100%)',
        color: '#0A1F44',
        fontWeight: 700,
      },
      '&[data-weekend="true"]': {
        color: 'rgba(255, 255, 255, 0.7)',
      },
      '&[data-outside="true"]': {
        color: 'rgba(255, 255, 255, 0.3)',
      },
    },
  },
  defaultProps: {
    size: 'md',
  },
});

export const DateTimePickerTheme = DateTimePicker.extend({
  classNames: {
    input: 'glass-input',
  },
  styles: {
    calendar: {
      background: 'rgba(10, 31, 68, 0.95)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(0, 217, 255, 0.3)',
      borderRadius: '0px',
      boxShadow: '0 12px 48px rgba(0, 0, 0, 0.4)',
    },
    calendarHeader: {
      color: '#ffffff',
    },
    calendarHeaderControl: {
      color: '#00D9FF',
      '&:hover': {
        background: 'rgba(0, 217, 255, 0.1)',
      },
    },
    calendarHeaderLevel: {
      color: '#ffffff',
      fontWeight: 600,
      '&:hover': {
        background: 'rgba(0, 217, 255, 0.1)',
      },
    },
    day: {
      color: '#ffffff',
      '&:hover': {
        background: 'rgba(0, 217, 255, 0.1)',
      },
      '&[data-selected="true"]': {
        background: 'linear-gradient(135deg, #00D9FF 0%, #33E3FF 100%)',
        color: '#0A1F44',
        fontWeight: 700,
      },
      '&[data-weekend="true"]': {
        color: 'rgba(255, 255, 255, 0.7)',
      },
      '&[data-outside="true"]': {
        color: 'rgba(255, 255, 255, 0.3)',
      },
    },
    timeInput: {
      background: 'rgba(255, 255, 255, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      color: '#ffffff',
      '&:focus': {
        borderColor: '#00D9FF',
      },
    },
  },
  defaultProps: {
    size: 'md',
  },
});

export const DatePickerInputTheme = DatePickerInput.extend({
  classNames: {
    input: 'glass-input',
  },
  styles: {
    calendar: {
      background: 'rgba(10, 31, 68, 0.95)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(0, 217, 255, 0.3)',
      borderRadius: '0px',
      boxShadow: '0 12px 48px rgba(0, 0, 0, 0.4)',
    },
    calendarHeader: {
      color: '#ffffff',
    },
    calendarHeaderControl: {
      color: '#00D9FF',
      '&:hover': {
        background: 'rgba(0, 217, 255, 0.1)',
      },
    },
    calendarHeaderLevel: {
      color: '#ffffff',
      fontWeight: 600,
      '&:hover': {
        background: 'rgba(0, 217, 255, 0.1)',
      },
    },
    day: {
      color: '#ffffff',
      '&:hover': {
        background: 'rgba(0, 217, 255, 0.1)',
      },
      '&[data-selected="true"]': {
        background: 'linear-gradient(135deg, #00D9FF 0%, #33E3FF 100%)',
        color: '#0A1F44',
        fontWeight: 700,
      },
      '&[data-weekend="true"]': {
        color: 'rgba(255, 255, 255, 0.7)',
      },
      '&[data-outside="true"]': {
        color: 'rgba(255, 255, 255, 0.3)',
      },
    },
  },
  defaultProps: {
    size: 'md',
  },
});
