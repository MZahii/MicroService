package tn.esprit.spring.procedureservice.dialysis.dto.request;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;
import java.util.UUID;

public record CreateDialysisSessionRequest(
    @NotNull Long planId,
    @NotNull UUID patientId,
    UUID consultationId,
    UUID appointmentId,
    @NotNull LocalDateTime sessionDate,
    String notes
) {
}
