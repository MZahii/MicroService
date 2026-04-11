package tn.esprit.spring.communicationservice.integration;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import tn.esprit.spring.communicationservice.client.UserServiceClientFeign;
import tn.esprit.spring.communicationservice.integration.dto.UserSummary;

import java.util.List;
import java.util.Locale;
import java.util.Objects;

@Component
@RequiredArgsConstructor
public class UserDirectoryClient {

    private final UserServiceClientFeign userServiceClientFeign;

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
        try {
            return userServiceClientFeign.getDoctors(null);
        } catch (ResponseStatusException ex) {
            if (HttpStatus.NOT_FOUND.equals(ex.getStatusCode())) {
                try {
                    return userServiceClientFeign.getDoctorsAlt(null);
                } catch (ResponseStatusException altEx) {
                    throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Failed to load doctors from user-service");
                }
            }
            throw ex;
        }
    }

    private List<UserSummary> tryLoadGuardians() {
        try {
            return userServiceClientFeign.getGuardians(null);
        } catch (ResponseStatusException ex) {
            if (HttpStatus.NOT_FOUND.equals(ex.getStatusCode())) {
                try {
                    return userServiceClientFeign.getGuardiansAlt(null);
                } catch (ResponseStatusException altEx) {
                    throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Failed to load guardians from user-service");
                }
            }
            throw ex;
        }
    }

    private List<UserSummary> fetchGuardians(String endpoint) {
        return tryLoadGuardians();
    }

    private List<UserSummary> fetchUsers(String endpoint, String label) {
        if (endpoint.contains("doctors")) {
            return loadDoctors();
        }
        return tryLoadGuardians();
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
