import { Modal, Stack, Text, Group } from '@mantine/core';
import { ReactNode } from 'react';
import { VTBButton } from './VTBButton';

export interface ConfirmModalProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  danger?: boolean;
  children?: ReactNode;
}

export function ConfirmModal({
  opened,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Подтвердить',
  cancelText = 'Отмена',
  loading = false,
  danger = false,
  children,
}: ConfirmModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Text fw={700} size="xl" c="white">
          {title}
        </Text>
      }
      centered
      size="md"
      classNames={{
        content: 'glass-modal',
        header: 'glass-header',
      }}
      styles={{
        content: {
          background: 'rgba(10, 31, 68, 0.95)',
          backdropFilter: 'blur(30px)',
          border: '1px solid rgba(0, 217, 255, 0.3)',
        },
        header: {
          background: 'transparent',
          borderBottom: '1px solid rgba(0, 217, 255, 0.2)',
        },
      }}
    >
      <Stack gap="xl">
        {message && (
          <Text size="md" c="white">
            {message}
          </Text>
        )}

        {children}

        <Group justify="flex-end" gap="md">
          <VTBButton variant="secondary" onClick={onClose} disabled={loading}>
            {cancelText}
          </VTBButton>

          <VTBButton
            variant="primary"
            onClick={onConfirm}
            loading={loading}
            style={
              danger
                ? {
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    color: '#ffffff',
                  }
                : undefined
            }
          >
            {confirmText}
          </VTBButton>
        </Group>
      </Stack>
    </Modal>
  );
}
