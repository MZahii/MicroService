package tn.esprit.spring.procedureservice.surgical.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

public record CreateSurgicalCaseRequest(
    @NotNull UUID patientId,
    UUID consultationId,
    UUID appointmentId,
    @NotBlank String firstName,
    @NotBlank String lastName,
    @NotNull Integer age,
    @NotBlank String gender,
    @NotBlank String medicalRecordNumber,
    @NotBlank String surgeryType,
    @NotBlank String procedureName,
    @NotBlank String surgeryCategory,
    @NotBlank String urgencyLevel,
    @NotNull UUID surgeonId,
    UUID assistantSurgeonId,
    UUID anesthesiologistId,
    String nurseTeam,
    @NotNull LocalDate scheduledDate,
    @NotNull LocalTime scheduledStartTime,
    @NotNull Integer estimatedDurationMinutes,
    String operatingRoom,
    @NotBlank String status
) {
}
