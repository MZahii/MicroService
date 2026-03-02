import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { getValidToken } from '../../../core/auth/keycloak.service';
import { environment } from '../../../../environments/environment';

interface PatientProfile {
  id: number;
  guardianUserId: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  sex: 'MALE' | 'FEMALE';
}

interface GuardianUser {
  id: number;
  username: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

interface GuardianLinkedRow {
  guardian: GuardianUser;
  patients: PatientProfile[];
}

@Component({
  selector: 'app-guardians-linked-profiles',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './guardians-linked-profiles.html',
  styleUrl: './guardians-linked-profiles.scss'
})
export class GuardiansLinkedProfiles implements OnInit {
  loading = false;
  errorMessage = '';
  searchTerm = '';

  allRows: GuardianLinkedRow[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadGuardiansAndProfiles();
  }

  get filteredRows(): GuardianLinkedRow[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return this.allRows;

    return this.allRows.filter((row) => {
      const guardianText = [
        row.guardian.username,
        row.guardian.firstName ?? '',
        row.guardian.lastName ?? '',
        row.guardian.email ?? '',
        row.guardian.phone ?? ''
      ].join(' ').toLowerCase();

      const patientText = row.patients
        .map((p) => `${p.firstName} ${p.lastName}`)
        .join(' ')
        .toLowerCase();

      return guardianText.includes(term) || patientText.includes(term);
    });
  }

  guardianFullName(guardian: GuardianUser): string {
    const full = `${guardian.firstName ?? ''} ${guardian.lastName ?? ''}`.trim();
    return full || guardian.username;
  }

  patientNames(row: GuardianLinkedRow): string {
    if (row.patients.length === 0) return '-';
    return row.patients.map((p) => `${p.firstName} ${p.lastName}`).join(', ');
  }

  async loadGuardiansAndProfiles(): Promise<void> {
    this.loading = true;
    this.errorMessage = '';

    try {
      const token = await getValidToken();
      const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

      forkJoin({
        guardians: this.http.get<GuardianUser[]>(`${environment.apiBaseUrl}/api/users/guardians`, { headers }),
        patients: this.http.get<PatientProfile[]>(`${environment.apiBaseUrl}/api/patients`, { headers })
      }).subscribe({
        next: ({ guardians, patients }) => {
          const groupedPatients: Record<number, PatientProfile[]> = {};
          (patients ?? []).forEach((patient) => {
            if (!groupedPatients[patient.guardianUserId]) {
              groupedPatients[patient.guardianUserId] = [];
            }
            groupedPatients[patient.guardianUserId].push(patient);
          });

          this.allRows = (guardians ?? []).map((guardian) => ({
            guardian,
            patients: groupedPatients[guardian.id] ?? []
          }));

          this.loading = false;
        },
        error: (err: { status?: number; error?: { message?: string }; message?: string }) => {
          this.loading = false;
          this.errorMessage =
            err?.error?.message ||
            (err?.status === 401 || err?.status === 403
              ? 'Your session is not valid anymore. Please login again.'
              : err?.message) ||
            'Failed to load guardians and linked profiles.';
        }
      });
    } catch (error) {
      this.loading = false;
      this.errorMessage = error instanceof Error
        ? error.message
        : 'Authentication problem. Please login again.';
    }
  }
}
