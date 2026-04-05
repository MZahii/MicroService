package tn.esprit.spring.procedureservice.notification.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record SendEmailRequest(
    @NotBlank @Email String to,
    @NotBlank String subject,
    @NotBlank String html
) {
}
