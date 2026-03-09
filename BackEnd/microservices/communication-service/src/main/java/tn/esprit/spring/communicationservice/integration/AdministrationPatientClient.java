package tn.esprit.spring.communicationservice.integration;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;
import tn.esprit.spring.communicationservice.integration.dto.AdministrationPatientProfile;

import java.util.List;

@Component
@RequiredArgsConstructor
public class AdministrationPatientClient {

    private final RestClient.Builder restClientBuilder;

    @Value("${internal.administration-service.base-url:http://localhost:8087}")
    private String administrationServiceBaseUrl;

    public List<AdministrationPatientProfile> getByGuardianUserId(Long guardianUserId) {
        return restClientBuilder.build()
                .get()
                .uri(administrationServiceBaseUrl + "/patients/guardian/{guardianUserId}", guardianUserId)
                .retrieve()
                .onStatus(HttpStatusCode::isError, (request, response) -> {
                    throw new ResponseStatusException(response.getStatusCode(), "Failed to load guardian patients from administration-service");
                })
                .body(new ParameterizedTypeReference<>() {});
    }
}
