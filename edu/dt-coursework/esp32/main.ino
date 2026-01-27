#include <WiFi.h>
#include <HTTPClient.h>

const char* ssid = "Wokwi-GUEST";
const char* password = "";
const char* baseUrl = "http://nea-lights.masongibbs82.workers.dev";

int rows[] = {13, 12, 14, 27, 26};
unsigned long lastCheckTime = 0;

void setup() {
  Serial.begin(115200);
  for (int i = 0; i < 5; i++) {
    pinMode(rows[i], OUTPUT);
    digitalWrite(rows[i], HIGH); 
  }
  Serial.println("Starting to connect to wifi...");
  WiFi.begin(ssid, password);
  Serial.print("Connecting to wifi");
  while (WiFi.status() != WL_CONNECTED) { delay(100); Serial.print("."); }
}

void loop() {
  if (millis() - lastCheckTime > 4000) {
    Serial.println("Checking worker...");
    lastCheckTime = millis();
    
    HTTPClient http;
    http.begin(String(baseUrl) + "/");
    int httpCode = http.GET();

    if (httpCode == 200) {
      String response = http.getString();
      
      if (response == "true") {
        
        
        http.begin(String(baseUrl) + "/deactivate");
        http.GET(); 
        
        Serial.println("Trigger received...");
        
        for (int blink = 0; blink < 20; blink++) {
          for (int i = 0; i < 5; i++) digitalWrite(rows[i], LOW);
          delay(150);
          for (int i = 0; i < 5; i++) digitalWrite(rows[i], HIGH);
          delay(150);
        }
      }
    }
    http.end();
  }

  for (int i = 0; i < 5; i++) { digitalWrite(rows[i], HIGH); }
}
