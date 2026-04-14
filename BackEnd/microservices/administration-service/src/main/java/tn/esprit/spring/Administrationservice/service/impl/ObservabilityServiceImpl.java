package tn.esprit.spring.Administrationservice.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import tn.esprit.spring.Administrationservice.dto.response.AuditLogResponse;
import tn.esprit.spring.Administrationservice.dto.response.NotificationResponse;
import tn.esprit.spring.Administrationservice.entity.Notification;
import tn.esprit.spring.Administrationservice.repository.NotificationRepository;
import tn.esprit.spring.Administrationservice.service.ObservabilityService;

import java.util.List;

/**
 * Implementation of ObservabilityService
 * Provides notifications and audit trail functionality
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class ObservabilityServiceImpl implements ObservabilityService {

    private final NotificationRepository notificationRepository;

    @Override
    public List<NotificationResponse> getNotifications(Long userId) {
        log.debug("Fetching notifications for userId: {}", userId);
        List<Notification> notifications;

        if (userId != null) {
            // Get notifications for specific user
            notifications = notificationRepository.findByTargetUserId(userId);
        } else {
            // Get all notifications
            notifications = notificationRepository.findAll();
        }

        return notifications.stream()
                .map(NotificationResponse::from)
                .toList();
    }

    @Override
    public void markNotificationAsRead(Long notificationId) {
        log.debug("Marking notification {} as read", notificationId);
        notificationRepository.findById(notificationId).ifPresent(notification -> {
            notification.setRead(true);
            notificationRepository.save(notification);
            log.info("Notification {} marked as read", notificationId);
        });
    }

    @Override
    public List<AuditLogResponse> getContractAuditTimeline() {
        log.debug("Fetching contract audit timeline");
        // TODO: Implement contract audit trail retrieval
        // For now, return empty list as placeholder
        // When implemented, this should fetch audit logs from DomainEventLog or similar
        return List.of();
    }
}
