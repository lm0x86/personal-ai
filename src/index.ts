import express, { Request, Response, NextFunction } from 'express';
import { config } from './config.js';
import { router } from './routes/index.js';

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} | ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API info
app.get('/', (_req: Request, res: Response) => {
  res.json({
    name: 'Personal AI Assistant API',
    version: '1.0.0',
    description: 'API for managing tasks, events, reminders, people, places, documents, memories, and projects',
    endpoints: {
      tasks: {
        list: 'GET /api/tasks',
        get: 'GET /api/tasks/:id',
        create: 'POST /api/tasks',
        update: 'PUT /api/tasks/:id',
        patch: 'PATCH /api/tasks/:id',
        delete: 'DELETE /api/tasks/:id',
      },
      events: {
        list: 'GET /api/events',
        get: 'GET /api/events/:id',
        create: 'POST /api/events',
        update: 'PUT /api/events/:id',
        patch: 'PATCH /api/events/:id',
        delete: 'DELETE /api/events/:id',
      },
      reminders: {
        list: 'GET /api/reminders',
        get: 'GET /api/reminders/:id',
        create: 'POST /api/reminders',
        update: 'PUT /api/reminders/:id',
        patch: 'PATCH /api/reminders/:id',
        delete: 'DELETE /api/reminders/:id',
      },
      people: {
        list: 'GET /api/people',
        get: 'GET /api/people/:id',
        create: 'POST /api/people',
        update: 'PUT /api/people/:id',
        patch: 'PATCH /api/people/:id',
        delete: 'DELETE /api/people/:id',
      },
      places: {
        list: 'GET /api/places',
        get: 'GET /api/places/:id',
        create: 'POST /api/places',
        update: 'PUT /api/places/:id',
        patch: 'PATCH /api/places/:id',
        delete: 'DELETE /api/places/:id',
      },
      documents: {
        list: 'GET /api/documents',
        get: 'GET /api/documents/:id',
        create: 'POST /api/documents',
        update: 'PUT /api/documents/:id',
        patch: 'PATCH /api/documents/:id',
        delete: 'DELETE /api/documents/:id',
      },
      memories: {
        list: 'GET /api/memories',
        get: 'GET /api/memories/:id',
        create: 'POST /api/memories',
        update: 'PUT /api/memories/:id',
        patch: 'PATCH /api/memories/:id',
        delete: 'DELETE /api/memories/:id',
      },
      projects: {
        list: 'GET /api/projects',
        get: 'GET /api/projects/:id',
        create: 'POST /api/projects',
        update: 'PUT /api/projects/:id',
        patch: 'PATCH /api/projects/:id',
        delete: 'DELETE /api/projects/:id',
      },
      search: {
        unified: 'POST /api/search',
        simple: 'GET /api/search?q=query&types=task,event&limit=10',
      },
    },
  });
});

// Mount API routes
app.use('/api', router);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(config.port, () => {
  console.log(`🚀 Personal AI Assistant API running at http://localhost:${config.port}`);
  console.log(`📦 Vector Store: ${config.vectorStore.baseUrl}`);
});
