import { MultiSelect, MultiSelectProps } from '@mantine/core';
import { forwardRef } from 'react';

interface ConsoleMultiSelectProps extends Omit<MultiSelectProps, 'leftSection'> {
  consolePath?: string;
}

export const ConsoleMultiSelect = forwardRef<HTMLInputElement, ConsoleMultiSelectProps>(
  function ConsoleMultiSelect({ consolePath = 'C:\\User\\multiselect', classNames, styles, ...props }, ref) {
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
            maxWidth: 'calc(100% - 60px)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {consolePath} &gt;
        </span>
        <MultiSelect
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
          }}
        />
      </div>
    );
  }
);
