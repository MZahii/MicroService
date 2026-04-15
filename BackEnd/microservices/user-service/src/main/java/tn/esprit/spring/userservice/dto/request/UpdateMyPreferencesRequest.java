package tn.esprit.spring.userservice.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateMyPreferencesRequest {

    @NotBlank(message = "Preferred language is required")
    private String preferredLanguage;

    private Boolean notificationsEnabled;

    @NotBlank(message = "Theme is required")
    private String theme;
}
