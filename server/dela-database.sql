-- =============================================================================
-- Dela — полный SQL для PostgreSQL: таблицы + начальные собрания и темы.
--
-- Структура таблиц совпадает с server/schema.sql (её подхватывает приложение).
-- Этот файл удобен для ручного импорта в pgAdmin / psql.
--
-- Импорт:
--   psql -U postgres -d shareholder_voting -f server/dela-database.sql
-- Из папки server:
--   psql -U postgres -d shareholder_voting -f dela-database.sql
--
-- Примечание: блок с начальными данными (DO $$) только для настоящего PostgreSQL;
-- встроенный режим pg-mem в приложении по-прежнему заполняет собрания через seed.js.
-- =============================================================================

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user', -- 'user' | 'admin'
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shareholders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  full_name TEXT NOT NULL,
  share_count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS meetings (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMP WITHOUT TIME ZONE NOT NULL
);

CREATE TABLE IF NOT EXISTS topics (
  id SERIAL PRIMARY KEY,
  meeting_id INTEGER NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS votes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  choice TEXT NOT NULL, -- 'for' | 'against' | 'abstain'
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_votes_topic ON votes(topic_id);
CREATE INDEX IF NOT EXISTS idx_votes_user ON votes(user_id);

-- -----------------------------------------------------------------------------
-- Начальные данные: только если таблица meetings пуста (как seed.js)
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  n INT;
BEGIN
  SELECT COUNT(*)::INT INTO n FROM meetings;
  IF n > 0 THEN
    RETURN;
  END IF;

  INSERT INTO meetings (title, description, scheduled_at) VALUES
    (
      'Годовое общее собрание акционеров ПАО «ЭнергоИнвест»',
      'Утверждение годовой отчётности, распределение прибыли, утверждение дивидендной политики.',
      '2026-03-22 15:00:00'
    ),
    (
      'Внеочередное собрание по одобрению крупной сделки',
      'Рассмотрение вопроса об одобрении сделки по приобретению пакета акций дочерней компании.',
      '2026-03-26 15:30:00'
    ),
    (
      'Собрание по избранию членов совета директоров',
      'Формирование нового состава совета директоров и утверждение комитета по аудиту.',
      '2026-03-31 14:00:00'
    ),
    (
      'Собрание акционеров по изменению устава общества',
      'Внесение изменений в устав в части расширения видов деятельности и увеличения уставного капитала.',
      '2026-04-01 15:00:00'
    ),
    (
      'Стратегическая сессия акционеров и совета директоров',
      'Обсуждение трёхлетней стратегии развития, инвестиционной программы и ключевых рисков.',
      '2026-04-08 15:00:00'
    );

  INSERT INTO topics (meeting_id, title) VALUES
    (1, 'Утверждение годового отчёта и распределение чистой прибыли за отчётный год'),
    (1, 'Утверждение размера дивидендов и порядка их выплаты акционерам'),
    (2, 'Одобрение крупной сделки по приобретению контрольного пакета акций дочерней компании'),
    (3, 'Избрание членов совета директоров и утверждение состава комитета по аудиту'),
    (4, 'Внесение изменений в устав общества в части увеличения уставного капитала');
END $$;
