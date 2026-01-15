import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Title,
  TextInput,
  Textarea,
  Stack,
  Text,
  Grid,
  Group,
  MultiSelect,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { IconUsers, IconArrowLeft, IconFlag } from '@tabler/icons-react';

import { VTBCard } from '../../components/common/VTBCard';
import { VTBButton } from '../../components/common/VTBButton';
import { AvatarUploader } from '../../components/common/AvatarUploader';
import { teamsApi, api } from '../../api';
import { queryKeys } from '../../api/queryKeys';
import { Team } from '../../types';
import { invalidateTeamQueries } from '../../utils/cacheInvalidation';

export function EditTeam() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const teamId = Number(id);

  const [isCustomDirection, setIsCustomDirection] = useState(false);

  const { data: team, isLoading } = useQuery<Team>({
    queryKey: queryKeys.teams.detail(teamId),
    queryFn: () => teamsApi.getTeam(teamId),
    enabled: !!id && !isNaN(teamId),
  });

  const form = useForm({
    initialValues: {
      name: '',
      description: '',
      directions: [] as string[],
      customDirection: '',
    },
    validate: {
      name: (value) =>
        !value
          ? 'Введите название команды'
          : value.length < 3
            ? 'Название должно содержать минимум 3 символа'
            : value.length > 100
              ? 'Название не должно превышать 100 символов'
              : null,
      description: (value) =>
        value && value.length > 500 ? 'Описание не должно превышать 500 символов' : null,
      directions: (value) => {
        if (!value || value.length === 0) return 'Выберите хотя бы одно направление';
        if (value.length > 2) return 'Можно выбрать максимум 2 направления';
        return null;
      },
      customDirection: (value, values) => {
        if (values.directions.includes('Другое') && !value) {
          return 'Введите направление команды';
        }
        if (value && value.length > 100) {
          return 'Направление не должно превышать 100 символов';
        }
        return null;
      },
    },
  });

  useEffect(() => {
    if (team) {
      // Check if the team's direction contains multiple directions (separated by ", ")
      const predefinedDirections = ['CTF', 'Хакатон', 'Дроны'];
      const directionParts = team.direction ? team.direction.split(', ').map(d => d.trim()) : [];

      const mappedDirections: string[] = [];
      let customDir = '';

      directionParts.forEach(dir => {
        if (predefinedDirections.includes(dir)) {
          mappedDirections.push(dir);
        } else if (dir) {
          // This is a custom direction
          mappedDirections.push('Другое');
          customDir = dir;
        }
      });

      form.setValues({
        name: team.name,
        description: team.description || '',
        directions: mappedDirections,
        customDirection: customDir,
      });
      setIsCustomDirection(mappedDirections.includes('Другое'));
    }
  }, [team]);

  const updateTeamMutation = useMutation({
    mutationFn: (data: { name: string; description?: string; direction?: string }) =>
      teamsApi.updateTeam(teamId, data),
    onSuccess: () => {
      // Use centralized invalidation for consistency
      invalidateTeamQueries({ queryClient }, teamId);

      notifications.show({
        title: 'Успех',
        message: 'Команда успешно обновлена',
        color: 'teal',
      });
      navigate(`/teams/${teamId}`);
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Ошибка',
        message: error.response?.data?.detail || 'Не удалось обновить команду',
        color: 'red',
      });
    },
  });

  const handleSubmit = (values: typeof form.values) => {
    // Replace "Другое" with custom direction, then join with ", "
    const finalDirections = values.directions.map(dir =>
      dir === 'Другое' ? values.customDirection : dir
    );
    const directionString = finalDirections.join(', ');

    updateTeamMutation.mutate({
      name: values.name.trim(),
      description: values.description.trim() || undefined,
      direction: directionString || undefined,
    });
  };

  const handleImageUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    await api.post(`/api/teams/${teamId}/upload-image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    notifications.show({
      title: 'Готово',
      message: 'Изображение команды обновлено',
      color: 'teal',
    });

    // Use centralized invalidation
    invalidateTeamQueries({ queryClient }, teamId);
  };

  const handleImageRemove = async () => {
    await api.delete(`/api/teams/${teamId}/image`);
    notifications.show({
      title: 'Готово',
      message: 'Изображение удалено',
      color: 'teal',
    });

    // Use centralized invalidation
    invalidateTeamQueries({ queryClient }, teamId);
  };

  if (isLoading) {
    return (
      <Container size="xl" py="xl">
        <Text c="white" ta="center">Загрузка...</Text>
      </Container>
    );
  }

  if (!team) {
    return (
      <Container size="xl" py="xl">
        <Text c="red" ta="center">Команда не найдена</Text>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <div>
          <VTBButton
            variant="secondary"
            leftSection={<IconArrowLeft size={18} />}
            onClick={() => navigate(`/teams/${teamId}`)}
            mb="lg"
          >
            Назад к команде
          </VTBButton>

          <Title order={1} className="vtb-heading-hero">
            <span className="vtb-gradient-text">Редактировать команду</span>
          </Title>
          <Text size="lg" c="dimmed" mt="md">
            Обновите информацию о команде
          </Text>
        </div>

        <VTBCard variant="primary">
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Grid gutter="xl">
              {/* Изображение команды */}
              <Grid.Col span={{ base: 12, md: 4 }}>
                <Stack gap="md" align="center">
                  <Text fw={600} c="white" size="sm">
                    Изображение команды
                  </Text>

                  <AvatarUploader
                    currentAvatar={team.image_url || undefined}
                    onUpload={handleImageUpload}
                    onRemove={handleImageRemove}
                    size={200}
                  />
                </Stack>
              </Grid.Col>

              {/* Форма */}
              <Grid.Col span={{ base: 12, md: 8 }}>
                <Stack gap="lg">
                  <TextInput
                    label="Название команды"
                    placeholder="Введите название команды"
                    leftSection={<IconUsers size={18} />}
                    size="md"
                    required
                    classNames={{ input: 'glass-input' }}
                    styles={{ label: { color: '#ffffff', fontWeight: 600, marginBottom: 8 } }}
                    {...form.getInputProps('name')}
                  />

                  <MultiSelect
                    label="Направление команды"
                    placeholder="Выберите до 2 направлений"
                    leftSection={<IconFlag size={18} />}
                    size="md"
                    classNames={{ input: 'glass-input' }}
                    styles={{
                      label: { color: '#ffffff', fontWeight: 600, marginBottom: 8 },
                    }}
                    data={[
                      { value: 'CTF', label: 'CTF' },
                      { value: 'Хакатон', label: 'Хакатон' },
                      { value: 'Дроны', label: 'Дроны' },
                      { value: 'Другое', label: 'Другое' },
                    ]}
                    maxValues={2}
                    {...form.getInputProps('directions')}
                    onChange={(value) => {
                      form.setFieldValue('directions', value);
                      setIsCustomDirection(value.includes('Другое'));
                      if (!value.includes('Другое')) {
                        form.setFieldValue('customDirection', '');
                      }
                    }}
                    required
                  />

                  {isCustomDirection && (
                    <TextInput
                      label="Укажите направление"
                      placeholder="Введите направление команды"
                      leftSection={<IconFlag size={18} />}
                      size="md"
                      classNames={{ input: 'glass-input' }}
                      styles={{
                        label: { color: '#ffffff', fontWeight: 600, marginBottom: 8 },
                      }}
                      {...form.getInputProps('customDirection')}
                      required
                    />
                  )}

                  <Textarea
                    label="Описание"
                    placeholder="Опишите цели и направление деятельности команды..."
                    rows={6}
                    size="md"
                    classNames={{ input: 'glass-input' }}
                    styles={{ label: { color: '#ffffff', fontWeight: 600, marginBottom: 8 } }}
                    {...form.getInputProps('description')}
                  />

                  <Group justify="flex-end" mt="xl">
                    <VTBButton variant="secondary" onClick={() => navigate(`/teams/${teamId}`)}>
                      Отмена
                    </VTBButton>

                    <VTBButton
                      type="submit"
                      loading={updateTeamMutation.isPending}
                      leftSection={<IconUsers size={18} />}
                    >
                      Сохранить изменения
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