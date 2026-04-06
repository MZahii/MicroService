package tn.esprit.spring.pharmacyservice.service;

import lombok.RequiredArgsConstructor;
import tn.esprit.spring.pharmacyservice.dto.BatchDTO;
import tn.esprit.spring.pharmacyservice.dto.MedicationDTO;
import tn.esprit.spring.pharmacyservice.entity.Batch;
import tn.esprit.spring.pharmacyservice.entity.Medication;
import tn.esprit.spring.pharmacyservice.repository.BatchRepository;
import tn.esprit.spring.pharmacyservice.repository.MedicationRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class MedicationService {

    private final MedicationRepository medicationRepository;
    private final BatchRepository batchRepository;

    // ─── Medication CRUD ───────────────────────────────────────────────────────

    public MedicationDTO createMedication(MedicationDTO dto) {
        Medication med = Medication.builder()
                .name(dto.getName())
                .form(dto.getForm())
                .pediatricDosage(dto.getPediatricDosage())
                .build();
        return toMedicationDTO(medicationRepository.save(med));
    }

    public MedicationDTO getMedication(Long id) {
        return toMedicationDTO(findMedById(id));
    }

    public List<MedicationDTO> getAllMedications() {
        return medicationRepository.findAll().stream()
                .map(this::toMedicationDTO)
                .collect(Collectors.toList());
    }

    public MedicationDTO updateMedication(Long id, MedicationDTO dto) {
        Medication med = findMedById(id);
        med.setName(dto.getName());
        med.setForm(dto.getForm());
        med.setPediatricDosage(dto.getPediatricDosage());
        return toMedicationDTO(medicationRepository.save(med));
    }

    public void deleteMedication(Long id) {
        medicationRepository.deleteById(id);
    }

    // ─── Batch CRUD ────────────────────────────────────────────────────────────

    public BatchDTO addBatch(Long medicationId, BatchDTO dto) {
        Medication med = findMedById(medicationId);
        Batch batch = Batch.builder()
                .batchNumber(dto.getBatchNumber())
                .manufactureDate(dto.getManufactureDate())
                .expirationDate(dto.getExpirationDate())
                .quantity(dto.getQuantity())
                .medication(med)
                .build();
        return toBatchDTO(batchRepository.save(batch));
    }

    public List<BatchDTO> getBatchesForMedication(Long medicationId) {
        return batchRepository.findByMedicationMedicationId(medicationId).stream()
                .map(this::toBatchDTO)
                .collect(Collectors.toList());
    }

    public List<BatchDTO> getExpiredBatches() {
        return batchRepository.findExpiredBatches(LocalDate.now()).stream()
                .map(this::toBatchDTO)
                .collect(Collectors.toList());
    }

    public List<BatchDTO> getBatchesExpiringSoon(int days) {
        LocalDate threshold = LocalDate.now().plusDays(days);
        return batchRepository.findBatchesExpiringBefore(LocalDate.now(), threshold).stream()
                .map(this::toBatchDTO)
                .collect(Collectors.toList());
    }

    // ─── Helpers ───────────────────────────────────────────────────────────────

    private Medication findMedById(Long id) {
        return medicationRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Medication not found: " + id));
    }

    private MedicationDTO toMedicationDTO(Medication med) {
        return MedicationDTO.builder()
                .medicationId(med.getMedicationId())
                .name(med.getName())
                .form(med.getForm())
                .pediatricDosage(med.getPediatricDosage())
                .build();
    }

    private BatchDTO toBatchDTO(Batch b) {
        return BatchDTO.builder()
                .batchId(b.getBatchId())
                .batchNumber(b.getBatchNumber())
                .manufactureDate(b.getManufactureDate())
                .expirationDate(b.getExpirationDate())
                .quantity(b.getQuantity())
                .medicationId(b.getMedication().getMedicationId())
                .expired(b.isExpired())
                .build();
    }
}
