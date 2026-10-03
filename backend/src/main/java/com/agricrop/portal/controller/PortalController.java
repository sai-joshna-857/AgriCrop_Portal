package com.agricrop.portal.controller;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.agricrop.portal.model.CropBatch;
import com.agricrop.portal.model.SensorTelemetry;
import com.agricrop.portal.model.User;
import com.agricrop.portal.repository.CropBatchRepository;
import com.agricrop.portal.repository.SensorTelemetryRepository;
import com.agricrop.portal.repository.UserRepository;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:5173")
public class PortalController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CropBatchRepository cropBatchRepository;

    @Autowired
    private SensorTelemetryRepository telemetryRepository;

    // --- Authentication & User Endpoints ---

    @PostMapping("/auth/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> creds) {
        String email = creds.get("email");
        String password = creds.get("password");

        if ("farmer.john@example.com".equalsIgnoreCase(email) && "password123".equals(password)) {
            Map<String, Object> resp = new HashMap<>();
            resp.put("success", true);
            resp.put("email", email);
            resp.put("fullName", "Farmer John");
            resp.put("role", "farmer");
            return ResponseEntity.ok(resp);
        }

        Optional<User> user = userRepository.findByEmail(email);
        if (user.isPresent() && user.get().getPassword().equals(password)) {
            Map<String, Object> resp = new HashMap<>();
            resp.put("success", true);
            resp.put("email", user.get().getEmail());
            resp.put("fullName", user.get().getFullName());
            resp.put("role", user.get().getRole());
            return ResponseEntity.ok(resp);
        }

        return ResponseEntity.status(401).body(Collections.singletonMap("error", "Invalid credentials"));
    }

    @PostMapping({"/auth/register", "/users"})
    public ResponseEntity<?> registerUser(@RequestBody User newUser) {
        if (newUser.getEmail() == null || newUser.getEmail().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Email is required"));
        }

        if (userRepository.findByEmail(newUser.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Email already registered"));
        }

        if (newUser.getId() == null || newUser.getId().isEmpty()) {
            newUser.setId("USR-00" + (userRepository.count() + 1));
        }

        if (newUser.getRole() == null || newUser.getRole().isEmpty()) {
            newUser.setRole("farmer");
        }

        User savedUser = userRepository.save(newUser);
        return ResponseEntity.ok(savedUser);
    }

    @GetMapping("/users")
    public List<User> getUsers() {
        return userRepository.findAll();
    }

    // --- Crop Batches Endpoints ---

    @GetMapping("/batches")
    public List<CropBatch> getBatches() {
        return cropBatchRepository.findAll();
    }

    @PostMapping("/batches")
    public CropBatch addBatch(@RequestBody CropBatch batch) {
        if (batch.getId() == null || batch.getId().isEmpty()) {
            batch.setId("BAT-2026-00" + (cropBatchRepository.count() + 1));
        }
        if (batch.getStage() == null) batch.setStage("Planted");
        if (batch.getStatus() == null) batch.setStatus("Active");
        return cropBatchRepository.save(batch);
    }

    // --- Sensor Telemetry Endpoints ---

    @GetMapping("/telemetry")
    public List<SensorTelemetry> getTelemetry() {
        return telemetryRepository.findAll();
    }

    @PostMapping("/telemetry")
    public SensorTelemetry saveTelemetry(@RequestBody SensorTelemetry telemetry) {
        if (telemetry.getId() == null || telemetry.getId().isEmpty()) {
            telemetry.setId("TEL-00" + (telemetryRepository.count() + 1));
        }
        if (telemetry.getRecordedAt() == null || telemetry.getRecordedAt().isEmpty()) {
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
            telemetry.setRecordedAt(LocalDateTime.now().format(formatter));
        }
        if (telemetry.getStatus() == null || telemetry.getStatus().isEmpty()) {
            telemetry.setStatus("Optimal");
        }
        return telemetryRepository.save(telemetry);
    }
}