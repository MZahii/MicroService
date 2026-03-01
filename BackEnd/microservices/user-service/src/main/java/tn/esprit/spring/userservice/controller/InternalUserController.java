package tn.esprit.spring.userservice.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import tn.esprit.spring.userservice.dto.response.UserResponse;
import tn.esprit.spring.userservice.service.UserService;

@RestController
@RequestMapping("/internal/users")
@RequiredArgsConstructor
public class InternalUserController {

    private final UserService userService;

    @Value("${internal.api-key}")
    private String internalApiKey;

    @PatchMapping("/{userId}/activation")
    public UserResponse updateActivation(
            @PathVariable Long userId,
            @RequestParam boolean enabled,
            @RequestHeader("X-Internal-Api-Key") String apiKey
    ) {
        if (!internalApiKey.equals(apiKey)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Invalid internal API key");
        }

        return userService.updateActivation(userId, enabled);
    }
}