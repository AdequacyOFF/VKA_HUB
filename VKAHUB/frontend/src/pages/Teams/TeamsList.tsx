// src/pages/Teams/TeamsList.tsx
import { useState } from 'react';
import { Container, Title, Grid, TextInput, Stack, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { IconSearch, IconPlus } from '@tabler/icons-react';

import { TeamCard } from '../../components/common/TeamCard';
import { VTBCard } from '../../components/common/VTBCard';
import { VTBButton } from '../../components/common/VTBButton';
import { teamsApi } from '../../api';
import { queryKeys } from '../../api/queryKeys';
import { useAuthStore } from '../../store/authStore';
import { Team } from '../../types';

export function TeamsList() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [search, setSearch] = useState('');

  const { data: response = { items: [], total: 0 }, isLoading, error } = useQuery({
    queryKey: queryKeys.teams.lists(),
    queryFn: async () => {
      const res = await teamsApi.getTeams({ limit: 100 });
      return res; // { total, items }
    },
  });

  const teams: Team[] = Array.isArray(response.items) ? response.items : [];

  const filteredTeams = teams.filter((team) =>
    (team.name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        {/* Заголовок */}
        <div style={{ textAlign: 'center' }}>
          <Title order={1} className="vtb-heading-section">
            Все команды
          </Title>
        </div>

        {/* Поиск + кнопка создания */}
        <VTBCard variant="secondary">
          <Grid gutter="md">
            <Grid.Col span={{ base: 12, md: 8 }}>
              <TextInput
                placeholder="Поиск команды по названию..."
                leftSection={<IconSearch size={18} />}
                value={search}
                onChange={(e) => setSearch(e.currentTarget.value)}
                size="md"
                classNames={{ input: 'glass-input' }}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              {isAuthenticated && (
                <VTBButton
                  fullWidth
                  leftSection={<IconPlus size={18} />}
                  onClick={() => navigate('/teams/create')}
                >
                  Создать команду
                </VTBButton>
              )}
            </Grid.Col>
          </Grid>
        </VTBCard>

        {/* Состояния */}
        {isLoading ? (
          <VTBCard variant="secondary">
            <Text ta="center" size="lg" c="dimmed">
              Загрузка команд...
            </Text>
          </VTBCard>
        ) : error ? (
          <VTBCard variant="secondary">
            <Text ta="center" size="lg" c="red">
              Ошибка загрузки команд
            </Text>
          </VTBCard>
        ) : filteredTeams.length === 0 ? (
          <VTBCard variant="secondary">
            <Text ta="center" size="lg" c="dimmed">
              {search ? 'Команды не найдены' : 'Пока нет ни одной команды'}
            </Text>
          </VTBCard>
        ) : (
          /* Список команд */
          <Grid gutter="lg">
            {filteredTeams.map((team) => (
              <Grid.Col key={team.id} span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
                <TeamCard
                id={team.id}
                name={team.name}
                description={team.description || 'Описание отсутствует'}
                image={team.image_url || undefined}
                direction={team.direction}
                onClick={() => navigate(`/teams/${team.id}`)}
              />
              </Grid.Col>
            ))}
          </Grid>
        )}
      </Stack>
    </Container>
  );
}