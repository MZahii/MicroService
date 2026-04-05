package tn.esprit.spring.procedureservice.dialysis.dto.request;

import jakarta.validation.constraints.NotBlank;

public record UpdateDialysisPlanRequest(@NotBlank String status) {
}
