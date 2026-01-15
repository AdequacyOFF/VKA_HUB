import { useState } from 'react';
import { Container, Title, Stack, Table, Badge, Group, ActionIcon, Text } from '@mantine/core';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { IconTrash, IconUsers } from '@tabler/icons-react';
import { VTBCard } from '../../components/common/VTBCard';
import { ConsoleInput } from '../../components/common/ConsoleInput';
import { notifications } from '@mantine/notifications';
import { teamsApi, api } from '../../api';
import { queryKeys } from '../../api/queryKeys';
import { Team } from '../../types';
import { invalidateTeamQueries, invalidateModeratorQueries } from '../../utils/cacheInvalidation';

// Extended team type with moderator-specific fields
interface TeamWithMetadata extends Team {
  captain?: {
    id: number;
    first_name: string;
    last_name: string;
  };
  captain_name?: string;
  member_count?: number;
}

export function ModeratorTeams() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const { data: teams, isLoading, error } = useQuery<TeamWithMetadata[]>({
    queryKey: queryKeys.moderator.teams(),
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
      // Invalidate both moderator view and public teams list
      invalidateModeratorQueries({ queryClient });
      invalidateTeamQueries({ queryClient });

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
          <Text c="white" size="lg">Просмотр и модерация команд</Text>
        </div>

        <VTBCard variant="secondary">
          <ConsoleInput
            placeholder="Поиск команд..."
            consolePath="C:\Moderator\Teams\search"
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            size="md"
          />
        </VTBCard>

        <VTBCard variant="primary">
          {isLoading ? (
            <Text c="white" ta="center">Загрузка...</Text>
          ) : error ? (
            <Text c="red" ta="center">Ошибка загрузки команд</Text>
          ) : filteredTeams.length === 0 ? (
            <Text c="white" ta="center">Команды не найдены</Text>
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
                {filteredTeams.map((team) => {
                  // Extract captain name from captain object
                  const captainName = team.captain
                    ? `${team.captain.first_name || ''} ${team.captain.last_name || ''}`.trim()
                    : '—';

                  // Count members from members array
                  const memberCount = team.members?.length || 0;

                  return (
                    <Table.Tr key={team.id}>
                      <Table.Td>{team.id}</Table.Td>
                      <Table.Td>{team.name}</Table.Td>
                      <Table.Td>{captainName}</Table.Td>
                      <Table.Td>
                        <Badge leftSection={<IconUsers size={14} />} color="cyan" variant="light">
                          {memberCount}
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
                  );
                })}
              </Table.Tbody>
            </Table>
          )}
        </VTBCard>
      </Stack>
    </Container>
  );
}
