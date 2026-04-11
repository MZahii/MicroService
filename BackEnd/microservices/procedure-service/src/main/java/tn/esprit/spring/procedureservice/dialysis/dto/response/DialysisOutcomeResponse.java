package tn.esprit.spring.procedureservice.dialysis.dto.response;

import java.util.UUID;

public record DialysisOutcomeResponse(Long id, UUID sessionId, boolean validated, String summary) {
}
