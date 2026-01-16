import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Title, Grid, Stack, Avatar, Badge, Text, Group, ActionIcon } from '@mantine/core';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { IconUsers, IconCrown, IconUserPlus, IconFileText, IconTrophy, IconFlag, IconUserMinus } from '@tabler/icons-react';
import { VTBCard } from '../../components/common/VTBCard';
import { VTBButton } from '../../components/common/VTBButton';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { teamsApi } from '../../api';
import { queryKeys } from '../../api/queryKeys';
import { useAuthStore } from '../../store/authStore';
import { Team, TeamMember, TeamStatistics } from '../../types';
import { invalidateTeamQueries } from '../../utils/cacheInvalidation';

export function TeamDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const [joinModalOpened, setJoinModalOpened] = useState(false);
  const [removeMemberModalOpened, setRemoveMemberModalOpened] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null);

  const { data: team, isLoading, error } = useQuery<Team>({
    queryKey: queryKeys.teams.detail(id!),
    queryFn: async () => {
      if (!id) throw new Error('Team ID is required');
      return await teamsApi.getTeam(Number(id));
    },
    enabled: !!id,
  });

  const { data: statistics } = useQuery<TeamStatistics>({
    queryKey: queryKeys.teams.statistics(id!),
    queryFn: async () => {
      if (!id) throw new Error('Team ID is required');
      return await teamsApi.getTeamStatistics(Number(id));
    },
    enabled: !!id,
  });

  const joinMutation = useMutation({
    mutationFn: () => {
      if (!id) throw new Error('Team ID is required');
      return teamsApi.joinTeam(Number(id));
    },
    onSuccess: () => {
      // Use centralized invalidation - invalidates team data and user's team
      invalidateTeamQueries({ queryClient }, Number(id));

      notifications.show({
        title: 'Успех',
        message: 'Заявка на вступление отправлена',
        color: 'teal',
      });
      setJoinModalOpened(false);
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Ошибка',
        message: error?.response?.data?.detail || 'Не удалось отправить заявку',
        color: 'red',
      });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId: number) => {
      if (!id) throw new Error('Team ID is required');
      return teamsApi.removeMember(Number(id), userId);
    },
    onSuccess: () => {
      invalidateTeamQueries({ queryClient }, Number(id));

      notifications.show({
        title: 'Успех',
        message: 'Участник удален из команды',
        color: 'teal',
      });
      setRemoveMemberModalOpened(false);
      setMemberToRemove(null);
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Ошибка',
        message: error?.response?.data?.detail || 'Не удалось удалить участника',
        color: 'red',
      });
    },
  });

  if (isLoading) {
    return (
      <Container size="xl" py="xl">
        <Title order={3} c="white" ta="center">
          Загрузка...
        </Title>
      </Container>
    );
  }

  if (error || !team) {
    return (
      <Container size="xl" py="xl">
        <Title order={3} c="white" ta="center">
          Команда не найдена
        </Title>
      </Container>
    );
  }

  // Safe array access with defensive checks
  const safeMembers = Array.isArray(team.members) ? team.members : [];
  const isMember = safeMembers.some((member) => member.user_id === user?.id);
  const isCaptain = team.captain_id === user?.id;
  const captain = safeMembers.find((m) => m.user_id === team.captain_id);

  const pluralizeMembers = (count: number): string => {
    if (count % 10 === 1 && count % 100 !== 11) {
      return `${count} участник`;
    }
    if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) {
      return `${count} участника`;
    }
    return `${count} участников`;
  };

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <VTBCard variant="primary" style={{ position: 'relative' }}>
          {team.direction && (
            <Badge
              variant="light"
              color="cyan"
              size="lg"
              leftSection={<IconFlag size={16} color={'black'}/>}
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                zIndex: 10,
                background: 'rgba(0, 217, 255, 0.9)',
                color: '#0a1929',
                border: '1px solid var(--vtb-cyan)',
                fontWeight: 600,
              }}
            >
              {team.direction}
            </Badge>
          )}
          <Grid gutter="xl">
            <Grid.Col span={{ base: 12, md: 4 }}>
              {team.image_url ? (
                <img
                  src={team.image_url}
                  alt={team.name}
                  style={{
                    width: '100%',
                    height: 250,
                    objectFit: 'cover',
                    borderRadius: 16,
                    border: '2px solid var(--vtb-cyan)',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: 250,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, rgba(30, 76, 143, 0.5) 0%, rgba(37, 99, 184, 0.3) 100%)',
                    borderRadius: 16,
                    border: '2px solid var(--vtb-cyan)',
                  }}
                >
                  <IconUsers size={100} color="var(--vtb-cyan)" opacity={0.5} />
                </div>
              )}
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 8 }}>
              <Stack gap="lg">
                <div>
                  <Title order={1} c="white" mb="md">
                    {team.name}
                  </Title>
                  {team.description && (
                    <Text c="dimmed" size="md">
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
                    {pluralizeMembers(safeMembers.length)}
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

                {statistics && (
                  <Group gap="md">
                    <Badge
                      variant="light"
                      color="blue"
                      size="lg"
                      leftSection={<IconFlag size={16} />}
                      style={{
                        background: 'rgba(37, 99, 184, 0.2)',
                        color: '#2563b8',
                        border: '1px solid #2563b8',
                      }}
                    >
                      Участий: {statistics.competitions_participated}
                    </Badge>
                    <Badge
                      variant="light"
                      color="gold"
                      size="lg"
                      leftSection={<IconTrophy size={16} />}
                      style={{
                        background: 'rgba(255, 215, 0, 0.2)',
                        color: '#ffd700',
                        border: '1px solid #ffd700',
                      }}
                    >
                      Призов: {statistics.prizes_won}
                    </Badge>
                  </Group>
                )}

                <Group gap="md" mt="auto">
                  {!isMember && user && (
                    <VTBButton
                      leftSection={<IconUserPlus size={18} />}
                      onClick={() => setJoinModalOpened(true)}
                    >
                      Подать заявку
                    </VTBButton>
                  )}
                  <VTBButton
                    variant="secondary"
                    leftSection={<IconFileText size={18} />}
                    onClick={() => navigate(`/teams/${id}/reports`)}  
                  >
                    Отчеты
                  </VTBButton>
                  {isCaptain && (
                    <VTBButton
                      variant="secondary"
                      onClick={() => navigate(`/teams/${id}/edit`)}
                    >
                      Управление командой
                    </VTBButton>
                  )}
                </Group>
              </Stack>
            </Grid.Col>
          </Grid>
        </VTBCard>

        <VTBCard variant="secondary">
          <Title order={3} c="white" mb="lg">
            Участники команды
          </Title>
          {safeMembers.length === 0 ? (
            <Text c="dimmed" ta="center">
              Нет участников
            </Text>
          ) : (
            <Grid gutter="md">
              {safeMembers.map((member) => (
                <Grid.Col key={member.id} span={{ base: 12, sm: 6, md: 4 }}>
                  <div
                    className="glass-card"
                    style={{
                      padding: 16,
                      cursor: 'pointer',
                      position: 'relative',
                    }}
                    onClick={() => navigate(`/users/${member.user_id}`)}
                  >
                    <Group>
                      <Avatar
                        src={member.avatar}
                        size="lg"
                        radius="xl"
                        className="vtb-avatar"
                        style={{
                          border: '3px solid var(--vtb-cyan)',
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
                      {isCaptain && member.user_id !== team.captain_id && (
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          size="lg"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMemberToRemove(member);
                            setRemoveMemberModalOpened(true);
                          }}
                          style={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                          }}
                          title="Удалить участника"
                        >
                          <IconUserMinus size={18} />
                        </ActionIcon>
                      )}
                    </Group>
                  </div>
                </Grid.Col>
              ))}
            </Grid>
          )}
        </VTBCard>

        <ConfirmModal
          opened={joinModalOpened}
          onClose={() => setJoinModalOpened(false)}
          onConfirm={() => joinMutation.mutate()}
          title="Подать заявку в команду"
          message={`Вы уверены, что хотите подать заявку на вступление в команду "${team.name}"? Капитан команды рассмотрит вашу заявку.`}
          confirmText="Подать заявку"
          loading={joinMutation.isPending}
        />

        <ConfirmModal
          opened={removeMemberModalOpened}
          onClose={() => {
            setRemoveMemberModalOpened(false);
            setMemberToRemove(null);
          }}
          onConfirm={() => {
            if (memberToRemove) {
              removeMemberMutation.mutate(memberToRemove.user_id);
            }
          }}
          title="Удалить участника"
          message={`Вы уверены, что хотите удалить ${memberToRemove?.first_name} ${memberToRemove?.last_name} из команды?`}
          confirmText="Удалить"
          loading={removeMemberMutation.isPending}
          danger
        />
      </Stack>
    </Container>
  );
}
