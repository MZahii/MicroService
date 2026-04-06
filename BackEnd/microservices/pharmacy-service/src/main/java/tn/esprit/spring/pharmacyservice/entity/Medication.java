package tn.esprit.spring.pharmacyservice.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Table(name = "medications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Medication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long medicationId;

    @Column(nullable = false)
    private String name;

    private String form;

    private String pediatricDosage;

    @OneToMany(mappedBy = "medication", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Batch> batches;

    public String getMedicationDetails() {
        return String.format("Medication[id=%d, name=%s, form=%s, dosage=%s]",
                medicationId, name, form, pediatricDosage);
    }
}
