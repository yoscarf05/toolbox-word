import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createApp } from './server/app';

async function startServer() {
  const app = createApp();
  const PORT = 3000;

  // Vite middleware for development vs static build for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(expressStaticMiddleware(distPath));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SERVER] Toolbox Word server running on http://0.0.0.0:${PORT}`);
  });
}

function expressStaticMiddleware(distPath: string) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const express = require('express');
  const router = express.Router();
  router.use(express.static(distPath));
  router.get('*', (req: any, res: any) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
  return router;
}

startServer().catch((err) => {
  console.error('[SERVER] Fatal server error:', err);
  process.exit(1);
});
