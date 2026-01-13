import { PasswordInput, PasswordInputProps } from '@mantine/core';
import { forwardRef } from 'react';

interface ConsolePasswordInputProps extends Omit<PasswordInputProps, 'leftSection'> {
  consolePath?: string;
}

export const ConsolePasswordInput = forwardRef<HTMLInputElement, ConsolePasswordInputProps>(
  function ConsolePasswordInput({ consolePath = 'C:\\User\\password', classNames, styles, ...props }, ref) {
    return (
      <div style={{ position: 'relative' }}>
        <span
          style={{
            position: 'absolute',
            top: props.label ? '38px' : '12px',
            left: '12px',
            color: 'var(--vtb-cyan)',
            fontFamily: "'Courier New', 'Consolas', monospace",
            fontSize: '13px',
            fontWeight: 'bold',
            whiteSpace: 'nowrap',
            userSelect: 'none',
            pointerEvents: 'none',
            zIndex: 2,
            maxWidth: 'calc(100% - 80px)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {consolePath} &gt;
        </span>
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
              paddingLeft: '12px',
              paddingTop: '24px',
              minHeight: '56px',
              ...styles?.input,
            },
            label: {
              color: '#ffffff',
              fontWeight: 600,
              marginBottom: 8,
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
