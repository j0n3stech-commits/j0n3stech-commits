import { useState } from 'react';
import { api } from '../api';

export default function Login({ onLogin }: { onLogin: (u: { userId: number; username: string }) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const result = mode === 'login'
        ? await api.login(username, password)
        : await api.register(username, password);
      onLogin({ userId: result.userId, username: result.username });
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-box">
        <h1>0<span>3</span>X IDE</h1>
        <div className="tagline">The AI-native hardware lab</div>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
          />
          <input
            type="password"
            placeholder="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit" className="btn-accent">
            {mode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}
          </button>
        </form>
        <div className="auth-toggle" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
          {mode === 'login' ? 'No account? Register' : 'Have an account? Sign in'}
        </div>
      </div>
    </div>
  );
}
