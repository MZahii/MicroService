package tn.esprit.spring.pharmacyservice.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import tn.esprit.spring.pharmacyservice.repository.MedicationRepository;
import tn.esprit.spring.pharmacyservice.repository.StockRepository;
import tn.esprit.spring.pharmacyservice.repository.BatchRepository;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/diagnostic")
@RequiredArgsConstructor
public class DiagnosticController {

    private final MedicationRepository medicationRepository;
    private final StockRepository stockRepository;
    private final BatchRepository batchRepository;

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        log.info("Diagnostic health check requested");
        Map<String, Object> health = new HashMap<>();
        
        try {
            long medicationCount = medicationRepository.count();
            long stockCount = stockRepository.count();
            long batchCount = batchRepository.count();
            
            health.put("status", "UP");
            health.put("database_connection", "OK");
            health.put("medications_count", medicationCount);
            health.put("batches_count", batchCount);
            health.put("stock_entries_count", stockCount);
            
            log.info("Health check successful - Medications: {}, Batches: {}, Stock: {}", 
                    medicationCount, batchCount, stockCount);
            
            return ResponseEntity.ok(health);
        } catch (Exception e) {
            log.error("Health check failed: {}", e.getMessage(), e);
            health.put("status", "DOWN");
            health.put("error", e.getMessage());
            return ResponseEntity.status(503).body(health);
        }
    }
}
