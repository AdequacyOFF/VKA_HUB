import { Select, SelectProps } from '@mantine/core';
import { forwardRef } from 'react';

interface ConsoleSelectProps extends Omit<SelectProps, 'leftSection'> {
  consolePath?: string;
}

export const ConsoleSelect = forwardRef<HTMLInputElement, ConsoleSelectProps>(
  function ConsoleSelect({ consolePath = 'C:\\User\\select', classNames, styles, label, ...props }, ref) {
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
        <Select
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
