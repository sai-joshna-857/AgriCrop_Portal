package com.agricrop.portal.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "sensor_telemetry")
public class SensorTelemetry {
    @Id
    private String id;
    private String batchId;
    private String deviceId;
    private String recordedAt;
    private String soilMoisture;
    private String soilTemp;
    private String ambientTemp;
    private String humidity;
    private String phLevel;
    private String status;

    public SensorTelemetry() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getBatchId() { return batchId; }
    public void setBatchId(String batchId) { this.batchId = batchId; }
    public String getDeviceId() { return deviceId; }
    public void setDeviceId(String deviceId) { this.deviceId = deviceId; }
    public String getRecordedAt() { return recordedAt; }
    public void setRecordedAt(String recordedAt) { this.recordedAt = recordedAt; }
    public String getSoilMoisture() { return soilMoisture; }
    public void setSoilMoisture(String soilMoisture) { this.soilMoisture = soilMoisture; }
    public String getSoilTemp() { return soilTemp; }
    public void setSoilTemp(String soilTemp) { this.soilTemp = soilTemp; }
    public String getAmbientTemp() { return ambientTemp; }
    public void setAmbientTemp(String ambientTemp) { this.ambientTemp = ambientTemp; }
    public String getHumidity() { return humidity; }
    public void setHumidity(String humidity) { this.humidity = humidity; }
    public String getPhLevel() { return phLevel; }
    public void setPhLevel(String phLevel) { this.phLevel = phLevel; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}