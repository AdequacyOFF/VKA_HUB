import { Stack, Title, Text, Badge, Group, Button, Card } from '@mantine/core';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { VTBCard } from '../../../components/common/VTBCard';
import { api } from '../../../api';
import { queryKeys } from '../../../api/queryKeys';
import { invalidateTeamQueries } from '../../../utils/cacheInvalidation';
import { IconUserPlus, IconSend, IconCheck, IconX } from '@tabler/icons-react';

interface TeamRequest {
  id: number;
  team_id: number;
  team_name: string;
  team_image: string | null;
  team_description: string | null;
  captain: {
    id: number;
    login: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  } | null;
  status: string;
  created_at: string;
  invited_by?: {
    id: number;
    login: string;
    first_name: string;
    last_name: string;
  };
}

interface TeamRequestsData {
  invitations: TeamRequest[];
  sent_requests: TeamRequest[];
}

export function TeamRequests() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<TeamRequestsData>({
    queryKey: queryKeys.users.teamRequests(),
    queryFn: async () => {
      const response = await api.get('/api/users/team-requests');
      return response.data;
    },
  });

  const approveMutation = useMutation({
    mutationFn: async ({ teamId, requestId }: { teamId: number; requestId: number }) => {
      return api.post(`/api/teams/${teamId}/join-requests/${requestId}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.teamRequests() });
      invalidateTeamQueries({ queryClient });
      notifications.show({
        title: 'Успех',
        message: 'Приглашение принято',
        color: 'teal',
      });
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Ошибка',
        message: error?.response?.data?.detail || 'Не удалось принять приглашение',
        color: 'red',
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ teamId, requestId }: { teamId: number; requestId: number }) => {
      return api.post(`/api/teams/${teamId}/join-requests/${requestId}/reject`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.teamRequests() });
      notifications.show({
        title: 'Успех',
        message: 'Приглашение отклонено',
        color: 'teal',
      });
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Ошибка',
        message: error?.response?.data?.detail || 'Не удалось отклонить приглашение',
        color: 'red',
      });
    },
  });

  if (isLoading) {
    return (
      <VTBCard variant="primary">
        <Text c="white" ta="center">
          Загрузка запросов...
        </Text>
      </VTBCard>
    );
  }

  if (error) {
    return (
      <VTBCard variant="primary">
        <Text c="red" ta="center">
          Ошибка загрузки запросов
        </Text>
      </VTBCard>
    );
  }

  const invitations = data?.invitations || [];
  const sentRequests = data?.sent_requests || [];

  return (
    <Stack gap="xl">
      {/* Incoming Invitations */}
      <div>
        <Title
          order={3}
          className="vtb-heading"
          mb="md"
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <IconUserPlus size={24} />
          <span className="vtb-gradient-text">Приглашения в команды</span>
        </Title>

        {invitations.length === 0 ? (
          <VTBCard variant="secondary">
            <Text c="dimmed" ta="center">
              У вас нет входящих приглашений
            </Text>
          </VTBCard>
        ) : (
          <Stack gap="md">
            {invitations.map((invitation) => (
              <Card
                key={invitation.id}
                padding="lg"
                radius="md"
                style={{
                  background: 'rgba(10, 31, 68, 0.6)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(0, 217, 255, 0.3)',
                }}
              >
                <Group justify="space-between" wrap="nowrap">
                  <div style={{ flex: 1 }}>
                    <Text size="lg" fw={600} c="white" mb={4}>
                      {invitation.team_name}
                    </Text>
                    {invitation.invited_by && (
                      <Text size="sm" c="dimmed">
                        Приглашение от{' '}
                        <span style={{ color: 'var(--vtb-cyan)' }}>
                          {invitation.invited_by.first_name} {invitation.invited_by.last_name}
                        </span>
                      </Text>
                    )}
                    <Text size="xs" c="dimmed" mt={4}>
                      {new Date(invitation.created_at).toLocaleDateString('ru-RU')}
                    </Text>
                  </div>
                  <Group gap="xs">
                    <Button
                      leftSection={<IconCheck size={16} />}
                      variant="gradient"
                      gradient={{ from: 'teal', to: 'cyan', deg: 135 }}
                      onClick={() =>
                        approveMutation.mutate({
                          teamId: invitation.team_id,
                          requestId: invitation.id,
                        })
                      }
                      loading={approveMutation.isPending}
                    >
                      Принять
                    </Button>
                    <Button
                      leftSection={<IconX size={16} />}
                      variant="light"
                      color="red"
                      onClick={() =>
                        rejectMutation.mutate({
                          teamId: invitation.team_id,
                          requestId: invitation.id,
                        })
                      }
                      loading={rejectMutation.isPending}
                    >
                      Отклонить
                    </Button>
                  </Group>
                </Group>
              </Card>
            ))}
          </Stack>
        )}
      </div>

      {/* Sent Requests */}
      <div>
        <Title
          order={3}
          className="vtb-heading"
          mb="md"
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <IconSend size={24} />
          <span className="vtb-gradient-text">Отправленные заявки</span>
        </Title>

        {sentRequests.length === 0 ? (
          <VTBCard variant="secondary">
            <Text c="dimmed" ta="center">
              У вас нет отправленных заявок
            </Text>
          </VTBCard>
        ) : (
          <Stack gap="md">
            {sentRequests.map((request) => (
              <Card
                key={request.id}
                padding="lg"
                radius="md"
                style={{
                  background: 'rgba(10, 31, 68, 0.6)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(0, 217, 255, 0.2)',
                }}
              >
                <Group justify="space-between" wrap="nowrap">
                  <div>
                    <Text size="lg" fw={600} c="white" mb={4}>
                      {request.team_name}
                    </Text>
                    {request.captain && (
                      <Text size="sm" c="dimmed">
                        Капитан:{' '}
                        <span style={{ color: 'var(--vtb-cyan)' }}>
                          {request.captain.first_name} {request.captain.last_name}
                        </span>
                      </Text>
                    )}
                    <Text size="xs" c="dimmed" mt={4}>
                      {new Date(request.created_at).toLocaleDateString('ru-RU')}
                    </Text>
                  </div>
                  <Badge color="yellow" variant="light" size="lg">
                    Ожидает
                  </Badge>
                </Group>
              </Card>
            ))}
          </Stack>
        )}
      </div>
    </Stack>
  );
}
