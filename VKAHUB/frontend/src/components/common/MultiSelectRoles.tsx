import { MultiSelect, MultiSelectProps } from '@mantine/core';

const AVAILABLE_ROLES = [
  { value: 'backend', label: 'Backend' },
  { value: 'frontend', label: 'Frontend' },
  { value: 'devops', label: 'DevOps' },
  { value: 'ds', label: 'Data Science' },
  { value: 'ml', label: 'Machine Learning' },
  { value: 'qa', label: 'QA/Testing' },
  { value: 'ui_ux', label: 'UI/UX Design' },
  { value: 'mobile', label: 'Mobile Development' },
  { value: 'gamedev', label: 'Game Development' },
  { value: 'analytics', label: 'Analytics' },
  { value: 'pm', label: 'Product Manager' },
  { value: 'architect', label: 'Solution Architect' },
];

interface MultiSelectRolesProps extends Omit<MultiSelectProps, 'data'> {
  customRoles?: { value: string; label: string }[];
  consolePath?: string;
}

export function MultiSelectRoles({ customRoles = [], consolePath = 'C:\\User\\roles', ...props }: MultiSelectRolesProps) {
  const allRoles = [...AVAILABLE_ROLES, ...customRoles];

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
        data={allRoles}
        placeholder="Выберите роли"
        maxDropdownHeight={300}
        {...props}
        classNames={{
          ...props.classNames,
          input: `glass-input ${props.classNames?.input || ''}`,
        }}
        styles={{
          ...props.styles,
          input: {
            paddingLeft: '12px',
            paddingTop: '24px',
            minHeight: '56px',
            ...props.styles?.input,
          },
          label: {
            color: '#ffffff',
            fontWeight: 600,
            marginBottom: 8,
            ...props.styles?.label,
          },
        }}
      />
    </div>
  );
}
