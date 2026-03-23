/**
 * Email-адреса, которым всегда выставляется роль admin при старте сервера.
 * Пользователь должен уже существовать (зарегистрирован) в таблице users.
 */
const ADMIN_EMAILS = ['zg.koltsov@mail.ru'];

export async function promoteBuiltInAdmins(pool) {
  for (const raw of ADMIN_EMAILS) {
    const email = String(raw).trim().toLowerCase();
    if (!email) continue;
    await pool.query(`UPDATE users SET role = 'admin' WHERE lower(email) = lower($1)`, [email]);
  }
}
