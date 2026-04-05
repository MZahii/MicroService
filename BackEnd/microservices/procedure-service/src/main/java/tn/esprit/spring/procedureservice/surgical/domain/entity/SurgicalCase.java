package tn.esprit.spring.procedureservice.surgical.domain.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "surgical_cases")
public class SurgicalCase {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String patientId;
    private String firstName;
    private String lastName;
    private Integer age;
    private String gender;
    private String medicalRecordNumber;

    private String surgeryType;
    private String procedureName;
    private String surgeryCategory;
    private String urgencyLevel;

    private String surgeonId;
    private String assistantSurgeonId;
    private String anesthesiologistId;
    private String nurseTeam;

    private LocalDate scheduledDate;
    private LocalTime scheduledStartTime;
    private Integer estimatedDurationMinutes;
    private String operatingRoom;

    private String status;
    private String offerStatus;

    public SurgicalCase() {
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }
    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public Integer getAge() { return age; }
    public void setAge(Integer age) { this.age = age; }
    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }
    public String getMedicalRecordNumber() { return medicalRecordNumber; }
    public void setMedicalRecordNumber(String medicalRecordNumber) { this.medicalRecordNumber = medicalRecordNumber; }
    public String getSurgeryType() { return surgeryType; }
    public void setSurgeryType(String surgeryType) { this.surgeryType = surgeryType; }
    public String getProcedureName() { return procedureName; }
    public void setProcedureName(String procedureName) { this.procedureName = procedureName; }
    public String getSurgeryCategory() { return surgeryCategory; }
    public void setSurgeryCategory(String surgeryCategory) { this.surgeryCategory = surgeryCategory; }
    public String getUrgencyLevel() { return urgencyLevel; }
    public void setUrgencyLevel(String urgencyLevel) { this.urgencyLevel = urgencyLevel; }
    public String getSurgeonId() { return surgeonId; }
    public void setSurgeonId(String surgeonId) { this.surgeonId = surgeonId; }
    public String getAssistantSurgeonId() { return assistantSurgeonId; }
    public void setAssistantSurgeonId(String assistantSurgeonId) { this.assistantSurgeonId = assistantSurgeonId; }
    public String getAnesthesiologistId() { return anesthesiologistId; }
    public void setAnesthesiologistId(String anesthesiologistId) { this.anesthesiologistId = anesthesiologistId; }
    public String getNurseTeam() { return nurseTeam; }
    public void setNurseTeam(String nurseTeam) { this.nurseTeam = nurseTeam; }
    public LocalDate getScheduledDate() { return scheduledDate; }
    public void setScheduledDate(LocalDate scheduledDate) { this.scheduledDate = scheduledDate; }
    public LocalTime getScheduledStartTime() { return scheduledStartTime; }
    public void setScheduledStartTime(LocalTime scheduledStartTime) { this.scheduledStartTime = scheduledStartTime; }
    public Integer getEstimatedDurationMinutes() { return estimatedDurationMinutes; }
    public void setEstimatedDurationMinutes(Integer estimatedDurationMinutes) { this.estimatedDurationMinutes = estimatedDurationMinutes; }
    public String getOperatingRoom() { return operatingRoom; }
    public void setOperatingRoom(String operatingRoom) { this.operatingRoom = operatingRoom; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getOfferStatus() { return offerStatus; }
    public void setOfferStatus(String offerStatus) { this.offerStatus = offerStatus; }
}
