# 🚀 Гайд по запуску и перезапуску VKAHUB

## 📋 Быстрый старт

### Первый запуск проекта
```bash
docker-compose up --build -d
```

---

## 🔥 Режимы работы

### 1️⃣ Режим разработки (Dev Mode) - РЕКОМЕНДУЕТСЯ
**Горячая перезагрузка для фронтенда и бэкенда!**

```bash
# Запуск
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Остановка
docker-compose -f docker-compose.yml -f docker-compose.dev.yml down
```

**Доступ:**
- Frontend (Vite + HMR): http://localhost:3001 ⚡ Мгновенное обновление!
- Backend (Uvicorn): http://localhost:8000 ⚡ Авто-перезагрузка!
- Database Admin: http://localhost:8080

**Изменения применяются мгновенно - просто сохраните файл!**

---

### 2️⃣ Production режим
**Продакшн сборка с nginx**

```bash
# Запуск
docker-compose up -d

# С полной пересборкой
docker-compose up --build -d
```

**Доступ:**
- Frontend (Nginx): http://localhost:3000
- Backend: http://localhost:8000
- Database Admin: http://localhost:8080

---

## ⚡ Быстрые команды

### Перезапуск отдельных сервисов

```bash
# Только фронтенд (Dev режим)
docker-compose -f docker-compose.yml -f docker-compose.dev.yml restart frontend

# Только фронтенд (Production) - с пересборкой
docker-compose up -d --no-deps --build frontend

# Только бэкенд
docker-compose restart backend

# Только база данных
docker-compose restart postgres

# Всё сразу
docker-compose restart
```

### Пересборка с изменениями

```bash
# Фронтенд (Production) - БЫСТРО (15-20 сек)
docker-compose up -d --no-deps --build frontend

# Бэкенд (если изменились зависимости)
docker-compose up -d --no-deps --build backend

# Всё вместе
docker-compose up -d --build
```

---

## 📊 Мониторинг

### Просмотр логов

```bash
# Все логи в реальном времени
docker-compose logs -f

# Только фронтенд
docker-compose logs -f frontend

# Только бэкенд
docker-compose logs -f backend

# Последние 50 строк
docker-compose logs --tail=50 backend
```

### Статус контейнеров

```bash
# Список запущенных контейнеров
docker-compose ps

# Подробная информация
docker ps -a
```

---

## 🛠 Решение проблем

### Полная перезагрузка

```bash
# Остановить всё
docker-compose down

# Удалить контейнеры и volumes
docker-compose down -v

# Пересобрать и запустить
docker-compose up --build -d
```

### Очистка Docker

```bash
# Удалить неиспользуемые образы
docker image prune -a

# Удалить неиспользуемые volumes
docker volume prune

# Полная очистка системы
docker system prune -a
```

### Проблема с портами

```bash
# Проверить, что занимает порт
lsof -i :3000
lsof -i :8000

# Убить процесс
kill -9 <PID>
```

---

## 📝 Когда использовать какой режим

| Ситуация | Команда | Время |
|----------|---------|-------|
| Разработка | `docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d` | ⚡ Мгновенно |
| Изменил код фронтенда (Dev) | Ничего! Сохрани файл | ⚡ 0 сек |
| Изменил код бэкенда (Dev) | Ничего! Сохрани файл | ⚡ 0 сек |
| Изменил код фронтенда (Prod) | `docker-compose up -d --no-deps --build frontend` | ⚡ 15-20 сек |
| Изменил package.json | `docker-compose up -d --no-deps --build frontend` | ⚡⚡ 30-60 сек |
| Изменил requirements.txt | `docker-compose up -d --no-deps --build backend` | ⚡⚡ 30-60 сек |
| Всё сломалось | `docker-compose down && docker-compose up --build -d` | ⚡⚡⚡ 2-3 мин |

---

## 🎯 Рекомендации

1. **Для активной разработки** - используй **Dev Mode** (порт 3001)
2. **Для тестирования продакшн сборки** - используй **Production Mode** (порт 3000)
3. **Backend всегда имеет авто-перезагрузку** в обоих режимах
4. **Dev Mode** не требует пересборки при изменении кода!

---

## 🔧 Структура портов

| Сервис | Dev Mode | Production | 
|--------|----------|------------|
| Frontend | 3001 | 3000 |
| Backend | 8000 | 8000 |
| PostgreSQL | 5432 | 5432 |
| Adminer | 8080 | 8080 |

---

## 📚 Дополнительно

### Работа с базой данных

```bash
# Подключиться к PostgreSQL
docker exec -it vkahub_postgres psql -U vkahub -d vkahub

# Создать резервную копию
docker exec vkahub_postgres pg_dump -U vkahub vkahub > backup.sql

# Восстановить из резервной копии
docker exec -i vkahub_postgres psql -U vkahub -d vkahub < backup.sql
```

### Выполнить команды внутри контейнера

```bash
# Войти в контейнер бэкенда
docker exec -it vkahub_backend /bin/bash

# Выполнить миграции
docker exec vkahub_backend alembic upgrade head

# Создать миграцию
docker exec vkahub_backend alembic revision --autogenerate -m "описание"
```

---

**Готово! Теперь у вас есть всё для быстрой работы с проектом 🎉**
