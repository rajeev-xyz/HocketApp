⁠⁠⁠#include "WiFiEsp.h"

#include <Wire.h>
#include <MPU6050.h>

MPU6050 mpu;
char flag;


// Emulate Serial1 on pins 6/7 if not present
#ifndef HAVE_HWSERIAL1
#include "SoftwareSerial.h"
SoftwareSerial Serial1(10, 11); // RX, TX
#endif

char ssid[] = "Boo";            // your network SSID (name)
char pass[] = "darth632@";        // your network password
int status = WL_IDLE_STATUS;     // the Wifi radio's status
//http://hockett.herokuapp.com/hockett/upload/123?f1=12&f2=343&f3=34&f4=33&f5=45
char server[] = "52.3.227.11";

// Initialize the Ethernet client object
WiFiEspClient client;

void setup()
{
  // initialize serial for debugging
  Serial.begin(115200);
  // initialize serial for ESP module
  Serial1.begin(9600);
  // initialize ESP module
  WiFi.init(&Serial1);

  // check for the presence of the shield
  if (WiFi.status() == WL_NO_SHIELD) {
    Serial.println("WiFi shield not present");
    // don't continue
    while (true);
  }

  // attempt to connect to WiFi network
  while ( status != WL_CONNECTED) {
    Serial.print("Attempting to connect to WPA SSID: ");
    Serial.println(ssid);
    // Connect to WPA/WPA2 network
    status = WiFi.begin(ssid, pass);
  }

  // you're connected now, so print out the data
  Serial.println("You're connected to the network");
  
  printWifiStatus();

  Serial.println();
  Serial.println("Starting connection to server...");


//Starting configuring the fingers pins
  pinMode(4,INPUT);
  pinMode(5,INPUT);
  pinMode(6,INPUT);
  pinMode(7,INPUT);
  pinMode(8,INPUT);
  pinMode(9,OUTPUT);


//MPU6050 Setup begins
 Serial.println("Initialize MPU6050");

  while(!mpu.begin(MPU6050_SCALE_2000DPS, MPU6050_RANGE_2G))
  {
    Serial.println("Could not find a valid MPU6050 sensor, check wiring!");
    delay(500);
  }

}

void loop()
{ 
//Finegers data collection Starts
  int    f1n= digitalRead(4);
  String f1 = String(f1n);
  String f2 = String(digitalRead(5));
  String f3 = String(digitalRead(6));
  String f4 = String(digitalRead(7));
  String f5 = String(digitalRead(8));
//Finger Data Collection Stops

//MPU6050 Data Collection Starts

  Vector normAccel = mpu.readNormalizeAccel();

  // Calculate Pitch & Roll
  int pitch = -(atan2(normAccel.XAxis, sqrt(normAccel.YAxis*normAccel.YAxis + normAccel.ZAxis*normAccel.ZAxis))*180.0)/M_PI;
  int roll = (atan2(normAccel.YAxis, normAccel.ZAxis)*180.0)/M_PI;

  // Output
int p=0;
  Serial.print(" Roll = ");
  Serial.print(roll);
  if (roll>160 || roll <-160){
     p = 0;
    }
    else{
       p = 1;
      }
  Serial.println(); 
 //MPU6050 Data Collection Stops
 String ps = String(p);
// Serial.println(" *** ");
// Serial.print("f1n=");
// Serial.println(f1n);
// Serial.println("*****");
if(f1n == 1){
                                      Serial.println("Starting connection to server...");
                                      // if you get a connection, report back via serial
                                      if (client.connect(server, 80)) {
                                        Serial.println("Connected to server");
                                        // Make a HTTP request
                                      String cmd = "GET /hockett/upload/123?p="+ ps +"&f1="+f1+"&f2="+f2+"&f3="+f3+"&f4="+f4+"&f5="+f5+" HTTP/1.1";
                                        Serial.println(cmd);
                                        client.println(cmd);
                                        client.println("Host: 52.3.227.11");
                                        client.println("Connection: close");
                                        client.println();
                                      }
                 
                                      // if there are incoming bytes available
                                      // from the server, read them and print them
                                      while (client.available()) {
                                        char c = client.read();
                                        Serial.write(c);
                                        flag=c;
                                      }
                                      f1n = 0;
                                      Serial.println("***********Flag");
                                      Serial.println(flag);
                                      Serial.println("*********");
                                      if( strcmp(flag, '1') == 0 ){
                                        Serial.println("Flag is 1");
                                        }
                                        else if(strcmp(flag, '1') == 1 ){
                                          Serial.println("Flag is 0");
                                          digitalWrite(9,HIGH);
                                          delay(500);
                                          digitalWrite(9,LOW);
                                          }

                                          else{
                                            Serial.println("Flag is undefined");
                                            digitalWrite(9,HIGH);
                                          delay(500);
                                          digitalWrite(9,LOW);
                                            }
                          delay(1200);
                      }

delay(300);

}


void printWifiStatus()
{
  // print the SSID of the network you're attached to
  Serial.print("SSID: ");
  Serial.println(WiFi.SSID());

  // print your WiFi shield's IP address
  IPAddress ip = WiFi.localIP();
  Serial.print("IP Address: ");
  Serial.println(ip);

  // print the received signal strength
  long rssi = WiFi.RSSI();
  Serial.print("Signal strength (RSSI):");
  Serial.print(rssi);
  Serial.println(" dBm");
}