package tn.esprit.spring.Administrationservice.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MoveStaffWorkspaceAssignmentRequest {

    @NotNull(message = "workspaceId is required")
    private Long workspaceId;
}
