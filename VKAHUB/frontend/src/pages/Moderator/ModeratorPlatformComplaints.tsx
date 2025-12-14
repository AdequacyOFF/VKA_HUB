import { useState } from 'react';
import { Container, Title, Stack, Table, Badge, Group, ActionIcon, Text, Textarea, Modal, Select } from '@mantine/core';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { IconEye, IconSend } from '@tabler/icons-react';
import { VTBCard } from '../../components/common/VTBCard';
import { VTBButton } from '../../components/common/VTBButton';
import { notifications } from '@mantine/notifications';
import { moderatorApi } from '../../api/moderator';
import { PlatformComplaintResponse } from '../../api/platformComplaints';
import dayjs from 'dayjs';
import { useForm } from '@mantine/form';

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
  critical: 'Критический',
};

const CATEGORY_LABELS: Record<string, string> = {
  bug: 'Ошибка / Баг',
  feature_request: 'Предложение',
  performance: 'Производительность',
  ui_ux: 'Интерфейс',
  security: 'Безопасность',
  other: 'Другое',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Ожидает',
  resolved: 'Решено',
  rejected: 'Отклонено',
};

const PRIORITY_COLORS: Record<string, string> = {
  low: 'gray',
  medium: 'blue',
  high: 'yellow',
  critical: 'red',
};

