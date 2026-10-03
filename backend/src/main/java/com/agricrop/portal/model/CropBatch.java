package com.agricrop.portal.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "crop_batches")
public class CropBatch {
    @Id
    private String id;
    private String name;
    private String variety;
    private String zone;
    private String area;
    private String plantingDate;
    private String harvestDate;
    private String stage;
    private String status;

    public CropBatch() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getVariety() { return variety; }
    public void setVariety(String variety) { this.variety = variety; }
    public String getZone() { return zone; }
    public void setZone(String zone) { this.zone = zone; }
    public String getArea() { return area; }
    public void setArea(String area) { this.area = area; }
    public String getPlantingDate() { return plantingDate; }
    public void setPlantingDate(String plantingDate) { this.plantingDate = plantingDate; }
    public String getHarvestDate() { return harvestDate; }
    public void setHarvestDate(String harvestDate) { this.harvestDate = harvestDate; }
    public String getStage() { return stage; }
    public void setStage(String stage) { this.stage = stage; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}