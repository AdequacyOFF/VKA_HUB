import { useState } from 'react';
import { Stack, Title, Text, Group } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { VTBCard } from '../../../components/common/VTBCard';
import { VTBButton } from '../../../components/common/VTBButton';
import { MultiSelectRoles } from '../../../components/common/MultiSelectRoles';
import { MultiSelectSkills } from '../../../components/common/MultiSelectSkills';
import { api } from '../../../api';
import { useAuthStore } from '../../../store/authStore';

export function RolesAndSkills() {
  const user = useAuthStore((state) => state.user);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['user-roles-skills', user?.id],
    queryFn: async () => {
      const response = await api.get(`/api/users/${user?.id}/roles-skills`);
      setSelectedRoles(response.data.roles || []);
      setSelectedSkills(response.data.skills || []);
      return response.data;
    },
    enabled: !!user?.id,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { roles: string[]; skills: string[] }) => {
      return api.put(`/api/users/${user?.id}/roles-skills`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-roles-skills', user?.id] });
      notifications.show({
        title: 'Успех',
        message: 'Роли и навыки обновлены',
        color: 'teal',
      });
    },
    onError: () => {
      notifications.show({
        title: 'Ошибка',
        message: 'Не удалось обновить роли и навыки',
        color: 'red',
      });
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      roles: selectedRoles,
      skills: selectedSkills,
    });
  };

  return (
    <Stack gap="xl">
      <Title order={3} c="white">
        Роли и навыки
      </Title>

      <VTBCard variant="primary">
        <Stack gap="lg">
          <div>
            <Title order={4} c="white" mb="xs">
              Роли
            </Title>
            <Text size="sm" c="dimmed" mb="md">
              Выберите ваши роли в командах и проектах
            </Text>
            <MultiSelectRoles
              value={selectedRoles}
              onChange={setSelectedRoles}
              label="Мои роли"
              description="Можно выбрать несколько ролей"
            />
          </div>

          <div>
            <Title order={4} c="white" mb="xs">
              Навыки
            </Title>
            <Text size="sm" c="dimmed" mb="md">
              Укажите технологии и инструменты, которыми вы владеете
            </Text>
            <MultiSelectSkills
              value={selectedSkills}
              onChange={setSelectedSkills}
              label="Мои навыки"
              description="Можно выбрать несколько навыков"
            />
          </div>

          <Group justify="flex-end" mt="md">
            <VTBButton
              onClick={handleSave}
              loading={updateMutation.isPending}
            >
              Сохранить изменения
            </VTBButton>
          </Group>
        </Stack>
      </VTBCard>

      <VTBCard variant="secondary">
        <Title order={4} c="white" mb="md">
          Информация
        </Title>
        <Text size="sm" c="dimmed">
          Указание ролей и навыков помогает другим участникам найти вас для совместной работы в командах.
          Чем подробнее вы заполните эту информацию, тем больше шансов получить приглашение в интересные проекты.
        </Text>
      </VTBCard>
    </Stack>
  );
}
