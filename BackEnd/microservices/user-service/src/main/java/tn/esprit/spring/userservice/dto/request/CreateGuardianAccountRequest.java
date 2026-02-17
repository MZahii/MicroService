package tn.esprit.spring.userservice.dto.request;

import lombok.Getter;
import lombok.Setter;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

@Getter
@Setter
public class CreateGuardianAccountRequest {
    @NotBlank
    private String username;

    @Email
    private String email;
}
