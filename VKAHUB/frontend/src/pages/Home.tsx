import { Stack, Title, Text, Group, Container, Grid, Box, Skeleton } from '@mantine/core';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  IconUsers,
  IconTrophy,
  IconUsersGroup,
  IconChartBar,
  IconCalendar,
  IconAward,
} from '@tabler/icons-react';
import { VTBCard } from '../components/common/VTBCard';
import { VTBButton } from '../components/common/VTBButton';
import { useAuthStore } from '../store/authStore';
import { publicApi } from '../api';

export function Home() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['public-stats'],
    queryFn: publicApi.getStats,
    staleTime: 60000,
  });

  return (
    <>
      {/* Hero Section */}
      <Box className="vtb-section" style={{ paddingTop: 60, paddingBottom: 60 }}>
        <Container size="xl" className="vtb-container">
          <Stack align="center" gap="xl">
            <div className="vtb-heading-hero" style={{ textAlign: 'center' }}>
              <div>
                <span style={{ color: '#ffffff' }}>VKA</span>
                <span className="vtb-gradient-text">HUB</span>
              </div>
              <div className="vtb-text-outline" style={{ fontSize: '0.6em', marginTop: -20 }}>
                hackathon
              </div>
            </div>

            <Text size="xl" c="white" ta="center" maw={700} fw={500}>
              Платформа для управления командами, соревнованиями и достижениями студентов
              Военной Академии
            </Text>

            <Group gap="lg" mt="md">
              {isAuthenticated ? (
                <>
                  <VTBButton
                    variant="primary"
                    size="lg"
                    onClick={() => navigate('/profile')}
                  >
                    Мой профиль
                  </VTBButton>
                  <VTBButton
                    variant="secondary"
                    size="lg"
                    onClick={() => navigate('/competitions')}
                  >
                    Соревнования
                  </VTBButton>
                </>
              ) : (
                <>
                  <VTBButton
                    variant="primary"
                    size="lg"
                    onClick={() => navigate('/auth/register')}
                  >
                    Регистрация завершена
                  </VTBButton>
                  <VTBButton
                    variant="secondary"
                    size="lg"
                    onClick={() => navigate('/auth/login')}
                  >
                    Войти
                  </VTBButton>
                </>
              )}
            </Group>
          </Stack>
        </Container>
      </Box>

      {/* Scrolling Banner */}
      <div className="vtb-scroll-banner">
        <div className="vtb-scroll-text">
          СОЗДАВАЙ КОМАНДЫ → УЧАСТВУЙ В ХАКАТОНАХ → СОРЕВНУЙСЯ В CTF → ПОЛУЧАЙ СЕРТИФИКАТЫ → VKA HUB → СОЗДАВАЙ КОМАНДЫ → УЧАСТВУЙ В ХАКАТОНАХ → СОРЕВНУЙСЯ В CTF → ПОЛУЧАЙ СЕРТИФИКАТЫ → VKA HUB →
        </div>
      </div>

      {/* Features Section */}
      <Box className="vtb-section">
        <Container size="xl" className="vtb-container">
          <Stack gap="xl">
            <div>
              <Title order={2} className="vtb-heading-section" ta="center" mb="md">
                Возможности платформы
              </Title>
              <Text size="lg" c="dimmed" ta="center" maw={800} mx="auto">
                Управляйте командами, участвуйте в соревнованиях и отслеживайте достижения
              </Text>
            </div>

            <Grid gutter="lg">
              <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                <VTBCard variant="primary" style={{ height: '100%' }}>
                  <Stack align="center" gap="md">
                    <div
                      style={{
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--vtb-cyan) 0%, var(--vtb-cyan-light) 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <IconUsersGroup size={40} color="var(--vtb-blue-dark)" />
                    </div>
                    <Text size="xl" fw={700} c="white" ta="center">
                      Команды
                    </Text>
                    <Text size="sm" c="dimmed" ta="center">
                      Создавайте команды, приглашайте участников и управляйте составом
                    </Text>
                    <VTBButton
                      variant="glass"
                      fullWidth
                      onClick={() => navigate('/teams')}
                      mt="auto"
                    >
                      Просмотр команд
                    </VTBButton>
                  </Stack>
                </VTBCard>
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                <VTBCard variant="accent" style={{ height: '100%' }}>
                  <Stack align="center" gap="md">
                    <div
                      style={{
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--vtb-cyan) 0%, var(--vtb-cyan-light) 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <IconTrophy size={40} color="var(--vtb-blue-dark)" />
                    </div>
                    <Text size="xl" fw={700} c="white" ta="center">
                      Соревнования
                    </Text>
                    <Text size="sm" c="dimmed" ta="center">
                      Участвуйте в хакатонах, CTF и других мероприятиях
                    </Text>
                    <VTBButton
                      variant="glass"
                      fullWidth
                      onClick={() => navigate('/competitions')}
                      mt="auto"
                    >
                      Обзор соревнований
                    </VTBButton>
                  </Stack>
                </VTBCard>
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                <VTBCard variant="secondary" style={{ height: '100%' }}>
                  <Stack align="center" gap="md">
                    <div
                      style={{
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--vtb-cyan) 0%, var(--vtb-cyan-light) 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <IconUsers size={40} color="var(--vtb-blue-dark)" />
                    </div>
                    <Text size="xl" fw={700} c="white" ta="center">
                      Участники
                    </Text>
                    <Text size="sm" c="dimmed" ta="center">
                      Найдите единомышленников с нужными навыками и опытом
                    </Text>
                    <VTBButton
                      variant="glass"
                      fullWidth
                      onClick={() => navigate('/users')}
                      mt="auto"
                    >
                      Все пользователи
                    </VTBButton>
                  </Stack>
                </VTBCard>
              </Grid.Col>
            </Grid>
          </Stack>
        </Container>
      </Box>

      {/* Stats Section */}
      <Box style={{ background: 'rgba(10, 31, 68, 0.5)', padding: '60px 0' }}>
        <Container size="xl" className="vtb-container">
          <Grid gutter="xl">
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Stack align="center" gap="xs">
                <IconUsers size={48} color="var(--vtb-cyan)" />
                {statsLoading ? (
                  <Skeleton height={48} width={80} />
                ) : (
                  <Text size="3rem" fw={700} c="white">
                    {stats?.totalUsers || 0}
                  </Text>
                )}
                <Text size="sm" c="dimmed" ta="center">
                  Активных участников
                </Text>
              </Stack>
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Stack align="center" gap="xs">
                <IconUsersGroup size={48} color="var(--vtb-cyan)" />
                {statsLoading ? (
                  <Skeleton height={48} width={80} />
                ) : (
                  <Text size="3rem" fw={700} c="white">
                    {stats?.totalTeams || 0}
                  </Text>
                )}
                <Text size="sm" c="dimmed" ta="center">
                  Команд создано
                </Text>
              </Stack>
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Stack align="center" gap="xs">
                <IconTrophy size={48} color="var(--vtb-cyan)" />
                {statsLoading ? (
                  <Skeleton height={48} width={80} />
                ) : (
                  <Text size="3rem" fw={700} c="white">
                    {stats?.totalCompetitions || 0}
                  </Text>
                )}
                <Text size="sm" c="dimmed" ta="center">
                  Соревнований проведено
                </Text>
              </Stack>
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Stack align="center" gap="xs">
                <IconAward size={48} color="var(--vtb-cyan)" />
                {statsLoading ? (
                  <Skeleton height={48} width={80} />
                ) : (
                  <Text size="3rem" fw={700} c="white">
                    {stats?.activeCompetitions || 0}
                  </Text>
                )}
                <Text size="sm" c="dimmed" ta="center">
                  Активных соревнований
                </Text>
              </Stack>
            </Grid.Col>
          </Grid>
        </Container>
      </Box>

      {/* Call to Action */}
      <Box className="vtb-section">
        <Container size="xl" className="vtb-container">
          <VTBCard variant="accent" style={{ padding: '60px 40px' }}>
            <Stack align="center" gap="xl">
              <Title order={2} className="vtb-heading-section" ta="center">
                Готовы начать?
              </Title>
              <Text size="lg" c="white" ta="center" maw={600}>
                Присоединяйтесь к платформе VKA HUB и начните участвовать в соревнованиях уже сегодня!
              </Text>
              <Group gap="lg">
                {!isAuthenticated && (
                  <>
                    <VTBButton
                      variant="primary"
                      size="xl"
                      onClick={() => navigate('/auth/register')}
                    >
                      Зарегистрироваться
                    </VTBButton>
                    <VTBButton
                      variant="secondary"
                      size="xl"
                      onClick={() => navigate('/auth/login')}
                    >
                      Уже есть аккаунт
                    </VTBButton>
                  </>
                )}
                {isAuthenticated && (
                  <>
                    <VTBButton
                      variant="primary"
                      size="xl"
                      onClick={() => navigate('/teams/create')}
                    >
                      Создать команду
                    </VTBButton>
                    <VTBButton
                      variant="secondary"
                      size="xl"
                      onClick={() => navigate('/competitions')}
                    >
                      Найти соревнование
                    </VTBButton>
                  </>
                )}
              </Group>
            </Stack>
          </VTBCard>
        </Container>
      </Box>
    </>
  );
}
