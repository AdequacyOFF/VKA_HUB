import { Avatar, Badge, Group, Stack, Text, Image } from '@mantine/core';
import { IconUsers } from '@tabler/icons-react';
import { VTBCard } from './VTBCard';
import { useNavigate } from 'react-router-dom';

interface TeamCardProps {
  id: number;
  name: string;
  description?: string;
  image?: string | null;
  variant?: 'default' | 'primary' | 'secondary' | 'accent';
  onClick?: () => void;
}

export function TeamCard({
  id,
  name,
  description,
  image,
  variant = 'default',
  onClick,
}: TeamCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/teams/${id}`);
    }
  };

  return (
    <VTBCard variant={variant} onClick={handleClick} style={{ cursor: 'pointer', height: '100%' }}>
      <Stack gap="md" h="100%">
        {image ? (
          <Image
            src={image}
            alt={name}
            height={160}
            radius="md"
            fit="cover"
            style={{
              border: '2px solid var(--vtb-cyan)',
              boxShadow: '0 4px 16px rgba(0, 217, 255, 0.2)',
            }}
          />
        ) : (
          <div
            style={{
              height: 160,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, rgba(30, 76, 143, 0.5) 0%, rgba(37, 99, 184, 0.3) 100%)',
              borderRadius: 8,
              border: '2px solid var(--vtb-cyan)',
            }}
          >
            <IconUsers size={64} color="var(--vtb-cyan)" opacity={0.5} />
          </div>
        )}

        <Stack gap="xs" style={{ flex: 1 }}>
          <Text fw={700} size="xl" c="white" lineClamp={1}>
            {name}
          </Text>

          {description && (
            <Text size="sm" c="dimmed" lineClamp={2} style={{ minHeight: 40 }}>
              {description}
            </Text>
          )}

        </Stack>
      </Stack>
    </VTBCard>
  );
}
