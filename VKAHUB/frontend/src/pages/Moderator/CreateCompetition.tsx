import { useState } from 'react';
import {
  Container,
  Paper,
  Title,
  TextInput,
  Textarea,
  Select,
  Button,
  Group,
  Stack,
  NumberInput,
  ActionIcon,
  Box,
  Text,
  FileInput,
  Grid,
  Card,
  Badge,
  MultiSelect,
} from '@mantine/core';
import { DateInput, DateTimePicker } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconTrash, IconPlus, IconUpload } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { competitionsApi } from '../../api/competitions';
import { VTBCard } from '../../components/common/VTBCard';
import { invalidateCompetitionQueries } from '../../utils/cacheInvalidation';

interface Stage {
  stage_number: number;
  name: string;
  description: string;
  start_date: Date | null;
  end_date: Date | null;
}

interface Case {
  case_number: number;
  title: string;
  description: string;
  knowledge_stack: string[];
}

const TECH_STACK_OPTIONS = [
  'Python', 'JavaScript', 'TypeScript', 'React', 'Vue', 'Angular',
  'Node.js', 'Django', 'FastAPI', 'Flask', 'Spring Boot', 'PostgreSQL',
  'MySQL', 'MongoDB', 'Redis', 'Docker', 'Kubernetes', 'AWS', 'Azure',
  'GCP', 'Git', 'CI/CD', 'GraphQL', 'REST API', 'WebSockets', 'Machine Learning',
  'Deep Learning', 'Data Science', 'DevOps', 'Cybersecurity', 'Blockchain',
  'Mobile Development', 'iOS', 'Android', 'Flutter', 'React Native'
];

