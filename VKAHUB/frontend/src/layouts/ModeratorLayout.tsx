import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { AppShell, Group, Text, Stack, NavLink, Burger } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconDashboard,
  IconUsers,
  IconUsersGroup,
  IconTrophy,
  IconFlag,
  IconMessageReport,
  IconShieldCheck,
  IconFileAnalytics,
  IconLogout,
  IconHome,
} from '@tabler/icons-react';
import { useAuthStore } from '../store/authStore';

const navItems = [
  { path: '/moderator', label: 'Панель управления', icon: IconDashboard },
  { path: '/moderator/users', label: 'Пользователи', icon: IconUsers },
  { path: '/moderator/teams', label: 'Команды', icon: IconUsersGroup },
  { path: '/moderator/competitions', label: 'Соревнования', icon: IconTrophy },
  { path: '/moderator/reports', label: 'Жалобы', icon: IconFlag },
  { path: '/moderator/platform-complaints', label: 'Обратная связь', icon: IconMessageReport },
  { path: '/moderator/moderators', label: 'Модераторы', icon: IconShieldCheck },
  { path: '/moderator/analytics', label: 'Аналитика', icon: IconFileAnalytics },
];

export function ModeratorLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
  const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true);

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  return (
    <AppShell
      header={{ height: 70 }}
      navbar={{
        width: 280,
        breakpoint: 'sm',
        collapsed: { mobile: !mobileOpened, desktop: !desktopOpened },
      }}
      padding="md"
      styles={{
        main: {
          background: 'linear-gradient(135deg, #0A1F44 0%, #1E4C8F 50%, #2563B8 100%)',
          minHeight: '100vh',
        },
        header: {
          background: 'rgba(10, 31, 68, 0.8)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(0, 217, 255, 0.2)',
        },
        navbar: {
          background: 'rgba(10, 31, 68, 0.8)',
          backdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(0, 217, 255, 0.2)',
        },
      }}
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger
              opened={mobileOpened}
              onClick={toggleMobile}
              hiddenFrom="sm"
              size="sm"
              color="var(--vtb-cyan)"
            />
            <Burger
              opened={desktopOpened}
              onClick={toggleDesktop}
              visibleFrom="sm"
              size="sm"
              color="var(--vtb-cyan)"
            />
            <Text
              size="xl"
              fw={700}
              className="vtb-gradient-text"
              style={{ letterSpacing: 1 }}
            >
              Панель модератора
            </Text>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Stack gap="xs">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              component={Link}
              to={item.path}
              label={item.label}
              leftSection={<item.icon size={20} />}
              active={location.pathname === item.path}
              styles={{
                root: {
                  borderRadius: 8,
                  color: '#ffffff',
                  '&[data-active]': {
                    background: 'linear-gradient(135deg, var(--vtb-cyan) 0%, var(--vtb-cyan-light) 100%)',
                    color: 'var(--vtb-blue-dark)',
                    fontWeight: 700,
                  },
                  '&:hover': {
                    background: 'rgba(0, 217, 255, 0.1)',
                  },
                },
                label: {
                  fontSize: 14,
                },
              }}
            />
          ))}
          <NavLink
            label="На главную"
            leftSection={<IconHome size={20} />}
            component={Link}  
            to='/'
            styles={{
              root: {
                borderRadius: 8,
                marginTop: 'auto',
                color: '#16a130ff',
                '&:hover': {
                  background: 'rgba(239, 68, 68, 0.1)',
                },
              },
              label: {
                fontSize: 14,
              },
            }}
          />
          <NavLink
            label="Выход"
            leftSection={<IconLogout size={20} />}
            onClick={handleLogout}
            styles={{
              root: {
                borderRadius: 8,
                marginTop: 'auto',
                color: '#ef4444',
                '&:hover': {
                  background: 'rgba(239, 68, 68, 0.1)',
                },
              },
              label: {
                fontSize: 14,
              },
            }}
          />
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
