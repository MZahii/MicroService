package tn.esprit.spring.Administrationservice.service;

import tn.esprit.spring.Administrationservice.dto.request.CreatePatientProfileRequest;
import tn.esprit.spring.Administrationservice.dto.response.PatientProfileResponse;

import java.util.List;

public interface PatientProfileService {
    PatientProfileResponse create(CreatePatientProfileRequest request);
    PatientProfileResponse update(Long patientId, CreatePatientProfileRequest request);
    List<PatientProfileResponse> getAll();
    List<PatientProfileResponse> getByGuardianUserId(Long guardianUserId);
}
