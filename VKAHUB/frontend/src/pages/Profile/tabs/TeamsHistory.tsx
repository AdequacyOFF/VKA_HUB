import { Stack, Title, Text, Group, Badge, Timeline } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { IconUsers, IconLogin, IconLogout } from '@tabler/icons-react';
import { VTBCard } from '../../../components/common/VTBCard';
import { api } from '../../../api';
import { useAuthStore } from '../../../store/authStore';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

interface TeamHistoryItem {
  id: number;
  team_id: number;
  team_name: string;
  joined_at: string;
  left_at?: string;
  was_captain: boolean;
}

export function TeamsHistory() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  const { data: history = [], isLoading } = useQuery<TeamHistoryItem[]>({
    queryKey: ['teams-history', user?.id],
    queryFn: async () => {
      const response = await api.get('/api/users/teams-history');
      return response.data;
    },
    enabled: !!user?.id,
  });

  if (isLoading) {
    return (
      <Text c="white" ta="center">
        Загрузка...
      </Text>
    );
  }

  if (history.length === 0) {
    return (
      <VTBCard variant="secondary">
        <Stack align="center" gap="md" py="xl">
          <IconUsers size={64} color="var(--vtb-cyan)" opacity={0.5} />
          <Text c="dimmed" ta="center">
            История команд пуста
          </Text>
        </Stack>
      </VTBCard>
    );
  }

  return (
    <Stack gap="xl">
      <Title order={3} c="white">
        История команд
      </Title>

      <VTBCard variant="primary">
        <Timeline
          active={history.length}
          bulletSize={32}
          lineWidth={2}
          color="cyan"
          styles={{
            itemBullet: {
              background: 'linear-gradient(135deg, var(--vtb-cyan) 0%, var(--vtb-cyan-light) 100%)',
              border: '2px solid var(--vtb-blue-dark)',
            },
            itemTitle: {
              color: '#ffffff',
              fontWeight: 700,
            },
          }}
        >
          {history.map((item) => (
            <Timeline.Item
              key={item.id}
              bullet={<IconUsers size={16} color="var(--vtb-blue-dark)" />}
              title={
                <Group gap="xs">
                  <Text
                    fw={700}
                    c="white"
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/teams/${item.team_id}`)}
                  >
                    {item.team_name}
                  </Text>
                  {item.was_captain && (
                    <Badge
                      variant="light"
                      color="yellow"
                      size="sm"
                      style={{
                        background: 'rgba(251, 191, 36, 0.2)',
                        color: '#fbbf24',
                      }}
                    >
                      Капитан
                    </Badge>
                  )}
                  {!item.left_at && (
                    <Badge
                      variant="light"
                      color="green"
                      size="sm"
                      style={{
                        background: 'rgba(34, 197, 94, 0.2)',
                        color: '#22c55e',
                      }}
                    >
                      Текущая команда
                    </Badge>
                  )}
                </Group>
              }
            >
              <Stack gap="xs" mt="xs">
                <Group gap="xs">
                  <IconLogin size={16} color="var(--vtb-cyan)" />
                  <Text size="sm" c="dimmed">
                    Вступил: {dayjs(item.joined_at).format('DD.MM.YYYY')}
                  </Text>
                </Group>
                {item.left_at && (
                  <Group gap="xs">
                    <IconLogout size={16} color="var(--vtb-cyan)" />
                    <Text size="sm" c="dimmed">
                      Покинул: {dayjs(item.left_at).format('DD.MM.YYYY')}
                    </Text>
                  </Group>
                )}
                {item.left_at && (
                  <Text size="xs" c="dimmed">
                    Продолжительность:{' '}
                    {dayjs(item.left_at).diff(dayjs(item.joined_at), 'day')} дней
                  </Text>
                )}
              </Stack>
            </Timeline.Item>
          ))}
        </Timeline>
      </VTBCard>
    </Stack>
  );
}
