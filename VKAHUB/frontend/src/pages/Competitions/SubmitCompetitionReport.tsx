import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Title,
  Text,
  Stack,
  TextInput,
  Textarea,
  NumberInput,
  Alert,
  Group,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconFileText } from '@tabler/icons-react';
import { VTBCard } from '../../components/common/VTBCard';
import { VTBButton } from '../../components/common/VTBButton';
import { api } from '../../api';

interface Competition {
  id: number;
  name: string;
  end_date: string;
}

interface Registration {
  id: number;
  team_name: string;
  has_report: boolean;
}

export default function SubmitCompetitionReport() {
  const { competitionId, registrationId } = useParams<{ competitionId: string; registrationId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [registration, setRegistration] = useState<Registration | null>(null);

  const form = useForm({
    initialValues: {
      git_link: '',
      presentation_url: '',
      brief_summary: '',
      placement: null as number | null,
      technologies_used: '',
      individual_contributions: '',
      team_evaluation: '',
      problems_faced: '',
    },
    validate: {
      git_link: (value) => {
        if (!value) return 'Ссылка на GitHub обязательна';
        if (!/^https?:\/\/.+/.test(value)) return 'Введите корректный URL';
        return null;
      },
      presentation_url: (value) => {
        if (!value) return 'Ссылка на презентацию обязательна';
        if (!/^https?:\/\/.+/.test(value)) return 'Введите корректный URL';
        return null;
      },
      brief_summary: (value) => {
        if (!value) return 'Краткое резюме обязательно';
        if (value.length < 50) return 'Резюме должно содержать минимум 50 символов';
        return null;
      },
      placement: (value) => {
        if (value !== null && value < 1) return 'Место должно быть положительным числом';
        return null;
      },
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!competitionId || !registrationId) return;

      try {
        // Fetch competition details
        const compResponse = await api.get(`/api/competitions/${competitionId}`);
        setCompetition(compResponse.data);

        // Check if report already submitted
        // This would need an endpoint to check registration status
      } catch (error: any) {
        notifications.show({
          title: 'Ошибка',
          message: error.response?.data?.detail || 'Не удалось загрузить данные',
          color: 'red',
        });
      }
    };

    fetchData();
  }, [competitionId, registrationId]);

  const handleSubmit = async (values: typeof form.values) => {
    if (!competitionId || !registrationId) return;

    setLoading(true);
    try {
      await api.post(
        `/api/competitions/${competitionId}/registrations/${registrationId}/report`,
        values
      );

      notifications.show({
        title: 'Успех',
        message: 'Отчет успешно отправлен!',
        color: 'teal',
      });

      navigate(`/competitions/${competitionId}`);
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

  if (!competition) {
    return (
      <Container size="md" py="xl">
        <Text c="white" ta="center">Загрузка...</Text>
      </Container>
    );
  }

  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        <div>
          <Title order={1} className="vtb-heading-hero">
            <span className="vtb-gradient-text">Отчет по соревнованию</span>
          </Title>
          <Text size="lg" c="dimmed" mt="md">
            {competition.name}
          </Text>
        </div>

        <Alert icon={<IconAlertCircle />} color="blue" variant="light">
          <Text size="sm">
            <strong>Обязательные поля:</strong> Ссылка на Git-репозиторий, презентация (PDF/PowerPoint) и краткое резюме о ходе соревнования.
          </Text>
        </Alert>

        <VTBCard variant="primary">
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="lg">
              <Text fw={700} size="lg" c="white">Основные данные</Text>

              <TextInput
                label="Ссылка на Git-репозиторий"
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
                label="Ссылка на презентацию (PDF/PowerPoint)"
                placeholder="https://drive.google.com/... или другой сервис"
                leftSection={<IconFileText size={18} />}
                size="md"
                classNames={{ input: 'glass-input' }}
                styles={{
                  label: { color: '#ffffff', fontWeight: 600, marginBottom: 8 },
                }}
                {...form.getInputProps('presentation_url')}
                required
              />

              <Textarea
                label="Краткое резюме"
                placeholder="Опишите ход соревнования, что было сделано, какие результаты достигнуты..."
                minRows={5}
                size="md"
                classNames={{ input: 'glass-input' }}
                styles={{
                  label: { color: '#ffffff', fontWeight: 600, marginBottom: 8 },
                }}
                {...form.getInputProps('brief_summary')}
                required
              />

              <NumberInput
                label="Занятое место (если применимо)"
                placeholder="1, 2, 3..."
                min={1}
                size="md"
                classNames={{ input: 'glass-input' }}
                styles={{
                  label: { color: '#ffffff', fontWeight: 600, marginBottom: 8 },
                }}
                {...form.getInputProps('placement')}
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
                  onClick={() => navigate(`/competitions/${competitionId}`)}
                >
                  Отмена
                </VTBButton>
                <VTBButton
                  type="submit"
                  loading={loading}
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
            <strong>Важно:</strong> После окончания соревнования у вас есть 5 дней на подачу отчета.
            Если отчет не будет подан вовремя, вся команда не сможет выполнять действия на платформе до его создания.
          </Text>
        </Alert>
      </Stack>
    </Container>
  );
}
