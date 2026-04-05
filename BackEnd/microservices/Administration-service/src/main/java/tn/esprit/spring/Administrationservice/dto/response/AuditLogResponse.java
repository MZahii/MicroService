package tn.esprit.spring.Administrationservice.dto.response;

import lombok.Builder;
import lombok.Getter;
import tn.esprit.spring.Administrationservice.entity.AuditLog;

import java.time.LocalDateTime;

@Getter
@Builder
public class AuditLogResponse {
    private Long id;
    private String entityType;
    private Long entityId;
    private Long scopeId;
    private String action;
    private String actor;
    private String oldValue;
    private String newValue;
    private LocalDateTime createdAt;

    public static AuditLogResponse from(AuditLog audit) {
        return AuditLogResponse.builder()
                .id(audit.getId())
                .entityType(audit.getEntityType())
                .entityId(audit.getEntityId())
                .scopeId(audit.getScopeId())
                .action(audit.getAction())
                .actor(audit.getActor())
                .oldValue(audit.getOldValue())
                .newValue(audit.getNewValue())
                .createdAt(audit.getCreatedAt())
                .build();
    }
}
