import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { getValidToken } from '../../../core/auth/keycloak.service';
import { environment } from '../../../../environments/environment';

type PatientSex = 'MALE' | 'FEMALE';

interface PatientProfile {
  id: number;
  guardianUserId: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  sex: PatientSex;
  bloodType?: string | null;
  allergies?: string | null;
  chronicConditions?: string | null;
  medicalNotes?: string | null;
}

interface GuardianUser {
  id: number;
  username: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

@Component({
  selector: 'app-patients-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './patients-list.html',
  styleUrl: './patients-list.scss'
})
export class PatientsList implements OnInit {
  loading = false;
  errorMessage = '';

  searchTerm = '';
  sexFilter: PatientSex | 'ALL' = 'ALL';

  allPatients: PatientProfile[] = [];
  guardianMap: Record<number, GuardianUser> = {};

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadPatients();
  }

  get filteredPatients(): PatientProfile[] {
    const term = this.searchTerm.trim().toLowerCase();

    return this.allPatients.filter((patient) => {
      const guardian = this.guardianMap[patient.guardianUserId];
      const guardianName = guardian ? this.guardianFullName(guardian).toLowerCase() : '';
      const guardianEmail = guardian?.email?.toLowerCase() ?? '';

      const matchesSex = this.sexFilter === 'ALL' || patient.sex === this.sexFilter;
      const matchesSearch = !term || [
        patient.firstName,
        patient.lastName,
        guardianName,
        guardianEmail,
        patient.bloodType ?? ''
      ].some((v) => v.toLowerCase().includes(term));

      return matchesSex && matchesSearch;
    });
  }

  patientFullName(patient: PatientProfile): string {
    return `${patient.firstName} ${patient.lastName}`.trim();
  }

  guardianFullName(guardian?: GuardianUser): string {
    if (!guardian) return 'Unknown Guardian';
    const name = `${guardian.firstName ?? ''} ${guardian.lastName ?? ''}`.trim();
    return name || guardian.username;
  }

  guardianDisplay(patient: PatientProfile): string {
    const guardian = this.guardianMap[patient.guardianUserId];
    if (!guardian) return `Guardian #${patient.guardianUserId}`;
    return this.guardianFullName(guardian);
  }

  patientAge(dateOfBirth: string): number {
    const birth = new Date(dateOfBirth);
    if (Number.isNaN(birth.getTime())) return 0;
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const monthDiff = now.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }

  async loadPatients(): Promise<void> {
    this.loading = true;
    this.errorMessage = '';

    try {
      const token = await getValidToken();
      const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

      forkJoin({
        patients: this.http.get<PatientProfile[]>(`${environment.apiBaseUrl}/api/patients`, { headers }),
        guardians: this.http.get<GuardianUser[]>(`${environment.apiBaseUrl}/api/users/guardians`, { headers })
      }).subscribe({
        next: ({ patients, guardians }) => {
          this.allPatients = patients ?? [];
          this.guardianMap = {};
          (guardians ?? []).forEach((guardian) => {
            this.guardianMap[guardian.id] = guardian;
          });
          this.loading = false;
        },
        error: (err: { status?: number; error?: { message?: string }; message?: string }) => {
          this.loading = false;
          this.errorMessage =
            err?.error?.message ||
            (err?.status === 401 || err?.status === 403
              ? 'Your session is not valid anymore. Please login again.'
              : err?.message) ||
            'Failed to load patient profiles.';
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
