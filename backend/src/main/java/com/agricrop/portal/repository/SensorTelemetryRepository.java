package com.agricrop.portal.repository;

import com.agricrop.portal.model.SensorTelemetry;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SensorTelemetryRepository extends MongoRepository<SensorTelemetry, String> {
}