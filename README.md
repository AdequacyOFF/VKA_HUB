# VKA Hub

Веб-платформа для организации хакатонов и соревнований курсантов военной академии. Позволяет управлять командами, регистрациями на соревнования, сертификатами и генерировать рапорты.

## Структура проекта

```
VKA_HUB/
├── VKAHUB/                    # Основной проект
│   ├── backend/               # FastAPI бэкенд (Python)
│   │   ├── app/               # Код приложения
│   │   ├── alembic/           # Миграции БД
│   │   └── tests/             # Тесты
│   ├── frontend/              # React фронтенд (TypeScript)
│   │   └── src/               # Исходный код
│   ├── docker-compose.yml     # Конфигурация Docker
│   ├── Makefile               # Команды управления
│   └── dev.sh                 # Скрипт запуска dev-режима
├── PROJECT_DOCUMENTATION.md   # Подробная документация
└── Раопрт_хак_ВТБ_пример.docx # Шаблон рапорта
```

## Требования

- Docker Desktop (включает Docker Compose)
- Git

## Запуск

```bash
# Клонировать и перейти в папку
git clone <repository-url>
cd VKA_HUB/VKAHUB

# Режим разработки (с hot reload)
make dev

# Продакшн режим
make prod-up
```

После запуска:
- Фронтенд: http://localhost:3001 (dev) или http://localhost:3000 (prod)
- API: http://localhost:8000
- Документация API: http://localhost:8000/docs
- Adminer (БД): http://localhost:8080

## Основные команды

```bash
make dev          # Запуск в режиме разработки
make prod-up      # Запуск в продакшн режиме
make dev-down     # Остановка dev-режима
make prod-down    # Остановка продакшн-режима
make logs         # Просмотр логов
make restart      # Перезапуск контейнеров
make help         # Список всех команд
```

## Переменные окружения

Создаются автоматически из шаблонов при первом запуске.

**backend/.env**
```env
DATABASE_URL=postgresql+asyncpg://vkahub:vkahub_password@postgres:5432/vkahub
SECRET_KEY=your-secret-key-change-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
DEBUG=True
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

**frontend/.env**
```env
VITE_API_URL=http://localhost:8000
```

## База данных

```bash
# Применить миграции
docker compose exec backend alembic upgrade head

# Проверить статус миграций
docker compose exec backend alembic current

# PostgreSQL консоль
docker compose exec postgres psql -U vkahub

# Или через Adminer: http://localhost:8080
# Server: postgres | User: vkahub | Password: vkahub_password
```

## Частые проблемы

**Docker не запускается** — убедитесь, что Docker Desktop запущен.

**Порт занят** — найдите процесс `lsof -i :8000` и завершите его, или остановите контейнеры `docker compose down`.

**Изменения не отображаются** — в dev-режиме hot reload не работает автоматически. Попробуйте Ctrl+Shift+R в браузере или `docker compose restart frontend`.

**Ошибки базы данных** — перезапустите БД `docker compose restart postgres` и примените миграции.

## Стек технологий

- **Backend:** FastAPI, SQLAlchemy 2.0, PostgreSQL, Alembic, JWT
- **Frontend:** React 18, TypeScript, Vite, Mantine UI, Zustand, React Query
- **Инфраструктура:** Docker, Docker Compose, Nginx

## Дополнительная документация

- `VKAHUB/RUNBOOK_RU.md` — подробное руководство по эксплуатации
- `PROJECT_DOCUMENTATION.md` — техническая документация архитектуры
- `VKAHUB/CLAUDE.md` — инструкции для разработки с Claude
