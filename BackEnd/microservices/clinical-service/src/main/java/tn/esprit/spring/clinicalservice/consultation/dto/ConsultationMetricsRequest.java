package tn.esprit.spring.clinicalservice.consultation.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ConsultationMetricsRequest {
    private Double heightCm;
    private Double creatinineMgDl;
    private Double weightKg;
    private Integer ageYears;
}
