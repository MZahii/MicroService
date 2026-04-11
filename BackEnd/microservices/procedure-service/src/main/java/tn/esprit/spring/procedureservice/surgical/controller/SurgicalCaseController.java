package tn.esprit.spring.procedureservice.surgical.controller;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import tn.esprit.spring.procedureservice.shared.mapper.SurgicalCaseMapper;
import tn.esprit.spring.procedureservice.surgical.dto.request.CreateSurgicalCaseRequest;
import tn.esprit.spring.procedureservice.surgical.dto.request.DecideTransplantOfferRequest;
import tn.esprit.spring.procedureservice.surgical.dto.request.UpdateSurgicalCaseRequest;
import tn.esprit.spring.procedureservice.surgical.dto.response.SurgicalCaseResponse;
import tn.esprit.spring.procedureservice.surgical.service.SurgicalCaseService;

@RestController
@RequestMapping("/api/procedures/surgical/cases")
public class SurgicalCaseController {
    private final SurgicalCaseService service;

    public SurgicalCaseController(SurgicalCaseService service) {
        this.service = service;
    }

    @PostMapping
    public SurgicalCaseResponse create(@Valid @RequestBody CreateSurgicalCaseRequest request) {
        return SurgicalCaseMapper.toResponse(service.create(request));
    }

    @PutMapping("/{id}")
    public SurgicalCaseResponse update(@PathVariable UUID id, @Valid @RequestBody UpdateSurgicalCaseRequest request) {
        return SurgicalCaseMapper.toResponse(service.update(id, request));
    }

    @PutMapping("/{id}/offer")
    public SurgicalCaseResponse decideOffer(@PathVariable UUID id, @Valid @RequestBody DecideTransplantOfferRequest request) {
        return SurgicalCaseMapper.toResponse(service.decideOffer(id, request));
    }

    @GetMapping("/{id}")
    public SurgicalCaseResponse getById(@PathVariable UUID id) {
        return SurgicalCaseMapper.toResponse(service.getById(id));
    }

    @GetMapping
    public List<SurgicalCaseResponse> getAll() {
        return service.getAll().stream().map(SurgicalCaseMapper::toResponse).toList();
    }
}
