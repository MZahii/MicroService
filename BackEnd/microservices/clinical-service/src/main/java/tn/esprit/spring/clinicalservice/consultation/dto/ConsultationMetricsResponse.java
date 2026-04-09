package tn.esprit.spring.clinicalservice.consultation.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Builder
public class ConsultationMetricsResponse {
    private UUID id;
    private UUID consultationId;
    private Long patientId;
    private Double heightCm;
    private Double creatinineMgDl;
    private Double weightKg;
    private Integer ageYears;
    private Double egfr;
    private String ckdStage;
    private Boolean alertLowEgfr;
    private Boolean alertRapidDecline;
    private String alertMessage;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
