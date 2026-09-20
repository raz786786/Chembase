// ═══════════════════════════════════════════════════════════════════════════
// ChemBase Drone — ESP32 edge node
// Pipeline: sensors → Edge Impulse classifier → TLS alert → backend
//
// SETUP (full guide in firmware/README.md):
//  1. Train your model on Edge Impulse (fusion: MOS + PID + electrochemical)
//     → Deployment → Arduino Library → QUANTIZED (int8) → unzip into
//     Arduino/libraries/chembase_inferencing
//  2. Fill in WIFI_SSID / WIFI_PASS / API_HOST / DEVICE_ID / DEVICE_SECRET
//  3. Board: ESP32 Dev Module → Upload → Serial Monitor @ 115200
//
// NOTE: Edge Impulse hook points are marked `EI_HOOK`. Until you add the
// exported model library, the sketch runs in SIM MODE (pseudo-readings) so
// you can verify Wi-Fi, ingest, NVS buffering, and OTA polling without ML.
// ═══════════════════════════════════════════════════════════════════════════

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <Preferences.h>   // NVS — offline buffer + preheat tracking
#include <ArduinoJson.h>   // v7 — payload building

// ── Config ────────────────────────────────────────────────────────────────
static const char* WIFI_SSID     = "YOUR_WIFI";
static const char* WIFI_PASS     = "YOUR_PASS";
static const char* API_HOST      = "http://192.168.1.50:8000"; // LAN dev; use https:// in prod
static const char* DEVICE_ID     = "Drone_01";
static const char* DEVICE_SECRET = "dev-secret-drone-01";
static const char* FIRMWARE_VERSION = "v0.1.0";

// ── Sensor pins (adjust to your wiring) ───────────────────────────────────
static const int PIN_MOS    = 34;   // MQ-series analog out
static const int PIN_PID    = 35;   // PID analog out
static const int PIN_ECHEM  = 32;   // electrochemical analog out
static const int PIN_HEATER = 25;   // MOS heater control (MOSFET)

// ── Tuning ────────────────────────────────────────────────────────────────
static const unsigned long SENSOR_PERIOD_MS  = 1000;                    // read every 1s
static const unsigned long OTA_POLL_INTERVAL = 6UL * 3600UL * 1000UL;   // 6h
static const unsigned long PREHEAT_MS        = 120000;                  // 2 min MOS preheat
static const float         SEND_THRESHOLD    = 90.0f;                   // alert confidence cutoff
static const int           NVS_MAX_BUFFER    = 40;                      // offline buffer cap (rows)

// ── State ─────────────────────────────────────────────────────────────────
Preferences nvs;
unsigned long tOta = 0;
unsigned long heaterOnAt = 0;
int bufferedCount = 0;                 // rows waiting in NVS
bool preheated = false;

// ═══════════════════════════════════════════════════════════════════════════
// EI_HOOK: Edge Impulse include + classifier — uncomment after adding library
// ═══════════════════════════════════════════════════════════════════════════
// #include <chembase_inferencing.h>   // <- Edge Impulse exported library name
//
// static float feature_buffer[EI_CLASSIFIER_RAW_SAMPLE_COUNT * 3]; // mos,pid,echem
// static int ei_sensor_data(size_t offset, int32_t length, float *out_ptr) {
//   memcpy(out_ptr, feature_buffer + offset, length * sizeof(float));
//   return EIDSP_OK;
// }
//
// // Returns best label + confidence 0-100
// struct Classification { const char* label; float confidence; };
// Classification classify() {
//   signal_t sig;
//   sig.total_length = EI_CLASSIFIER_RAW_SAMPLE_COUNT * 3;
//   sig.get_data = &ei_sensor_data;
//   ei_impulse_result_t result = { 0 };
//   run_classifier(&sig, &result, false);
//   float best = 0; size_t best_i = 0;
//   for (size_t i = 0; i < EI_CLASSIFIER_LABEL_COUNT; i++) {
//     if (result.classification[i].value > best) { best = result.classification[i].value; best_i = i; }
//   }
//   return { result.classification[best_i].label, best * 100.0f };
// }

