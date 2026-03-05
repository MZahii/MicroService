package tn.esprit.spring.procedureservice.dialysis.service;

import java.util.List;
import org.springframework.stereotype.Service;
import tn.esprit.spring.procedureservice.dialysis.domain.entity.DialysisPlan;
import tn.esprit.spring.procedureservice.dialysis.dto.request.CreateDialysisPlanRequest;
import tn.esprit.spring.procedureservice.dialysis.dto.request.UpdateDialysisPlanRequest;
import tn.esprit.spring.procedureservice.dialysis.repository.DialysisPlanRepository;
import tn.esprit.spring.procedureservice.shared.exception.NotFoundException;

@Service
public class DialysisPlanService {
    private final DialysisPlanRepository repository;

    public DialysisPlanService(DialysisPlanRepository repository) {
        this.repository = repository;
    }

    public DialysisPlan create(CreateDialysisPlanRequest request) {
        DialysisPlan plan = new DialysisPlan();
        plan.setPatientId(request.patientId());
        plan.setFirstName(request.firstName());
        plan.setLastName(request.lastName());
        plan.setDoctorId(request.doctorId());
        plan.setDialysisType(request.dialysisType());
        plan.setSessionsPerWeek(request.sessionsPerWeek());
        plan.setSessionDurationMinutes(request.sessionDurationMinutes());
        plan.setStartDate(request.startDate());
        plan.setEndDate(request.endDate());
        plan.setDaysOfWeek(request.daysOfWeek());
        plan.setBloodFlowRate(request.bloodFlowRate());
        plan.setDialysateFlowRate(request.dialysateFlowRate());
        plan.setUltrafiltrationGoal(request.ultrafiltrationGoal());
        plan.setDialysisCenterId(request.dialysisCenterId());
        plan.setRoomNumber(request.roomNumber());
        plan.setMachineId(request.machineId());
        plan.setStatus(request.status());
        return repository.save(plan);
    }

    public DialysisPlan update(Long id, UpdateDialysisPlanRequest request) {
        DialysisPlan plan = getById(id);
        plan.setStatus(request.status());
        return repository.save(plan);
    }

    public DialysisPlan getById(Long id) {
        return repository.findById(id)
            .orElseThrow(() -> new NotFoundException("Dialysis plan not found: " + id));
    }

    public List<DialysisPlan> getAll() {
        return repository.findAll();
    }
}
