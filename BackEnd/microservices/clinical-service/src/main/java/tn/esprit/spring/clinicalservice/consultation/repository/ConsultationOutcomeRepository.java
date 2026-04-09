package tn.esprit.spring.clinicalservice.consultation.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.esprit.spring.clinicalservice.consultation.entity.ConsultationOutcome;

import java.util.Optional;
import java.util.UUID;

public interface ConsultationOutcomeRepository extends JpaRepository<ConsultationOutcome, UUID> {
    Optional<ConsultationOutcome> findByConsultationId(UUID consultationId);
}
