import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom, forkJoin } from 'rxjs';
import { getValidToken } from '../../../core/auth/keycloak.service';
import { environment } from '../../../../environments/environment';

interface UserRow {
  id: number;
  firstName?: string;
  lastName?: string;
  role?: string;
  username?: string;
}

interface AuditRow {
  id: number;
  action: string;
  actor?: string;
  oldValue?: string;
  newValue?: string;
  createdAt: string;
  userId?: number;
  scopeId?: number;
}

interface UnifiedLog {
  id: string;
  source: 'ACCOUNT' | 'CONTRACT';
  action: string;
  actor: string;
  createdAt: string;
  oldValue?: string;
  newValue?: string;
  userId: number;
  fullName: string;
  role: string;
}

interface LogDiffRow {
  field: string;
  oldValue: string;
  newValue: string;
}

interface LogDiffInfo {
  rows: LogDiffRow[];
  parsed: boolean;
}

@Component({
  selector: 'app-logs',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './logs.html',
  styleUrl: './logs.scss'
})
export class LogsComponent implements OnInit {
  loading = false;
  errorMessage = '';
  search = '';
  sourceFilter: 'ALL' | 'ACCOUNT' | 'CONTRACT' = 'ALL';
  logs: UnifiedLog[] = [];
  private diffCache = new Map<string, LogDiffInfo>();
  currentPage = 1;
  pageSize = 10;
  readonly pageSizeOptions = [10, 20, 50];

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadLogs();
  }

  get filteredLogs(): UnifiedLog[] {
    const term = this.search.trim().toLowerCase();
    return this.logs.filter((log) => {
      const sourceMatch = this.sourceFilter === 'ALL' || log.source === this.sourceFilter;
      const termMatch = !term || this.logSearchTokens(log).some((value) => value.includes(term));
      return sourceMatch && termMatch;
    });
  }

  get paginatedLogs(): UnifiedLog[] {
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredLogs.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredLogs.length / this.pageSize));
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  get rangeStart(): number {
    if (this.filteredLogs.length === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get rangeEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredLogs.length);
  }

  onFiltersChanged(): void {
    this.currentPage = 1;
  }

  onPageSizeChanged(): void {
    this.currentPage = 1;
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
  }

  previousPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  nextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  printLogs(): void {
    window.print();
  }

  downloadPdf(): void {
    const content = `
      <html>
        <head><title>Audit Logs</title></head>
        <body>
          <h2>Audit Logs</h2>
          <p>Export Date: ${new Date().toISOString()}</p>
          <table border="1" cellspacing="0" cellpadding="6">
            <tr><th>Date</th><th>Source</th><th>User</th><th>Role</th><th>Action</th><th>Actor</th></tr>
            ${this.filteredLogs.map(log => `
              <tr>
                <td>${log.createdAt}</td>
                <td>${log.source}</td>
                <td>${log.fullName}</td>
                <td>${log.role}</td>
                <td>${log.action}</td>
                <td>${log.actor}</td>
              </tr>
            `).join('')}
          </table>
        </body>
      </html>
    `;
    const popup = window.open('', '_blank');
    if (!popup) return;
    popup.document.write(content);
    popup.document.close();
    popup.focus();
    popup.print();
  }

  getChangedFields(log: UnifiedLog): LogDiffRow[] {
    return this.getDiffInfo(log).rows;
  }

  hasParsedDetails(log: UnifiedLog): boolean {
    return this.getDiffInfo(log).parsed;
  }

  getDiffInfo(log: UnifiedLog): LogDiffInfo {
    const cached = this.diffCache.get(log.id);
    if (cached) return cached;

    const oldObj = this.parseJsonObject(log.oldValue);
    const newObj = this.parseJsonObject(log.newValue);
    const parsed = !!oldObj || !!newObj;
    const keys = new Set<string>([
      ...Object.keys(oldObj ?? {}),
      ...Object.keys(newObj ?? {})
    ]);

    const diffs: LogDiffRow[] = [];
    keys.forEach((key) => {
      if (key === 'id') return;
      const oldVal = oldObj ? oldObj[key] : undefined;
      const newVal = newObj ? newObj[key] : undefined;
      if (!this.valuesEqual(oldVal, newVal)) {
        diffs.push({
          field: this.humanizeField(key),
          oldValue: this.stringifyValue(oldVal),
          newValue: this.stringifyValue(newVal)
        });
      }
    });

    const info: LogDiffInfo = { rows: diffs, parsed };
    this.diffCache.set(log.id, info);
    return info;
  }

  hasRawDetails(log: UnifiedLog): boolean {
    return !!(log.oldValue || log.newValue);
  }

  getRawOld(log: UnifiedLog): string {
    return log.oldValue || '-';
  }

  getRawNew(log: UnifiedLog): string {
    return log.newValue || '-';
  }

  private async loadLogs(): Promise<void> {
    this.loading = true;
    this.errorMessage = '';
    try {
      const token = await getValidToken();
      const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

      const result = await firstValueFrom(forkJoin({
        users: this.http.get<UserRow[] | unknown>(`${environment.apiBaseUrl}/api/users`, { headers }),
        userAudit: this.http.get<AuditRow[] | unknown>(`${environment.apiBaseUrl}/api/users/audit`, { headers }),
        contractAudit: this.http.get<AuditRow[] | unknown>(`${environment.apiBaseUrl}/api/observability/contracts/timeline`, { headers })
      }));

      const users = Array.isArray(result.users) ? result.users : [];
      const userMap = new Map<number, UserRow>(users.map((u) => [u.id, u]));

      const userLogs = (Array.isArray(result.userAudit) ? result.userAudit : []).map((log) => {
        const userId = Number(log.userId ?? 0);
        const user = userMap.get(userId);
        const fullName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || user?.username || `User #${userId}`;
        return {
          id: `U-${log.id}`,
          source: 'ACCOUNT' as const,
          action: log.action,
          actor: log.actor || '-',
          createdAt: log.createdAt,
          oldValue: log.oldValue,
          newValue: log.newValue,
          userId,
          fullName,
          role: user?.role || '-'
        };
      });

      const contractLogs = (Array.isArray(result.contractAudit) ? result.contractAudit : []).map((log) => {
        const userId = Number(log.scopeId ?? 0);
        const user = userMap.get(userId);
        const fullName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || user?.username || `User #${userId}`;
        return {
          id: `C-${log.id}`,
          source: 'CONTRACT' as const,
          action: log.action,
          actor: log.actor || '-',
          createdAt: log.createdAt,
          oldValue: log.oldValue,
          newValue: log.newValue,
          userId,
          fullName,
          role: user?.role || '-'
        };
      });

      this.logs = [...userLogs, ...contractLogs]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      this.diffCache.clear();
      this.currentPage = 1;
    } catch (error: unknown) {
      const err = error as { error?: { message?: string }; message?: string };
      this.errorMessage = err?.error?.message || err?.message || 'Failed to load audit logs.';
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  private parseJsonObject(raw?: string): Record<string, unknown> | null {
    if (!raw) return null;
    const value = raw.trim();
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed as Record<string, unknown>;
      if (typeof parsed === 'string') {
        const nested = parsed.trim();
        if (nested.startsWith('{') && nested.endsWith('}')) {
          const nestedParsed = JSON.parse(nested);
          if (nestedParsed && typeof nestedParsed === 'object' && !Array.isArray(nestedParsed)) {
            return nestedParsed as Record<string, unknown>;
          }
        }
      }
      if (value.startsWith('{') && value.endsWith('}')) {
        const direct = JSON.parse(value);
        if (direct && typeof direct === 'object' && !Array.isArray(direct)) {
          return direct as Record<string, unknown>;
        }
      }
    } catch {
      return null;
    }
    return null;
  }

  private valuesEqual(a: unknown, b: unknown): boolean {
    return JSON.stringify(a) === JSON.stringify(b);
  }

  private stringifyValue(value: unknown): string {
    if (value === null || value === undefined || value === '') return '-';
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
    }
    return String(value);
  }

  private humanizeField(field: string): string {
    const labels: Record<string, string> = {
      staffUserId: 'Staff User ID',
      contractReference: 'Contract Reference',
      contractType: 'Contract Type',
      accountStatus: 'Account Status',
      firstName: 'First Name',
      lastName: 'Last Name',
      dateOfBirth: 'Date Of Birth',
      hoursPerWeek: 'Hours / Week'
    };
    if (labels[field]) return labels[field];
    return field
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  private logSearchTokens(log: UnifiedLog): string[] {
    return [
      log.source ?? '',
      log.action ?? '',
      log.actor ?? '',
      log.fullName ?? '',
      log.role ?? '',
      String(log.userId ?? ''),
      log.createdAt ?? '',
      log.oldValue ?? '',
      log.newValue ?? ''
    ].map((value) => String(value).toLowerCase());
  }
}
