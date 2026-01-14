import { useNavigate } from 'react-router-dom';
import { Container, Title, Textarea, Stack, Box, Text, Group, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useMutation } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { IconMessageReport, IconArrowLeft, IconSend } from '@tabler/icons-react';
import { VTBCard } from '../../components/common/VTBCard';
import { VTBButton } from '../../components/common/VTBButton';
import { ConsoleSelect } from '../../components/common/ConsoleSelect';
import { platformComplaintsApi, PlatformComplaintCategory, ComplaintPriority } from '../../api/platformComplaints';

const COMPLAINT_CATEGORIES = [
  { value: 'bug', label: 'Ошибка / Баг' },
  { value: 'feature_request', label: 'Предложение по функционалу' },
  { value: 'performance', label: 'Производительность' },
  { value: 'ui_ux', label: 'Интерфейс и удобство' },
  { value: 'security', label: 'Безопасность' },
  { value: 'other', label: 'Другое' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Низкий' },
  { value: 'medium', label: 'Средний' },
  { value: 'high', label: 'Высокий' },
  { value: 'critical', label: 'Критический' },
];

export function CreatePlatformComplaint() {
  const navigate = useNavigate();

  const form = useForm({
    initialValues: {
      category: '' as PlatformComplaintCategory,
      priority: 'medium' as ComplaintPriority,
      title: '',
      description: '',
    },
    validate: {
      category: (value) => (!value ? 'Выберите категорию' : null),
      priority: (value) => (!value ? 'Выберите приоритет' : null),
      title: (value) => {
        if (!value) return 'Введите заголовок';
        if (value.length < 5) return 'Заголовок должен быть не менее 5 символов';
        if (value.length > 255) return 'Заголовок не должен превышать 255 символов';
        return null;
      },
      description: (value) => {
        if (!value) return 'Опишите проблему или предложение';
        if (value.length < 20) return 'Описание должно быть не менее 20 символов';
        if (value.length > 2000) return 'Описание не должно превышать 2000 символов';
        return null;
      },
    },
  });

  const createComplaintMutation = useMutation({
    mutationFn: platformComplaintsApi.createComplaint,
    onSuccess: () => {
      notifications.show({
        title: 'Успех',
        message: 'Ваше обращение успешно отправлено. Спасибо за ваш отзыв!',
        color: 'teal',
      });
      navigate('/');
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Ошибка',
        message: error.response?.data?.detail || 'Не удалось отправить обращение',
        color: 'red',
      });
    },
  });

  const handleSubmit = (values: typeof form.values) => {
    createComplaintMutation.mutate({
      category: values.category,
      priority: values.priority,
      title: values.title,
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
            <span className="vtb-gradient-text">Обратная связь</span>
          </Title>
          <Text size="lg" c="white" mt="md">
            Сообщите об ошибке или предложите улучшение платформы
          </Text>
        </div>

        <VTBCard variant="primary">
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="lg">
              <ConsoleSelect
                label="Категория обращения"
                placeholder="Выберите категорию"
                consolePath="C:\Feedback\category"
                data={COMPLAINT_CATEGORIES}
                size="md"
                {...form.getInputProps('category')}
                required
              />

              <ConsoleSelect
                label="Степень важности"
                placeholder="Выберите приоритет"
                consolePath="C:\Feedback\priority"
                data={PRIORITY_OPTIONS}
                size="md"
                {...form.getInputProps('priority')}
                required
              />

              <TextInput
                label="Заголовок"
                placeholder="Кратко опишите суть обращения"
                size="md"
                classNames={{ input: 'glass-input' }}
                styles={{
                  label: { color: '#ffffff', fontWeight: 600, marginBottom: 8 },
                }}
                {...form.getInputProps('title')}
                required
              />

              <Textarea
                label="Подробное описание"
                placeholder="Опишите проблему или предложение максимально детально..."
                rows={8}
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
                  background: 'rgba(0, 217, 255, 0.1)',
                  border: '1px solid var(--vtb-cyan)',
                  borderRadius: 12,
                }}
              >
                <Group gap="xs" mb="xs">
                  <IconMessageReport size={20} color="var(--vtb-cyan)" />
                  <Text size="sm" fw={600} c="var(--vtb-cyan)">
                    Ваше мнение важно для нас
                  </Text>
                </Group>
                <Text size="sm" c="white">
                  Мы рассматриваем каждое обращение. Ваши замечания и предложения помогают нам делать платформу лучше!
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
                  Отправить обращение
                </VTBButton>
              </Group>
            </Stack>
          </form>
        </VTBCard>
      </Stack>
    </Container>
  );
}
