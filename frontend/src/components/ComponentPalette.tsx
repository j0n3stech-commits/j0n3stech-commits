import { COMPONENT_DEFS } from '../types';

const PALETTE_ORDER = [
  'ESP32-S3',
  'ESP32 DevKit',
  'IR Sensor',
  'Ultrasonic',
  'Load Cell + HX711',
  'Servo',
  'OLED',
  'LED',
  'Button',
  'Relay',
];

export default function ComponentPalette() {
  const handleDragStart = (e: React.DragEvent, type: string) => {
    e.dataTransfer.setData('component-type', type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="sidebar-section" style={{ flex: 1 }}>
      <div className="sidebar-section-header">
        <span>COMPONENTS</span>
      </div>
      <div className="sidebar-section-content">
        {PALETTE_ORDER.map((type) => {
          const def = COMPONENT_DEFS[type];
          return (
            <div
              key={type}
              className="palette-item"
              draggable
              onDragStart={(e) => handleDragStart(e, type)}
            >
              <span className="palette-dot" />
              {def?.label || type}
            </div>
          );
        })}
      </div>
    </div>
  );
}
