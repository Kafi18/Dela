-- Создание роли и базы данных для приложения
-- ВНИМАНИЕ: если у тебя уже есть пользователь/БД с такими именами, строки CREATE ROLE / CREATE DATABASE могут упасть с ошибкой

DO
$$
BEGIN
   IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'shareholder_app') THEN
      CREATE ROLE shareholder_app LOGIN PASSWORD 'StrongPass123';
   END IF;
END
$$;

DO
$$
BEGIN
   IF NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'shareholder_voting') THEN
      CREATE DATABASE shareholder_voting
        OWNER shareholder_app
        ENCODING 'UTF8';
   END IF;
END
$$;

GRANT ALL PRIVILEGES ON DATABASE shareholder_voting TO shareholder_app;

-- Подключение к созданной БД и создание структуры
\connect shareholder_voting;

\i dela-database.sql

