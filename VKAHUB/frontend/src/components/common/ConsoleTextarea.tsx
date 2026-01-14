import { Textarea, TextareaProps } from '@mantine/core';
import { forwardRef } from 'react';

interface ConsoleTextareaProps extends TextareaProps {
  consolePath?: string;
}

export const ConsoleTextarea = forwardRef<HTMLTextAreaElement, ConsoleTextareaProps>(
  function ConsoleTextarea({ consolePath = 'C:\\User\\text', classNames, styles, label, ...props }, ref) {
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
        <Textarea
          ref={ref}
          {...props}
          classNames={{
            ...classNames,
            input: `glass-input ${classNames?.input || ''}`,
          }}
          styles={{
            ...styles,
            input: {
              minHeight: '100px',
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
