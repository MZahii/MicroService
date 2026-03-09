package tn.esprit.spring.communicationservice.integration;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;
import tn.esprit.spring.communicationservice.integration.dto.UserSummary;

import java.util.List;
import java.util.Locale;
import java.util.Objects;

@Component
@RequiredArgsConstructor
public class UserDirectoryClient {

    private final RestClient.Builder restClientBuilder;

    @Value("${internal.user-service.base-url:http://localhost:8090}")
    private String userServiceBaseUrl;

    public UserSummary resolveGuardian(String jwtSub, String preferredUsername) {
        List<UserSummary> guardians = tryLoadGuardians();

        if (guardians == null || guardians.isEmpty()) {
            throw new ResponseStatusException(HttpStatusCode.valueOf(404), "No guardian users found in user-service");
        }

        return guardians.stream()
                .filter(Objects::nonNull)
                .filter(user -> isMatch(user, jwtSub, preferredUsername))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatusCode.valueOf(404), "Failed to resolve guardian user in user-service"));
    }

    public List<UserSummary> loadDoctors() {
        ResponseStatusException lastError = null;

        for (String endpoint : List.of("/users/doctors", "/api/users/doctors")) {
            try {
                return fetchUsers(endpoint, "doctors");
            } catch (ResponseStatusException ex) {
                lastError = ex;
                if (!HttpStatus.NOT_FOUND.equals(ex.getStatusCode())) {
                    throw ex;
                }
            }
        }

        if (lastError != null) {
            throw lastError;
        }

        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Failed to load doctors from user-service");
    }

    private List<UserSummary> tryLoadGuardians() {
        ResponseStatusException lastError = null;

        for (String endpoint : List.of("/users/guardians", "/api/users/guardians")) {
            try {
                return fetchGuardians(endpoint);
            } catch (ResponseStatusException ex) {
                lastError = ex;
                if (!HttpStatus.NOT_FOUND.equals(ex.getStatusCode())) {
                    throw ex;
                }
            }
        }

        if (lastError != null) {
            throw lastError;
        }

        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Failed to load guardians from user-service");
    }

    private List<UserSummary> fetchGuardians(String endpoint) {
        return fetchUsers(endpoint, "guardians");
    }

    private List<UserSummary> fetchUsers(String endpoint, String label) {
        return restClientBuilder.build()
                .get()
                .uri(userServiceBaseUrl + endpoint)
                .retrieve()
                .onStatus(HttpStatusCode::isError, (request, response) -> {
                    throw new ResponseStatusException(response.getStatusCode(), "Failed to load " + label + " from user-service");
                })
                .body(new ParameterizedTypeReference<>() {});
    }

    private boolean isMatch(UserSummary user, String jwtSub, String preferredUsername) {
        if (equalsIgnoreCaseSafe(user.getKeycloakId(), jwtSub)) {
            return true;
        }

        return equalsIgnoreCaseSafe(user.getUsername(), preferredUsername);
    }

    private boolean equalsIgnoreCaseSafe(String left, String right) {
        if (left == null || right == null) {
            return false;
        }

        return left.trim().toLowerCase(Locale.ROOT).equals(right.trim().toLowerCase(Locale.ROOT));
    }
}
