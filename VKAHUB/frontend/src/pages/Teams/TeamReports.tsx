import { useState } from 'react';
import { Container, Title, Stack, Text, Group, Badge, Anchor, Modal, Select, Textarea, Image } from '@mantine/core';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { IconArrowLeft, IconFileText, IconTrophy, IconBrandGithub, IconExternalLink, IconEdit, IconTrash, IconPhoto } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { VTBCard } from '../../components/common/VTBCard';
import { VTBButton } from '../../components/common/VTBButton';
import { ConsoleInput } from '../../components/common/ConsoleInput';
import { api } from '../../api';
import { competitionsApi } from '../../api/competitions';
import { useAuthStore } from '../../store/authStore';
import { queryKeys } from '../../api/queryKeys';

interface CompetitionReport {
  id: number;
  registration_id: number;
  team_id: number;
  team_name: string;
  competition_id: number;
  competition_name: string;
  result: string;
  git_link: string;
  project_url?: string;
  presentation_url: string;
  brief_summary: string;
  placement?: number;
  technologies_used?: string;
  individual_contributions?: string;
  team_evaluation?: string;
  problems_faced?: string;
  screenshot_url?: string;
  submitted_by: number;
  submitted_at: string;
}

const RESULT_LABELS: Record<string, string> = {
  '1st_place': '1 место',
  '2nd_place': '2 место',
  '3rd_place': '3 место',
  'finalist': 'Финалист',
  'semi_finalist': 'Полуфиналист',
  'did_not_pass': 'Не прошли',
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

// Console path label component
const ConsoleLabel = ({ path, label, children }: { path: string; label?: string; children: React.ReactNode }) => (
  <div>
    {label && (
      <div style={{ marginBottom: 4 }}>
        <span style={{ color: '#ffffff', fontWeight: 600, fontSize: '14px' }}>
          {label}
        </span>
      </div>
    )}
    <div
      style={{
        color: 'var(--vtb-cyan)',
        fontFamily: "'Courier New', 'Consolas', monospace",
        fontSize: '13px',
        fontWeight: 'bold',
        marginBottom: '4px',
        userSelect: 'none',
      }}
    >
      {path} &gt;
    </div>
    {children}
  </div>
);

export function TeamReports() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const [editModalOpened, setEditModalOpened] = useState(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [selectedReport, setSelectedReport] = useState<CompetitionReport | null>(null);
  const [editForm, setEditForm] = useState({
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

  // Определяем источник перехода
  const fromProfile = location.state?.from === 'profile';

  // Получаем информацию о команде
  const { data: team } = useQuery({
    queryKey: queryKeys.teams.detail(id!),
    queryFn: async () => {
      try {
        const response = await api.get(`/api/teams/${id}`);
        return response.data;
      } catch (error) {
        console.error('Failed to fetch team:', error);
        return null;
      }
    },
    enabled: !!id,
  });

  // Проверяем, является ли пользователь капитаном
  const isCaptain = team?.captain_id === user?.id;

  // Проверяем, является ли пользователь членом команды
  const isTeamMember = isCaptain || (team?.members?.some((m: any) => m.user_id === user?.id) ?? false);

  const { data: reports = [], isLoading } = useQuery<CompetitionReport[]>({
    queryKey: queryKeys.teams.reports(id!),
    queryFn: async () => {
      try {
        const response = await api.get(`/api/teams/${id}/reports`);
        return Array.isArray(response.data) ? response.data : (response.data.items || []);
      } catch (error) {
        console.error('Failed to fetch team reports:', error);
        return [];
      }
    },
    enabled: !!id,
  });

  // Мутация для обновления отчета
  const updateReportMutation = useMutation({
    mutationFn: async (data: { reportId: number; reportData: typeof editForm }) => {
      return competitionsApi.updateCompetitionReport(data.reportId, data.reportData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teams.reports(id!) });
      notifications.show({
        title: 'Успех',
        message: 'Отчет обновлен',
        color: 'teal',
      });
      setEditModalOpened(false);
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

  // Мутация для удаления отчета
  const deleteReportMutation = useMutation({
    mutationFn: async (reportId: number) => {
      return competitionsApi.deleteCompetitionReport(reportId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teams.reports(id!) });
      notifications.show({
        title: 'Успех',
        message: 'Отчет удален',
        color: 'teal',
      });
      setDeleteModalOpened(false);
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

  // Функция для возврата назад
  const handleBack = () => {
    if (fromProfile) {
      navigate('/profile?tab=my-team');
    } else {
      navigate(`/teams/${id}`);
    }
  };

  // Открыть модальное окно редактирования
  const openEditModal = (report: CompetitionReport) => {
    setSelectedReport(report);
    setEditForm({
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
    setEditModalOpened(true);
  };

  // Открыть модальное окно удаления
  const openDeleteModal = (report: CompetitionReport) => {
    setSelectedReport(report);
    setDeleteModalOpened(true);
  };

  // Проверка прав на редактирование (любой член команды)
  const canEditReport = () => {
    return isTeamMember;
  };

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <div>
          <VTBButton
            variant="secondary"
            leftSection={<IconArrowLeft size={18} />}
            onClick={handleBack}
            mb="lg"
          >
            {fromProfile ? 'Назад в профиль' : 'Назад к команде'}
          </VTBButton>

          <Group justify="space-between" align="flex-start">
            <div>
              <Title order={1} className="vtb-heading-hero">
                <span className="vtb-gradient-text">Отчеты команды</span>
              </Title>
              <Text size="lg" c="dimmed" mt="md">
                Отчеты по соревнованиям команды {team?.name || ''}
              </Text>
            </div>

            {/* Кнопка подачи нового отчета (любой член команды) */}
            {isTeamMember && (
              <VTBButton
                leftSection={<IconFileText size={18} />}
                onClick={() => navigate('/competitions/submit-report')}
              >
                Подать новый отчет
              </VTBButton>
            )}
          </Group>
        </div>

        {isLoading ? (
          <VTBCard variant="secondary">
            <Text c="white" ta="center">Загрузка...</Text>
          </VTBCard>
        ) : reports.length === 0 ? (
          <VTBCard variant="accent">
            <Stack align="center" gap="xl" py="xl">
              <IconTrophy size={80} color="var(--vtb-cyan)" opacity={0.5} />
              <div>
                <Title order={3} c="white" ta="center" mb="xs">
                  Отчетов пока нет
                </Title>
                <Text c="dimmed" ta="center">
                  {isTeamMember
                    ? 'После завершения соревнования вы можете подать отчет о результатах'
                    : 'Здесь будут отображаться отчеты команды по соревнованиям'}
                </Text>
              </div>
              {isTeamMember && (
                <VTBButton
                  leftSection={<IconFileText size={18} />}
                  onClick={() => navigate('/competitions/submit-report')}
                >
                  Подать отчет
                </VTBButton>
              )}
            </Stack>
          </VTBCard>
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
                      {report.result && (
                        <Badge
                          size="lg"
                          color={RESULT_COLORS[report.result] || 'gray'}
                          variant="filled"
                        >
                          {RESULT_LABELS[report.result] || report.result}
                        </Badge>
                      )}
                      {canEditReport() && (
                        <>
                          <VTBButton
                            variant="secondary"
                            size="xs"
                            leftSection={<IconEdit size={16} />}
                            onClick={() => openEditModal(report)}
                          >
                            Изменить
                          </VTBButton>
                          <VTBButton
                            variant="secondary"
                            size="xs"
                            leftSection={<IconTrash size={16} />}
                            onClick={() => openDeleteModal(report)}
                            style={{ borderColor: 'var(--mantine-color-red-6)' }}
                          >
                            Удалить
                          </VTBButton>
                        </>
                      )}
                    </Group>
                  </Group>

                  <Text c="white" style={{ whiteSpace: 'pre-wrap' }}>
                    {report.brief_summary}
                  </Text>

                  {/* Скриншот */}
                  {report.screenshot_url && (
                    <div>
                      <Text size="sm" fw={600} c="white" mb={8}>
                        <IconPhoto size={16} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                        Скриншот результата:
                      </Text>
                      <Image
                        src={report.screenshot_url}
                        alt="Скриншот результата"
                        radius="md"
                        maw={600}
                        style={{ border: '1px solid var(--vtb-cyan)', borderRadius: 8 }}
                      />
                    </div>
                  )}

                  <Group gap="md">
                    {report.git_link && (
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
                    )}

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

                    {report.presentation_url && (
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
                    )}
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
        )}
      </Stack>

      {/* Модальное окно редактирования */}
      <Modal
        opened={editModalOpened}
        onClose={() => {
          setEditModalOpened(false);
          setSelectedReport(null);
        }}
        title={`Редактирование отчета: ${selectedReport?.competition_name || ''}`}
        size="xl"
        centered
      >
        <Stack gap="md">
          <ConsoleLabel path="C:\Report\result" label="Результат">
            <Select
              data={RESULT_OPTIONS}
              value={editForm.result}
              onChange={(value) => setEditForm({ ...editForm, result: value || '' })}
              classNames={{ input: 'glass-input' }}
            />
          </ConsoleLabel>

          <ConsoleInput
            label="Ссылка на GitHub"
            consolePath="C:\Report\github"
            value={editForm.git_link}
            onChange={(e) => setEditForm({ ...editForm, git_link: e.target.value })}
          />

          <ConsoleInput
            label="Ссылка на проект"
            consolePath="C:\Report\project"
            value={editForm.project_url}
            onChange={(e) => setEditForm({ ...editForm, project_url: e.target.value })}
          />

          <ConsoleInput
            label="Ссылка на презентацию"
            consolePath="C:\Report\presentation"
            value={editForm.presentation_url}
            onChange={(e) => setEditForm({ ...editForm, presentation_url: e.target.value })}
          />

          <ConsoleInput
            label="Ссылка на скриншот"
            consolePath="C:\Report\screenshot"
            value={editForm.screenshot_url}
            onChange={(e) => setEditForm({ ...editForm, screenshot_url: e.target.value })}
          />

          <ConsoleLabel path="C:\Report\summary" label="Описание">
            <Textarea
              value={editForm.brief_summary}
              onChange={(e) => setEditForm({ ...editForm, brief_summary: e.target.value })}
              minRows={4}
              classNames={{ input: 'glass-input' }}
            />
          </ConsoleLabel>

          <ConsoleLabel path="C:\Report\technologies" label="Технологии">
            <Textarea
              value={editForm.technologies_used}
              onChange={(e) => setEditForm({ ...editForm, technologies_used: e.target.value })}
              minRows={2}
              classNames={{ input: 'glass-input' }}
            />
          </ConsoleLabel>

          <ConsoleLabel path="C:\Report\contributions" label="Вклад участников">
            <Textarea
              value={editForm.individual_contributions}
              onChange={(e) => setEditForm({ ...editForm, individual_contributions: e.target.value })}
              minRows={2}
              classNames={{ input: 'glass-input' }}
            />
          </ConsoleLabel>

          <ConsoleLabel path="C:\Report\evaluation" label="Оценка работы команды">
            <Textarea
              value={editForm.team_evaluation}
              onChange={(e) => setEditForm({ ...editForm, team_evaluation: e.target.value })}
              minRows={2}
              classNames={{ input: 'glass-input' }}
            />
          </ConsoleLabel>

          <ConsoleLabel path="C:\Report\problems" label="Проблемы и сложности">
            <Textarea
              value={editForm.problems_faced}
              onChange={(e) => setEditForm({ ...editForm, problems_faced: e.target.value })}
              minRows={2}
              classNames={{ input: 'glass-input' }}
            />
          </ConsoleLabel>

          <Group justify="flex-end" mt="md">
            <VTBButton
              variant="secondary"
              onClick={() => {
                setEditModalOpened(false);
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
                    reportData: editForm,
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

      {/* Модальное окно удаления */}
      <Modal
        opened={deleteModalOpened}
        onClose={() => {
          setDeleteModalOpened(false);
          setSelectedReport(null);
        }}
        title="Удаление отчета"
        size="md"
        centered
      >
        <Stack gap="md">
          <Text c="dimmed">
            Вы уверены, что хотите удалить отчет по соревнованию "{selectedReport?.competition_name}"?
            Это действие нельзя отменить.
          </Text>

          <Group justify="flex-end" mt="md">
            <VTBButton
              variant="secondary"
              onClick={() => {
                setDeleteModalOpened(false);
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
    </Container>
  );
}
