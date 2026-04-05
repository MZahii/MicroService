package tn.esprit.spring.procedureservice.surgical.repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import tn.esprit.spring.procedureservice.surgical.domain.entity.PreOpAssessment;

public interface PreOpAssessmentRepository extends JpaRepository<PreOpAssessment, Long> {
    Optional<PreOpAssessment> findTopBySurgicalCaseIdOrderByIdDesc(Long surgicalCaseId);
}
