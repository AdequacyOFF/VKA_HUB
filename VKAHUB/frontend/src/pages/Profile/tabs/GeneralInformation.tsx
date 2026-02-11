import { useState, useEffect } from 'react';
import { Stack, Group, Title, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useQuery } from '@tanstack/react-query';
import { VTBCard } from '../../../components/common/VTBCard';
import { VTBButton } from '../../../components/common/VTBButton';
import { ConsoleInput } from '../../../components/common/ConsoleInput';
import { ConsoleSelect } from '../../../components/common/ConsoleSelect';
import { AvatarUploader } from '../../../components/common/AvatarUploader';
import { ConfirmModal } from '../../../components/common/ConfirmModal';
import { useAuthStore } from '../../../store/authStore';
import { usersApi, api } from '../../../api';
import { queryKeys } from '../../../api/queryKeys';

const militaryRanks = [
  'Рядовой',
  'Ефрейтор',
  'Младший сержант',
  'Сержант',
  'Старший сержант',
  'Старшина',
  'Лейтенант',
  'Старший лейтенант',
  'Капитан',
  'Майор',
  'Подполковник',
  'Полковник',
];

const positions = [
  'Курсант',
  'Командир отделения',
  'Командир группы',
  'Старшина курса',
  'Начальник кафедры',
  'Заместитель начальника кафедры',
  'Офицер кафедры',
];

// Positions that don't require a study group (officers/department staff)
const officerPositions = [
  'Начальник кафедры',
  'Заместитель начальника кафедры',
  'Офицер кафедры',
];

// Ranks above "Старшина" (chief petty officer) - officer ranks
const officerRanks = [
  'Лейтенант',
  'Старший лейтенант',
  'Капитан',
  'Майор',
  'Подполковник',
  'Полковник',
];

// Helper function to check if study group should be optional
const isStudyGroupOptional = (position: string, rank: string): boolean => {
  return officerPositions.includes(position) || officerRanks.includes(rank);
};

