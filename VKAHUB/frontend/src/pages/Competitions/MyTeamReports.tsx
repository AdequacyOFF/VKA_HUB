import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Title,
  Text,
  Stack,
  Alert,
  Badge,
  Group,
  Anchor,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconFileText, IconTrophy, IconBrandGithub, IconExternalLink } from '@tabler/icons-react';
import { VTBCard } from '../../components/common/VTBCard';
import { VTBButton } from '../../components/common/VTBButton';
import { competitionsApi } from '../../api/competitions';

interface CompetitionReport {
  id: number;
  registration_id: number;
  team_name: string;
  competition_name: string;
  result: string;
  git_link: string;
  project_url?: string;
  presentation_url: string;
  screenshot_url?: string;
  brief_summary: string;
  placement?: number;
  technologies_used?: string;
  individual_contributions?: string;
  team_evaluation?: string;
  problems_faced?: string;
  submitted_by: number;
  submitted_at: string;
}

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

export default function MyTeamReports() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<CompetitionReport[]>([]);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const response = await competitionsApi.getMyTeamReports();
        setReports(response.reports || []);
      } catch (error: any) {
        notifications.show({
          title: 'Ошибка',
          message: error.response?.data?.detail || 'Не удалось загрузить отчеты',
          color: 'red',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  if (loading) {
    return (
      <Container size="lg" py="xl">
        <Text c="white" ta="center">Загрузка...</Text>
      </Container>
    );
  }

  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        <div>
          <Title order={1} className="vtb-heading-hero">
            <span className="vtb-gradient-text">Отчеты моих команд</span>
          </Title>
          <Text size="lg" c="dimmed" mt="md">
            Просмотр всех отчетов по соревнованиям, поданных вашими командами
          </Text>
        </div>

        <Group>
          <VTBButton
            leftSection={<IconFileText size={18} />}
            onClick={() => navigate('/competitions/submit-report')}
          >
            Подать новый отчет
          </VTBButton>
        </Group>

        {reports.length === 0 ? (
          <Alert icon={<IconAlertCircle />} color="blue" variant="light">
            <Text size="sm">
              У вас пока нет поданных отчетов. После завершения соревнования капитан команды может подать отчет о результатах.
            </Text>
          </Alert>
        ) : (
          <Stack gap="md">
            {reports.map((report) => (
              <VTBCard key={report.id} variant="primary">
                <Stack gap="md">
                  <Group justify="space-between" align="flex-start">
                    <div>
                      <Text size="xl" fw={700} c="white">
                        {report.competition_name}
                      </Text>
                      <Text size="sm" c="dimmed">
                        Команда: {report.team_name}
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
                    <Badge
                      size="lg"
                      color={RESULT_COLORS[report.result] || 'gray'}
                      variant="filled"
                    >
                      {RESULT_LABELS[report.result] || report.result}
                    </Badge>
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

                  {report.screenshot_url && (
                    <div>
                      <Text size="sm" fw={600} c="white" mb={8}>
                        Скринкаст результата:
                      </Text>
                      <video
                        src={report.screenshot_url}
                        controls
                        style={{
                          maxWidth: 500,
                          borderRadius: 8,
                          border: '1px solid var(--vtb-cyan)',
                        }}
                      />
                    </div>
                  )}

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
        )}
      </Stack>
    </Container>
  );
}
