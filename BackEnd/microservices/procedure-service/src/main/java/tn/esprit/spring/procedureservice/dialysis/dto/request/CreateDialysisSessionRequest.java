package tn.esprit.spring.procedureservice.dialysis.dto.request;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

public record CreateDialysisSessionRequest(@NotNull Long planId, @NotNull LocalDateTime sessionDate, String notes) {
}
