# VKAHUB - Платформа управления соревнованиями

Комплексная платформа для управления командами, соревнованиями, сертификатами и профилями пользователей с контролем доступа на основе ролей.

## Технологический стек

### Backend
- **FastAPI** - Современный Python веб-фреймворк
- **SQLAlchemy 2.0** - Асинхронная ORM
- **PostgreSQL** - Основная база данных
- **Alembic** - Миграции базы данных
- **Pydantic v2** - Валидация данных
- **JWT** - Аутентификация
- **python-docx** - Генерация отчетов

### Frontend
- **React 18** - Библиотека пользовательского интерфейса
- **TypeScript** - Типизация
- **Vite** - Инструмент сборки
- **Mantine UI** - Библиотека компонентов
- **Zustand** - Управление состоянием
- **React Query** - Управление серверным состоянием
- **React Router** - Маршрутизация
- **React Hook Form + Zod** - Валидация форм

### Инфраструктура
- **Docker & Docker Compose** - Контейнеризация
- **PostgreSQL 15** - База данных
- **Adminer** - UI для управления базой данных

## Возможности

- **Аутентификация**: JWT с access и refresh токенами, обязательная авторизация для доступа к системе
- **Контроль доступа на основе ролей**: Пользователь, Капитан, Модератор
- **Профили пользователей**: 7 вкладок (Общая информация, Сертификаты, Роли и навыки, История команд, Моя команда, Участие в соревнованиях, История активности)
- **Управление командами**: Создание команд, заявки на вступление, управление капитаном
- **Система соревнований**: Подача заявок на соревнования, управление участниками
- **Управление сертификатами**: Загрузка и управление сертификатами
- **Панель модератора**: Управление пользователями, командами, соревнованиями, модераторами
- **Генерация отчетов**: Создание .docx отчетов по соревнованиям
- **Загрузка файлов**: Аватары, изображения команд, изображения соревнований, сертификаты, отчеты
- **Журнал активности**: Автоматическое отслеживание действий пользователей
- **Интерфейс на русском языке**: Весь интерфейс, сообщения об ошибках и уведомления на русском

## Быстрый старт

### Требования
- Docker & Docker Compose
- Git

### Установка

1. Клонируйте репозиторий:
```bash
git clone <repository-url>
cd VKAHUB
```

2. Скопируйте шаблоны переменных окружения:
```bash
cp backend/.env.template backend/.env
cp frontend/.env.template frontend/.env
```

3. Обновите переменные окружения в `backend/.env` и `frontend/.env`

4. Запустите приложение:
```bash
docker-compose up -d
```

5. Выполните миграции:
```bash
docker-compose exec backend alembic upgrade head
```

### Доступ к приложению

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Документация**: http://localhost:8000/docs
- **Админка БД (Adminer)**: http://localhost:8080

### Первый вход

При первом запуске приложения вы увидите только страницы регистрации и входа. После регистрации вы получите доступ ко всем функциям системы. Для получения прав модератора обратитесь к администратору системы.

## Разработка

### Разработка Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # На Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Разработка Frontend

```bash
cd frontend
npm install
npm run dev
```

### Запуск тестов

```bash
# Тесты Backend
cd backend
pytest

# Тесты Frontend
cd frontend
npm test
```

## Структура проекта

```
VKAHUB/
├── backend/           # FastAPI бэкенд
│   ├── app/
│   │   ├── config/          # Конфигурация
│   │   ├── domain/          # Доменный слой (модели, сущности, репозитории)
│   │   ├── use_cases/       # Бизнес-логика
│   │   ├── infrastructure/  # Инфраструктура (БД, безопасность, хранилище)
│   │   └── presentation/    # API слой (роутеры, DTO)
│   ├── alembic/      # Миграции базы данных
│   ├── tests/        # Тесты
│   └── static/       # Статические файлы и загрузки
├── frontend/         # React фронтенд
│   └── src/
│       ├── api/           # API вызовы
│       ├── components/    # React компоненты
│       ├── pages/         # Компоненты страниц
│       ├── store/         # Zustand хранилища
│       ├── types/         # TypeScript типы
│       └── utils/         # Утилиты
└── docker-compose.yml
```

## Схема базы данных

- **users** - Учетные записи пользователей
- **roles** - Доступные роли
- **skills** - Доступные навыки
- **user_roles** - Связи пользователь-роль
- **user_skills** - Связи пользователь-навык
- **moderators** - Назначение модераторов
- **certificates** - Сертификаты пользователей
- **teams** - Команды
- **team_members** - Членство в командах
- **team_join_requests** - Заявки на вступление
- **competitions** - Соревнования
- **competition_registrations** - Заявки на соревнования
- **competition_team_members** - Участники соревнований
- **competition_reports** - Отчеты капитанов
- **moderator_reports** - Сгенерированные отчеты
- **logs** - Журнал активности

## API Endpoints

### Аутентификация
- `POST /api/auth/register` - Регистрация нового пользователя
- `POST /api/auth/login` - Вход в систему
- `POST /api/auth/refresh` - Обновление access токена
- `POST /api/auth/logout` - Выход из системы
- `POST /api/auth/recover` - Восстановление пароля

### Пользователи
- `GET /api/users` - Список пользователей
- `GET /api/users/{id}` - Детали пользователя
- `PUT /api/users/{id}/profile` - Обновление профиля
- `PUT /api/users/{id}/roles-skills` - Обновление ролей и навыков

### Команды
- `GET /api/teams` - Список команд
- `POST /api/teams` - Создание команды
- `GET /api/teams/{id}` - Детали команды
- `PUT /api/teams/{id}` - Обновление команды
- `DELETE /api/teams/{id}` - Удаление команды (модератор)
- `POST /api/teams/{id}/join` - Заявка на вступление
- `POST /api/teams/{id}/requests/{request_id}/approve` - Одобрение заявки

### Соревнования
- `GET /api/competitions` - Список соревнований
- `POST /api/competitions` - Создание соревнования (модератор)
- `GET /api/competitions/{id}` - Детали соревнования
- `PUT /api/competitions/{id}` - Обновление соревнования (модератор)
- `POST /api/competitions/{id}/apply` - Подача заявки на соревнование

### Сертификаты
- `GET /api/certificates` - Список сертификатов
- `POST /api/certificates` - Загрузка сертификата
- `PUT /api/certificates/{id}` - Обновление сертификата
- `DELETE /api/certificates/{id}` - Удаление сертификата

### Отчеты
- `POST /api/reports/captain` - Отправка отчета капитана
- `GET /api/reports` - Список отчетов

### Модератор
- `POST /api/moderator/assign` - Назначить модератора
- `POST /api/moderator/remove` - Удалить модератора
- `GET /api/moderator/list` - Список модераторов
- `POST /api/moderator/reports/generate` - Генерация .docx отчета

## Вклад в проект

1. Сделайте форк репозитория
2. Создайте ветку для новой функции
3. Зафиксируйте ваши изменения
4. Отправьте изменения в ветку
5. Создайте Pull Request

## Лицензия

MIT License

## Поддержка

По вопросам и проблемам создавайте issue на GitHub.