export function GeneralInformation() {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const [loading, setLoading] = useState(false);
  const [confirmModalOpened, setConfirmModalOpened] = useState(false);

  const { data: currentUser } = useQuery({
    queryKey: queryKeys.users.profile(),
    queryFn: async () => {
      const response = await api.get('/api/users/me');
      setUser(response.data);
      return response.data;
    },
    enabled: !!user?.id,
    refetchOnMount: true,
  });

  const form = useForm({
    initialValues: {
      lastName: currentUser?.last_name || user?.last_name || '',
      firstName: currentUser?.first_name || user?.first_name || '',
      middleName: currentUser?.middle_name || user?.middle_name || '',
      studyGroup: currentUser?.study_group || user?.study_group || '',
      rank: currentUser?.rank || '',          // пустое значение
      position: currentUser?.position || '',  // пустое значение
      controlQuestion: currentUser?.control_question || user?.control_question || '',
      controlAnswer: '',
    },
    validate: {
      lastName: (value) => (!value ? 'Обязательное поле' : null),
      firstName: (value) => (!value ? 'Обязательное поле' : null),
      middleName: (value) => (!value ? 'Обязательное поле' : null),
      studyGroup: (value, values) => {
        // Study group is optional for officers and department staff
        if (isStudyGroupOptional(values.position, values.rank)) {
          // If value exists, validate format
          if (value && /[^0-9/]/.test(value)) {
            return 'Допустимы только цифры и /';
          }
          return null;
        }
        // Required for cadets
        if (!value) return 'Обязательное поле';
        if (/[^0-9/]/.test(value)) return 'Допустимы только цифры и /';
        return null;
      },
      rank: (value) => (!value ? 'Обязательное поле' : null),
      position: (value) => (!value ? 'Обязательное поле' : null),
      // Контрольный вопрос необязательный
    },
  });

  useEffect(() => {
    if (currentUser) {
      form.setValues({
        lastName: currentUser.last_name || '',
        firstName: currentUser.first_name || '',
        middleName: currentUser.middle_name || '',
        studyGroup: currentUser.study_group || '',
        rank: currentUser.rank || '',
        position: currentUser.position || '',
        controlQuestion: currentUser.control_question || '',
        controlAnswer: '',
      });
    }
  }, [currentUser]);

  // Clear study group when officer position or rank is selected
  useEffect(() => {
    const { position, rank, studyGroup } = form.values;
    if (isStudyGroupOptional(position, rank) && studyGroup) {
      form.setFieldValue('studyGroup', '');
    }
  }, [form.values.position, form.values.rank]);

  const handleSubmit = async (values: typeof form.values) => {
    const validation = form.validate(); // подсветка красным незаполненных полей
    if (validation.hasErrors) return;

    try {
      setLoading(true);
      const updatedUser = await usersApi.updateProfile({
        last_name: values.lastName,
        first_name: values.firstName,
        middle_name: values.middleName,
        study_group: values.studyGroup,
        rank: values.rank,
        position: values.position,
      });

      setUser(updatedUser);
      notifications.show({ title: 'Успех', message: 'Профиль обновлен', color: 'teal' });
    } catch (error: any) {
      notifications.show({
        title: 'Ошибка',
        message: error?.response?.data?.detail || 'Не удалось обновить профиль',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleControlQuestionUpdate = async () => {
    if (!form.values.controlAnswer) {
      notifications.show({ title: 'Ошибка', message: 'Заполните ответ на контрольный вопрос', color: 'red' });
      return;
    }

    // Автоматическое добавление ?
    if (form.values.controlQuestion && !form.values.controlQuestion.trim().endsWith('?')) {
      form.setFieldValue('controlQuestion', form.values.controlQuestion.trim() + '?');
    }

    try {
      setLoading(true);
      await api.put('/api/users/profile/control-question', {
        control_question: form.values.controlQuestion,
        control_answer: form.values.controlAnswer,
      });
      notifications.show({ title: 'Успех', message: 'Контрольный вопрос обновлен', color: 'teal' });
      setConfirmModalOpened(false);
      form.setFieldValue('controlAnswer', '');
    } catch (error: any) {
      notifications.show({ title: 'Ошибка', message: error?.response?.data?.detail || 'Не удалось обновить контрольный вопрос', color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack gap="xl">
      <VTBCard variant="primary">
        <Title order={3} c="white" mb="xl">Общая информация</Title>

        <Group align="flex-start" gap="xl">
          <AvatarUploader
            currentAvatar={user?.avatar_url || user?.avatar}
            onUpload={async (file) => {
              const formData = new FormData();
              formData.append('avatar', file);
              const response = await api.put('/api/users/profile/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
              setUser(response.data);
              notifications.show({ title: 'Успех', message: 'Аватар обновлен', color: 'teal' });
            }}
            onRemove={async () => {
              await api.delete('/api/users/profile/avatar');
              setUser({ ...user!, avatar: null, avatar_url: null });
              notifications.show({ title: 'Успех', message: 'Аватар удален', color: 'teal' });
            }}
            size={140}
          />

          <form onSubmit={form.onSubmit(handleSubmit)} style={{ flex: 1 }}>
            <Stack gap="md">
              <Group grow>
                <ConsoleInput label="Фамилия" placeholder="Иванов" consolePath="C:\Profile\lastname" {...form.getInputProps('lastName')} />
                <ConsoleInput label="Имя" placeholder="Иван" consolePath="C:\Profile\firstname" {...form.getInputProps('firstName')} />
              </Group>

              <ConsoleInput label="Отчество" placeholder="Иванович" consolePath="C:\Profile\middlename" {...form.getInputProps('middleName')} />

              <Group grow>
                <ConsoleInput
                  label={isStudyGroupOptional(form.values.position, form.values.rank)
                    ? "Учебная группа (необязательно)"
                    : "Учебная группа"
                  }
                  placeholder={isStudyGroupOptional(form.values.position, form.values.rank)
                    ? "Не требуется для офицеров"
                    : "621/11"
                  }
                  consolePath="C:\Profile\group"
                  {...form.getInputProps('studyGroup', { withError: true })}
                  onChange={(event) => {
                    const value = event.currentTarget.value;
                    const filteredValue = value.replace(/[^0-9/]/g, '');
                    form.setFieldValue('studyGroup', filteredValue);
                  }}
                  disabled={isStudyGroupOptional(form.values.position, form.values.rank)}
                />

                <ConsoleSelect
                  label="Звание"
                  placeholder="Выберите звание"
                  consolePath="C:\Profile\rank"
                  data={militaryRanks}
                  {...form.getInputProps('rank')}
                  clearable={false}
                />
              </Group>

              <ConsoleSelect
                label="Должность"
                placeholder="Выберите должность"
                consolePath="C:\Profile\position"
                data={positions}
                {...form.getInputProps('position')}
                clearable={false}
              />

              <Group justify="flex-end" mt="md">
                <VTBButton type="submit" loading={loading}>Сохранить изменения</VTBButton>
              </Group>
            </Stack>
          </form>
        </Group>
      </VTBCard>

      <VTBCard variant="secondary">
        <Title order={4} c="white" mb="md">Контрольный вопрос</Title>
        <Text size="sm" c="dimmed" mb="lg">Используется для восстановления пароля</Text>

        <Stack gap="md">
          <ConsoleInput label="Контрольный вопрос" placeholder="Кличка первого питомца?" consolePath="C:\Profile\question" {...form.getInputProps('controlQuestion')} />

          <Group justify="flex-end">
            <VTBButton variant="secondary" onClick={() => setConfirmModalOpened(true)}>Изменить контрольный вопрос</VTBButton>
          </Group>
        </Stack>
      </VTBCard>

      <ConfirmModal
        opened={confirmModalOpened}
        onClose={() => setConfirmModalOpened(false)}
        onConfirm={handleControlQuestionUpdate}
        title="Изменение контрольного вопроса"
        message="Для подтверждения изменения введите ответ на новый контрольный вопрос"
        confirmText="Подтвердить"
        loading={loading}
      >
        <ConsoleInput label="Ответ на контрольный вопрос" placeholder="Введите ответ" type="password" consolePath="C:\Profile\answer" {...form.getInputProps('controlAnswer')} mt="md" />
      </ConfirmModal>
    </Stack>
  );
}