export function ModeratorPlatformComplaints() {
  const queryClient = useQueryClient();
  const [selectedComplaint, setSelectedComplaint] = useState<PlatformComplaintResponse | null>(null);
  const [modalOpened, setModalOpened] = useState(false);
  const [respondModalOpened, setRespondModalOpened] = useState(false);

  const { data: complaintsData, isLoading, error } = useQuery({
    queryKey: ['moderator-platform-complaints'],
    queryFn: async () => {
      try {
        return await moderatorApi.getPlatformComplaints();
      } catch (error) {
        console.error('Failed to fetch platform complaints:', error);
        return { items: [], total: 0 };
      }
    },
  });

  const form = useForm({
    initialValues: {
      response: '',
      status: 'resolved' as 'resolved' | 'rejected',
    },
    validate: {
      response: (value) => {
        if (!value || value.length < 10) return 'Ответ должен содержать минимум 10 символов';
        if (value.length > 2000) return 'Ответ не должен превышать 2000 символов';
        return null;
      },
    },
  });

  const respondMutation = useMutation({
    mutationFn: async (data: { complaintId: number; response: string; status: 'resolved' | 'rejected' }) =>
      moderatorApi.respondToPlatformComplaint(data.complaintId, {
        response: data.response,
        status: data.status,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderator-platform-complaints'] });
      notifications.show({ title: 'Успех', message: 'Ответ отправлен', color: 'teal' });
      setRespondModalOpened(false);
      setModalOpened(false);
      form.reset();
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Ошибка',
        message: error?.response?.data?.detail || 'Не удалось отправить ответ',
        color: 'red',
      });
    },
  });

  const handleRespond = () => {
    if (!selectedComplaint) return;
    const validation = form.validate();
    if (validation.hasErrors) return;

    respondMutation.mutate({
      complaintId: selectedComplaint.id,
      response: form.values.response,
      status: form.values.status,
    });
  };

  const complaints = complaintsData?.items || [];

  return (
    <Container size="xl" py="md">
      <Stack gap="xl">
        <div>
          <Title order={1} className="vtb-heading-hero" mb="xs">
            <span className="vtb-gradient-text">Обратная связь платформы</span>
          </Title>
          <Text c="dimmed" size="lg">
            Модерация обращений пользователей о платформе
          </Text>
        </div>

        <VTBCard variant="primary">
          {isLoading ? (
            <Text c="white" ta="center">
              Загрузка...
            </Text>
          ) : error ? (
            <Text c="red" ta="center">
              Ошибка загрузки обращений
            </Text>
          ) : complaints.length === 0 ? (
            <Text c="dimmed" ta="center">
              Нет обращений
            </Text>
          ) : (
            <Table
              highlightOnHover
              styles={{
                th: { color: 'var(--vtb-cyan)', borderBottom: '1px solid rgba(0, 217, 255, 0.2)' },
                td: { color: '#ffffff', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' },
              }}
            >
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>ID</Table.Th>
                  <Table.Th>Пользователь</Table.Th>
                  <Table.Th>Категория</Table.Th>
                  <Table.Th>Приоритет</Table.Th>
                  <Table.Th>Заголовок</Table.Th>
                  <Table.Th>Статус</Table.Th>
                  <Table.Th>Дата</Table.Th>
                  <Table.Th>Действия</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {complaints.map((complaint) => (
                  <Table.Tr key={complaint.id}>
                    <Table.Td>{complaint.id}</Table.Td>
                    <Table.Td>{complaint.user}</Table.Td>
                    <Table.Td>{CATEGORY_LABELS[complaint.category] || complaint.category}</Table.Td>
                    <Table.Td>
                      <Badge color={PRIORITY_COLORS[complaint.priority]} variant="light" size="sm">
                        {PRIORITY_LABELS[complaint.priority] || complaint.priority}
                      </Badge>
                    </Table.Td>
                    <Table.Td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {complaint.title}
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color={
                          complaint.status === 'pending'
                            ? 'yellow'
                            : complaint.status === 'resolved'
                            ? 'green'
                            : 'red'
                        }
                        variant="light"
                      >
                        {STATUS_LABELS[complaint.status] || complaint.status}
                      </Badge>
                    </Table.Td>
                    <Table.Td>{dayjs(complaint.created_at).format('DD.MM.YYYY HH:mm')}</Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <ActionIcon
                          variant="light"
                          color="cyan"
                          onClick={() => {
                            setSelectedComplaint(complaint);
                            setModalOpened(true);
                          }}
                        >
                          <IconEye size={18} />
                        </ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </VTBCard>

        {/* Details Modal */}
        <Modal
          opened={modalOpened}
          onClose={() => setModalOpened(false)}
          title="Детали обращения"
          size="lg"
        >
          {selectedComplaint && (
            <Stack gap="md">
              <Group>
                <Badge color={PRIORITY_COLORS[selectedComplaint.priority]} variant="light">
                  {PRIORITY_LABELS[selectedComplaint.priority]}
                </Badge>
                <Badge variant="light">{CATEGORY_LABELS[selectedComplaint.category]}</Badge>
                <Badge
                  color={
                    selectedComplaint.status === 'pending'
                      ? 'yellow'
                      : selectedComplaint.status === 'resolved'
                      ? 'green'
                      : 'red'
                  }
                  variant="light"
                >
                  {STATUS_LABELS[selectedComplaint.status]}
                </Badge>
              </Group>

              <Text>
                <strong>ID:</strong> {selectedComplaint.id}
              </Text>
              <Text>
                <strong>От:</strong> {selectedComplaint.user}
              </Text>
              <Text>
                <strong>Заголовок:</strong> {selectedComplaint.title}
              </Text>
              <Text>
                <strong>Описание:</strong>
              </Text>
              <Textarea value={selectedComplaint.description} readOnly rows={6} />

              {selectedComplaint.moderator_response && (
                <>
                  <Text>
                    <strong>Ответ модератора:</strong>
                  </Text>
                  <Textarea value={selectedComplaint.moderator_response} readOnly rows={4} />
                </>
              )}

              {selectedComplaint.status === 'pending' && (
                <VTBButton
                  leftSection={<IconSend size={18} />}
                  onClick={() => {
                    setRespondModalOpened(true);
                  }}
                >
                  Ответить
                </VTBButton>
              )}
            </Stack>
          )}
        </Modal>

        {/* Respond Modal */}
        <Modal
          opened={respondModalOpened}
          onClose={() => {
            setRespondModalOpened(false);
            form.reset();
          }}
          title="Ответ на обращение"
          size="lg"
        >
          {selectedComplaint && (
            <Stack gap="md">
              <Text fw={600}>{selectedComplaint.title}</Text>

              <Select
                label="Статус решения"
                data={[
                  { value: 'resolved', label: 'Решено' },
                  { value: 'rejected', label: 'Отклонено' },
                ]}
                {...form.getInputProps('status')}
                required
              />

              <Textarea
                label="Ваш ответ"
                placeholder="Опишите, как было решено обращение или почему оно отклонено..."
                rows={6}
                {...form.getInputProps('response')}
                required
              />

              <Group justify="flex-end">
                <VTBButton
                  variant="secondary"
                  onClick={() => {
                    setRespondModalOpened(false);
                    form.reset();
                  }}
                >
                  Отмена
                </VTBButton>
                <VTBButton
                  leftSection={<IconSend size={18} />}
                  onClick={handleRespond}
                  loading={respondMutation.isPending}
                >
                  Отправить ответ
                </VTBButton>
              </Group>
            </Stack>
          )}
        </Modal>
      </Stack>
    </Container>
  );
}
