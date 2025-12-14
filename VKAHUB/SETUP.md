# VKA Hub - Руководство по установке

Это руководство поможет вам запустить VKA Hub с помощью Docker за несколько минут.

## Требования

- Установленные Docker и Docker Compose
- Доступные порты 3000, 5432, 8000 и 8080

## Быстрый старт (Автоматическая установка)

### 1. Клонирование и переход в директорию

```bash
cd /Users/gedeko/Desktop/VKA_Hub/VKAHUB
```

### 2. Создание файла окружения (Опционально)

Конфигурация по умолчанию работает без дополнительных настроек. Для пользовательских настроек:

```bash
cp .env.example .env
# Отредактируйте .env с предпочитаемыми значениями
```

### 3. Запуск всех сервисов

```bash
docker-compose up --build
```

Вот и всё! Система автоматически:
- ✅ Запустит базу данных PostgreSQL
- ✅ Дождётся готовности базы данных
- ✅ Выполнит миграции базы данных
- ✅ Создаст директории для загрузки файлов
- ✅ Запустит API сервер backend
- ✅ Соберёт и запустит frontend

## Точки доступа

После запуска используйте эти URL:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Документация API**: http://localhost:8000/docs
- **Админ панель БД (Adminer)**: http://localhost:8080

### Данные для входа в Adminer

- **Система**: PostgreSQL
- **Сервер**: postgres
- **Пользователь**: vkahub (или ваш POSTGRES_USER из .env)
- **Пароль**: vkahub_password (или ваш POSTGRES_PASSWORD из .env)
- **База данных**: vkahub (или ваш POSTGRES_DB из .env)

## Тестирование API

В проект включён комплексный тестовый скрипт:

```bash
./test_api.sh
```

Он протестирует:
- Проверки работоспособности
- Регистрацию пользователя (POST)
- Вход пользователя (POST)
- Обновление профиля (PUT)
- Создание сертификата (POST)
- Обновление сертификата (PUT)
- Обновление токена (POST)
- Все GET конечные точки

## Остановка сервисов

```bash
docker-compose down
```

Чтобы также удалить volumes (данные базы данных):

```bash
docker-compose down -v
```

## Распространённые проблемы и решения

### Порт уже используется

Если вы видите ошибки "port already in use", измените порты в `docker-compose.yml`:

```yaml
ports:
  - "3001:80"  # Измените 3000 на 3001 для frontend
  - "8001:8000"  # Измените 8000 на 8001 для backend
```

### Проблемы подключения к базе данных

Если backend не может подключиться к базе данных:

1. Убедитесь, что контейнер PostgreSQL работает:
   ```bash
   docker-compose ps
   ```

2. Проверьте логи:
   ```bash
   docker-compose logs postgres
   docker-compose logs backend
   ```

3. Перезапустите сервисы:
   ```bash
   docker-compose restart
   ```

### Frontend не может подключиться к Backend

Проверьте настройки CORS в `.env`:

```env
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

### Ошибки миграции

Если вы видите ошибки миграции Alembic:

```bash
# Сброс базы данных
docker-compose down -v
docker-compose up --build
```

## Режим разработки

### Горячая перезагрузка Backend

Backend настроен с флагом `--reload` для автоматической перезагрузки кода. Просто редактируйте файлы Python, и сервер перезапустится.

### Разработка Frontend

Для более быстрой разработки frontend вы можете запустить его вне Docker:

```bash
cd frontend
npm install
npm run dev
```

Затем откройте http://localhost:5173

## Просмотр логов

### Все сервисы
```bash
docker-compose logs -f
```

### Конкретный сервис
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Логи приложения Backend

Логи также записываются в файлы в backend:

```bash
docker-compose exec backend cat /app/logs/app.log
docker-compose exec backend cat /app/logs/error.log
```

## Обзор архитектуры

```
┌─────────────────┐
│    Frontend     │  React + TypeScript + Mantine
│  (Порт 3000)    │
└────────┬────────┘
         │ HTTP/REST
┌────────▼────────┐
│    Backend      │  FastAPI + Python
│  (Порт 8000)    │
└────────┬────────┘
         │ PostgreSQL
┌────────▼────────┐
│   PostgreSQL    │  База данных
│  (Порт 5432)    │
└─────────────────┘
```

## Краткий обзор API конечных точек

### Аутентификация
- POST `/api/auth/register` - Регистрация нового пользователя
- POST `/api/auth/login` - Вход в систему
- POST `/api/auth/refresh` - Обновление токена доступа
- POST `/api/auth/logout` - Выход из системы

### Пользователи
- GET `/api/users` - Список пользователей
- GET `/api/users/{id}` - Получить пользователя по ID
- PUT `/api/users/profile` - Обновить свой профиль
- PUT `/api/users/{id}/roles-skills` - Обновить роли/навыки

### Сертификаты
- GET `/api/certificates` - Список своих сертификатов
- POST `/api/certificates` - Создать сертификат
- PUT `/api/certificates/{id}` - Обновить сертификат
- DELETE `/api/certificates/{id}` - Удалить сертификат

### Команды
- GET `/api/teams` - Список команд
- POST `/api/teams` - Создать команду
- PUT `/api/teams/{id}` - Обновить команду

### Соревнования
- GET `/api/competitions` - Список соревнований
- POST `/api/competitions` - Создать соревнование (модератор)
- PUT `/api/competitions/{id}` - Обновить соревнование (модератор)

Полная документация доступна по адресу http://localhost:8000/docs

## Переменные окружения

### База данных
- `POSTGRES_USER` - Пользователь БД (по умолчанию: vkahub)
- `POSTGRES_PASSWORD` - Пароль БД (по умолчанию: vkahub_password)
- `POSTGRES_DB` - Имя БД (по умолчанию: vkahub)

### Backend
- `SECRET_KEY` - Секретный ключ JWT (измените в production!)
- `ACCESS_TOKEN_EXPIRE_MINUTES` - Время жизни токена доступа (по умолчанию: 15)
- `REFRESH_TOKEN_EXPIRE_DAYS` - Время жизни refresh токена (по умолчанию: 7)
- `DEBUG` - Режим отладки (по умолчанию: True)
- `CORS_ORIGINS` - Разрешённые CORS источники

## Развёртывание в production

Для production:

1. **Измените SECRET_KEY** в `.env` на сильное случайное значение
2. Установите `DEBUG=False`
3. Обновите `CORS_ORIGINS` на ваш production домен
4. Используйте сильный `POSTGRES_PASSWORD`
5. Настройте правильные SSL/TLS сертификаты
6. Используйте reverse proxy (nginx) перед backend
7. Настройте резервное копирование базы данных

## Поддержка

При возникновении проблем или вопросов:
- Сначала проверьте логи: `docker-compose logs -f`
- Просмотрите документацию API: http://localhost:8000/docs
- Проверьте этот файл для распространённых проблем

## Последние исправления (2025-12-07)

✅ Добавлен глобальный обработчик исключений для лучших сообщений об ошибках
✅ Исправлено управление сессиями базы данных
✅ Добавлена конечная точка `/api/auth/refresh`
✅ Улучшена валидация и обработка ошибок на всех POST/PUT конечных точках
✅ Добавлено комплексное логирование
✅ Docker установка полностью автоматизирована с миграциями базы данных
✅ Создан скрипт тестирования API
✅ Исправлено отображение участников команд
✅ Реализована функциональность подачи заявок в команду
✅ Исправлена проблема с кэшированием при смене аккаунта

Все конечные точки теперь возвращают правильные JSON ответы с понятными сообщениями об ошибках вместо общих ошибок 500!
