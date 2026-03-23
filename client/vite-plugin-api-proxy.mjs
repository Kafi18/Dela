import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const portFile = path.join(repoRoot, '.dev-api-port');

/** Прокси /api → бэкенд; порт читается из .dev-api-port (пишет сервер при старте). */
export function apiProxyDynamic() {
  return {
    name: 'api-proxy-dynamic-port',
    configureServer(viteServer) {
      viteServer.middlewares.use((req, res, next) => {
        const url = req.url || '';
        if (!url.startsWith('/api')) return next();

        let port = 4000;
        try {
          if (fs.existsSync(portFile)) {
            const n = parseInt(fs.readFileSync(portFile, 'utf8').trim(), 10);
            if (Number.isInteger(n) && n > 0 && n < 65536) port = n;
          }
        } catch {
          /* ignore */
        }

        const opts = {
          hostname: '127.0.0.1',
          port,
          path: url,
          method: req.method,
          headers: { ...req.headers, host: `127.0.0.1:${port}` }
        };

        const proxyReq = http.request(opts, (proxyRes) => {
          res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
          proxyRes.pipe(res);
        });
        proxyReq.on('error', () => {
          if (!res.headersSent) {
            res.statusCode = 502;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(
              JSON.stringify({
                message:
                  'Бэкенд недоступен. Запустите сервер (npm run dev:server) и дождитесь строки «Server listening».'
              })
            );
          }
        });
        req.pipe(proxyReq);
      });
    }
  };
}
