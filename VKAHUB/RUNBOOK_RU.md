# VKA HUB - Руководство по эксплуатации

Практическое руководство по запуску и управлению платформой VKA HUB.

---

## 1. Что это за проект

VKA HUB — комплексная платформа для управления командами, соревнованиями и сертификатами с контролем доступа на основе ролей.

**Основные возможности:**
- JWT аутентификация с refresh токенами
- Управление пользователями, командами и соревнованиями
- Генерация отчётов в формате DOCX
- Загрузка файлов (аватары, сертификаты)
- Панель модератора
- Система обратной связи

---

## 2. Требования

**Обязательно:**
- Docker Desktop (включает Docker Compose)
- Доступные порты: 8000, 3000, 3001, 5432, 8080

**Проверка:**
```bash
docker --version          # Docker version 20.10+
docker-compose --version  # Docker Compose version 2.0+
```

---

## 3. Быстрый старт

### Первый запуск

```bash
# Клонировать репозиторий
git clone <repository-url>
cd VKAHUB

# Запустить в режиме разработки (рекомендуется)
make dev
```

**Готово!** Откройте в браузере:
- Frontend (DEV): http://localhost:3001
- Backend API: http://localhost:8000
- API документация: http://localhost:8000/docs
- Adminer (БД): http://localhost:8080

### Что происходит автоматически:

- ✅ Собирается frontend dev образ (при первом запуске)
- ✅ Создаются контейнеры Docker
- ✅ Настраивается база данных PostgreSQL
- ✅ Применяются миграции БД
- ✅ Запускается backend с автоперезагрузкой
- ✅ Запускается frontend с hot reload

---

## 4. Запуск в Docker

### Режим разработки (DEV)

**Рекомендуется для локальной разработки**

```bash
make dev
```

**Особенности:**
- Исходный код монтируется в контейнер (bind mount)
- Изменения в коде применяются **мгновенно** без пересборки
- Backend: автоперезагрузка при изменении .py файлов
- Frontend: hot reload при изменении .tsx/.ts файлов

**Порты:**
- Backend: 8000
- Frontend: **3001** (Vite dev server)
- База данных: 5432
- Adminer: 8080

---

### Режим продакшн (PROD)

**Используется для production или офлайн-развёртывания**

```bash
make prod-up
```

**Особенности:**
- Код встроен в образ Docker
- Быстрый перезапуск (10 секунд)
- Не требует интернета после первой сборки
- Стабильная production-конфигурация

**Порты:**
- Backend: 8000
- Frontend: **3000** (nginx production build)
- База данных: 5432
- Adminer: 8080

---

## 5. Остановка и рестарт

### Остановка

```bash
# DEV режим
make dev-down

# PROD режим
make prod-down

# Или универсальный способ
docker-compose down
```

### Рестарт

```bash
# Быстрый рестарт (PROD режим, 10 секунд)
make restart

# Рестарт отдельного сервиса
docker-compose restart backend
docker-compose restart frontend
docker-compose restart postgres
```

### Полная пересборка

```bash
# Если изменились зависимости (requirements.txt, package.json)
docker-compose down
docker-compose build --no-cache backend
make prod-up
```

---

## 6. Обновление и деплой

### Локальное обновление

```bash
git pull
make restart
```

### Офлайн-развёртывание (сервер без интернета)

**На машине С интернетом:**
```bash
# Собрать образы
make build-image

# Экспортировать в tar-файлы
make export-image
# Создаётся ./docker-images/vkahub-backend.tar и другие
```

**Перенос на сервер:**
- Скопировать папку `./docker-images/` на сервер (USB, SCP и т.д.)

**На сервере БЕЗ интернета:**
```bash
# Загрузить образы из tar-файлов
make import-image

# Запустить приложение
make prod-up

# Перезапуск (работает офлайн)
make restart
```

---

## 7. Логи

### Просмотр логов

```bash
# Все сервисы в реальном времени
make logs

# Или напрямую через docker-compose
docker-compose logs -f

# Только backend
docker-compose logs -f backend

# Только frontend
docker-compose logs -f frontend

# Только БД
docker-compose logs -f postgres

# Последние 50 строк
docker-compose logs --tail 50 backend
```

