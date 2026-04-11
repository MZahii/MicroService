package tn.esprit.spring.procedureservice.surgical.domain.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

@Entity
@Table(name = "surgical_cases")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SurgicalCase {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(columnDefinition = "BINARY(16)")
    private UUID id;

    // Foreign keys to Clinical Service
    @Column(name = "patient_id", nullable = false, columnDefinition = "BINARY(16)")
    private UUID patientId;

    @Column(name = "consultation_id", columnDefinition = "BINARY(16)")
    private UUID consultationId;

    @Column(name = "appointment_id", columnDefinition = "BINARY(16)")
    private UUID appointmentId;

    // Patient information (denormalized for read performance)
    private String firstName;
    private String lastName;
    private Integer age;
    private String gender;
    private String medicalRecordNumber;

    // Surgery details
    private String surgeryType;
    private String procedureName;
    private String surgeryCategory;
    private String urgencyLevel;

    // Surgical team (UUIDs)
    @Column(columnDefinition = "BINARY(16)")
    private UUID surgeonId;

    @Column(columnDefinition = "BINARY(16)")
    private UUID assistantSurgeonId;

    @Column(columnDefinition = "BINARY(16)")
    private UUID anesthesiologistId;

    private String nurseTeam;

    // Scheduling
    private LocalDate scheduledDate;
    private LocalTime scheduledStartTime;
    private Integer estimatedDurationMinutes;
    private String operatingRoom;

    // Status
    private String status;
    private String offerStatus;

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
