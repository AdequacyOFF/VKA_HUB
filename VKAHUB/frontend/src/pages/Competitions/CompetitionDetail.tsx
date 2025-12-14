import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Title, Grid, Stack, Badge, Text, Group, Tabs, Avatar, Timeline, Accordion, Divider } from '@mantine/core';
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
  IconCode
} from '@tabler/icons-react';
import { VTBCard } from '../../components/common/VTBCard';
import { VTBButton } from '../../components/common/VTBButton';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { competitionsApi } from '../../api';
import { useAuthStore } from '../../store/authStore';
import { Competition } from '../../types';
import dayjs from 'dayjs';

export function CompetitionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const [joinModalOpened, setJoinModalOpened] = useState(false);

  const { data: competition, isLoading } = useQuery<Competition>({
    queryKey: ['competition', id],
    queryFn: async () => {
      const response = await competitionsApi.getCompetition(Number(id));
      return response;
    },
    enabled: !!id,
  });

  const joinMutation = useMutation({
    mutationFn: () => competitionsApi.joinCompetition(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competition', id] });
      notifications.show({
        title: 'Успех',
        message: 'Заявка на участие отправлена',
        color: 'teal',
      });
      setJoinModalOpened(false);
    },
    onError: () => {
      notifications.show({
        title: 'Ошибка',
        message: 'Не удалось отправить заявку',
        color: 'red',
      });
    },
  });

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

  const isParticipant = competition.participants?.some((p: any) => p.user_id === user?.id);
  const canRegister = competition.status === 'upcoming' || competition.status === 'ongoing';
  const isRegistrationOpen = competition.registration_deadline
    ? dayjs().isBefore(dayjs(competition.registration_deadline))
    : true;

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
                      color={getStatusColor(competition.status)}
                      size="lg"
                      style={{
                        background: `rgba(${getStatusColor(competition.status) === 'blue' ? '59, 130, 246' : getStatusColor(competition.status) === 'green' ? '34, 197, 94' : '156, 163, 175'}, 0.2)`,
                        color: getStatusColor(competition.status) === 'blue' ? 'var(--vtb-blue-light)' : getStatusColor(competition.status) === 'green' ? '#22c55e' : '#9ca3af',
                        border: `1px solid ${getStatusColor(competition.status) === 'blue' ? 'var(--vtb-blue-light)' : getStatusColor(competition.status) === 'green' ? '#22c55e' : '#9ca3af'}`,
                      }}
                    >
                      {getStatusLabel(competition.status)}
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
                        onClick={() => setJoinModalOpened(true)}
                      >
                        Подать заявку на участие
                      </VTBButton>
                    )}
                  </>
                )}

                {isParticipant && (
                  <Group
                    p="md"
                    style={{
                      background: 'rgba(34, 197, 94, 0.1)',
                      border: '1px solid #22c55e',
                      borderRadius: 12,
                    }}
                  >
                    <IconTrophy size={20} color="#22c55e" />
                    <Text size="sm" c="#22c55e" fw={600}>
                      Вы зарегистрированы на это соревнование
                    </Text>
                  </Group>
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
            <VTBCard variant="secondary">
              {competition.participants && competition.participants.length > 0 ? (
                <Grid gutter="md">
                  {competition.participants.map((participant: any) => (
                    <Grid.Col key={participant.id} span={{ base: 12, sm: 6, md: 4 }}>
                      <div
                        className="glass-card"
                        style={{
                          padding: 16,
                          cursor: 'pointer',
                        }}
                        onClick={() => navigate(`/users/${participant.user_id}`)}
                      >
                        <Group>
                          <Avatar
                            src={participant.avatar}
                            size="lg"
                            radius="xl"
                            className="vtb-avatar"
                            style={{
                              border: '3px solid var(--vtb-cyan)',
                            }}
                          />
                          <Stack gap={4} style={{ flex: 1 }}>
                            <Text fw={600} c="white" size="sm">
                              {participant.first_name} {participant.last_name}
                            </Text>
                            {participant.team_name && (
                              <Text size="xs" c="dimmed">
                                Команда: {participant.team_name}
                              </Text>
                            )}
                          </Stack>
                        </Group>
                      </div>
                    </Grid.Col>
                  ))}
                </Grid>
              ) : (
                <Text c="dimmed" ta="center">
                  Пока нет участников
                </Text>
              )}
            </VTBCard>
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

        <ConfirmModal
          opened={joinModalOpened}
          onClose={() => setJoinModalOpened(false)}
          onConfirm={() => joinMutation.mutate()}
          title="Подать заявку на участие"
          message={`Вы уверены, что хотите подать заявку на участие в соревновании "${competition.name}"?`}
          confirmText="Подать заявку"
          loading={joinMutation.isPending}
        />
      </Stack>
    </Container>
  );
}
