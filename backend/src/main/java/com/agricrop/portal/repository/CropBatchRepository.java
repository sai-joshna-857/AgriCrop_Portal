package com.agricrop.portal.repository;

import com.agricrop.portal.model.CropBatch;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CropBatchRepository extends MongoRepository<CropBatch, String> {
}