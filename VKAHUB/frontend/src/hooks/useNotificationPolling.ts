import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { notificationsApi, Notification } from '../api/notifications';
import { queryKeys } from '../api/queryKeys';
import { useAuthStore } from '../store/authStore';

const POLLING_INTERVAL = 30000; // 30 seconds

export function useNotificationPolling() {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const seenNotificationIds = useRef<Set<number>>(new Set());

  const { data } = useQuery({
    queryKey: queryKeys.notifications.list({ unread_only: true }),
    queryFn: () => notificationsApi.getNotifications({ unread_only: true, limit: 20 }),
    enabled: !!user,
    refetchInterval: POLLING_INTERVAL,
    refetchIntervalInBackground: false,
  });

  useEffect(() => {
    if (!data?.notifications) return;

    // Show toast for new unread notifications
    data.notifications.forEach((notification: Notification) => {
      if (!seenNotificationIds.current.has(notification.id)) {
        seenNotificationIds.current.add(notification.id);

        // Determine color based on notification type
        let color = 'blue';
        if (notification.type === 'registration_approved') {
          color = 'green';
        } else if (notification.type === 'registration_rejected' || notification.type === 'team_removed') {
          color = 'red';
        }

        // Show Mantine notification with OK button and close X
        notifications.show({
          id: `notification-${notification.id}`,
          title: notification.title,
          message: notification.message,
          color,
          autoClose: false,
          withCloseButton: true,
          position: 'bottom-right',
          onClose: async () => {
            // Mark as read when closed
            try {
              await notificationsApi.markAsRead(notification.id);
              queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
            } catch (error) {
              console.error('Failed to mark notification as read:', error);
            }
          },
        });
      }
    });
  }, [data, queryClient]);

  return {
    unreadCount: data?.unread_count ?? 0,
    notifications: data?.notifications ?? [],
  };
}
