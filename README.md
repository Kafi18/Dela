# Shareholder Voting App

## Самый простой запуск после `git clone` (Docker + автоматический `.env`)

Нужны **Node.js** и **Docker Desktop** (Windows).

1. Установите зависимости:
   ```bash
   npm install
   ```

2. Один раз подготовьте окружение и поднимите базу:
   ```bash
   npm run start:docker
   ```
   Это:
   - запишет `server/.env` с паролем `postgres` (как в `docker-compose.yml`);
   - запустит PostgreSQL в Docker;
   - дождётся порта 5432;
   - запустит frontend + backend.

3. Откройте `http://localhost:5173`.

Учётные данные БД в Docker: пользователь `postgres`, пароль **`postgres`**, база **`shareholder_voting`**.

### Windows: двойной клик

Запустите **`START_PROJECT.bat`** — он сделает то же самое (если Docker установлен).

---

## Без Docker (свой PostgreSQL)

1. `npm install`
2. Один раз укажите пароль пользователя `postgres` (тот, что вы задали при установке PostgreSQL на Windows):

   ```powershell
   npm run env:localpg -- ВАШ_ПАРОЛЬ
   ```

   Скрипт сам запишет `server/.env` и создаст базу `shareholder_voting`, если её ещё нет.

3. `npm run dev:all`

Альтернатива вручную: `npm run setup`, правка `server/.env`, затем `createdb shareholder_voting`.

---

## Полезные команды

| Команда | Назначение |
|--------|------------|
| `npm run env:docker` | Перезаписать `server/.env` под Docker Postgres |
| `npm run db:up` | `docker compose up -d` |
| `npm run db:down` | Остановить контейнер БД |
| `npm run db:wait` | Ждать, пока Postgres ответит на порту |

---

## Важно про «старые аккаунты»

Аккаунты и голоса хранятся **в PostgreSQL**, а не в GitHub. После скачивания репозитория на другой ПК вы получите **пустую** базу (или данные из своего Docker-тома). Чтобы перенести пользователей со старого компьютера — сделайте дамп на старом ПК (`pg_dump`) и восстановите на новом (`psql` / `pg_restore`).

---

## Проверка backend

- Health: `http://localhost:4000/api/health` → `{"status":"ok"}`

---

## Частые проблемы

- В `server/.env` **не оставляйте старый `DATABASE_URL`**, если заданы `DB_HOST` / `DB_PASSWORD`: иначе раньше пароль брался из URL и ломался вход (`28P01`). Сейчас приоритет у явных `DB_*`; строку `DATABASE_URL` лучше удалить для локального Docker.
- Уже установлен **PostgreSQL на Windows на порту 5432** → он занимает порт до запуска Docker. Остановите службу PostgreSQL в «Службы» или смените порт в `docker-compose.yml` и в `server/.env` (`DB_PORT`).
- `28P01` / ошибка `postgres` в логах → неверный `DB_PASSWORD` в `server/.env` или контейнер не запущен (`npm run db:up`).
- `vite is not recognized` → выполните `npm install`.
- Порт 5432 занят другим PostgreSQL → остановите локальный сервис или смените порт в `docker-compose.yml` и в `server/.env`.
