import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Title, TextInput, PasswordInput, Stack, Text, Container, Box, Anchor, Stepper } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconUser, IconLock, IconKey, IconArrowRight } from '@tabler/icons-react';
import { VTBCard } from '../../components/common/VTBCard';
import { VTBButton } from '../../components/common/VTBButton';
import { authApi } from '../../api';

export function Recovery() {
  const navigate = useNavigate();
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);
  const [controlQuestion, setControlQuestion] = useState('');

  const form = useForm({
    initialValues: {
      login: '',
      answer: '',
      newPassword: '',
      confirmPassword: '',
    },
    validate: {
      login: (value) => (!value ? 'Введите логин' : null),
      answer: (value) => (active === 1 && !value ? 'Введите ответ' : null),
      newPassword: (value) => {
        if (active !== 2) return null;
        if (!value) return 'Введите новый пароль';
        if (value.length < 6) return 'Пароль должен содержать минимум 6 символов';
        if (!/[a-z]/.test(value)) return 'Пароль должен содержать минимум 1 строчную букву';
        if (!/[A-Z]/.test(value)) return 'Пароль должен содержать минимум 1 заглавную букву';
        return null;
      },
      confirmPassword: (value, values) =>
        active === 2 && value !== values.newPassword ? 'Пароли не совпадают' : null,
    },
  });

  const handleLoginStep = async () => {
    const validation = form.validateField('login');
    if (validation.hasError) return;

    setLoading(true);
    try {
      const response = await authApi.getControlQuestion(form.values.login);
      setControlQuestion(response.control_question);
      setActive(1);
    } catch (error) {
      notifications.show({
        title: 'Ошибка',
        message: 'Пользователь не найден',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionStep = () => {
    const validation = form.validateField('answer');
    if (validation.hasError) return;
    setActive(2);
  };

  const handlePasswordReset = async () => {
    const validation = form.validate();
    if (validation.hasErrors) return;

    setLoading(true);
    try {
      await authApi.recoverPassword({
        login: form.values.login,
        control_answer: form.values.answer,
        new_password: form.values.newPassword,
        new_password_confirm: form.values.confirmPassword,
      });

      notifications.show({
        title: 'Успешно',
        message: 'Пароль успешно изменен. Войдите с новым паролем.',
        color: 'teal',
      });

      navigate('/auth/login');
    } catch (error: any) {
      notifications.show({
        title: 'Ошибка',
        message: error.response?.data?.detail || 'Не удалось сбросить пароль',
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
              <span className="vtb-gradient-text">Восстановление</span>
            </Title>
            <Text size="lg" c="dimmed" mt="md">
              Восстановите доступ к аккаунту
            </Text>
          </div>

          <VTBCard variant="primary" style={{ width: '100%', maxWidth: 600 }}>
            <Stack gap="xl">
              <Stepper
                active={active}
                onStepClick={setActive}
                allowNextStepsSelect={false}
                color="cyan"
                styles={{
                  step: {
                    color: '#ffffff',
                  },
                  stepIcon: {
                    borderColor: 'var(--vtb-cyan)',
                    '&[data-completed]': {
                      background: 'var(--vtb-cyan)',
                      borderColor: 'var(--vtb-cyan)',
                    },
                    '&[data-progress]': {
                      background: 'var(--vtb-cyan)',
                      borderColor: 'var(--vtb-cyan)',
                    },
                  },
                  stepLabel: {
                    color: '#ffffff',
                  },
                  stepDescription: {
                    color: 'rgba(255, 255, 255, 0.6)',
                  },
                }}
              >
                <Stepper.Step label="Шаг 1" description="Введите логин">
                  <Stack gap="md" mt="lg">
                    <TextInput
                      label="Логин"
                      placeholder="Введите ваш логин"
                      leftSection={<IconUser size={18} />}
                      size="md"
                      classNames={{ input: 'glass-input' }}
                      styles={{
                        label: { color: '#ffffff', fontWeight: 600, marginBottom: 8 },
                      }}
                      {...form.getInputProps('login')}
                    />
                    <VTBButton
                      onClick={handleLoginStep}
                      loading={loading}
                      rightSection={<IconArrowRight size={18} />}
                      fullWidth
                    >
                      Далее
                    </VTBButton>
                  </Stack>
                </Stepper.Step>

                <Stepper.Step label="Шаг 2" description="Ответьте на вопрос">
                  <Stack gap="md" mt="lg">
                    <TextInput
                      label="Контрольный вопрос"
                      value={controlQuestion}
                      disabled
                      size="md"
                      classNames={{ input: 'glass-input' }}
                      styles={{
                        label: { color: '#ffffff', fontWeight: 600, marginBottom: 8 },
                      }}
                    />
                    <TextInput
                      label="Ваш ответ"
                      placeholder="Введите ответ на контрольный вопрос"
                      leftSection={<IconKey size={18} />}
                      size="md"
                      classNames={{ input: 'glass-input' }}
                      styles={{
                        label: { color: '#ffffff', fontWeight: 600, marginBottom: 8 },
                      }}
                      {...form.getInputProps('answer')}
                    />
                    <VTBButton
                      onClick={handleQuestionStep}
                      rightSection={<IconArrowRight size={18} />}
                      fullWidth
                    >
                      Далее
                    </VTBButton>
                  </Stack>
                </Stepper.Step>

                <Stepper.Step label="Шаг 3" description="Установите новый пароль">
                  <Stack gap="md" mt="lg">
                    <PasswordInput
                      label="Новый пароль"
                      placeholder="Введите новый пароль"
                      leftSection={<IconLock size={18} />}
                      size="md"
                      classNames={{ input: 'glass-input' }}
                      styles={{
                        label: { color: '#ffffff', fontWeight: 600, marginBottom: 8 },
                      }}
                      {...form.getInputProps('newPassword')}
                    />
                    <PasswordInput
                      label="Подтверждение пароля"
                      placeholder="Повторите новый пароль"
                      leftSection={<IconLock size={18} />}
                      size="md"
                      classNames={{ input: 'glass-input' }}
                      styles={{
                        label: { color: '#ffffff', fontWeight: 600, marginBottom: 8 },
                      }}
                      {...form.getInputProps('confirmPassword')}
                    />
                    <VTBButton onClick={handlePasswordReset} loading={loading} fullWidth>
                      Сбросить пароль
                    </VTBButton>
                  </Stack>
                </Stepper.Step>
              </Stepper>

              <Text size="sm" ta="center" c="dimmed" mt="md">
                Вспомнили пароль?{' '}
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
          </VTBCard>
        </Stack>
      </Container>
    </Box>
  );
}
