package tn.esprit.spring.userservice.service;

import jakarta.ws.rs.core.Response;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.keycloak.admin.client.CreatedResponseUtil;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.resource.RealmResource;
import org.keycloak.admin.client.resource.UserResource;
import org.keycloak.representations.idm.RoleRepresentation;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.stereotype.Service;
import tn.esprit.spring.userservice.config.KeycloakAdminConfig;
import tn.esprit.spring.userservice.entity.Role;

import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class KeycloakAdminService {

    private final Keycloak keycloak;
    private final KeycloakAdminConfig keycloakConfig;

    public String createUser(
            String username,
            String email,
            String firstName,
            String lastName,
            String password,
            String role,
            boolean enabled
    ) {
        RealmResource realmResource = keycloak.realm(keycloakConfig.getRealm());

        UserRepresentation user = new UserRepresentation();
        user.setUsername(username);
        user.setEmail(email);
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setEnabled(enabled);
        user.setEmailVerified(false);
        user.setRequiredActions(List.of());

        Response response = realmResource.users().create(user);

        try {
            String body = safeReadBody(response);

            log.info("Keycloak create user -> status={}, body={}", response.getStatus(), body);

            if (response.getStatus() == 409) {
                throw new IllegalArgumentException("User already exists in Keycloak (username or email already used).");
            }

            if (response.getStatus() != 201) {
                throw new RuntimeException("Keycloak create user failed. Status=" + response.getStatus() + ", body=" + body);
            }

            String userId = CreatedResponseUtil.getCreatedId(response);
            log.info("Keycloak user created successfully. userId={}", userId);

            try {
                CredentialRepresentation credential = new CredentialRepresentation();
                credential.setType(CredentialRepresentation.PASSWORD);
                credential.setValue(password);
                credential.setTemporary(false);

                realmResource.users().get(userId).resetPassword(credential);
                log.info("Password initialized successfully for userId={}", userId);

                realmResource.users()
                        .get(userId)
                        .roles()
                        .realmLevel()
                        .add(List.of(realmResource.roles().get(role).toRepresentation()));

                log.info("Role {} assigned successfully to userId={}", role, userId);

                return userId;

            } catch (Exception e) {
                log.error("Keycloak post-create step failed for userId={}", userId, e);

                try {
                    realmResource.users().get(userId).remove();
                    log.warn("Rollback OK: Keycloak user {} deleted after failure.", userId);
                } catch (Exception rollbackEx) {
                    log.error("Rollback failed: could not delete Keycloak user {}", userId, rollbackEx);
                }

                throw new RuntimeException("Keycloak user created, but password/role assignment failed: " + e.getMessage(), e);
            }

        } finally {
            response.close();
        }
    }

    public void updateUserEnabled(String keycloakId, boolean enabled) {
        RealmResource realmResource = keycloak.realm(keycloakConfig.getRealm());

        UserRepresentation userRepresentation = realmResource.users()
                .get(keycloakId)
                .toRepresentation();

        if (userRepresentation == null) {
            throw new IllegalArgumentException("Keycloak user not found: " + keycloakId);
        }

        userRepresentation.setEnabled(enabled);
        realmResource.users().get(keycloakId).update(userRepresentation);

        log.info("Keycloak user {} activation changed to {}", keycloakId, enabled);
    }

    public void updateUserProfileAndRole(
            String keycloakId,
            String email,
            String firstName,
            String lastName,
            Role role
    ) {
        RealmResource realmResource = keycloak.realm(keycloakConfig.getRealm());
        UserResource userResource = realmResource.users().get(keycloakId);
        UserRepresentation userRepresentation = userResource.toRepresentation();

        if (userRepresentation == null) {
            throw new IllegalArgumentException("Keycloak user not found: " + keycloakId);
        }

        userRepresentation.setEmail(email);
        userRepresentation.setFirstName(firstName);
        userRepresentation.setLastName(lastName);
        userResource.update(userRepresentation);

        List<RoleRepresentation> currentRoles = userResource.roles().realmLevel().listAll();
        List<String> managedRoleNames = Arrays.stream(Role.values())
                .map(Enum::name)
                .toList();

        List<RoleRepresentation> rolesToRemove = currentRoles.stream()
                .filter(r -> managedRoleNames.contains(r.getName()))
                .toList();

        if (!rolesToRemove.isEmpty()) {
            userResource.roles().realmLevel().remove(rolesToRemove);
        }

        userResource.roles().realmLevel()
                .add(List.of(realmResource.roles().get(role.name()).toRepresentation()));

        log.info("Keycloak user {} profile and role updated to {}", keycloakId, role);
    }

    private String safeReadBody(Response response) {
        try {
            if (response.hasEntity()) {
                return response.readEntity(String.class);
            }
        } catch (Exception e) {
            log.warn("Could not read Keycloak response body", e);
        }
        return "";
    }
}
