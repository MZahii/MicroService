package tn.esprit.spring.procedureservice.dialysis.service;

import java.util.List;
import org.springframework.stereotype.Service;
import tn.esprit.spring.procedureservice.dialysis.domain.entity.DialysisOutcome;
import tn.esprit.spring.procedureservice.dialysis.dto.request.ValidateDialysisOutcomeRequest;
import tn.esprit.spring.procedureservice.dialysis.repository.DialysisOutcomeRepository;
import tn.esprit.spring.procedureservice.shared.exception.NotFoundException;

@Service
public class DialysisOutcomeService {
    private final DialysisOutcomeRepository repository;
    private final DialysisSessionService sessionService;

    public DialysisOutcomeService(DialysisOutcomeRepository repository, DialysisSessionService sessionService) {
        this.repository = repository;
        this.sessionService = sessionService;
    }

    public DialysisOutcome createForSession(Long sessionId) {
        DialysisOutcome outcome = new DialysisOutcome();
        outcome.setSession(sessionService.getById(sessionId));
        outcome.setValidated(false);
        return repository.save(outcome);
    }

    public DialysisOutcome validate(Long id, ValidateDialysisOutcomeRequest request) {
        DialysisOutcome outcome = getById(id);
        outcome.setValidated(request.validated());
        outcome.setSummary(request.summary());
        return repository.save(outcome);
    }

    public DialysisOutcome getById(Long id) {
        return repository.findById(id)
            .orElseThrow(() -> new NotFoundException("Dialysis outcome not found: " + id));
    }

    public List<DialysisOutcome> getAll() {
        return repository.findAll();
    }
}
