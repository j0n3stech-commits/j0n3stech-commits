import { Project, ProjectFile, Wiring, AgentMode } from './types';

const API_BASE = '/api';

let token: string | null = localStorage.getItem('03x_token');

export function setToken(t: string | null) {
  token = t;
  if (t) localStorage.setItem('03x_token', t);
  else localStorage.removeItem('03x_token');
}

export function getToken() {
  return token;
}

function authHeaders(): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path: string, options: RequestInit = {}) {
  const resp = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...options.headers,
    },
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// Auth
export const api = {
  async register(username: string, password: string) {
    const data = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    setToken(data.token);
    return data;
  },

  async login(username: string, password: string) {
    const data = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    setToken(data.token);
    return data;
  },

  async me() {
    try {
      return await request('/auth/me');
    } catch {
      return null;
    }
  },

  async listProjects() {
    return request('/projects') as Promise<{ projects: any[] }>;
  },

  async getProject(id: number) {
    return request(`/projects/${id}`) as Promise<Project>;
  },

  async createProject(name: string, files?: ProjectFile[], wiring?: Wiring) {
    return request('/projects', {
      method: 'POST',
      body: JSON.stringify({ name, files, wiring }),
    });
  },

  async updateProject(id: number, data: Partial<Pick<Project, 'name' | 'files' | 'wiring'>>) {
    return request(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteProject(id: number) {
    return request(`/projects/${id}`, { method: 'DELETE' });
  },

  async forkProject(id: number) {
    return request(`/projects/${id}/fork`, { method: 'POST' });
  },

  async callAgent(mode: AgentMode, message: string, context: { mainIno?: string; wiring?: Wiring; serialLines?: string[] }) {
    return request('/ai/agent', {
      method: 'POST',
      body: JSON.stringify({ mode, message, context }),
    });
  },
};
