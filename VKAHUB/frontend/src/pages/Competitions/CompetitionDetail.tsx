import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Title, Grid, Stack, Badge, Text, Group, Tabs, Avatar, Timeline, Accordion, Divider, ActionIcon, Tooltip, Modal, Anchor, Select, Textarea, TextInput } from '@mantine/core';
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
  IconDownload,
  IconEdit,
  IconCircleCheck,
  IconCircleX,
  IconBrandGithub,
  IconExternalLink,
  IconFileText
} from '@tabler/icons-react';
import { VTBCard } from '../../components/common/VTBCard';
import { VTBButton } from '../../components/common/VTBButton';
import { TeamRegistrationModal } from '../../components/common/TeamRegistrationModal';
import { competitionsApi } from '../../api';
import { useAuthStore } from '../../store/authStore';
import { Competition } from '../../types';
import dayjs from 'dayjs';
import { invalidateCompetitionQueries } from '../../utils/cacheInvalidation';
import { queryKeys } from '../../api/queryKeys';

export function CompetitionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const [registrationModalOpened, setRegistrationModalOpened] = useState(false);
  const [removeConfirmOpened, setRemoveConfirmOpened] = useState(false);
  const [teamToRemove, setTeamToRemove] = useState<any>(null);

  // Report edit/delete state
  const [editReportModalOpened, setEditReportModalOpened] = useState(false);
  const [deleteReportModalOpened, setDeleteReportModalOpened] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [editReportForm, setEditReportForm] = useState({
    result: '',
    git_link: '',
    project_url: '',
    presentation_url: '',
    brief_summary: '',
    technologies_used: '',
    individual_contributions: '',
    team_evaluation: '',
    problems_faced: '',
    screenshot_url: '',
  });

  const { data: competition, isLoading } = useQuery<Competition>({
    queryKey: queryKeys.competitions.detail(id!),
    queryFn: async () => {
      const response = await competitionsApi.getCompetition(Number(id));
      return response;
    },
    enabled: !!id,
  });

  const { data: registrationsData } = useQuery({
    queryKey: queryKeys.competitions.registrations(id!),
    queryFn: async () => {
      const response = await competitionsApi.getCompetitionRegistrations(Number(id));
      return response;
    },
    enabled: !!id,
  });

  // Query for user's reports
  const { data: myReportsData, isLoading: isLoadingReports } = useQuery({
    queryKey: ['myReports'],
    queryFn: async () => {
      const response = await competitionsApi.getMyTeamReports();
      return response;
    },
    enabled: !!user,
  });

  // Result labels and colors for reports
  const RESULT_LABELS: Record<string, string> = {
    '1st_place': '🥇 1 место',
    '2nd_place': '🥈 2 место',
    '3rd_place': '🥉 3 место',
    'finalist': '🏆 Финалист',
    'semi_finalist': '⭐ Полуфиналист',
    'did_not_pass': '❌ Не прошли',
  };

  const RESULT_COLORS: Record<string, string> = {
    '1st_place': 'yellow',
    '2nd_place': 'gray',
    '3rd_place': 'orange',
    'finalist': 'teal',
    'semi_finalist': 'blue',
    'did_not_pass': 'red',
  };

  const RESULT_OPTIONS = [
    { value: '1st_place', label: '1 место' },
    { value: '2nd_place', label: '2 место' },
    { value: '3rd_place', label: '3 место' },
    { value: 'finalist', label: 'Финалист' },
    { value: 'semi_finalist', label: 'Полуфиналист' },
    { value: 'did_not_pass', label: 'Не прошли' },
  ];

  // Filter reports for the current competition
  const myCompetitionReports = myReportsData?.reports?.filter(
    (report: any) => report.competition_name === competition?.name
  ) || [];

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

  const updateStatusMutation = useMutation({
    mutationFn: ({ competitionId, registrationId, status }: { competitionId: number; registrationId: number; status: 'approved' | 'rejected' }) =>
      competitionsApi.updateRegistrationStatus(competitionId, registrationId, status),
    onSuccess: (_, variables) => {
      const statusText = variables.status === 'approved' ? 'одобрена' : 'отклонена';
      notifications.show({
        title: `Заявка ${statusText}`,
        message: `Заявка команды успешно ${statusText}`,
        color: variables.status === 'approved' ? 'green' : 'red',
      });

      // Invalidate to refresh the list
      invalidateCompetitionQueries({ queryClient }, Number(id));
    },
    onError: () => {
      notifications.show({
        title: 'Ошибка',
        message: 'Не удалось обновить статус заявки',
        color: 'red',
      });
    },
  });

  // Mutation for updating report
  const updateReportMutation = useMutation({
    mutationFn: async (data: { reportId: number; reportData: typeof editReportForm }) => {
      return competitionsApi.updateCompetitionReport(data.reportId, data.reportData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myReports'] });
      notifications.show({
        title: 'Успех',
        message: 'Отчет успешно обновлен',
        color: 'green',
      });
      setEditReportModalOpened(false);
      setSelectedReport(null);
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Ошибка',
        message: error?.response?.data?.detail || 'Не удалось обновить отчет',
        color: 'red',
      });
    },
  });

  // Mutation for deleting report
  const deleteReportMutation = useMutation({
    mutationFn: async (reportId: number) => {
      return competitionsApi.deleteCompetitionReport(reportId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myReports'] });
      notifications.show({
        title: 'Успех',
        message: 'Отчет успешно удален',
        color: 'green',
      });
      setDeleteReportModalOpened(false);
      setSelectedReport(null);
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Ошибка',
        message: error?.response?.data?.detail || 'Не удалось удалить отчет',
        color: 'red',
      });
    },
  });

  // Open edit report modal
  const openEditReportModal = (report: any) => {
    setSelectedReport(report);
    setEditReportForm({
      result: report.result || '',
      git_link: report.git_link || '',
      project_url: report.project_url || '',
      presentation_url: report.presentation_url || '',
      brief_summary: report.brief_summary || '',
      technologies_used: report.technologies_used || '',
      individual_contributions: report.individual_contributions || '',
      team_evaluation: report.team_evaluation || '',
      problems_faced: report.problems_faced || '',
      screenshot_url: report.screenshot_url || '',
    });
    setEditReportModalOpened(true);
  };

  // Open delete report modal
  const openDeleteReportModal = (report: any) => {
    setSelectedReport(report);
    setDeleteReportModalOpened(true);
  };

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
  const canRegister = competitionStatus === 'upcoming' || competitionStatus === 'ongoing';
  const isRegistrationOpen = competition.registration_deadline
    ? dayjs().isBefore(dayjs(competition.registration_deadline))
    : true;

  // Check if competition has ended
  const competitionEnded = dayjs().isAfter(dayjs(competition.end_date));

  // Find if user is a member of any registered team (captain or regular member)
  // Use registrationsData which has full member information
  const userTeamRegistration = registrationsData?.registrations?.find((reg: any) => {
    // Check if user is captain
    if (reg.captain?.id === user?.id) return true;
    // Check if user is in members list
    if (reg.members?.some((member: any) => member.user_id === user?.id)) return true;
    return false;
  });

  const isTeamMember = !!userTeamRegistration;
  const isParticipant = isTeamMember; // User is participant if they are a team member
  const hasSubmittedReport = userTeamRegistration?.has_report || false;

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

                  <Group justify="space-between" align="flex-start" mb="md">
                    <Title order={1} c="white">
                      {competition.name}
                    </Title>
                    {user?.is_moderator && (
                      <VTBButton
                        leftSection={<IconEdit size={18} />}
                        variant="secondary"
                        onClick={() => navigate(`/moderator/competitions/${competition.id}/edit`)}
                      >
                        Редактировать
                      </VTBButton>
                    )}
                  </Group>

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

                    {/* Submit report button for team members */}
                    {isTeamMember && !hasSubmittedReport && (
                      <Group
                        p="md"
                        style={{
                          background: 'rgba(0, 217, 255, 0.1)',
                          border: '1px solid var(--vtb-cyan)',
                          borderRadius: 12,
                        }}
                      >
                        <Stack gap="sm" style={{ flex: 1 }}>
                          <Group>
                            <IconFileDescription size={20} color="var(--vtb-cyan)" />
                            <Text size="sm" c="var(--vtb-cyan)" fw={600}>
                              Подать отчет о соревновании
                            </Text>
                          </Group>
                          <Text size="xs" c="dimmed">
                            Любой участник команды может подать отчет о результатах соревнования.
                          </Text>
                          <VTBButton
                            leftSection={<IconFileDescription size={18} />}
                            onClick={() => navigate(`/competitions/${competition.id}/registrations/${userTeamRegistration.id}/report`)}
                            variant="secondary"
                          >
                            Подать отчет
                          </VTBButton>
                        </Stack>
                      </Group>
                    )}

                    {isTeamMember && hasSubmittedReport && (
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
            {user && (
              <Tabs.Tab value="my-reports" leftSection={<IconFileText size={18} />}>
                Мои отчеты
              </Tabs.Tab>
            )}
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
                            <Group gap="xs">
                              {registration.status === 'pending' && (
                                <>
                                  <Tooltip label="Одобрить заявку">
                                    <ActionIcon
                                      color="green"
                                      variant="subtle"
                                      onClick={() => updateStatusMutation.mutate({
                                        competitionId: Number(id),
                                        registrationId: registration.id,
                                        status: 'approved'
                                      })}
                                      loading={updateStatusMutation.isPending}
                                    >
                                      <IconCircleCheck size={20} />
                                    </ActionIcon>
                                  </Tooltip>
                                  <Tooltip label="Отклонить заявку">
                                    <ActionIcon
                                      color="orange"
                                      variant="subtle"
                                      onClick={() => updateStatusMutation.mutate({
                                        competitionId: Number(id),
                                        registrationId: registration.id,
                                        status: 'rejected'
                                      })}
                                      loading={updateStatusMutation.isPending}
                                    >
                                      <IconCircleX size={20} />
                                    </ActionIcon>
                                  </Tooltip>
                                </>
                              )}
                              <Tooltip label="Удалить команду">
                                <ActionIcon
                                  color="red"
                                  variant="subtle"
                                  onClick={() => handleRemoveTeam(registration)}
                                >
                                  <IconTrash size={20} />
                                </ActionIcon>
                              </Tooltip>
                            </Group>
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

          {user && (
            <Tabs.Panel value="my-reports" pt="xl">
              <VTBCard variant="secondary">
                {isLoadingReports ? (
                  <Text c="dimmed" ta="center">Загрузка отчетов...</Text>
                ) : myCompetitionReports.length > 0 ? (
                  <Stack gap="md">
                    {myCompetitionReports.map((report: any) => (
                      <VTBCard key={report.id} variant="primary">
                        <Stack gap="md">
                          <Group justify="space-between" align="flex-start">
                            <div>
                              <Text size="lg" fw={700} c="white">
                                {report.team_name}
                              </Text>
                              <Text size="xs" c="dimmed">
                                Отправлено: {new Date(report.submitted_at).toLocaleDateString('ru-RU', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </Text>
                            </div>
                            <Group gap="xs">
                              <Badge
                                size="lg"
                                color={RESULT_COLORS[report.result] || 'gray'}
                                variant="filled"
                              >
                                {RESULT_LABELS[report.result] || report.result}
                              </Badge>
                              <VTBButton
                                variant="secondary"
                                size="xs"
                                leftSection={<IconEdit size={16} />}
                                onClick={() => openEditReportModal(report)}
                              >
                                Изменить
                              </VTBButton>
                              <VTBButton
                                variant="secondary"
                                size="xs"
                                leftSection={<IconTrash size={16} />}
                                onClick={() => openDeleteReportModal(report)}
                                style={{ borderColor: 'var(--mantine-color-red-6)' }}
                              >
                                Удалить
                              </VTBButton>
                            </Group>
                          </Group>

                          <Text c="white" style={{ whiteSpace: 'pre-wrap' }}>
                            {report.brief_summary}
                          </Text>

                          <Group gap="md">
                            <Anchor
                              href={report.git_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              c="cyan"
                              style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                            >
                              <IconBrandGithub size={18} />
                              Репозиторий
                            </Anchor>

                            {report.project_url && (
                              <Anchor
                                href={report.project_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                c="cyan"
                                style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                              >
                                <IconExternalLink size={18} />
                                Проект
                              </Anchor>
                            )}

                            <Anchor
                              href={report.presentation_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              c="cyan"
                              style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                            >
                              <IconFileText size={18} />
                              Презентация
                            </Anchor>
                          </Group>

                          {report.technologies_used && (
                            <div>
                              <Text size="sm" fw={600} c="white" mb={4}>
                                Использованные технологии:
                              </Text>
                              <Text size="sm" c="dimmed">
                                {report.technologies_used}
                              </Text>
                            </div>
                          )}

                          {report.individual_contributions && (
                            <div>
                              <Text size="sm" fw={600} c="white" mb={4}>
                                Вклад участников:
                              </Text>
                              <Text size="sm" c="dimmed" style={{ whiteSpace: 'pre-wrap' }}>
                                {report.individual_contributions}
                              </Text>
                            </div>
                          )}

                          {report.team_evaluation && (
                            <div>
                              <Text size="sm" fw={600} c="white" mb={4}>
                                Оценка работы команды:
                              </Text>
                              <Text size="sm" c="dimmed" style={{ whiteSpace: 'pre-wrap' }}>
                                {report.team_evaluation}
                              </Text>
                            </div>
                          )}

                          {report.problems_faced && (
                            <div>
                              <Text size="sm" fw={600} c="white" mb={4}>
                                Проблемы и сложности:
                              </Text>
                              <Text size="sm" c="dimmed" style={{ whiteSpace: 'pre-wrap' }}>
                                {report.problems_faced}
                              </Text>
                            </div>
                          )}
                        </Stack>
                      </VTBCard>
                    ))}
                  </Stack>
                ) : (
                  <Stack gap="md" align="center">
                    <Text c="dimmed" ta="center">
                      У вас нет поданных отчетов по этому соревнованию
                    </Text>
                    {isTeamMember && !hasSubmittedReport && (
                      <VTBButton
                        leftSection={<IconFileDescription size={18} />}
                        onClick={() => navigate(`/competitions/${competition?.id}/registrations/${userTeamRegistration?.id}/report`)}
                      >
                        Подать отчет
                      </VTBButton>
                    )}
                  </Stack>
                )}
              </VTBCard>
            </Tabs.Panel>
          )}
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

        {/* Edit Report Modal */}
        <Modal
          opened={editReportModalOpened}
          onClose={() => {
            setEditReportModalOpened(false);
            setSelectedReport(null);
          }}
          title={`Редактирование отчета: ${selectedReport?.team_name || ''}`}
          size="xl"
          centered
        >
          <Stack gap="md">
            <div>
              <Text size="sm" fw={600} c="white" mb={4}>Результат</Text>
              <Select
                data={RESULT_OPTIONS}
                value={editReportForm.result}
                onChange={(value) => setEditReportForm({ ...editReportForm, result: value || '' })}
              />
            </div>

            <div>
              <Text size="sm" fw={600} c="white" mb={4}>Ссылка на GitHub</Text>
              <TextInput
                value={editReportForm.git_link}
                onChange={(e) => setEditReportForm({ ...editReportForm, git_link: e.target.value })}
                placeholder="https://github.com/..."
              />
            </div>

            <div>
              <Text size="sm" fw={600} c="white" mb={4}>Ссылка на проект</Text>
              <TextInput
                value={editReportForm.project_url}
                onChange={(e) => setEditReportForm({ ...editReportForm, project_url: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div>
              <Text size="sm" fw={600} c="white" mb={4}>Ссылка на презентацию</Text>
              <TextInput
                value={editReportForm.presentation_url}
                onChange={(e) => setEditReportForm({ ...editReportForm, presentation_url: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div>
              <Text size="sm" fw={600} c="white" mb={4}>Ссылка на скриншот</Text>
              <TextInput
                value={editReportForm.screenshot_url}
                onChange={(e) => setEditReportForm({ ...editReportForm, screenshot_url: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div>
              <Text size="sm" fw={600} c="white" mb={4}>Описание</Text>
              <Textarea
                value={editReportForm.brief_summary}
                onChange={(e) => setEditReportForm({ ...editReportForm, brief_summary: e.target.value })}
                minRows={4}
                placeholder="Краткое описание проекта..."
              />
            </div>

            <div>
              <Text size="sm" fw={600} c="white" mb={4}>Использованные технологии</Text>
              <Textarea
                value={editReportForm.technologies_used}
                onChange={(e) => setEditReportForm({ ...editReportForm, technologies_used: e.target.value })}
                minRows={2}
                placeholder="React, TypeScript, Python..."
              />
            </div>

            <div>
              <Text size="sm" fw={600} c="white" mb={4}>Вклад участников</Text>
              <Textarea
                value={editReportForm.individual_contributions}
                onChange={(e) => setEditReportForm({ ...editReportForm, individual_contributions: e.target.value })}
                minRows={2}
                placeholder="Описание вклада каждого участника..."
              />
            </div>

            <div>
              <Text size="sm" fw={600} c="white" mb={4}>Оценка работы команды</Text>
              <Textarea
                value={editReportForm.team_evaluation}
                onChange={(e) => setEditReportForm({ ...editReportForm, team_evaluation: e.target.value })}
                minRows={2}
                placeholder="Оценка командной работы..."
              />
            </div>

            <div>
              <Text size="sm" fw={600} c="white" mb={4}>Проблемы и сложности</Text>
              <Textarea
                value={editReportForm.problems_faced}
                onChange={(e) => setEditReportForm({ ...editReportForm, problems_faced: e.target.value })}
                minRows={2}
                placeholder="Какие проблемы возникли..."
              />
            </div>

            <Group justify="flex-end" mt="md">
              <VTBButton
                variant="secondary"
                onClick={() => {
                  setEditReportModalOpened(false);
                  setSelectedReport(null);
                }}
              >
                Отмена
              </VTBButton>
              <VTBButton
                onClick={() => {
                  if (selectedReport) {
                    updateReportMutation.mutate({
                      reportId: selectedReport.id,
                      reportData: editReportForm,
                    });
                  }
                }}
                loading={updateReportMutation.isPending}
              >
                Сохранить
              </VTBButton>
            </Group>
          </Stack>
        </Modal>

        {/* Delete Report Modal */}
        <Modal
          opened={deleteReportModalOpened}
          onClose={() => {
            setDeleteReportModalOpened(false);
            setSelectedReport(null);
          }}
          title="Удаление отчета"
          size="md"
          centered
        >
          <Stack gap="md">
            <Text c="dimmed">
              Вы уверены, что хотите удалить отчет команды "{selectedReport?.team_name}"?
              Это действие нельзя отменить.
            </Text>

            <Group justify="flex-end" mt="md">
              <VTBButton
                variant="secondary"
                onClick={() => {
                  setDeleteReportModalOpened(false);
                  setSelectedReport(null);
                }}
              >
                Отмена
              </VTBButton>
              <VTBButton
                color="red"
                onClick={() => {
                  if (selectedReport) {
                    deleteReportMutation.mutate(selectedReport.id);
                  }
                }}
                loading={deleteReportMutation.isPending}
              >
                Удалить
              </VTBButton>
            </Group>
          </Stack>
        </Modal>
      </Stack>
    </Container>
  );
}
