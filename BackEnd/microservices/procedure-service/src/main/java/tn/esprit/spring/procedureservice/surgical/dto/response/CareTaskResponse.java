package tn.esprit.spring.procedureservice.surgical.dto.response;

import java.util.UUID;

public record CareTaskResponse(Long id, UUID surgicalCaseId, String title, boolean done) {
}
