import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { getValidToken } from '../../../core/auth/keycloak.service';
import { environment } from '../../../../environments/environment';

type InternalRole = 'DOCTOR' | 'NURSE' | 'SURGEON' | 'PHARMACIST' | 'RECEPTIONIST';
interface UserRow {
  username: string;
  email?: string | null;
}

@Component({
  selector: 'app-create-internal-user',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './create-internal-user.html',
  styleUrl: './create-internal-user.scss'
})
export class CreateInternalUser {
  loading = false;
  loadingUsers = false;
  successMessage = '';
  errorMessage = '';

  private existingUsernames = new Set<string>();
  private existingEmails = new Set<string>();

  form: {
    username: string;
    email: string;
    role: InternalRole | '';
  } = {
    username: '',
    email: '',
    role: ''
  };

  readonly roleOptions: InternalRole[] = [
    'DOCTOR',
    'NURSE',
    'SURGEON',
    'PHARMACIST',
    'RECEPTIONIST'
  ];

  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadExistingUsers();
  }

  private normalizeUsername(username: string): string {
    return username.trim().toLowerCase();
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private showError(message: string): void {
    this.successMessage = '';
    this.errorMessage = message;
  }

  private showSuccess(message: string): void {
    this.errorMessage = '';
    this.successMessage = message;
  }

  private validateForm(): string | null {
    const username = this.form.username.trim();
    const email = this.form.email.trim();

    if (username.length < 3) {
      return 'Username must contain at least 3 characters.';
    }

    if (this.existingUsernames.has(this.normalizeUsername(username))) {
      return 'Username already exists.';
    }

    if (!email) {
      return 'Email is required.';
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      return 'Email must use a valid format.';
    }

    if (this.existingEmails.has(this.normalizeEmail(email))) {
      return 'Email already exists.';
    }

    if (!this.form.role) {
      return 'Role is required.';
    }

    return null;
  }

  async loadExistingUsers(): Promise<void> {
    this.loadingUsers = true;
    try {
      const token = await getValidToken();
      const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
      const response = await firstValueFrom(
        this.http.get<UserRow[] | unknown>(`${environment.apiBaseUrl}/api/users`, { headers })
      );
      const users = Array.isArray(response) ? response : [];
      this.existingUsernames = new Set(
        users
          .map((user) => this.normalizeUsername(user.username))
          .filter((value) => value.length > 0)
      );
      this.existingEmails = new Set(
        users
          .map((user) => this.normalizeEmail(user.email ?? ''))
          .filter((value) => value.length > 0)
      );
    } catch {
      // Backend still validates uniqueness; this is only a UX pre-check.
    } finally {
      this.loadingUsers = false;
      this.cdr.detectChanges();
    }
  }

  async createInternalUser(): Promise<void> {
    this.showError('');

    if (this.loading) {
      return;
    }

    const validationError = this.validateForm();
    if (validationError) {
      this.showError(validationError);
      this.cdr.detectChanges();
      return;
    }

    const payload = {
      username: this.form.username.trim(),
      email: this.form.email.trim(),
      role: this.form.role
    };

    this.loading = true;

    try {
      const token = await getValidToken();

      await firstValueFrom(this.http.post(`${environment.apiBaseUrl}/api/users/internal`, payload, {
        headers: new HttpHeaders({
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        })
      }));

      this.showSuccess('Internal user created successfully. Temporary password: Temp123!');
      this.form = {
        username: '',
        email: '',
        role: ''
      };
      this.cdr.detectChanges();

      setTimeout(() => {
        this.router.navigate(['/backoffice/staff']);
      }, 1800);
    } catch (error: unknown) {
      const err = error as {
        status?: number;
        error?: { validationErrors?: Record<string, string>; message?: string; error?: string };
        message?: string;
      };

      if (err?.status === 401 || err?.status === 403) {
        this.showError('You are not allowed to create internal users with the current account.');
        this.cdr.detectChanges();
        return;
      }

      if (err?.error?.validationErrors) {
        this.showError(Object.values(err.error.validationErrors).join(' | '));
        this.cdr.detectChanges();
        return;
      }

      this.showError(
        err?.error?.message ||
        err?.error?.error ||
        err?.message ||
        (error instanceof Error ? error.message : 'Failed to create internal user.')
      );
      this.cdr.detectChanges();
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }
}
