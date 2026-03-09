package tn.esprit.spring.communicationservice.dto.response;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import tn.esprit.spring.communicationservice.domain.enums.MessageType;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@Builder
public class QuickReplyTemplateResponse {
    private UUID id;
    private String name;
    private MessageType messageType;
    private String templateText;
    private long usageCount;
    private Instant createdAt;
    private Instant updatedAt;
}
