import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Title, TextInput, PasswordInput, Stack, Text, Container, Box, Anchor, List, Alert } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconUserPlus, IconUser, IconLock, IconAlertCircle } from '@tabler/icons-react';
import { VTBCard } from '../../components/common/VTBCard';
import { VTBButton } from '../../components/common/VTBButton';
import { authApi } from '../../api';
import { useAuthStore } from '../../store/authStore';

export function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: {
      login: '',
      password: '',
      passwordConfirm: '',
    },
    validate: {
      login: (value) => {
        if (!value) return 'Введите логин';
        if (value.length < 3) return 'Логин должен содержать минимум 3 символа';
        return null;
      },
      password: (value) => {
        if (!value) return 'Введите пароль';
        if (value.length < 6) return 'Пароль должен содержать минимум 6 символов';
        if (!/[a-z]/.test(value)) return 'Пароль должен содержать минимум 1 строчную букву';
        if (!/[A-Z]/.test(value)) return 'Пароль должен содержать минимум 1 заглавную букву';
        if (!/^[a-zA-Z0-9]+$/.test(value)) return 'Пароль не должен содержать специальные символы';
        return null;
      },
      passwordConfirm: (value, values) =>
        value !== values.password ? 'Пароли не совпадают' : null,
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    try {
      await authApi.register({
        login: values.login,
        password: values.password,
        password_confirm: values.passwordConfirm,
      });

      const loginResponse = await authApi.login({
        login: values.login,
        password: values.password,
      });

      const { setAuth } = useAuthStore.getState();
      setAuth(loginResponse.user, loginResponse.access_token, loginResponse.refresh_token);

      notifications.show({
        title: 'Успешно',
        message: 'Добро пожаловать! Пожалуйста, заполните информацию профиля.',
        color: 'teal',
      });

      navigate('/profile');
    } catch (error: any) {
      notifications.show({
        title: 'Ошибка',
        message: error.response?.data?.detail || 'Не удалось зарегистрироваться',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', paddingTop: 60, paddingBottom: 60 }}>
      <Container size="sm">
        <Stack align="center" gap="xl">
          <div style={{ textAlign: 'center' }}>
            <Title order={1} className="vtb-heading-hero" style={{ fontSize: '3rem' }}>
              <span className="vtb-gradient-text">Регистрация</span>
            </Title>
            <Text size="lg" c="dimmed" mt="md">
              Создайте аккаунт в VKA HUB
            </Text>
          </div>

          <VTBCard variant="primary" style={{ width: '100%', maxWidth: 500 }}>
            <form onSubmit={form.onSubmit(handleSubmit)}>
              <Stack gap="lg">
                <Alert
                  icon={<IconAlertCircle size={18} />}
                  title="Требования к паролю"
                  color="cyan"
                  variant="light"
                  styles={{
                    root: {
                      background: 'rgba(0, 217, 255, 0.1)',
                      border: '1px solid var(--vtb-cyan)',
                    },
                    title: { color: '#ffffff' },
                    message: { color: 'rgba(255, 255, 255, 0.8)' },
                  }}
                >
                  <List size="xs" spacing={4}>
                    <List.Item>Минимум 6 символов</List.Item>
                    <List.Item>Минимум 1 строчная буква (a-z)</List.Item>
                    <List.Item>Минимум 1 заглавная буква (A-Z)</List.Item>
                    <List.Item>Только буквы и цифры</List.Item>
                  </List>
                </Alert>

                <TextInput
                  label="Логин"
                  placeholder="Введите логин"
                  leftSection={<IconUser size={18} />}
                  size="md"
                  classNames={{ input: 'glass-input' }}
                  styles={{
                    label: { color: '#ffffff', fontWeight: 600, marginBottom: 8 },
                  }}
                  {...form.getInputProps('login')}
                />

                <PasswordInput
                  label="Пароль"
                  placeholder="Введите пароль"
                  leftSection={<IconLock size={18} />}
                  size="md"
                  classNames={{ input: 'glass-input' }}
                  styles={{
                    label: { color: '#ffffff', fontWeight: 600, marginBottom: 8 },
                  }}
                  {...form.getInputProps('password')}
                />

                <PasswordInput
                  label="Подтверждение пароля"
                  placeholder="Повторите пароль"
                  leftSection={<IconLock size={18} />}
                  size="md"
                  classNames={{ input: 'glass-input' }}
                  styles={{
                    label: { color: '#ffffff', fontWeight: 600, marginBottom: 8 },
                  }}
                  {...form.getInputProps('passwordConfirm')}
                />

                <VTBButton
                  type="submit"
                  size="lg"
                  fullWidth
                  loading={loading}
                  leftSection={<IconUserPlus size={20} />}
                >
                  Зарегистрироваться
                </VTBButton>

                <Text size="sm" ta="center" c="dimmed">
                  Уже есть аккаунт?{' '}
                  <Anchor
                    component={Link}
                    to="/auth/login"
                    c="var(--vtb-cyan)"
                    fw={600}
                    style={{ textDecoration: 'none' }}
                  >
                    Войти
                  </Anchor>
                </Text>
              </Stack>
            </form>
          </VTBCard>
        </Stack>
      </Container>
    </Box>
  );
}
