import { Router } from 'express';

const router = Router();

const SYSTEM_PROMPTS = {
  ARCHITECT: `You are an ESP32 hardware architect. The user describes a project idea. You return ONLY valid JSON (no markdown, no code fences) with this exact structure:
{
  "components": [{"type": "ESP32-S3", "label": "ESP32-S3"}, ...],
  "connections": [{"from": "ESP32-S3.GPIO4", "to": "IR Sensor.OUT", "gpio": 4, "note": "IR data line"}],
  "code": "// full main.ino Arduino code as a string",
  "libraries": ["ArduinoJson", "HX711"]
}
Available component types: ESP32-S3, ESP32 DevKit, IR Sensor, Ultrasonic, Load Cell + HX711, Servo, OLED, LED, Button, Relay.
Use realistic GPIO numbers for ESP32-S3. Include all necessary #define lines at the top of the code.`,

  CODER: `You are an ESP32 code editor. You receive the current main.ino content and an edit request. Return ONLY valid JSON (no markdown, no code fences):
{
  "updatedCode": "// the COMPLETE updated main.ino file",
  "summary": "one-line description of what changed",
  "newPins": [4, 5]
}
Return the full file, not a snippet. Preserve all existing code that should not change.`,

  DEBUGGER: `You are an ESP32 debugger. You receive the current main.ino and serial monitor logs. Find the error and return ONLY valid JSON (no markdown, no code fences):
{
  "fixedCode": "// the COMPLETE fixed main.ino file",
  "explanation": "short explanation of the bug and fix",
  "newPins": []
}
Common issues: brownout detector, stack overflow/canary, wrong GPIO pin, I2S errors, watchdog timeout, memory leaks.`,
};

async function callLLM(systemPrompt, userMessage) {
  const apiKey = process.env.OPENAI_API_KEY;

  // If no real API key, return a simulated response
  if (!apiKey || apiKey === 'placeholder-dev-key') {
    return simulateResponse(userMessage);
  }

  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.4,
      response_format: { type: 'json_object' },
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`LLM API error ${resp.status}: ${text}`);
  }

  const data = await resp.json();
  return JSON.parse(data.choices[0].message.content);
}

