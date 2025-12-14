import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Title, TextInput, Textarea, Stack, Box, Text, Grid, Group } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { IconUsers, IconPhoto, IconArrowLeft } from '@tabler/icons-react';
import { VTBCard } from '../../components/common/VTBCard';
import { VTBButton } from '../../components/common/VTBButton';
import { teamsApi } from '../../api';

export function CreateTeam() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [imagePreview, setImagePreview] = useState<string>('');

  const form = useForm({
    initialValues: {
      name: '',
      description: '',
      image_url: '',
    },
    validate: {
      name: (value) => {
        if (!value) return 'Введите название команды';
        if (value.length < 3) return 'Название должно содержать минимум 3 символа';
        if (value.length > 100) return 'Название не должно превышать 100 символов';
        return null;
      },
      description: (value) => {
        if (value && value.length > 500) return 'Описание не должно превышать 500 символов';
        return null;
      },
      image_url: (value) => {
        if (value && !/^https?:\/\/.+/.test(value)) {
          return 'Введите корректный URL изображения';
        }
        return null;
      },
    },
  });

  const createTeamMutation = useMutation({
    mutationFn: teamsApi.createTeam,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['my-team'] });
      notifications.show({
        title: 'Успех',
        message: 'Команда успешно создана',
        color: 'teal',
      });
      navigate(`/teams/${data.id}`);
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Ошибка',
        message: error.response?.data?.detail || 'Не удалось создать команду',
        color: 'red',
      });
    },
  });

  const handleImageUrlChange = (value: string) => {
    form.setFieldValue('image_url', value);
    if (value && /^https?:\/\/.+/.test(value)) {
      setImagePreview(value);
    } else {
      setImagePreview('');
    }
  };

  const handleSubmit = async (values: typeof form.values) => {
    createTeamMutation.mutate({
      name: values.name,
      description: values.description || undefined,
      image_url: values.image_url || undefined,
    });
  };

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <div>
          <VTBButton
            variant="secondary"
            leftSection={<IconArrowLeft size={18} />}
            onClick={() => navigate('/teams')}
            mb="lg"
          >
            Назад к списку команд
          </VTBButton>
          <Title order={1} className="vtb-heading-hero">
            <span className="vtb-gradient-text">Создать команду</span>
          </Title>
          <Text size="lg" c="dimmed" mt="md">
            Создайте свою команду для участия в соревнованиях
          </Text>
        </div>

        <VTBCard variant="primary">
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Grid gutter="xl">
              <Grid.Col span={{ base: 12, md: 4 }}>
                <Stack gap="md">
                  <Text fw={600} c="white" size="sm">
                    Превью изображения
                  </Text>
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Превью команды"
                      style={{
                        width: '100%',
                        height: 250,
                        objectFit: 'cover',
                        borderRadius: 16,
                        border: '2px solid var(--vtb-cyan)',
                      }}
                      onError={() => setImagePreview('')}
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: 250,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'linear-gradient(135deg, rgba(30, 76, 143, 0.5) 0%, rgba(37, 99, 184, 0.3) 100%)',
                        borderRadius: 16,
                        border: '2px solid var(--vtb-cyan)',
                      }}
                    >
                      <IconPhoto size={100} color="var(--vtb-cyan)" opacity={0.5} />
                    </div>
                  )}
                  <Text size="xs" c="dimmed" ta="center">
                    Вставьте URL изображения команды
                  </Text>
                </Stack>
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 8 }}>
                <Stack gap="lg">
                  <TextInput
                    label="Название команды"
                    placeholder="Введите название команды"
                    leftSection={<IconUsers size={18} />}
                    size="md"
                    classNames={{ input: 'glass-input' }}
                    styles={{
                      label: { color: '#ffffff', fontWeight: 600, marginBottom: 8 },
                    }}
                    {...form.getInputProps('name')}
                    required
                  />

                  <Textarea
                    label="Описание"
                    placeholder="Опишите цели и направление деятельности команды..."
                    rows={6}
                    size="md"
                    classNames={{ input: 'glass-input' }}
                    styles={{
                      label: { color: '#ffffff', fontWeight: 600, marginBottom: 8 },
                    }}
                    {...form.getInputProps('description')}
                  />

                  <TextInput
                    label="Ссылка на изображение (необязательно)"
                    placeholder="https://example.com/team-image.jpg"
                    leftSection={<IconPhoto size={18} />}
                    size="md"
                    classNames={{ input: 'glass-input' }}
                    styles={{
                      label: { color: '#ffffff', fontWeight: 600, marginBottom: 8 },
                    }}
                    value={form.values.image_url}
                    onChange={(e) => handleImageUrlChange(e.currentTarget.value)}
                    error={form.errors.image_url}
                  />

                  <Box
                    p="md"
                    style={{
                      background: 'rgba(0, 217, 255, 0.1)',
                      border: '1px solid var(--vtb-cyan)',
                      borderRadius: 12,
                    }}
                  >
                    <Text size="sm" c="dimmed">
                      <strong style={{ color: 'var(--vtb-cyan)' }}>Важно:</strong> После создания команды вы станете её капитаном. Вы сможете управлять составом команды, принимать заявки на вступление и редактировать информацию о команде.
                    </Text>
                  </Box>

                  <Group justify="flex-end" mt="md">
                    <VTBButton
                      variant="secondary"
                      onClick={() => navigate('/teams')}
                    >
                      Отмена
                    </VTBButton>
                    <VTBButton
                      type="submit"
                      loading={createTeamMutation.isPending}
                      leftSection={<IconUsers size={18} />}
                    >
                      Создать команду
                    </VTBButton>
                  </Group>
                </Stack>
              </Grid.Col>
            </Grid>
          </form>
        </VTBCard>
      </Stack>
    </Container>
  );
}
