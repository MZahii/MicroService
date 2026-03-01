package tn.esprit.spring.userservice.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import tn.esprit.spring.userservice.dto.request.CreateGuardianAccountRequest;
import tn.esprit.spring.userservice.dto.request.CreateHrAccountRequest;
import tn.esprit.spring.userservice.dto.request.CreateInternalUserRequest;
import tn.esprit.spring.userservice.dto.request.CreateStaffAccountRequest;
import tn.esprit.spring.userservice.dto.response.UserResponse;
import tn.esprit.spring.userservice.service.UserService;

import java.util.List;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping("/hr")
    public UserResponse createHr(@Valid @RequestBody CreateHrAccountRequest request) {
        return userService.createHr(request);
    }

    @PostMapping("/internal")
    public UserResponse createInternal(@Valid @RequestBody CreateInternalUserRequest request) {
        return userService.createInternalUser(request);
    }

    @PostMapping("/staff")
    public UserResponse createStaff(@Valid @RequestBody CreateStaffAccountRequest request) {
        return userService.createStaff(request);
    }

    @GetMapping
    public List<UserResponse> getAllUsers() {
        return userService.getAllUsers();
    }

    @PostMapping("/guardian")
    public UserResponse createGuardian(@Valid @RequestBody CreateGuardianAccountRequest request) {
        return userService.createGuardian(request);
    }
}