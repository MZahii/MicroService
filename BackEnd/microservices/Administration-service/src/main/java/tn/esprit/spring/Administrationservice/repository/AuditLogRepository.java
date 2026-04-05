package tn.esprit.spring.Administrationservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.esprit.spring.Administrationservice.entity.AuditLog;

import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findByEntityTypeAndScopeIdOrderByCreatedAtDesc(String entityType, Long scopeId);
    List<AuditLog> findTop500ByEntityTypeOrderByCreatedAtDesc(String entityType);
}
