import { useState } from 'react';
import { Container, Title, Stack, TextInput, Table, Badge, Group, ActionIcon, Text, Modal, LoadingOverlay } from '@mantine/core';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { IconSearch, IconUserMinus, IconUserPlus, IconShieldCheck } from '@tabler/icons-react';
import { VTBCard } from '../../components/common/VTBCard';
import { VTBButton } from '../../components/common/VTBButton';
import { notifications } from '@mantine/notifications';
import { moderatorApi } from '../../api';
import { getErrorMessage } from '../../utils/errorHandler';

export function ModeratorModerators() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [addModalOpened, setAddModalOpened] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  const { data: moderators, isLoading, error } = useQuery({
    queryKey: ['moderators-list'],
    queryFn: async () => {
      const response = await moderatorApi.getModerators();
      return response.items || [];
    },
  });

  const removeMutation = useMutation({
    mutationFn: (userId: number) => moderatorApi.removeModerator(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderators-list'] });
      notifications.show({ title: 'Успех', message: 'Модератор удалён', color: 'teal' });
    },
    onError: (error: unknown) => {
      notifications.show({
        title: 'Ошибка',
        message: getErrorMessage(error),
        color: 'red',
      });
    },
  });

  const addMutation = useMutation({
    mutationFn: (userId: number) => moderatorApi.assignModerator(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderators-list'] });
      notifications.show({ title: 'Успех', message: 'Модератор добавлен', color: 'teal' });
      setAddModalOpened(false);
      setSelectedUserId(null);
    },
    onError: (error: unknown) => {
      notifications.show({
        title: 'Ошибка',
        message: getErrorMessage(error),
        color: 'red',
      });
    },
  });

  const filteredModerators = moderators?.filter((mod: any) =>
    mod.login?.toLowerCase().includes(search.toLowerCase()) ||
    mod.first_name?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <Container size="xl" py="md">
      <Stack gap="xl">
        <Group justify="space-between">
          <div>
            <Title order={1} className="vtb-heading-hero" mb="xs">
              <span className="vtb-gradient-text">Управление модераторами</span>
            </Title>
            <Text c="dimmed" size="lg">Назначение и управление модераторами</Text>
          </div>
          <VTBButton leftSection={<IconUserPlus size={18} />} onClick={() => setAddModalOpened(true)}>
            Добавить модератора
          </VTBButton>
        </Group>

        <VTBCard variant="secondary">
          <TextInput
            placeholder="Поиск модераторов..."
            leftSection={<IconSearch size={18} />}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            size="md"
            classNames={{ input: 'glass-input' }}
          />
        </VTBCard>

        <VTBCard variant="primary" style={{ position: 'relative' }}>
          <LoadingOverlay visible={isLoading} overlayProps={{ blur: 2 }} />
          {error ? (
            <Text c="red" ta="center">Ошибка загрузки: {getErrorMessage(error)}</Text>
          ) : !moderators || moderators.length === 0 ? (
            <Text c="dimmed" ta="center">Нет модераторов</Text>
          ) : filteredModerators.length === 0 ? (
            <Text c="dimmed" ta="center">Нет результатов по запросу "{search}"</Text>
          ) : (
            <Table highlightOnHover styles={{
              th: { color: 'var(--vtb-cyan)', borderBottom: '1px solid rgba(0, 217, 255, 0.2)' },
              td: { color: '#ffffff', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' },
            }}>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>ID пользователя</Table.Th>
                  <Table.Th>Логин</Table.Th>
                  <Table.Th>Имя</Table.Th>
                  <Table.Th>Роль</Table.Th>
                  <Table.Th>Действия</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredModerators.map((mod: any) => (
                  <Table.Tr key={mod.id}>
                    <Table.Td>{mod.user_id}</Table.Td>
                    <Table.Td>{mod.login}</Table.Td>
                    <Table.Td>{mod.first_name} {mod.last_name}</Table.Td>
                    <Table.Td>
                      <Badge leftSection={<IconShieldCheck size={14} />} color="cyan" variant="light">
                        Модератор
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <ActionIcon
                        variant="light"
                        color="red"
                        onClick={() => removeMutation.mutate(mod.user_id)}
                        loading={removeMutation.isPending}
                        disabled={removeMutation.isPending}
                      >
                        <IconUserMinus size={18} />
                      </ActionIcon>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </VTBCard>

        <Modal opened={addModalOpened} onClose={() => setAddModalOpened(false)} title="Добавить модератора">
          <Stack gap="md">
            <Text size="sm" c="dimmed">Введите ID пользователя для назначения модератором</Text>
            <TextInput
              label="ID пользователя"
              type="number"
              value={selectedUserId || ''}
              onChange={(e) => setSelectedUserId(Number(e.currentTarget.value))}
            />
            <VTBButton onClick={() => selectedUserId && addMutation.mutate(selectedUserId)} loading={addMutation.isPending}>
              Назначить модератором
            </VTBButton>
          </Stack>
        </Modal>
      </Stack>
    </Container>
  );
}
