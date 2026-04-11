package tn.esprit.spring.procedureservice.dialysis.domain.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "dialysis_sessions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DialysisSession {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(columnDefinition = "BINARY(16)")
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "plan_id")
    private DialysisPlan plan;

    // Foreign key to Patient (from administration-service)
    @Column(name = "patient_id", nullable = false)
    private UUID patientId;

    // Foreign key to Consultation (from clinical-service)
    @Column(name = "consultation_id")
    private UUID consultationId;

    // Foreign key to Appointment (from clinical-service)
    @Column(name = "appointment_id")
    private UUID appointmentId;

    private LocalDateTime sessionDate;
    private String notes;
    
    // Audit fields
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
