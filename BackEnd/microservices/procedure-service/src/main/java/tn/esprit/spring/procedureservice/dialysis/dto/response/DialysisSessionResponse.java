package tn.esprit.spring.procedureservice.dialysis.dto.response;

import java.time.LocalDateTime;
import java.util.UUID;

public record DialysisSessionResponse(
    UUID id,
    Long planId,
    UUID patientId,
    UUID consultationId,
    UUID appointmentId,
    LocalDateTime sessionDate,
    String notes,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
}
