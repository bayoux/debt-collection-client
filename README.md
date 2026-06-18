# Debt Collection Client

Веб-интерфейс системы управления дебиторской задолженностью. Построен на Next.js 16 App Router с Feature-Sliced Design архитектурой.

## Стек

| Слой | Технология |
| ---- | ---------- |
| Фреймворк | Next.js 16 (App Router, standalone output) |
| UI | shadcn/ui + Tailwind CSS v4 |
| Состояние сервера | TanStack Query v5 |
| Формы | react-hook-form + Zod |
| Иконки | Lucide React |
| Графики | Recharts |
| Архитектура | Feature-Sliced Design (FSD) |

## Быстрый старт с Docker

### 1. Настройте переменные окружения

```bash
cp .env.example .env
```

Отредактируйте `.env`, укажите URL вашего бэкенд API:

```env
NEXT_PUBLIC_API_URL=http://your-backend-host/api/v1
```

> **Важно:** `NEXT_PUBLIC_API_URL` встраивается на этапе сборки (`docker build`),
> а не в рантайме. При смене URL нужно пересобрать образ.

### 2. Соберите и запустите

```bash
docker compose up -d --build
```

Приложение будет доступно на [http://localhost:3001](http://localhost:3001).

Переопределить порт:

```bash
PORT=8080 docker compose up -d --build
```

### Управление контейнером

```bash
# Статус
docker compose ps

# Логи
docker compose logs -f web

# Остановить
docker compose down

# Пересобрать после изменений
docker compose up -d --build
```

## Локальная разработка

```bash
# Установить зависимости (требуется pnpm)
pnpm install

# Запустить dev-сервер (порт 4000)
pnpm dev

# Сборка
pnpm build

# Запустить production-сборку локально
pnpm start
```

Приложение в dev-режиме доступно на [http://localhost:4000](http://localhost:4000).

## Переменные окружения

| Переменная | Описание | По умолчанию |
| ---------- | -------- | ------------ |
| `NEXT_PUBLIC_API_URL` | URL REST API бэкенда (без слеша в конце) | `http://localhost:8000/api/v1` |
| `PORT` | Внешний порт Docker-контейнера | `3001` |

## Структура проекта

```text
src/
├── app/              # Next.js App Router (маршруты)
│   ├── (auth)/       # Страницы авторизации
│   └── (dashboard)/  # Защищённые страницы
├── entities/         # Доменные сущности и API-клиенты
│   ├── debt-case/
│   ├── debtor/
│   ├── notification/
│   ├── ptp/
│   ├── report/
│   └── user/
├── features/         # Бизнес-фичи (формы, действия)
│   ├── auth/
│   ├── debt-cases/
│   ├── notifications/
│   ├── scheduler/
│   └── users/
├── views/            # Страницы (page-level компоненты)
│   ├── dashboard/
│   ├── debt-cases/
│   ├── notifications/
│   ├── reports/
│   └── scheduler/
├── widgets/          # Составные блоки (сайдбар, хедер)
│   ├── dashboard-summary/
│   ├── dashboard-charts/
│   ├── dashboard-welcome/
│   ├── header/
│   └── sidebar/
└── shared/           # Переиспользуемые утилиты и UI-компоненты
    ├── api/          # apiClient с авторефрешем токена
    └── components/ui/
```

## Основные разделы

| Раздел | URL | Описание |
| ------ | --- | -------- |
| Дашборд | `/dashboard` | KPI, графики активности, персональное приветствие |
| Дела | `/debt-cases` | Список дел с фильтрацией по DPD, агенту, статусу; CSV-экспорт |
| Должники | `/debtors` | Управление должниками, импорт CSV |
| Уведомления | `/notifications` | Шаблоны (CRUD), рассылка, журнал |
| Расписание | `/scheduler` | Запланированные рассылки с подтверждением отмены |
| Обещания | `/ptp` | Promise to Pay — контроль обещаний об оплате |
| Отчёты | `/reports` | Кампании и активность агентов, экспорт CSV |
| Пользователи | `/users` | Управление агентами и ролями |
| Интеграции | `/integrations` | Конфигурация каналов (SMS, WhatsApp, Telegram, Email) |

## API

Контракт REST API описан в [api-contract.yaml](./api-contract.yaml) (OpenAPI 3.0).

Аутентификация — JWT (access + refresh). Клиент автоматически обновляет access-токен при 401.
