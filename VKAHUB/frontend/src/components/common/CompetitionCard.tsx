import { Badge, Group, Stack, Text, Image } from '@mantine/core';
import { IconCalendar, IconLink, IconTrophy } from '@tabler/icons-react';
import { VTBCard } from './VTBCard';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

interface CompetitionCardProps {
  id: number;
  name: string;
  type: string;
  description?: string;
  image?: string | null;
  link?: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  variant?: 'default' | 'primary' | 'secondary' | 'accent';
  onClick?: () => void;
}

export function CompetitionCard({
  id,
  name,
  type: competitionType,
  description,
  image,
  link,
  startDate,
  endDate,
  registrationDeadline,
  variant = 'default',
  onClick,
}: CompetitionCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/competitions/${id}`);
    }
  };

  const isRegistrationOpen = dayjs().isBefore(dayjs(registrationDeadline));
  const isOngoing = dayjs().isAfter(dayjs(startDate)) && dayjs().isBefore(dayjs(endDate));
  const isCompleted = dayjs().isAfter(dayjs(endDate));

  const getStatusBadge = () => {
    if (isCompleted) {
      return (
        <Badge color="gray" variant="light">
          Завершено
        </Badge>
      );
    }
    if (isOngoing) {
      return (
        <Badge color="green" variant="light">
          Идет сейчас
        </Badge>
      );
    }
    if (isRegistrationOpen) {
      return (
        <Badge
          variant="filled"
          style={{
            background: 'linear-gradient(135deg, var(--vtb-cyan) 0%, var(--vtb-cyan-light) 100%)',
            color: 'var(--vtb-blue-dark)',
          }}
        >
          Регистрация открыта
        </Badge>
      );
    }
    return (
      <Badge color="yellow" variant="light">
        Скоро начнется
      </Badge>
    );
  };

  const getTypeColor = (type: string | undefined) => {
    const types: Record<string, string> = {
      hackathon: 'cyan',
      ctf: 'red',
      other: 'blue',
    };
    return types[(type || 'other').toLowerCase()] || 'blue';
  };

  return (
    <VTBCard variant={variant} onClick={handleClick} style={{ cursor: 'pointer', height: '100%' }}>
      <Stack gap="md" h="100%">
        {image ? (
          <Image
            src={image}
            alt={name}
            height={180}
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
              height: 180,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, rgba(30, 76, 143, 0.5) 0%, rgba(37, 99, 184, 0.3) 100%)',
              borderRadius: 8,
              border: '2px solid var(--vtb-cyan)',
            }}
          >
            <IconTrophy size={80} color="var(--vtb-cyan)" opacity={0.5} />
          </div>
        )}

        <Stack gap="xs" style={{ flex: 1 }}>
          <Group justify="space-between" align="flex-start">
            <Text fw={700} size="xl" c="white" lineClamp={1} style={{ flex: 1 }}>
              {name}
            </Text>
            {getStatusBadge()}
          </Group>

          <Badge
            variant="outline"
            color={getTypeColor(competitionType)}
            size="sm"
            style={{
              borderColor: `var(--vtb-${getTypeColor(competitionType)})`,
              color: `var(--vtb-${getTypeColor(competitionType)})`,
              width: 'fit-content',
            }}
          >
            {(competitionType || 'other').toUpperCase()}
          </Badge>

          {description && (
            <Text size="sm" c="dimmed" lineClamp={2} style={{ minHeight: 40 }}>
              {description}
            </Text>
          )}

          <Stack gap="xs" mt="auto">
            <Group gap="xs">
              <IconCalendar size={16} color="var(--vtb-cyan)" />
              <Text size="xs" c="white">
                {dayjs(startDate).format('DD.MM.YYYY')} - {dayjs(endDate).format('DD.MM.YYYY')}
              </Text>
            </Group>

            <Group gap="xs">
              <IconCalendar size={16} color="var(--vtb-cyan)" />
              <Text size="xs" c="dimmed">
                Регистрация до: {dayjs(registrationDeadline).format('DD.MM.YYYY HH:mm')}
              </Text>
            </Group>

            {link && (
              <Group gap="xs">
                <IconLink size={16} color="var(--vtb-cyan)" />
                <Text
                  size="xs"
                  c="var(--vtb-cyan)"
                  style={{ textDecoration: 'underline', cursor: 'pointer' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(link, '_blank');
                  }}
                >
                  Подробнее
                </Text>
              </Group>
            )}
          </Stack>
        </Stack>
      </Stack>
    </VTBCard>
  );
}
