package tn.esprit.spring.Administrationservice.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import tn.esprit.spring.Administrationservice.dto.request.CreatePatientProfileRequest;
import tn.esprit.spring.Administrationservice.dto.response.PatientProfileResponse;
import tn.esprit.spring.Administrationservice.service.PatientProfileService;

import java.util.List;

@RestController
@RequestMapping("/patients")
@RequiredArgsConstructor
public class PatientProfileController {

    private final PatientProfileService patientProfileService;

    @PostMapping
    public PatientProfileResponse create(@Valid @RequestBody CreatePatientProfileRequest request) {
        return patientProfileService.create(request);
    }

    @PatchMapping("/{patientId}")
    public PatientProfileResponse update(
            @PathVariable Long patientId,
            @Valid @RequestBody CreatePatientProfileRequest request
    ) {
        return patientProfileService.update(patientId, request);
    }

    @GetMapping
    public List<PatientProfileResponse> getAll() {
        return patientProfileService.getAll();
    }

    @GetMapping("/guardian/{guardianUserId}")
    public List<PatientProfileResponse> getByGuardian(@PathVariable Long guardianUserId) {
        return patientProfileService.getByGuardianUserId(guardianUserId);
    }
}
