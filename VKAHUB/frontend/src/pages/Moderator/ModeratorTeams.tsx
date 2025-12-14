import { useState } from 'react';
import { Container, Title, Stack, TextInput, Table, Badge, Group, ActionIcon, Text } from '@mantine/core';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { IconSearch, IconTrash, IconUsers } from '@tabler/icons-react';
import { VTBCard } from '../../components/common/VTBCard';
import { notifications } from '@mantine/notifications';
import { teamsApi, api } from '../../api';
import { Team } from '../../types';

// Extended team type with moderator-specific fields
interface TeamWithMetadata extends Team {
  captain_name?: string;
  member_count?: number;
}

export function ModeratorTeams() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const { data: teams, isLoading, error } = useQuery<TeamWithMetadata[]>({
    queryKey: ['moderator-teams'],
    queryFn: async () => {
      try {
        const response = await teamsApi.getTeams({ limit: 100 });
        return Array.isArray(response.items) ? response.items : [];
      } catch (error) {
        console.error('Failed to fetch teams:', error);
        return [];
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (teamId: number) => api.delete(`/api/moderator/teams/${teamId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderator-teams'] });
      notifications.show({ title: 'Успех', message: 'Команда удалена', color: 'teal' });
    },
    onError: (error: { response?: { data?: { detail?: string } } }) => {
      notifications.show({
        title: 'Ошибка',
        message: error?.response?.data?.detail || 'Не удалось удалить команду',
        color: 'red',
      });
    },
  });

  // Safe array filtering
  const safeTeams = Array.isArray(teams) ? teams : [];
  const filteredTeams = safeTeams.filter((team) =>
    (team.name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Container size="xl" py="md">
      <Stack gap="xl">
        <div>
          <Title order={1} className="vtb-heading-hero" mb="xs">
            <span className="vtb-gradient-text">Управление командами</span>
          </Title>
          <Text c="dimmed" size="lg">Просмотр и модерация команд</Text>
        </div>

        <VTBCard variant="secondary">
          <TextInput
            placeholder="Поиск команд..."
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
            <Text c="red" ta="center">Ошибка загрузки команд</Text>
          ) : filteredTeams.length === 0 ? (
            <Text c="dimmed" ta="center">Команды не найдены</Text>
          ) : (
            <Table highlightOnHover styles={{
              th: { color: 'var(--vtb-cyan)', borderBottom: '1px solid rgba(0, 217, 255, 0.2)' },
              td: { color: '#ffffff', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' },
            }}>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>ID</Table.Th>
                  <Table.Th>Название</Table.Th>
                  <Table.Th>Капитан</Table.Th>
                  <Table.Th>Участников</Table.Th>
                  <Table.Th>Действия</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredTeams.map((team) => (
                  <Table.Tr key={team.id}>
                    <Table.Td>{team.id}</Table.Td>
                    <Table.Td>{team.name}</Table.Td>
                    <Table.Td>{team.captain_name || '—'}</Table.Td>
                    <Table.Td>
                      <Badge leftSection={<IconUsers size={14} />} color="cyan" variant="light">
                        {team.member_count || 0}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <ActionIcon
                        variant="light"
                        color="red"
                        onClick={() => deleteMutation.mutate(team.id)}
                      >
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