// ═══════════════════════════════════════════════════════════════════════════
// NVS offline buffer — rows survive power loss, flushed when Wi-Fi returns
// ═══════════════════════════════════════════════════════════════════════════
void nvs_save_row(const String& json) {
  String key = "row" + String(bufferedCount % NVS_MAX_BUFFER);
  nvs.putString(key.c_str(), json);
  bufferedCount = min(bufferedCount + 1, NVS_MAX_BUFFER);
  nvs.putInt("count", bufferedCount);
}

String nvs_read_row(int i) {
  return nvs.getString(("row" + String(i)).c_str(), "");
}

void nvs_clear_row(int i) {
  nvs.putString(("row" + String(i)).c_str(), "");
}

// Returns true if all rows flushed
bool nvs_flush_buffer(bool (*sender)(const String&)) {
  if (bufferedCount == 0) return true;
  Serial.printf("[NVS] Flushing %d buffered rows...\n", bufferedCount);
  for (int i = 0; i < NVS_MAX_BUFFER; i++) {
    String row = nvs_read_row(i);
    if (row.length() == 0) continue;
    if (sender(row)) {
      nvs_clear_row(i);
    } else {
      return false;  // still offline — keep the rest for later
    }
  }
  bufferedCount = 0;
  nvs.putInt("count", 0);
  return true;
}

// ═══════════════════════════════════════════════════════════════════════════
// Networking — HTTP ingest (TLS in prod; headers carry device identity)
// ═══════════════════════════════════════════════════════════════════════════
bool post_alert(const String& json) {
  HTTPClient http;

  if (String(API_HOST).startsWith("https")) {
    WiFiClientSecure tls;
    // TODO prod: replace with tls.setCACert(ROOT_CA) — never ship setInsecure()
    tls.setInsecure();
    http.begin(tls, String(API_HOST) + "/api/telemetry");
  } else {
    http.begin(String(API_HOST) + "/api/telemetry");
  }

  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-Id", DEVICE_ID);
  http.addHeader("X-Device-Secret", DEVICE_SECRET);
  int code = http.POST(json);
  http.end();
  return (code == 200 || code == 201);
}

// ═══════════════════════════════════════════════════════════════════════════
// Sensors — MOS preheat + fused reading
// ═══════════════════════════════════════════════════════════════════════════
struct Reading { float mos; float pid; float echem; };

Reading read_sensors() {
  Reading r;
#if defined(EI_SIM_MODE) || 1   // SIM MODE — replace via EI_HOOK below
  static unsigned long bootMs = millis();
  float baseline = (millis() - bootMs > PREHEAT_MS) ? 1.0f : 0.35f; // MOS low before preheat
  r.mos   = baseline * (400.0f + (random(-30, 30) / 10.0f));
  r.pid   = baseline * (2.0f  + (random(0, 40) / 100.0f));
  r.echem = baseline * (15.0f + (random(0, 60) / 10.0f));
  return r;
#endif

  // EI_HOOK: real reads once your ADC scaling is known:
  // r.mos   = analogReadMilliVolts(PIN_MOS)   / 1000.0f;
  // r.pid   = analogReadMilliVolts(PIN_PID)   / 1000.0f;
  // r.echem = analogReadMilliVolts(PIN_ECHEM) / 1000.0f;
  // return r;
}

