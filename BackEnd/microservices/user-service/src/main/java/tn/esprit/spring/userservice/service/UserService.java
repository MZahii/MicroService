package tn.esprit.spring.userservice.service;

import tn.esprit.spring.userservice.dto.request.CreateGuardianAccountRequest;
import tn.esprit.spring.userservice.dto.request.CreateHrAccountRequest;
import tn.esprit.spring.userservice.dto.request.CreateInternalUserRequest;
import tn.esprit.spring.userservice.dto.request.CreateStaffAccountRequest;
import tn.esprit.spring.userservice.dto.response.UserResponse;

import java.util.List;

public interface UserService {
    UserResponse createHr(CreateHrAccountRequest request);
    UserResponse createInternalUser(CreateInternalUserRequest request);
    UserResponse createStaff(CreateStaffAccountRequest request);
    UserResponse createGuardian(CreateGuardianAccountRequest request);
    List<UserResponse> getAllUsers();
    List<UserResponse> getGuardians();

    UserResponse updateActivation(Long userId, boolean enabled);
}
