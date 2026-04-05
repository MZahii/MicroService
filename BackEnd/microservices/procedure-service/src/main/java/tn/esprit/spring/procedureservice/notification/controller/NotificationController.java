package tn.esprit.spring.procedureservice.notification.controller;

import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import tn.esprit.spring.procedureservice.notification.dto.request.SendEmailRequest;
import tn.esprit.spring.procedureservice.notification.service.ResendEmailService;

@RestController
@RequestMapping("/api/procedures/notifications")
public class NotificationController {
    private final ResendEmailService resendEmailService;

    public NotificationController(ResendEmailService resendEmailService) {
        this.resendEmailService = resendEmailService;
    }

    @PostMapping("/email/test")
    public Map<String, String> sendTestEmail(@Valid @RequestBody SendEmailRequest request) {
        resendEmailService.sendEmail(request.to(), request.subject(), request.html());
        return Map.of("message", "Email sent successfully.");
    }
}
