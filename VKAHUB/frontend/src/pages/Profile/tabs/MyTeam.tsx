import { useState } from 'react';
import { Stack, Title, Text, Group, Avatar, Badge, Grid, ActionIcon } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { IconUsers, IconCrown, IconLogout, IconSettings, IconUserPlus, IconFileText } from '@tabler/icons-react';
import { VTBCard } from '../../../components/common/VTBCard';
import { VTBButton } from '../../../components/common/VTBButton';
import { ConfirmModal } from '../../../components/common/ConfirmModal';
import { api } from '../../../api';
import { useAuthStore } from '../../../store/authStore';
import { Team, TeamMember } from '../../../types';
import { navigateWithHistory } from '../../../utils/navigation';
import { queryKeys } from '../../../api/queryKeys';
import { invalidateTeamQueries, invalidateUserQueries } from '../../../utils/cacheInvalidation';

export function MyTeam() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'my-team';
  const [leaveModalOpened, setLeaveModalOpened] = useState(false);
  const [captainChangeModalOpened, setCaptainChangeModalOpened] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  const { data: teams, isLoading } = useQuery<Team[]>({
    queryKey: queryKeys.teams.myTeam(user?.id),
    queryFn: async () => {
      try {
        const response = await api.get('/api/users/my-team');
        return response.data || [];
      } catch (error: any) {
        if (error.response?.status === 404) {
          return [];
        }
        throw error;
      }
    },
    enabled: !!user?.id,
  });

  const leaveMutation = useMutation({
    mutationFn: () => api.post(`/api/teams/${selectedTeam?.id}/leave`),
    onSuccess: () => {
      invalidateTeamQueries({ queryClient }, selectedTeam?.id);
      invalidateUserQueries({ queryClient }, user?.id);
      notifications.show({
        title: 'Успех',
        message: 'Вы покинули команду',
        color: 'teal',
      });
      setLeaveModalOpened(false);
      setSelectedTeam(null);
    },
    onError: () => {
      notifications.show({
        title: 'Ошибка',
        message: 'Не удалось покинуть команду',
        color: 'red',
      });
    },
  });

  const requestCaptainChangeMutation = useMutation({
    mutationFn: () => api.post(`/api/teams/${selectedTeam?.id}/request-captain-change`),
    onSuccess: () => {
      notifications.show({
        title: 'Успех',
        message: 'Запрос на смену капитана отправлен модераторам',
        color: 'teal',
      });
      setCaptainChangeModalOpened(false);
      setSelectedTeam(null);
    },
    onError: () => {
      notifications.show({
        title: 'Ошибка',
        message: 'Не удалось отправить запрос',
        color: 'red',
      });
    },
  });

  if (isLoading) {
    return (
      <Text c="white" ta="center">
        Загрузка...
      </Text>
    );
  }

  if (!teams || teams.length === 0) {
    return (
      <VTBCard variant="accent">
        <Stack align="center" gap="xl" py="xl">
          <IconUsers size={80} color="var(--vtb-cyan)" opacity={0.5} />
          <div>
            <Title order={3} c="white" ta="center" mb="xs">
              Вы не состоите ни в одной команде
            </Title>
            <Text c="dimmed" ta="center">
              Создайте свою команду или присоединитесь к существующей
            </Text>
          </div>
          <Group gap="lg">
            <VTBButton
              variant="primary"
              size="lg"
              onClick={() => navigateWithHistory(navigate, '/teams/create', currentTab)}
            >
              Создать команду
            </VTBButton>
            <VTBButton
              variant="secondary"
              size="lg"
              onClick={() => navigateWithHistory(navigate, '/teams', currentTab)}
            >
              Просмотреть все команды
            </VTBButton>
          </Group>
        </Stack>
      </VTBCard>
    );
  }

  return (
    <Stack gap="xl">
      {teams.map((team) => {
        const isCaptain = team.captain_id === user?.id;
        const safeMembers = Array.isArray(team.members) ? team.members : [];
        const captain = safeMembers.find((m) => m.user_id === team.captain_id);

        return (
          <Stack key={team.id} gap="md">
            <Group justify="space-between">
              <Title order={3} c="white">
                {team.name}
              </Title>
              <Group gap="sm">
                {isCaptain && (
                  <>
                    <VTBButton
                      variant="secondary"
                      leftSection={<IconSettings size={18} />}
                      onClick={() => navigateWithHistory(navigate, `/teams/${team.id}/edit`, currentTab)}
                    >
                      Управление
                    </VTBButton>
                    <VTBButton
                      variant="secondary"
                      leftSection={<IconUserPlus size={18} />}
                      onClick={() => navigateWithHistory(navigate, `/teams/${team.id}/requests`, currentTab)}
                    >
                      Заявки ({team.join_requests?.length || 0})
                    </VTBButton>
                  </>
                )}
                {!isCaptain && (
                  <VTBButton
                    variant="secondary"
                    leftSection={<IconCrown size={18} />}
                    onClick={() => {
                      setSelectedTeam(team);
                      setCaptainChangeModalOpened(true);
                    }}
                  >
                    Запросить капитанство
                  </VTBButton>
                )}
                <VTBButton
                  variant="secondary"
                  leftSection={<IconLogout size={18} />}
                  onClick={() => {
                    setSelectedTeam(team);
                    setLeaveModalOpened(true);
                  }}
                  style={{
                    background: 'rgba(239, 68, 68, 0.3)',
                    borderColor: '#ef4444',
                  }}
                >
                  Покинуть команду
                </VTBButton>
              </Group>
            </Group>

            <VTBCard variant="primary">
              <Grid gutter="xl">
                <Grid.Col span={{ base: 12, md: 4 }}>
                  {team.image ? (
                    <img
                      src={team.image}
                      alt={team.name}
                      style={{
                        width: '100%',
                        height: 200,
                        objectFit: 'cover',
                        borderRadius: 16,
                        border: '2px solid var(--vtb-cyan)',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: 200,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'linear-gradient(135deg, rgba(30, 76, 143, 0.5) 0%, rgba(37, 99, 184, 0.3) 100%)',
                        borderRadius: 16,
                        border: '2px solid var(--vtb-cyan)',
                      }}
                    >
                      <IconUsers size={80} color="var(--vtb-cyan)" opacity={0.5} />
                    </div>
                  )}
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 8 }}>
                  <Stack gap="md">
                    <div>
                      <Title order={2} c="white" mb="xs">
                        {team.name}
                      </Title>
                      {team.description && (
                        <Text c="dimmed" size="sm">
                          {team.description}
                        </Text>
                      )}
                    </div>

                    <Group gap="md">
                      <Badge
                        variant="light"
                        color="cyan"
                        size="lg"
                        leftSection={<IconUsers size={16} />}
                        style={{
                          background: 'rgba(0, 217, 255, 0.2)',
                          color: 'var(--vtb-cyan)',
                          border: '1px solid var(--vtb-cyan)',
                        }}
                      >
                        {safeMembers.length} участников
                      </Badge>
                      {captain && (
                        <Badge
                          variant="light"
                          color="yellow"
                          size="lg"
                          leftSection={<IconCrown size={16} />}
                          style={{
                            background: 'rgba(251, 191, 36, 0.2)',
                            color: '#fbbf24',
                            border: '1px solid #fbbf24',
                          }}
                        >
                          Капитан: {captain.first_name} {captain.last_name}
                        </Badge>
                      )}
                    </Group>

                    <Group gap="sm" mt="auto">
                      {isCaptain && (
                        <VTBButton
                          variant="glass"
                          leftSection={<IconFileText size={18} />}
                          onClick={() => navigateWithHistory(navigate, `/teams/${team.id}/reports`, currentTab)}
                        >
                          Отчеты
                        </VTBButton>
                      )}
                    </Group>
                  </Stack>
                </Grid.Col>
              </Grid>
            </VTBCard>

            <VTBCard variant="secondary">
              <Title order={4} c="white" mb="lg">
                Участники команды
              </Title>
              <Grid gutter="md">
                {safeMembers.map((member) => (
                  <Grid.Col key={member.id} span={{ base: 12, sm: 6, md: 4 }}>
                    <div
                      className="glass-card"
                      style={{
                        padding: 16,
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                      }}
                      onClick={() => navigate(`/users/${member.user_id}`)}
                    >
                      <Group>
                        <Avatar
                          src={member.avatar}
                          size="md"
                          radius="xl"
                          className="vtb-avatar"
                          style={{
                            border: '2px solid var(--vtb-cyan)',
                          }}
                        />
                        <Stack gap={4} style={{ flex: 1 }}>
                          <Group gap="xs">
                            <Text fw={600} c="white" size="sm">
                              {member.first_name} {member.last_name}
                            </Text>
                            {member.user_id === team.captain_id && (
                              <IconCrown size={16} color="#fbbf24" />
                            )}
                          </Group>
                          {member.position && (
                            <Text size="xs" c="dimmed">
                              {member.position}
                            </Text>
                          )}
                        </Stack>
                      </Group>
                    </div>
                  </Grid.Col>
                ))}
              </Grid>
            </VTBCard>
          </Stack>
        );
      })}

      <ConfirmModal
        opened={leaveModalOpened}
        onClose={() => {
          setLeaveModalOpened(false);
          setSelectedTeam(null);
        }}
        onConfirm={() => leaveMutation.mutate()}
        title="Покинуть команду"
        message={
          selectedTeam?.captain_id === user?.id
            ? 'Вы являетесь капитаном команды. После выхода капитаном станет другой участник или команда будет расформирована. Вы уверены?'
            : 'Вы уверены, что хотите покинуть команду?'
        }
        confirmText="Покинуть"
        loading={leaveMutation.isPending}
        danger
      />

      <ConfirmModal
        opened={captainChangeModalOpened}
        onClose={() => {
          setCaptainChangeModalOpened(false);
          setSelectedTeam(null);
        }}
        onConfirm={() => requestCaptainChangeMutation.mutate()}
        title="Запрос на смену капитана"
        message="Ваш запрос будет отправлен модераторам для рассмотрения. Вы уверены?"
        confirmText="Отправить запрос"
        loading={requestCaptainChangeMutation.isPending}
      />
    </Stack>
  );
}
