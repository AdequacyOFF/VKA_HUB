import { useState, useEffect } from 'react';  // ✅ Добавляем useEffect
import {
  Container, Title, Stack, Table, Badge, Group, ActionIcon,
  Text, Modal, PasswordInput, Button, LoadingOverlay, Alert, TextInput
} from '@mantine/core';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  IconEdit, IconBan, IconCheck, IconX,
  IconDeviceFloppy, IconLock, IconShield, IconLockOpen
} from '@tabler/icons-react';
import { VTBCard } from '../../components/common/VTBCard';
import { VTBButton } from '../../components/common/VTBButton';
import { ConsoleInput } from '../../components/common/ConsoleInput';
import { notifications } from '@mantine/notifications';
import { usersApi, api, moderatorApi } from '../../api';  // ✅ Импортируем moderatorApi
import { User } from '../../types';

// ✅ Тип для информации о безопасности
interface SecurityInfo {
  id: number;
  login: string;
  control_question: string | null;
  has_control_answer: boolean;
  password_last_changed: string | null;
  security_setup_date: string | null;
  is_moderator: boolean;
  is_banned: boolean;
}

export function ModeratorUsers() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [modalOpened, setModalOpened] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [securityInfo, setSecurityInfo] = useState<SecurityInfo | null>(null);
  const [loadingSecurity, setLoadingSecurity] = useState(false);
  
  // Состояния для редактирования
  const [formData, setFormData] = useState({
    login: '',
    password: '',
    control_question: '',
    control_answer: '',
  });

  // Получение пользователей
  const { data: users, isLoading, error } = useQuery<User[]>({
    queryKey: ['moderator-users'],
    queryFn: async () => {
      try {
        const response = await usersApi.getUsers({ limit: 100 });
        return Array.isArray(response.items) ? response.items : [];
      } catch (error) {
        console.error('Failed to fetch users:', error);
        return [];
      }
    },
  });

  // ✅ Запрос безопасности пользователя при открытии модального окна
  useEffect(() => {
    const fetchSecurityInfo = async () => {
      if (selectedUser && modalOpened) {
        setLoadingSecurity(true);
        try {
          const data = await moderatorApi.getUserSecurityInfo(selectedUser.id);
          setSecurityInfo(data);
          
          // Обновляем formData с актуальными данными из securityInfo
          setFormData(prev => ({
            ...prev,
            login: data.login || selectedUser.login,
            control_question: data.control_question || selectedUser.control_question || ''
          }));
        } catch (error: any) {
          console.error('Failed to fetch security info:', error);
          notifications.show({
            title: 'Ошибка',
            message: error?.response?.data?.detail || 'Не удалось загрузить данные безопасности',
            color: 'red',
          });
          // Если не удалось, используем данные из selectedUser
          setSecurityInfo({
            id: selectedUser.id,
            login: selectedUser.login,
            control_question: selectedUser.control_question,
            has_control_answer: false,
            password_last_changed: null,
            security_setup_date: null,
            is_moderator: false,
            is_banned: selectedUser.is_banned || false
          });
        } finally {
          setLoadingSecurity(false);
        }
      }
    };

    fetchSecurityInfo();
  }, [selectedUser, modalOpened]);

  // Мутация для обновления логина
  const updateLoginMutation = useMutation({
    mutationFn: ({ userId, login }: { userId: number; login: string }) =>
      api.patch(`/api/moderator/users/${userId}/login`, { login }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderator-users'] });
      notifications.show({ 
        title: 'Успех', 
        message: 'Логин обновлен', 
        color: 'teal' 
      });
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Ошибка',
        message: error?.response?.data?.detail || 'Не удалось обновить логин',
        color: 'red',
      });
    },
  });

  // Мутация для сброса пароля
  const resetPasswordMutation = useMutation({
    mutationFn: ({ userId, newPassword }: { userId: number; newPassword: string }) =>
      api.post(`/api/moderator/users/${userId}/reset-password`, { new_password: newPassword }),
    onSuccess: () => {
      notifications.show({ 
        title: 'Успех', 
        message: 'Пароль сброшен', 
        color: 'teal' 
      });
      setFormData(prev => ({ ...prev, password: '' }));
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Ошибка',
        message: error?.response?.data?.detail || 'Не удалось сбросить пароль',
        color: 'red',
      });
    },
  });

  // Мутация для обновления контрольного вопроса
  const updateControlQuestionMutation = useMutation({
    mutationFn: ({ userId, question, answer }: { 
      userId: number; 
      question: string; 
      answer: string 
    }) =>
      api.put(`/api/moderator/users/${userId}/control-question`, { 
        control_question: question,
        control_answer: answer 
      }),
    onSuccess: () => {
      notifications.show({ 
        title: 'Успех', 
        message: 'Контрольный вопрос обновлен', 
        color: 'teal' 
      });
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Ошибка',
        message: error?.response?.data?.detail || 'Не удалось обновить контрольный вопрос',
        color: 'red',
      });
    },
  });

  // Мутации для блокировки/разблокировки
  const banMutation = useMutation({
    mutationFn: (userId: number) => api.post(`/api/moderator/users/${userId}/ban`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['moderator-users'] });
      await queryClient.refetchQueries({ queryKey: ['moderator-users'] });
      notifications.show({ title: 'Успех', message: 'Пользователь заблокирован', color: 'teal' });
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Ошибка',
        message: error?.response?.data?.detail || 'Не удалось заблокировать пользователя',
        color: 'red',
      });
    },
  });

  const unbanMutation = useMutation({
    mutationFn: (userId: number) => api.post(`/api/moderator/users/${userId}/unban`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['moderator-users'] });
      await queryClient.refetchQueries({ queryKey: ['moderator-users'] });
      notifications.show({ title: 'Успех', message: 'Пользователь разблокирован', color: 'teal' });
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Ошибка',
        message: error?.response?.data?.detail || 'Не удалось разблокировать пользователя',
        color: 'red',
      });
    },
  });

  // Обработчик открытия модального окна
  const handleEditClick = (user: User) => {
    setSelectedUser(user);
    setSecurityInfo(null); // Сбрасываем предыдущую информацию
    setFormData({
      login: user.login || '',
      password: '',
      control_question: user.control_question || '',
      control_answer: '', // Ответ всегда скрыт для безопасности
    });
    setEditMode(false);
    setModalOpened(true);
  };

  // Обработчик сохранения
  const handleSave = () => {
    if (!selectedUser || !securityInfo) return;

    const promises = [];

    // Обновляем логин, если изменился (сравниваем с securityInfo.login)
    if (formData.login !== securityInfo.login && formData.login.trim()) {
      promises.push(
        updateLoginMutation.mutateAsync({ 
          userId: selectedUser.id, 
          login: formData.login 
        })
      );
    }

    // Сбрасываем пароль, если введен новый
    if (formData.password.trim()) {
      promises.push(
        resetPasswordMutation.mutateAsync({ 
          userId: selectedUser.id, 
          newPassword: formData.password 
        })
      );
    }

    // Обновляем контрольный вопрос, если изменился вопрос ИЛИ введен ответ
    const hasQuestionChanged = formData.control_question !== securityInfo.control_question;
    const hasAnswerChanged = formData.control_answer.trim() !== '';
    
    if ((hasQuestionChanged || hasAnswerChanged) && formData.control_question.trim()) {
      // Если ответ не введен, но вопрос изменился - оставляем старый ответ
      const answerToSend = hasAnswerChanged ? formData.control_answer : '[СКРЫТ]';
      
      promises.push(
        updateControlQuestionMutation.mutateAsync({
          userId: selectedUser.id,
          question: formData.control_question,
          answer: answerToSend
        })
      );
    }

    if (promises.length === 0) {
      notifications.show({
        title: 'Информация',
        message: 'Нет изменений для сохранения',
        color: 'blue',
      });
      return;
    }

    Promise.all(promises)
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ['moderator-users'] });
        setEditMode(false);
        // Обновляем selectedUser чтобы показать новые данные
        setSelectedUser({
          ...selectedUser,
          login: formData.login || securityInfo.login,
          control_question: formData.control_question || securityInfo.control_question || '',
        });
        // Сбрасываем пароль и ответ после сохранения
        setFormData(prev => ({ ...prev, password: '', control_answer: '' }));
        // Перезагружаем security info
        moderatorApi.getUserSecurityInfo(selectedUser.id).then(setSecurityInfo);
      })
      .catch(() => {
        // Ошибки уже обработаны в мутациях
      });
  };

  // Безопасная фильтрация
  const safeUsers = Array.isArray(users) ? users : [];
  const filteredUsers = safeUsers.filter((user) =>
    (user.login || '').toLowerCase().includes(search.toLowerCase()) ||
    (user.first_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (user.last_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const isLoadingAny = 
    updateLoginMutation.isPending || 
    resetPasswordMutation.isPending || 
    updateControlQuestionMutation.isPending ||
    loadingSecurity; // ✅ Добавляем загрузку безопасности

  return (
    <Container size="xl" py="md">
      <Stack gap="xl">
        <div>
          <Title order={1} className="vtb-heading-hero" mb="xs">
            <span className="vtb-gradient-text">Управление пользователями</span>
          </Title>
          <Text c="white" size="lg">Просмотр и модерация пользователей платформы</Text>
        </div>

        <VTBCard variant="secondary">
          <ConsoleInput
            placeholder="Поиск по логину или имени..."
            consolePath="C:\Moderator\Users\search"
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            size="md"
          />
        </VTBCard>

        <VTBCard variant="primary">
          {isLoading ? (
            <Text c="white" ta="center">Загрузка...</Text>
          ) : error ? (
            <Text c="red" ta="center">Ошибка загрузки пользователей</Text>
          ) : filteredUsers.length === 0 ? (
            <Text c="white" ta="center">Пользователи не найдены</Text>
          ) : (
            <Table highlightOnHover styles={{
              th: { color: 'var(--vtb-cyan)', borderBottom: '1px solid rgba(0, 217, 255, 0.2)' },
              td: { color: '#ffffff', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' },
            }}>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>ID</Table.Th>
                  <Table.Th>Логин</Table.Th>
                  <Table.Th>Имя</Table.Th>
                  <Table.Th>Группа</Table.Th>
                  <Table.Th>Статус</Table.Th>
                  <Table.Th>Действия</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredUsers.map((user) => (
                  <Table.Tr key={user.id}>
                    <Table.Td>{user.id}</Table.Td>
                    <Table.Td>{user.login}</Table.Td>
                    <Table.Td>{user.first_name} {user.last_name}</Table.Td>
                    <Table.Td>{user.study_group || '—'}</Table.Td>
                    <Table.Td>
                      <Badge color={user.is_banned ? 'red' : 'green'} variant="light">
                        {user.is_banned ? 'blocked' : 'active'}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <ActionIcon
                          variant="light"
                          color="cyan"
                          onClick={() => handleEditClick(user)}
                          title="Редактировать"
                        >
                          <IconEdit size={18} />
                        </ActionIcon>
                        {user.is_banned ? (
                          <ActionIcon
                            variant="light"
                            color="green"
                            onClick={() => unbanMutation.mutate(user.id)}
                            title="Разблокировать"
                          >
                            <IconLockOpen size={18} />
                          </ActionIcon>
                        ) : (
                          <ActionIcon
                            variant="light"
                            color="red"
                            onClick={() => banMutation.mutate(user.id)}
                            title="Заблокировать"
                          >
                            <IconBan size={18} />
                          </ActionIcon>
                        )}
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </VTBCard>

        {/* Модальное окно редактирования */}
        <Modal
          opened={modalOpened}
          onClose={() => {
            if (!isLoadingAny) {
              setModalOpened(false);
              setEditMode(false);
              setSecurityInfo(null);
            }
          }}
          title={editMode ? "Редактирование пользователя" : "Информация о пользователе"}
          size="lg"
          closeOnClickOutside={!editMode && !isLoadingAny}
          closeOnEscape={!editMode && !isLoadingAny}
          withCloseButton={!editMode || !isLoadingAny}
        >
          <LoadingOverlay visible={isLoadingAny} overlayProps={{ blur: 2 }} />
          
          {selectedUser && (
            <Stack gap="md">
              {/* Заголовок с кнопками */}
              <Group justify="space-between" mb="md">
                <Text size="lg" fw={600}>
                  {selectedUser.first_name} {selectedUser.last_name}
                </Text>
                {!editMode ? (
                  <VTBButton
                    leftSection={<IconEdit size={16} />}
                    onClick={() => setEditMode(true)}
                    loading={loadingSecurity}
                    disabled={loadingSecurity}
                  >
                    Редактировать
                  </VTBButton>
                ) : (
                  <Group>
                    <Button
                      variant="light"
                      color="gray"
                      onClick={() => {
                        setEditMode(false);
                        // Возвращаем значения из securityInfo
                        if (securityInfo) {
                          setFormData({
                            login: securityInfo.login,
                            password: '',
                            control_question: securityInfo.control_question || '',
                            control_answer: ''
                          });
                        }
                      }}
                      disabled={isLoadingAny}
                    >
                      Отмена
                    </Button>
                    <VTBButton
                      leftSection={<IconDeviceFloppy size={16} />}
                      onClick={handleSave}
                      loading={isLoadingAny}
                      disabled={isLoadingAny}
                    >
                      Сохранить
                    </VTBButton>
                  </Group>
                )}
              </Group>

              {/* Неизменяемые поля */}
              <Alert color="blue" title="Основная информация" variant="light" icon={<IconShield size={16} />}>
                Поля ниже доступны только для просмотра
              </Alert>
              
              <Text><strong>ID:</strong> {selectedUser.id}</Text>
              <Text><strong>Имя:</strong> {selectedUser.first_name} {selectedUser.last_name}</Text>
              <Text><strong>Группа:</strong> {selectedUser.study_group || '—'}</Text>
              <Text><strong>Статус:</strong>
                <Badge color={selectedUser.is_banned ? 'red' : 'green'} ml="sm" size="sm">
                  {selectedUser.is_banned ? 'blocked' : 'active'}
                </Badge>
              </Text>

              {/* ✅ Блок безопасности */}
              <Alert color="cyan" title="Данные безопасности" variant="light" icon={<IconLock size={16} />}>
                {loadingSecurity ? (
                  <Text size="sm" c="dimmed">Загрузка данных безопасности...</Text>
                ) : securityInfo ? (
                  <Stack gap="xs" mt="xs">
                    <Group justify="space-between">
                      <Text size="sm"><strong>Логин:</strong></Text>
                      <Text size="sm" fw={500}>{securityInfo.login}</Text>
                    </Group>
                    <Group justify="space-between">
                      <Text size="sm"><strong>Контрольный вопрос:</strong></Text>
                      <Text size="sm" fs="italic">
                        {securityInfo.control_question || 'не задан'}
                      </Text>
                    </Group>
                    <Group justify="space-between">
                      <Text size="sm"><strong>Ответ на вопрос:</strong></Text>
                      <Badge color={securityInfo.has_control_answer ? 'green' : 'yellow'} size="sm">
                        {securityInfo.has_control_answer ? 'установлен' : 'не установлен'}
                      </Badge>
                    </Group>
                    <Group justify="space-between">
                      <Text size="sm"><strong>Пароль изменён:</strong></Text>
                      <Text size="sm">
                        {securityInfo.password_last_changed 
                          ? new Date(securityInfo.password_last_changed).toLocaleDateString('ru-RU')
                          : 'неизвестно'}
                      </Text>
                    </Group>
                    <Group justify="space-between">
                      <Text size="sm"><strong>Модератор:</strong></Text>
                      <Badge color={securityInfo.is_moderator ? 'blue' : 'gray'} size="sm">
                        {securityInfo.is_moderator ? 'да' : 'нет'}
                      </Badge>
                    </Group>
                  </Stack>
                ) : (
                  <Text size="sm" c="dimmed">Не удалось загрузить данные безопасности</Text>
                )}
              </Alert>

              {/* Поля для редактирования */}
              {editMode && securityInfo && (
                <>
                  <Alert color="yellow" title="Редактирование" variant="light" mt="md">
                    Можно изменить только поля ниже
                  </Alert>
                  
                  <TextInput
                    label="Логин"
                    value={formData.login}
                    onChange={(e) => setFormData({...formData, login: e.currentTarget.value})}
                    placeholder="Введите новый логин"
                    description={`Текущий логин: ${securityInfo.login}`}
                    required
                  />
                  
                  <PasswordInput
                    label="Новый пароль"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.currentTarget.value})}
                    placeholder="Введите новый пароль (оставьте пустым, если не нужно менять)"
                    description="Пароль будет изменен на указанный"
                  />
                  
                  <TextInput
                    label="Контрольный вопрос"
                    value={formData.control_question}
                    onChange={(e) => setFormData({...formData, control_question: e.currentTarget.value})}
                    placeholder="Введите новый контрольный вопрос"
                    description={`Текущий вопрос: ${securityInfo.control_question || 'не задан'}`}
                    required
                  />
                  
                  <PasswordInput
                    label="Ответ на контрольный вопрос"
                    value={formData.control_answer}
                    onChange={(e) => setFormData({...formData, control_answer: e.currentTarget.value})}
                    placeholder="Введите новый ответ (оставьте пустым, если не нужно менять)"
                    description={
                      securityInfo.has_control_answer 
                        ? "Текущий ответ установлен (скрыт)"
                        : "Ответ не установлен"
                    }
                  />
                  
                  <Alert color="blue" title="Важно" variant="light" size="sm">
                    • Изменение пароля и ответа на контрольный вопрос обязательно для сохранения изменений<br/>
                    • Если оставить поле пароля или ответа пустым, текущее значение останется неизменным
                  </Alert>
                </>
              )}
            </Stack>
          )}
        </Modal>
      </Stack>
    </Container>
  );
}