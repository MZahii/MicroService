package tn.esprit.spring.communicationservice.integration.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserSummary {
    private Long id;
    private String keycloakId;
    private String username;
}
