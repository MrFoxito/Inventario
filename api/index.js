import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import terminalsRouter from './routes/terminals.js';
import simcardsRouter from './routes/simcards.js';
import employeesRouter from './routes/employees.js';
import assignmentsRouter from './routes/assignments.js';
import logsRouter from './routes/logs.js';
import reportsRouter from './routes/reports.js';
import dashboardRouter from './routes/dashboard.js';
import exportRouter from './routes/export.js';
import authRouter from './routes/auth.js';

const app = express();
const PORT = process.env.PORT || 3001;

// -- Middleware --
app.use(cors());
app.use(express.json());

// -- Routes --
app.use('/api/auth', authRouter);
app.use('/api/terminals', terminalsRouter);
app.use('/api/simcards', simcardsRouter);
app.use('/api/employees', employeesRouter);
app.use('/api/assignments', assignmentsRouter);
app.use('/api/logs', logsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/export', exportRouter);

// -- Health check --
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// -- Local dev: start listening (Vercel handles this in production) --
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log('[SERVER] Listening on http://localhost:' + PORT);
  });
}

// -- Export for Vercel Serverless --
export default app;