function simulateResponse(userMessage) {
  const lower = userMessage.toLowerCase();

  // Simulate CODER response
  if (lower.includes('wifi') || lower.includes('firebase') || lower.includes('add') || lower.includes('update') || lower.includes('change')) {
    return {
      updatedCode: `#define IR_PIN 4
#define LED_PIN 2

#include <WiFi.h>
#include <FirebaseESP32Client.h>

#define WIFI_SSID "your-ssid"
#define WIFI_PASS "your-password"
#define FIREBASE_HOST "your-project.firebaseio.com"
#define FIREBASE_AUTH "your-database-secret"

FirebaseData firebaseData;

void setup() {
  Serial.begin(115200);
  pinMode(IR_PIN, INPUT);
  pinMode(LED_PIN, OUTPUT);

  WiFi.begin(WIFI_SSID, WIFI_PASS);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  Serial.print("Connected! IP: ");
  Serial.println(WiFi.localIP());

  Firebase.begin(firebaseData, FIREBASE_HOST, FIREBASE_AUTH);
}

void loop() {
  int irState = digitalRead(IR_PIN);
  if (irState == LOW) {
    digitalWrite(LED_PIN, HIGH);
    Firebase.setInt(firebaseData, "/ir/state", 1);
    Serial.println("Object detected - sent to Firebase");
  } else {
    digitalWrite(LED_PIN, LOW);
    Firebase.setInt(firebaseData, "/ir/state", 0);
  }
  delay(200);
}`,
      summary: 'Added WiFi connection and Firebase data upload for IR sensor state',
      newPins: [],
    };
  }

  // Simulate ARCHITECT response
  if (lower.includes('vending') || lower.includes('machine') || lower.includes('ir') || lower.includes('load cell') || lower.includes('hx711')) {
    return {
      components: [
        { type: 'ESP32-S3', label: 'ESP32-S3' },
        { type: 'IR Sensor', label: 'IR Sensor' },
        { type: 'Load Cell + HX711', label: 'Load Cell + HX711' },
        { type: 'Servo', label: 'Servo' },
        { type: 'OLED', label: 'OLED Display' },
      ],
      connections: [
        { from: 'ESP32-S3.GPIO4', to: 'IR Sensor.OUT', gpio: 4, note: 'IR data line' },
        { from: 'ESP32-S3.GPIO5', to: 'Load Cell + HX711.DOUT', gpio: 5, note: 'HX711 data' },
        { from: 'ESP32-S3.GPIO18', to: 'Load Cell + HX711.SCK', gpio: 18, note: 'HX711 clock' },
        { from: 'ESP32-S3.GPIO13', to: 'Servo.SIG', gpio: 13, note: 'Servo PWM signal' },
        { from: 'ESP32-S3.GPIO21', to: 'OLED.SDA', gpio: 21, note: 'I2C data' },
        { from: 'ESP32-S3.GPIO22', to: 'OLED.SCL', gpio: 22, note: 'I2C clock' },
      ],
      code: `#define IR_PIN 4
#define HX711_DOUT 5
#define HX711_SCK 18
#define SERVO_PIN 13
#define SDA_PIN 21
#define SCL_PIN 22

#include <Wire.h>
#include <Adafruit_SSD1306.h>
#include <HX711.h>
#include <ESP32Servo.h>

HX711 scale;
Servo servo;
Adafruit_SSD1306 display(128, 64, &Wire, -1);

float calibration = 2280.0;

void setup() {
  Serial.begin(115200);
  Wire.begin(SDA_PIN, SCL_PIN);
  display.begin(SSD1306_SWITCHCAPVCC, 0x3C);
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.println("Reverse Vending");
  display.display();

  scale.begin(HX711_DOUT, HX711_SCK);
  scale.set_scale(calibration);
  scale.tare();

  servo.attach(SERVO_PIN);
  servo.write(0);
  pinMode(IR_PIN, INPUT);
}

void loop() {
  int ir = digitalRead(IR_PIN);
  float weight = scale.get_units(5);

  display.clearDisplay();
  display.setCursor(0, 0);
  display.print("Weight: ");
  display.print(weight, 1);
  display.println(" g");
  display.print("IR: ");
  display.println(ir == LOW ? "DETECTED" : "CLEAR");
  display.display();

  if (ir == LOW && weight > 10.0) {
    Serial.println("Valid item accepted");
    servo.write(90);
    delay(2000);
    servo.write(0);
    scale.tare();
  }
  delay(300);
}`,
      libraries: ['HX711', 'ESP32Servo', 'Adafruit SSD1306', 'Adafruit GFX'],
    };
  }

  // Simulate DEBUGGER response
  if (lower.includes('brownout') || lower.includes('error') || lower.includes('reset') || lower.includes('crash')) {
    return {
      fixedCode: `#define IR_PIN 4
#define LED_PIN 2

void setup() {
  Serial.begin(115200);
  delay(200);
  pinMode(IR_PIN, INPUT);
  pinMode(LED_PIN, OUTPUT);
  Serial.println("System ready");
}

void loop() {
  int irState = digitalRead(IR_PIN);
  if (irState == LOW) {
    digitalWrite(LED_PIN, HIGH);
    Serial.println("Object detected");
  } else {
    digitalWrite(LED_PIN, LOW);
  }
  delay(200);
}`,
      explanation: 'Brownout detector triggered by insufficient power supply. Added startup delay and reduced serial baud rate initialization race condition.',
      newPins: [],
    };
  }

  // Generic fallback
  return {
    updatedCode: `#define IR_PIN 4
#define LED_PIN 2

void setup() {
  Serial.begin(115200);
  pinMode(IR_PIN, INPUT);
  pinMode(LED_PIN, OUTPUT);
}

void loop() {
  int val = digitalRead(IR_PIN);
  digitalWrite(LED_PIN, val == LOW ? HIGH : LOW);
  delay(200);
}`,
    summary: 'Simulated response — set OPENAI_API_KEY for real AI responses',
    newPins: [],
  };
}

router.post('/agent', async (req, res) => {
  try {
    const { mode, message, context } = req.body;
    const prompt = SYSTEM_PROMPTS[mode];
    if (!prompt) return res.status(400).json({ error: 'Invalid agent mode' });

    const contextStr = context
      ? `\n\n--- CONTEXT ---\nCurrent main.ino:\n${context.mainIno || '(empty)'}\n\nWiring:\n${JSON.stringify(context.wiring || {}, null, 2)}\n\nSerial log (last lines):\n${(context.serialLines || []).join('\n')}\n--- END CONTEXT ---\n\nUser request: ${message}`
      : message;

    const result = await callLLM(prompt, contextStr);
    res.json(result);
  } catch (err) {
    console.error('[AI] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
