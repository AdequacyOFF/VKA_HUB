import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Title,
  Text,
  Button,
  Group,
  Stack,
  Checkbox,
  Alert,
  Loader,
  Center,
  Card,
  Badge,
  Divider,
  Select,
  Avatar,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconUsers, IconTrophy } from '@tabler/icons-react';
import { competitionsApi } from '../../api/competitions';
import { teamsApi } from '../../api/teams';
import { Competition } from '../../types/competition';
import { Team } from '../../types/team';
import { useAuthStore } from '../../store/authStore';
import { useApplyToCompetition } from '../../api/mutations/competitionMutations';

export default function RegisterTeam() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);

  // Use centralized mutation hook with proper cache invalidation
  const applyMutation = useApplyToCompetition(parseInt(id || '0'));

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      setLoading(true);
      try {
        // Fetch competition
        const compData = await competitionsApi.getCompetition(parseInt(id));
        setCompetition(compData);

        // Fetch user's teams where user is captain
        const teamsData = await teamsApi.getMyTeams();
        const captainTeams = teamsData.filter((team: Team) => team.captain_id === user?.id);
        setTeams(captainTeams);
      } catch (error: any) {
        notifications.show({
          title: 'Ошибка',
          message: error.response?.data?.detail || 'Не удалось загрузить данные',
          color: 'red',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, user]);

  const handleTeamSelect = (teamId: string | null) => {
    if (!teamId) {
      setSelectedTeam(null);
      setSelectedMembers([]);
      return;
    }

    const team = teams.find((t) => t.id === parseInt(teamId));
    if (team) {
      setSelectedTeam(team);
      // Pre-select all members by default
      setSelectedMembers(team.members?.map((m) => m.user_id) || []);
    }
  };

  const toggleMember = (userId: number) => {
    setSelectedMembers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSubmit = () => {
    if (!selectedTeam || !competition) return;

    // Validate team size
    if (
      selectedMembers.length < competition.min_team_size ||
      selectedMembers.length > competition.max_team_size
    ) {
      notifications.show({
        title: 'Неверный размер команды',
        message: `Необходимо выбрать от ${competition.min_team_size} до ${competition.max_team_size} участников`,
        color: 'red',
      });
      return;
    }

    applyMutation.mutate(
      {
        team_id: selectedTeam.id,
        member_ids: selectedMembers,
      },
      {
        onSuccess: () => {
          notifications.show({
            title: 'Успех',
            message: 'Команда успешно зарегистрирована!',
            color: 'green',
          });
          navigate(`/competitions/${id}`);
        },
        onError: (error: any) => {
          notifications.show({
            title: 'Ошибка',
            message: error.response?.data?.detail || 'Не удалось зарегистрировать команду',
            color: 'red',
          });
        },
      }
    );
  };

  if (loading) {
    return (
      <Center h={400}>
        <Loader size="lg" />
      </Center>
    );
  }

  if (!competition) {
    return (
      <Container size="md" py="xl">
        <Alert icon={<IconAlertCircle />} title="Ошибка" color="red">
          Соревнование не найдено
        </Alert>
      </Container>
    );
  }

  if (teams.length === 0) {
    return (
      <Container size="md" py="xl">
        <Paper shadow="sm" p="xl" withBorder>
          <Stack gap="md" align="center">
            <IconUsers size={48} color="gray" />
            <Title order={3}>Нет доступных команд</Title>
            <Text c="dimmed" ta="center">
              Вы должны быть капитаном команды, чтобы зарегистрировать её на соревнование.
              Создайте команду или попросите капитана вашей команды зарегистрировать её.
            </Text>
            <Button onClick={() => navigate('/teams/create')}>Создать команду</Button>
          </Stack>
        </Paper>
      </Container>
    );
  }

  const registrationOpen = new Date(competition.registration_deadline) > new Date();

  if (!registrationOpen) {
    return (
      <Container size="md" py="xl">
        <Alert icon={<IconAlertCircle />} title="Регистрация закрыта" color="yellow">
          Регистрация на это соревнование закрыта.
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        {/* Competition Info */}
        <Paper shadow="sm" p="lg" withBorder>
          <Group>
            <IconTrophy size={32} color="var(--mantine-color-blue-6)" />
            <div style={{ flex: 1 }}>
              <Title order={2}>{competition.name}</Title>
              <Group gap="xs" mt="xs">
                <Badge color="blue">{competition.type.toUpperCase()}</Badge>
                <Text size="sm" c="dimmed">
                  Размер команды: {competition.min_team_size}-{competition.max_team_size} участников
                </Text>
              </Group>
            </div>
          </Group>
        </Paper>

        {/* Team Selection */}
        <Paper shadow="sm" p="lg" withBorder>
          <Title order={3} mb="md">
            Выберите команду
          </Title>

          <Select
            label="Команда"
            placeholder="Выберите команду для регистрации"
            data={teams.map((team) => ({
              value: team.id.toString(),
              label: `${team.name} (${team.members?.length || 0} участников)`,
            }))}
            value={selectedTeam?.id.toString() || null}
            onChange={handleTeamSelect}
            required
            size="md"
          />
        </Paper>

        {/* Member Selection */}
        {selectedTeam && (
          <Paper shadow="sm" p="lg" withBorder>
            <Stack gap="md">
              <div>
                <Group justify="space-between" mb="md">
                  <Title order={3}>Выберите участников</Title>
                  <Badge size="lg" color={selectedMembers.length >= competition.min_team_size && selectedMembers.length <= competition.max_team_size ? 'green' : 'red'}>
                    {selectedMembers.length} / {competition.min_team_size}-{competition.max_team_size} выбрано
                  </Badge>
                </Group>

                <Alert icon={<IconAlertCircle />} color="blue" mb="md">
                  Выберите от {competition.min_team_size} до {competition.max_team_size} участников команды
                  для участия в этом соревновании.
                </Alert>
              </div>

              <Stack gap="sm">
                {selectedTeam.members && selectedTeam.members.length > 0 ? (
                  selectedTeam.members.map((member) => (
                    <Card
                      key={member.user_id}
                      withBorder
                      p="md"
                      style={{
                        cursor: 'pointer',
                        backgroundColor: selectedMembers.includes(member.user_id)
                          ? 'var(--mantine-color-blue-0)'
                          : undefined,
                      }}
                      onClick={() => toggleMember(member.user_id)}
                    >
                      <Group justify="space-between">
                        <Group>
                          <Avatar src={member.avatar_url} size="md" radius="xl" />
                          <div>
                            <Text fw={600}>
                              {member.first_name} {member.last_name}
                            </Text>
                            {member.user_id === selectedTeam.captain_id && (
                              <Badge size="sm" color="gold">
                                Капитан
                              </Badge>
                            )}
                          </div>
                        </Group>

                        <Checkbox
                          checked={selectedMembers.includes(member.user_id)}
                          onChange={() => toggleMember(member.user_id)}
                          size="md"
                          styles={{
                            input: { cursor: 'pointer' },
                          }}
                        />
                      </Group>
                    </Card>
                  ))
                ) : (
                  <Text c="dimmed" ta="center">
                    Участники не найдены
                  </Text>
                )}
              </Stack>

              <Divider my="md" />

              <Group justify="space-between">
                <Button variant="default" onClick={() => navigate(`/competitions/${id}`)}>
                  Отмена
                </Button>
                <Button
                  onClick={handleSubmit}
                  loading={applyMutation.isPending}
                  disabled={
                    !selectedTeam ||
                    selectedMembers.length < competition.min_team_size ||
                    selectedMembers.length > competition.max_team_size
                  }
                  leftSection={<IconTrophy size={18} />}
                >
                  Зарегистрировать команду
                </Button>
              </Group>
            </Stack>
          </Paper>
        )}
      </Stack>
    </Container>
  );
}
