import { PasswordInput, PasswordInputProps } from '@mantine/core';
import { forwardRef } from 'react';

interface ConsolePasswordInputProps extends Omit<PasswordInputProps, 'leftSection'> {
  consolePath?: string;
}

export const ConsolePasswordInput = forwardRef<HTMLInputElement, ConsolePasswordInputProps>(
  function ConsolePasswordInput({ consolePath = 'C:\\User\\password', classNames, styles, label, ...props }, ref) {
    return (
      <div>
        {label && (
          <div style={{ marginBottom: 4 }}>
            <span
              style={{
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '14px',
              }}
            >
              {label}
            </span>
          </div>
        )}
        <div
          style={{
            color: 'var(--vtb-cyan)',
            fontFamily: "'Courier New', 'Consolas', monospace",
            fontSize: '13px',
            fontWeight: 'bold',
            marginBottom: '4px',
            userSelect: 'none',
          }}
        >
          {consolePath} &gt;
        </div>
        <PasswordInput
          ref={ref}
          {...props}
          classNames={{
            ...classNames,
            input: `glass-input ${classNames?.input || ''}`,
          }}
          styles={{
            ...styles,
            input: {
              ...styles?.input,
            },
            label: {
              display: 'none',
              ...styles?.label,
            },
            visibilityToggle: {
              color: 'var(--vtb-cyan)',
              '&:hover': {
                backgroundColor: 'rgba(0, 217, 255, 0.1)',
              },
              ...styles?.visibilityToggle,
            },
          }}
        />
      </div>
    );
  }
);
