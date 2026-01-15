import { useState, useEffect } from 'react';
import {
  Modal,
  Stack,
  Select,
  Checkbox,
  Alert,
  Group,
  Card,
  Badge,
  Text,
  Avatar,
  Divider,
  Textarea,
} from '@mantine/core';
import { IconAlertCircle, IconUsers, IconTrophy, IconCheck } from '@tabler/icons-react';
import { VTBButton } from './VTBButton';
import { teamsApi } from '../../api';
import { Team, Competition } from '../../types';
import { notifications } from '@mantine/notifications';
import { useAuthStore } from '../../store/authStore';
import { useApplyToCompetition } from '../../api/mutations/competitionMutations';

interface TeamRegistrationModalProps {
  opened: boolean;
  onClose: () => void;
  competition: Competition;
  onSuccess: () => void;
}

export function TeamRegistrationModal({
  opened,
  onClose,
  competition,
  onSuccess,
}: TeamRegistrationModalProps) {
  const { user } = useAuthStore();
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  const [selectedCase, setSelectedCase] = useState<number | null>(null);
  const [address, setAddress] = useState<string>('');

  // Use centralized mutation hook with proper cache invalidation
  const applyMutation = useApplyToCompetition(competition.id);

  useEffect(() => {
    const fetchTeams = async () => {
      if (!opened || !user) return;

      try {
        const response = await teamsApi.getTeams({ limit: 100 });
        const allTeams = response.items || [];
        const captainTeams = allTeams.filter((team: Team) => team.captain_id === user.id);
        setTeams(captainTeams);
      } catch (error: any) {
        notifications.show({
          title: 'Ошибка',
          message: 'Не удалось загрузить команды',
          color: 'red',
        });
      }
    };

    fetchTeams();
  }, [opened, user]);

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
    if (!selectedTeam) return;

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

    // Validate case selection for hackathons
    if (competition.type === 'hackathon' && !selectedCase) {
      notifications.show({
        title: 'Выберите кейс',
        message: 'Для участия в хакатоне необходимо выбрать кейс',
        color: 'red',
      });
      return;
    }

    applyMutation.mutate(
      {
        team_id: selectedTeam.id,
        member_ids: selectedMembers,
        case_id: selectedCase,
        address: address || undefined,
      },
      {
        onSuccess: () => {
          notifications.show({
            title: 'Успех',
            message: 'Команда успешно зарегистрирована!',
            color: 'green',
          });

          onSuccess();
          onClose();
          // Reset state
          setSelectedTeam(null);
          setSelectedMembers([]);
          setSelectedCase(null);
          setAddress('');
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

  const isValid =
    selectedTeam &&
    selectedMembers.length >= competition.min_team_size &&
    selectedMembers.length <= competition.max_team_size &&
    (competition.type !== 'hackathon' || selectedCase !== null);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Регистрация команды"
      size="lg"
      styles={{
        title: {
          fontSize: 24,
          fontWeight: 700,
          color: '#ffffff',
        },
        content: {
          background: 'linear-gradient(135deg, rgba(10, 31, 68, 0.95) 0%, rgba(5, 15, 34, 0.95) 100%)',
          border: '1px solid rgba(0, 217, 255, 0.3)',
        },
        header: {
          background: 'transparent',
          borderBottom: '1px solid rgba(0, 217, 255, 0.2)',
        },
      }}
    >
      <Stack gap="lg">
        {teams.length === 0 && (
          <Alert icon={<IconAlertCircle />} color="yellow">
            У вас нет команд, где вы капитан. Создайте команду или попросите текущего капитана зарегистрировать команду.
          </Alert>
        )}

        {teams.length > 0 && (
          <>
            <Select
              label="Выберите команду"
              placeholder="Выберите команду"
              data={teams.map((team) => ({
                value: team.id.toString(),
                label: `${team.name} (${team.members?.length || 0} участников)`,
              }))}
              value={selectedTeam?.id.toString() || null}
              onChange={handleTeamSelect}
              required
              styles={{
                label: { color: '#ffffff', marginBottom: 8 },
                input: {
                  background: 'rgba(10, 31, 68, 0.6)',
                  border: '1px solid rgba(0, 217, 255, 0.3)',
                  color: '#ffffff',
                },
              }}
            />

            {competition.type === 'hackathon' && competition.cases && competition.cases.length > 0 && (
              <Select
                label="Выберите кейс"
                placeholder="Выберите кейс хакатона"
                data={competition.cases.map((caseItem) => ({
                  value: caseItem.id.toString(),
                  label: `Кейс ${caseItem.case_number}: ${caseItem.title}`,
                }))}
                value={selectedCase?.toString() || null}
                onChange={(value) => setSelectedCase(value ? parseInt(value) : null)}
                required
                styles={{
                  label: { color: '#ffffff', marginBottom: 8 },
                  input: {
                    background: 'rgba(10, 31, 68, 0.6)',
                    border: '1px solid rgba(0, 217, 255, 0.3)',
                    color: '#ffffff',
                  },
                }}
              />
            )}

            <Textarea
              label="Адрес проведения"
              placeholder="г. Санкт-Петербург, ул. Пионерская, д.20, к.3"
              description="Укажите адрес, откуда команда будет участвовать в соревновании"
              value={address}
              onChange={(e) => setAddress(e.currentTarget.value)}
              minRows={2}
              styles={{
                label: { color: '#ffffff', marginBottom: 8 },
                description: { color: 'rgba(255, 255, 255, 0.6)', marginTop: 4 },
                input: {
                  background: 'rgba(10, 31, 68, 0.6)',
                  border: '1px solid rgba(0, 217, 255, 0.3)',
                  color: '#ffffff',
                },
              }}
            />

            {selectedTeam && (
              <Stack gap="md">
                <div>
                  <Group justify="space-between" mb="md">
                    <Text fw={600} c="white">
                      Выберите участников
                    </Text>
                    <Badge
                      size="lg"
                      color={
                        selectedMembers.length >= competition.min_team_size &&
                        selectedMembers.length <= competition.max_team_size
                          ? 'green'
                          : 'red'
                      }
                    >
                      {selectedMembers.length} / {competition.min_team_size}-{competition.max_team_size} выбрано
                    </Badge>
                  </Group>

                  <Alert icon={<IconAlertCircle />} color="blue" mb="md">
                    Выберите от {competition.min_team_size} до {competition.max_team_size} участников команды для участия в соревновании.
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
                            ? 'rgba(0, 217, 255, 0.1)'
                            : 'rgba(10, 31, 68, 0.6)',
                          border: selectedMembers.includes(member.user_id)
                            ? '1px solid var(--vtb-cyan)'
                            : '1px solid rgba(0, 217, 255, 0.2)',
                        }}
                        onClick={() => toggleMember(member.user_id)}
                      >
                        <Group justify="space-between">
                          <Group>
                            <Avatar src={member.avatar} size="md" radius="xl" />
                            <div>
                              <Text fw={600} c="white">
                                {member.first_name} {member.last_name}
                              </Text>
                              {member.user_id === selectedTeam.captain_id && (
                                <Badge size="sm" color="yellow">
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
                      Нет участников команды
                    </Text>
                  )}
                </Stack>
              </Stack>
            )}

            <Divider />

            <Group justify="flex-end">
              <VTBButton variant="secondary" onClick={onClose}>
                Отмена
              </VTBButton>
              <VTBButton
                onClick={handleSubmit}
                loading={applyMutation.isPending}
                disabled={!isValid}
                leftSection={<IconTrophy size={18} />}
              >
                Зарегистрировать команду
              </VTBButton>
            </Group>
          </>
        )}
      </Stack>
    </Modal>
  );
}
