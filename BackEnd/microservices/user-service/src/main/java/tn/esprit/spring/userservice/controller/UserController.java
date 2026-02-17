package tn.esprit.spring.userservice.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import tn.esprit.spring.userservice.dto.request.*;
import tn.esprit.spring.userservice.dto.response.UserResponse;
import tn.esprit.spring.userservice.service.UserService;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping("/internal")
    public UserResponse createInternal(@Valid @RequestBody CreateInternalUserRequest request) {
        return userService.createInternalUser(request);
    }

    @PostMapping("/staff")
    public UserResponse createStaff(@Valid @RequestBody CreateStaffAccountRequest request) {
        return userService.createStaff(request);
    }

    @PostMapping("/guardian")
    public UserResponse createGuardian(@Valid @RequestBody CreateGuardianAccountRequest request) {
        return userService.createGuardian(request);
    }
}
