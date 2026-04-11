package tn.esprit.spring.procedureservice.surgical.dto.response;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

public record SurgicalCaseResponse(
    UUID id,
    UUID patientId,
    UUID consultationId,
    UUID appointmentId,
    String firstName,
    String lastName,
    Integer age,
    String gender,
    String medicalRecordNumber,
    String surgeryType,
    String procedureName,
    String surgeryCategory,
    String urgencyLevel,
    UUID surgeonId,
    UUID assistantSurgeonId,
    UUID anesthesiologistId,
    String nurseTeam,
    LocalDate scheduledDate,
    LocalTime scheduledStartTime,
    Integer estimatedDurationMinutes,
    String operatingRoom,
    String status,
    String offerStatus,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
}
