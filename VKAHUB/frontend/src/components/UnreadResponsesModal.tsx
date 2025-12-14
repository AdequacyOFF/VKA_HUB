import { useEffect, useState } from 'react';
import { Modal, Stack, Text, Badge, Group, Textarea, Title } from '@mantine/core';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { platformComplaintsApi, PlatformComplaintResponse } from '../api/platformComplaints';
import { VTBButton } from './common/VTBButton';
import { VTBCard } from './common/VTBCard';
import { IconCheck, IconX, IconAlertCircle } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { useAuthStore } from '../store/authStore';

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

export function UnreadResponsesModal() {
  const { isAuthenticated } = useAuthStore();
  const [modalOpened, setModalOpened] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const queryClient = useQueryClient();

  const { data: unreadData, isSuccess } = useQuery({
    queryKey: ['unread-platform-responses'],
    queryFn: platformComplaintsApi.getUnreadResponses,
    enabled: isAuthenticated,
    retry: false,
  });

  const markAsReadMutation = useMutation({
    mutationFn: platformComplaintsApi.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unread-platform-responses'] });
    },
  });

  useEffect(() => {
    if (isSuccess && unreadData && unreadData.items.length > 0) {
      setModalOpened(true);
      setCurrentIndex(0);
    }
  }, [isSuccess, unreadData]);

  const handleNext = () => {
    if (!unreadData) return;

    const currentComplaint = unreadData.items[currentIndex];
    markAsReadMutation.mutate(currentComplaint.id);

    if (currentIndex < unreadData.items.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setModalOpened(false);
      setCurrentIndex(0);
    }
  };

  const handleClose = () => {
    if (!unreadData) return;

    // Mark all remaining as read
    unreadData.items.slice(currentIndex).forEach((complaint) => {
      markAsReadMutation.mutate(complaint.id);
    });

    setModalOpened(false);
    setCurrentIndex(0);
  };

  if (!unreadData || unreadData.items.length === 0) {
    return null;
  }

  const currentComplaint: PlatformComplaintResponse = unreadData.items[currentIndex];
  const isResolved = currentComplaint.status === 'resolved';

  return (
    <Modal
      opened={modalOpened}
      onClose={handleClose}
      title={
        <Group>
          <IconAlertCircle size={24} color={isResolved ? 'var(--vtb-cyan)' : '#f59e0b'} />
          <Title order={3} c="white">
            Ответ на ваше обращение
          </Title>
        </Group>
      }
      size="lg"
      styles={{
        header: {
          background: 'rgba(10, 31, 68, 0.95)',
          borderBottom: '1px solid rgba(0, 217, 255, 0.2)',
        },
        body: {
          background: 'linear-gradient(135deg, #0A1F44 0%, #1E4C8F 100%)',
        },
        title: {
          width: '100%',
        },
      }}
    >
      <Stack gap="lg">
        {unreadData.items.length > 1 && (
          <Text size="sm" c="dimmed" ta="center">
            Обращение {currentIndex + 1} из {unreadData.items.length}
          </Text>
        )}

        <VTBCard variant="primary">
          <Stack gap="md">
            <Group>
              <Badge
                color={isResolved ? 'green' : 'red'}
                variant="light"
                leftSection={isResolved ? <IconCheck size={14} /> : <IconX size={14} />}
              >
                {isResolved ? 'Решено' : 'Отклонено'}
              </Badge>
              <Badge variant="light">{CATEGORY_LABELS[currentComplaint.category]}</Badge>
              <Badge variant="light">{PRIORITY_LABELS[currentComplaint.priority]}</Badge>
            </Group>

            <div>
              <Text size="sm" c="dimmed" mb={4}>
                Ваше обращение от {dayjs(currentComplaint.created_at).format('DD.MM.YYYY HH:mm')}
              </Text>
              <Text fw={600} size="lg" c="white">
                {currentComplaint.title}
              </Text>
            </div>

            <div>
              <Text size="sm" fw={600} c="var(--vtb-cyan)" mb={4}>
                Описание вашего обращения:
              </Text>
              <Text size="sm" c="dimmed" style={{ whiteSpace: 'pre-wrap' }}>
                {currentComplaint.description}
              </Text>
            </div>
          </Stack>
        </VTBCard>

        <VTBCard
          variant="primary"
          style={{
            border: isResolved
              ? '1px solid rgba(34, 197, 94, 0.3)'
              : '1px solid rgba(239, 68, 68, 0.3)',
            background: isResolved
              ? 'rgba(34, 197, 94, 0.05)'
              : 'rgba(239, 68, 68, 0.05)',
          }}
        >
          <Stack gap="md">
            <Group>
              <Text fw={600} c={isResolved ? '#22c55e' : '#ef4444'}>
                Ответ модератора
              </Text>
              <Text size="xs" c="dimmed">
                {dayjs(currentComplaint.updated_at).format('DD.MM.YYYY HH:mm')}
              </Text>
            </Group>

            <Textarea
              value={currentComplaint.moderator_response || ''}
              readOnly
              rows={6}
              styles={{
                input: {
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: 'none',
                  color: '#ffffff',
                },
              }}
            />
          </Stack>
        </VTBCard>

        <Group justify="flex-end" mt="md">
          {unreadData.items.length > 1 && currentIndex < unreadData.items.length - 1 ? (
            <>
              <VTBButton variant="secondary" onClick={handleClose}>
                Отметить все как прочитанные
              </VTBButton>
              <VTBButton onClick={handleNext}>Далее</VTBButton>
            </>
          ) : (
            <VTBButton onClick={handleNext}>Понятно</VTBButton>
          )}
        </Group>
      </Stack>
    </Modal>
  );
}
