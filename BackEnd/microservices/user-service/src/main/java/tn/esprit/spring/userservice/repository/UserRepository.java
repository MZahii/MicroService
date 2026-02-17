package tn.esprit.spring.userservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.esprit.spring.userservice.entity.User;

public interface UserRepository extends JpaRepository<User, String> {
    boolean existsByUsername(String username);
}
