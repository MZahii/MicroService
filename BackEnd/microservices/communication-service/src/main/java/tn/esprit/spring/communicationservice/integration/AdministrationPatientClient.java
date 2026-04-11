package tn.esprit.spring.communicationservice.integration;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import tn.esprit.spring.communicationservice.client.AdministrationServiceClientFeign;
import tn.esprit.spring.communicationservice.integration.dto.AdministrationPatientProfile;

import java.util.List;

@Component
@RequiredArgsConstructor
public class AdministrationPatientClient {

    private final AdministrationServiceClientFeign administrationServiceClientFeign;

    public List<AdministrationPatientProfile> getByGuardianUserId(Long guardianUserId) {
        return administrationServiceClientFeign.getPatientsByGuardianId(guardianUserId, null);
    }
}
