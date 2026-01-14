import { TextInput, TextInputProps } from '@mantine/core';
import { forwardRef } from 'react';

interface ConsoleInputProps extends Omit<TextInputProps, 'leftSection'> {
  consolePath?: string;
}

export const ConsoleInput = forwardRef<HTMLInputElement, ConsoleInputProps>(
  function ConsoleInput({ consolePath = 'C:\\User\\input', classNames, styles, label, ...props }, ref) {
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
        <TextInput
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
          }}
        />
      </div>
    );
  }
);
