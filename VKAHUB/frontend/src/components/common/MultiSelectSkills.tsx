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
];

interface MultiSelectSkillsProps extends Omit<MultiSelectProps, 'data'> {
  customSkills?: { value: string; label: string; group?: string }[];
}

export function MultiSelectSkills({ customSkills = [], ...props }: MultiSelectSkillsProps) {
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
    <MultiSelect
      data={groupedSkills()}
      placeholder="Выберите навыки"
      maxDropdownHeight={400}
      styles={{
        groupLabel: {
          color: 'var(--vtb-cyan)',
          fontWeight: 600,
          fontSize: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        },
      }}
      {...props}
    />
  );
}
