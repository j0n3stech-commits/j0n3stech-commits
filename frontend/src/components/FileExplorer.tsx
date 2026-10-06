import { ProjectFile } from '../types';

export default function FileExplorer({
  files,
  activeFile,
  onOpen,
  collapsed,
  onToggleCollapse,
}: {
  files: ProjectFile[];
  activeFile: string;
  onOpen: (name: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}) {
  if (collapsed) {
    return (
      <div className="sidebar-section" style={{ height: '32px' }}>
        <div className="sidebar-section-header" onClick={onToggleCollapse} style={{ cursor: 'pointer' }}>
          <span>FILES</span>
          <span>&gt;&gt;</span>
        </div>
      </div>
    );
  }

  return (
    <div className="sidebar-section" style={{ flex: '0 0 auto', maxHeight: '40%' }}>
      <div className="sidebar-section-header">
        <span onClick={onToggleCollapse} style={{ cursor: 'pointer' }}>FILES</span>
        <span style={{ cursor: 'pointer' }}>&lt;&lt;</span>
      </div>
      <div className="sidebar-section-content">
        {files.map((f) => (
          <div
            key={f.name}
            className={`file-item ${activeFile === f.name ? 'active' : ''}`}
            onClick={() => onOpen(f.name)}
          >
            <span className="file-icon">{f.name.endsWith('.ino') ? '{ }' : f.name.endsWith('.h') ? 'h' : '{ }'}</span>
            {f.name}
          </div>
        ))}
      </div>
    </div>
  );
}
