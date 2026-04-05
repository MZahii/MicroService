package tn.esprit.spring.Administrationservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import tn.esprit.spring.Administrationservice.entity.PatientProfile;

import java.util.List;

public interface PatientProfileRepository extends JpaRepository<PatientProfile, Long> {
    List<PatientProfile> findByGuardianUserId(Long guardianUserId);

    @Query("""
            select count(p) from PatientProfile p
            where p.firstName is null or trim(p.firstName) = ''
               or p.lastName is null or trim(p.lastName) = ''
               or p.dateOfBirth is null
               or p.sex is null
               or p.bloodType is null or trim(p.bloodType) = ''
            """)
    long countProfilesMissingRequiredData();
}
