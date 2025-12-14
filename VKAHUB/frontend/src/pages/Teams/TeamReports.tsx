import { Container, Title, Stack, Text, Grid, Group, Badge, Button, Modal, TextInput, Textarea } from '@mantine/core';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { IconArrowLeft, IconFileText, IconCalendar, IconPlus } from '@tabler/icons-react';
import { VTBCard } from '../../components/common/VTBCard';
import { VTBButton } from '../../components/common/VTBButton';
import { api } from '../../api';
import dayjs from 'dayjs';
import { useState, useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import { useAuthStore } from '../../store/authStore';

interface Report {
  id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  team_id: number;
  author_id: number;
  author_name?: string;
}

export function TeamReports() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  
  const [createModalOpened, setCreateModalOpened] = useState(false);
  const [editModalOpened, setEditModalOpened] = useState(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [newReport, setNewReport] = useState({
    title: '',
    content: ''
  });
  const [editReport, setEditReport] = useState({
    title: '',
    content: ''
  });

  // ✅ Определяем источник перехода
  const fromProfile = location.state?.from === 'profile';
  
  // ✅ Получаем информацию о команде для проверки капитана
  const { data: team } = useQuery({
    queryKey: ['team', id],
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

  // ✅ Проверяем, является ли пользователь капитаном
  const isCaptain = team?.captain_id === user?.id;
  
  // ✅ Проверяем, можно ли добавлять отчеты
  const canAddReports = fromProfile && isCaptain;

  const { data: reports = [], isLoading } = useQuery<Report[]>({
    queryKey: ['team-reports', id],
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

  // ✅ Мутация для создания отчета
  const createReportMutation = useMutation({
    mutationFn: async (reportData: { title: string; content: string }) => {
      const response = await api.post(`/api/teams/${id}/reports`, reportData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-reports', id] });
      notifications.show({
        title: 'Успех',
        message: 'Отчет создан',
        color: 'teal',
      });
      setCreateModalOpened(false);
      setNewReport({ title: '', content: '' });
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Ошибка',
        message: error?.response?.data?.detail || 'Не удалось создать отчет',
        color: 'red',
      });
    },
  });

  // Мутация для обновления отчета
  const updateReportMutation = useMutation({
    mutationFn: async (reportData: { reportId: number; title: string; content: string }) => {
      const response = await api.put(`/api/teams/${id}/reports/${reportData.reportId}`, {
        title: reportData.title,
        content: reportData.content,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-reports', id] });
      notifications.show({
        title: 'Успех',
        message: 'Отчет обновлен',
        color: 'teal',
      });
      setEditModalOpened(false);
      setSelectedReport(null);
      setEditReport({ title: '', content: '' });
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
      const response = await api.delete(`/api/teams/${id}/reports/${reportId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-reports', id] });
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

  // ✅ Функция для возврата назад
  const handleBack = () => {
    if (fromProfile) {
      navigate('/profile?tab=my-team');
    } else {
      navigate(`/teams/${id}`);
    }
  };

  // ✅ Функция создания отчета
  const handleCreateReport = () => {
    if (!newReport.title.trim()) {
      notifications.show({
        title: 'Ошибка',
        message: 'Введите заголовок отчета',
        color: 'red',
      });
      return;
    }
    
    if (!newReport.content.trim()) {
      notifications.show({
        title: 'Ошибка',
        message: 'Введите содержание отчета',
        color: 'red',
      });
      return;
    }
    
    createReportMutation.mutate(newReport);
  };

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <div>
          {/* ✅ Кнопка "Назад" с правильным текстом */}
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
                {fromProfile 
                  ? 'Создание и управление отчетами вашей команды' 
                  : 'Просмотр отчетов команды'}
                {canAddReports && ' (режим капитана)'}
              </Text>
            </div>
            
            {/* ✅ Кнопка добавления отчета (только для капитана из профиля) */}
            {canAddReports && (
              <VTBButton
                leftSection={<IconPlus size={18} />}
                onClick={() => setCreateModalOpened(true)}
              >
                Создать отчет
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
              <IconFileText size={80} color="var(--vtb-cyan)" opacity={0.5} />
              <div>
                <Title order={3} c="white" ta="center" mb="xs">
                  {canAddReports ? 'Создайте первый отчет' : 'Отчетов пока нет'}
                </Title>
                <Text c="dimmed" ta="center">
                  {canAddReports 
                    ? 'Начните вести историю достижений вашей команды' 
                    : 'Здесь будут отображаться отчеты команды'}
                </Text>
              </div>
              {canAddReports && (
                <VTBButton
                  leftSection={<IconPlus size={18} />}
                  onClick={() => setCreateModalOpened(true)}
                >
                  Создать отчет
                </VTBButton>
              )}
            </Stack>
          </VTBCard>
        ) : (
          <Grid gutter="lg">
            {reports.map((report) => (
              <Grid.Col key={report.id} span={{ base: 12 }}>
                <VTBCard variant="primary">
                  <Stack gap="md">
                    <Group justify="space-between" align="flex-start">
                      <div style={{ flex: 1 }}>
                        <Group gap="xs" mb="xs">
                          <IconFileText size={24} color="var(--vtb-cyan)" />
                          <Title order={4} c="white">
                            {report.title}
                          </Title>
                        </Group>
                        {report.author_name && (
                          <Text size="sm" c="dimmed">
                            Автор: {report.author_name}
                          </Text>
                        )}
                      </div>
                      <Badge
                        variant="light"
                        color="cyan"
                        leftSection={<IconCalendar size={14} />}
                        style={{
                          background: 'rgba(0, 217, 255, 0.2)',
                          color: 'var(--vtb-cyan)',
                          border: '1px solid var(--vtb-cyan)',
                        }}
                      >
                        {dayjs(report.created_at).format('DD.MM.YYYY')}
                      </Badge>
                    </Group>

                    <Text c="dimmed" size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                      {report.content}
                    </Text>
                    
                    {/* Показываем кнопки управления только капитану из профиля */}
                    {canAddReports && (
                      <Group justify="flex-end" mt="md">
                        <Button
                          variant="light"
                          size="xs"
                          color="blue"
                          onClick={() => {
                            setSelectedReport(report);
                            setEditReport({ title: report.title, content: report.content });
                            setEditModalOpened(true);
                          }}
                        >
                          Редактировать
                        </Button>
                        <Button
                          variant="light"
                          size="xs"
                          color="red"
                          onClick={() => {
                            setSelectedReport(report);
                            setDeleteModalOpened(true);
                          }}
                        >
                          Удалить
                        </Button>
                      </Group>
                    )}
                  </Stack>
                </VTBCard>
              </Grid.Col>
            ))}
          </Grid>
        )}
      </Stack>

      {/* ✅ Модальное окно создания отчета */}
      <Modal
        opened={createModalOpened}
        onClose={() => setCreateModalOpened(false)}
        title="Создание отчета"
        size="lg"
        centered
      >
        <Stack gap="md">
          <TextInput
            label="Заголовок отчета"
            placeholder="Введите заголовок"
            value={newReport.title}
            onChange={(e) => setNewReport({...newReport, title: e.target.value})}
            required
            size="md"
          />
          
          <Textarea
            label="Содержание отчета"
            placeholder="Опишите достижения команды, результаты соревнований, планы на будущее..."
            value={newReport.content}
            onChange={(e) => setNewReport({...newReport, content: e.target.value})}
            minRows={6}
            required
            size="md"
          />
          
          <Group justify="flex-end" mt="md">
            <Button
              variant="light"
              color="gray"
              onClick={() => setCreateModalOpened(false)}
            >
              Отмена
            </Button>
            <VTBButton
              leftSection={<IconFileText size={18} />}
              onClick={handleCreateReport}
              loading={createReportMutation.isPending}
            >
              Создать отчет
            </VTBButton>
          </Group>
        </Stack>
      </Modal>

      {/* Модальное окно редактирования отчета */}
      <Modal
        opened={editModalOpened}
        onClose={() => {
          setEditModalOpened(false);
          setSelectedReport(null);
          setEditReport({ title: '', content: '' });
        }}
        title="Редактирование отчета"
        size="lg"
        centered
      >
        <Stack gap="md">
          <TextInput
            label="Заголовок отчета"
            placeholder="Введите заголовок"
            value={editReport.title}
            onChange={(e) => setEditReport({...editReport, title: e.target.value})}
            required
            size="md"
          />

          <Textarea
            label="Содержание отчета"
            placeholder="Опишите достижения команды, результаты соревнований, планы на будущее..."
            value={editReport.content}
            onChange={(e) => setEditReport({...editReport, content: e.target.value})}
            minRows={6}
            required
            size="md"
          />

          <Group justify="flex-end" mt="md">
            <Button
              variant="light"
              color="gray"
              onClick={() => {
                setEditModalOpened(false);
                setSelectedReport(null);
                setEditReport({ title: '', content: '' });
              }}
            >
              Отмена
            </Button>
            <VTBButton
              leftSection={<IconFileText size={18} />}
              onClick={() => {
                if (selectedReport) {
                  updateReportMutation.mutate({
                    reportId: selectedReport.id,
                    title: editReport.title,
                    content: editReport.content,
                  });
                }
              }}
              loading={updateReportMutation.isPending}
            >
              Сохранить изменения
            </VTBButton>
          </Group>
        </Stack>
      </Modal>

      {/* Модальное окно подтверждения удаления */}
      <Modal
        opened={deleteModalOpened}
        onClose={() => {
          setDeleteModalOpened(false);
          setSelectedReport(null);
        }}
        title="Удаление отчета"
        size="sm"
        centered
      >
        <Stack gap="md">
          <Text c="dimmed">
            Вы уверены, что хотите удалить отчет "{selectedReport?.title}"? Это действие нельзя отменить.
          </Text>

          <Group justify="flex-end" mt="md">
            <Button
              variant="light"
              color="gray"
              onClick={() => {
                setDeleteModalOpened(false);
                setSelectedReport(null);
              }}
            >
              Отмена
            </Button>
            <Button
              color="red"
              onClick={() => {
                if (selectedReport) {
                  deleteReportMutation.mutate(selectedReport.id);
                }
              }}
              loading={deleteReportMutation.isPending}
            >
              Удалить
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}