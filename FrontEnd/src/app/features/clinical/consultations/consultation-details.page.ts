import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ClinicalApiService } from '../../../core/services/clinical-api.service';

@Component({
  selector: 'app-consultation-details',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './consultation-details.page.html',
  styleUrl: './consultation-details.page.scss'
})
export class ConsultationDetailsPage implements OnInit {
  consultationId = '';
  consultation: any | null = null;

  loading = false;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private api: ClinicalApiService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = 'Consultation id missing.';
      return;
    }
    this.consultationId = id;
    this.loadConsultation();
  }

  loadConsultation(): void {
    this.loading = true;
    this.error = '';
    this.api.getConsultation(this.consultationId).subscribe({
      next: (item) => {
        this.consultation = item;
        this.loading = false;
      },
      error: () => {
        this.api.listMyConsultations().subscribe({
          next: (items) => {
            this.consultation = (items || []).find(c => c.id === this.consultationId) || null;
            this.loading = false;
            if (!this.consultation) {
              this.error = 'Consultation not found.';
            }
          },
          error: () => {
            this.loading = false;
            this.error = 'Failed to load consultation details.';
          }
        });
      }
    });
  }

  getPatientLabel(id: number | string | undefined): string {
    if (!id) return '-';
    if (this.consultation?.patientName && String(this.consultation?.patientId) === String(id)) {
      return this.consultation.patientName;
    }
    return String(id);
  }

  statusBadge(status?: string): string {
    if (status === 'COMPLETED') return 'bg-soft-success text-success';
    if (status === 'CANCELLED') return 'bg-soft-danger text-danger';
    if (status === 'IN_PROGRESS') return 'bg-soft-primary text-primary';
    return 'bg-soft-warning text-warning';
  }

}
