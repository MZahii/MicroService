package tn.esprit.spring.procedureservice.surgical.dto.response;

import java.time.LocalDate;
import java.time.LocalTime;

public record SurgicalCaseResponse(
    Long id,
    String patientId,
    String firstName,
    String lastName,
    Integer age,
    String gender,
    String medicalRecordNumber,
    String surgeryType,
    String procedureName,
    String surgeryCategory,
    String urgencyLevel,
    String surgeonId,
    String assistantSurgeonId,
    String anesthesiologistId,
    String nurseTeam,
    LocalDate scheduledDate,
    LocalTime scheduledStartTime,
    Integer estimatedDurationMinutes,
    String operatingRoom,
    String status,
    String offerStatus
) {
}
