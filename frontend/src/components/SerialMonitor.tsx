import { useState, useRef, useEffect } from 'react';

export default function SerialMonitor({
  lines,
  onLinesChange,
}: {
  lines: string[];
  onLinesChange: (lines: string[]) => void;
}) {
  const [baudRate, setBaudRate] = useState('115200');
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');
  const portRef = useRef<any>(null);
  const readerRef = useRef<any>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const bufferRef = useRef<string>('');

  const webSerialSupported = typeof navigator !== 'undefined' && 'serial' in navigator;

  useEffect(() => {
    logRef.current?.scrollTo(0, logRef.current.scrollHeight);
  }, [lines]);

  const handleConnect = async () => {
    setError('');
    if (!webSerialSupported) {
      setError('Web Serial API not supported. Use Chrome or Edge.');
      return;
    }
    try {
      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate: parseInt(baudRate) });
      portRef.current = port;
      setConnected(true);

      const decoder = new TextDecoderStream();
      const readableStreamClosed = port.readable.pipeTo(decoder.writable);
      const reader = decoder.readable.getReader();
      readerRef.current = reader;

      // Read loop
      (async () => {
        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            if (value) {
              bufferRef.current += value;
              const parts = bufferRef.current.split('\n');
              bufferRef.current = parts.pop() || '';
              const newLines = parts.map((l) => l.trim()).filter(Boolean);
              if (newLines.length > 0) {
                onLinesChange([...lines, ...newLines].slice(-500));
              }
            }
          }
        } catch (err) {
          console.error('Serial read error:', err);
        }
      })();
    } catch (err: any) {
      setError(err.message || 'Failed to connect');
      setConnected(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      if (readerRef.current) {
        await readerRef.current.cancel();
        readerRef.current = null;
      }
      if (portRef.current) {
        await portRef.current.close();
        portRef.current = null;
      }
    } catch (err) {
      console.error('Disconnect error:', err);
    }
    setConnected(false);
  };

  const handleClear = () => {
    onLinesChange([]);
  };

  return (
    <>
      <div className="panel-header">
        <span>SERIAL MONITOR</span>
        <span className={`status-dot ${connected ? 'connected' : 'disconnected'}`} />
      </div>
      {!webSerialSupported && (
        <div className="warning-banner">
          Web Serial not supported. Use Chrome or Edge to connect to ESP32.
        </div>
      )}
      <div className="serial-controls">
        <select value={baudRate} onChange={(e) => setBaudRate(e.target.value)} disabled={connected}>
          <option value="9600">9600</option>
          <option value="19200">19200</option>
          <option value="38400">38400</option>
          <option value="115200">115200</option>
          <option value="921600">921600</option>
        </select>
        {connected ? (
          <button onClick={handleDisconnect} style={{ borderColor: 'var(--red)', color: 'var(--red)' }}>
            DISCONNECT
          </button>
        ) : (
          <button className="btn-accent" onClick={handleConnect}>
            CONNECT
          </button>
        )}
        <button onClick={handleClear}>CLEAR</button>
      </div>
      {error && (
        <div style={{ padding: '4px 10px', color: 'var(--red)', fontSize: '11px' }}>{error}</div>
      )}
      <div className="serial-log" ref={logRef}>
        {lines.length === 0 ? (
          <div className="serial-empty">No serial data. Connect to ESP32 to see logs.</div>
        ) : (
          lines.map((line, i) => {
            const cls = line.toLowerCase().includes('error') || line.toLowerCase().includes('fail')
              ? 'error'
              : line.toLowerCase().includes('ready') || line.toLowerCase().includes('connected')
              ? 'info'
              : '';
            return (
              <div key={i} className={`serial-log-line ${cls}`}>{line}</div>
            );
          })
        )}
      </div>
    </>
  );
}
