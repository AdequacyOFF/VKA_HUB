import { Container, Title, Stack, Text, Grid, Group, Avatar, Badge, ActionIcon } from '@mantine/core';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { IconArrowLeft, IconCheck, IconX, IconUserPlus } from '@tabler/icons-react';
import { VTBCard } from '../../components/common/VTBCard';
import { VTBButton } from '../../components/common/VTBButton';
import { api } from '../../api';
import dayjs from 'dayjs';
import { queryKeys } from '../../api/queryKeys';
import { invalidateTeamQueries } from '../../utils/cacheInvalidation';

interface JoinRequest {
  id: number;
  team_id: number;
  user_id: number;
  user_name?: string;
  user_avatar?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  first_name?: string;
  last_name?: string;
  study_group?: string;
}

export function TeamRequests() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: requests = [], isLoading } = useQuery<JoinRequest[]>({
    queryKey: queryKeys.teams.requests(id!),
    queryFn: async () => {
      try {
        const response = await api.get(`/api/teams/${id}/join-requests`);
        return Array.isArray(response.data) ? response.data : (response.data.items || []);
      } catch (error) {
        console.error('Failed to fetch join requests:', error);
        return [];
      }
    },
    enabled: !!id,
  });

  const approveMutation = useMutation({
    mutationFn: (requestId: number) =>
      api.post(`/api/teams/${id}/join-requests/${requestId}/approve`),
    onSuccess: () => {
      invalidateTeamQueries({ queryClient }, id);
      notifications.show({
        title: 'Успех',
        message: 'Заявка одобрена',
        color: 'teal',
      });
    },
    onError: (error: Error) => {
      notifications.show({
        title: 'Ошибка',
        message: (error as any).response?.data?.detail || 'Не удалось одобрить заявку',
        color: 'red',
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (requestId: number) =>
      api.post(`/api/teams/${id}/join-requests/${requestId}/reject`),
    onSuccess: () => {
      invalidateTeamQueries({ queryClient }, id);
      notifications.show({
        title: 'Успех',
        message: 'Заявка отклонена',
        color: 'teal',
      });
    },
    onError: (error: Error) => {
      notifications.show({
        title: 'Ошибка',
        message: (error as any).response?.data?.detail || 'Не удалось отклонить заявку',
        color: 'red',
      });
    },
  });

  const pendingRequests = requests.filter(r => r.status === 'pending');

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <div>
          <VTBButton
            variant="secondary"
            leftSection={<IconArrowLeft size={18} />}
            onClick={() => navigate(`/teams/${id}`)}
            mb="lg"
          >
            Назад к команде
          </VTBButton>
          <Title order={1} className="vtb-heading-hero">
            <span className="vtb-gradient-text">Заявки на вступление</span>
          </Title>
          <Text size="lg" c="dimmed" mt="md">
            Управление заявками на вступление в команду
          </Text>
        </div>

        {isLoading ? (
          <VTBCard variant="secondary">
            <Text c="white" ta="center">Загрузка...</Text>
          </VTBCard>
        ) : pendingRequests.length === 0 ? (
          <VTBCard variant="accent">
            <Stack align="center" gap="xl" py="xl">
              <IconUserPlus size={80} color="var(--vtb-cyan)" opacity={0.5} />
              <div>
                <Title order={3} c="white" ta="center" mb="xs">
                  Нет новых заявок
                </Title>
                <Text c="dimmed" ta="center">
                  Здесь будут отображаться заявки на вступление в команду
                </Text>
              </div>
            </Stack>
          </VTBCard>
        ) : (
          <Grid gutter="lg">
            {pendingRequests.map((request) => (
              <Grid.Col key={request.id} span={{ base: 12, sm: 6, md: 4 }}>
                <VTBCard variant="primary">
                  <Stack gap="md">
                    <Group>
                      <Avatar
                        src={request.user_avatar}
                        size="lg"
                        radius="xl"
                        style={{
                          border: '2px solid var(--vtb-cyan)',
                        }}
                      />
                      <Stack gap={4} style={{ flex: 1 }}>
                        <Text fw={600} c="white">
                          {request.first_name || request.user_name} {request.last_name || ''}
                        </Text>
                        {request.study_group && (
                          <Text size="sm" c="dimmed">
                            {request.study_group}
                          </Text>
                        )}
                        <Text size="xs" c="dimmed">
                          {dayjs(request.created_at).format('DD.MM.YYYY HH:mm')}
                        </Text>
                      </Stack>
                    </Group>

                    <Group grow>
                      <VTBButton
                        variant="primary"
                        size="sm"
                        leftSection={<IconCheck size={16} />}
                        onClick={() => approveMutation.mutate(request.id)}
                        loading={approveMutation.isPending}
                      >
                        Принять
                      </VTBButton>
                      <VTBButton
                        variant="secondary"
                        size="sm"
                        leftSection={<IconX size={16} />}
                        onClick={() => rejectMutation.mutate(request.id)}
                        loading={rejectMutation.isPending}
                        style={{
                          background: 'rgba(239, 68, 68, 0.2)',
                          borderColor: '#ef4444',
                        }}
                      >
                        Отклонить
                      </VTBButton>
                    </Group>
                  </Stack>
                </VTBCard>
              </Grid.Col>
            ))}
          </Grid>
        )}
      </Stack>
    </Container>
  );
}
