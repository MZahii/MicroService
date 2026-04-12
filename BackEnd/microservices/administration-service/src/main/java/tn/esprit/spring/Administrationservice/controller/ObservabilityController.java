package tn.esprit.spring.Administrationservice.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.*;
import tn.esprit.spring.Administrationservice.dto.request.InternalNotificationRequest;
import tn.esprit.spring.Administrationservice.dto.response.AuditLogResponse;
import tn.esprit.spring.Administrationservice.dto.response.NotificationResponse;
import tn.esprit.spring.Administrationservice.entity.Notification;
import tn.esprit.spring.Administrationservice.repository.AuditLogRepository;
import tn.esprit.spring.Administrationservice.repository.NotificationRepository;
import tn.esprit.spring.Administrationservice.service.ObservabilityService;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/observability")
@RequiredArgsConstructor
public class ObservabilityController {

    private final AuditLogRepository auditLogRepository;
    private final NotificationRepository notificationRepository;
    private final ObservabilityService observabilityService;

    @Value("${internal.api-key}")
    private String internalApiKey;

    @GetMapping("/contracts/staff/{staffUserId}/timeline")
    public List<AuditLogResponse> getStaffContractTimeline(@PathVariable Long staffUserId) {
        return auditLogRepository.findByEntityTypeAndScopeIdOrderByCreatedAtDesc("CONTRACT", staffUserId)
                .stream()
                .map(AuditLogResponse::from)
                .toList();
    }

    @GetMapping("/contracts/timeline")
    public List<AuditLogResponse> getAllContractTimeline() {
        return auditLogRepository.findTop500ByEntityTypeOrderByCreatedAtDesc("CONTRACT")
                .stream()
                .map(AuditLogResponse::from)
                .toList();
    }

    @GetMapping("/notifications")
    public List<NotificationResponse> getNotifications(@RequestParam(required = false) Long userId) {
        List<Notification> notifications = new ArrayList<>();
        if (userId != null) {
            notifications.addAll(notificationRepository.findTop50ByTargetUserIdOrderByCreatedAtDesc(userId));
        }
        notifications.addAll(notificationRepository.findTop50ByTargetUserIdIsNullOrderByCreatedAtDesc());

        return notifications.stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .limit(50)
                .map(NotificationResponse::from)
                .toList();
    }

    @PatchMapping("/notifications/{notificationId}/read")
    public NotificationResponse markAsRead(@PathVariable Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found with id: " + notificationId));
        notification.setRead(true);
        return NotificationResponse.from(notificationRepository.save(notification));
    }

    @PostMapping("/internal/notifications")
    public NotificationResponse pushInternalNotification(
            @RequestBody InternalNotificationRequest request,
            @RequestHeader("X-Internal-Api-Key") String apiKey
    ) {
        if (!internalApiKey.equals(apiKey)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Invalid internal API key");
        }

        observabilityService.pushNotification(
                request.getType(),
                request.getTitle(),
                request.getMessage(),
                request.getTargetUserId()
        );

        Notification latest = notificationRepository.findTop50ByTargetUserIdOrderByCreatedAtDesc(request.getTargetUserId())
                .stream()
                .findFirst()
                .orElseGet(() -> notificationRepository.findTop50ByTargetUserIdIsNullOrderByCreatedAtDesc()
                        .stream()
                        .findFirst()
                        .orElseThrow(() -> new IllegalStateException("Failed to persist notification")));
        return NotificationResponse.from(latest);
    }
}
