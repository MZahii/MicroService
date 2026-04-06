package tn.esprit.spring.pharmacyservice.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DispensationLogDTO {
    private Long id;
    private Long batchId;
    private Integer quantity;
    private LocalDateTime dispensedAt;
}