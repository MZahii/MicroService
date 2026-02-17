package tn.esprit.spring.userservice.dto.request;

import lombok.Getter;
import lombok.Setter;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import tn.esprit.spring.userservice.entity.Role;

@Getter
@Setter
public class CreateInternalUserRequest {
    @NotBlank
    private String username;

    @Email
    private String email;

    @NotNull
    private Role role;
}
