import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { getValidToken } from '../../../core/auth/keycloak.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-create-hr',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './create-hr.html',
  styleUrl: './create-hr.scss'
})
export class CreateHr {
  loading = false;
  successMessage = '';
  errorMessage = '';

  hrForm = {
    username: '',
    cin: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    sex: ''
  };

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  async createHr(): Promise<void> {
    this.successMessage = '';
    this.errorMessage = '';

    if (this.loading) {
      return;
    }

    const payload = {
      username: this.hrForm.username.trim(),
      cin: this.hrForm.cin.trim(),
      firstName: this.hrForm.firstName.trim(),
      lastName: this.hrForm.lastName.trim(),
      email: this.hrForm.email.trim(),
      phone: this.hrForm.phone.trim(),
      dateOfBirth: this.hrForm.dateOfBirth,
      sex: this.hrForm.sex
    };

    console.log('HR payload to send:', payload);

    this.loading = true;

    try {
      const token = await getValidToken();

      this.http.post(`${environment.apiBaseUrl}/api/users/hr`, payload, {
        headers: new HttpHeaders({
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        })
      }).subscribe({
        next: (res: any) => {
          console.log('Created HR:', res);

          this.loading = false;
          this.successMessage =
            'HR account created successfully. Temporary password = CIN. The HR user will be asked to change it on first login.';

          this.hrForm = {
            username: '',
            cin: '',
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            dateOfBirth: '',
            sex: ''
          };

          setTimeout(() => {
            this.router.navigate(['/backoffice/dashboard']);
          }, 1500);
        },
        error: (err) => {
  console.error('Create HR error:', err);
  console.error('Create HR error body:', err?.error);

  this.loading = false;

  if (err?.error?.validationErrors) {
    const validationMessages = Object.values(err.error.validationErrors).join(' | ');
    this.errorMessage = validationMessages;
    return;
  }

  this.errorMessage =
    err?.error?.message ||
    err?.error?.error ||
    err?.message ||
    'Failed to create HR account.';
}
      });
    } catch (error: any) {
      console.error('Token error:', error);
      this.loading = false;
      this.errorMessage = error?.message || 'Authentication problem. Please login again.';
    }
  }
}