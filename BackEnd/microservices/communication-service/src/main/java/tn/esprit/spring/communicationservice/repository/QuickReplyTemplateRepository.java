package tn.esprit.spring.communicationservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.esprit.spring.communicationservice.domain.entity.QuickReplyTemplate;
import tn.esprit.spring.communicationservice.domain.enums.MessageType;

import java.util.List;
import java.util.UUID;

public interface QuickReplyTemplateRepository extends JpaRepository<QuickReplyTemplate, UUID> {
    List<QuickReplyTemplate> findByMessageTypeOrderByNameAsc(MessageType messageType);

    List<QuickReplyTemplate> findAllByOrderByNameAsc();
}
