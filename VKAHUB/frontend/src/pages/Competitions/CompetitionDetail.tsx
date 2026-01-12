import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Title, Grid, Stack, Badge, Text, Group, Tabs, Avatar, Timeline, Accordion, Divider, ActionIcon, Tooltip, Modal } from '@mantine/core';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import {
  IconTrophy,
  IconCalendar,
  IconUsers,
  IconMapPin,
  IconLink,
  IconUserPlus,
  IconFileDescription,
  IconAward,
  IconAlertCircle,
  IconCheck,
  IconCode,
  IconTrash,
  IconDownload
} from '@tabler/icons-react';
import { VTBCard } from '../../components/common/VTBCard';
import { VTBButton } from '../../components/common/VTBButton';
import { TeamRegistrationModal } from '../../components/common/TeamRegistrationModal';
import { competitionsApi } from '../../api';
import { useAuthStore } from '../../store/authStore';
import { Competition } from '../../types';
import dayjs from 'dayjs';
import { invalidateCompetitionQueries } from '../../utils/cacheInvalidation';

export function CompetitionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const [registrationModalOpened, setRegistrationModalOpened] = useState(false);
  const [removeConfirmOpened, setRemoveConfirmOpened] = useState(false);
  const [teamToRemove, setTeamToRemove] = useState<any>(null);

  const { data: competition, isLoading } = useQuery<Competition>({
    queryKey: ['competition', id],
    queryFn: async () => {
      const response = await competitionsApi.getCompetition(Number(id));
      return response;
    },
    enabled: !!id,
  });

  const { data: registrationsData } = useQuery({
    queryKey: ['competition-registrations', id],
    queryFn: async () => {
      const response = await competitionsApi.getCompetitionRegistrations(Number(id));
      return response;
    },
    enabled: !!id,
  });

  const removeTeamMutation = useMutation({
    mutationFn: ({ competitionId, registrationId }: { competitionId: number; registrationId: number }) =>
      competitionsApi.removeTeamFromCompetition(competitionId, registrationId),
    onSuccess: () => {
      notifications.show({
        title: 'Команда удалена',
        message: 'Команда успешно удалена из соревнования',
        color: 'green',
      });

      // Use centralized invalidation - invalidates competition data and registrations
      invalidateCompetitionQueries({ queryClient }, Number(id));

      setRemoveConfirmOpened(false);
      setTeamToRemove(null);
    },
    onError: () => {
      notifications.show({
        title: 'Ошибка',
        message: 'Не удалось удалить команду',
        color: 'red',
      });
    },
  });

  const handleGenerateReport = async () => {
    try {
      const blob = await competitionsApi.generateCompetitionReport(Number(id));
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `raport_${competition?.name || id}_${dayjs().format('YYYYMMDD')}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      notifications.show({
        title: 'Рапорт сгенерирован',
        message: 'Рапорт успешно загружен',
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Ошибка',
        message: 'Не удалось сгенерировать рапорт',
        color: 'red',
      });
    }
  };

  const handleRemoveTeam = (team: any) => {
    setTeamToRemove(team);
    setRemoveConfirmOpened(true);
  };

  const handleRegistrationSuccess = () => {
    // Use centralized invalidation for consistency
    invalidateCompetitionQueries({ queryClient }, Number(id));
  };

  if (isLoading) {
    return (
      <Container size="xl" py="xl">
        <Title order={3} c="white" ta="center">
          Загрузка...
        </Title>
      </Container>
    );
  }

  if (!competition) {
    return (
      <Container size="xl" py="xl">
        <Title order={3} c="white" ta="center">
          Соревнование не найдено
        </Title>
      </Container>
    );
  }

  // Calculate competition status based on dates
  const getCompetitionStatus = (): string => {
    const now = new Date();
    const startDate = new Date(competition.start_date);
    const endDate = new Date(competition.end_date);

    if (now < startDate) {
      return 'upcoming';
    } else if (now >= startDate && now <= endDate) {
      return 'ongoing';
    } else {
      return 'completed';
    }
  };

  const competitionStatus = getCompetitionStatus();
  const isParticipant = competition.participants?.some((p: any) => p.user_id === user?.id);
  const canRegister = competitionStatus === 'upcoming' || competitionStatus === 'ongoing';
  const isRegistrationOpen = competition.registration_deadline
    ? dayjs().isBefore(dayjs(competition.registration_deadline))
    : true;

  // Check if competition has ended and user is team captain who needs to submit report
  const competitionEnded = dayjs().isAfter(dayjs(competition.end_date));
  const userRegistration = competition.registrations?.find((reg: any) => reg.team?.captain_id === user?.id);
  const isTeamCaptain = !!userRegistration;
  const hasSubmittedReport = userRegistration?.has_report || false;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'blue';
      case 'ongoing': return 'green';
      case 'completed': return 'gray';
      default: return 'cyan';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'upcoming': return 'Предстоящее';
      case 'ongoing': return 'Идёт сейчас';
      case 'completed': return 'Завершено';
      default: return status;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'hackathon': return 'Хакатон';
      case 'olympiad': return 'Олимпиада';
      case 'championship': return 'Чемпионат';
      default: return type;
    }
  };

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <VTBCard variant="primary">
          <Grid gutter="xl">
            <Grid.Col span={12}>
              <Stack gap="lg">
                <div>
                  <Group gap="md" mb="md">
                    <Badge
                      variant="light"
                      color={getStatusColor(competitionStatus)}
                      size="lg"
                      style={{
                        background: `rgba(${getStatusColor(competitionStatus) === 'blue' ? '59, 130, 246' : getStatusColor(competitionStatus) === 'green' ? '34, 197, 94' : '156, 163, 175'}, 0.2)`,
                        color: getStatusColor(competitionStatus) === 'blue' ? 'var(--vtb-blue-light)' : getStatusColor(competitionStatus) === 'green' ? '#22c55e' : '#9ca3af',
                        border: `1px solid ${getStatusColor(competitionStatus) === 'blue' ? 'var(--vtb-blue-light)' : getStatusColor(competitionStatus) === 'green' ? '#22c55e' : '#9ca3af'}`,
                      }}
                    >
                      {getStatusLabel(competitionStatus)}
                    </Badge>
                    <Badge
                      variant="light"
                      color="cyan"
                      size="lg"
                      leftSection={<IconTrophy size={16} />}
                      style={{
                        background: 'rgba(0, 217, 255, 0.2)',
                        color: 'var(--vtb-cyan)',
                        border: '1px solid var(--vtb-cyan)',
                      }}
                    >
                      {getTypeLabel(competition.type)}
                    </Badge>
                  </Group>

                  <Title order={1} c="white" mb="md">
                    {competition.name}
                  </Title>

                  {competition.description && (
                    <Text c="dimmed" size="md">
                      {competition.description}
                    </Text>
                  )}
                </div>

                <Grid gutter="md">
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Group gap="xs">
                      <IconCalendar size={20} color="var(--vtb-cyan)" />
                      <div>
                        <Text size="xs" c="dimmed">Начало</Text>
                        <Text c="white" fw={600}>
                          {dayjs(competition.start_date).format('DD.MM.YYYY HH:mm')}
                        </Text>
                      </div>
                    </Group>
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Group gap="xs">
                      <IconCalendar size={20} color="var(--vtb-cyan)" />
                      <div>
                        <Text size="xs" c="dimmed">Окончание</Text>
                        <Text c="white" fw={600}>
                          {dayjs(competition.end_date).format('DD.MM.YYYY HH:mm')}
                        </Text>
                      </div>
                    </Group>
                  </Grid.Col>

                  {competition.location && (
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <Group gap="xs">
                        <IconMapPin size={20} color="var(--vtb-cyan)" />
                        <div>
                          <Text size="xs" c="dimmed">Место проведения</Text>
                          <Text c="white" fw={600}>{competition.location}</Text>
                        </div>
                      </Group>
                    </Grid.Col>
                  )}

                  {competition.max_participants && (
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <Group gap="xs">
                        <IconUsers size={20} color="var(--vtb-cyan)" />
                        <div>
                          <Text size="xs" c="dimmed">Максимум участников</Text>
                          <Text c="white" fw={600}>
                            {competition.participants?.length || 0} / {competition.max_participants}
                          </Text>
                        </div>
                      </Group>
                    </Grid.Col>
                  )}

                  {competition.organizer && (
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <Group gap="xs">
                        <IconFileDescription size={20} color="var(--vtb-cyan)" />
                        <div>
                          <Text size="xs" c="dimmed">Организатор</Text>
                          <Text c="white" fw={600}>{competition.organizer}</Text>
                        </div>
                      </Group>
                    </Grid.Col>
                  )}

                  {competition.prize_fund && (
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <Group gap="xs">
                        <IconAward size={20} color="var(--vtb-cyan)" />
                        <div>
                          <Text size="xs" c="dimmed">Призовой фонд</Text>
                          <Text c="white" fw={600}>{competition.prize_fund}</Text>
                        </div>
                      </Group>
                    </Grid.Col>
                  )}

                  {competition.min_team_size && competition.max_team_size && (
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <Group gap="xs">
                        <IconUsers size={20} color="var(--vtb-cyan)" />
                        <div>
                          <Text size="xs" c="dimmed">Размер команды</Text>
                          <Text c="white" fw={600}>
                            {competition.min_team_size}-{competition.max_team_size} человек
                          </Text>
                        </div>
                      </Group>
                    </Grid.Col>
                  )}

                  {competition.type === 'other' && competition.other_type_description && (
                    <Grid.Col span={12}>
                      <Group gap="xs">
                        <IconFileDescription size={20} color="var(--vtb-cyan)" />
                        <div>
                          <Text size="xs" c="dimmed">Тип соревнования</Text>
                          <Text c="white" fw={600}>{competition.other_type_description}</Text>
                        </div>
                      </Group>
                    </Grid.Col>
                  )}

                  {competition.website_url && (
                    <Grid.Col span={12}>
                      <Group gap="xs">
                        <IconLink size={20} color="var(--vtb-cyan)" />
                        <a
                          href={competition.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: 'var(--vtb-cyan)', textDecoration: 'none' }}
                        >
                          Официальный сайт
                        </a>
                      </Group>
                    </Grid.Col>
                  )}
                </Grid>

                {!isParticipant && user && canRegister && (
                  <>
                    {!isRegistrationOpen && (
                      <Group
                        p="md"
                        style={{
                          background: 'rgba(251, 191, 36, 0.1)',
                          border: '1px solid #fbbf24',
                          borderRadius: 12,
                        }}
                      >
                        <IconAlertCircle size={20} color="#fbbf24" />
                        <Text size="sm" c="#fbbf24">
                          Регистрация закрыта (дедлайн: {dayjs(competition.registration_deadline).format('DD.MM.YYYY HH:mm')})
                        </Text>
                      </Group>
                    )}
                    {isRegistrationOpen && (
                      <VTBButton
                        leftSection={<IconUserPlus size={18} />}
                        onClick={() => setRegistrationModalOpened(true)}
                      >
                        Зарегистрировать команду
                      </VTBButton>
                    )}
                  </>
                )}

                {isParticipant && (
                  <Stack gap="md">
                    <Group
                      p="md"
                      style={{
                        background: 'rgba(34, 197, 94, 0.1)',
                        border: '1px solid #22c55e',
                        borderRadius: 12,
                      }}
                    >
                      <IconCheck size={20} color="#22c55e" />
                      <Text size="sm" c="#22c55e" fw={600}>
                        Вы зарегистрированы на это соревнование
                      </Text>
                    </Group>

                    {/* Submit report button for team captains after competition ends */}
                    {competitionEnded && isTeamCaptain && !hasSubmittedReport && (
                      <Group
                        p="md"
                        style={{
                          background: 'rgba(251, 191, 36, 0.1)',
                          border: '1px solid #fbbf24',
                          borderRadius: 12,
                        }}
                      >
                        <Stack gap="sm" style={{ flex: 1 }}>
                          <Group>
                            <IconAlertCircle size={20} color="#fbbf24" />
                            <Text size="sm" c="#fbbf24" fw={600}>
                              Необходимо подать отчет о соревновании
                            </Text>
                          </Group>
                          <Text size="xs" c="dimmed">
                            У вас есть 5 дней после окончания соревнования для подачи отчета. После истечения срока доступ к функциям платформы будет ограничен.
                          </Text>
                          <VTBButton
                            leftSection={<IconFileDescription size={18} />}
                            onClick={() => navigate(`/competitions/${competition.id}/registrations/${userRegistration.id}/report`)}
                            variant="secondary"
                          >
                            Подать отчет
                          </VTBButton>
                        </Stack>
                      </Group>
                    )}

                    {competitionEnded && isTeamCaptain && hasSubmittedReport && (
                      <Group
                        p="md"
                        style={{
                          background: 'rgba(34, 197, 94, 0.1)',
                          border: '1px solid #22c55e',
                          borderRadius: 12,
                        }}
                      >
                        <IconCheck size={20} color="#22c55e" />
                        <Text size="sm" c="#22c55e" fw={600}>
                          Отчет успешно подан
                        </Text>
                      </Group>
                    )}
                  </Stack>
                )}
              </Stack>
            </Grid.Col>
          </Grid>
        </VTBCard>

        {/* Competition Stages */}
        {competition.stages && competition.stages.length > 0 && (
          <VTBCard variant="secondary">
            <Title order={3} c="white" mb="lg">
              Этапы соревнования
            </Title>
            <Timeline bulletSize={24} lineWidth={2}>
              {competition.stages
                .sort((a, b) => a.stage_number - b.stage_number)
                .map((stage) => (
                  <Timeline.Item
                    key={stage.id}
                    bullet={<IconCheck size={12} />}
                    title={
                      <Group gap="sm">
                        <Text fw={600} c="white">{stage.name}</Text>
                        <Badge size="sm" variant="light" color="cyan">
                          Этап {stage.stage_number}
                        </Badge>
                      </Group>
                    }
                  >
                    {stage.description && (
                      <Text size="sm" c="dimmed" mb="xs">
                        {stage.description}
                      </Text>
                    )}
                    <Text size="sm" c="dimmed">
                      {dayjs(stage.start_date).format('DD.MM.YYYY')} - {dayjs(stage.end_date).format('DD.MM.YYYY')}
                    </Text>
                  </Timeline.Item>
                ))}
            </Timeline>
          </VTBCard>
        )}

        {/* Hackathon Cases */}
        {competition.type === 'hackathon' && competition.cases && competition.cases.length > 0 && (
          <VTBCard variant="secondary">
            <Title order={3} c="white" mb="lg">
              Кейсы хакатона
            </Title>
            <Accordion variant="separated">
              {competition.cases
                .sort((a, b) => a.case_number - b.case_number)
                .map((caseItem) => (
                  <Accordion.Item key={caseItem.id} value={`case-${caseItem.id}`}>
                    <Accordion.Control>
                      <Group>
                        <Badge color="blue">Кейс {caseItem.case_number}</Badge>
                        <Text fw={600} c="white">{caseItem.title}</Text>
                      </Group>
                    </Accordion.Control>
                    <Accordion.Panel>
                      <Stack gap="md">
                        <div>
                          <Text fw={600} size="sm" c="white" mb="xs">
                            Описание
                          </Text>
                          <Text size="sm" c="dimmed">{caseItem.description}</Text>
                        </div>

                        <Divider />

                        <div>
                          <Text fw={600} size="sm" c="white" mb="xs">
                            Необходимый стек технологий
                          </Text>
                          <Group gap="xs">
                            {caseItem.knowledge_stack.map((tech, index) => (
                              <Badge
                                key={index}
                                variant="light"
                                color="cyan"
                                leftSection={<IconCode size={12} />}
                              >
                                {tech}
                              </Badge>
                            ))}
                          </Group>
                        </div>
                      </Stack>
                    </Accordion.Panel>
                  </Accordion.Item>
                ))}
            </Accordion>
          </VTBCard>
        )}

        <Tabs
          defaultValue="participants"
          variant="pills"
          styles={{
            list: {
              background: 'rgba(10, 31, 68, 0.6)',
              backdropFilter: 'blur(20px)',
              padding: 12,
              borderRadius: 12,
              border: '1px solid rgba(0, 217, 255, 0.2)',
            },
            tab: {
              color: '#ffffff',
              '&[data-active]': {
                background: 'linear-gradient(135deg, var(--vtb-cyan) 0%, var(--vtb-cyan-light) 100%)',
                color: 'var(--vtb-blue-dark)',
                fontWeight: 700,
              },
              '&:hover': {
                background: 'rgba(0, 217, 255, 0.2)',
              },
            },
          }}
        >
          <Tabs.List>
            <Tabs.Tab value="participants" leftSection={<IconUsers size={18} />}>
              Участники
            </Tabs.Tab>
            <Tabs.Tab value="results" leftSection={<IconAward size={18} />}>
              Результаты
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="participants" pt="xl">
            <Stack gap="md">
              {user?.is_moderator && (
                <Group justify="flex-end">
                  <VTBButton
                    leftSection={<IconDownload size={18} />}
                    onClick={handleGenerateReport}
                    variant="secondary"
                  >
                    Сгенерировать рапорт
                  </VTBButton>
                </Group>
              )}
              <VTBCard variant="secondary">
                {registrationsData?.registrations && registrationsData.registrations.length > 0 ? (
                  <Stack gap="md">
                    {registrationsData.registrations.map((registration: any) => (
                      <VTBCard key={registration.id} variant="primary">
                        <Group justify="space-between" align="flex-start">
                          <Group align="flex-start" style={{ flex: 1 }}>
                            {registration.team_image && (
                              <Avatar
                                src={registration.team_image}
                                size="xl"
                                radius="md"
                                style={{
                                  border: '2px solid var(--vtb-cyan)',
                                }}
                              />
                            )}
                            <Stack gap="sm" style={{ flex: 1 }}>
                              <div>
                                <Group gap="sm" mb="xs">
                                  <Text fw={700} c="white" size="lg">
                                    {registration.team_name}
                                  </Text>
                                  <Badge
                                    variant="light"
                                    color={registration.status === 'approved' ? 'green' : registration.status === 'rejected' ? 'red' : 'yellow'}
                                  >
                                    {registration.status === 'approved' ? 'Одобрено' : registration.status === 'rejected' ? 'Отклонено' : 'Ожидает'}
                                  </Badge>
                                </Group>
                                {registration.team_description && (
                                  <Text size="sm" c="dimmed" mb="xs">
                                    {registration.team_description}
                                  </Text>
                                )}
                                {registration.captain && (
                                  <Text size="sm" c="dimmed">
                                    <strong>Капитан:</strong> {registration.captain.first_name} {registration.captain.last_name}
                                  </Text>
                                )}
                                {registration.address && (
                                  <Group gap="xs" mt="xs">
                                    <IconMapPin size={16} color="var(--vtb-cyan)" />
                                    <Text size="sm" c="white">
                                      {registration.address}
                                    </Text>
                                  </Group>
                                )}
                              </div>

                              <div>
                                <Text size="sm" fw={600} c="white" mb="xs">
                                  Участники ({registration.members.length}):
                                </Text>
                                <Grid gutter="xs">
                                  {registration.members.map((member: any) => (
                                    <Grid.Col key={member.id} span={{ base: 12, sm: 6 }}>
                                      <Group gap="xs">
                                        <Avatar
                                          src={member.avatar}
                                          size="sm"
                                          radius="xl"
                                        />
                                        <div>
                                          <Text size="xs" c="white">
                                            {member.rank && `${member.rank} `}
                                            {member.first_name} {member.last_name}
                                            {member.middle_name && ` ${member.middle_name}`}
                                          </Text>
                                          {member.position && (
                                            <Text size="xs" c="dimmed">
                                              {member.position}
                                            </Text>
                                          )}
                                        </div>
                                      </Group>
                                    </Grid.Col>
                                  ))}
                                </Grid>
                              </div>

                              <Text size="xs" c="dimmed">
                                Зарегистрирована: {dayjs(registration.applied_at).format('DD.MM.YYYY HH:mm')}
                              </Text>
                            </Stack>
                          </Group>

                          {user?.is_moderator && (
                            <Tooltip label="Удалить команду">
                              <ActionIcon
                                color="red"
                                variant="subtle"
                                onClick={() => handleRemoveTeam(registration)}
                              >
                                <IconTrash size={20} />
                              </ActionIcon>
                            </Tooltip>
                          )}
                        </Group>
                      </VTBCard>
                    ))}
                  </Stack>
                ) : (
                  <Text c="dimmed" ta="center">
                    Пока нет зарегистрированных команд
                  </Text>
                )}
              </VTBCard>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="results" pt="xl">
            <VTBCard variant="secondary">
              {competition.results && competition.results.length > 0 ? (
                <Stack gap="md">
                  {competition.results.map((result: any, index: number) => (
                    <VTBCard key={result.id} variant="primary">
                      <Group justify="space-between">
                        <Group>
                          <Badge
                            size="xl"
                            variant="light"
                            color={index === 0 ? 'yellow' : index === 1 ? 'gray' : index === 2 ? 'orange' : 'cyan'}
                            style={{
                              background: index === 0 ? 'rgba(251, 191, 36, 0.2)' : index === 1 ? 'rgba(156, 163, 175, 0.2)' : index === 2 ? 'rgba(249, 115, 22, 0.2)' : 'rgba(0, 217, 255, 0.2)',
                              color: index === 0 ? '#fbbf24' : index === 1 ? '#9ca3af' : index === 2 ? '#f97316' : 'var(--vtb-cyan)',
                              border: `1px solid ${index === 0 ? '#fbbf24' : index === 1 ? '#9ca3af' : index === 2 ? '#f97316' : 'var(--vtb-cyan)'}`,
                            }}
                          >
                            {index + 1} место
                          </Badge>
                          <div>
                            <Text fw={700} c="white">{result.participant_name}</Text>
                            {result.team_name && (
                              <Text size="sm" c="dimmed">Команда: {result.team_name}</Text>
                            )}
                          </div>
                        </Group>
                        {result.score && (
                          <Text fw={600} c="var(--vtb-cyan)" size="lg">
                            {result.score} баллов
                          </Text>
                        )}
                      </Group>
                    </VTBCard>
                  ))}
                </Stack>
              ) : (
                <Text c="dimmed" ta="center">
                  Результаты пока не опубликованы
                </Text>
              )}
            </VTBCard>
          </Tabs.Panel>
        </Tabs>

        <Modal
          opened={removeConfirmOpened}
          onClose={() => {
            setRemoveConfirmOpened(false);
            setTeamToRemove(null);
          }}
          title="Подтвердите удаление"
          centered
        >
          <Stack gap="md">
            <Text>
              Вы уверены, что хотите удалить команду <strong>{teamToRemove?.team_name}</strong> из соревнования?
            </Text>
            <Text size="sm" c="dimmed">
              Всем участникам команды будет отправлено уведомление об удалении.
            </Text>
            <Group justify="flex-end" gap="sm">
              <VTBButton
                variant="secondary"
                onClick={() => {
                  setRemoveConfirmOpened(false);
                  setTeamToRemove(null);
                }}
              >
                Отмена
              </VTBButton>
              <VTBButton
                color="red"
                onClick={() => {
                  if (teamToRemove) {
                    removeTeamMutation.mutate({
                      competitionId: Number(id),
                      registrationId: teamToRemove.id,
                    });
                  }
                }}
                loading={removeTeamMutation.isPending}
              >
                Удалить
              </VTBButton>
            </Group>
          </Stack>
        </Modal>

        <TeamRegistrationModal
          opened={registrationModalOpened}
          onClose={() => setRegistrationModalOpened(false)}
          competition={competition}
          onSuccess={handleRegistrationSuccess}
        />
      </Stack>
    </Container>
  );
}
