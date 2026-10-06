export interface ProjectFile {
  name: string;
  content: string;
}

export interface Pin {
  name: string;
  type: 'power' | 'signal' | 'ground';
}

export interface WiringNode {
  id: string;
  type: string;
  label: string;
  x: number;
  y: number;
  pins: Pin[];
}

export interface WiringConnection {
  id: string;
  from: string; // nodeId.pinName
  to: string;   // nodeId.pinName
  gpio?: number;
}

export interface Wiring {
  nodes: WiringNode[];
  connections: WiringConnection[];
}

export interface Project {
  id: number;
  name: string;
  files: ProjectFile[];
  wiring: Wiring;
  createdAt?: string;
  updatedAt?: string;
}

export type AgentMode = 'ARCHITECT' | 'CODER' | 'DEBUGGER';

export interface ComponentDef {
  type: string;
  label: string;
  pins: Pin[];
}

export const COMPONENT_DEFS: Record<string, ComponentDef> = {
  'ESP32-S3': {
    type: 'ESP32-S3',
    label: 'ESP32-S3',
    pins: [
      { name: '3V3', type: 'power' },
      { name: 'GND', type: 'ground' },
      { name: 'GPIO4', type: 'signal' },
      { name: 'GPIO5', type: 'signal' },
      { name: 'GPIO13', type: 'signal' },
      { name: 'GPIO18', type: 'signal' },
      { name: 'GPIO21', type: 'signal' },
      { name: 'GPIO22', type: 'signal' },
    ],
  },
  'ESP32 DevKit': {
    type: 'ESP32 DevKit',
    label: 'ESP32 DevKit',
    pins: [
      { name: '3V3', type: 'power' },
      { name: 'GND', type: 'ground' },
      { name: 'GPIO2', type: 'signal' },
      { name: 'GPIO4', type: 'signal' },
      { name: 'GPIO5', type: 'signal' },
      { name: 'GPIO12', type: 'signal' },
      { name: 'GPIO13', type: 'signal' },
      { name: 'GPIO14', type: 'signal' },
    ],
  },
  'IR Sensor': {
    type: 'IR Sensor',
    label: 'IR Sensor',
    pins: [
      { name: 'VCC', type: 'power' },
      { name: 'GND', type: 'ground' },
      { name: 'OUT', type: 'signal' },
    ],
  },
  'Ultrasonic': {
    type: 'Ultrasonic',
    label: 'Ultrasonic HC-SR04',
    pins: [
      { name: 'VCC', type: 'power' },
      { name: 'GND', type: 'ground' },
      { name: 'TRIG', type: 'signal' },
      { name: 'ECHO', type: 'signal' },
    ],
  },
  'Load Cell + HX711': {
    type: 'Load Cell + HX711',
    label: 'Load Cell + HX711',
    pins: [
      { name: 'VCC', type: 'power' },
      { name: 'GND', type: 'ground' },
      { name: 'DOUT', type: 'signal' },
      { name: 'SCK', type: 'signal' },
    ],
  },
  'Servo': {
    type: 'Servo',
    label: 'Servo Motor',
    pins: [
      { name: 'VCC', type: 'power' },
      { name: 'GND', type: 'ground' },
      { name: 'SIG', type: 'signal' },
    ],
  },
  'OLED': {
    type: 'OLED',
    label: 'OLED 0.96"',
    pins: [
      { name: 'VCC', type: 'power' },
      { name: 'GND', type: 'ground' },
      { name: 'SDA', type: 'signal' },
      { name: 'SCL', type: 'signal' },
    ],
  },
  'LED': {
    type: 'LED',
    label: 'LED',
    pins: [
      { name: 'A', type: 'signal' },
      { name: 'C', type: 'ground' },
    ],
  },
  'Button': {
    type: 'Button',
    label: 'Push Button',
    pins: [
      { name: 'A', type: 'signal' },
      { name: 'B', type: 'ground' },
    ],
  },
  'Relay': {
    type: 'Relay',
    label: 'Relay Module',
    pins: [
      { name: 'VCC', type: 'power' },
      { name: 'GND', type: 'ground' },
      { name: 'IN', type: 'signal' },
    ],
  },
};

export const DEFAULT_FILES: ProjectFile[] = [
  {
    name: 'main.ino',
    content: `// 03X IDE - main.ino
// ESP32 project entry point

#define LED_PIN 2

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  Serial.println("03X IDE ready");
}

void loop() {
  digitalWrite(LED_PIN, HIGH);
  delay(500);
  digitalWrite(LED_PIN, LOW);
  delay(500);
}
`,
  },
  {
    name: 'secrets.h',
    content: `// secrets.h - Store sensitive credentials here
// Do not commit to public repos

#define WIFI_SSID "your-ssid"
#define WIFI_PASS "your-password"
#define FIREBASE_HOST "your-project.firebaseio.com"
#define FIREBASE_AUTH "your-database-secret"
`,
  },
  {
    name: 'wiring.json',
    content: `{
  "nodes": [],
  "connections": []
}`,
  },
  {
    name: 'library.json',
    content: `{
  "dependencies": []
}`,
  },
];
