import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Title, Grid, Stack, Group, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { IconTrophy } from '@tabler/icons-react';
import { VTBCard } from '../../components/common/VTBCard';
import { CompetitionCard } from '../../components/common/CompetitionCard';
import { ConsoleInput } from '../../components/common/ConsoleInput';
import { ConsoleSelect } from '../../components/common/ConsoleSelect';
import { competitionsApi } from '../../api';

export function CompetitionsList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['competitions'],
    queryFn: async () => {
      try {
        const response = await competitionsApi.getCompetitions({ limit: 50 });
        return response;
      } catch (error) {
        console.error('Failed to fetch competitions:', error);
        return { items: [], total: 0 };
      }
    },
  });

  // Helper function to compute competition status based on dates
  const getCompetitionStatus = (comp: any): string => {
    const now = new Date();
    const startDate = new Date(comp.start_date);
    const endDate = new Date(comp.end_date);

    if (now < startDate) {
      return 'upcoming';
    } else if (now >= startDate && now <= endDate) {
      return 'ongoing';
    } else {
      return 'completed';
    }
  };

  // Safe array access
  const safeItems = Array.isArray(data?.items) ? data.items : [];
  const filteredCompetitions = safeItems.filter((comp) => {
    const searchLower = search.toLowerCase();
    const matchesSearch = !search ||
      (comp.name || '').toLowerCase().includes(searchLower) ||
      (comp.description || '').toLowerCase().includes(searchLower);

    const computedStatus = getCompetitionStatus(comp);
    const matchesStatus = !statusFilter || computedStatus === statusFilter;
    const matchesType = !typeFilter || comp.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <div>
          <Title order={1} className="vtb-heading-hero">
            <span className="vtb-gradient-text">Соревнования</span>
          </Title>
          <Text size="lg" c="white" mt="md">
            Примите участие в хакатонах, олимпиадах и чемпионатах
          </Text>
        </div>

        <VTBCard variant="secondary">
          <Group gap="md" grow>
            <ConsoleInput
              placeholder="Поиск соревнований..."
              consolePath="C:\Competitions\search"
              value={search}
              onChange={(e) => setSearch(e.currentTarget.value)}
              size="md"
            />
            <ConsoleSelect
              placeholder="Статус"
              consolePath="C:\Competitions\status"
              data={[
                { value: 'upcoming', label: 'Предстоящие' },
                { value: 'ongoing', label: 'Идут сейчас' },
                { value: 'completed', label: 'Завершённые' },
              ]}
              value={statusFilter}
              onChange={setStatusFilter}
              clearable
              size="md"
            />
            <ConsoleSelect
              placeholder="Тип"
              consolePath="C:\Competitions\type"
              data={[
                { value: '', label: 'Все' },
                { value: 'hackathon', label: 'Хакатон' },
                { value: 'CTF', label: 'CTF' },
                { value: 'other', label: 'Другое' },
              ]}
              value={typeFilter}
              onChange={setTypeFilter}
              clearable
              size="md"
            />
          </Group>
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
              Ошибка загрузки соревнований
            </Title>
          </VTBCard>
        ) : filteredCompetitions.length === 0 ? (
          <VTBCard variant="primary">
            <Stack align="center" gap="md" py="xl">
              <IconTrophy size={80} color="var(--vtb-cyan)" opacity={0.5} />
              <Text size="lg" c="white" ta="center">
                {search || statusFilter || typeFilter
                  ? 'Соревнования не найдены'
                  : 'Нет доступных соревнований'}
              </Text>
            </Stack>
          </VTBCard>
        ) : (
          <Grid gutter="lg">
            {filteredCompetitions.map((competition) => (
              <Grid.Col key={competition.id} span={{ base: 12, sm: 6, md: 4 }}>
                <CompetitionCard
                  id={competition.id}
                  name={competition.name}
                  type={competition.type}
                  description={competition.description}
                  image={competition.image_url}
                  link={competition.link}
                  startDate={competition.start_date}
                  endDate={competition.end_date}
                  registrationDeadline={competition.registration_deadline}
                  onClick={() => navigate(`/competitions/${competition.id}`)}
                />
              </Grid.Col>
            ))}
          </Grid>
        )}
      </Stack>
    </Container>
  );
}
