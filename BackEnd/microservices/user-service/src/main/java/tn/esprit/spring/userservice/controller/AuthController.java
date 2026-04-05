package tn.esprit.spring.userservice.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import tn.esprit.spring.userservice.dto.request.LoginRequest;
import tn.esprit.spring.userservice.dto.request.RefreshTokenRequest;
import tn.esprit.spring.userservice.dto.response.LoginResponse;
import tn.esprit.spring.userservice.dto.response.TokenRefreshResponse;
import tn.esprit.spring.userservice.service.AuthService;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/refresh")
    public TokenRefreshResponse refresh(@Valid @RequestBody RefreshTokenRequest request) {
        return authService.refresh(request.getRefreshToken());
    }
}
