import { MultiSelect, MultiSelectProps } from '@mantine/core';

const AVAILABLE_ROLES = [
  { value: 'backend', label: 'Backend' },
  { value: 'frontend', label: 'Frontend' },
  { value: 'devops', label: 'DevOps' },
  { value: 'devsecops', label: 'DevSecOps' },
  { value: 'secops', label: 'SecOps' },
  { value: 'ds', label: 'Data Science' },
  { value: 'ml', label: 'Machine Learning' },
  { value: 'qa', label: 'QA/Testing' },
  { value: 'ui_ux', label: 'UI/UX Design' },
  { value: 'mobile', label: 'Mobile Development' },
  { value: 'gamedev', label: 'Game Development' },
  { value: 'analytics', label: 'Analytics' },
  { value: 'pm', label: 'Product Manager' },
  { value: 'architect', label: 'Solution Architect' },
  { value: 'security_engineer', label: 'Security Engineer' },
  { value: 'security_analyst', label: 'Security Analyst' },
  { value: 'security_architect', label: 'Security Architect' },
  { value: 'security_researcher', label: 'Security Researcher' },
  { value: 'appsec', label: 'Application Security' },
  { value: 'cloud_security', label: 'Cloud Security' },
  { value: 'network_security', label: 'Network Security' },
  { value: 'iam', label: 'IAM Engineer' },
  { value: 'soc_analyst', label: 'SOC Analyst' },
  { value: 'incident_responder', label: 'Incident Responder' },
  { value: 'threat_hunter', label: 'Threat Hunter' },
  { value: 'threat_intelligence', label: 'Threat Intelligence Analyst' },
  { value: 'pentester', label: 'Pentester' },
  { value: 'red_team', label: 'Red Team' },
  { value: 'blue_team', label: 'Blue Team' },
  { value: 'malware_analyst', label: 'Malware Analyst' },
  { value: 'digital_forensics', label: 'Digital Forensics' },
  { value: 'grc', label: 'GRC Specialist' },
  { value: 'compliance', label: 'Compliance Specialist' },
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
