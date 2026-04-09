import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { ClinicalApiService } from '../../../core/services/clinical-api.service';
import { GuardianPatientsService } from '../../../features/administrative/api/guardian-patients.service';

@Component({
  selector: 'app-guardian-consultation-details',
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
    private api: ClinicalApiService,
    private guardianPatients: GuardianPatientsService
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
        this.guardianPatients.getGuardianPatientIds().pipe(
          switchMap((patientIds: number[]) => {
            if (!patientIds.length) return of([]);
            const requests = patientIds.map((patientId: number) =>
              this.api.listConsultations({ patientId }).pipe(
                catchError(() => of([]))
              )
            );
            return forkJoin(requests).pipe(map((sets: any[][]) => sets.flat()));
          }),
          map((items: any[]) => items.find((c: any) => String(c.id) === this.consultationId) || null),
          catchError(() => of(null))
        ).subscribe({
          next: (item: any) => {
            this.consultation = item;
            this.loading = false;
            if (!item) {
              this.error = 'Consultation not found.';
            }
          },
          error: () => {
            this.loading = false;
            this.error = 'Failed to load consultation.';
          }
        });
      }
    });
  }

  statusBadge(status?: string): string {
    if (status === 'COMPLETED') return 'badge bg-success';
    if (status === 'CANCELLED') return 'badge bg-danger';
    if (status === 'IN_PROGRESS') return 'badge bg-primary';
    return 'badge bg-warning text-dark';
  }
}
