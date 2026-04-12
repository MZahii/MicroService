package tn.esprit.spring.Administrationservice.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/contracts")
public class ContractController {

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllContracts(
            @RequestParam(value = "includeDeleted", defaultValue = "false") boolean includeDeleted) {
        return ResponseEntity.ok(Collections.emptyList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getContract(@PathVariable Long id) {
        return ResponseEntity.ok(Map.of("id", id, "status", "active"));
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createContract(@RequestBody Map<String, Object> contract) {
        return ResponseEntity.ok(contract);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateContract(@PathVariable Long id, @RequestBody Map<String, Object> contract) {
        contract.put("id", id);
        return ResponseEntity.ok(contract);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteContract(@PathVariable Long id) {
        return ResponseEntity.noContent().build();
    }
}
