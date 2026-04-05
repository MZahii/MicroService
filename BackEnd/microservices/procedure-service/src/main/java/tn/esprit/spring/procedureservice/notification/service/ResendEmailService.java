package tn.esprit.spring.procedureservice.notification.service;

import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import tn.esprit.spring.procedureservice.config.ResendProperties;
import tn.esprit.spring.procedureservice.shared.exception.BusinessException;
import tn.esprit.spring.procedureservice.surgical.domain.entity.SurgicalCase;

@Service
public class ResendEmailService {
    private static final Logger log = LoggerFactory.getLogger(ResendEmailService.class);

    private final ResendProperties resendProperties;
    private final RestClient restClient;

    public ResendEmailService(ResendProperties resendProperties) {
        this.resendProperties = resendProperties;
        this.restClient = RestClient.builder()
            .baseUrl("https://api.resend.com")
            .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
            .build();
    }

    public void sendEmail(String to, String subject, String html) {
        validateConfiguration();

        restClient.post()
            .uri("/emails")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + resendProperties.getApiKey())
            .body(Map.of(
                "from", resendProperties.getFromEmail(),
                "to", new String[]{to},
                "subject", subject,
                "html", html
            ))
            .retrieve()
            .toBodilessEntity();
    }

    public void sendSurgicalCaseCreatedNotification(SurgicalCase surgicalCase) {
        String recipient = normalize(resendProperties.getDemoRecipient());
        if (!resendProperties.isEnabled() || recipient == null) {
            return;
        }

        String patientName = ((surgicalCase.getFirstName() == null ? "" : surgicalCase.getFirstName()) + " "
            + (surgicalCase.getLastName() == null ? "" : surgicalCase.getLastName())).trim();
        String html = """
            <h2>New Surgical Case Created</h2>
            <p>A new surgical case was created in procedure-service.</p>
            <ul>
              <li><strong>Patient:</strong> %s</li>
              <li><strong>Surgery Type:</strong> %s</li>
              <li><strong>Procedure:</strong> %s</li>
              <li><strong>Date:</strong> %s</li>
              <li><strong>Status:</strong> %s</li>
            </ul>
            """.formatted(
            patientName.isBlank() ? "-" : patientName,
            defaultValue(surgicalCase.getSurgeryType()),
            defaultValue(surgicalCase.getProcedureName()),
            surgicalCase.getScheduledDate() != null ? surgicalCase.getScheduledDate().toString() : "-",
            defaultValue(surgicalCase.getStatus())
        );

        try {
            sendEmail(recipient, "New Surgical Case Created", html);
        } catch (Exception ex) {
            log.warn("Resend email notification failed for surgical case {}: {}", surgicalCase.getId(), ex.getMessage());
        }
    }

    private void validateConfiguration() {
        if (!resendProperties.isEnabled()) {
            throw new BusinessException("Resend email is disabled.");
        }
        if (normalize(resendProperties.getApiKey()) == null) {
            throw new BusinessException("Missing resend.api-key configuration.");
        }
        if (normalize(resendProperties.getFromEmail()) == null) {
            throw new BusinessException("Missing resend.from-email configuration.");
        }
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String defaultValue(String value) {
        return normalize(value) == null ? "-" : value;
    }
}
