import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ClinicalApiService } from '../../../core/services/clinical-api.service';

type ConsultationStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

@Component({
  selector: 'app-consultations-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './consultations-list.page.html',
  styleUrl: './consultations-list.page.scss'
})
export class ConsultationsListPage implements OnInit {
  loading = false;
  error = '';

  consultations: any[] = [];

  filters = {
    patientQuery: '',
    status: 'ALL' as ConsultationStatus | 'ALL'
  };

  statuses: Array<ConsultationStatus | 'ALL'> = ['ALL', 'OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

  constructor(private api: ClinicalApiService) {}

  ngOnInit(): void {
    this.loadConsultations();
  }

  loadConsultations(): void {
    this.loading = true;
    this.error = '';
    const status = this.filters.status === 'ALL' ? undefined : this.filters.status;
    this.api.listMyConsultations({
      patientQuery: this.filters.patientQuery?.trim() || undefined,
      status
    }).subscribe({
      next: (items) => {
        this.consultations = items || [];
        this.loading = false;
      },
      error: () => {
        this.consultations = [];
        this.loading = false;
        this.error = 'Failed to load consultations.';
      }
    });
  }

  clearFilters(): void {
    this.filters = { patientQuery: '', status: 'ALL' };
    this.loadConsultations();
  }

  statusBadge(status?: string): string {
    if (status === 'COMPLETED') return 'bg-soft-success text-success';
    if (status === 'CANCELLED') return 'bg-soft-danger text-danger';
    if (status === 'IN_PROGRESS') return 'bg-soft-primary text-primary';
    return 'bg-soft-warning text-warning';
  }

  get totalCount(): number {
    return this.consultations.length;
  }

  get inProgressCount(): number {
    return this.consultations.filter(item => item.status === 'IN_PROGRESS').length;
  }

  get completedCount(): number {
    return this.consultations.filter(item => item.status === 'COMPLETED').length;
  }
}
