package tn.esprit.spring.clinicalservice.audit;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/clinical/audit")
@RequiredArgsConstructor
public class ClinicalAuditController {

    private final AuditEventRepository auditEventRepository;

    @GetMapping
    public ResponseEntity<List<AuditEventResponse>> list(
            @RequestParam(value = "limit", defaultValue = "200") int limit
    ) {
        int safeLimit = Math.min(Math.max(limit, 1), 500);
        var page = auditEventRepository.findAll(
                PageRequest.of(0, safeLimit, Sort.by(Sort.Direction.DESC, "createdAt"))
        );

        List<AuditEventResponse> responses = page.getContent().stream()
                .map(this::toResponse)
                .toList();
        return ResponseEntity.ok(responses);
    }

    private AuditEventResponse toResponse(AuditEvent event) {
        return AuditEventResponse.builder()
                .id(event.getId())
                .entityType(event.getEntityType())
                .entityId(event.getEntityId())
                .action(event.getAction())
                .actorId(event.getActorId())
                .actorUsername(event.getActorUsername())
                .actorRole(event.getActorRole())
                .details(event.getDetails())
                .createdAt(event.getCreatedAt())
                .build();
    }
}
