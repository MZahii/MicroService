import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { getValidToken } from '../../../core/auth/keycloak.service';
import { environment } from '../../../../environments/environment';

interface ClinicalAuditEvent {
  id: number;
  entityType: string;
  entityId: string;
  action: string;
  actorId?: string;
  actorUsername?: string;
  actorRole?: string;
  details?: string;
  createdAt: string;
}

@Component({
  selector: 'app-clinical-audit-logs',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './clinical-audit-logs.html',
  styleUrl: './clinical-audit-logs.scss'
})
export class ClinicalAuditLogsComponent implements OnInit {
  loading = false;
  errorMessage = '';
  search = '';
  actionFilter = 'ALL';
  logs: ClinicalAuditEvent[] = [];

  async ngOnInit(): Promise<void> {
    await this.loadLogs();
  }

  get actionOptions(): string[] {
    const actions = new Set(this.logs.map((l) => l.action).filter(Boolean));
    return ['ALL', ...Array.from(actions)];
  }

  get filteredLogs(): ClinicalAuditEvent[] {
    const term = this.search.trim().toLowerCase();
    return this.logs.filter((log) => {
      const actionMatch = this.actionFilter === 'ALL' || log.action === this.actionFilter;
      if (!actionMatch) return false;
      if (!term) return true;
      const tokens = [
        log.entityType,
        log.entityId,
        log.action,
        log.actorUsername,
        log.actorRole,
        log.details,
        log.createdAt
      ].map((v) => String(v ?? '').toLowerCase());
      return tokens.some((t) => t.includes(term));
    });
  }

  private async loadLogs(): Promise<void> {
    this.loading = true;
    this.errorMessage = '';
    try {
      const token = await getValidToken();
      const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
      const response = await firstValueFrom(this.http.get<ClinicalAuditEvent[] | unknown>(
        `${environment.apiBaseUrl}/api/clinical/audit?limit=500`,
        { headers }
      ));
      this.logs = (Array.isArray(response) ? response : [])
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error: any) {
      this.errorMessage = error?.error?.message || error?.message || 'Failed to load clinical audit logs.';
    } finally {
      this.loading = false;
    }
  }

  constructor(private http: HttpClient) {}
}
