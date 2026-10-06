import { useState, useEffect } from 'react';
import { api } from '../api';
import { Project } from '../types';
import JSZip from 'jszip';

export default function ProjectsList({
  user,
  onOpen,
  onNew,
  onLogout,
}: {
  user: { userId: number; username: string } | null;
  onOpen: (p: Project) => void;
  onNew: () => void;
  onLogout: () => void;
}) {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const data = await api.listProjects();
      setProjects(data.projects);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this project?')) return;
    await api.deleteProject(id);
    loadProjects();
  };

  const handleFork = async (id: number) => {
    await api.forkProject(id);
    loadProjects();
  };

  const handleExport = async (p: any) => {
    const full = await api.getProject(p.id);
    const zip = new JSZip();
    full.files.forEach((f) => zip.file(f.name, f.content));
    zip.file('wiring.json', JSON.stringify(full.wiring, null, 2));
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${full.name.replace(/\s+/g, '_')}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="projects-page">
      <div className="projects-header">
        <div className="wordmark">0<span>3</span>X IDE</div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{user?.username}</span>
          <button onClick={onLogout}>SIGN OUT</button>
        </div>
      </div>
      <div className="projects-content">
        <div className="projects-title">
          <span>Projects</span>
          <button className="btn-accent" onClick={onNew}>+ NEW PROJECT</button>
        </div>
        {loading && <div style={{ color: 'var(--text-dim)' }}>Loading...</div>}
        {!loading && projects.length === 0 && (
          <div style={{ color: 'var(--text-dim)', padding: '20px 0' }}>
            No projects yet. Create one to get started.
          </div>
        )}
        <div className="projects-list">
          {projects.map((p) => (
            <div key={p.id} className="project-card">
              <div className="project-card-info" onClick={() => {
                api.getProject(p.id).then(onOpen);
              }}>
                <div className="project-card-name">{p.name}</div>
                <div className="project-card-date">{p.updated_at}</div>
              </div>
              <div className="project-card-actions">
                <button onClick={() => api.getProject(p.id).then(onOpen)}>OPEN</button>
                <button onClick={() => handleFork(p.id)}>FORK</button>
                <button onClick={() => handleExport(p)}>EXPORT</button>
                <button onClick={() => handleDelete(p.id)} style={{ borderColor: 'var(--red)', color: 'var(--red)' }}>DELETE</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
