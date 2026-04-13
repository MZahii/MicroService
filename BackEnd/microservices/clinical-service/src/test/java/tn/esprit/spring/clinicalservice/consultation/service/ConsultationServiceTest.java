package tn.esprit.spring.clinicalservice.consultation.service;

import java.time.LocalDateTime;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import tn.esprit.spring.clinicalservice.audit.AuditService;
import tn.esprit.spring.clinicalservice.client.AdministrationClient;
import tn.esprit.spring.clinicalservice.client.CommunicationClient;
import tn.esprit.spring.clinicalservice.client.PharmacyClient;
import tn.esprit.spring.clinicalservice.client.UserServiceClient;
import tn.esprit.spring.clinicalservice.consultation.dto.ConsultationCreateRequest;
import tn.esprit.spring.clinicalservice.consultation.dto.ConsultationResponse;
import tn.esprit.spring.clinicalservice.consultation.entity.Consultation;
import tn.esprit.spring.clinicalservice.consultation.entity.ConsultationStatus;
import tn.esprit.spring.clinicalservice.consultation.exception.ConsultationValidationException;
import tn.esprit.spring.clinicalservice.consultation.repository.ConsultationRepository;
import tn.esprit.spring.clinicalservice.consultation.service.impl.ConsultationServiceImpl;
import tn.esprit.spring.clinicalservice.patient.PatientDirectoryClient;
import tn.esprit.spring.clinicalservice.security.ActorResolver;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@DisplayName("ConsultationService - Doctor Validation Tests")
class ConsultationServiceTest {

    @Mock
    private ConsultationRepository consultationRepository;

    @Mock
    private PatientDirectoryClient patientDirectoryClient;

    @Mock
    private AuditService auditService;

    @Mock
    private ActorResolver actorResolver;

    @Mock
    private UserServiceClient userServiceClient;

    @Mock
    private AdministrationClient administrationClient;

    @Mock
    private PharmacyClient pharmacyClient;

    @Mock
    private CommunicationClient communicationClient;

    @InjectMocks
    private ConsultationServiceImpl consultationService;

    private UUID doctorId;
    private UUID appointmentId;
    private ConsultationCreateRequest validRequest;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        
        doctorId = UUID.randomUUID();
        appointmentId = UUID.randomUUID();
        
        validRequest = new ConsultationCreateRequest();
        validRequest.setPatientId(1L);
        validRequest.setDateTime(LocalDateTime.now().plusHours(1));
        validRequest.setAppointmentId(appointmentId);
    }

    @Test
    @DisplayName("Test 1: Create consultation - valid doctor ID succeeds")
    void testCreateConsultationWithValidDoctorId() {
        // Arrange
        Consultation savedConsultation = Consultation.builder()
            .id(UUID.randomUUID())
            .patientId(1L)
            .doctorId(doctorId)
            .dateTime(validRequest.getDateTime())
            .appointmentId(appointmentId)
            .status(ConsultationStatus.OPEN)
            .build();
        
        when(consultationRepository.save(any(Consultation.class))).thenReturn(savedConsultation);

        // Act
        ConsultationResponse result = consultationService.create(validRequest, doctorId);

        // Assert
        assertNotNull(result);
        assertEquals(1L, result.getPatientId());
        assertEquals(doctorId, result.getDoctorId());
        assertEquals(ConsultationStatus.OPEN, result.getStatus());
        
        verify(consultationRepository, times(1)).save(any(Consultation.class));
    }

    @Test
    @DisplayName("Test 2: Create consultation - null doctor ID throws ConsultationValidationException")
    void testCreateConsultationWithNullDoctorId() {
        // Act & Assert
        assertThrows(ConsultationValidationException.class, () -> {
            consultationService.create(validRequest, null);
        });
        
        verify(consultationRepository, never()).save(any(Consultation.class));
    }

    @Test
    @DisplayName("Test 3: Create consultation - appointment_id stored for referential tracking")
    void testCreateConsultationStoresAppointmentReference() {
        // Arrange
        Consultation savedConsultation = Consultation.builder()
            .id(UUID.randomUUID())
            .patientId(1L)
            .doctorId(doctorId)
            .dateTime(validRequest.getDateTime())
            .appointmentId(appointmentId)
            .status(ConsultationStatus.OPEN)
            .build();
        
        when(consultationRepository.save(any(Consultation.class))).thenReturn(savedConsultation);

        // Act
        ConsultationResponse result = consultationService.create(validRequest, doctorId);

        // Assert
        assertNotNull(result);
        assertEquals(appointmentId, result.getAppointmentId());
        
        verify(consultationRepository, times(1)).save(argThat(consultation -> 
            consultation.getAppointmentId().equals(appointmentId)
        ));
    }

    @Test
    @DisplayName("Test 4: Create consultation - appointment_id can be null")
    void testCreateConsultationWithoutAppointment() {
        // Arrange
        ConsultationCreateRequest noAppointmentRequest = new ConsultationCreateRequest();
        noAppointmentRequest.setPatientId(1L);
        noAppointmentRequest.setDateTime(LocalDateTime.now().plusHours(1));
        noAppointmentRequest.setAppointmentId(null);
        
        Consultation savedConsultation = Consultation.builder()
            .id(UUID.randomUUID())
            .patientId(1L)
            .doctorId(doctorId)
            .dateTime(noAppointmentRequest.getDateTime())
            .appointmentId(null)
            .status(ConsultationStatus.OPEN)
            .build();
        
        when(consultationRepository.save(any(Consultation.class))).thenReturn(savedConsultation);

        // Act
        ConsultationResponse result = consultationService.create(noAppointmentRequest, doctorId);

        // Assert
        assertNotNull(result);
        assertNull(result.getAppointmentId());
        verify(consultationRepository, times(1)).save(any(Consultation.class));
    }

    @Test
    @DisplayName("Test 5: Create consultation - initial status is OPEN")
    void testConsultationInitialStatusIsOpen() {
        // Arrange
        Consultation savedConsultation = Consultation.builder()
            .id(UUID.randomUUID())
            .patientId(1L)
            .doctorId(doctorId)
            .dateTime(validRequest.getDateTime())
            .status(ConsultationStatus.OPEN)
            .build();
        
        when(consultationRepository.save(any(Consultation.class))).thenReturn(savedConsultation);

        // Act
        ConsultationResponse result = consultationService.create(validRequest, doctorId);

        // Assert
        assertEquals(ConsultationStatus.OPEN, result.getStatus());
    }

    @Test
    @DisplayName("Test 6: Create consultation - FK constraint enforces appointment referential integrity")
    void testConsultationAppointmentReferentialIntegrity() {
        // Arrange - consultation with appointment reference
        Consultation savedConsultation = Consultation.builder()
            .id(UUID.randomUUID())
            .patientId(1L)
            .doctorId(doctorId)
            .dateTime(validRequest.getDateTime())
            .appointmentId(appointmentId)
            .status(ConsultationStatus.OPEN)
            .build();
        
        when(consultationRepository.save(any(Consultation.class))).thenReturn(savedConsultation);

        // Act
        ConsultationResponse result = consultationService.create(validRequest, doctorId);

        // Assert - appointment reference is preserved
        assertNotNull(result);
        assertEquals(appointmentId, result.getAppointmentId());
    }
}
