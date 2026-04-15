package tn.esprit.spring.Administrationservice.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import tn.esprit.spring.Administrationservice.entity.StaffPlacementRole;

@Getter
@Setter
public class CreateStaffWorkspaceAssignmentRequest {

    @NotNull(message = "userId is required")
    private Long userId;

    @NotNull(message = "role is required")
    private StaffPlacementRole role;

    @NotNull(message = "workspaceId is required")
    private Long workspaceId;
}