export default function CreateCompetition() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [stages, setStages] = useState<Stage[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const form = useForm({
    initialValues: {
      type: '',
      name: '',
      description: '',
      organizer: '',
      other_type_description: '',
      link: '',
      image_url: '',
      start_date: null as Date | null,
      end_date: null as Date | null,
      registration_deadline: null as Date | null,
      min_team_size: 2,
      max_team_size: 5,
    },
    validate: {
      type: (value) => (!value ? 'Тип соревнования обязателен' : null),
      name: (value) => (!value ? 'Название обязательно' : null),
      organizer: (value) => (!value ? 'Организатор обязателен' : null),
      start_date: (value) => (!value ? 'Дата начала обязательна' : null),
      end_date: (value) => (!value ? 'Дата окончания обязательна' : null),
      registration_deadline: (value) => (!value ? 'Дедлайн регистрации обязателен' : null),
      other_type_description: (value, values) =>
        values.type === 'other' && !value ? 'Описание обязательно для типа "Другое"' : null,
      max_team_size: (value, values) =>
        value < values.min_team_size ? 'Макс. размер команды должен быть >= мин.' : null,
    },
  });

  const addStage = () => {
    setStages([
      ...stages,
      {
        stage_number: stages.length + 1,
        name: '',
        description: '',
        start_date: null,
        end_date: null,
      },
    ]);
  };

  const removeStage = (index: number) => {
    const newStages = stages.filter((_, i) => i !== index);
    // Renumber stages
    setStages(newStages.map((stage, i) => ({ ...stage, stage_number: i + 1 })));
  };

  const updateStage = (index: number, field: keyof Stage, value: any) => {
    const newStages = [...stages];
    newStages[index] = { ...newStages[index], [field]: value };
    setStages(newStages);
  };

  const addCase = () => {
    setCases([
      ...cases,
      {
        case_number: cases.length + 1,
        title: '',
        description: '',
        knowledge_stack: [],
      },
    ]);
  };

  const removeCase = (index: number) => {
    const newCases = cases.filter((_, i) => i !== index);
    // Renumber cases
    setCases(newCases.map((c, i) => ({ ...c, case_number: i + 1 })));
  };

  const updateCase = (index: number, field: keyof Case, value: any) => {
    const newCases = [...cases];
    newCases[index] = { ...newCases[index], [field]: value };
    setCases(newCases);
  };

  const createCompetitionMutation = useMutation({
    mutationFn: (competitionData: any) => competitionsApi.createCompetition(competitionData),
    onSuccess: () => {
      // Invalidate competitions list to show the new competition
      invalidateCompetitionQueries({ queryClient });

      notifications.show({
        title: 'Успешно',
        message: 'Соревнование успешно создано',
        color: 'green',
      });

      navigate('/moderator/competitions');
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Ошибка',
        message: error.response?.data?.detail || 'Не удалось создать соревнование',
        color: 'red',
      });
    },
  });

  const handleSubmit = (values: typeof form.values) => {
    if (values.type === 'hackathon' && cases.length === 0) {
      notifications.show({
        title: 'Ошибка валидации',
        message: 'Хакатоны должны иметь хотя бы один кейс',
        color: 'red',
      });
      return;
    }

    // Validate stages
    for (const stage of stages) {
      if (!stage.name || !stage.start_date || !stage.end_date) {
        notifications.show({
          title: 'Ошибка валидации',
          message: 'Все поля этапа должны быть заполнены',
          color: 'red',
        });
        return;
      }
    }

    // Validate cases for hackathons
    if (values.type === 'hackathon') {
      for (const caseItem of cases) {
        if (!caseItem.title || !caseItem.description || caseItem.knowledge_stack.length === 0) {
          notifications.show({
            title: 'Ошибка валидации',
            message: 'Все поля кейса должны быть заполнены',
            color: 'red',
          });
          return;
        }
      }
    }

    // TODO: If imageFile is provided, upload it to storage and get URL
    // For now, we'll use the image_url field from form or empty string
    const imageUrl = values.image_url || '';

    const competitionData = {
      ...values,
      image_url: imageUrl,
      organizer: values.organizer,
      stages: stages.map(stage => ({
        stage_number: stage.stage_number,
        name: stage.name,
        description: stage.description,
        start_date: stage.start_date!.toISOString().split('T')[0],
        end_date: stage.end_date!.toISOString().split('T')[0],
      })),
      cases: values.type === 'hackathon' ? cases : [],
      start_date: values.start_date!.toISOString(),  // Now includes time
      end_date: values.end_date!.toISOString(),  // Now includes time
      registration_deadline: values.registration_deadline!.toISOString(),
    };

    createCompetitionMutation.mutate(competitionData);
  };

  return (
    <Container size="lg" py="xl">
      <Paper shadow="sm" p="xl" withBorder>
        <Title order={2} mb="lg">
          Создание соревнования
        </Title>

        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            {/* Basic Information */}
            <Card withBorder>
              <Title order={4} mb="md">
                Основная информация
              </Title>

              <Grid>
                <Grid.Col span={6}>
                  <Select
                    label="Тип соревнования"
                    placeholder="Выберите тип"
                    required
                    data={[
                      { value: 'hackathon', label: 'Хакатон' },
                      { value: 'CTF', label: 'CTF (Capture The Flag)' },
                      { value: 'other', label: 'Другое' },
                    ]}
                    {...form.getInputProps('type')}
                  />
                </Grid.Col>

                <Grid.Col span={6}>
                  <TextInput
                    label="Название соревнования"
                    placeholder="Введите название"
                    required
                    {...form.getInputProps('name')}
                  />
                </Grid.Col>

                {form.values.type === 'other' && (
                  <Grid.Col span={12}>
                    <TextInput
                      label="Описание типа"
                      placeholder="Опишите тип соревнования"
                      required
                      {...form.getInputProps('other_type_description')}
                    />
                  </Grid.Col>
                )}

                <Grid.Col span={12}>
                  <Textarea
                    label="Описание"
                    placeholder="Введите описание соревнования"
                    minRows={4}
                    {...form.getInputProps('description')}
                  />
                </Grid.Col>

                <Grid.Col span={12}>
                  <TextInput
                    label="Организатор"
                    placeholder="напр., ПАО «ВТБ», ВКА имени А.Ф.Можайского"
                    required
                    {...form.getInputProps('organizer')}
                  />
                </Grid.Col>

                <Grid.Col span={6}>
                  <TextInput
                    label="Ссылка (опционально)"
                    placeholder="https://..."
                    {...form.getInputProps('link')}
                  />
                </Grid.Col>

                <Grid.Col span={6}>
                  <FileInput
                    label="Изображение соревнования (опционально)"
                    placeholder="Выберите файл"
                    accept="image/*"
                    leftSection={<IconUpload size={16} />}
                    value={imageFile}
                    onChange={setImageFile}
                    clearable
                  />
                </Grid.Col>
              </Grid>
            </Card>

            {/* Dates */}
            <Card withBorder>
              <Title order={4} mb="md">
                Даты
              </Title>

              <Grid>
                <Grid.Col span={4}>
                  <DateTimePicker
                    label="Дата и время начала"
                    placeholder="Выберите дату и время"
                    required
                    valueFormat="DD.MM.YYYY HH:mm"
                    {...form.getInputProps('start_date')}
                  />
                </Grid.Col>

                <Grid.Col span={4}>
                  <DateTimePicker
                    label="Дата и время окончания"
                    placeholder="Выберите дату и время"
                    required
                    valueFormat="DD.MM.YYYY HH:mm"
                    {...form.getInputProps('end_date')}
                  />
                </Grid.Col>

                <Grid.Col span={4}>
                  <DateTimePicker
                    label="Дедлайн регистрации"
                    placeholder="Выберите дату и время"
                    required
                    valueFormat="DD.MM.YYYY HH:mm"
                    {...form.getInputProps('registration_deadline')}
                  />
                </Grid.Col>
              </Grid>
            </Card>

            {/* Team Size */}
            <Card withBorder>
              <Title order={4} mb="md">
                Требования к команде
              </Title>

              <Grid>
                <Grid.Col span={6}>
                  <NumberInput
                    label="Мин. размер команды"
                    placeholder="2"
                    min={1}
                    max={10}
                    required
                    {...form.getInputProps('min_team_size')}
                  />
                </Grid.Col>

                <Grid.Col span={6}>
                  <NumberInput
                    label="Макс. размер команды"
                    placeholder="5"
                    min={1}
                    max={10}
                    required
                    {...form.getInputProps('max_team_size')}
                  />
                </Grid.Col>
              </Grid>
            </Card>

            {/* Stages */}
            <VTBCard variant="secondary">
              <Group justify="space-between" mb="md">
                <Title order={4} c="white">Этапы соревнования</Title>
                <Button leftSection={<IconPlus size={16} />} onClick={addStage} size="sm" variant="light" color="cyan">
                  Добавить этап
                </Button>
              </Group>

              {stages.length === 0 ? (
                <Text c="dimmed" ta="center" py="md">
                  Этапы пока не добавлены. Нажмите "Добавить этап".
                </Text>
              ) : (
                <Stack gap="md">
                  {stages.map((stage, index) => (
                    <VTBCard key={index} variant="primary">
                      <Group justify="space-between" mb="sm">
                        <Badge color="cyan" variant="light">Этап {stage.stage_number}</Badge>
                        <ActionIcon color="red" variant="light" onClick={() => removeStage(index)}>
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Group>

                      <Grid>
                        <Grid.Col span={12}>
                          <TextInput
                            label="Название этапа"
                            placeholder="напр., Регистрация, Отбор, Финал"
                            value={stage.name}
                            onChange={(e) => updateStage(index, 'name', e.target.value)}
                            required
                            classNames={{ input: 'glass-input' }}
                            styles={{ label: { color: '#ffffff', fontWeight: 600, marginBottom: 8 } }}
                          />
                        </Grid.Col>

                        <Grid.Col span={12}>
                          <Textarea
                            label="Описание"
                            placeholder="Опишите этот этап"
                            value={stage.description}
                            onChange={(e) => updateStage(index, 'description', e.target.value)}
                            minRows={2}
                            classNames={{ input: 'glass-input' }}
                            styles={{ label: { color: '#ffffff', fontWeight: 600, marginBottom: 8 } }}
                          />
                        </Grid.Col>

                        <Grid.Col span={6}>
                          <DateInput
                            label="Дата начала"
                            placeholder="Выберите дату"
                            value={stage.start_date}
                            onChange={(value) => updateStage(index, 'start_date', value)}
                            required
                            classNames={{ input: 'glass-input' }}
                            styles={{ label: { color: '#ffffff', fontWeight: 600, marginBottom: 8 } }}
                          />
                        </Grid.Col>

                        <Grid.Col span={6}>
                          <DateInput
                            label="Дата окончания"
                            placeholder="Выберите дату"
                            value={stage.end_date}
                            onChange={(value) => updateStage(index, 'end_date', value)}
                            required
                            classNames={{ input: 'glass-input' }}
                            styles={{ label: { color: '#ffffff', fontWeight: 600, marginBottom: 8 } }}
                          />
                        </Grid.Col>
                      </Grid>
                    </VTBCard>
                  ))}
                </Stack>
              )}
            </VTBCard>

            {/* Cases (for Hackathons only) */}
            {form.values.type === 'hackathon' && (
              <VTBCard variant="secondary">
                <Group justify="space-between" mb="md">
                  <Title order={4} c="white">Кейсы хакатона</Title>
                  <Button leftSection={<IconPlus size={16} />} onClick={addCase} size="sm" variant="light" color="cyan">
                    Добавить кейс
                  </Button>
                </Group>

                {cases.length === 0 ? (
                  <Text c="dimmed" ta="center" py="md">
                    Кейсы не добавлены. Хакатоны требуют хотя бы один кейс.
                  </Text>
                ) : (
                  <Stack gap="md">
                    {cases.map((caseItem, index) => (
                      <VTBCard key={index} variant="primary">
                        <Group justify="space-between" mb="sm">
                          <Badge color="cyan" variant="light">Кейс {caseItem.case_number}</Badge>
                          <ActionIcon color="red" variant="light" onClick={() => removeCase(index)}>
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Group>

                        <Grid>
                          <Grid.Col span={12}>
                            <TextInput
                              label="Название кейса"
                              placeholder="Введите название кейса"
                              value={caseItem.title}
                              onChange={(e) => updateCase(index, 'title', e.target.value)}
                              required
                              classNames={{ input: 'glass-input' }}
                              styles={{ label: { color: '#ffffff', fontWeight: 600, marginBottom: 8 } }}
                            />
                          </Grid.Col>

                          <Grid.Col span={12}>
                            <Textarea
                              label="Описание кейса"
                              placeholder="Опишите задачу для решения"
                              value={caseItem.description}
                              onChange={(e) => updateCase(index, 'description', e.target.value)}
                              minRows={3}
                              required
                              classNames={{ input: 'glass-input' }}
                              styles={{ label: { color: '#ffffff', fontWeight: 600, marginBottom: 8 } }}
                            />
                          </Grid.Col>

                          <Grid.Col span={12}>
                            <MultiSelect
                              label="Стек технологий"
                              placeholder="Выберите требуемые технологии"
                              data={TECH_STACK_OPTIONS}
                              value={caseItem.knowledge_stack}
                              onChange={(value) => updateCase(index, 'knowledge_stack', value)}
                              searchable
                              required
                              classNames={{ input: 'glass-input' }}
                              styles={{ label: { color: '#ffffff', fontWeight: 600, marginBottom: 8 } }}
                            />
                          </Grid.Col>
                        </Grid>
                      </VTBCard>
                    ))}
                  </Stack>
                )}
              </VTBCard>
            )}

            {/* Submit Buttons */}
            <Group justify="flex-end" mt="xl">
              <Button variant="default" onClick={() => navigate('/moderator/competitions')}>
                Отмена
              </Button>
              <Button type="submit" loading={createCompetitionMutation.isPending}>
                Создать соревнование
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}
