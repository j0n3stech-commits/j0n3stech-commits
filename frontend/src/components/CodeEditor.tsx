import Editor from '@monaco-editor/react';
import { ProjectFile } from '../types';

export default function CodeEditor({
  files,
  openTabs,
  activeTab,
  onTabChange,
  onTabClose,
  onContentChange,
}: {
  files: ProjectFile[];
  openTabs: string[];
  activeTab: string;
  onTabChange: (name: string) => void;
  onTabClose: (name: string) => void;
  onContentChange: (name: string, content: string) => void;
}) {
  const activeFile = files.find((f) => f.name === activeTab);

  const getLanguage = (name: string) => {
    if (name.endsWith('.ino') || name.endsWith('.h')) return 'cpp';
    if (name.endsWith('.json')) return 'json';
    return 'plaintext';
  };

  return (
    <>
      <div className="editor-tabs">
        {openTabs.map((tab) => (
          <div
            key={tab}
            className={`editor-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => onTabChange(tab)}
          >
            {tab}
            <span
              className="tab-close"
              onClick={(e) => {
                e.stopPropagation();
                onTabClose(tab);
              }}
            >
              x
            </span>
          </div>
        ))}
      </div>
      <div className="editor-container">
        {activeFile && (
          <Editor
            height="100%"
            theme="vs-dark"
            language={getLanguage(activeFile.name)}
            value={activeFile.content}
            onChange={(val) => onContentChange(activeFile.name, val || '')}
            options={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 13,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              tabSize: 2,
              lineNumbers: 'on',
              padding: { top: 8 },
              automaticLayout: true,
            }}
            loading={<div style={{ padding: '20px', color: '#666' }}>Loading editor...</div>}
          />
        )}
      </div>
    </>
  );
}
