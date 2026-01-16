import { useState } from 'react';
import { Container, Title, Stack, Text, Grid, Select, LoadingOverlay, Skeleton } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { VTBCard } from '../../components/common/VTBCard';
import { VTBButton } from '../../components/common/VTBButton';
import { IconFileAnalytics, IconDownload } from '@tabler/icons-react';
import { moderatorApi, api } from '../../api';
import { queryKeys } from '../../api/queryKeys';
import { AnalyticsData } from '../../types';
import { notifications } from '@mantine/notifications';

const COLORS = ['#00D9FF', '#2563B8', '#1E4C8F', '#0A1F44', '#22c55e', '#fbbf24'];

export function ModeratorAnalytics() {
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const { data: analytics, isLoading, error } = useQuery<AnalyticsData>({
    queryKey: queryKeys.moderator.analytics(),
    queryFn: async () => {
      const response = await moderatorApi.getAnalytics();
      return response;
    },
  });

  const handleExport = async () => {
    if (!selectedPeriod) {
      notifications.show({
        title: 'Ошибка',
        message: 'Выберите период для экспорта',
        color: 'red',
      });
      return;
    }

    setExporting(true);
    try {
      const response = await api.get(`/api/moderator/analytics/export`, {
        params: { period: selectedPeriod },
        responseType: 'blob',
      });

      // Get filename from Content-Disposition header or generate default
      const contentDisposition = response.headers['content-disposition'];
      let filename = `prizovye_mesta_${selectedPeriod}_${Date.now()}.xlsx`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename=(.+)/);
        if (filenameMatch) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }

      // Create download link
      const url = window.URL.createObjectURL(
        new Blob([response.data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        })
      );
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      notifications.show({
        title: 'Успех',
        message: 'Отчет о призовых местах успешно экспортирован',
        color: 'teal',
      });
    } catch (error: any) {
      notifications.show({
        title: 'Ошибка',
        message: error?.response?.data?.detail || 'Не удалось экспортировать отчет',
        color: 'red',
      });
    } finally {
      setExporting(false);
    }
  };

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
                        itemStyle={{ color: '#ffffff' }}
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
              <Stack gap="lg" align="center" justify="center" style={{ minHeight: 300 }}>
                <IconFileAnalytics size={80} color="var(--vtb-cyan)" opacity={0.5} />
                <div style={{ textAlign: 'center', width: '100%', maxWidth: 400 }}>
                  <Title order={3} c="white" mb="xs">Экспорт призовых мест</Title>
                  <Text c="dimmed" mb="lg">Скачайте Excel-отчёт о командах, занявших призовые места в соревнованиях</Text>
                  <Stack gap="md">
                    <Select
                      placeholder="Выберите период"
                      data={[
                        { value: 'week', label: 'За неделю' },
                        { value: 'month', label: 'За месяц' },
                        { value: 'quarter', label: 'За квартал' },
                        { value: 'year', label: 'За год' },
                      ]}
                      value={selectedPeriod}
                      onChange={setSelectedPeriod}
                      classNames={{ input: 'glass-input' }}
                      styles={{
                        label: { color: '#ffffff', fontWeight: 600, marginBottom: 8 },
                      }}
                    />
                    <VTBButton
                      leftSection={<IconDownload size={18} />}
                      onClick={handleExport}
                      loading={exporting}
                      disabled={!selectedPeriod || exporting}
                      fullWidth
                    >
                      Экспортировать в Excel
                    </VTBButton>
                  </Stack>
                </div>
              </Stack>
            </VTBCard>
          </Grid.Col>
        </Grid>
      </Stack>
    </Container>
  );
}
