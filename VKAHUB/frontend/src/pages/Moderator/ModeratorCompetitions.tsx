import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Title, Stack, Table, Badge, Group, ActionIcon, Text, Modal, Tooltip } from '@mantine/core';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { IconTrash, IconPlus, IconFileText } from '@tabler/icons-react';
import { VTBCard } from '../../components/common/VTBCard';
import { VTBButton } from '../../components/common/VTBButton';
import { ConsoleInput } from '../../components/common/ConsoleInput';
import { notifications } from '@mantine/notifications';
import { competitionsApi, api } from '../../api';
import { queryKeys } from '../../api/queryKeys';
import { Competition } from '../../types';
import dayjs from 'dayjs';
import { invalidateCompetitionQueries, invalidateModeratorQueries } from '../../utils/cacheInvalidation';

interface CompetitionReport {
  id: number;
  team_name: string;
  git_link: string;
  presentation_url: string;
  brief_summary: string;
  placement: number | null;
  submitted_at: string;
}

export function ModeratorCompetitions() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedCompId, setSelectedCompId] = useState<number | null>(null);
  const [reportsModalOpened, setReportsModalOpened] = useState(false);

  const { data: competitions, isLoading, error } = useQuery<Competition[]>({
    queryKey: queryKeys.moderator.competitions(),
    queryFn: async () => {
      try {
        const response = await competitionsApi.getCompetitions({ limit: 100 });
        return Array.isArray(response.items) ? response.items : [];
      } catch (error) {
        console.error('Failed to fetch competitions:', error);
        return [];
      }
    },
  });

  const { data: competitionReports, isLoading: reportsLoading } = useQuery<{ reports: CompetitionReport[], competition_name: string }>({
    queryKey: queryKeys.competitions.reports(selectedCompId!),
    queryFn: async () => {
      if (!selectedCompId) return { reports: [], competition_name: '' };
      const response = await api.get(`/api/competitions/${selectedCompId}/reports`);
      return response.data;
    },
    enabled: !!selectedCompId && reportsModalOpened,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/competitions/${id}`),
    onSuccess: () => {
      // Invalidate both moderator view and public competitions list
      invalidateModeratorQueries({ queryClient });
      invalidateCompetitionQueries({ queryClient });

      notifications.show({ title: 'Успех', message: 'Соревнование удалено', color: 'teal' });
    },
    onError: (error: { response?: { data?: { detail?: string } } }) => {
      notifications.show({
        title: 'Ошибка',
        message: error?.response?.data?.detail || 'Не удалось удалить соревнование',
        color: 'red',
      });
    },
  });

  const handleViewReports = (compId: number) => {
    setSelectedCompId(compId);
    setReportsModalOpened(true);
  };

  // Safe array filtering
  const safeComps = Array.isArray(competitions) ? competitions : [];
  const filteredComps = safeComps.filter((comp) =>
    (comp.name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Container size="xl" py="md">
      <Stack gap="xl">
        <Group justify="space-between">
          <div>
            <Title order={1} className="vtb-heading-hero" mb="xs">
              <span className="vtb-gradient-text">Управление соревнованиями</span>
            </Title>
            <Text c="white" size="lg">Создание и модерация соревнований</Text>
          </div>
          <VTBButton leftSection={<IconPlus size={18} />} onClick={() => navigate('/moderator/competitions/create')}>
            Создать соревнование
          </VTBButton>
        </Group>

        <VTBCard variant="secondary">
          <ConsoleInput
            placeholder="Поиск соревнований..."
            consolePath="C:\Moderator\Competitions\search"
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            size="md"
          />
        </VTBCard>

        <VTBCard variant="primary">
          {isLoading ? (
            <Text c="white" ta="center">Загрузка...</Text>
          ) : error ? (
            <Text c="red" ta="center">Ошибка загрузки соревнований</Text>
          ) : filteredComps.length === 0 ? (
            <Text c="white" ta="center">Соревнования не найдены</Text>
          ) : (
            <Table highlightOnHover styles={{
              th: { color: 'var(--vtb-cyan)', borderBottom: '1px solid rgba(0, 217, 255, 0.2)' },
              td: { color: '#ffffff', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' },
            }}>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>ID</Table.Th>
                  <Table.Th>Название</Table.Th>
                  <Table.Th>Тип</Table.Th>
                  <Table.Th>Статус</Table.Th>
                  <Table.Th>Регистрация до</Table.Th>
                  <Table.Th>Начало</Table.Th>
                  <Table.Th>Конец</Table.Th>
                  <Table.Th>Действия</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredComps.map((comp) => {
                  const now = new Date();
                  const startDate = new Date(comp.start_date);
                  const endDate = new Date(comp.end_date);
                  const regDeadline = new Date(comp.registration_deadline);

                  let status = 'upcoming';
                  let statusColor = 'blue';
                  let statusText = 'Предстоит';

                  if (now > endDate) {
                    status = 'completed';
                    statusColor = 'gray';
                    statusText = 'Завершено';
                  } else if (now >= startDate && now <= endDate) {
                    status = 'ongoing';
                    statusColor = 'green';
                    statusText = 'Идет';
                  } else if (now < regDeadline) {
                    status = 'registration';
                    statusColor = 'cyan';
                    statusText = 'Регистрация';
                  }

                  return (
                    <Table.Tr key={comp.id}>
                      <Table.Td>{comp.id}</Table.Td>
                      <Table.Td>{comp.name}</Table.Td>
                      <Table.Td><Badge color="cyan" variant="light">{comp.type}</Badge></Table.Td>
                      <Table.Td><Badge color={statusColor} variant="light">{statusText}</Badge></Table.Td>
                      <Table.Td>{dayjs(comp.registration_deadline).format('DD.MM.YYYY')}</Table.Td>
                      <Table.Td>{dayjs(comp.start_date).format('DD.MM.YYYY')}</Table.Td>
                      <Table.Td>{dayjs(comp.end_date).format('DD.MM.YYYY')}</Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <Tooltip label="Просмотреть отчеты">
                            <ActionIcon variant="light" color="cyan" onClick={() => handleViewReports(comp.id)}>
                              <IconFileText size={18} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="Удалить">
                            <ActionIcon variant="light" color="red" onClick={() => deleteMutation.mutate(comp.id)}>
                              <IconTrash size={18} />
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          )}
        </VTBCard>

        {/* Reports Modal */}
        <Modal
          opened={reportsModalOpened}
          onClose={() => setReportsModalOpened(false)}
          title={`Отчеты по соревнованию${competitionReports?.competition_name ? `: ${competitionReports.competition_name}` : ''}`}
          size="xl"
        >
          {reportsLoading ? (
            <Text c="white" ta="center">Загрузка...</Text>
          ) : competitionReports?.reports.length === 0 ? (
            <Text c="dimmed" ta="center">Отчеты еще не поданы</Text>
          ) : (
            <Stack gap="md">
              {competitionReports?.reports.map((report) => (
                <VTBCard key={report.id} variant="secondary">
                  <Stack gap="sm">
                    <Group justify="space-between">
                      <Text fw={700} c="white" size="lg">{report.team_name}</Text>
                      {report.placement && (
                        <Badge size="lg" color="gold">{report.placement} место</Badge>
                      )}
                    </Group>
                    <Text c="dimmed" size="sm">Подано: {dayjs(report.submitted_at).format('DD.MM.YYYY HH:mm')}</Text>
                    <Text c="white">{report.brief_summary}</Text>
                    <Group gap="md">
                      <VTBButton
                        size="sm"
                        variant="secondary"
                        component="a"
                        href={report.git_link}
                        target="_blank"
                      >
                        GitHub
                      </VTBButton>
                      <VTBButton
                        size="sm"
                        variant="secondary"
                        component="a"
                        href={report.presentation_url}
                        target="_blank"
                      >
                        Презентация
                      </VTBButton>
                    </Group>
                  </Stack>
                </VTBCard>
              ))}
            </Stack>
          )}
        </Modal>
      </Stack>
    </Container>
  );
}
