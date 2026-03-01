import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { getValidToken } from '../../../core/auth/keycloak.service';
import { environment } from '../../../../environments/environment';

type StaffRole = 'DOCTOR' | 'NURSE' | 'SURGEON' | 'PHARMACIST' | 'RECEPTIONIST';
type AccountStatus = 'PENDING_CONTRACT' | 'ACTIVE' | 'INACTIVE';

interface UserRow {
  id: number;
  username: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  role: string;
  accountStatus: AccountStatus;
  enabled: boolean;
}

@Component({
  selector: 'app-staff-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './staff-list.html',
  styleUrl: './staff-list.scss'
})
export class StaffList implements OnInit {
  loading = false;
  errorMessage = '';

  searchTerm = '';
  roleFilter: StaffRole | 'ALL' = 'ALL';
  statusFilter: AccountStatus | 'ALL' = 'ALL';

  allStaff: UserRow[] = [];

  readonly staffRoles: StaffRole[] = ['DOCTOR', 'NURSE', 'SURGEON', 'PHARMACIST', 'RECEPTIONIST'];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadStaffAccounts();
  }

  get filteredStaff(): UserRow[] {
    const term = this.searchTerm.trim().toLowerCase();

    return this.allStaff.filter(user => {
      const matchesRole = this.roleFilter === 'ALL' || user.role === this.roleFilter;
      const matchesStatus = this.statusFilter === 'ALL' || user.accountStatus === this.statusFilter;
      const matchesSearch = !term || [
        user.username,
        user.firstName ?? '',
        user.lastName ?? '',
        user.email ?? '',
        user.phone ?? ''
      ].some(v => v.toLowerCase().includes(term));

      return matchesRole && matchesStatus && matchesSearch;
    });
  }

  fullName(user: UserRow): string {
    const name = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
    return name || '-';
  }

  statusClass(status: AccountStatus): string {
    if (status === 'ACTIVE') return 'badge-active';
    if (status === 'PENDING_CONTRACT') return 'badge-pending';
    return 'badge-inactive';
  }

  enabledClass(enabled: boolean): string {
    return enabled ? 'badge-enabled' : 'badge-disabled';
  }

  async loadStaffAccounts(): Promise<void> {
    this.loading = true;
    this.errorMessage = '';

    try {
      const token = await getValidToken();

      this.http.get<UserRow[]>(`${environment.apiBaseUrl}/api/users`, {
        headers: new HttpHeaders({
          Authorization: `Bearer ${token}`
        })
      }).subscribe({
        next: (users) => {
          this.allStaff = (users ?? []).filter(u => this.staffRoles.includes(u.role as StaffRole));
          this.loading = false;
        },
        error: (err: { status?: number; error?: { message?: string }; message?: string }) => {
          this.loading = false;
          this.errorMessage =
            err?.error?.message ||
            (err?.status === 401 || err?.status === 403
              ? 'Your session is not valid anymore. Please login again.'
              : err?.message) ||
            'Failed to load staff accounts.';
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
