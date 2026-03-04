package tn.esprit.spring.Administrationservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.esprit.spring.Administrationservice.entity.PatientProfile;

import java.util.List;

public interface PatientProfileRepository extends JpaRepository<PatientProfile, Long> {
    List<PatientProfile> findByGuardianUserId(Long guardianUserId);
}
