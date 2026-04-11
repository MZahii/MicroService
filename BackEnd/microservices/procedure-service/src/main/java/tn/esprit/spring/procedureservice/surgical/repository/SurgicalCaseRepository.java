package tn.esprit.spring.procedureservice.surgical.repository;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import tn.esprit.spring.procedureservice.surgical.domain.entity.SurgicalCase;

public interface SurgicalCaseRepository extends JpaRepository<SurgicalCase, UUID> {
}
