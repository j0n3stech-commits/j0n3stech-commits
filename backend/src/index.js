import express from 'express';
import cors from 'cors';
import { initDb } from './db.js';
import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import aiRoutes from './routes/ai.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/ai', aiRoutes);

initDb();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[03X IDE] API server running on port ${PORT}`);
});
