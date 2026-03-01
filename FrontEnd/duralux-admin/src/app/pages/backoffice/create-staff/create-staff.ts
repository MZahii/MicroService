import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { getValidToken } from '../../../core/auth/keycloak.service';
import { environment } from '../../../../environments/environment';

type StaffRole = 'DOCTOR' | 'NURSE' | 'SURGEON' | 'PHARMACIST' | 'RECEPTIONIST';
type Sex = 'MALE' | 'FEMALE' | '';

@Component({
  selector: 'app-create-staff',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './create-staff.html',
  styleUrl: './create-staff.scss'
})
export class CreateStaff {
  loading = false;
  successMessage = '';
  errorMessage = '';

  staffForm: {
    username: string;
    cin: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    sex: Sex;
    role: StaffRole | '';
  } = {
    username: '',
    cin: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    sex: '',
    role: ''
  };

  readonly roleOptions: StaffRole[] = [
    'DOCTOR',
    'NURSE',
    'SURGEON',
    'PHARMACIST',
    'RECEPTIONIST'
  ];

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  private setErrorMessage(message: string): void {
    setTimeout(() => {
      this.errorMessage = message;
    }, 0);
  }

  private setSuccessMessage(message: string): void {
    setTimeout(() => {
      this.successMessage = message;
    }, 0);
  }

  async createStaff(): Promise<void> {
    this.successMessage = '';
    this.errorMessage = '';

    if (this.loading) {
      return;
    }

    const payload = {
      username: this.staffForm.username.trim(),
      cin: this.staffForm.cin.trim(),
      firstName: this.staffForm.firstName.trim(),
      lastName: this.staffForm.lastName.trim(),
      email: this.staffForm.email.trim(),
      phone: this.staffForm.phone.trim(),
      dateOfBirth: this.staffForm.dateOfBirth,
      sex: this.staffForm.sex,
      role: this.staffForm.role
    };

    if (payload.username.length < 3) {
      this.setErrorMessage('Username must contain at least 3 characters.');
      return;
    }

    this.loading = true;

    try {
      const token = await getValidToken();

      this.http.post(`${environment.apiBaseUrl}/api/users/staff`, payload, {
        headers: new HttpHeaders({
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        })
      }).subscribe({
        next: () => {
          this.loading = false;
          this.setSuccessMessage(
            'Staff account created with PENDING_CONTRACT status. Access remains disabled until contract activation.'
          );

          this.staffForm = {
            username: '',
            cin: '',
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            dateOfBirth: '',
            sex: '',
            role: ''
          };

          setTimeout(() => {
            this.router.navigate(['/backoffice/dashboard']);
          }, 1500);
        },
        error: (err: { status?: number; error?: { validationErrors?: Record<string, string>; message?: string; error?: string }; message?: string }) => {
          this.loading = false;

          if (err?.status === 401 || err?.status === 403) {
            this.setErrorMessage('Your session is not valid anymore. Please login again.');
            setTimeout(() => {
              this.router.navigate(['/login']);
            }, 1200);
            return;
          }

          if (err?.error?.validationErrors) {
            this.setErrorMessage(Object.values(err.error.validationErrors).join(' | '));
            return;
          }

          this.setErrorMessage(
            err?.error?.message ||
            err?.error?.error ||
            err?.message ||
            'Failed to create staff account.'
          );
        }
      });
    } catch (error) {
      this.loading = false;
      this.setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Authentication problem. Please login again.'
      );
    }
  }
}
