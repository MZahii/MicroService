package tn.esprit.spring.pharmacyservice.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import tn.esprit.spring.pharmacyservice.dto.BatchDTO;
import tn.esprit.spring.pharmacyservice.dto.MedicationDTO;
import tn.esprit.spring.pharmacyservice.service.MedicationService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/medications")
@RequiredArgsConstructor
@Tag(name = "Medications", description = "Medication reference & batch management")
public class MedicationController {

    private final MedicationService medicationService;

    // ─── Medications ──────────────────────────────────────────────────────────

    @PostMapping
    //@PreAuthorize("hasAnyRole('PHARMACIST','PLATFORM_ADMIN')")
    @Operation(summary = "Create a new medication")
    public ResponseEntity<MedicationDTO> create(@RequestBody MedicationDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(medicationService.createMedication(dto));
    }

    @GetMapping
    @Operation(summary = "List all medications")
    public ResponseEntity<List<MedicationDTO>> getAll() {
        return ResponseEntity.ok(medicationService.getAllMedications());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get medication by ID")
    public ResponseEntity<MedicationDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(medicationService.getMedication(id));
    }

    @PutMapping("/{id}")
    //@PreAuthorize("hasAnyRole('PHARMACIST','PLATFORM_ADMIN')")
    @Operation(summary = "Update medication")
    public ResponseEntity<MedicationDTO> update(@PathVariable Long id, @RequestBody MedicationDTO dto) {
        return ResponseEntity.ok(medicationService.updateMedication(id, dto));
    }

    @DeleteMapping("/{id}")
    //@PreAuthorize("hasRole('PLATFORM_ADMIN')")
    @Operation(summary = "Delete medication")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        medicationService.deleteMedication(id);
        return ResponseEntity.noContent().build();
    }

    // ─── Batches ──────────────────────────────────────────────────────────────

    @PostMapping("/{id}/batches")
    //@PreAuthorize("hasAnyRole('PHARMACIST','PLATFORM_ADMIN')")
    @Operation(summary = "Add a batch to medication")
    public ResponseEntity<BatchDTO> addBatch(@PathVariable Long id, @RequestBody BatchDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(medicationService.addBatch(id, dto));
    }

    @GetMapping("/{id}/batches")
    @Operation(summary = "List batches for a medication")
    public ResponseEntity<List<BatchDTO>> getBatches(@PathVariable Long id) {
        return ResponseEntity.ok(medicationService.getBatchesForMedication(id));
    }

    @GetMapping("/batches/expired")
    //@PreAuthorize("hasAnyRole('PHARMACIST','PLATFORM_ADMIN')")
    @Operation(summary = "List all expired batches")
    public ResponseEntity<List<BatchDTO>> getExpired() {
        return ResponseEntity.ok(medicationService.getExpiredBatches());
    }

    @GetMapping("/batches/expiring-soon")
    //@PreAuthorize("hasAnyRole('PHARMACIST','PLATFORM_ADMIN')")
    @Operation(summary = "List batches expiring within N days")
    public ResponseEntity<List<BatchDTO>> getExpiringSoon(
            @RequestParam(defaultValue = "30") int days) {
        return ResponseEntity.ok(medicationService.getBatchesExpiringSoon(days));
    }
}
