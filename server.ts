import 'dotenv/config';
import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import { createServer as createViteServer } from 'vite';
import { authRouter } from './src/server/routes/authRoutes';
import { tenantRouter } from './src/server/routes/tenantRoutes';
import { leaseRouter } from './src/server/routes/leaseRoutes';
import { paymentRouter } from './src/server/routes/paymentRoutes';
import { publicRouter } from './src/server/routes/publicRoutes';
import { matchingRouter } from './src/server/routes/matchingRoutes';
import { adminRouter } from './src/server/routes/adminRoutes';
import { moderationRouter } from './src/server/routes/moderationRoutes';
import { assertSupabaseConfiguration } from './src/server/supabase';
import { setupWebSocketServer } from './src/server/websocketServer';

async function startServer() {
  // Validate Supabase configuration safely with fallback
  try {
    assertSupabaseConfiguration();
  } catch (configErr) {
    console.warn('Supabase configuration notice:', configErr);
  }

  const app = express();
  const PORT = 3000;

  // Middlewares
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));
  app.use(cookieParser());

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'Rentia Backend API', timestamp: new Date().toISOString() });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/tenant', tenantRouter);
  app.use('/api/leases', leaseRouter);
  app.use('/api/payments', paymentRouter);
  app.use('/api/public', publicRouter);
  app.use('/public', publicRouter);
  app.use('/api/matching', matchingRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api', moderationRouter);


  // Error handling middleware (i18n conforme al idioma del cliente)
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Server error:', err);
    const rawLang = (req.query.lang as string) || (req.headers['x-language'] as string) || (req.headers['accept-language'] as string) || 'es';
    let lang = 'es';
    if (typeof rawLang === 'string') {
      if (rawLang.includes('fr')) lang = 'fr';
      else if (rawLang.includes('en')) lang = 'en';
    }
    const localizedError = lang === 'fr'
      ? 'Une erreur interne est survenue. Veuillez réessayer ultérieurement.'
      : lang === 'en'
      ? 'An internal server error occurred. Please try again later.'
      : 'Ha ocurrido un error interno en el servidor. Por favor, inténtelo de nuevo más tarde.';

    res.status(500).json({ error: localizedError });
  });

  // Vite middleware for development vs Static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Rentia Server running on http://0.0.0.0:${PORT}`);
  });

  // Mount real-time WebSocket server for chat & messaging
  setupWebSocketServer(server);

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`Port ${PORT} in use, waiting for existing socket to release...`);
    } else {
      console.error('Server listen error:', err);
    }
  });
}

startServer().catch((err) => {
  console.error('Failed to start Rentia server:', err);
  process.exit(1);
});
