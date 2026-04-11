package tn.esprit.spring.procedureservice.surgical.dto.response;

import java.util.UUID;

public record ComplicationResponse(Long id, UUID surgicalCaseId, String description) {
}
