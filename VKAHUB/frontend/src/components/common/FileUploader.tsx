import { useState } from 'react';
import { Group, Text, rem, Stack, Button, Paper, List, ActionIcon } from '@mantine/core';
import { Dropzone, FileWithPath, MIME_TYPES } from '@mantine/dropzone';
import { IconUpload, IconX, IconFile, IconTrash } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';

interface FileUploaderProps {
  onUpload: (files: File[]) => Promise<void>;
  accept?: string[];
  maxSize?: number;
  maxFiles?: number;
  multiple?: boolean;
  label?: string;
  description?: string;
  currentFiles?: { name: string; url: string }[];
  onRemoveFile?: (url: string) => Promise<void>;
}

export function FileUploader({
  onUpload,
  accept = [MIME_TYPES.pdf, MIME_TYPES.png, MIME_TYPES.jpeg],
  maxSize = 10 * 1024 * 1024,
  maxFiles = 5,
  multiple = true,
  label = 'Загрузить файлы',
  description = 'Перетащите файлы сюда или нажмите для выбора',
  currentFiles = [],
  onRemoveFile,
}: FileUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<FileWithPath[]>([]);

  const handleDrop = async (droppedFiles: FileWithPath[]) => {
    const validFiles = droppedFiles.filter((file) => file.size <= maxSize);

    if (validFiles.length !== droppedFiles.length) {
      notifications.show({
        title: 'Предупреждение',
        message: `Некоторые файлы превышают максимальный размер ${maxSize / 1024 / 1024} МБ`,
        color: 'yellow',
      });
    }

    if (!multiple && validFiles.length > 1) {
      notifications.show({
        title: 'Ошибка',
        message: 'Можно загрузить только один файл',
        color: 'red',
      });
      return;
    }

    if (currentFiles.length + validFiles.length > maxFiles) {
      notifications.show({
        title: 'Ошибка',
        message: `Максимальное количество файлов: ${maxFiles}`,
        color: 'red',
      });
      return;
    }

    setFiles(validFiles);

    try {
      setUploading(true);
      await onUpload(validFiles);
      notifications.show({
        title: 'Успех',
        message: 'Файлы успешно загружены',
        color: 'teal',
      });
      setFiles([]);
    } catch (error) {
      notifications.show({
        title: 'Ошибка',
        message: 'Не удалось загрузить файлы',
        color: 'red',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async (url: string) => {
    if (!onRemoveFile) return;

    try {
      await onRemoveFile(url);
      notifications.show({
        title: 'Успех',
        message: 'Файл удален',
        color: 'teal',
      });
    } catch (error) {
      notifications.show({
        title: 'Ошибка',
        message: 'Не удалось удалить файл',
        color: 'red',
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' Б';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' КБ';
    return (bytes / 1024 / 1024).toFixed(1) + ' МБ';
  };

  return (
    <Stack gap="md">
      <Dropzone
        onDrop={handleDrop}
        onReject={() => {
          notifications.show({
            title: 'Ошибка',
            message: 'Недопустимый формат файла',
            color: 'red',
          });
        }}
        maxSize={maxSize}
        accept={accept}
        multiple={multiple}
        loading={uploading}
        className="glass-card"
        style={{
          borderStyle: 'dashed',
          borderWidth: 2,
          borderColor: 'var(--vtb-cyan)',
        }}
      >
        <Group justify="center" gap="xl" style={{ minHeight: rem(120), pointerEvents: 'none' }}>
          <Dropzone.Accept>
            <IconUpload
              style={{ width: rem(52), height: rem(52), color: 'var(--vtb-cyan)' }}
              stroke={1.5}
            />
          </Dropzone.Accept>
          <Dropzone.Reject>
            <IconX
              style={{ width: rem(52), height: rem(52), color: 'var(--mantine-color-red-6)' }}
              stroke={1.5}
            />
          </Dropzone.Reject>
          <Dropzone.Idle>
            <IconFile
              style={{ width: rem(52), height: rem(52), color: 'var(--vtb-cyan)' }}
              stroke={1.5}
            />
          </Dropzone.Idle>

          <div>
            <Text size="xl" inline c="white" fw={600}>
              {label}
            </Text>
            <Text size="sm" c="dimmed" inline mt={7}>
              {description}
            </Text>
            <Text size="xs" c="dimmed" mt={7}>
              Макс. размер: {maxSize / 1024 / 1024} МБ | Макс. файлов: {maxFiles}
            </Text>
          </div>
        </Group>
      </Dropzone>

      {currentFiles.length > 0 && (
        <Paper p="md" className="glass-card">
          <Text size="sm" fw={600} mb="sm" c="white">
            Загруженные файлы ({currentFiles.length}):
          </Text>
          <List spacing="xs">
            {currentFiles.map((file, index) => (
              <List.Item key={index}>
                <Group justify="space-between">
                  <Group gap="xs">
                    <IconFile size={16} color="var(--vtb-cyan)" />
                    <Text size="sm" c="white">
                      {file.name}
                    </Text>
                  </Group>
                  {onRemoveFile && (
                    <ActionIcon
                      size="sm"
                      variant="subtle"
                      color="red"
                      onClick={() => handleRemove(file.url)}
                    >
                      <IconTrash size={14} />
                    </ActionIcon>
                  )}
                </Group>
              </List.Item>
            ))}
          </List>
        </Paper>
      )}

      {files.length > 0 && (
        <Paper p="md" className="glass-card">
          <Text size="sm" fw={600} mb="sm" c="white">
            Выбранные файлы для загрузки:
          </Text>
          <List spacing="xs">
            {files.map((file, index) => (
              <List.Item key={index}>
                <Group gap="xs">
                  <IconFile size={16} color="var(--vtb-cyan)" />
                  <Text size="sm" c="white">
                    {file.name} ({formatFileSize(file.size)})
                  </Text>
                </Group>
              </List.Item>
            ))}
          </List>
        </Paper>
      )}
    </Stack>
  );
}
