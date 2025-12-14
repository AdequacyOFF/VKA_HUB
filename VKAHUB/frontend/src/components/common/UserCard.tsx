import { Avatar, Badge, Group, Stack, Text } from '@mantine/core';
import { IconUser } from '@tabler/icons-react';
import { VTBCard } from './VTBCard';
import { useNavigate } from 'react-router-dom';

interface UserCardProps {
  id: number;
  firstName: string;
  lastName: string;
  middleName?: string;
  avatar?: string | null;
  studyGroup?: string;
  rank?: string;
  position?: string;
  roles?: string[];
  skills?: string[];
  variant?: 'default' | 'primary' | 'secondary' | 'accent';
  onClick?: () => void;
}

export function UserCard({
  id,
  firstName,
  lastName,
  middleName,
  avatar,
  studyGroup,
  rank,
  position,
  roles = [],
  skills = [],
  variant = 'default',
  onClick,
}: UserCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/users/${id}`);
    }
  };

  const fullName = [lastName, firstName, middleName].filter(Boolean).join(' ');

  // Ensure roles and skills are always arrays
  const safeRoles = Array.isArray(roles) ? roles : [];
  const safeSkills = Array.isArray(skills) ? skills : [];

  return (
    <VTBCard variant={variant} onClick={handleClick} style={{ cursor: 'pointer' }}>
      <Stack gap="md">
        <Group>
          <Avatar
            src={avatar}
            size="lg"
            radius="xl"
            className="vtb-avatar"
            style={{
              border: '3px solid var(--vtb-cyan)',
              boxShadow: '0 4px 16px rgba(0, 217, 255, 0.3)',
            }}
          >
            <IconUser size={32} color="var(--vtb-cyan)" />
          </Avatar>

          <Stack gap={4} style={{ flex: 1 }}>
            <Text fw={700} size="lg" c="white" lineClamp={1}>
              {fullName}
            </Text>

            {studyGroup && (
              <Text size="sm" c="dimmed">
                {studyGroup}
              </Text>
            )}

            {position && (
              <Text size="xs" c="var(--vtb-cyan)">
                {position}
              </Text>
            )}
          </Stack>
        </Group>

        {rank && (
          <Badge
            variant="light"
            color="cyan"
            size="md"
            style={{
              background: 'rgba(0, 217, 255, 0.2)',
              color: 'var(--vtb-cyan)',
              border: '1px solid var(--vtb-cyan)',
            }}
          >
            {rank}
          </Badge>
        )}

        {safeRoles.length > 0 && (
          <div>
            <Text size="xs" c="dimmed" mb={4}>
              Роли:
            </Text>
            <Group gap={4}>
              {safeRoles.slice(0, 3).map((role, index) => (
                <Badge
                  key={index}
                  size="xs"
                  variant="outline"
                  color="blue"
                  style={{
                    borderColor: 'var(--vtb-blue-light)',
                    color: 'var(--vtb-blue-light)',
                  }}
                >
                  {role}
                </Badge>
              ))}
              {safeRoles.length > 3 && (
                <Badge size="xs" variant="outline" color="gray">
                  +{safeRoles.length - 3}
                </Badge>
              )}
            </Group>
          </div>
        )}

        {safeSkills.length > 0 && (
          <div>
            <Text size="xs" c="dimmed" mb={4}>
              Навыки:
            </Text>
            <Group gap={4}>
              {safeSkills.slice(0, 3).map((skill, index) => (
                <Badge
                  key={index}
                  size="xs"
                  variant="light"
                  color="cyan"
                  style={{
                    background: 'rgba(0, 217, 255, 0.1)',
                    color: 'var(--vtb-cyan)',
                  }}
                >
                  {skill}
                </Badge>
              ))}
              {safeSkills.length > 3 && (
                <Badge size="xs" variant="outline" color="gray">
                  +{safeSkills.length - 3}
                </Badge>
              )}
            </Group>
          </div>
        )}
      </Stack>
    </VTBCard>
  );
}
