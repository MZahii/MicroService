import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { ClinicalApiService } from '../../../core/services/clinical-api.service';
import { GuardianPatientsService } from '../../../features/administrative/api/guardian-patients.service';

type ConsultationStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

@Component({
  selector: 'app-guardian-consultations',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './consultations.page.html',
  styleUrl: './consultations.page.scss'
})
export class ConsultationsPage implements OnInit {
  consultations: any[] = [];
  loading = false;
  error = '';

  filterStatus: ConsultationStatus | 'ALL' = 'ALL';
  statuses: Array<ConsultationStatus | 'ALL'> = ['ALL', 'OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

  constructor(
    private api: ClinicalApiService,
    private guardianPatients: GuardianPatientsService
  ) {}

  ngOnInit(): void {
    this.loadConsultations();
  }

  loadConsultations(): void {
    this.loading = true;
    this.error = '';

    this.guardianPatients.getGuardianPatientIds().pipe(
      switchMap((patientIds: number[]) => {
        if (!patientIds.length) return of([]);
        const requests = patientIds.map((patientId: number) =>
          this.api.listConsultations({ patientId }).pipe(
            catchError(() =>
              this.api.listAppointments({ patientId }).pipe(
                map((appointments) => this.mapAppointmentsToConsultations(appointments, patientId)),
                catchError(() => of([]))
              )
            )
          )
        );
        return forkJoin(requests).pipe(map((sets: any[][]) => sets.flat()));
      }),
      map((items: any[]) => this.dedupe(items)),
      catchError(() => {
        this.error = 'Failed to load consultations.';
        return of([]);
      })
    ).subscribe({
      next: (items: any[]) => {
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

  get filteredConsultations(): any[] {
    if (this.filterStatus === 'ALL') return this.consultations;
    return this.consultations.filter(c => c.status === this.filterStatus);
  }

  statusBadge(status?: string): string {
    if (status === 'COMPLETED') return 'badge bg-success';
    if (status === 'CANCELLED') return 'badge bg-danger';
    if (status === 'IN_PROGRESS') return 'badge bg-primary';
    return 'badge bg-warning text-dark';
  }

  private mapAppointmentsToConsultations(appointments: any[], patientId: number): any[] {
    return (appointments || []).map((appt) => ({
      id: appt.consultationId || `APPT-${appt.id}`,
      patientId,
      dateTime: appt.scheduledAt,
      status: appt.status === 'CANCELLED' ? 'CANCELLED' : 'OPEN',
      appointmentId: appt.id
    }));
  }

  private dedupe(items: any[]): any[] {
    const seen = new Set<string>();
    return (items || []).filter(item => {
      const key = String(item?.id ?? `${item?.patientId}-${item?.dateTime}`);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}
