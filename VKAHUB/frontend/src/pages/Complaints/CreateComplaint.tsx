import { useNavigate, useSearchParams } from 'react-router-dom';
import { Container, Title, Textarea, Stack, Box, Text, Group, Select } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { IconAlertTriangle, IconArrowLeft, IconUser, IconSend } from '@tabler/icons-react';
import { VTBCard } from '../../components/common/VTBCard';
import { VTBButton } from '../../components/common/VTBButton';
import { complaintsApi, usersApi } from '../../api';
import { queryKeys } from '../../api/queryKeys';
import { invalidateComplaintQueries } from '../../utils/cacheInvalidation';

const COMPLAINT_REASONS = [
  { value: 'inappropriate_behavior', label: 'Неподобающее поведение' },
  { value: 'spam', label: 'Спам' },
  { value: 'harassment', label: 'Оскорбления / Преследования' },
  { value: 'fake_profile', label: 'Фейковый профиль' },
  { value: 'other', label: 'Другое' },
];

export function CreateComplaint() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const preselectedUserId = searchParams.get('userId');

  const form = useForm({
    initialValues: {
      target_id: preselectedUserId ? Number(preselectedUserId) : 0,
      reason: '',
      description: '',
    },
    validate: {
      target_id: (value) => (!value ? 'Выберите пользователя' : null),
      reason: (value) => (!value ? 'Укажите причину жалобы' : null),
      description: (value) => {
        if (!value) return 'Опишите ситуацию';
        if (value.length < 20) return 'Описание должно быть не менее 20 символов';
        if (value.length > 1000) return 'Описание не должно превышать 1000 символов';
        return null;
      },
    },
  });

  const { data: targetUser } = useQuery({
    queryKey: queryKeys.users.detail(preselectedUserId!),
    queryFn: () => usersApi.getUser(Number(preselectedUserId)),
    enabled: !!preselectedUserId,
  });

  const createComplaintMutation = useMutation({
    mutationFn: complaintsApi.createComplaint,
    onSuccess: () => {
      // Invalidate complaint queries to ensure lists are updated
      invalidateComplaintQueries({ queryClient });

      notifications.show({
        title: 'Успех',
        message: 'Жалоба успешно отправлена на рассмотрение',
        color: 'teal',
      });
      navigate(-1);
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Ошибка',
        message: error.response?.data?.detail || 'Не удалось отправить жалобу',
        color: 'red',
      });
    },
  });

  const handleSubmit = (values: typeof form.values) => {
    if (!values.target_id) return;

    createComplaintMutation.mutate({
      target_id: values.target_id,
      reason: values.reason,
      description: values.description,
    });
  };

  return (
    <Container size="md" py="xl">
      <Stack gap="xl">
        <div>
          <VTBButton
            variant="secondary"
            leftSection={<IconArrowLeft size={18} />}
            onClick={() => navigate(-1)}
            mb="lg"
          >
            Назад
          </VTBButton>
          <Title order={1} className="vtb-heading-hero">
            <span className="vtb-gradient-text">Подать жалобу</span>
          </Title>
          <Text size="lg" c="dimmed" mt="md">
            Сообщите о нарушении правил платформы
          </Text>
        </div>

        <VTBCard variant="primary">
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="lg">
              {targetUser && (
                <Box
                  p="md"
                  style={{
                    background: 'rgba(0, 217, 255, 0.1)',
                    border: '1px solid var(--vtb-cyan)',
                    borderRadius: 12,
                  }}
                >
                  <Group gap="md">
                    <IconUser size={24} color="var(--vtb-cyan)" />
                    <div>
                      <Text size="sm" c="dimmed">Жалоба на пользователя:</Text>
                      <Text fw={600} c="white">
                        {targetUser.last_name} {targetUser.first_name} (@{targetUser.login})
                      </Text>
                    </div>
                  </Group>
                </Box>
              )}

              <Select
                label="Причина жалобы"
                placeholder="Выберите причину"
                data={COMPLAINT_REASONS}
                leftSection={<IconAlertTriangle size={18} />}
                size="md"
                classNames={{ input: 'glass-input' }}
                styles={{
                  label: { color: '#ffffff', fontWeight: 600, marginBottom: 8 },
                }}
                {...form.getInputProps('reason')}
                required
              />

              <Textarea
                label="Описание ситуации"
                placeholder="Подробно опишите, что произошло..."
                rows={6}
                size="md"
                classNames={{ input: 'glass-input' }}
                styles={{
                  label: { color: '#ffffff', fontWeight: 600, marginBottom: 8 },
                }}
                {...form.getInputProps('description')}
                required
              />

              <Box
                p="md"
                style={{
                  background: 'rgba(255, 165, 0, 0.1)',
                  border: '1px solid orange',
                  borderRadius: 12,
                }}
              >
                <Text size="sm" c="dimmed">
                  <strong style={{ color: 'orange' }}>Внимание:</strong> Ложные жалобы могут привести к блокировке вашего аккаунта. Отправляйте жалобу только при реальном нарушении правил.
                </Text>
              </Box>

              <Group justify="flex-end" mt="md">
                <VTBButton
                  variant="secondary"
                  onClick={() => navigate(-1)}
                >
                  Отмена
                </VTBButton>
                <VTBButton
                  type="submit"
                  loading={createComplaintMutation.isPending}
                  leftSection={<IconSend size={18} />}
                >
                  Отправить жалобу
                </VTBButton>
              </Group>
            </Stack>
          </form>
        </VTBCard>
      </Stack>
    </Container>
  );
}
