import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Center, Loader, Text, Stack } from '@mantine/core';
import { useAuthStore } from '@/store';

interface AuthCheckProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

/**
 * Компонент проверки аутентификации
 * Показывает загрузку во время проверки токена
 * Перенаправляет на login если пользователь не авторизован
 */
export function AuthCheck({ children, requireAuth = true }: AuthCheckProps) {
  const [isChecking, setIsChecking] = useState(true);
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    // Проверяем наличие токена
    const checkAuth = async () => {
      // Небольшая задержка для имитации проверки токена
      await new Promise(resolve => setTimeout(resolve, 500));
      setIsChecking(false);
    };

    checkAuth();
  }, []);

  // Показываем загрузку во время проверки
  if (isChecking) {
    return (
      <Center h="100vh">
        <Stack align="center" gap="md">
          <Loader size="lg" />
          <Text size="sm" c="dimmed">
            Проверка авторизации...
          </Text>
        </Stack>
      </Center>
    );
  }

  // Если требуется авторизация и пользователь не авторизован
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // Если пользователь авторизован и пытается попасть на страницы auth
  if (!requireAuth && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