### Где хранятся логи

- **Backend:** stdout/stderr (смотреть через `docker-compose logs`)
- **Frontend:** stdout/stderr (смотреть через `docker-compose logs`)
- **PostgreSQL:** внутри контейнера `/var/log/postgresql/`

---

## 8. Проверка здоровья

### Быстрая проверка

```bash
# Статус контейнеров
docker-compose ps

# Ожидаемый результат:
# vkahub_backend    Up (healthy)
# vkahub_frontend   Up
# vkahub_postgres   Up (healthy)
# vkahub_adminer    Up
```

### Healthcheck URL

```bash
# Backend API
curl http://localhost:8000/
# Ответ: {"message":"VKAHUB API","version":"1.0.0","docs":"/docs"}

# Frontend
curl http://localhost:3001/  # DEV режим
curl http://localhost:3000/  # PROD режим
# Ответ: HTML-страница

# База данных
docker-compose exec postgres pg_isready -U vkahub
# Ответ: postgres:5432 - accepting connections
```

### Интерактивная проверка

1. Откройте http://localhost:8000/docs — Swagger UI должен загрузиться
2. Откройте http://localhost:3001 (DEV) или :3000 (PROD) — приложение должно загрузиться
3. Попробуйте зарегистрироваться/войти
4. Проверьте Adminer: http://localhost:8080 (логин: vkahub, пароль: vkahub_password)

---

## 9. Типовые проблемы и решения

### 1. "Cannot connect to Docker daemon"

**Причина:** Docker Desktop не запущен

**Решение:**
```bash
# macOS: Откройте Docker Desktop из Applications
# Linux: sudo systemctl start docker
# Windows: Запустите Docker Desktop из меню Пуск
```

---

### 2. "Port already in use" (порт занят)

**Причина:** Порт занят другим процессом

**Решение:**
```bash
# Найти процесс на порту
lsof -i :8000   # или :3000, :3001, :5432, :8080
kill -9 <PID>

# Или остановить старые контейнеры
docker-compose down
```

---

### 3. Ошибка "API не отвечает" или "Failed to fetch"

**Причина:** Используется неправильный порт или неверный URL API

**Решение:**
```bash
# В DEV режиме используйте порт 3001 (не 3000!)
# Откройте: http://localhost:3001

# Убедитесь, что backend запущен
curl http://localhost:8000/
# Должен ответить: {"message":"VKAHUB API"...}

# Проверьте переменную окружения в контейнере
docker exec vkahub_frontend_dev env | grep VITE_API_URL
# Должно быть: VITE_API_URL=http://localhost:8000

# Если неправильно - пересоздайте контейнер
make dev-down
make dev
```

**Правильные URL:**
- DEV режим: Frontend на порту **3001**, Backend на порту **8000**
- PROD режим: Frontend на порту **3000**, Backend на порту **8000**

---

### 4. Изменения в коде не применяются

**DEV режим:**
```bash
# Убедитесь, что запущен DEV режим
docker-compose logs backend | grep "DEV mode"
# Должно быть: "Starting application in DEV mode"

# Принудительная перезагрузка браузера
# Ctrl+Shift+R (Windows/Linux) или Cmd+Shift+R (macOS)

# Перезапуск сервиса
docker-compose restart backend
docker-compose restart frontend
```

**PROD режим:**
```bash
# В PROD режиме нужен рестарт
make restart

# Если изменились зависимости — нужна пересборка
docker-compose build backend
make restart
```

---

### 5. Ошибки базы данных

**Решение 1: Перезапуск БД**
```bash
docker-compose restart postgres

# Применить миграции заново
docker-compose exec backend alembic upgrade head
```

**Решение 2: Полный сброс (УДАЛЯЕТ ВСЕ ДАННЫЕ)**
```bash
docker-compose down -v
make prod-up
```

---

### 6. Frontend показывает пустую страницу

**Решение:**
```bash
# Проверить логи на ошибки
docker-compose logs frontend

# Убедиться, что используется правильный порт
# DEV: http://localhost:3001
# PROD: http://localhost:3000

# Перезапустить frontend
docker-compose restart frontend
```

---

### 7. "No config file 'alembic.ini' found"

