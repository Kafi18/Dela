/**
 * В dev Vite проксирует /api → реальный порт бэкенда (см. vite.config + .dev-api-port).
 * В prod задайте VITE_API_URL или проксируйте /api с того же домена.
 */
const fromEnv = import.meta.env.VITE_API_URL;

export const API_BASE =
  (fromEnv && String(fromEnv).replace(/\/$/, '')) ||
  (import.meta.env.DEV ? '/api' : `${typeof window !== 'undefined' ? window.location.origin : ''}/api`);
