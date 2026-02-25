package tn.esprit.spring.userservice.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.esprit.spring.userservice.dto.request.*;
import tn.esprit.spring.userservice.dto.response.UserResponse;
import tn.esprit.spring.userservice.entity.Role;
import tn.esprit.spring.userservice.entity.User;
import tn.esprit.spring.userservice.mapper.UserMapper;
import tn.esprit.spring.userservice.repository.UserRepository;
import tn.esprit.spring.userservice.service.UserService;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    @Override
    public UserResponse createInternalUser(CreateInternalUserRequest request) {
        return createUser(request.getUsername(), request.getEmail(), request.getRole());
    }

    @Override
    public UserResponse createStaff(CreateStaffAccountRequest request) {
        return createUser(request.getUsername(), request.getEmail(), Role.RECEPTIONIST);
    }

    @Override
    public UserResponse createGuardian(CreateGuardianAccountRequest request) {
        return createUser(request.getUsername(), request.getEmail(), Role.GUARDIAN);
    }

    @Override
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(UserMapper::toResponse)
                .toList();
    }

    private UserResponse createUser(String username, String email, Role role) {
        if (userRepository.existsByUsername(username)) {
            throw new RuntimeException("Username already exists: " + username);
        }

        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email already exists: " + email);
        }

        User user = userRepository.save(User.builder()
                .username(username)
                .email(email)
                .role(role)
                .enabled(true)
                .build());

        return UserMapper.toResponse(user);
    }
}
