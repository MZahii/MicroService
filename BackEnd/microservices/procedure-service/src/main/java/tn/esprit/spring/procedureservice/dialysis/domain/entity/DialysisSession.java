package tn.esprit.spring.procedureservice.dialysis.domain.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "dialysis_sessions")
public class DialysisSession {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "plan_id")
    private DialysisPlan plan;

    private LocalDateTime sessionDate;
    private String notes;

    public DialysisSession() {
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public DialysisPlan getPlan() { return plan; }
    public void setPlan(DialysisPlan plan) { this.plan = plan; }
    public LocalDateTime getSessionDate() { return sessionDate; }
    public void setSessionDate(LocalDateTime sessionDate) { this.sessionDate = sessionDate; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
