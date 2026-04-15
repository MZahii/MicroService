package tn.esprit.spring.Administrationservice.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PlaceEquipmentRequest {
    @NotNull(message = "equipmentId is required")
    private Long equipmentId;
}
