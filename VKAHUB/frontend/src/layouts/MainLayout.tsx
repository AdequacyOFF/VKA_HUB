import { Outlet, Link } from 'react-router-dom';
import { AppShell, Group, Button, Container, Text } from '@mantine/core';
import { IconShieldCheck } from '@tabler/icons-react';
import { useAuthStore } from '@/store';

export function MainLayout() {
  const { isAuthenticated, user, logout } = useAuthStore();

  return (
    <AppShell
      header={{ height: 70 }}
      padding="md"
      style={{
        background: 'transparent',
      }}
    >
      <AppShell.Header className="glass-header">
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
              <Text
                size="xl"
                fw={700}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                VKAHUB
              </Text>
            </Link>
            <Link to="/users">
              <Button variant="subtle" radius="lg">
                Пользователи
              </Button>
            </Link>
            <Link to="/teams">
              <Button variant="subtle" radius="lg">
                Команды
              </Button>
            </Link>
            <Link to="/competitions">
              <Button variant="subtle" radius="lg">
                Соревнования
              </Button>
            </Link>
            
            {/* Ссылка "Модератор" - показывается только модераторам */}
            {user?.is_moderator && (
              <Link to="/moderator">
                <Button
                  variant="light"
                  radius="lg"
                  leftSection={<IconShieldCheck size={18} />}
                  style={{
                    color: '#00d9ff',
                    border: '1px solid rgba(0, 217, 255, 0.3)',
                    background: 'rgba(0, 217, 255, 0.1)',
                  }}
                >
                  Модератор
                </Button>
              </Link>
            )}
          </Group>
          
          <Group>
            {isAuthenticated ? (
              <>
                <Link to="/profile">
                  <Button variant="light" radius="lg">
                    Профиль
                  </Button>
                </Link>
                <Button
                  onClick={logout}
                  variant="gradient"
                  gradient={{ from: 'cyan', to: 'blue' }}
                  radius="lg"
                >
                  Выйти
                </Button>
              </>
            ) : (
              <Link to="/auth/login">
                <Button
                  variant="gradient"
                  gradient={{ from: 'cyan', to: 'blue' }}
                  radius="lg"
                >
                  Войти
                </Button>
              </Link>
            )}
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Main style={{ minHeight: '100vh' }}>
        <Container size="xl" py="xl">
          <Outlet />
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}