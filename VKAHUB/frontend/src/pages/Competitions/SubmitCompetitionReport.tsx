import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Title,
  Text,
  Stack,
  Textarea,
  Alert,
  Group,
  Select,
  Image,
  rem,
} from '@mantine/core';
import { Dropzone, MIME_TYPES } from '@mantine/dropzone';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconUpload, IconX, IconFileText, IconPhoto } from '@tabler/icons-react';
import { VTBCard } from '../../components/common/VTBCard';
import { VTBButton } from '../../components/common/VTBButton';
import { ConsoleInput } from '../../components/common/ConsoleInput';
import { competitionsApi } from '../../api/competitions';

// Console path label component for non-TextInput fields
const ConsoleLabel = ({ path, label, children }: { path: string; label?: string; children: React.ReactNode }) => (
  <div>
    {label && (
      <div style={{ marginBottom: 4 }}>
        <span style={{ color: '#ffffff', fontWeight: 600, fontSize: '14px' }}>
          {label}
        </span>
      </div>
    )}
    <div
      style={{
        color: 'var(--vtb-cyan)',
        fontFamily: "'Courier New', 'Consolas', monospace",
        fontSize: '13px',
        fontWeight: 'bold',
        marginBottom: '4px',
        userSelect: 'none',
      }}
    >
      {path} &gt;
    </div>
    {children}
  </div>
);

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
  const { registrationId } = useParams<{ competitionId?: string; registrationId?: string }>();
  const [loading, setLoading] = useState(false);
  const [uploadingPresentation, setUploadingPresentation] = useState(false);
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);
  const [completedCompetitions, setCompletedCompetitions] = useState<CompletedCompetition[]>([]);
  const [selectedCompetition, setSelectedCompetition] = useState<CompletedCompetition | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [presentationFile, setPresentationFile] = useState<File | null>(null);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);

  const form = useForm({
    initialValues: {
      registration_id: '',
      result: '',
      git_link: '',
      project_url: '',
      presentation_url: '',
      screenshot_url: '',
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
      presentation_url: (value) => {
        if (!value) return 'Загрузите презентацию';
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

  // Auto-select competition if URL params are provided
  useEffect(() => {
    if (completedCompetitions.length > 0 && registrationId && !initialized) {
      const competition = completedCompetitions.find(
        (c) => c.registration_id.toString() === registrationId
      );

      if (competition) {
        setSelectedCompetition(competition);
        form.setFieldValue('registration_id', registrationId);
        setInitialized(true);

        if (competition.has_report) {
          notifications.show({
            title: 'Внимание',
            message: 'Для этого соревнования уже был подан отчет',
            color: 'yellow',
          });
        }
      }
    }
  }, [completedCompetitions, registrationId, initialized]);

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

  const handlePresentationDrop = async (files: File[]) => {
    const file = files[0];
    if (!file) return;

    setPresentationFile(file);
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
      setPresentationFile(null);
    } finally {
      setUploadingPresentation(false);
    }
  };

  const handleScreenshotDrop = async (files: File[]) => {
    const file = files[0];
    if (!file) return;

    setScreenshotFile(file);
    setUploadingScreenshot(true);

    try {
      const response = await competitionsApi.uploadScreenshot(file);
      form.setFieldValue('screenshot_url', response.file_url);
      notifications.show({
        title: 'Успех',
        message: 'Скриншот успешно загружен!',
        color: 'teal',
      });
    } catch (error: any) {
      notifications.show({
        title: 'Ошибка',
        message: error.response?.data?.detail || 'Не удалось загрузить скриншот',
        color: 'red',
      });
      setScreenshotFile(null);
    } finally {
      setUploadingScreenshot(false);
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
          screenshot_url: values.screenshot_url || undefined,
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

              <ConsoleLabel path="C:\Report\competition" label="Соревнование">
                <Select
                  placeholder="Выберите завершенное соревнование"
                  data={competitionOptions}
                  size="md"
                  classNames={{ input: 'glass-input' }}
                  {...form.getInputProps('registration_id')}
                  onChange={handleCompetitionSelect}
                  required
                  searchable
                />
              </ConsoleLabel>

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

              <ConsoleLabel path="C:\Report\result" label="Результат">
                <Select
                  placeholder="Выберите результат"
                  data={RESULT_OPTIONS}
                  size="md"
                  classNames={{ input: 'glass-input' }}
                  {...form.getInputProps('result')}
                  required
                />
              </ConsoleLabel>

              <Text fw={700} size="lg" c="white" mt="md">Проектные материалы</Text>

              <ConsoleInput
                label="Ссылка на GitHub"
                consolePath="C:\Report\github"
                placeholder="https://github.com/username/project"
                size="md"
                {...form.getInputProps('git_link')}
                required
              />

              <ConsoleInput
                label="Ссылка на развернутый проект (опционально)"
                consolePath="C:\Report\project_url"
                placeholder="https://myproject.com"
                size="md"
                {...form.getInputProps('project_url')}
              />

              {/* Drag & Drop для презентации */}
              <ConsoleLabel path="C:\Report\presentation" label="Презентация (PDF или PowerPoint)">
                <Dropzone
                  onDrop={handlePresentationDrop}
                  onReject={() => {
                    notifications.show({
                      title: 'Ошибка',
                      message: 'Допустимые форматы: PDF, PPT, PPTX',
                      color: 'red',
                    });
                  }}
                  maxSize={50 * 1024 * 1024}
                  accept={[MIME_TYPES.pdf, 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation']}
                  loading={uploadingPresentation}
                  style={{
                    background: 'rgba(0, 217, 255, 0.05)',
                    border: '2px dashed var(--vtb-cyan)',
                    borderRadius: 8,
                  }}
                >
                  <Group justify="center" gap="xl" mih={100} style={{ pointerEvents: 'none' }}>
                    <Dropzone.Accept>
                      <IconUpload
                        style={{ width: rem(52), height: rem(52), color: 'var(--vtb-cyan)' }}
                        stroke={1.5}
                      />
                    </Dropzone.Accept>
                    <Dropzone.Reject>
                      <IconX
                        style={{ width: rem(52), height: rem(52), color: 'var(--mantine-color-red-6)' }}
                        stroke={1.5}
                      />
                    </Dropzone.Reject>
                    <Dropzone.Idle>
                      <IconFileText
                        style={{ width: rem(52), height: rem(52), color: 'var(--vtb-cyan)' }}
                        stroke={1.5}
                      />
                    </Dropzone.Idle>

                    <div>
                      <Text size="lg" c="white" inline>
                        {presentationFile ? presentationFile.name : 'Перетащите файл сюда или нажмите для выбора'}
                      </Text>
                      <Text size="sm" c="dimmed" inline mt={7}>
                        PDF, PPT или PPTX (до 50 МБ)
                      </Text>
                      {form.values.presentation_url && (
                        <Text size="sm" c="teal" mt={4}>
                          ✓ Файл загружен
                        </Text>
                      )}
                    </div>
                  </Group>
                </Dropzone>
                {form.errors.presentation_url && (
                  <Text size="sm" c="red" mt={4}>{form.errors.presentation_url}</Text>
                )}
              </ConsoleLabel>

              {/* Drag & Drop для скриншота */}
              <ConsoleLabel path="C:\Report\screenshot" label="Скриншот результата (опционально)">
                <Dropzone
                  onDrop={handleScreenshotDrop}
                  onReject={() => {
                    notifications.show({
                      title: 'Ошибка',
                      message: 'Допустимые форматы: JPG, PNG, GIF, WebP',
                      color: 'red',
                    });
                  }}
                  maxSize={10 * 1024 * 1024}
                  accept={[MIME_TYPES.png, MIME_TYPES.jpeg, MIME_TYPES.gif, MIME_TYPES.webp]}
                  loading={uploadingScreenshot}
                  style={{
                    background: 'rgba(0, 217, 255, 0.05)',
                    border: '2px dashed var(--vtb-cyan)',
                    borderRadius: 8,
                  }}
                >
                  <Group justify="center" gap="xl" mih={100} style={{ pointerEvents: 'none' }}>
                    <Dropzone.Accept>
                      <IconUpload
                        style={{ width: rem(52), height: rem(52), color: 'var(--vtb-cyan)' }}
                        stroke={1.5}
                      />
                    </Dropzone.Accept>
                    <Dropzone.Reject>
                      <IconX
                        style={{ width: rem(52), height: rem(52), color: 'var(--mantine-color-red-6)' }}
                        stroke={1.5}
                      />
                    </Dropzone.Reject>
                    <Dropzone.Idle>
                      <IconPhoto
                        style={{ width: rem(52), height: rem(52), color: 'var(--vtb-cyan)' }}
                        stroke={1.5}
                      />
                    </Dropzone.Idle>

                    <div>
                      <Text size="lg" c="white" inline>
                        {screenshotFile ? screenshotFile.name : 'Перетащите скриншот сюда или нажмите для выбора'}
                      </Text>
                      <Text size="sm" c="dimmed" inline mt={7}>
                        JPG, PNG, GIF или WebP (до 10 МБ)
                      </Text>
                      {form.values.screenshot_url && (
                        <Text size="sm" c="teal" mt={4}>
                          ✓ Скриншот загружен
                        </Text>
                      )}
                    </div>
                  </Group>
                </Dropzone>
                {form.values.screenshot_url && (
                  <Image
                    src={form.values.screenshot_url}
                    alt="Preview"
                    maw={300}
                    mt="md"
                    radius="md"
                    style={{ border: '1px solid var(--vtb-cyan)' }}
                  />
                )}
              </ConsoleLabel>

              <ConsoleLabel path="C:\Report\summary" label="Описание участия">
                <Textarea
                  placeholder="Опишите, что вы делали в рамках соревнования, как проходило участие, какие задачи решали..."
                  minRows={6}
                  size="md"
                  classNames={{ input: 'glass-input' }}
                  {...form.getInputProps('brief_summary')}
                  required
                />
              </ConsoleLabel>

              <Text fw={700} size="lg" c="white" mt="md">Дополнительная информация (необязательно)</Text>

              <ConsoleLabel path="C:\Report\technologies" label="Использованные технологии">
                <Textarea
                  placeholder="React, Node.js, PostgreSQL, Docker..."
                  minRows={3}
                  size="md"
                  classNames={{ input: 'glass-input' }}
                  {...form.getInputProps('technologies_used')}
                />
              </ConsoleLabel>

              <ConsoleLabel path="C:\Report\contributions" label="Вклад участников">
                <Textarea
                  placeholder="Опишите, кто чем занимался в команде..."
                  minRows={4}
                  size="md"
                  classNames={{ input: 'glass-input' }}
                  {...form.getInputProps('individual_contributions')}
                />
              </ConsoleLabel>

              <ConsoleLabel path="C:\Report\evaluation" label="Оценка работы команды">
                <Textarea
                  placeholder="Как вы оцениваете работу команды в целом..."
                  minRows={3}
                  size="md"
                  classNames={{ input: 'glass-input' }}
                  {...form.getInputProps('team_evaluation')}
                />
              </ConsoleLabel>

              <ConsoleLabel path="C:\Report\problems" label="Проблемы и сложности">
                <Textarea
                  placeholder="С какими проблемами столкнулись, как их решали..."
                  minRows={3}
                  size="md"
                  classNames={{ input: 'glass-input' }}
                  {...form.getInputProps('problems_faced')}
                />
              </ConsoleLabel>

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
                  disabled={uploadingPresentation || uploadingScreenshot}
                >
                  Отправить отчет
                </VTBButton>
              </Group>
            </Stack>
          </form>
        </VTBCard>

        <Alert icon={<IconAlertCircle />} color="yellow" variant="light">
          <Text size="sm">
            <strong>Важно:</strong> Отчет может быть подан любым участником команды от её имени.
            Убедитесь, что все данные заполнены корректно перед отправкой.
          </Text>
        </Alert>
      </Stack>
    </Container>
  );
}
