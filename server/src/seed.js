import { pool } from './lib/db.js';

const MEETINGS = [
  {
    title: 'Годовое общее собрание акционеров ПАО «ЭнергоИнвест»',
    description: 'Утверждение годовой отчётности, распределение прибыли, утверждение дивидендной политики.',
    scheduled_at: '2026-03-22 15:00:00'
  },
  {
    title: 'Внеочередное собрание по одобрению крупной сделки',
    description: 'Рассмотрение вопроса об одобрении сделки по приобретению пакета акций дочерней компании.',
    scheduled_at: '2026-03-26 15:30:00'
  },
  {
    title: 'Собрание по избранию членов совета директоров',
    description: 'Формирование нового состава совета директоров и утверждение комитета по аудиту.',
    scheduled_at: '2026-03-31 14:00:00'
  },
  {
    title: 'Собрание акционеров по изменению устава общества',
    description: 'Внесение изменений в устав в части расширения видов деятельности и увеличения уставного капитала.',
    scheduled_at: '2026-04-01 15:00:00'
  },
  {
    title: 'Стратегическая сессия акционеров и совета директоров',
    description: 'Обсуждение трёхлетней стратегии развития, инвестиционной программы и ключевых рисков.',
    scheduled_at: '2026-04-08 15:00:00'
  }
];

const TOPICS = [
  { meeting_id: 1, title: 'Утверждение годового отчёта и распределение чистой прибыли за отчётный год' },
  { meeting_id: 1, title: 'Утверждение размера дивидендов и порядка их выплаты акционерам' },
  { meeting_id: 2, title: 'Одобрение крупной сделки по приобретению контрольного пакета акций дочерней компании' },
  { meeting_id: 3, title: 'Избрание членов совета директоров и утверждение состава комитета по аудиту' },
  { meeting_id: 4, title: 'Внесение изменений в устав общества в части увеличения уставного капитала' }
];

export async function seed() {
  const client = await pool.connect();
  try {
    const count = await client.query('SELECT COUNT(*)::int AS n FROM meetings');
    if (count.rows[0].n > 0) return;

    for (const m of MEETINGS) {
      await client.query(
        'INSERT INTO meetings (title, description, scheduled_at) VALUES ($1, $2, $3)',
        [m.title, m.description, m.scheduled_at]
      );
    }

    for (const t of TOPICS) {
      await client.query(
        'INSERT INTO topics (meeting_id, title) VALUES ($1, $2)',
        [t.meeting_id, t.title]
      );
    }

    console.log('Seed: добавлены собрания и темы голосований');
  } finally {
    client.release();
  }
}
