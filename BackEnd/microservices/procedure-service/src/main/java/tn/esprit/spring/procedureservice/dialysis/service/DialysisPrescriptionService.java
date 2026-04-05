package tn.esprit.spring.procedureservice.dialysis.service;

import java.util.List;
import org.springframework.stereotype.Service;
import tn.esprit.spring.procedureservice.dialysis.domain.entity.DialysisPrescription;
import tn.esprit.spring.procedureservice.dialysis.dto.request.CreateDialysisPrescriptionRequest;
import tn.esprit.spring.procedureservice.dialysis.dto.request.UpdateDialysisPrescriptionRequest;
import tn.esprit.spring.procedureservice.dialysis.repository.DialysisPrescriptionRepository;
import tn.esprit.spring.procedureservice.shared.exception.NotFoundException;

@Service
public class DialysisPrescriptionService {
    private final DialysisPrescriptionRepository repository;
    private final DialysisPlanService planService;

    public DialysisPrescriptionService(DialysisPrescriptionRepository repository, DialysisPlanService planService) {
        this.repository = repository;
        this.planService = planService;
    }

    public DialysisPrescription create(CreateDialysisPrescriptionRequest request) {
        DialysisPrescription prescription = new DialysisPrescription();
        prescription.setPlan(planService.getById(request.planId()));
        prescription.setDetails(request.details());
        return repository.save(prescription);
    }

    public DialysisPrescription update(Long id, UpdateDialysisPrescriptionRequest request) {
        DialysisPrescription prescription = getById(id);
        prescription.setDetails(request.details());
        return repository.save(prescription);
    }

    public DialysisPrescription getById(Long id) {
        return repository.findById(id)
            .orElseThrow(() -> new NotFoundException("Dialysis prescription not found: " + id));
    }

    public List<DialysisPrescription> getAll() {
        return repository.findAll();
    }
}
