import { useRef, useState, useEffect } from 'react';
import { Wiring, WiringNode, WiringConnection, COMPONENT_DEFS, Pin } from '../types';

const NODE_WIDTH = 120;
const NODE_HEIGHT_BASE = 20;
const PIN_HEIGHT = 14;
const PIN_RADIUS = 4;

function getPinPos(node: WiringNode, pinIndex: number, side: 'left' | 'right') {
  const y = NODE_HEIGHT_BASE + pinIndex * PIN_HEIGHT + 8;
  const x = side === 'left' ? 0 : NODE_WIDTH;
  return { x: node.x + x, y: node.y + y };
}

function getPinSide(pin: Pin, index: number): 'left' | 'right' {
  return index % 2 === 0 ? 'left' : 'right';
}

function getPinGlobalPos(node: WiringNode, pinName: string) {
  const pinIndex = node.pins.findIndex((p) => p.name === pinName);
  if (pinIndex === -1) return null;
  const side = getPinSide(node.pins[pinIndex], pinIndex);
  return getPinPos(node, pinIndex, side);
}

export default function WiringCanvas({
  wiring,
  onWiringChange,
}: {
  wiring: Wiring;
  onWiringChange: (w: Wiring) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [pinoutNode, setPinoutNode] = useState<string | null>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('component-type');
    if (!type || !COMPONENT_DEFS[type]) return;

    const rect = svgRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const def = COMPONENT_DEFS[type];
    const newNode: WiringNode = {
      id: `node-${Date.now()}`,
      type: type,
      label: def.label,
      x: x - NODE_WIDTH / 2,
      y: y - 10,
      pins: def.pins,
    };

    onWiringChange({
      ...wiring,
      nodes: [...wiring.nodes, newNode],
    });
  };

  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    const node = wiring.nodes.find((n) => n.id === nodeId);
    if (!node) return;
    const rect = svgRef.current!.getBoundingClientRect();
    setDraggingNode(nodeId);
    setDragOffset({
      x: e.clientX - rect.left - node.x,
      y: e.clientY - rect.top - node.y,
    });
    setSelectedNode(nodeId);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = svgRef.current!.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    setMousePos({ x: mx, y: my });

    if (draggingNode) {
      const newNodes = wiring.nodes.map((n) =>
        n.id === draggingNode
          ? { ...n, x: mx - dragOffset.x, y: my - dragOffset.y }
          : n
      );
      onWiringChange({ ...wiring, nodes: newNodes });
    }
  };

  const handleMouseUp = () => {
    setDraggingNode(null);
    if (connectingFrom) {
      setConnectingFrom(null);
    }
  };

  const handlePinClick = (e: React.MouseEvent, nodeId: string, pinName: string) => {
    e.stopPropagation();
    const pinId = `${nodeId}.${pinName}`;
    if (!connectingFrom) {
      setConnectingFrom(pinId);
    } else if (connectingFrom !== pinId) {
      // Check if connection already exists
      const exists = wiring.connections.some(
        (c) =>
          (c.from === connectingFrom && c.to === pinId) ||
          (c.from === pinId && c.to === connectingFrom)
      );
      if (!exists) {
        // Try to detect GPIO number from pin name
        const fromNode = wiring.nodes.find((n) => n.id === connectingFrom.split('.')[0]);
        const toNode = wiring.nodes.find((n) => n.id === nodeId);
        let gpio: number | undefined;
        const fromPinName = connectingFrom.split('.').slice(1).join('.');
        const gpioMatch = fromPinName.match(/GPIO(\d+)/) || pinName.match(/GPIO(\d+)/);
        if (gpioMatch) gpio = parseInt(gpioMatch[1]);

        const newConn: WiringConnection = {
          id: `conn-${Date.now()}`,
          from: connectingFrom,
          to: pinId,
          gpio,
        };
        onWiringChange({
          ...wiring,
          connections: [...wiring.connections, newConn],
        });
      }
      setConnectingFrom(null);
    }
  };

  const handleCanvasClick = () => {
    setSelectedNode(null);
    setPinoutNode(null);
    setConnectingFrom(null);
  };

  const handleWireClick = (e: React.MouseEvent, connId: string) => {
    e.stopPropagation();
    onWiringChange({
      ...wiring,
      connections: wiring.connections.filter((c) => c.id !== connId),
    });
  };

  const bezierPath = (x1: number, y1: number, x2: number, y2: number) => {
    const dx = Math.abs(x2 - x1) * 0.5 + 30;
    return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
  };

  const renderNode = (node: WiringNode) => {
    const height = NODE_HEIGHT_BASE + node.pins.length * PIN_HEIGHT + 4;
    const isSelected = selectedNode === node.id;

    return (
      <g
        key={node.id}
        className="wiring-node"
        onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedNode(node.id);
          setPinoutNode(node.id);
        }}
      >
        <rect
          className={`wiring-node-body ${isSelected ? 'selected' : ''}`}
          x={node.x}
          y={node.y}
          width={NODE_WIDTH}
          height={height}
        />
        <text className="wiring-node-label" x={node.x + NODE_WIDTH / 2} y={node.y + 14}>
          {node.label}
        </text>
        {node.pins.map((pin, i) => {
          const side = getPinSide(pin, i);
          const pos = getPinPos(node, i, side);
          const pinId = `${node.id}.${pin.name}`;
          const isConnected = connectingFrom === pinId;
          return (
            <g key={pin.name}>
              <circle
                className={`wiring-pin ${isConnected ? 'connected' : ''}`}
                cx={pos.x}
                cy={pos.y}
                r={PIN_RADIUS}
                onClick={(e) => handlePinClick(e, node.id, pin.name)}
                style={isConnected ? { fill: 'var(--accent)' } : {}}
              />
              <text
                className="wiring-pin-label"
                x={side === 'left' ? pos.x + 8 : pos.x - 8}
                y={pos.y + 3}
                textAnchor={side === 'left' ? 'start' : 'end'}
              >
                {pin.name}
              </text>
            </g>
          );
        })}
      </g>
    );
  };

  const getConnectionPoints = (conn: WiringConnection) => {
    const [fromNodeId, ...fromPinParts] = conn.from.split('.');
    const [toNodeId, ...toPinParts] = conn.to.split('.');
    const fromNode = wiring.nodes.find((n) => n.id === fromNodeId);
    const toNode = wiring.nodes.find((n) => n.id === toNodeId);
    if (!fromNode || !toNode) return null;
    const fromPos = getPinGlobalPos(fromNode, fromPinParts.join('.'));
    const toPos = getPinGlobalPos(toNode, toPinParts.join('.'));
    if (!fromPos || !toPos) return null;
    return { from: fromPos, to: toPos };
  };

  const pinoutNodeData = pinoutNode ? wiring.nodes.find((n) => n.id === pinoutNode) : null;

  return (
    <>
      <div className="canvas-header">
        <span>WIRING CANVAS</span>
        <span style={{ textTransform: 'none', letterSpacing: 0 }}>
          {wiring.nodes.length} nodes / {wiring.connections.length} wires
          {connectingFrom && ' — click a pin to connect'}
        </span>
      </div>
      <svg
        ref={svgRef}
        className="canvas-svg"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleCanvasClick}
      >
        {/* Render connections */}
        {wiring.connections.map((conn) => {
          const pts = getConnectionPoints(conn);
          if (!pts) return null;
          return (
            <path
              key={conn.id}
              className="wiring-wire"
              d={bezierPath(pts.from.x, pts.from.y, pts.to.x, pts.to.y)}
              onClick={(e) => handleWireClick(e, conn.id)}
            >
              <title>{`GPIO ${conn.gpio || '?'}`}</title>
            </path>
          );
        })}

        {/* Temp connection line */}
        {connectingFrom && (() => {
          const [nodeId, ...pinParts] = connectingFrom.split('.');
          const node = wiring.nodes.find((n) => n.id === nodeId);
          if (!node) return null;
          const pos = getPinGlobalPos(node, pinParts.join('.'));
          if (!pos) return null;
          return (
            <path
              className="wiring-wire-temp"
              d={bezierPath(pos.x, pos.y, mousePos.x, mousePos.y)}
            />
          );
        })()}

        {/* Render nodes */}
        {wiring.nodes.map(renderNode)}
      </svg>

      {/* Pinout panel */}
      {pinoutNodeData && (
        <div className="pinout-panel" style={{ top: 8, right: 8 }}>
          <h4>{pinoutNodeData.label}</h4>
          {pinoutNodeData.pins.map((pin) => (
            <div key={pin.name} className="pinout-row">
              <span>{pin.name}</span>
              <span className="pin-type">{pin.type}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
