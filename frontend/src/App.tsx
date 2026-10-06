import { useState, useEffect, useCallback, useRef } from 'react';
import { api, setToken, getToken } from './api';
import { Project, ProjectFile, Wiring, DEFAULT_FILES, AgentMode, COMPONENT_DEFS } from './types';
import Login from './components/Login';
import ProjectsList from './components/ProjectsList';
import TopBar from './components/TopBar';
import FileExplorer from './components/FileExplorer';
import ComponentPalette from './components/ComponentPalette';
import CodeEditor from './components/CodeEditor';
import WiringCanvas from './components/WiringCanvas';
import AIChat from './components/AIChat';
import SerialMonitor from './components/SerialMonitor';

type View = 'loading' | 'auth' | 'projects' | 'ide';

export default function App() {
  const [view, setView] = useState<View>('loading');
  const [user, setUser] = useState<{ userId: number; username: string } | null>(null);
  const [projectId, setProjectId] = useState<number | null>(null);
  const [projectName, setProjectName] = useState('Untitled Project');
  const [files, setFiles] = useState<ProjectFile[]>(DEFAULT_FILES);
  const [wiring, setWiring] = useState<Wiring>({ nodes: [], connections: [] });
  const [openTabs, setOpenTabs] = useState<string[]>(['main.ino']);
  const [activeTab, setActiveTab] = useState('main.ino');
  const [serialLines, setSerialLines] = useState<string[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [aiFocusTrigger, setAiFocusTrigger] = useState(0);

  // Check auth on mount
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setView('auth');
      return;
    }
    api.me().then((u) => {
      if (u) {
        setUser(u);
        setView('projects');
      } else {
        setToken(null);
        setView('auth');
      }
    });
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setAiFocusTrigger((t) => t + 1);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [projectId, files, wiring, projectName]);

  const handleSave = useCallback(async () => {
    if (!projectId || !user) return;
    try {
      await api.updateProject(projectId, { name: projectName, files, wiring });
      setDirty(false);
    } catch (err) {
      console.error('Save failed:', err);
    }
  }, [projectId, user, projectName, files, wiring]);

  const handleLogin = (u: { userId: number; username: string }) => {
    setUser(u);
    setView('projects');
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    setView('auth');
  };

  const handleOpenProject = (p: Project) => {
    setProjectId(p.id);
    setProjectName(p.name);
    setFiles(p.files.length > 0 ? p.files : DEFAULT_FILES);
    setWiring(p.wiring || { nodes: [], connections: [] });
    setOpenTabs(['main.ino']);
    setActiveTab('main.ino');
    setDirty(false);
    setView('ide');
  };

  const handleNewProject = async () => {
    try {
      const result = await api.createProject('New Project', DEFAULT_FILES, { nodes: [], connections: [] });
      handleOpenProject({ id: result.id, name: 'New Project', files: DEFAULT_FILES, wiring: { nodes: [], connections: [] } });
    } catch (err) {
      console.error('Failed to create project:', err);
    }
  };

  const updateFile = (name: string, content: string) => {
    setFiles((prev) => prev.map((f) => (f.name === name ? { ...f, content } : f)));
    setDirty(true);
  };

  const updateWiring = (w: Wiring) => {
    setWiring(w);
    setDirty(true);
  };

  // Sync wiring to code: add #define lines for GPIO connections
  const syncWiringToCode = (newWiring: Wiring) => {
    const mainFile = files.find((f) => f.name === 'main.ino');
    if (!mainFile) return;

    const gpioConnections = newWiring.connections.filter((c) => c.gpio !== undefined);
    const defines = gpioConnections
      .map((c) => {
        const pinName = c.from.split('.').pop() || c.to.split('.').pop() || '';
        const cleanName = pinName.replace(/[^A-Z0-9]/gi, '_').toUpperCase();
        return `#define ${cleanName}_PIN ${c.gpio}`;
      })
      .filter((v, i, arr) => arr.indexOf(v) === i);

    let content = mainFile.content;
    // Remove existing #define ..._PIN lines
    content = content.replace(/^#define\s+\w+_PIN\s+\d+\s*$/gm, '');
    // Clean up multiple blank lines
    content = content.replace(/^\s*$/gm, '');

    if (defines.length > 0) {
      const defineBlock = defines.join('\n') + '\n\n';
      // Insert after initial comment block or at top
      const lines = content.split('\n');
      let insertIndex = 0;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith('//') || lines[i].trim() === '') {
          insertIndex = i + 1;
        } else {
          break;
        }
      }
      lines.splice(insertIndex, 0, defineBlock);
      content = lines.join('\n');
    }

    updateFile('main.ino', content);
  };

  const handleAgentResult = (result: any, mode: AgentMode) => {
    if (mode === 'ARCHITECT') {
      // Place components, draw wires, write main.ino, update library.json
      if (result.components) {
        const newNodes = result.components.map((c: any, i: number) => {
          const def = COMPONENT_DEFS[c.type];
          return {
            id: `node-${Date.now()}-${i}`,
            type: c.type,
            label: c.label || c.type,
            x: 80 + (i % 3) * 160,
            y: 40 + Math.floor(i / 3) * 120,
            pins: def ? def.pins : [{ name: 'PIN', type: 'signal' as const }],
          };
        });
        const newConnections = (result.connections || []).map((conn: any, i: number) => {
          const fromNode = newNodes.find((n: any) => n.type === conn.from.split('.')[0]);
          const toNode = newNodes.find((n: any) => n.type === conn.to.split('.')[0]);
          return {
            id: `conn-${Date.now()}-${i}`,
            from: fromNode ? `${fromNode.id}.${conn.from.split('.').slice(1).join('.')}` : conn.from,
            to: toNode ? `${toNode.id}.${conn.to.split('.').slice(1).join('.')}` : conn.to,
            gpio: conn.gpio,
          };
        });
        const newWiring = { nodes: newNodes, connections: newConnections };
        updateWiring(newWiring);
        syncWiringToCode(newWiring);
      }
      if (result.code) {
        updateFile('main.ino', result.code);
      }
      if (result.libraries) {
        const libFile = files.find((f) => f.name === 'library.json');
        if (libFile) {
          updateFile('library.json', JSON.stringify({ dependencies: result.libraries }, null, 2));
        }
      }
    }
  };



  if (view === 'loading') {
    return (
      <div className="loading-screen">
        <div className="wordmark">0<span>3</span>X IDE</div>
        <div>Loading...</div>
      </div>
    );
  }

  if (view === 'auth') {
    return <Login onLogin={handleLogin} />;
  }

  if (view === 'projects') {
    return (
      <ProjectsList
        user={user}
        onOpen={handleOpenProject}
        onNew={handleNewProject}
        onLogout={handleLogout}
      />
    );
  }

  const activeFile = files.find((f) => f.name === activeTab);

  return (
    <div className="app">
      <TopBar
        projectName={projectName}
        onProjectNameChange={setProjectName}
        onSave={handleSave}
        onShare={() => {}}
        onFlash={() => {}}
        dirty={dirty}
      />
      <div className="main-area">
        <div className={`sidebar-left ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <FileExplorer
            files={files}
            activeFile={activeTab}
            onOpen={(name) => {
              if (!openTabs.includes(name)) setOpenTabs([...openTabs, name]);
              setActiveTab(name);
            }}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
          <ComponentPalette />
        </div>
        <div className="center-area">
          <div className="editor-area">
            <CodeEditor
              files={files}
              openTabs={openTabs}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onTabClose={(name) => {
                const newTabs = openTabs.filter((t) => t !== name);
                setOpenTabs(newTabs);
                if (activeTab === name && newTabs.length > 0) setActiveTab(newTabs[newTabs.length - 1]);
              }}
              onContentChange={updateFile}
            />
          </div>
          <div className="canvas-area">
            <WiringCanvas
              wiring={wiring}
              onWiringChange={(w) => {
                updateWiring(w);
                syncWiringToCode(w);
              }}
            />
          </div>
        </div>
        <div className="sidebar-right">
          <div className="right-panel right-panel-top">
            <AIChat
              mode="CODER"
              files={files}
              wiring={wiring}
              serialLines={serialLines}
              onApplyCode={(code) => updateFile('main.ino', code)}
              onAgentResult={handleAgentResult}
              focusTrigger={aiFocusTrigger}
            />
          </div>
          <div className="right-panel right-panel-bottom">
            <SerialMonitor
              lines={serialLines}
              onLinesChange={setSerialLines}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
