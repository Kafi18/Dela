# Shareholder Voting App

## Запуск в один клик после `git clone` (без PostgreSQL и без Docker)

1. Установите [Node.js LTS](https://nodejs.org).
2. Скачайте репозиторий и в корне проекта выполните **одно** из:
   - **Windows:** дважды нажмите **`START_PROJECT.bat`**
   - **Или в терминале:**
     ```bash
     npm install
     npm start
     ```
     (`npm start` сам создаст `server/.env`, если его ещё нет, и запустит фронт + бэкенд.)

3. Откройте **http://localhost:5173**  
4. Проверка API: **http://localhost:4000/api/health** → `{"status":"ok","embeddedDb":true}`

### Как это устроено

По умолчанию используется **встроенная база (pg-mem)** — это эмуляция PostgreSQL в памяти Node.js. **Отдельно ставить PostgreSQL не нужно.** Регистрация и вход работают сразу.

**Важно:** данные **сбрасываются при перезапуске** сервера (память). Для постоянного хранения используйте настоящий PostgreSQL (ниже).

---

## Постоянная база: Docker

```bash
npm install
npm run start:docker
```

Нужны Docker Desktop и интернет. В `.env` будет `DELA_EMBEDDED_DB=false` и параметры как в `docker-compose.yml` (пользователь `postgres`, пароль `postgres`).

---

## Постоянная база: локальный PostgreSQL (Windows)

```bash
npm install
npm run env:localpg -- ВАШ_ПАРОЛЬ_POSTGRES
npm run dev:all
```

Скрипт создаст базу `shareholder_voting` и запишет `server/.env` с `DELA_EMBEDDED_DB=false`.

---

## Полезные команды

| Команда | Назначение |
|--------|------------|
| `npm start` | Создать `server/.env` (если нет) + фронт + бэкенд |
| `npm run start:oneclick` | `npm install` + то же самое |
| `npm run env:embedded` | Только записать режим встроенной БД |
| `npm run env:embedded -- --force` | Перезаписать `server/.env` |
| `npm run env:docker` | `.env` под Docker Postgres |
| `npm run dev:all` | Только запуск (без смены `.env`) |

---

## Переменная `DELA_EMBEDDED_DB`

- **`true` или не указано вместе с нашим шаблоном** — встроенная БД (после `env:embedded` / `START_PROJECT.bat`).
- **`false`** — настоящий PostgreSQL; нужны `DB_*` в `server/.env`.

---

## Капча на формах входа/регистрации

Введите **`1234`**.

---

## Аккаунты и GitHub

Пользователи хранятся в базе, **не в репозитории**. На другом ПК после clone — новая (пустая) встроенная БД или ваша PostgreSQL.
