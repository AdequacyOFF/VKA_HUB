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

export function MultiSelectRoles({ customRoles = [], consolePath = 'C:\\User\\roles', label, ...props }: MultiSelectRolesProps) {
  const allRoles = [...AVAILABLE_ROLES, ...customRoles];

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
            ...props.styles?.input,
          },
          label: {
            display: 'none',
            ...props.styles?.label,
          },
        }}
      />
    </div>
  );
}
