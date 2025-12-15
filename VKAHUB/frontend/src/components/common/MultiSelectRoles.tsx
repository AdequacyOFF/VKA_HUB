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
      placeholder="Выберите роли"
      maxDropdownHeight={300}
      {...props}
    />
  );
}
