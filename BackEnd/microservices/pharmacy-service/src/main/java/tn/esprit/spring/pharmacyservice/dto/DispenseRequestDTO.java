package tn.esprit.spring.pharmacyservice.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DispenseRequestDTO {
    private Long batchId;
    private Integer quantity;
   // private String patientId;   // reference to patient-service
   // private String prescriptionId; // reference to clinical-service
}
