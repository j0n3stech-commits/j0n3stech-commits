export default function TopBar({
  projectName,
  onProjectNameChange,
  onSave,
  onShare,
  onFlash,
  dirty,
}: {
  projectName: string;
  onProjectNameChange: (name: string) => void;
  onSave: () => void;
  onShare: () => void;
  onFlash: () => void;
  dirty: boolean;
}) {
  return (
    <div className="topbar">
      <div className="topbar-left">
        <div className="wordmark">0<span>3</span>X IDE</div>
        {dirty && <span style={{ color: 'var(--text-dimmer)', fontSize: '10px' }}>●</span>}
      </div>
      <div className="topbar-center">
        <input
          type="text"
          value={projectName}
          onChange={(e) => onProjectNameChange(e.target.value)}
          style={{
            textAlign: 'center',
            border: 'none',
            background: 'transparent',
            color: 'var(--text)',
            fontSize: '12px',
            width: 'auto',
            maxWidth: '300px',
          }}
        />
      </div>
      <div className="topbar-right">
        <button onClick={onSave}>Save</button>
        <button onClick={onShare}>Share</button>
        <button className="flash-btn" onClick={onFlash}>FLASH -&gt; ESP32</button>
      </div>
    </div>
  );
}
