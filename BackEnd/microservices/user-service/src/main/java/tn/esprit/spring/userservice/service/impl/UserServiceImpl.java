package tn.esprit.spring.userservice.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.esprit.spring.userservice.dto.request.CreateGuardianAccountRequest;
import tn.esprit.spring.userservice.dto.request.CreateHrAccountRequest;
import tn.esprit.spring.userservice.dto.request.CreateInternalUserRequest;
import tn.esprit.spring.userservice.dto.request.CreateStaffAccountRequest;
import tn.esprit.spring.userservice.dto.response.UserResponse;
import tn.esprit.spring.userservice.entity.AccountStatus;
import tn.esprit.spring.userservice.entity.Role;
import tn.esprit.spring.userservice.entity.User;
import tn.esprit.spring.userservice.mapper.UserMapper;
import tn.esprit.spring.userservice.repository.UserRepository;
import tn.esprit.spring.userservice.service.KeycloakAdminService;
import tn.esprit.spring.userservice.service.UserService;

import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final KeycloakAdminService keycloakAdminService;

    private static final Set<Role> ALLOWED_STAFF_ROLES = Set.of(
            Role.DOCTOR,
            Role.NURSE,
            Role.SURGEON,
            Role.PHARMACIST,
            Role.RECEPTIONIST
    );

    @Override
    public UserResponse createHr(CreateHrAccountRequest request) {
        validateHrRequest(request);

        String generatedPassword = request.getCin();

        String keycloakId = keycloakAdminService.createUser(
                request.getUsername(),
                request.getEmail(),
                request.getFirstName(),
                request.getLastName(),
                generatedPassword,
                Role.HR.name(),
                true
        );

        User user = userRepository.save(
                User.builder()
                        .keycloakId(keycloakId)
                        .username(request.getUsername())
                        .cin(request.getCin())
                        .firstName(request.getFirstName())
                        .lastName(request.getLastName())
                        .email(request.getEmail())
                        .phone(request.getPhone())
                        .dateOfBirth(request.getDateOfBirth())
                        .sex(request.getSex())
                        .role(Role.HR)
                        .accountStatus(AccountStatus.ACTIVE)
                        .enabled(true)
                        .build()
        );

        return UserMapper.toResponse(user);
    }

    @Override
    public UserResponse createInternalUser(CreateInternalUserRequest request) {
        if (request.getRole() == null || !ALLOWED_STAFF_ROLES.contains(request.getRole())) {
            throw new IllegalArgumentException("HR cannot create role: " + request.getRole());
        }

        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username already exists");
        }

        if (request.getEmail() != null && userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already exists");
        }

        String generatedPassword = "Temp123!";

        String keycloakId = keycloakAdminService.createUser(
                request.getUsername(),
                request.getEmail(),
                request.getUsername(),
                request.getRole().name(),
                generatedPassword,
                request.getRole().name(),
                false
        );

        User user = userRepository.save(
                User.builder()
                        .keycloakId(keycloakId)
                        .username(request.getUsername())
                        .cin("TEMP-" + System.currentTimeMillis())
                        .firstName(request.getUsername())
                        .lastName(request.getRole().name())
                        .email(request.getEmail())
                        .role(request.getRole())
                        .accountStatus(AccountStatus.PENDING_CONTRACT)
                        .enabled(false)
                        .build()
        );

        return UserMapper.toResponse(user);
    }

    @Override
    public UserResponse createStaff(CreateStaffAccountRequest request) {
        validateStaffRequest(request);

        if (request.getRole() == null || !ALLOWED_STAFF_ROLES.contains(request.getRole())) {
            throw new IllegalArgumentException("Invalid staff role: " + request.getRole());
        }

        String generatedPassword = request.getCin();

        String keycloakId = keycloakAdminService.createUser(
                request.getUsername(),
                request.getEmail(),
                request.getFirstName(),
                request.getLastName(),
                generatedPassword,
                request.getRole().name(),
                false
        );

        User user = userRepository.save(
                User.builder()
                        .keycloakId(keycloakId)
                        .username(request.getUsername())
                        .cin(request.getCin())
                        .firstName(request.getFirstName())
                        .lastName(request.getLastName())
                        .email(request.getEmail())
                        .phone(request.getPhone())
                        .dateOfBirth(request.getDateOfBirth())
                        .sex(request.getSex())
                        .role(request.getRole())
                        .accountStatus(AccountStatus.PENDING_CONTRACT)
                        .enabled(false)
                        .build()
        );

        return UserMapper.toResponse(user);
    }

    @Override
    public UserResponse createGuardian(CreateGuardianAccountRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username already exists");
        }

        if (request.getEmail() != null && userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already exists");
        }

        String generatedPassword = "Temp123!";

        String keycloakId = keycloakAdminService.createUser(
                request.getUsername(),
                request.getEmail(),
                request.getUsername(),
                "Guardian",
                generatedPassword,
                Role.GUARDIAN.name(),
                true
        );

        User user = userRepository.save(
                User.builder()
                        .keycloakId(keycloakId)
                        .username(request.getUsername())
                        .cin("GUARD-" + System.currentTimeMillis())
                        .firstName(request.getUsername())
                        .lastName("Guardian")
                        .email(request.getEmail())
                        .role(Role.GUARDIAN)
                        .accountStatus(AccountStatus.ACTIVE)
                        .enabled(true)
                        .build()
        );

        return UserMapper.toResponse(user);
    }

    @Override
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(UserMapper::toResponse)
                .toList();
    }

    @Override
    public UserResponse updateActivation(Long userId, boolean enabled) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));

        keycloakAdminService.updateUserEnabled(user.getKeycloakId(), enabled);

        user.setEnabled(enabled);
        user.setAccountStatus(enabled ? AccountStatus.ACTIVE : AccountStatus.INACTIVE);

        User saved = userRepository.save(user);
        return UserMapper.toResponse(saved);
    }

    private void validateHrRequest(CreateHrAccountRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username already exists");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already exists");
        }
        if (userRepository.existsByCin(request.getCin())) {
            throw new IllegalArgumentException("CIN already exists");
        }
        if (request.getPhone() != null && userRepository.existsByPhone(request.getPhone())) {
            throw new IllegalArgumentException("Phone already exists");
        }
    }

    private void validateStaffRequest(CreateStaffAccountRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username already exists");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already exists");
        }
        if (userRepository.existsByCin(request.getCin())) {
            throw new IllegalArgumentException("CIN already exists");
        }
        if (request.getPhone() != null && userRepository.existsByPhone(request.getPhone())) {
            throw new IllegalArgumentException("Phone already exists");
        }
    }
}