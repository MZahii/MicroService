package tn.esprit.spring.clinicalservice.audit;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for audit trail operations
 * Provides endpoints for retrieving audit events
 */
@RestController
@RequestMapping("/clinical/audit")
@RequiredArgsConstructor
public class AuditController {

    private final AuditService auditService;

    /**
     * List all audit events with pagination support
     * @param limit Maximum number of events to return (default: 200, max: 500)
     * @return List of audit events sorted by creation date (descending)
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<List<AuditEvent>> listAuditEvents(
            @RequestParam(value = "limit", defaultValue = "200") int limit
    ) {
        return ResponseEntity.ok(auditService.listAuditEvents(limit));
    }
}
