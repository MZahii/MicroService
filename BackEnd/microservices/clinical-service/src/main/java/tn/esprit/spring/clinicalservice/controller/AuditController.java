package tn.esprit.spring.clinicalservice.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/clinical/audit")
public class AuditController {

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAuditLogs(
            @RequestParam(value = "limit", defaultValue = "500") int limit) {
        return ResponseEntity.ok(Collections.emptyList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getAuditLog(@PathVariable Long id) {
        return ResponseEntity.ok(Map.of("id", id, "action", "READ"));
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createAuditLog(@RequestBody Map<String, Object> auditLog) {
        return ResponseEntity.ok(auditLog);
    }
}
