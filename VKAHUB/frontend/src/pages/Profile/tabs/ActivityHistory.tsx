import { Stack, Title, Text, Timeline, Badge } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import {
  IconFileText,
  IconUsers,
  IconTrophy,
  IconCertificate,
  IconSettings,
} from '@tabler/icons-react';
import { VTBCard } from '../../../components/common/VTBCard';
import { api } from '../../../api';
import { useAuthStore } from '../../../store/authStore';
import dayjs from 'dayjs';
import { queryKeys } from '../../../api/queryKeys';

interface ActivityLog {
  id: number;
  action_type: string;
  description: string;
  created_at: string;
  metadata?: Record<string, any>;
}

const ACTION_TYPES: Record<string, { icon: any; color: string; label: string }> = {
  certificate_upload: {
    icon: IconCertificate,
    color: 'cyan',
    label: 'Загрузка сертификата',
  },
  team_join: {
    icon: IconUsers,
    color: 'blue',
    label: 'Вступление в команду',
  },
  team_leave: {
    icon: IconUsers,
    color: 'gray',
    label: 'Выход из команды',
  },
  competition_apply: {
    icon: IconTrophy,
    color: 'yellow',
    label: 'Подача заявки на соревнование',
  },
  report_submit: {
    icon: IconFileText,
    color: 'green',
    label: 'Отправка отчета',
  },
  profile_update: {
    icon: IconSettings,
    color: 'violet',
    label: 'Обновление профиля',
  },
};

export function ActivityHistory() {
  const user = useAuthStore((state) => state.user);

  const { data: activities = [], isLoading } = useQuery<ActivityLog[]>({
    queryKey: queryKeys.users.activity(user?.id),
    queryFn: async () => {
      const response = await api.get('/api/users/activity-history');
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

  if (activities.length === 0) {
    return (
      <VTBCard variant="secondary">
        <Stack align="center" gap="md" py="xl">
          <IconFileText size={64} color="var(--vtb-cyan)" opacity={0.5} />
          <Text c="dimmed" ta="center">
            История активности пуста
          </Text>
        </Stack>
      </VTBCard>
    );
  }

  return (
    <Stack gap="xl">
      <Title order={3} c="white">
        История активности
      </Title>

      <VTBCard variant="primary">
        <Timeline
          active={activities.length}
          bulletSize={24}
          lineWidth={2}
          color="cyan"
          styles={{
            itemBullet: {
              background: 'var(--vtb-cyan)',
              border: '2px solid var(--vtb-blue-dark)',
            },
            itemTitle: {
              color: '#ffffff',
            },
          }}
        >
          {activities.map((activity) => {
            const config = ACTION_TYPES[activity.action_type] || {
              icon: IconFileText,
              color: 'gray',
              label: activity.action_type,
            };
            const Icon = config.icon;

            return (
              <Timeline.Item
                key={activity.id}
                bullet={<Icon size={14} color="var(--vtb-blue-dark)" />}
                title={
                  <Text fw={600} c="white" size="sm">
                    {activity.description}
                  </Text>
                }
              >
                <Stack gap="xs" mt="xs">
                  <Badge
                    variant="light"
                    color={config.color}
                    size="sm"
                    style={{ width: 'fit-content' }}
                  >
                    {config.label}
                  </Badge>
                  <Text size="xs" c="dimmed">
                    {dayjs(activity.created_at).format('DD.MM.YYYY HH:mm')}
                  </Text>
                  {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                    <Text size="xs" c="dimmed" style={{ fontStyle: 'italic' }}>
                      {JSON.stringify(activity.metadata, null, 2)}
                    </Text>
                  )}
                </Stack>
              </Timeline.Item>
            );
          })}
        </Timeline>
      </VTBCard>
    </Stack>
  );
}