// ═══════════════════════════════════════════════════════════════════════════
// OTA — device polls manifest, verifies sha256, flashes (skeleton)
// ═══════════════════════════════════════════════════════════════════════════
void check_ota() {
  HTTPClient http;
  String url = String(API_HOST) + "/api/firmware/latest?arch=esp32&current=" + FIRMWARE_VERSION;
  http.begin(url);
  int code = http.GET();
  if (code != 200) { http.end(); return; }

  JsonDocument doc;   // ArduinoJson v7
  DeserializationError err = deserializeJson(doc, http.getString());
  http.end();
  if (err) return;

  if (!doc["update_available"].as<bool>()) return;

  const char* version = doc["version"] | "?";
  const char* expect  = doc["sha256"]  | "";
  const char* dl      = doc["download_url"] | "";

  if (dl[0] == '\0') {
    Serial.println("[OTA] No download_url yet — see firmware/README.md step 5");
    return;
  }

  Serial.printf("[OTA] Update to %s available (sha256 %s)\n", version, expect);
  // OTA_HOOK — implement per firmware/README.md step 5. Rules:
  //   1. Never flash below 50% battery
  //   2. HTTPClient stream → Update.writeStream(), computing sha256 as you go
  //   3. Only Update.end() + reboot if computed sha256 == expected
  //   4. Keep previous version slot for rollback (Update.rollback-ready layout)
}

// ═══════════════════════════════════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════════════════════════════════
void setup() {
  Serial.begin(115200);
  nvs.begin("chembase", false);
  bufferedCount = nvs.getInt("count", 0);

  pinMode(PIN_HEATER, OUTPUT);
  digitalWrite(PIN_HEATER, HIGH);          // heater on — preheat clock starts
  heaterOnAt = millis();

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  Serial.print("[WiFi] connecting");
  while (WiFi.status() != WL_CONNECTED) { delay(400); Serial.print("."); }
  Serial.printf("\n[WiFi] connected, IP %s\n", WiFi.localIP().toString().c_str());
  Serial.printf("[BOOT] %s ready (%s). MOS preheat %lus. %d rows buffered.\n",
                DEVICE_ID, FIRMWARE_VERSION, PREHEAT_MS / 1000, bufferedCount);
}

void loop() {
  unsigned long now = millis();
  static unsigned long tSensor = 0;

  // 1) Sensor + classify every 1s
  if (now - tSensor >= SENSOR_PERIOD_MS) {
    tSensor = now;
    Reading r = read_sensors();

    // SIM classification until EI is wired:
    float conf = (r.mos > 450.0f) ? (float)random(90, 99) : 0.0f;
    const char* threat = (conf > 0) ? "VOC Complex" : nullptr;

    // EI_HOOK: replace the 2 lines above with:
    //   Classification c = classify();
    //   float conf = c.confidence;
    //   const char* threat = (c.confidence >= SEND_THRESHOLD) ? c.label : nullptr;

    if (conf >= SEND_THRESHOLD && threat != nullptr) {
      JsonDocument doc;
      doc["device_id"]  = DEVICE_ID;
      doc["threat"]     = threat;
      doc["confidence"] = conf;
      doc["lat"]        = 33.6844;   // EI_HOOK: wire GPS (NEO-6M) serial here
      doc["lng"]        = 73.0479;
      // device_ts omitted → backend stamps server time
      String json;
      serializeJson(doc, json);

      if (WiFi.status() == WL_CONNECTED && post_alert(json)) {
        Serial.println("[TX] alert sent");
      } else {
        nvs_save_row(json);
        Serial.println("[TX] offline/failed — buffered to NVS");
      }
    }

    if (!preheated && now - heaterOnAt >= PREHEAT_MS) {
      preheated = true;
      Serial.println("[MOS] preheat complete — readings now valid");
    }
  }

  // 2) Flush buffered rows when back online
  if (WiFi.status() == WL_CONNECTED && bufferedCount > 0) {
    nvs_flush_buffer(&post_alert);
  }

  // 3) OTA poll every 6h (first poll right after boot)
  if (tOta == 0 || now - tOta >= OTA_POLL_INTERVAL) {
    tOta = now;
    check_ota();
  }

  delay(10);
}
