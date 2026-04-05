import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthStorageService } from '../../../core/auth/auth-storage.service';
import { getValidToken } from '../../../core/auth/keycloak.service';
import { environment } from '../../../../environments/environment';

interface ContractRow {
  id: number;
  contractReference?: string;
  contractType: string;
  status: string;
  jobTitle: string;
  department?: string;
  startDate: string;
  endDate: string;
  salary: number;
  currency?: string;
  hoursPerWeek: number;
  notes?: string;
}

@Component({
  selector: 'app-my-contract',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './my-contract.html',
  styleUrl: './my-contract.scss'
})
export class MyContractComponent implements OnInit {
  loading = false;
  errorMessage = '';
  contracts: ContractRow[] = [];
  role = '';

  constructor(
    private authStorage: AuthStorageService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.role = this.authStorage.getRole() ?? '';
    this.loadMyContracts();
  }

  get isBackoffice(): boolean {
    return this.router.url.startsWith('/backoffice');
  }

  get backRoute(): string {
    return this.isBackoffice ? '/backoffice/dashboard' : '/frontoffice/home';
  }

  get pageTitle(): string {
    return 'My Contract';
  }

  get accountUserId(): number | null {
    const userId = Number(this.authStorage.getUser()?.userId);
    return Number.isFinite(userId) && userId > 0 ? userId : null;
  }

  statusClass(status: string): string {
    if (status === 'ACTIVE') return 'badge-active';
    if (status === 'SUSPENDED') return 'badge-suspended';
    if (status === 'ENDED' || status === 'EXPIRED') return 'badge-ended';
    return 'badge-default';
  }

  private async loadMyContracts(): Promise<void> {
    this.loading = true;
    this.errorMessage = '';
    this.contracts = [];

    try {
      const userId = this.accountUserId;
      if (!userId) {
        throw new Error('Unable to detect current user.');
      }

      const token = await getValidToken();
      const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
      const response = await firstValueFrom(
        this.http.get<ContractRow[] | unknown>(`${environment.apiBaseUrl}/api/contracts?staffUserId=${userId}`, { headers })
      );
      this.contracts = Array.isArray(response) ? response : [];
    } catch (error: unknown) {
      const err = error as { error?: { message?: string }; message?: string };
      this.errorMessage = err?.error?.message || err?.message || 'Failed to load contract details.';
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }
}
