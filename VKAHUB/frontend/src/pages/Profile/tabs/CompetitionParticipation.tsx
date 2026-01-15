import { Stack, Title, Text, Group, Badge, Grid } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { IconTrophy, IconCalendar, IconUsers } from '@tabler/icons-react';
import { VTBCard } from '../../../components/common/VTBCard';
import { api } from '../../../api';
import { useAuthStore } from '../../../store/authStore';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { queryKeys } from '../../../api/queryKeys';

interface CompetitionParticipation {
  id: number;
  competition_id: number;
  competition_name: string;
  competition_type: string;
  team_name: string;
  applied_at: string;
  status: 'pending' | 'approved' | 'rejected';
  result?: string;
  report_submitted: boolean;
}

export function CompetitionParticipation() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  const { data: participations = [], isLoading } = useQuery<CompetitionParticipation[]>({
    queryKey: queryKeys.competitions.participations(user?.id),
    queryFn: async () => {
      const response = await api.get('/api/users/competition-participations');
      return response.data;
    },
    enabled: !!user?.id,
  });

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      pending: { color: 'yellow', label: 'На рассмотрении' },
      approved: { color: 'green', label: 'Одобрено' },
      rejected: { color: 'red', label: 'Отклонено' },
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <Badge variant="light" color={config.color} size="sm">
        {config.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Text c="white" ta="center">
        Загрузка...
      </Text>
    );
  }

  if (participations.length === 0) {
    return (
      <VTBCard variant="secondary">
        <Stack align="center" gap="md" py="xl">
          <IconTrophy size={64} color="var(--vtb-cyan)" opacity={0.5} />
          <div>
            <Title order={4} c="white" ta="center" mb="xs">
              Вы еще не участвовали в соревнованиях
            </Title>
            <Text c="dimmed" ta="center">
              Подайте заявку на участие в открытых соревнованиях
            </Text>
          </div>
        </Stack>
      </VTBCard>
    );
  }

  return (
    <Stack gap="xl">
      <Title order={3} c="white">
        Участие в соревнованиях
      </Title>

      <Grid gutter="lg">
        {participations.map((participation) => (
          <Grid.Col key={participation.id} span={{ base: 12, md: 6 }}>
            <VTBCard
              variant="primary"
              onClick={() => navigate(`/competitions/${participation.competition_id}`)}
              style={{ cursor: 'pointer', height: '100%' }}
            >
              <Stack gap="md">
                <Group justify="space-between" align="flex-start">
                  <IconTrophy size={32} color="var(--vtb-cyan)" />
                  {getStatusBadge(participation.status)}
                </Group>

                <div>
                  <Title order={4} c="white" mb="xs" lineClamp={1}>
                    {participation.competition_name}
                  </Title>
                  <Badge
                    variant="outline"
                    color="cyan"
                    size="sm"
                    mb="sm"
                    style={{
                      borderColor: 'var(--vtb-cyan)',
                      color: 'var(--vtb-cyan)',
                    }}
                  >
                    {participation.competition_type.toUpperCase()}
                  </Badge>
                </div>

                <Stack gap="xs">
                  <Group gap="xs">
                    <IconUsers size={16} color="var(--vtb-cyan)" />
                    <Text size="sm" c="white">
                      Команда: {participation.team_name}
                    </Text>
                  </Group>

                  <Group gap="xs">
                    <IconCalendar size={16} color="var(--vtb-cyan)" />
                    <Text size="sm" c="dimmed">
                      Подано: {dayjs(participation.applied_at).format('DD.MM.YYYY')}
                    </Text>
                  </Group>

                  {participation.result && (
                    <div>
                      <Text size="xs" c="dimmed" mb={4}>
                        Результат:
                      </Text>
                      <Badge
                        variant="light"
                        color="cyan"
                        size="lg"
                        style={{
                          background: 'rgba(0, 217, 255, 0.2)',
                          color: 'var(--vtb-cyan)',
                        }}
                      >
                        {participation.result}
                      </Badge>
                    </div>
                  )}

                  {participation.report_submitted ? (
                    <Badge variant="light" color="green" size="sm">
                      Отчет отправлен
                    </Badge>
                  ) : (
                    <Badge variant="light" color="gray" size="sm">
                      Отчет не отправлен
                    </Badge>
                  )}
                </Stack>
              </Stack>
            </VTBCard>
          </Grid.Col>
        ))}
      </Grid>
    </Stack>
  );
}
