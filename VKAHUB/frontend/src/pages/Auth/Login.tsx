import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Title, TextInput, PasswordInput, Stack, Text, Container, Box, Anchor, Group } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconLogin, IconUser, IconLock } from '@tabler/icons-react';
import { VTBCard } from '../../components/common/VTBCard';
import { VTBButton } from '../../components/common/VTBButton';
import { authApi } from '../../api';
import { useAuthStore } from '../../store/authStore';
import { getErrorMessage } from '../../utils/errorHandler';
import { AxiosErrorResponse } from '../../types';

export function Login() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: {
      login: '',
      password: '',
    },
    validate: {
      login: (value) => (!value ? 'Введите логин' : null),
      password: (value) => (!value ? 'Введите пароль' : null),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    try {
      const response = await authApi.login(values);
      setAuth(response.user, response.access_token, response.refresh_token);
      notifications.show({
        title: 'Успешно',
        message: 'Добро пожаловать в VKA HUB!',
        color: 'teal',
      });
      navigate('/');
    } catch (error: unknown) {
      const axiosError = error as AxiosErrorResponse;
      let errorMessage = 'Не удалось войти в систему';

      if (axiosError.response?.status === 401) {
        errorMessage = 'Неверный логин или пароль';
      } else {
        errorMessage = getErrorMessage(error);
      }

      notifications.show({
        title: 'Ошибка входа',
        message: errorMessage,
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
              <span className="vtb-gradient-text">Вход</span>
            </Title>
            <Text size="lg" c="dimmed" mt="md">
              Войдите в свой аккаунт VKA HUB
            </Text>
          </div>

          <VTBCard variant="primary" style={{ width: '100%', maxWidth: 500 }}>
            <form onSubmit={form.onSubmit(handleSubmit)}>
              <Stack gap="lg">
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

                <Group justify="flex-end">
                  <Anchor
                    component={Link}
                    to="/auth/recovery"
                    size="sm"
                    c="var(--vtb-cyan)"
                    style={{ textDecoration: 'none' }}
                  >
                    Забыли пароль?
                  </Anchor>
                </Group>

                <VTBButton
                  type="submit"
                  size="lg"
                  fullWidth
                  loading={loading}
                  leftSection={<IconLogin size={20} />}
                >
                  Войти
                </VTBButton>

                <Text size="sm" ta="center" c="dimmed">
                  Нет аккаунта?{' '}
                  <Anchor
                    component={Link}
                    to="/auth/register"
                    c="var(--vtb-cyan)"
                    fw={600}
                    style={{ textDecoration: 'none' }}
                  >
                    Зарегистрироваться
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
