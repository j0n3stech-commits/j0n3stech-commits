import { useState, useRef, useEffect } from 'react';
import { diffLines } from 'diff';
import { api } from '../api';
import { AgentMode, ProjectFile, Wiring } from '../types';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function AIChat({
  mode,
  files,
  wiring,
  serialLines,
  onApplyCode,
  onAgentResult,
  focusTrigger,
}: {
  mode: AgentMode;
  files: ProjectFile[];
  wiring: Wiring;
  serialLines: string[];
  onApplyCode: (code: string) => void;
  onAgentResult: (result: any, mode: AgentMode) => void;
  focusTrigger: number;
}) {
  const [currentMode, setCurrentMode] = useState<AgentMode>(mode);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'AI agent ready. CODER mode active. Describe an edit to main.ino.' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [diffData, setDiffData] = useState<{ oldCode: string; newCode: string; summary: string } | null>(null);
  const [wiringSuggestions, setWiringSuggestions] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, [focusTrigger]);

  const handleSubmit = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setLoading(true);

    try {
      const mainIno = files.find((f) => f.name === 'main.ino')?.content || '';
      const result = await api.callAgent(currentMode, userMsg, {
        mainIno,
        wiring,
        serialLines: serialLines.slice(-50),
      });

      if (currentMode === 'ARCHITECT') {
        onAgentResult(result, currentMode);
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `Architecture generated:\n${result.components?.length || 0} components placed\n${result.connections?.length || 0} wires drawn\nmain.ino updated\nLibraries: ${(result.libraries || []).join(', ')}`,
          },
        ]);
        if (result.connections) {
          const suggestions = result.connections
            .filter((c: any) => c.gpio !== undefined)
            .map((c: any) => `${c.from} -> ${c.to} (GPIO ${c.gpio})`);
          setWiringSuggestions(suggestions);
        }
      } else if (currentMode === 'CODER') {
        const newCode = result.updatedCode || result.code || '';
        const oldCode = mainIno;
        setDiffData({ oldCode, newCode, summary: result.summary || 'Code updated' });
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: result.summary || 'Code updated. Review the diff and Accept/Reject.',
          },
        ]);
        if (result.newPins && result.newPins.length > 0) {
          setWiringSuggestions(result.newPins.map((p: number) => `GPIO ${p} used in code — connect a component`));
        }
      } else if (currentMode === 'DEBUGGER') {
        const newCode = result.fixedCode || result.updatedCode || '';
        const oldCode = mainIno;
        setDiffData({ oldCode, newCode, summary: result.explanation || 'Bug fixed' });
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: result.explanation || 'Bug found and fixed. Review the diff and Accept/Reject.',
          },
        ]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Error: ${err.message}` },
      ]);
    }
    setLoading(false);
  };

  const handleAccept = () => {
    if (diffData) {
      onApplyCode(diffData.newCode);
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Code applied to main.ino.' }]);
      setDiffData(null);
    }
  };

  const handleReject = () => {
    setDiffData(null);
    setMessages((prev) => [...prev, { role: 'assistant', content: 'Changes rejected.' }]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const computeDiff = (oldCode: string, newCode: string) => {
    const changes = diffLines(oldCode, newCode);
    return changes.map((part, i) => ({
      type: part.added ? 'added' : part.removed ? 'removed' : 'context',
      lines: part.value.split('\n').filter((l, idx, arr) => idx < arr.length - 1 || l !== ''),
      key: i,
    }));
  };

  return (
    <>
      <div className="panel-header">
        <span>AI AGENT</span>
        {loading && <span style={{ color: 'var(--accent)' }}>thinking...</span>}
      </div>
      <div className="agent-modes">
        {(['ARCHITECT', 'CODER', 'DEBUGGER'] as AgentMode[]).map((m) => (
          <button
            key={m}
            className={`agent-mode-btn ${currentMode === m ? 'active' : ''}`}
            onClick={() => {
              setCurrentMode(m);
              setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: `${m} mode activated.` },
              ]);
            }}
          >
            {m}
          </button>
        ))}
      </div>
      <div className="chat-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`chat-msg ${msg.role}`}>
            <div className="msg-role">{msg.role}</div>
            <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
          </div>
        ))}
        {loading && (
          <div className="chat-msg assistant">
            <div className="msg-role">assistant</div>
            <div>Processing...</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {wiringSuggestions.length > 0 && (
        <div className="wiring-suggestions">
          <div className="wiring-suggestions-title">Wiring Suggestions</div>
          {wiringSuggestions.map((s, i) => (
            <div key={i} className="wiring-suggestion-item">
              <span className="suggestion-dot" />
              {s}
            </div>
          ))}
        </div>
      )}

      <div className="chat-input-area">
        <textarea
          ref={textareaRef}
          className="chat-input"
          placeholder={`Describe an edit... (${currentMode})`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />
        <div className="chat-input-row">
          <span className="chat-hint">Ctrl+K to focus<span className="kbd">Ctrl+K</span></span>
          <button className="btn-accent" onClick={handleSubmit} disabled={loading || !input.trim()}>
            SEND
          </button>
        </div>
      </div>

      {/* Diff overlay */}
      {diffData && (
        <div className="diff-overlay">
          <div className="diff-modal">
            <div className="diff-modal-header">
              <span>DIFF: {diffData.summary}</span>
              <span style={{ color: 'var(--text-dim)', fontSize: '10px' }}>main.ino</span>
            </div>
            <div className="diff-modal-body">
              {computeDiff(diffData.oldCode, diffData.newCode).map((part) =>
                part.lines.map((line, j) => (
                  <div key={`${part.key}-${j}`} className={`diff-line ${part.type}`}>
                    <span className="diff-sign">
                      {part.type === 'added' ? '+' : part.type === 'removed' ? '-' : ' '}
                    </span>
                    <span>{line}</span>
                  </div>
                ))
              )}
            </div>
            <div className="diff-modal-footer">
              <button onClick={handleReject} style={{ borderColor: 'var(--red)', color: 'var(--red)' }}>
                REJECT
              </button>
              <button className="btn-accent" onClick={handleAccept}>
                ACCEPT
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
