import { useParams, useNavigate } from 'react-router-dom';
import { Container, Title, Grid, Stack, Avatar, Badge, Text, Group, Tabs } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { IconUser, IconCertificate, IconBriefcase, IconTrophy, IconFlag } from '@tabler/icons-react';
import { VTBCard } from '../../components/common/VTBCard';
import { VTBButton } from '../../components/common/VTBButton';
import { usersApi } from '../../api';
import { useAuthStore } from '../../store/authStore';
import { User } from '../../types';
import dayjs from 'dayjs';

export function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();

  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ['user', id],
    queryFn: async () => {
      if (!id) throw new Error('User ID is required');
      return await usersApi.getUser(Number(id));
    },
    enabled: !!id,
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

  if (error || !user) {
    return (
      <Container size="xl" py="xl">
        <Title order={3} c="white" ta="center">
          Пользователь не найден
        </Title>
      </Container>
    );
  }

  const fullName = [user.last_name, user.first_name, user.middle_name].filter(Boolean).join(' ');

  // Ensure arrays are safe to use
  const safeRoles = Array.isArray(user.roles) ? user.roles : [];
  const safeSkills = Array.isArray(user.skills) ? user.skills : [];
  const safeCertificates = Array.isArray(user.certificates) ? user.certificates : [];
  const safeTeams = Array.isArray(user.teams) ? user.teams : [];
  const safeCompetitions = Array.isArray(user.competitions) ? user.competitions : [];

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <VTBCard variant="primary">
          <Grid gutter="xl">
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Stack align="center" gap="md">
                <Avatar
                  src={user.avatar_url}
                  size={180}
                  radius="50%"
                  className="vtb-avatar"
                  style={{
                    border: '4px solid var(--vtb-cyan)',
                    boxShadow: '0 8px 32px rgba(0, 217, 255, 0.4)',
                  }}
                >
                  <IconUser size={80} color="var(--vtb-cyan)" />
                </Avatar>
                <div style={{ textAlign: 'center' }}>
                  <Title order={2} c="white" mb="xs">
                    {fullName}
                  </Title>
                  <Text c="dimmed" size="sm">
                    @{user.login}
                  </Text>
                </div>
                {currentUser?.id !== user.id && (
                  <VTBButton
                    variant="secondary"
                    size="sm"
                    leftSection={<IconFlag size={16} />}
                    onClick={() => navigate(`/complaints/create?userId=${user.id}`)}
                  >
                    Пожаловаться
                  </VTBButton>
                )}
              </Stack>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 8 }}>
              <Stack gap="lg">
                <div>
                  <Text size="sm" c="dimmed" mb="xs">
                    Основная информация
                  </Text>
                  <Grid gutter="md">
                    {user.study_group && (
                      <Grid.Col span={6}>
                        <Text size="sm" c="dimmed">
                          Учебная группа
                        </Text>
                        <Text c="white" fw={600}>
                          {user.study_group}
                        </Text>
                      </Grid.Col>
                    )}
                    {user.rank && (
                      <Grid.Col span={6}>
                        <Text size="sm" c="dimmed">
                          Звание
                        </Text>
                        <Text c="white" fw={600}>
                          {user.rank}
                        </Text>
                      </Grid.Col>
                    )}
                    {user.position && (
                      <Grid.Col span={12}>
                        <Text size="sm" c="dimmed">
                          Должность
                        </Text>
                        <Text c="white" fw={600}>
                          {user.position}
                        </Text>
                      </Grid.Col>
                    )}
                  </Grid>
                </div>

                {safeRoles.length > 0 && (
                  <div>
                    <Text size="sm" c="dimmed" mb="xs">
                      Роли
                    </Text>
                    <Group gap="xs">
                      {safeRoles.map((role, index) => (
                        <Badge
                          key={index}
                          variant="light"
                          color="blue"
                          size="md"
                          style={{
                            background: 'rgba(59, 130, 246, 0.2)',
                            color: 'var(--vtb-blue-light)',
                            border: '1px solid var(--vtb-blue-light)',
                          }}
                        >
                          {role}
                        </Badge>
                      ))}
                    </Group>
                  </div>
                )}

                {safeSkills.length > 0 && (
                  <div>
                    <Text size="sm" c="dimmed" mb="xs">
                      Навыки
                    </Text>
                    <Group gap="xs">
                      {safeSkills.map((skill, index) => (
                        <Badge
                          key={index}
                          variant="light"
                          color="cyan"
                          size="sm"
                          style={{
                            background: 'rgba(0, 217, 255, 0.2)',
                            color: 'var(--vtb-cyan)',
                            border: '1px solid var(--vtb-cyan)',
                          }}
                        >
                          {skill}
                        </Badge>
                      ))}
                    </Group>
                  </div>
                )}
              </Stack>
            </Grid.Col>
          </Grid>
        </VTBCard>

        <Tabs
          defaultValue="certificates"
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
            <Tabs.Tab value="certificates" leftSection={<IconCertificate size={18} />}>
              Сертификаты
            </Tabs.Tab>
            <Tabs.Tab value="teams" leftSection={<IconBriefcase size={18} />}>
              Команды
            </Tabs.Tab>
            <Tabs.Tab value="competitions" leftSection={<IconTrophy size={18} />}>
              Соревнования
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="certificates" pt="xl">
            <VTBCard variant="secondary">
              {safeCertificates.length > 0 ? (
                <Grid gutter="md">
                  {safeCertificates.map((cert) => (
                    <Grid.Col key={cert.id} span={{ base: 12, sm: 6, md: 4 }}>
                      <VTBCard variant="primary">
                        <Stack gap="xs">
                          <Text fw={700} c="white">
                            {cert.title || 'Без названия'}
                          </Text>
                          <Text size="sm" c="dimmed">
                            {cert.category || 'Без категории'}
                          </Text>
                          {cert.issued_date && (
                            <Text size="xs" c="dimmed">
                              {dayjs(cert.issued_date).format('DD.MM.YYYY')}
                            </Text>
                          )}
                        </Stack>
                      </VTBCard>
                    </Grid.Col>
                  ))}
                </Grid>
              ) : (
                <Text c="dimmed" ta="center">
                  Сертификаты отсутствуют
                </Text>
              )}
            </VTBCard>
          </Tabs.Panel>

          <Tabs.Panel value="teams" pt="xl">
            <VTBCard variant="secondary">
              {safeTeams.length > 0 ? (
                <Stack gap="md">
                  {safeTeams.map((team) => (
                    <VTBCard
                      key={team.id}
                      variant="primary"
                      onClick={() => navigate(`/teams/${team.id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <Text fw={700} c="white">
                        {team.name || 'Без названия'}
                      </Text>
                    </VTBCard>
                  ))}
                </Stack>
              ) : (
                <Text c="dimmed" ta="center">
                  Не состоит в командах
                </Text>
              )}
            </VTBCard>
          </Tabs.Panel>

          <Tabs.Panel value="competitions" pt="xl">
            <VTBCard variant="secondary">
              {safeCompetitions.length > 0 ? (
                <Stack gap="md">
                  {safeCompetitions.map((comp) => (
                    <VTBCard key={comp.id} variant="primary">
                      <Text fw={700} c="white">
                        {comp.name || 'Без названия'}
                      </Text>
                    </VTBCard>
                  ))}
                </Stack>
              ) : (
                <Text c="dimmed" ta="center">
                  Не участвовал в соревнованиях
                </Text>
              )}
            </VTBCard>
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  );
}
