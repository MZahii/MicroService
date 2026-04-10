package tn.esprit.spring.Administrationservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.esprit.spring.Administrationservice.entity.DomainEventLog;

public interface DomainEventLogRepository extends JpaRepository<DomainEventLog, Long> {
}
