import { Container, Title, Grid, Stack, Text, Group, RingProgress } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import {
  IconUsers,
  IconUsersGroup,
  IconTrophy,
  IconFlag,
  IconCheck,
  IconClock,
  IconTrendingUp,
  IconActivity,
} from '@tabler/icons-react';
import { VTBCard } from '../../components/common/VTBCard';
import { moderatorApi } from '../../api/moderator';

interface PlatformStats {
  totalUsers: number;
  totalTeams: number;
  totalCompetitions: number;
  activeCompetitions: number;
  pendingReports: number;
  resolvedReports: number;
  newUsersThisMonth: number;
  newTeamsThisMonth: number;
  userGrowth: number;
  teamGrowth: number;
}

export function ModeratorDashboard() {
  const { data: stats, isLoading } = useQuery<PlatformStats>({
    queryKey: ['moderator-stats'],
    queryFn: async () => {
      const response = await moderatorApi.getStats();
      return {
        totalUsers: response.total_users ?? 0,
        totalTeams: response.total_teams ?? 0,
        totalCompetitions: response.total_competitions ?? 0,
        activeCompetitions: response.active_competitions ?? 0,
        pendingReports: response.pending_reports ?? 0,
        resolvedReports: response.resolved_reports ?? 0,
        newUsersThisMonth: response.new_users_this_month ?? 0,
        newTeamsThisMonth: response.new_teams_this_month ?? 0,
        userGrowth: response.user_growth ?? 0,
        teamGrowth: response.team_growth ?? 0,
      };
    },
  });

  if (isLoading || !stats) {
    return (
      <Container size="xl" py="xl">
        <Title order={3} c="white" ta="center">
          Загрузка...
        </Title>
      </Container>
    );
  }

  return (
    <Container size="xl" py="md">
      <Stack gap="xl">
        <div>
          <Title order={1} className="vtb-heading-hero" mb="xs">
            <span className="vtb-gradient-text">Панель управления</span>
          </Title>
          <Text c="dimmed" size="lg">
            Обзор статистики платформы
          </Text>
        </div>

        <Grid gutter="lg">
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <VTBCard variant="primary">
              <Stack gap="md">
                <Group justify="space-between">
                  <IconUsers size={32} color="var(--vtb-cyan)" />
                  <div style={{ textAlign: 'right' }}>
                    <Text size="xs" c="dimmed">Всего пользователей</Text>
                    <Text size="xl" fw={700} c="white">{stats.totalUsers}</Text>
                  </div>
                </Group>
                <Group gap="xs">
                  <IconTrendingUp size={16} color="#22c55e" />
                  <Text size="sm" c="#22c55e">+{stats.newUsersThisMonth} за месяц</Text>
                </Group>
              </Stack>
            </VTBCard>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <VTBCard variant="primary">
              <Stack gap="md">
                <Group justify="space-between">
                  <IconUsersGroup size={32} color="var(--vtb-cyan)" />
                  <div style={{ textAlign: 'right' }}>
                    <Text size="xs" c="dimmed">Всего команд</Text>
                    <Text size="xl" fw={700} c="white">{stats.totalTeams}</Text>
                  </div>
                </Group>
                <Group gap="xs">
                  <IconTrendingUp size={16} color="#22c55e" />
                  <Text size="sm" c="#22c55e">+{stats.newTeamsThisMonth} за месяц</Text>
                </Group>
              </Stack>
            </VTBCard>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <VTBCard variant="primary">
              <Stack gap="md">
                <Group justify="space-between">
                  <IconTrophy size={32} color="var(--vtb-cyan)" />
                  <div style={{ textAlign: 'right' }}>
                    <Text size="xs" c="dimmed">Соревнования</Text>
                    <Text size="xl" fw={700} c="white">{stats.totalCompetitions}</Text>
                  </div>
                </Group>
                <Group gap="xs">
                  <IconActivity size={16} color="var(--vtb-cyan)" />
                  <Text size="sm" c="var(--vtb-cyan)">{stats.activeCompetitions} активных</Text>
                </Group>
              </Stack>
            </VTBCard>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <VTBCard variant="primary">
              <Stack gap="md">
                <Group justify="space-between">
                  <IconFlag size={32} color="#fbbf24" />
                  <div style={{ textAlign: 'right' }}>
                    <Text size="xs" c="dimmed">Жалобы</Text>
                    <Text size="xl" fw={700} c="white">{stats.pendingReports + stats.resolvedReports}</Text>
                  </div>
                </Group>
                <Group gap="xs">
                  <IconClock size={16} color="#fbbf24" />
                  <Text size="sm" c="#fbbf24">{stats.pendingReports} ожидают</Text>
                </Group>
              </Stack>
            </VTBCard>
          </Grid.Col>
        </Grid>

        <Grid gutter="lg">
          <Grid.Col span={{ base: 12, md: 6 }}>
            <VTBCard variant="secondary">
              <Stack gap="lg">
                <Title order={3} c="white">Рост платформы</Title>

                <Grid gutter="xl">
                  <Grid.Col span={6}>
                    <Stack align="center" gap="md">
                      <RingProgress
                        size={120}
                        thickness={12}
                        sections={[
                          {
                            value: Math.min(stats.userGrowth * 8, 100),
                            color: 'var(--vtb-cyan)',
                          },
                        ]}
                        label={
                          <Text c="white" fw={700} ta="center" size="lg">
                            +{stats.userGrowth}%
                          </Text>
                        }
                      />
                      <div style={{ textAlign: 'center' }}>
                        <Text size="sm" c="dimmed">Рост пользователей</Text>
                        <Text size="xs" c="dimmed">за последний месяц</Text>
                      </div>
                    </Stack>
                  </Grid.Col>

                  <Grid.Col span={6}>
                    <Stack align="center" gap="md">
                      <RingProgress
                        size={120}
                        thickness={12}
                        sections={[
                          {
                            value: Math.min(stats.teamGrowth * 12, 100),
                            color: '#22c55e',
                          },
                        ]}
                        label={
                          <Text c="white" fw={700} ta="center" size="lg">
                            +{stats.teamGrowth}%
                          </Text>
                        }
                      />
                      <div style={{ textAlign: 'center' }}>
                        <Text size="sm" c="dimmed">Рост команд</Text>
                        <Text size="xs" c="dimmed">за последний месяц</Text>
                      </div>
                    </Stack>
                  </Grid.Col>
                </Grid>
              </Stack>
            </VTBCard>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6 }}>
            <VTBCard variant="secondary">
              <Stack gap="lg">
                <Title order={3} c="white">Статус жалоб</Title>

                <Stack gap="md">
                  <div
                    style={{
                      padding: 16,
                      background: 'rgba(251, 191, 36, 0.1)',
                      border: '1px solid #fbbf24',
                      borderRadius: 12,
                    }}
                  >
                    <Group justify="space-between">
                      <Group>
                        <IconClock size={24} color="#fbbf24" />
                        <div>
                          <Text fw={600} c="white">Ожидают рассмотрения</Text>
                          <Text size="sm" c="dimmed">Требуют внимания</Text>
                        </div>
                      </Group>
                      <Text size="xl" fw={700} c="#fbbf24">{stats.pendingReports}</Text>
                    </Group>
                  </div>

                  <div
                    style={{
                      padding: 16,
                      background: 'rgba(34, 197, 94, 0.1)',
                      border: '1px solid #22c55e',
                      borderRadius: 12,
                    }}
                  >
                    <Group justify="space-between">
                      <Group>
                        <IconCheck size={24} color="#22c55e" />
                        <div>
                          <Text fw={600} c="white">Рассмотрены</Text>
                          <Text size="sm" c="dimmed">Всего за всё время</Text>
                        </div>
                      </Group>
                      <Text size="xl" fw={700} c="#22c55e">{stats.resolvedReports}</Text>
                    </Group>
                  </div>
                </Stack>
              </Stack>
            </VTBCard>
          </Grid.Col>
        </Grid>

        <VTBCard variant="primary">
          <Stack gap="md">
            <Title order={3} c="white">Быстрые действия</Title>
            <Grid gutter="md">
              <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                <div
                  className="glass-card"
                  style={{
                    padding: 16,
                    cursor: 'pointer',
                    textAlign: 'center',
                  }}
                  onClick={() => window.location.href = '/moderator/users'}
                >
                  <IconUsers size={40} color="var(--vtb-cyan)" style={{ margin: '0 auto 8px' }} />
                  <Text c="white" fw={600}>Управление пользователями</Text>
                </div>
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                <div
                  className="glass-card"
                  style={{
                    padding: 16,
                    cursor: 'pointer',
                    textAlign: 'center',
                  }}
                  onClick={() => window.location.href = '/moderator/teams'}
                >
                  <IconUsersGroup size={40} color="var(--vtb-cyan)" style={{ margin: '0 auto 8px' }} />
                  <Text c="white" fw={600}>Управление командами</Text>
                </div>
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                <div
                  className="glass-card"
                  style={{
                    padding: 16,
                    cursor: 'pointer',
                    textAlign: 'center',
                  }}
                  onClick={() => window.location.href = '/moderator/competitions'}
                >
                  <IconTrophy size={40} color="var(--vtb-cyan)" style={{ margin: '0 auto 8px' }} />
                  <Text c="white" fw={600}>Управление соревнованиями</Text>
                </div>
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                <div
                  className="glass-card"
                  style={{
                    padding: 16,
                    cursor: 'pointer',
                    textAlign: 'center',
                  }}
                  onClick={() => window.location.href = '/moderator/reports'}
                >
                  <IconFlag size={40} color="#fbbf24" style={{ margin: '0 auto 8px' }} />
                  <Text c="white" fw={600}>Рассмотреть жалобы</Text>
                </div>
              </Grid.Col>
            </Grid>
          </Stack>
        </VTBCard>
      </Stack>
    </Container>
  );
}
