package tn.esprit.spring.Administrationservice.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.esprit.spring.Administrationservice.dto.request.CreatePatientProfileRequest;
import tn.esprit.spring.Administrationservice.dto.response.PatientProfileResponse;
import tn.esprit.spring.Administrationservice.entity.PatientProfile;
import tn.esprit.spring.Administrationservice.repository.PatientProfileRepository;
import tn.esprit.spring.Administrationservice.service.PatientProfileService;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PatientProfileServiceImpl implements PatientProfileService {

    private final PatientProfileRepository patientProfileRepository;

    @Override
    public PatientProfileResponse create(CreatePatientProfileRequest request) {
        PatientProfile profile = patientProfileRepository.save(
                PatientProfile.builder()
                        .guardianUserId(request.getGuardianUserId())
                        .firstName(request.getFirstName())
                        .lastName(request.getLastName())
                        .dateOfBirth(request.getDateOfBirth())
                        .sex(request.getSex())
                        .bloodType(request.getBloodType())
                        .allergies(request.getAllergies())
                        .chronicConditions(request.getChronicConditions())
                        .medicalNotes(request.getMedicalNotes())
                        .build()
        );

        return PatientProfileResponse.from(profile);
    }

    @Override
    public List<PatientProfileResponse> getAll() {
        return patientProfileRepository.findAll()
                .stream()
                .map(PatientProfileResponse::from)
                .toList();
    }

    @Override
    public List<PatientProfileResponse> getByGuardianUserId(Long guardianUserId) {
        return patientProfileRepository.findByGuardianUserId(guardianUserId)
                .stream()
                .map(PatientProfileResponse::from)
                .toList();
    }
}
