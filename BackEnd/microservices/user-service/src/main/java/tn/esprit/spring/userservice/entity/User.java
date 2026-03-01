package tn.esprit.spring.userservice.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "keycloak_id", unique = true, nullable = false, length = 36)
    private String keycloakId;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(unique = true, nullable = false, length = 20)
    private String cin;

    @Column(name = "first_name", nullable = false)
    private String firstName;

    @Column(name = "last_name", nullable = false)
    private String lastName;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(unique = true)
    private String phone;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Enumerated(EnumType.STRING)
    @Column(name = "sex")
    private Sex sex;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, name = "role")
    private Role role;

    @Enumerated(EnumType.STRING)
    @Column(name = "account_status", nullable = false)
    @Builder.Default
    private AccountStatus accountStatus = AccountStatus.PENDING_CONTRACT;

    @Builder.Default
    private boolean enabled = true;
}