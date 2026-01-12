import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Title,
  Text,
  Stack,
  TextInput,
  Textarea,
  Alert,
  Group,
  Select,
  FileInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconFileText, IconUpload, IconTrophy } from '@tabler/icons-react';
import { VTBCard } from '../../components/common/VTBCard';
import { VTBButton } from '../../components/common/VTBButton';
import { competitionsApi } from '../../api/competitions';

interface CompletedCompetition {
  registration_id: number;
  competition_id: number;
  competition_name: string;
  competition_type: string;
  team_id: number;
  team_name: string;
  end_date: string;
  has_report: boolean;
}

const RESULT_OPTIONS = [
  { value: '1st_place', label: '1 место' },
  { value: '2nd_place', label: '2 место' },
  { value: '3rd_place', label: '3 место' },
  { value: 'finalist', label: 'Финалист' },
  { value: 'semi_finalist', label: 'Полуфиналист' },
  { value: 'did_not_pass', label: 'Не прошли' },
];

export default function SubmitCompetitionReport() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploadingPresentation, setUploadingPresentation] = useState(false);
  const [completedCompetitions, setCompletedCompetitions] = useState<CompletedCompetition[]>([]);
  const [selectedCompetition, setSelectedCompetition] = useState<CompletedCompetition | null>(null);

  const form = useForm({
    initialValues: {
      registration_id: '',
      result: '',
      git_link: '',
      project_url: '',
      presentation_file: null as File | null,
      presentation_url: '',
      brief_summary: '',
      technologies_used: '',
      individual_contributions: '',
      team_evaluation: '',
      problems_faced: '',
    },
    validate: {
      registration_id: (value) => (!value ? 'Выберите соревнование' : null),
      result: (value) => (!value ? 'Выберите результат' : null),
      git_link: (value) => {
        if (!value) return 'Ссылка на GitHub обязательна';
        if (!/^https?:\/\/.+/.test(value)) return 'Введите корректный URL';
        return null;
      },
      project_url: (value) => {
        if (value && !/^https?:\/\/.+/.test(value)) return 'Введите корректный URL';
        return null;
      },
      presentation_file: (value) => {
        if (!value && !form.values.presentation_url) return 'Загрузите презентацию';
        return null;
      },
      brief_summary: (value) => {
        if (!value) return 'Описание обязательно';
        if (value.length < 50) return 'Описание должно содержать минимум 50 символов';
        return null;
      },
    },
  });

  useEffect(() => {
    const fetchCompletedCompetitions = async () => {
      try {
        const response = await competitionsApi.getCompletedCompetitionsForMyTeams();
        setCompletedCompetitions(response.competitions || []);
      } catch (error: any) {
        notifications.show({
          title: 'Ошибка',
          message: error.response?.data?.detail || 'Не удалось загрузить список соревнований',
          color: 'red',
        });
      }
    };

    fetchCompletedCompetitions();
  }, []);

  const handleCompetitionSelect = (registrationId: string | null) => {
    if (!registrationId) {
      setSelectedCompetition(null);
      form.setFieldValue('registration_id', '');
      return;
    }

    const competition = completedCompetitions.find(
      (c) => c.registration_id.toString() === registrationId
    );

    if (competition) {
      setSelectedCompetition(competition);
      form.setFieldValue('registration_id', registrationId);

      if (competition.has_report) {
        notifications.show({
          title: 'Внимание',
          message: 'Для этого соревнования уже был подан отчет',
          color: 'yellow',
        });
      }
    }
  };

  const handlePresentationUpload = async (file: File | null) => {
    if (!file) {
      form.setFieldValue('presentation_file', null);
      form.setFieldValue('presentation_url', '');
      return;
    }

    form.setFieldValue('presentation_file', file);
    setUploadingPresentation(true);

    try {
      const response = await competitionsApi.uploadPresentation(file);
      form.setFieldValue('presentation_url', response.file_url);
      notifications.show({
        title: 'Успех',
        message: 'Презентация успешно загружена!',
        color: 'teal',
      });
    } catch (error: any) {
      notifications.show({
        title: 'Ошибка',
        message: error.response?.data?.detail || 'Не удалось загрузить презентацию',
        color: 'red',
      });
      form.setFieldValue('presentation_file', null);
    } finally {
      setUploadingPresentation(false);
    }
  };

  const handleSubmit = async (values: typeof form.values) => {
    if (!selectedCompetition) {
      notifications.show({
        title: 'Ошибка',
        message: 'Выберите соревнование',
        color: 'red',
      });
      return;
    }

    if (selectedCompetition.has_report) {
      notifications.show({
        title: 'Ошибка',
        message: 'Для этого соревнования уже был подан отчет',
        color: 'red',
      });
      return;
    }

    setLoading(true);
    try {
      await competitionsApi.submitCompetitionReport(
        selectedCompetition.competition_id,
        selectedCompetition.registration_id,
        {
          result: values.result,
          git_link: values.git_link,
          project_url: values.project_url || undefined,
          presentation_url: values.presentation_url,
          brief_summary: values.brief_summary,
          technologies_used: values.technologies_used || undefined,
          individual_contributions: values.individual_contributions || undefined,
          team_evaluation: values.team_evaluation || undefined,
          problems_faced: values.problems_faced || undefined,
        }
      );

      notifications.show({
        title: 'Успех',
        message: 'Отчет успешно отправлен!',
        color: 'teal',
      });

      navigate(`/competitions/${selectedCompetition.competition_id}`);
    } catch (error: any) {
      notifications.show({
        title: 'Ошибка',
        message: error.response?.data?.detail || 'Не удалось отправить отчет',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const competitionOptions = completedCompetitions.map((comp) => ({
    value: comp.registration_id.toString(),
    label: `${comp.competition_name} (${comp.team_name})${comp.has_report ? ' - Отчет уже подан' : ''}`,
    disabled: comp.has_report,
  }));

  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        <div>
          <Title order={1} className="vtb-heading-hero">
            <span className="vtb-gradient-text">Подать отчет по соревнованию</span>
          </Title>
          <Text size="lg" c="dimmed" mt="md">
            Заполните все обязательные поля для подачи отчета по завершенному соревнованию
          </Text>
        </div>

        <Alert icon={<IconAlertCircle />} color="blue" variant="light">
          <Text size="sm">
            <strong>Обязательные поля:</strong> Соревнование, результат, ссылка на GitHub, презентация и описание.
          </Text>
        </Alert>

        <VTBCard variant="primary">
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="lg">
              <Text fw={700} size="lg" c="white">Выбор соревнования</Text>

              <Select
                label="Соревнование"
                placeholder="Выберите завершенное соревнование"
                data={competitionOptions}
                size="md"
                classNames={{ input: 'glass-input' }}
                styles={{
                  label: { color: '#ffffff', fontWeight: 600, marginBottom: 8 },
                }}
                {...form.getInputProps('registration_id')}
                onChange={handleCompetitionSelect}
                required
                searchable
              />

              {selectedCompetition && (
                <Alert color="cyan" variant="light">
                  <Text size="sm">
                    <strong>Команда:</strong> {selectedCompetition.team_name}
                    <br />
                    <strong>Дата окончания:</strong> {new Date(selectedCompetition.end_date).toLocaleDateString('ru-RU')}
                  </Text>
                </Alert>
              )}

              <Text fw={700} size="lg" c="white" mt="md">Результаты участия</Text>

              <Select
                label="Результат"
                placeholder="Выберите результат"
                data={RESULT_OPTIONS}
                size="md"
                classNames={{ input: 'glass-input' }}
                styles={{
                  label: { color: '#ffffff', fontWeight: 600, marginBottom: 8 },
                }}
                leftSection={<IconTrophy size={18} />}
                {...form.getInputProps('result')}
                required
              />

              <Text fw={700} size="lg" c="white" mt="md">Проектные материалы</Text>

              <TextInput
                label="Ссылка на GitHub"
                placeholder="https://github.com/username/project"
                leftSection={<IconFileText size={18} />}
                size="md"
                classNames={{ input: 'glass-input' }}
                styles={{
                  label: { color: '#ffffff', fontWeight: 600, marginBottom: 8 },
                }}
                {...form.getInputProps('git_link')}
                required
              />

              <TextInput
                label="Ссылка на развернутый проект (опционально)"
                placeholder="https://myproject.com"
                leftSection={<IconFileText size={18} />}
                size="md"
                classNames={{ input: 'glass-input' }}
                styles={{
                  label: { color: '#ffffff', fontWeight: 600, marginBottom: 8 },
                }}
                {...form.getInputProps('project_url')}
              />

              <FileInput
                label="Презентация (PDF или PowerPoint)"
                placeholder="Выберите файл"
                leftSection={<IconUpload size={18} />}
                size="md"
                classNames={{ input: 'glass-input' }}
                styles={{
                  label: { color: '#ffffff', fontWeight: 600, marginBottom: 8 },
                }}
                accept=".pdf,.ppt,.pptx"
                {...form.getInputProps('presentation_file')}
                onChange={handlePresentationUpload}
                disabled={uploadingPresentation}
                required
              />

              {uploadingPresentation && (
                <Text size="sm" c="dimmed">Загрузка презентации...</Text>
              )}

              <Textarea
                label="Описание участия"
                placeholder="Опишите, что вы делали в рамках соревнования, как проходило участие, какие задачи решали..."
                minRows={6}
                size="md"
                classNames={{ input: 'glass-input' }}
                styles={{
                  label: { color: '#ffffff', fontWeight: 600, marginBottom: 8 },
                }}
                {...form.getInputProps('brief_summary')}
                required
              />

              <Text fw={700} size="lg" c="white" mt="md">Дополнительная информация (необязательно)</Text>

              <Textarea
                label="Использованные технологии"
                placeholder="React, Node.js, PostgreSQL, Docker..."
                minRows={3}
                size="md"
                classNames={{ input: 'glass-input' }}
                styles={{
                  label: { color: '#ffffff', fontWeight: 600, marginBottom: 8 },
                }}
                {...form.getInputProps('technologies_used')}
              />

              <Textarea
                label="Вклад участников"
                placeholder="Опишите, кто чем занимался в команде..."
                minRows={4}
                size="md"
                classNames={{ input: 'glass-input' }}
                styles={{
                  label: { color: '#ffffff', fontWeight: 600, marginBottom: 8 },
                }}
                {...form.getInputProps('individual_contributions')}
              />

              <Textarea
                label="Оценка работы команды"
                placeholder="Как вы оцениваете работу команды в целом..."
                minRows={3}
                size="md"
                classNames={{ input: 'glass-input' }}
                styles={{
                  label: { color: '#ffffff', fontWeight: 600, marginBottom: 8 },
                }}
                {...form.getInputProps('team_evaluation')}
              />

              <Textarea
                label="Проблемы и сложности"
                placeholder="С какими проблемами столкнулись, как их решали..."
                minRows={3}
                size="md"
                classNames={{ input: 'glass-input' }}
                styles={{
                  label: { color: '#ffffff', fontWeight: 600, marginBottom: 8 },
                }}
                {...form.getInputProps('problems_faced')}
              />

              <Group justify="flex-end" mt="xl">
                <VTBButton
                  variant="secondary"
                  onClick={() => navigate('/teams')}
                >
                  Отмена
                </VTBButton>
                <VTBButton
                  type="submit"
                  loading={loading}
                  disabled={uploadingPresentation}
                  leftSection={<IconFileText size={18} />}
                >
                  Отправить отчет
                </VTBButton>
              </Group>
            </Stack>
          </form>
        </VTBCard>

        <Alert icon={<IconAlertCircle />} color="yellow" variant="light">
          <Text size="sm">
            <strong>Важно:</strong> Отчет может быть подан только капитаном команды.
            Убедитесь, что все данные заполнены корректно перед отправкой.
          </Text>
        </Alert>
      </Stack>
    </Container>
  );
}
