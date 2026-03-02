import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { getValidToken } from '../../../core/auth/keycloak.service';
import { environment } from '../../../../environments/environment';

interface GuardianCreateResponse {
  id: number;
  username: string;
  email: string;
  role: string;
}

@Component({
  selector: 'app-create-guardian-patient',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './create-guardian-patient.html',
  styleUrl: './create-guardian-patient.scss'
})
export class CreateGuardianPatient {
  loading = false;
  successMessage = '';
  errorMessage = '';

  form = {
    guardianUsername: '',
    guardianEmail: '',
    guardianCin: '',
    guardianFirstName: '',
    guardianLastName: '',
    guardianPhone: '',
    guardianDateOfBirth: '',
    guardianSex: '' as 'MALE' | 'FEMALE' | '',
    patientFirstName: '',
    patientLastName: '',
    patientDateOfBirth: '',
    patientSex: '' as 'MALE' | 'FEMALE' | '',
    patientBloodType: '',
    patientAllergies: '',
    patientChronicConditions: '',
    patientMedicalNotes: ''
  };

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  async submit(): Promise<void> {
    this.successMessage = '';
    this.errorMessage = '';

    if (this.loading) return;

    this.loading = true;

    try {
      const token = await getValidToken();
      const headers = new HttpHeaders({
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      });

      const guardianPayload = {
        username: this.form.guardianUsername.trim(),
        email: this.form.guardianEmail.trim(),
        cin: this.form.guardianCin.trim(),
        firstName: this.form.guardianFirstName.trim(),
        lastName: this.form.guardianLastName.trim(),
        phone: this.form.guardianPhone.trim(),
        dateOfBirth: this.form.guardianDateOfBirth,
        sex: this.form.guardianSex
      };

      this.http.post<GuardianCreateResponse>(
        `${environment.apiBaseUrl}/api/users/guardian`,
        guardianPayload,
        { headers }
      ).subscribe({
        next: (guardian) => {
          const patientPayload = {
            guardianUserId: guardian.id,
            firstName: this.form.patientFirstName.trim(),
            lastName: this.form.patientLastName.trim(),
            dateOfBirth: this.form.patientDateOfBirth,
            sex: this.form.patientSex,
            bloodType: this.form.patientBloodType.trim() || null,
            allergies: this.form.patientAllergies.trim() || null,
            chronicConditions: this.form.patientChronicConditions.trim() || null,
            medicalNotes: this.form.patientMedicalNotes.trim() || null
          };

          this.http.post(
            `${environment.apiBaseUrl}/api/patients`,
            patientPayload,
            { headers }
          ).subscribe({
            next: () => {
              this.loading = false;
              this.successMessage =
                'Guardian account and patient profile created successfully.';

              this.form = {
                guardianUsername: '',
                guardianEmail: '',
                guardianCin: '',
                guardianFirstName: '',
                guardianLastName: '',
                guardianPhone: '',
                guardianDateOfBirth: '',
                guardianSex: '',
                patientFirstName: '',
                patientLastName: '',
                patientDateOfBirth: '',
                patientSex: '',
                patientBloodType: '',
                patientAllergies: '',
                patientChronicConditions: '',
                patientMedicalNotes: ''
              };

              setTimeout(() => {
                this.router.navigate(['/backoffice/dashboard']);
              }, 1500);
            },
            error: (err: { error?: { validationErrors?: Record<string, string>; message?: string; error?: string }; message?: string }) => {
              this.loading = false;

              if (err?.error?.validationErrors) {
                this.errorMessage = Object.values(err.error.validationErrors).join(' | ');
                return;
              }

              this.errorMessage =
                err?.error?.message ||
                err?.error?.error ||
                err?.message ||
                'Patient profile creation failed after guardian account creation.';
            }
          });
        },
        error: (err: { error?: { validationErrors?: Record<string, string>; message?: string; error?: string }; message?: string }) => {
          this.loading = false;

          if (err?.error?.validationErrors) {
            this.errorMessage = Object.values(err.error.validationErrors).join(' | ');
            return;
          }

          this.errorMessage =
            err?.error?.message ||
            err?.error?.error ||
            err?.message ||
            'Guardian account creation failed.';
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
