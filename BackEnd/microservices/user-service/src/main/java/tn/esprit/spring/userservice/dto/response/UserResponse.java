package tn.esprit.spring.userservice.dto.response;

import lombok.Builder;
import lombok.Getter;
import tn.esprit.spring.userservice.entity.Role;
import tn.esprit.spring.userservice.entity.User;

@Getter
@Builder
public class UserResponse {
    private Long id;
    private String username;
    private String email;
    private Role role;

    public static UserResponse from(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole())
                .build();
    }
}
