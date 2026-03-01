package tn.esprit.spring.userservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import tn.esprit.spring.userservice.entity.User;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    boolean existsByCin(String cin);
    boolean existsByPhone(String phone);

    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    Optional<User> findByCin(String cin);
    Optional<User> findByKeycloakId(String keycloakId);

    @Query("""
        SELECT u
        FROM User u
        WHERE lower(u.username) = lower(:identifier)
           OR lower(u.email) = lower(:identifier)
    """)
    Optional<User> findByIdentifier(String identifier);
}