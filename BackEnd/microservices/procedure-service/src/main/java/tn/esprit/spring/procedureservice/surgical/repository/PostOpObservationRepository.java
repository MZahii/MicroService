package tn.esprit.spring.procedureservice.surgical.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.esprit.spring.procedureservice.surgical.domain.entity.PostOpObservation;

public interface PostOpObservationRepository extends JpaRepository<PostOpObservation, Long> {
}
