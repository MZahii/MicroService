package tn.esprit.spring.Administrationservice.service;

import tn.esprit.spring.Administrationservice.dto.response.AuditLogResponse;
import tn.esprit.spring.Administrationservice.dto.response.NotificationResponse;

import java.util.List;

/**
 * Service interface for observability operations
 * Handles notifications and audit trails
 */
public interface ObservabilityService {
    /**
     * Get notifications for a user
     * @param userId Optional user ID filter, or null for all
     * @return List of notification responses
     */
    List<NotificationResponse> getNotifications(Long userId);

    /**
     * Mark a notification as read
     * @param notificationId The notification ID
     */
    void markNotificationAsRead(Long notificationId);

    /**
     * Get contract audit timeline/trail
     * @return List of audit log responses
     */
    List<AuditLogResponse> getContractAuditTimeline();
}
