package tn.esprit.spring.clinicalservice.consultation.metrics;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "consultation_metrics")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConsultationMetrics {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "consultation_id", nullable = false, unique = true)
    private UUID consultationId;

    @Column(name = "patient_id", nullable = false)
    private Long patientId;

    @Column(name = "height_cm")
    private Double heightCm;

    @Column(name = "creatinine_mg_dl")
    private Double creatinineMgDl;

    @Column(name = "weight_kg")
    private Double weightKg;

    @Column(name = "age_years")
    private Integer ageYears;

    @Column(name = "egfr")
    private Double egfr;

    @Enumerated(EnumType.STRING)
    @Column(name = "ckd_stage")
    private CkdStage ckdStage;

    @Column(name = "alert_low_egfr")
    private Boolean alertLowEgfr;

    @Column(name = "alert_rapid_decline")
    private Boolean alertRapidDecline;

    @Column(name = "alert_message", columnDefinition = "text")
    private String alertMessage;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        if (updatedAt == null) {
            updatedAt = now;
        }
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
