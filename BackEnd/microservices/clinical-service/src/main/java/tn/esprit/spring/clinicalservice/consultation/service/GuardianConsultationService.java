package tn.esprit.spring.clinicalservice.consultation.service;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import tn.esprit.spring.clinicalservice.consultation.dto.GuardianOutcomeResponse;
import tn.esprit.spring.clinicalservice.consultation.entity.Consultation;
import tn.esprit.spring.clinicalservice.consultation.entity.ConsultationOutcome;
import tn.esprit.spring.clinicalservice.consultation.entity.ConsultationStatus;
import tn.esprit.spring.clinicalservice.consultation.repository.ConsultationOutcomeRepository;
import tn.esprit.spring.clinicalservice.consultation.repository.ConsultationRepository;
import tn.esprit.spring.clinicalservice.patient.PatientDirectoryClient;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GuardianConsultationService {

    private final ConsultationRepository consultationRepository;
    private final ConsultationOutcomeRepository outcomeRepository;
    private final PatientDirectoryClient patientDirectoryClient;

    public GuardianOutcomeResponse getOutcome(UUID consultationId, Long guardianUserId) {
        if (guardianUserId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "guardianUserId is required");
        }

        Consultation consultation = consultationRepository.findById(consultationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Consultation not found"));

        if (consultation.getStatus() == ConsultationStatus.ARCHIVED) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Consultation archived");
        }

        List<Long> patientIds = patientDirectoryClient.getPatientIdsByGuardianUserId(guardianUserId);
        if (patientIds == null || !patientIds.contains(consultation.getPatientId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Forbidden: not your patient");
        }

        ConsultationOutcome outcome = outcomeRepository.findByConsultationId(consultationId).orElse(null);
        if (outcome == null) {
            return GuardianOutcomeResponse.builder()
                    .consultationId(consultationId)
                    .build();
        }

        return GuardianOutcomeResponse.builder()
                .consultationId(consultationId)
                .prescriptions(outcome.getPrescriptions())
                .treatmentPlan(outcome.getTreatmentPlan())
                .updatedAt(outcome.getUpdatedAt())
                .build();
    }
}