**Причина:** Файл alembic.ini не скопирован в контейнер

**Решение:**
```bash
# Пересобрать backend
docker-compose build backend
make restart
```

---

### 8. Backend возвращает 500 ошибки

**Решение:**
```bash
# Посмотреть детальные логи
docker-compose logs -f backend

# Проверить статус миграций
docker-compose exec backend alembic current

# Применить миграции
docker-compose exec backend alembic upgrade head

# Перезапустить backend
docker-compose restart backend
```

---

### 9. Медленная работа Docker на macOS/Windows

**Решение:**
```bash
# Использовать DEV режим (bind mount быстрее на macOS/Windows)
make dev

# Увеличить ресурсы Docker Desktop:
# Settings → Resources → увеличить CPU/Memory
```

---

### 10. "Error: Cannot find module" в frontend

**Решение:**
```bash
# Переустановить зависимости
docker-compose exec frontend npm install

# Или пересобрать контейнер
docker-compose build frontend
make restart
```

---

### 11. Проблемы с загрузкой файлов

**Решение:**
```bash
# Проверить права на директорию uploads
docker-compose exec backend ls -la /app/static/uploads

# Пересоздать volume
docker-compose down -v
make prod-up
```

---

## 10. Полезные команды

### Управление проектом

```bash
make help          # Показать все доступные команды
make dev           # Запуск в DEV режиме
make dev-logs      # Логи DEV режима
make dev-down      # Остановить DEV режим
make prod-up       # Запуск в PROD режиме
make prod-down     # Остановить PROD режим
make restart       # Быстрый рестарт (10 сек)
make logs          # Просмотр логов
```

### База данных

```bash
# Применить миграции
docker-compose exec backend alembic upgrade head

# Статус миграций
docker-compose exec backend alembic current

# Создать новую миграцию
docker-compose exec backend alembic revision --autogenerate -m "описание"

# PostgreSQL shell
make shell-db
# или
docker-compose exec postgres psql -U vkahub -d vkahub

# Adminer (веб-интерфейс)
# http://localhost:8080
# Сервер: postgres
# Пользователь: vkahub
# Пароль: vkahub_password
# База данных: vkahub
```

### Контейнеры

```bash
# Shell в backend
make shell-backend
# или
docker-compose exec backend bash

# Shell в frontend
docker-compose exec frontend sh

# Статус всех контейнеров
docker-compose ps

# Перезапуск отдельного сервиса
docker-compose restart backend
docker-compose restart frontend
docker-compose restart postgres
```

### Тестирование

```bash
# Backend тесты
docker-compose exec backend pytest

# Frontend тесты
docker-compose exec frontend npm test

# Backend тесты с покрытием
docker-compose exec backend pytest --cov=app --cov-report=html
```

### Очистка

```bash
# Удалить контейнеры
docker-compose down

# Удалить контейнеры + volumes (БД будет удалена)
docker-compose down -v

# Полная очистка
make clean
```

### Офлайн-развёртывание

```bash
# Собрать образ (требуется интернет)
make build-image

# Экспорт образов в tar-файлы
make export-image

# Импорт образов из tar-файлов (офлайн)
make import-image
```

### Переменные окружения

```bash
# Backend (.env в корне проекта, если нужен)
DATABASE_URL=postgresql+asyncpg://vkahub:vkahub_password@postgres:5432/vkahub
SECRET_KEY=your-secret-key-change-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
DEBUG=True
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# Frontend (.env в корне проекта, если нужен)
VITE_API_URL=http://localhost:8000
```

---

## 11. Контакты и поддержка

**Документация:**
- Swagger API: http://localhost:8000/docs
- ReDoc API: http://localhost:8000/redoc
- Backend README: `backend/README.md`
- Frontend README: `frontend/README.md`

**Основные файлы:**
- `Makefile` — все команды управления
- `docker-compose.yml` — PROD конфигурация
- `docker-compose.dev.yml` — DEV конфигурация
- `backend/requirements.txt` — Python зависимости
- `frontend/package.json` — Node.js зависимости

**Вопросы и проблемы:**
Создайте issue на GitHub.

---

**Версия документа:** 1.0
**Дата обновления:** 2025-12-25
