package tn.esprit.spring.clinicalservice.consultation.service;

import tn.esprit.spring.clinicalservice.consultation.dto.*;
import tn.esprit.spring.clinicalservice.consultation.entity.ConsultationStatus;

import java.util.List;
import java.util.UUID;

public interface ConsultationService {

    ConsultationResponse create(ConsultationCreateRequest request, UUID doctorId);

    ConsultationResponse update(UUID id, UUID doctorId, ConsultationUpdateRequest request);

    ConsultationResponse getById(UUID id, UUID doctorId);

    List<ConsultationResponse> listMine(UUID doctorId, String patientQuery, ConsultationStatus status);

    void cancel(UUID id, UUID doctorId);
}
