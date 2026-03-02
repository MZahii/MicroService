import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { getValidToken } from '../../../core/auth/keycloak.service';
import { environment } from '../../../../environments/environment';

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
  selector: 'app-hr-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './hr-list.html',
  styleUrl: './hr-list.scss'
})
export class HrList implements OnInit {
  loading = false;
  errorMessage = '';

  searchTerm = '';
  statusFilter: AccountStatus | 'ALL' = 'ALL';

  allHr: UserRow[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadHrAccounts();
  }

  get filteredHr(): UserRow[] {
    const term = this.searchTerm.trim().toLowerCase();

    return this.allHr.filter(user => {
      const matchesStatus = this.statusFilter === 'ALL' || user.accountStatus === this.statusFilter;
      const matchesSearch = !term || [
        user.username,
        user.firstName ?? '',
        user.lastName ?? '',
        user.email ?? '',
        user.phone ?? ''
      ].some(v => v.toLowerCase().includes(term));

      return matchesStatus && matchesSearch;
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

  async loadHrAccounts(): Promise<void> {
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
          this.allHr = (users ?? []).filter(u => u.role === 'HR');
          this.loading = false;
        },
        error: (err: { status?: number; error?: { message?: string }; message?: string }) => {
          this.loading = false;
          this.errorMessage =
            err?.error?.message ||
            (err?.status === 401 || err?.status === 403
              ? 'Your session is not valid anymore. Please login again.'
              : err?.message) ||
            'Failed to load HR accounts.';
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
