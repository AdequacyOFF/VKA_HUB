import { useState } from 'react';
import { Avatar, FileButton, Group, Stack, Text, ActionIcon } from '@mantine/core';
import { Dropzone, IMAGE_MIME_TYPE, FileWithPath } from '@mantine/dropzone';
import { IconCamera, IconX, IconUpload } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';

interface AvatarUploaderProps {
  currentAvatar?: string | null;
  onUpload: (file: File) => Promise<void>;
  onRemove?: () => Promise<void>;
  size?: number;
  editable?: boolean;
}

export function AvatarUploader({
  currentAvatar,
  onUpload,
  onRemove,
  size = 120,
  editable = true,
}: AvatarUploaderProps) {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const processFile = async (file: File) => {
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      notifications.show({
        title: 'Ошибка',
        message: 'Размер файла не должен превышать 5 МБ',
        color: 'red',
      });
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      notifications.show({
        title: 'Ошибка',
        message: 'Допустимые форматы: JPG, PNG, WEBP',
        color: 'red',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    try {
      setLoading(true);
      await onUpload(file);
      notifications.show({
        title: 'Успех',
        message: 'Аватар успешно обновлен',
        color: 'teal',
      });
    } catch (error) {
      notifications.show({
        title: 'Ошибка',
        message: 'Не удалось загрузить аватар',
        color: 'red',
      });
      setPreview(null);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (file: File | null) => {
    if (!file) return;
    await processFile(file);
  };

  const handleDrop = async (files: FileWithPath[]) => {
    if (files.length > 0) {
      await processFile(files[0]);
    }
  };

  const handleRemove = async () => {
    if (!onRemove) return;

    try {
      setLoading(true);
      await onRemove();
      setPreview(null);
      notifications.show({
        title: 'Успех',
        message: 'Аватар удален',
        color: 'teal',
      });
    } catch (error) {
      notifications.show({
        title: 'Ошибка',
        message: 'Не удалось удалить аватар',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const avatarSrc = preview || currentAvatar || undefined;

  if (!editable) {
    return (
      <Stack align="center" gap="md">
        <Avatar
          src={avatarSrc}
          size={size}
          radius="50%"
          className="vtb-avatar"
          style={{
            border: '4px solid var(--vtb-cyan)',
            boxShadow: '0 8px 32px rgba(0, 217, 255, 0.4)',
          }}
        />
      </Stack>
    );
  }

  return (
    <Stack align="center" gap="md">
      <div style={{ position: 'relative' }}>
        <Dropzone
          onDrop={handleDrop}
          accept={IMAGE_MIME_TYPE}
          maxSize={5 * 1024 * 1024}
          maxFiles={1}
          loading={loading}
          disabled={loading}
          style={{
            padding: 0,
            border: 'none',
            background: 'transparent',
            borderRadius: '50%',
            cursor: loading ? 'not-allowed' : 'pointer',
            width: size,
            height: size,
          }}
        >
          <Avatar
            src={avatarSrc}
            size={size}
            radius="50%"
            className="vtb-avatar"
            style={{
              border: '4px solid var(--vtb-cyan)',
              boxShadow: '0 8px 32px rgba(0, 217, 255, 0.4)',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
            }}
          />
        </Dropzone>

        <Group gap="xs" style={{ position: 'absolute', bottom: 0, right: 0 }}>
          <FileButton onChange={handleFileSelect} accept="image/png,image/jpeg,image/jpg,image/webp">
            {(props) => (
              <ActionIcon
                {...props}
                size="lg"
                radius="xl"
                variant="filled"
                color="cyan"
                loading={loading}
                style={{
                  background: 'linear-gradient(135deg, var(--vtb-cyan) 0%, var(--vtb-cyan-light) 100%)',
                  border: '3px solid var(--vtb-blue-dark)',
                  boxShadow: '0 4px 12px rgba(0, 217, 255, 0.3)',
                }}
              >
                <IconCamera size={18} />
              </ActionIcon>
            )}
          </FileButton>

          {(currentAvatar || preview) && onRemove && (
            <ActionIcon
              size="lg"
              radius="xl"
              variant="filled"
              color="red"
              onClick={handleRemove}
              loading={loading}
              style={{
                border: '3px solid var(--vtb-blue-dark)',
                boxShadow: '0 4px 12px rgba(255, 0, 0, 0.3)',
              }}
            >
              <IconX size={18} />
            </ActionIcon>
          )}
        </Group>
      </div>

      <Text size="sm" c="dimmed" ta="center">
        Нажмите или перетащите изображение на аватар
        <br />
        <Text size="xs" span c="dimmed">
          Макс. 5 МБ, форматы: JPG, PNG, WEBP
        </Text>
      </Text>
    </Stack>
  );
}
