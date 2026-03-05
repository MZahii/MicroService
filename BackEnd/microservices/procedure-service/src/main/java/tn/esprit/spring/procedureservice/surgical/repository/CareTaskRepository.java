package tn.esprit.spring.procedureservice.surgical.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.esprit.spring.procedureservice.surgical.domain.entity.CareTask;

public interface CareTaskRepository extends JpaRepository<CareTask, Long> {
    boolean existsBySurgicalCaseIdAndTitle(Long surgicalCaseId, String title);
}
