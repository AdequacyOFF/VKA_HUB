import { useState } from 'react';
import { Stack, TextInput, Textarea, Group, Title, Text, Badge, ActionIcon, Grid, Select } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { IconPlus, IconEdit, IconTrash, IconFileText } from '@tabler/icons-react';
import { VTBCard } from '../../../components/common/VTBCard';
import { VTBButton } from '../../../components/common/VTBButton';
import { FileUploader } from '../../../components/common/FileUploader';
import { ConfirmModal } from '../../../components/common/ConfirmModal';
import { certificatesApi, api } from '../../../api';
import dayjs from 'dayjs';

interface Certificate {
  id: number;
  title: string;
  description: string;
  category: string;
  file_url: string;
  issued_date: string;
  created_at: string;
}

const CERTIFICATE_CATEGORIES = [
  { value: 'competition', label: 'Соревнование' },
  { value: 'course', label: 'Курс' },
  { value: 'achievement', label: 'Достижение' },
  { value: 'certification', label: 'Сертификация' },
  { value: 'other', label: 'Другое' },
];

export function Certificates() {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [certificateToDelete, setCertificateToDelete] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const form = useForm({
    initialValues: {
      title: '',
      description: '',
      category: '',
      issuedDate: '',
    },
    validate: {
      title: (value) => (!value ? 'Обязательное поле' : null),
      category: (value) => (!value ? 'Выберите категорию' : null),
      issuedDate: (value) => (!value ? 'Укажите дату' : null),
    },
  });

  const { data: certificates = [], isLoading, error } = useQuery({
    queryKey: ['certificates'],
    queryFn: async () => {
      try {
        const response = await certificatesApi.getCertificates();
        return Array.isArray(response) ? response : (Array.isArray(response?.items) ? response.items : []);
      } catch (error) {
        console.error('Failed to fetch certificates:', error);
        return [];
      }
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { title: string; description: string; category: string; issued_date: string; file: File }) => {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('category', data.category);
      formData.append('issued_date', data.issued_date);
      formData.append('file', data.file);

      return api.post('/api/certificates', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
      notifications.show({
        title: 'Успех',
        message: 'Сертификат добавлен',
        color: 'teal',
      });
      form.reset();
      setIsAdding(false);
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Ошибка',
        message: error?.response?.data?.detail || 'Не удалось добавить сертификат',
        color: 'red',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => certificatesApi.deleteCertificate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
      notifications.show({
        title: 'Успех',
        message: 'Сертификат удален',
        color: 'teal',
      });
      setDeleteModalOpened(false);
      setCertificateToDelete(null);
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Ошибка',
        message: error?.response?.data?.detail || 'Не удалось удалить сертификат',
        color: 'red',
      });
    },
  });

  const handleFileUpload = async (files: File[]) => {
    if (files.length === 0) return;

    const values = form.values;
    if (!values.title || !values.category || !values.issuedDate) {
      notifications.show({
        title: 'Ошибка',
        message: 'Заполните все обязательные поля',
        color: 'red',
      });
      return;
    }

    await createMutation.mutateAsync({
      title: values.title,
      description: values.description,
      category: values.category,
      issued_date: values.issuedDate,
      file: files[0],
    });
  };

  const handleDelete = (id: number) => {
    setCertificateToDelete(id);
    setDeleteModalOpened(true);
  };

  const getCategoryLabel = (category: string) => {
    return CERTIFICATE_CATEGORIES.find((c) => c.value === category)?.label || category;
  };

  // Safe array access
  const safeCertificates = Array.isArray(certificates) ? certificates : [];

  return (
    <Stack gap="xl">
      <Group justify="space-between">
        <Title order={3} c="white">
          Сертификаты и достижения
        </Title>
        <VTBButton
          leftSection={<IconPlus size={18} />}
          onClick={() => setIsAdding(!isAdding)}
          variant={isAdding ? 'secondary' : 'primary'}
        >
          {isAdding ? 'Отмена' : 'Добавить сертификат'}
        </VTBButton>
      </Group>

      {isAdding && (
        <VTBCard variant="accent">
          <Stack gap="md">
            <Title order={4} c="white">
              Новый сертификат
            </Title>

            <TextInput
              label="Название"
              placeholder="Сертификат участника хакатона"
              classNames={{ input: 'glass-input' }}
              styles={{ label: { color: '#ffffff', fontWeight: 600 } }}
              {...form.getInputProps('title')}
            />

            <Textarea
              label="Описание"
              placeholder="Краткое описание сертификата..."
              classNames={{ input: 'glass-input' }}
              styles={{ label: { color: '#ffffff', fontWeight: 600 } }}
              minRows={3}
              {...form.getInputProps('description')}
            />

            <Group grow>
              <Select
                label="Категория"
                placeholder="Выберите категорию"
                data={CERTIFICATE_CATEGORIES}
                classNames={{ input: 'glass-input' }}
                styles={{
                  label: { color: '#ffffff', fontWeight: 600 },
                  option: {
                    color: '#ffffff',
                    '&[data-selected]': {
                      background: 'rgba(0, 217, 255, 0.3)',
                    },
                  },
                  dropdown: {
                    background: 'rgba(10, 31, 68, 0.95)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(0, 217, 255, 0.3)',
                  },
                }}
                {...form.getInputProps('category')}
              />

              <TextInput
                label="Дата получения"
                placeholder="2024-01-01"
                type="date"
                classNames={{ input: 'glass-input' }}
                styles={{ label: { color: '#ffffff', fontWeight: 600 } }}
                {...form.getInputProps('issuedDate')}
              />
            </Group>

            <FileUploader
              onUpload={handleFileUpload}
              accept={['application/pdf', 'image/png', 'image/jpeg']}
              maxFiles={1}
              multiple={false}
              label="Загрузить файл сертификата"
              description="PDF, PNG или JPEG"
            />
          </Stack>
        </VTBCard>
      )}

      {isLoading ? (
        <Text c="white" ta="center">
          Загрузка...
        </Text>
      ) : error ? (
        <VTBCard variant="secondary">
          <Text c="red" ta="center">
            Ошибка загрузки сертификатов
          </Text>
        </VTBCard>
      ) : safeCertificates.length === 0 ? (
        <VTBCard variant="secondary">
          <Stack align="center" gap="md" py="xl">
            <IconFileText size={64} color="var(--vtb-cyan)" opacity={0.5} />
            <Text c="dimmed" ta="center">
              У вас пока нет сертификатов
            </Text>
          </Stack>
        </VTBCard>
      ) : (
        <Grid gutter="lg">
          {safeCertificates.map((cert: Certificate) => (
            <Grid.Col key={cert.id} span={{ base: 12, sm: 6, md: 4 }}>
              <VTBCard variant="primary" style={{ height: '100%' }}>
                <Stack gap="md" h="100%">
                  <Group justify="space-between" align="flex-start">
                    <IconFileText size={32} color="var(--vtb-cyan)" />
                    <Group gap="xs">
                      <ActionIcon
                        size="sm"
                        variant="subtle"
                        color="cyan"
                        onClick={() => window.open(cert.file_url, '_blank')}
                      >
                        <IconFileText size={16} />
                      </ActionIcon>
                      <ActionIcon
                        size="sm"
                        variant="subtle"
                        color="red"
                        onClick={() => handleDelete(cert.id)}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Group>
                  </Group>

                  <Stack gap="xs" style={{ flex: 1 }}>
                    <Text fw={700} c="white" lineClamp={2}>
                      {cert.title}
                    </Text>

                    {cert.description && (
                      <Text size="sm" c="dimmed" lineClamp={2}>
                        {cert.description}
                      </Text>
                    )}

                    <Badge
                      variant="light"
                      color="cyan"
                      size="sm"
                      style={{
                        background: 'rgba(0, 217, 255, 0.2)',
                        color: 'var(--vtb-cyan)',
                        width: 'fit-content',
                      }}
                    >
                      {getCategoryLabel(cert.category)}
                    </Badge>

                    <Text size="xs" c="dimmed" mt="auto">
                      Дата получения: {dayjs(cert.issued_date).format('DD.MM.YYYY')}
                    </Text>
                  </Stack>
                </Stack>
              </VTBCard>
            </Grid.Col>
          ))}
        </Grid>
      )}

      <ConfirmModal
        opened={deleteModalOpened}
        onClose={() => setDeleteModalOpened(false)}
        onConfirm={() => certificateToDelete && deleteMutation.mutate(certificateToDelete)}
        title="Удаление сертификата"
        message="Вы уверены, что хотите удалить этот сертификат? Это действие нельзя отменить."
        confirmText="Удалить"
        loading={deleteMutation.isPending}
        danger
      />
    </Stack>
  );
}
