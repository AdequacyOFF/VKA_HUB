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
}

export function MultiSelectRoles({ customRoles = [], ...props }: MultiSelectRolesProps) {
  const allRoles = [...AVAILABLE_ROLES, ...customRoles];

  return (
    <MultiSelect
      data={allRoles}
      searchable
      clearable
      placeholder="Выберите роли"
      maxDropdownHeight={300}
      classNames={{
        input: 'glass-input',
      }}
      styles={{
        pill: {
          background: 'rgba(0, 217, 255, 0.2)',
          color: 'var(--vtb-cyan)',
          border: '1px solid var(--vtb-cyan)',
        },
        option: {
          color: '#ffffff',
          '&:hover': {
            background: 'rgba(0, 217, 255, 0.1)',
          },
          '&[data-combobox-selected="true"]': {
            background: 'rgba(0, 217, 255, 0.3)',
            color: 'var(--vtb-cyan)',
          },
        },
        dropdown: {
          background: 'rgba(10, 31, 68, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(0, 217, 255, 0.3)',
        },
      }}
      {...props}
    />
  );
}
