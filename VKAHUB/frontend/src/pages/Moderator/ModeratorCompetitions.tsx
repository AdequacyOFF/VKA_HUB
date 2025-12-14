import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Title, Stack, TextInput, Table, Badge, Group, ActionIcon, Text } from '@mantine/core';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { IconSearch, IconTrash, IconPlus } from '@tabler/icons-react';
import { VTBCard } from '../../components/common/VTBCard';
import { VTBButton } from '../../components/common/VTBButton';
import { notifications } from '@mantine/notifications';
import { competitionsApi, api } from '../../api';
import { Competition } from '../../types';
import dayjs from 'dayjs';

export function ModeratorCompetitions() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const { data: competitions, isLoading, error } = useQuery<Competition[]>({
    queryKey: ['moderator-competitions'],
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

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/competitions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderator-competitions'] });
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
            <Text c="dimmed" size="lg">Создание и модерация соревнований</Text>
          </div>
          <VTBButton leftSection={<IconPlus size={18} />} onClick={() => navigate('/moderator/competitions/create')}>
            Создать соревнование
          </VTBButton>
        </Group>

        <VTBCard variant="secondary">
          <TextInput
            placeholder="Поиск соревнований..."
            leftSection={<IconSearch size={18} />}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            size="md"
            classNames={{ input: 'glass-input' }}
          />
        </VTBCard>

        <VTBCard variant="primary">
          {isLoading ? (
            <Text c="white" ta="center">Загрузка...</Text>
          ) : error ? (
            <Text c="red" ta="center">Ошибка загрузки соревнований</Text>
          ) : filteredComps.length === 0 ? (
            <Text c="dimmed" ta="center">Соревнования не найдены</Text>
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
                  <Table.Th>Дата начала</Table.Th>
                  <Table.Th>Действия</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredComps.map((comp) => (
                  <Table.Tr key={comp.id}>
                    <Table.Td>{comp.id}</Table.Td>
                    <Table.Td>{comp.name}</Table.Td>
                    <Table.Td><Badge color="cyan" variant="light">{comp.type}</Badge></Table.Td>
                    <Table.Td><Badge color={comp.status === 'ongoing' ? 'green' : 'blue'} variant="light">{comp.status}</Badge></Table.Td>
                    <Table.Td>{dayjs(comp.start_date).format('DD.MM.YYYY')}</Table.Td>
                    <Table.Td>
                      <ActionIcon variant="light" color="red" onClick={() => deleteMutation.mutate(comp.id)}>
                        <IconTrash size={18} />
                      </ActionIcon>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </VTBCard>
      </Stack>
    </Container>
  );
}
