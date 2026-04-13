import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom, forkJoin } from 'rxjs';
import { AuthStorageService } from '../../../core/auth/auth-storage.service';
import { getValidToken } from '../../../core/auth/keycloak.service';
import { environment } from '../../../../environments/environment';

type StaffRole = 'DOCTOR' | 'NURSE' | 'SURGEON' | 'PHARMACIST' | 'RECEPTIONIST';
type AccountStatus = 'PENDING_CONTRACT' | 'ACTIVE' | 'INACTIVE';
type UserScope = 'ALL' | 'STAFF' | 'HR';

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

interface ContractRow {
  id: number;
  staffUserId: number;
  status: 'ACTIVE' | 'SUSPENDED' | 'ENDED' | 'EXPIRED';
}

interface QuickLink {
  label: string;
  route: string;
  note: string;
  queryParams?: Record<string, string>;
}

@Component({
  selector: 'app-user-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './user-admin-dashboard.html',
  styleUrl: './user-admin-dashboard.scss'
})
export class UserAdminDashboard implements OnInit {
  loading = false;
  errorMessage = '';

  role = '';
  searchTerm = '';
  scopeFilter: UserScope = 'ALL';
  statusFilter: AccountStatus | 'ALL' = 'ALL';

  allUsers: UserRow[] = [];
  allContracts: ContractRow[] = [];

  readonly staffRoles: StaffRole[] = ['DOCTOR', 'NURSE', 'SURGEON', 'PHARMACIST', 'RECEPTIONIST'];

  constructor(
    private authStorage: AuthStorageService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.role = this.authStorage.getRole() ?? '';
    this.loadData();
  }

  get isAdmin(): boolean {
    return this.role === 'ADMIN';
  }

  get isHr(): boolean {
    return this.role === 'HR';
  }

  get totalUsers(): number {
    return this.allUsers.length;
  }

  get staffUsers(): UserRow[] {
    return this.allUsers.filter((user) => this.staffRoles.includes(user.role as StaffRole));
  }

  get hrUsers(): UserRow[] {
    return this.allUsers.filter((user) => user.role === 'HR');
  }

  get activeUsers(): number {
    return this.allUsers.filter((user) => user.accountStatus === 'ACTIVE').length;
  }

  get pendingUsers(): number {
    return this.allUsers.filter((user) => user.accountStatus === 'PENDING_CONTRACT').length;
  }

  get inactiveUsers(): number {
    return this.allUsers.filter((user) => user.accountStatus === 'INACTIVE').length;
  }

  get usersWithoutRunningContract(): number {
    return this.staffUsers.filter((user) => !this.hasRunningContract(user.id)).length;
  }

  get enabledUsers(): number {
    return this.allUsers.filter((user) => !!user.enabled).length;
  }

  get accountStateCards(): Array<{ label: string; value: number; note: string }> {
    return [
      { label: 'Total Managed Users', value: this.totalUsers, note: 'HR + staff accounts' },
      { label: 'Active Accounts', value: this.activeUsers, note: 'Current enabled workforce' },
      { label: 'Pending Accounts', value: this.pendingUsers, note: 'Need contract/action follow-up' },
      { label: 'No Running Contract', value: this.usersWithoutRunningContract, note: 'Staff without active/suspended contract' }
    ];
  }

  get quickLinks(): QuickLink[] {
    const links: QuickLink[] = [];

    if (this.isAdmin) {
      links.push(
        { label: 'HR Accounts', route: '/backoffice/hr-list', note: 'Review HR lifecycle, archive/restore, and status.' },
        { label: 'Create HR Account', route: '/backoffice/create-hr', note: 'Bootstrap a new HR account.' },
        { label: 'Staff & Roles Details', route: '/backoffice/staff-details', note: 'Server-side search across staff roles.' },
        { label: 'HR Contracts', route: '/backoffice/contracts', note: 'Review HR contracts only.', queryParams: { scope: 'HR' } }
      );
    }

    if (this.isHr) {
      links.push(
        { label: 'Internal User Bootstrap', route: '/backoffice/create-internal-user', note: 'Create lightweight internal staff access.' },
        { label: 'Create Staff Account', route: '/backoffice/create-staff', note: 'Create full staff accounts.' },
        { label: 'Staff Accounts List', route: '/backoffice/staff', note: 'Manage activation and archive/restore on staff users.' },
        { label: 'Contracts', route: '/backoffice/contracts', note: 'Open contract operations for staff accounts.' }
      );
    }

    return links;
  }

  get filteredUsers(): UserRow[] {
    const term = this.searchTerm.trim().toLowerCase();

    return this.allUsers.filter((user) => {
      const matchesScope = this.scopeFilter === 'ALL'
        || (this.scopeFilter === 'STAFF' && this.staffRoles.includes(user.role as StaffRole))
        || (this.scopeFilter === 'HR' && user.role === 'HR');
      const matchesStatus = this.statusFilter === 'ALL' || user.accountStatus === this.statusFilter;
      const matchesSearch = !term || this.userTokens(user).some((value) => value.includes(term));
      return matchesScope && matchesStatus && matchesSearch;
    });
  }

  get spotlightUsers(): UserRow[] {
    return this.filteredUsers.slice(0, 8);
  }

  get pendingAttentionUsers(): UserRow[] {
    return this.allUsers
      .filter((user) => user.accountStatus === 'PENDING_CONTRACT' || !user.enabled)
      .slice(0, 8);
  }

  fullName(user: UserRow): string {
    const name = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
    return name || '-';
  }

  hasRunningContract(userId: number): boolean {
    return this.allContracts.some((contract) =>
      contract.staffUserId === userId && (contract.status === 'ACTIVE' || contract.status === 'SUSPENDED')
    );
  }

  detailsQueryParams(user: UserRow): Record<string, string> {
    if (user.role === 'HR') {
      return { returnTo: 'hr-list' };
    }

    if (this.isAdmin) {
      return { returnTo: 'staff-details' };
    }

    return { returnTo: 'staff' };
  }

  detailsRoute(user: UserRow): string[] {
    return ['/backoffice/staff', String(user.id)];
  }

  private userTokens(user: UserRow): string[] {
    return [
      user.username ?? '',
      user.firstName ?? '',
      user.lastName ?? '',
      `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
      user.email ?? '',
      user.phone ?? '',
      user.role ?? '',
      user.accountStatus ?? '',
      user.enabled ? 'enabled' : 'disabled'
    ].map((value) => value.toLowerCase());
  }

  private async loadData(): Promise<void> {
    if (!(this.isAdmin || this.isHr)) {
      this.errorMessage = 'This dashboard is reserved for admin and HR users.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    try {
      const token = await getValidToken();
      const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
      const response = await firstValueFrom(forkJoin({
        users: this.http.get<UserRow[] | unknown>(`${environment.apiBaseUrl}/api/users`, { headers }),
        contracts: this.http.get<ContractRow[] | unknown>(`${environment.apiBaseUrl}/api/contracts`, { headers })
      }));

      this.allUsers = Array.isArray(response?.users) ? response.users : [];
      this.allContracts = Array.isArray(response?.contracts) ? response.contracts : [];
    } catch (error: unknown) {
      const err = error as { status?: number; error?: { message?: string }; message?: string };
      this.errorMessage = error instanceof Error
        ? (
            err?.error?.message ||
            (err?.status === 401 || err?.status === 403
              ? 'Your session is not valid anymore. Please login again.'
              : err?.message) ||
            error.message
          )
        : 'Failed to load user administration data.';
    } finally {
      this.loading = false;
    }
  }
}
