import { Container, Title, Stack, Text, Grid, Select, LoadingOverlay, Skeleton } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { VTBCard } from '../../components/common/VTBCard';
import { IconFileAnalytics } from '@tabler/icons-react';
import { moderatorApi } from '../../api';
import { AnalyticsData } from '../../types';

const COLORS = ['#00D9FF', '#2563B8', '#1E4C8F', '#0A1F44', '#22c55e', '#fbbf24'];

export function ModeratorAnalytics() {
  const { data: analytics, isLoading, error } = useQuery<AnalyticsData>({
    queryKey: ['moderator-analytics'],
    queryFn: async () => {
      const response = await moderatorApi.getAnalytics();
      return response;
    },
  });

  return (
    <Container size="xl" py="md">
      <Stack gap="xl">
        <div>
          <Title order={1} className="vtb-heading-hero" mb="xs">
            <span className="vtb-gradient-text">Аналитика и отчёты</span>
          </Title>
          <Text c="dimmed" size="lg">Статистика и визуализация данных платформы</Text>
        </div>

        {error && (
          <VTBCard variant="primary">
            <Text c="red" ta="center">Ошибка загрузки аналитики. Попробуйте обновить страницу.</Text>
          </VTBCard>
        )}

        <Grid gutter="lg">
          <Grid.Col span={{ base: 12, md: 6 }}>
            <VTBCard variant="primary" style={{ position: 'relative' }}>
              <LoadingOverlay visible={isLoading} overlayProps={{ blur: 2 }} />
              <Stack gap="lg">
                <div>
                  <Title order={3} c="white" mb="xs">Рост пользователей</Title>
                  <Text size="sm" c="dimmed">Динамика регистраций за последние 6 месяцев</Text>
                </div>
                {isLoading ? (
                  <Skeleton height={300} />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analytics?.userGrowth || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="month" stroke="#ffffff" />
                      <YAxis stroke="#ffffff" />
                      <Tooltip
                        contentStyle={{ background: '#0A1F44', border: '1px solid #00D9FF', borderRadius: 8 }}
                        labelStyle={{ color: '#ffffff' }}
                      />
                      <Line type="monotone" dataKey="users" stroke="#00D9FF" strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </Stack>
            </VTBCard>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6 }}>
            <VTBCard variant="primary" style={{ position: 'relative' }}>
              <LoadingOverlay visible={isLoading} overlayProps={{ blur: 2 }} />
              <Stack gap="lg">
                <div>
                  <Title order={3} c="white" mb="xs">Рост команд</Title>
                  <Text size="sm" c="dimmed">Динамика создания команд за последние 6 месяцев</Text>
                </div>
                {isLoading ? (
                  <Skeleton height={300} />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics?.teamStats || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="month" stroke="#ffffff" />
                      <YAxis stroke="#ffffff" />
                      <Tooltip
                        contentStyle={{ background: '#0A1F44', border: '1px solid #00D9FF', borderRadius: 8 }}
                        labelStyle={{ color: '#ffffff' }}
                      />
                      <Bar dataKey="teams" fill="#22c55e" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Stack>
            </VTBCard>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6 }}>
            <VTBCard variant="primary" style={{ position: 'relative' }}>
              <LoadingOverlay visible={isLoading} overlayProps={{ blur: 2 }} />
              <Stack gap="lg">
                <div>
                  <Title order={3} c="white" mb="xs">Типы соревнований</Title>
                  <Text size="sm" c="dimmed">Распределение по категориям</Text>
                </div>
                {isLoading ? (
                  <Skeleton height={300} />
                ) : analytics?.competitionTypes && analytics.competitionTypes.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analytics.competitionTypes}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => entry.name}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {analytics.competitionTypes.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: '#0A1F44', border: '1px solid #00D9FF', borderRadius: 8 }}
                        labelStyle={{ color: '#ffffff' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Stack align="center" justify="center" style={{ height: 300 }}>
                    <Text c="dimmed">Нет данных о соревнованиях</Text>
                  </Stack>
                )}
              </Stack>
            </VTBCard>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6 }}>
            <VTBCard variant="secondary">
              <Stack gap="lg" align="center" justify="center" style={{ height: 300 }}>
                <IconFileAnalytics size={80} color="var(--vtb-cyan)" opacity={0.5} />
                <div style={{ textAlign: 'center' }}>
                  <Title order={3} c="white" mb="xs">Экспорт отчётов</Title>
                  <Text c="dimmed" mb="lg">Скачайте детализированные отчёты о деятельности платформы</Text>
                  <Select
                    placeholder="Выберите период"
                    data={[
                      { value: 'week', label: 'За неделю' },
                      { value: 'month', label: 'За месяц' },
                      { value: 'quarter', label: 'За квартал' },
                      { value: 'year', label: 'За год' },
                    ]}
                    classNames={{ input: 'glass-input' }}
                  />
                </div>
              </Stack>
            </VTBCard>
          </Grid.Col>
        </Grid>
      </Stack>
    </Container>
  );
}
