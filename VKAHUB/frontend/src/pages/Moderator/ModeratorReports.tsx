import { useState } from 'react';
import { Container, Title, Stack, Table, Badge, Group, ActionIcon, Text, Textarea, Modal } from '@mantine/core';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { IconCheck, IconX, IconEye } from '@tabler/icons-react';
import { VTBCard } from '../../components/common/VTBCard';
import { VTBButton } from '../../components/common/VTBButton';
import { notifications } from '@mantine/notifications';
import { api } from '../../api';
import { UserComplaint } from '../../types';
import dayjs from 'dayjs';

export function ModeratorReports() {
  const queryClient = useQueryClient();
  const [selectedReport, setSelectedReport] = useState<UserComplaint | null>(null);
  const [modalOpened, setModalOpened] = useState(false);

  const { data: reports, isLoading, error } = useQuery<UserComplaint[]>({
    queryKey: ['moderator-reports'],
    queryFn: async () => {
      try {
        const response = await api.get('/api/moderator/reports');
        return Array.isArray(response.data.items) ? response.data.items : [];
      } catch (error) {
        console.error('Failed to fetch reports:', error);
        // Return empty array if endpoint doesn't exist yet
        return [];
      }
    },
  });

  const resolveMutation = useMutation({
    mutationFn: ({ id, action }: { id: number; action: 'approve' | 'reject' }) =>
      api.post(`/api/moderator/reports/${id}/${action}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderator-reports'] });
      notifications.show({ title: 'Успех', message: 'Жалоба рассмотрена', color: 'teal' });
      setModalOpened(false);
    },
    onError: (error: { response?: { data?: { detail?: string } } }) => {
      notifications.show({
        title: 'Ошибка',
        message: error?.response?.data?.detail || 'Не удалось рассмотреть жалобу',
        color: 'red',
      });
    },
  });

  return (
    <Container size="xl" py="md">
      <Stack gap="xl">
        <div>
          <Title order={1} className="vtb-heading-hero" mb="xs">
            <span className="vtb-gradient-text">Рассмотрение жалоб</span>
          </Title>
          <Text c="dimmed" size="lg">Модерация жалоб пользователей</Text>
        </div>

        <VTBCard variant="primary">
          {isLoading ? (
            <Text c="white" ta="center">Загрузка...</Text>
          ) : error ? (
            <Text c="red" ta="center">Ошибка загрузки жалоб</Text>
          ) : !reports || reports.length === 0 ? (
            <Text c="dimmed" ta="center">Нет жалоб</Text>
          ) : (
            <Table highlightOnHover styles={{
              th: { color: 'var(--vtb-cyan)', borderBottom: '1px solid rgba(0, 217, 255, 0.2)' },
              td: { color: '#ffffff', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' },
            }}>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>ID</Table.Th>
                  <Table.Th>Отправитель</Table.Th>
                  <Table.Th>Цель</Table.Th>
                  <Table.Th>Причина</Table.Th>
                  <Table.Th>Статус</Table.Th>
                  <Table.Th>Дата</Table.Th>
                  <Table.Th>Действия</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {(Array.isArray(reports) ? reports : []).map((report) => (
                  <Table.Tr key={report.id}>
                    <Table.Td>{report.id}</Table.Td>
                    <Table.Td>{report.reporter}</Table.Td>
                    <Table.Td>{report.target}</Table.Td>
                    <Table.Td>{report.reason}</Table.Td>
                    <Table.Td>
                      <Badge color={report.status === 'pending' ? 'yellow' : 'green'} variant="light">
                        {report.status === 'pending' ? 'Ожидает' : 'Рассмотрена'}
                      </Badge>
                    </Table.Td>
                    <Table.Td>{dayjs(report.created_at).format('DD.MM.YYYY HH:mm')}</Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <ActionIcon variant="light" color="cyan" onClick={() => { setSelectedReport(report); setModalOpened(true); }}>
                          <IconEye size={18} />
                        </ActionIcon>
                        {report.status === 'pending' && (
                          <>
                            <ActionIcon variant="light" color="green" onClick={() => resolveMutation.mutate({ id: report.id, action: 'approve' })}>
                              <IconCheck size={18} />
                            </ActionIcon>
                            <ActionIcon variant="light" color="red" onClick={() => resolveMutation.mutate({ id: report.id, action: 'reject' })}>
                              <IconX size={18} />
                            </ActionIcon>
                          </>
                        )}
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </VTBCard>

        <Modal opened={modalOpened} onClose={() => setModalOpened(false)} title="Детали жалобы" size="lg">
          {selectedReport && (
            <Stack gap="md">
              <Text><strong>ID:</strong> {selectedReport.id}</Text>
              <Text><strong>От:</strong> {selectedReport.reporter}</Text>
              <Text><strong>На:</strong> {selectedReport.target}</Text>
              <Text><strong>Причина:</strong> {selectedReport.reason}</Text>
              <Text><strong>Описание:</strong></Text>
              <Textarea value={selectedReport.description} readOnly rows={4} />
              {selectedReport.status === 'pending' && (
                <Group>
                  <VTBButton color="green" onClick={() => resolveMutation.mutate({ id: selectedReport.id, action: 'approve' })}>
                    Одобрить
                  </VTBButton>
                  <VTBButton variant="secondary" onClick={() => resolveMutation.mutate({ id: selectedReport.id, action: 'reject' })}>
                    Отклонить
                  </VTBButton>
                </Group>
              )}
            </Stack>
          )}
        </Modal>
      </Stack>
    </Container>
  );
}
