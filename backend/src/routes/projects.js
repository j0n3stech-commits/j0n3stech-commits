import { Router } from 'express';
import { getDb } from '../db.js';
import { authMiddleware } from './auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/', (req, res) => {
  const db = getDb();
  const projects = db.prepare('SELECT id, name, created_at, updated_at FROM projects WHERE owner_id = ? ORDER BY updated_at DESC').all(req.userId);
  res.json({ projects });
});

router.get('/:id', (req, res) => {
  const db = getDb();
  const project = db.prepare('SELECT * FROM projects WHERE id = ? AND owner_id = ?').get(req.params.id, req.userId);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  res.json({
    id: project.id,
    name: project.name,
    files: JSON.parse(project.files),
    wiring: JSON.parse(project.wiring),
    createdAt: project.created_at,
    updatedAt: project.updated_at,
  });
});

router.post('/', (req, res) => {
  const { name, files, wiring } = req.body;
  const db = getDb();
  const result = db.prepare(
    'INSERT INTO projects (name, files, wiring, owner_id) VALUES (?, ?, ?, ?)'
  ).run(
    name || 'Untitled Project',
    JSON.stringify(files || []),
    JSON.stringify(wiring || { nodes: [], connections: [] }),
    req.userId
  );
  res.json({ id: result.lastInsertRowid, name: name || 'Untitled Project' });
});

router.put('/:id', (req, res) => {
  const { name, files, wiring } = req.body;
  const db = getDb();
  const existing = db.prepare('SELECT id FROM projects WHERE id = ? AND owner_id = ?').get(req.params.id, req.userId);
  if (!existing) return res.status(404).json({ error: 'Project not found' });

  const updates = {};
  if (name !== undefined) updates.name = name;
  if (files !== undefined) updates.files = JSON.stringify(files);
  if (wiring !== undefined) updates.wiring = JSON.stringify(wiring);

  const setClauses = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  const values = Object.values(updates);
  if (setClauses) {
    db.prepare(`UPDATE projects SET ${setClauses}, updated_at = datetime('now') WHERE id = ?`).run(...values, req.params.id);
  }
  res.json({ ok: true });
});

router.delete('/:id', (req, res) => {
  const db = getDb();
  const result = db.prepare('DELETE FROM projects WHERE id = ? AND owner_id = ?').run(req.params.id, req.userId);
  if (result.changes === 0) return res.status(404).json({ error: 'Project not found' });
  res.json({ ok: true });
});

router.post('/:id/fork', (req, res) => {
  const db = getDb();
  const original = db.prepare('SELECT * FROM projects WHERE id = ? AND owner_id = ?').get(req.params.id, req.userId);
  if (!original) return res.status(404).json({ error: 'Project not found' });
  const newName = `${original.name} (fork)`;
  const result = db.prepare(
    'INSERT INTO projects (name, files, wiring, owner_id) VALUES (?, ?, ?, ?)'
  ).run(newName, original.files, original.wiring, req.userId);
  res.json({ id: result.lastInsertRowid, name: newName });
});

export default router;
