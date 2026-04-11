package tn.esprit.spring.procedureservice.surgical.dto.response;

import java.util.UUID;

public record PreOpAssessmentResponse(Long id, UUID surgicalCaseId, String notes) {
}
