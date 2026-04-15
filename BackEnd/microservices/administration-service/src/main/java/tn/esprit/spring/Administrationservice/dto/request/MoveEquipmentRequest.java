package tn.esprit.spring.Administrationservice.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MoveEquipmentRequest {
    @NotNull(message = "targetWorkspaceId is required")
    private Long targetWorkspaceId;
}
