import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store';
import { Modal, Text, Button, Stack } from '@mantine/core';
import { useState } from 'react';

/**
 * Проверка заполненности профиля
 * Блокирует доступ к функциям системы если профиль не заполнен
 */
export function ProfileCompletionCheck({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  const isProfileComplete = user && user.first_name && user.last_name;

  // Разрешенные маршруты без заполненного профиля
  const allowedRoutes = ['/profile', '/auth/login', '/auth/register', '/auth/recovery'];
  const isAllowedRoute = allowedRoutes.some(route => location.pathname.startsWith(route));

  useEffect(() => {
    if (user && !isProfileComplete && !isAllowedRoute) {
      setShowModal(true);
    } else {
      setShowModal(false);
    }
  }, [user, location.pathname, isProfileComplete, isAllowedRoute]);

  const handleGoToProfile = () => {
    setShowModal(false);
    navigate('/profile');
  };

  return (
    <>
      {children}
      <Modal
        opened={showModal}
        onClose={() => {}}
        closeOnClickOutside={false}
        closeOnEscape={false}
        withCloseButton={false}
        title="Заполните профиль"
        centered
        radius="lg"
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
      >
        <Stack gap="md">
          <Text>
            Для использования функций системы необходимо заполнить обязательную информацию в профиле:
          </Text>
          <ul>
            <li>Имя</li>
            <li>Фамилия</li>
          </ul>
          <Button
            onClick={handleGoToProfile}
            fullWidth
            variant="gradient"
            gradient={{ from: 'cyan', to: 'blue' }}
            size="md"
            radius="md"
          >
            Перейти к профилю
          </Button>
        </Stack>
      </Modal>
    </>
  );
}
