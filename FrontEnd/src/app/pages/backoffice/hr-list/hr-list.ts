import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { getValidToken } from '../../../core/auth/keycloak.service';
import { environment } from '../../../../environments/environment';

type AccountStatus = 'PENDING_CONTRACT' | 'ACTIVE' | 'INACTIVE';
type ContractSort = 'WITH_CONTRACT_FIRST' | 'WITHOUT_CONTRACT_FIRST';
type ContractFilter = 'ALL' | 'WITH_CONTRACT' | 'WITHOUT_CONTRACT';

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

@Component({
  selector: 'app-hr-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './hr-list.html',
  styleUrl: './hr-list.scss'
})
export class HrList implements OnInit, OnDestroy {
  loading = false;
  errorMessage = '';

  searchTerm = '';
  statusFilter: AccountStatus | 'ALL' = 'ALL';
  contractFilter: ContractFilter = 'ALL';
  contractSort: ContractSort = 'WITH_CONTRACT_FIRST';
  sortDirection: 'asc' | 'desc' = 'asc';
  pageSize = 10;
  currentPage = 1;
  readonly pageSizeOptions: number[] = [5, 10, 20];

  allHr: UserRow[] = [];
  contractsByUserId: Record<number, ContractRow[]> = {};
  private refreshTimer?: ReturnType<typeof setInterval>;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadHrAccounts();
    this.refreshTimer = setInterval(() => {
      if (!this.loading) {
        this.loadHrAccounts();
      }
    }, 10000);
  }

  ngOnDestroy(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
  }

  get filteredHr(): UserRow[] {
    const term = this.searchTerm.trim().toLowerCase();

    return this.allHr.filter(user => {
      const hasContract = this.hasAnyContract(user.id);
      const matchesStatus = this.statusFilter === 'ALL' || user.accountStatus === this.statusFilter;
      const matchesContract = this.contractFilter === 'ALL'
        || (this.contractFilter === 'WITH_CONTRACT' && hasContract)
        || (this.contractFilter === 'WITHOUT_CONTRACT' && !hasContract);
      const matchesSearch = !term || this.hrSearchTokens(user, hasContract).some(v => v.includes(term));

      return matchesStatus && matchesContract && matchesSearch;
    });
  }

  get sortedHr(): UserRow[] {
    const users = [...this.filteredHr];
    users.sort((a, b) => {
      const aHas = this.hasAnyContract(a.id) ? 1 : 0;
      const bHas = this.hasAnyContract(b.id) ? 1 : 0;
      if (aHas !== bHas) {
        return this.contractSort === 'WITH_CONTRACT_FIRST' ? bHas - aHas : aHas - bHas;
      }

      const result = a.username.toLowerCase().localeCompare(b.username.toLowerCase());
      return this.sortDirection === 'asc' ? result : -result;
    });
    return users;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.sortedHr.length / this.pageSize));
  }

  get paginatedHr(): UserRow[] {
    const safePage = Math.min(this.currentPage, this.totalPages);
    if (safePage !== this.currentPage) {
      this.currentPage = safePage;
    }
    const start = (this.currentPage - 1) * this.pageSize;
    return this.sortedHr.slice(start, start + this.pageSize);
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  get totalHr(): number {
    return this.allHr.length;
  }

  get activeHr(): number {
    return this.allHr.filter(u => u.accountStatus === 'ACTIVE').length;
  }

  get pendingHr(): number {
    return this.allHr.filter(u => u.accountStatus === 'PENDING_CONTRACT').length;
  }

  get inactiveHr(): number {
    return this.allHr.filter(u => u.accountStatus === 'INACTIVE').length;
  }

  get enabledHr(): number {
    return this.allHr.filter(u => u.enabled).length;
  }

  get disabledHr(): number {
    return this.totalHr - this.enabledHr;
  }

  get withContractHr(): number {
    return this.allHr.filter(u => this.hasAnyContract(u.id)).length;
  }

  get withoutContractHr(): number {
    return this.totalHr - this.withContractHr;
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

  onFiltersChanged(): void {
    this.currentPage = 1;
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
  }

  toPercent(value: number, total: number): number {
    if (!total) return 0;
    return Math.round((value / total) * 100);
  }

  circleStyle(percent: number, color: string): string {
    const safe = Math.max(0, Math.min(100, percent));
    const angle = Math.round((safe / 100) * 360);
    return `conic-gradient(${color} 0deg ${angle}deg, #e2e8f0 ${angle}deg 360deg)`;
  }

  async toggleAccountStatus(user: UserRow): Promise<void> {
    const targetStatus: AccountStatus = user.accountStatus === 'INACTIVE'
      ? (this.hasRunningContract(user.id) ? 'ACTIVE' : 'PENDING_CONTRACT')
      : 'INACTIVE';
    const confirmed = window.confirm(`Confirm changing ${user.username} status to ${targetStatus}?`);
    if (!confirmed) return;

    try {
      const token = await getValidToken();
      const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
      await firstValueFrom(
        this.http.patch(
          `${environment.apiBaseUrl}/api/contracts/staff/${user.id}/status?status=${targetStatus}`,
          {},
          { headers }
        )
      );
      await this.loadHrAccounts();
      this.cdr.detectChanges();
    } catch (error: unknown) {
      const err = error as { error?: { message?: string }; message?: string };
      this.errorMessage = err?.error?.message || err?.message || 'Failed to update HR account status.';
      this.cdr.detectChanges();
    }
  }

  hasRunningContract(userId: number): boolean {
    const contracts = this.contractsByUserId[userId] ?? [];
    return contracts.some(c => c.status === 'ACTIVE' || c.status === 'SUSPENDED');
  }

  hasAnyContract(userId: number): boolean {
    return (this.contractsByUserId[userId]?.length ?? 0) > 0;
  }

  async loadHrAccounts(): Promise<void> {
    this.loading = true;
    this.errorMessage = '';

    try {
      const token = await getValidToken();
      const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
      const response = await firstValueFrom(this.http.get<UserRow[] | unknown>(`${environment.apiBaseUrl}/api/users`, { headers }));
      const contractsResponse = await firstValueFrom(this.http.get<ContractRow[] | unknown>(`${environment.apiBaseUrl}/api/contracts`, { headers }));

      const users = Array.isArray(response) ? response : [];
      const contracts = Array.isArray(contractsResponse) ? contractsResponse : [];

      this.allHr = users.filter(u => u.role === 'HR');
      this.contractsByUserId = {};
      for (const contract of contracts) {
        if (!this.contractsByUserId[contract.staffUserId]) {
          this.contractsByUserId[contract.staffUserId] = [];
        }
        this.contractsByUserId[contract.staffUserId].push(contract);
      }
      this.cdr.detectChanges();
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
        : 'Authentication problem. Please login again.';
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  private hrSearchTokens(user: UserRow, hasContract: boolean): string[] {
    return [
      user.username ?? '',
      user.firstName ?? '',
      user.lastName ?? '',
      `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
      user.email ?? '',
      user.phone ?? '',
      user.accountStatus ?? '',
      user.enabled ? 'enabled' : 'disabled',
      hasContract ? 'with contract' : 'without contract'
    ].map(v => v.toLowerCase());
  }
}
