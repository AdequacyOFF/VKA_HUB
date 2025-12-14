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
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconUsers, IconTrophy } from '@tabler/icons-react';
import { competitionsApi } from '../../api/competitions';
import { teamsApi } from '../../api/teams';
import { Competition } from '../../types/competition';
import { Team } from '../../types/team';
import { useAuthStore } from '../../store/authStore';

export default function RegisterTeam() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);

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
          title: 'Error',
          message: error.response?.data?.detail || 'Failed to load data',
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

  const handleSubmit = async () => {
    if (!selectedTeam || !competition) return;

    // Validate team size
    if (
      selectedMembers.length < competition.min_team_size ||
      selectedMembers.length > competition.max_team_size
    ) {
      notifications.show({
        title: 'Invalid Team Size',
        message: `You must select between ${competition.min_team_size} and ${competition.max_team_size} team members`,
        color: 'red',
      });
      return;
    }

    setSubmitting(true);
    try {
      await competitionsApi.applyToCompetition(parseInt(id!), {
        team_id: selectedTeam.id,
        member_ids: selectedMembers,
      });

      notifications.show({
        title: 'Success',
        message: 'Team registered successfully!',
        color: 'green',
      });

      navigate(`/competitions/${id}`);
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.detail || 'Failed to register team',
        color: 'red',
      });
    } finally {
      setSubmitting(false);
    }
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
        <Alert icon={<IconAlertCircle />} title="Error" color="red">
          Competition not found
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
            <Title order={3}>No Teams Available</Title>
            <Text c="dimmed" ta="center">
              You need to be a team captain to register for competitions. Create a team or ask your current
              team captain to register.
            </Text>
            <Button onClick={() => navigate('/teams/create')}>Create Team</Button>
          </Stack>
        </Paper>
      </Container>
    );
  }

  const registrationOpen = new Date(competition.registration_deadline) > new Date();

  if (!registrationOpen) {
    return (
      <Container size="md" py="xl">
        <Alert icon={<IconAlertCircle />} title="Registration Closed" color="yellow">
          Registration for this competition has closed.
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
                  Team Size: {competition.min_team_size}-{competition.max_team_size} members
                </Text>
              </Group>
            </div>
          </Group>
        </Paper>

        {/* Team Selection */}
        <Paper shadow="sm" p="lg" withBorder>
          <Title order={3} mb="md">
            Select Your Team
          </Title>

          <Select
            label="Team"
            placeholder="Choose a team to register"
            data={teams.map((team) => ({
              value: team.id.toString(),
              label: `${team.name} (${team.members?.length || 0} members)`,
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
                  <Title order={3}>Select Team Members</Title>
                  <Badge size="lg" color={selectedMembers.length >= competition.min_team_size && selectedMembers.length <= competition.max_team_size ? 'green' : 'red'}>
                    {selectedMembers.length} / {competition.min_team_size}-{competition.max_team_size} selected
                  </Badge>
                </Group>

                <Alert icon={<IconAlertCircle />} color="blue" mb="md">
                  Select between {competition.min_team_size} and {competition.max_team_size} team members to
                  participate in this competition.
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
                                Captain
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
                    No team members found
                  </Text>
                )}
              </Stack>

              <Divider my="md" />

              <Group justify="space-between">
                <Button variant="default" onClick={() => navigate(`/competitions/${id}`)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  loading={submitting}
                  disabled={
                    !selectedTeam ||
                    selectedMembers.length < competition.min_team_size ||
                    selectedMembers.length > competition.max_team_size
                  }
                  leftSection={<IconTrophy size={18} />}
                >
                  Register Team
                </Button>
              </Group>
            </Stack>
          </Paper>
        )}
      </Stack>
    </Container>
  );
}
