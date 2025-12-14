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
import { competitionsApi } from '../../api/competitions';

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
  const [loading, setLoading] = useState(false);
  const [stages, setStages] = useState<Stage[]>([]);
  const [cases, setCases] = useState<Case[]>([]);

  const form = useForm({
    initialValues: {
      type: '',
      name: '',
      description: '',
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

  const handleSubmit = async (values: typeof form.values) => {
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

    setLoading(true);
    try {
      const competitionData = {
        ...values,
        stages: stages.map(stage => ({
          stage_number: stage.stage_number,
          name: stage.name,
          description: stage.description,
          start_date: stage.start_date!.toISOString().split('T')[0],
          end_date: stage.end_date!.toISOString().split('T')[0],
        })),
        cases: values.type === 'hackathon' ? cases : [],
        start_date: values.start_date!.toISOString().split('T')[0],
        end_date: values.end_date!.toISOString().split('T')[0],
        registration_deadline: values.registration_deadline!.toISOString(),
      };

      await competitionsApi.createCompetition(competitionData);

      notifications.show({
        title: 'Успешно',
        message: 'Соревнование успешно создано',
        color: 'green',
      });

      navigate('/moderator/competitions');
    } catch (error: any) {
      notifications.show({
        title: 'Ошибка',
        message: error.response?.data?.detail || 'Не удалось создать соревнование',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
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

                <Grid.Col span={6}>
                  <TextInput
                    label="Ссылка (опционально)"
                    placeholder="https://..."
                    {...form.getInputProps('link')}
                  />
                </Grid.Col>

                <Grid.Col span={6}>
                  <TextInput
                    label="URL изображения (опционально)"
                    placeholder="https://..."
                    {...form.getInputProps('image_url')}
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
                  <DateInput
                    label="Дата начала"
                    placeholder="Выберите дату"
                    required
                    {...form.getInputProps('start_date')}
                  />
                </Grid.Col>

                <Grid.Col span={4}>
                  <DateInput
                    label="Дата окончания"
                    placeholder="Выберите дату"
                    required
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
            <Card withBorder>
              <Group justify="space-between" mb="md">
                <Title order={4}>Этапы соревнования</Title>
                <Button leftSection={<IconPlus size={16} />} onClick={addStage} size="sm">
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
                    <Card key={index} withBorder bg="gray.0">
                      <Group justify="space-between" mb="sm">
                        <Badge>Этап {stage.stage_number}</Badge>
                        <ActionIcon color="red" onClick={() => removeStage(index)}>
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
                          />
                        </Grid.Col>

                        <Grid.Col span={12}>
                          <Textarea
                            label="Описание"
                            placeholder="Опишите этот этап"
                            value={stage.description}
                            onChange={(e) => updateStage(index, 'description', e.target.value)}
                            minRows={2}
                          />
                        </Grid.Col>

                        <Grid.Col span={6}>
                          <DateInput
                            label="Дата начала"
                            placeholder="Выберите дату"
                            value={stage.start_date}
                            onChange={(value) => updateStage(index, 'start_date', value)}
                            required
                          />
                        </Grid.Col>

                        <Grid.Col span={6}>
                          <DateInput
                            label="Дата окончания"
                            placeholder="Выберите дату"
                            value={stage.end_date}
                            onChange={(value) => updateStage(index, 'end_date', value)}
                            required
                          />
                        </Grid.Col>
                      </Grid>
                    </Card>
                  ))}
                </Stack>
              )}
            </Card>

            {/* Cases (for Hackathons only) */}
            {form.values.type === 'hackathon' && (
              <Card withBorder>
                <Group justify="space-between" mb="md">
                  <Title order={4}>Кейсы хакатона</Title>
                  <Button leftSection={<IconPlus size={16} />} onClick={addCase} size="sm">
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
                      <Card key={index} withBorder bg="blue.0">
                        <Group justify="space-between" mb="sm">
                          <Badge color="blue">Кейс {caseItem.case_number}</Badge>
                          <ActionIcon color="red" onClick={() => removeCase(index)}>
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
                            />
                          </Grid.Col>
                        </Grid>
                      </Card>
                    ))}
                  </Stack>
                )}
              </Card>
            )}

            {/* Submit Buttons */}
            <Group justify="flex-end" mt="xl">
              <Button variant="default" onClick={() => navigate('/moderator/competitions')}>
                Отмена
              </Button>
              <Button type="submit" loading={loading}>
                Создать соревнование
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}
