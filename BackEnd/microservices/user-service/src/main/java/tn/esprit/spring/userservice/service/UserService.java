package tn.esprit.spring.userservice.service;

import tn.esprit.spring.userservice.dto.request.*;
import tn.esprit.spring.userservice.dto.response.UserResponse;

public interface UserService {

    UserResponse createInternalUser(CreateInternalUserRequest request);

    UserResponse createStaff(CreateStaffAccountRequest request);

    UserResponse createGuardian(CreateGuardianAccountRequest request);
}
