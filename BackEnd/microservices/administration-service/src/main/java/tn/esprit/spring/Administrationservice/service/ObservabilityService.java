package tn.esprit.spring.Administrationservice.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import tn.esprit.spring.Administrationservice.entity.AuditLog;
import tn.esprit.spring.Administrationservice.entity.DomainEventLog;
import tn.esprit.spring.Administrationservice.entity.Notification;
import tn.esprit.spring.Administrationservice.repository.AuditLogRepository;
import tn.esprit.spring.Administrationservice.repository.DomainEventLogRepository;
import tn.esprit.spring.Administrationservice.repository.NotificationRepository;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ObservabilityService {

    private final AuditLogRepository auditLogRepository;
    private final DomainEventLogRepository domainEventLogRepository;
    private final NotificationRepository notificationRepository;
    private final ObjectMapper objectMapper;

    public void recordAudit(String entityType, Long entityId, Long scopeId, String action, Object oldValue, Object newValue) {
        auditLogRepository.save(
                AuditLog.builder()
                        .entityType(entityType)
                        .entityId(entityId)
                        .scopeId(scopeId)
                        .action(action)
                        .actor(resolveActor())
                        .oldValue(writeJson(oldValue))
                        .newValue(writeJson(newValue))
                        .build()
        );
    }

    public void emitEvent(String eventType, String aggregateType, Long aggregateId, Object payload) {
        domainEventLogRepository.save(
                DomainEventLog.builder()
                        .eventType(eventType)
                        .aggregateType(aggregateType)
                        .aggregateId(aggregateId)
                        .payload(writeJson(payload))
                        .build()
        );
    }

    public void pushNotification(String type, String title, String message, Long targetUserId) {
        notificationRepository.save(
                Notification.builder()
                        .type(type)
                        .title(title)
                        .message(message)
                        .targetUserId(targetUserId)
                        .build()
        );
    }

    private String resolveActor() {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes != null && attributes.getRequest() != null) {
            String actor = attributes.getRequest().getHeader("X-Actor-Username");
            if (actor != null && !actor.isBlank()) {
                return actor.trim();
            }
            String authorization = attributes.getRequest().getHeader("Authorization");
            String fromToken = extractUsernameFromBearer(authorization);
            if (fromToken != null && !fromToken.isBlank()) {
                return fromToken.trim();
            }
        }
        return "SYSTEM";
    }

    private String extractUsernameFromBearer(String authorization) {
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            return null;
        }
        try {
            String token = authorization.substring(7);
            String[] parts = token.split("\\.");
            if (parts.length < 2) {
                return null;
            }
            byte[] decoded = Base64.getUrlDecoder().decode(parts[1]);
            Map<?, ?> claims = objectMapper.readValue(new String(decoded, StandardCharsets.UTF_8), Map.class);
            Object preferred = claims.get("preferred_username");
            if (preferred instanceof String preferredUsername && !preferredUsername.isBlank()) {
                return preferredUsername;
            }
            Object sub = claims.get("sub");
            return (sub instanceof String) ? (String) sub : null;
        } catch (Exception ignored) {
            return null;
        }
    }

    private String writeJson(Object value) {
        if (value == null) return null;
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException ex) {
            return String.valueOf(value);
        }
    }
}
