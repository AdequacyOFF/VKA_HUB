import { useState } from 'react';
import { Container, Title, Grid, TextInput, Group, Stack, Select } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { IconSearch, IconFilter } from '@tabler/icons-react';
import { UserCard } from '../../components/common/UserCard';
import { MultiSelectRoles } from '../../components/common/MultiSelectRoles';
import { MultiSelectSkills } from '../../components/common/MultiSelectSkills';
import { VTBCard } from '../../components/common/VTBCard';
import { usersApi } from '../../api';
import { queryKeys } from '../../api/queryKeys';
import { User } from '../../types';

export function UsersList() {
  const [search, setSearch] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [groupFilter, setGroupFilter] = useState('');
  const [rankFilter, setRankFilter] = useState('');

  const { data: users = [], isLoading, error } = useQuery<User[]>({
    queryKey: queryKeys.users.list({ search, roles: selectedRoles, skills: selectedSkills, group: groupFilter, rank: rankFilter }),
    queryFn: async () => {
      try {
        const response = await usersApi.getUsers({
          search: search || undefined,
          study_group: groupFilter || undefined,
          rank: rankFilter || undefined,
          limit: 100,
        });
        // Backend returns {total, items, page, page_size}, extract items array
        return Array.isArray(response.items) ? response.items : [];
      } catch (error) {
        console.error('Failed to fetch users:', error);
        return [];
      }
    },
  });

  // Runtime guard: ensure users is an array before filtering
  const filteredUsers = Array.isArray(users)
    ? users.filter((user) => {
        const searchLower = search.toLowerCase();
        const fullName = `${user.last_name || ''} ${user.first_name || ''} ${user.middle_name || ''}`.toLowerCase();
        const matchesSearch = !search || fullName.includes(searchLower) || (user.login || '').toLowerCase().includes(searchLower);

        return matchesSearch;
      })
    : [];

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <div style={{ textAlign: 'center' }}>
          <Title order={1} className="vtb-heading-section">
            Все пользователи
          </Title>
        </div>

        <VTBCard variant="secondary">
          <Stack gap="md">
            <Title order={4} c="white" mb="xs">
              <Group gap="xs">
                <IconFilter size={20} />
                Фильтры
              </Group>
            </Title>

            <Grid gutter="md">
              <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput
                  placeholder="Поиск по имени или логину..."
                  leftSection={<IconSearch size={18} />}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  size="md"
                  classNames={{ input: 'glass-input' }}
                  styles={{
                    label: { color: '#ffffff', fontWeight: 600 },
                  }}
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                <TextInput
                  placeholder="Учебная группа"
                  value={groupFilter}
                  onChange={(e) => setGroupFilter(e.target.value)}
                  size="md"
                  classNames={{ input: 'glass-input' }}
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                <TextInput
                  placeholder="Звание"
                  value={rankFilter}
                  onChange={(e) => setRankFilter(e.target.value)}
                  size="md"
                  classNames={{ input: 'glass-input' }}
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 6 }}>
                <MultiSelectRoles
                  value={selectedRoles}
                  onChange={setSelectedRoles}
                  placeholder="Фильтр по ролям"
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 6 }}>
                <MultiSelectSkills
                  value={selectedSkills}
                  onChange={setSelectedSkills}
                  placeholder="Фильтр по навыкам"
                />
              </Grid.Col>
            </Grid>
          </Stack>
        </VTBCard>

        {isLoading ? (
          <VTBCard variant="secondary">
            <Title order={4} c="white" ta="center">
              Загрузка...
            </Title>
          </VTBCard>
        ) : error ? (
          <VTBCard variant="secondary">
            <Title order={4} c="red" ta="center">
              Ошибка загрузки пользователей
            </Title>
          </VTBCard>
        ) : filteredUsers.length === 0 ? (
          <VTBCard variant="secondary">
            <Title order={4} c="dimmed" ta="center">
              Пользователи не найдены
            </Title>
          </VTBCard>
        ) : (
          <Grid gutter="lg">
            {filteredUsers.map((user) => (
              <Grid.Col key={user.id} span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
                <UserCard
                  id={user.id}
                  firstName={user.first_name}
                  lastName={user.last_name}
                  middleName={user.middle_name}
                  avatar={user.avatar_url}
                  studyGroup={user.study_group}
                  rank={user.rank}
                  position={user.position}
                  roles={user.roles}
                  skills={user.skills}
                />
              </Grid.Col>
            ))}
          </Grid>
        )}
      </Stack>
    </Container>
  );
}
