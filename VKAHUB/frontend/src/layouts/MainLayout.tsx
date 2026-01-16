import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { AppShell, Group, Button, Container, Text, Burger, Drawer, Stack, useMantineTheme, ActionIcon, Tooltip } from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { IconShieldCheck, IconMessageReport, IconArrowLeft } from '@tabler/icons-react';
import { useAuthStore } from '@/store';
import { UnreadResponsesModal } from '@/components/UnreadResponsesModal';
import { useNotificationPolling } from '@/hooks/useNotificationPolling';

export function MainLayout() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const [opened, { toggle, close }] = useDisclosure(false);
  const theme = useMantineTheme();
  const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.md})`);
  const navigate = useNavigate();
  const location = useLocation();

  // Enable notification polling for authenticated users
  useNotificationPolling();

  // Show back button on all pages except home
  const showBackButton = location.pathname !== '/';

  const navItems = (
    <>
      <Link to="/users" style={{ textDecoration: 'none' }} onClick={close}>
        <Button variant="subtle" radius={0} fullWidth={isMobile}>
          Пользователи
        </Button>
      </Link>
      <Link to="/teams" style={{ textDecoration: 'none' }} onClick={close}>
        <Button variant="subtle" radius={0} fullWidth={isMobile}>
          Команды
        </Button>
      </Link>
      <Link to="/competitions" style={{ textDecoration: 'none' }} onClick={close}>
        <Button variant="subtle" radius={0} fullWidth={isMobile}>
          Соревнования
        </Button>
      </Link>

      {isAuthenticated && (
        <Link to="/platform-complaints/create" style={{ textDecoration: 'none' }} onClick={close}>
          <Button
            variant="subtle"
            radius={0}
            leftSection={<IconMessageReport size={18} />}
            fullWidth={isMobile}
          >
            Обратная связь
          </Button>
        </Link>
      )}

      {user?.is_moderator && (
        <Link to="/moderator" style={{ textDecoration: 'none' }} onClick={close}>
          <Button
            variant="light"
            radius={0}
            leftSection={<IconShieldCheck size={18} />}
            style={{
              color: '#00d9ff',
              border: '1px solid rgba(0, 217, 255, 0.3)',
              background: 'rgba(0, 217, 255, 0.1)',
            }}
            fullWidth={isMobile}
          >
            Модератор
          </Button>
        </Link>
      )}
    </>
  );

  const authItems = (
    <>
      {isAuthenticated ? (
        <>
          <Link to="/profile" style={{ textDecoration: 'none' }} onClick={close}>
            <Button variant="light" radius={0} fullWidth={isMobile}>
              Профиль
            </Button>
          </Link>
          <Button
            onClick={() => {
              logout();
              close();
            }}
            variant="gradient"
            gradient={{ from: 'cyan', to: 'blue' }}
            radius={0}
            fullWidth={isMobile}
          >
            Выйти
          </Button>
        </>
      ) : (
        <Link to="/auth/login" style={{ textDecoration: 'none' }} onClick={close}>
          <Button
            variant="gradient"
            gradient={{ from: 'cyan', to: 'blue' }}
            radius={0}
            fullWidth={isMobile}
          >
            Войти
          </Button>
        </Link>
      )}
    </>
  );

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

            {/* Desktop Navigation */}
            {!isMobile && (
              <Group gap="xs">
                {navItems}
              </Group>
            )}
          </Group>

          {/* Desktop Auth Buttons */}
          {!isMobile ? (
            <Group gap="xs">
              {authItems}
            </Group>
          ) : (
            <Burger opened={opened} onClick={toggle} color="white" />
          )}
        </Group>
      </AppShell.Header>

      {/* Mobile Navigation Drawer */}
      <Drawer
        opened={opened}
        onClose={close}
        title="Навигация"
        padding="md"
        size="sm"
        position="right"
        styles={{
          header: {
            background: 'rgba(10, 31, 68, 0.95)',
            backdropFilter: 'blur(20px)',
          },
          body: {
            background: 'rgba(10, 31, 68, 0.95)',
            backdropFilter: 'blur(20px)',
          },
          title: {
            color: '#fff',
            fontWeight: 700,
          },
        }}
      >
        <Stack gap="md">
          {navItems}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', margin: '16px 0' }} />
          {authItems}
        </Stack>
      </Drawer>

      <AppShell.Main style={{ minHeight: '100vh' }}>
        <Container size="xl" py="xl">
          {showBackButton && (
            <Tooltip label="Назад" position="right">
              <ActionIcon
                variant="subtle"
                size="lg"
                radius="xl"
                onClick={() => navigate(-1)}
                mb="md"
                style={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#00d9ff';
                  e.currentTarget.style.background = 'rgba(0, 217, 255, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <IconArrowLeft size={24} />
              </ActionIcon>
            </Tooltip>
          )}
          <Outlet />
        </Container>
      </AppShell.Main>

      {/* Unread responses modal */}
      {isAuthenticated && <UnreadResponsesModal />}
    </AppShell>
  );
}