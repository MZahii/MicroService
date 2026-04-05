package tn.esprit.spring.procedureservice.dialysis.dto.response;

import java.time.LocalDateTime;

public record DialysisSessionResponse(Long id, Long planId, LocalDateTime sessionDate, String notes) {
}
