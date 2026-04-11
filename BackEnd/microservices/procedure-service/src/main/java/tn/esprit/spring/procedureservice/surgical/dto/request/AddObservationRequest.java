package tn.esprit.spring.procedureservice.surgical.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record AddObservationRequest(@NotNull UUID surgicalCaseId, @NotBlank String notes) {
}
