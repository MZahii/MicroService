import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
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
  selector: 'app-staff-roles-details',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './staff-roles-details.html',
  styleUrl: './staff-roles-details.scss'
})
export class StaffRolesDetails implements OnInit {
  loading = false;
  errorMessage = '';

  searchTerm = '';
  roleFilter: StaffRole | 'ALL' = 'ALL';
  statusFilter: AccountStatus | 'ALL' = 'ALL';

  readonly staffRoles: StaffRole[] = ['DOCTOR', 'NURSE', 'SURGEON', 'PHARMACIST', 'RECEPTIONIST'];
  allStaff: UserRow[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadStaff();
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

  get roleStats(): Array<{ role: StaffRole; total: number; active: number; pending: number; inactive: number }> {
    return this.staffRoles.map(role => {
      const users = this.allStaff.filter(u => u.role === role);

      return {
        role,
        total: users.length,
        active: users.filter(u => u.accountStatus === 'ACTIVE').length,
        pending: users.filter(u => u.accountStatus === 'PENDING_CONTRACT').length,
        inactive: users.filter(u => u.accountStatus === 'INACTIVE').length
      };
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

  async loadStaff(): Promise<void> {
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
            'Failed to load staff details.';
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
