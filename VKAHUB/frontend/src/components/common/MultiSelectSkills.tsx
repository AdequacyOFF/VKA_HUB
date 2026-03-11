import { MultiSelect, MultiSelectProps } from '@mantine/core';

const AVAILABLE_SKILLS = [
  // Programming Languages
  { value: 'python', label: 'Python', group: 'Языки программирования' },
  { value: 'javascript', label: 'JavaScript', group: 'Языки программирования' },
  { value: 'typescript', label: 'TypeScript', group: 'Языки программирования' },
  { value: 'java', label: 'Java', group: 'Языки программирования' },
  { value: 'csharp', label: 'C#', group: 'Языки программирования' },
  { value: 'cpp', label: 'C++', group: 'Языки программирования' },
  { value: 'go', label: 'Go', group: 'Языки программирования' },
  { value: 'rust', label: 'Rust', group: 'Языки программирования' },
  { value: 'php', label: 'PHP', group: 'Языки программирования' },
  { value: 'ruby', label: 'Ruby', group: 'Языки программирования' },
  { value: 'swift', label: 'Swift', group: 'Языки программирования' },
  { value: 'kotlin', label: 'Kotlin', group: 'Языки программирования' },

  // Frontend Frameworks
  { value: 'react', label: 'React', group: 'Frontend' },
  { value: 'vue', label: 'Vue.js', group: 'Frontend' },
  { value: 'angular', label: 'Angular', group: 'Frontend' },
  { value: 'svelte', label: 'Svelte', group: 'Frontend' },
  { value: 'nextjs', label: 'Next.js', group: 'Frontend' },

  // Backend Frameworks
  { value: 'django', label: 'Django', group: 'Backend' },
  { value: 'fastapi', label: 'FastAPI', group: 'Backend' },
  { value: 'flask', label: 'Flask', group: 'Backend' },
  { value: 'nodejs', label: 'Node.js', group: 'Backend' },
  { value: 'express', label: 'Express.js', group: 'Backend' },
  { value: 'nestjs', label: 'NestJS', group: 'Backend' },
  { value: 'spring', label: 'Spring Boot', group: 'Backend' },
  { value: 'dotnet', label: '.NET', group: 'Backend' },

  // Databases
  { value: 'postgresql', label: 'PostgreSQL', group: 'Базы данных' },
  { value: 'mysql', label: 'MySQL', group: 'Базы данных' },
  { value: 'mongodb', label: 'MongoDB', group: 'Базы данных' },
  { value: 'redis', label: 'Redis', group: 'Базы данных' },
  { value: 'elasticsearch', label: 'Elasticsearch', group: 'Базы данных' },

  // DevOps & Tools
  { value: 'docker', label: 'Docker', group: 'DevOps' },
  { value: 'kubernetes', label: 'Kubernetes', group: 'DevOps' },
  { value: 'git', label: 'Git', group: 'DevOps' },
  { value: 'linux', label: 'Linux', group: 'DevOps' },
  { value: 'ci_cd', label: 'CI/CD', group: 'DevOps' },
  { value: 'aws', label: 'AWS', group: 'DevOps' },
  { value: 'azure', label: 'Azure', group: 'DevOps' },
  { value: 'gcp', label: 'Google Cloud', group: 'DevOps' },
  { value: 'devsecops', label: 'DevSecOps', group: 'DevSecOps' },
  { value: 'secure_sdlc', label: 'Secure SDLC', group: 'DevSecOps' },
  { value: 'sast', label: 'SAST', group: 'DevSecOps' },
  { value: 'dast', label: 'DAST', group: 'DevSecOps' },
  { value: 'sca', label: 'SCA', group: 'DevSecOps' },
  { value: 'container_security', label: 'Container Security', group: 'DevSecOps' },
  { value: 'kubernetes_security', label: 'Kubernetes Security', group: 'DevSecOps' },
  { value: 'secrets_management', label: 'Secrets Management', group: 'DevSecOps' },

  // ML/DS
  { value: 'tensorflow', label: 'TensorFlow', group: 'ML/DS' },
  { value: 'pytorch', label: 'PyTorch', group: 'ML/DS' },
  { value: 'scikit_learn', label: 'Scikit-learn', group: 'ML/DS' },
  { value: 'pandas', label: 'Pandas', group: 'ML/DS' },
  { value: 'numpy', label: 'NumPy', group: 'ML/DS' },

  // Design
  { value: 'figma', label: 'Figma', group: 'Дизайн' },
  { value: 'sketch', label: 'Sketch', group: 'Дизайн' },
  { value: 'adobe_xd', label: 'Adobe XD', group: 'Дизайн' },

  // Cybersecurity
  { value: 'owasp', label: 'OWASP', group: 'Кибербезопасность' },
  { value: 'threat_modeling', label: 'Threat Modeling', group: 'Кибербезопасность' },
  { value: 'siem', label: 'SIEM', group: 'Кибербезопасность' },
  { value: 'soar', label: 'SOAR', group: 'Кибербезопасность' },
  { value: 'edr_xdr', label: 'EDR/XDR', group: 'Кибербезопасность' },
  { value: 'ids_ips', label: 'IDS/IPS', group: 'Кибербезопасность' },
  { value: 'waf', label: 'WAF', group: 'Кибербезопасность' },
  { value: 'vulnerability_assessment', label: 'Vulnerability Assessment', group: 'Кибербезопасность' },
  { value: 'vulnerability_management', label: 'Vulnerability Management', group: 'Кибербезопасность' },
  { value: 'penetration_testing', label: 'Penetration Testing', group: 'Кибербезопасность' },
  { value: 'incident_response', label: 'Incident Response', group: 'Кибербезопасность' },
  { value: 'threat_hunting', label: 'Threat Hunting', group: 'Кибербезопасность' },
  { value: 'threat_intelligence', label: 'Threat Intelligence', group: 'Кибербезопасность' },
  { value: 'malware_analysis', label: 'Malware Analysis', group: 'Кибербезопасность' },
  { value: 'digital_forensics', label: 'Digital Forensics', group: 'Кибербезопасность' },
  { value: 'reverse_engineering', label: 'Reverse Engineering', group: 'Кибербезопасность' },
  { value: 'osint', label: 'OSINT', group: 'Кибербезопасность' },
  { value: 'yara', label: 'YARA', group: 'Кибербезопасность' },
  { value: 'sigma', label: 'Sigma', group: 'Кибербезопасность' },
  { value: 'splunk', label: 'Splunk', group: 'Кибербезопасность' },
  { value: 'elastic_security', label: 'Elastic Security', group: 'Кибербезопасность' },
  { value: 'wireshark', label: 'Wireshark', group: 'Кибербезопасность' },
  { value: 'nmap', label: 'Nmap', group: 'Кибербезопасность' },
  { value: 'burp_suite', label: 'Burp Suite', group: 'Кибербезопасность' },
  { value: 'metasploit', label: 'Metasploit', group: 'Кибербезопасность' },
  { value: 'nessus', label: 'Nessus', group: 'Кибербезопасность' },
  { value: 'snort', label: 'Snort', group: 'Кибербезопасность' },
  { value: 'suricata', label: 'Suricata', group: 'Кибербезопасность' },
  { value: 'osquery', label: 'osquery', group: 'Кибербезопасность' },
  { value: 'pki_tls', label: 'PKI/TLS', group: 'Кибербезопасность' },
  { value: 'cryptography', label: 'Cryptography', group: 'Кибербезопасность' },
  { value: 'cloud_security', label: 'Cloud Security', group: 'Кибербезопасность' },
  { value: 'network_security', label: 'Network Security', group: 'Кибербезопасность' },
  { value: 'iam', label: 'IAM', group: 'Identity & Access' },
  { value: 'sso', label: 'SSO', group: 'Identity & Access' },
  { value: 'oauth2_oidc', label: 'OAuth2 / OIDC', group: 'Identity & Access' },
  { value: 'zero_trust', label: 'Zero Trust', group: 'Identity & Access' },
  { value: 'compliance', label: 'Compliance', group: 'Governance & Risk' },
];

interface MultiSelectSkillsProps extends Omit<MultiSelectProps, 'data'> {
  customSkills?: { value: string; label: string; group?: string }[];
  consolePath?: string;
}

export function MultiSelectSkills({ customSkills = [], consolePath = 'C:\\User\\skills', label, ...props }: MultiSelectSkillsProps) {
  // Group skills by category for Mantine v7
  const groupedSkills = () => {
    const allSkills = [...AVAILABLE_SKILLS, ...customSkills];
    const groups = new Map<string, { value: string; label: string }[]>();

    allSkills.forEach(skill => {
      const groupName = skill.group || 'Другое';
      if (!groups.has(groupName)) {
        groups.set(groupName, []);
      }
      groups.get(groupName)!.push({ value: skill.value, label: skill.label });
    });

    return Array.from(groups.entries()).map(([group, items]) => ({
      group,
      items,
    }));
  };

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
        data={groupedSkills()}
        placeholder="Выберите навыки"
        maxDropdownHeight={400}
        {...props}
        classNames={{
          ...props.classNames,
          input: `glass-input ${props.classNames?.input || ''}`,
        }}
        styles={{
          groupLabel: {
            color: 'var(--vtb-cyan)',
            fontWeight: 600,
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          },
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
