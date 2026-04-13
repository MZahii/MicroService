import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ClinicalApiService } from '../../../core/services/clinical-api.service';

type ConsultationStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
type RequestStateFilter = 'ALL' | 'WITH_REQUESTS' | 'WITHOUT_REQUESTS';
type LabUrgency = 'Routine' | 'Urgent' | 'STAT';

interface LabRequestItem {
  test: string;
  urgency: LabUrgency;
  note?: string;
}

interface ConsultationLabRow {
  consultation: any;
  outcome: any | null;
  labRequests: LabRequestItem[];
}

@Component({
  selector: 'app-lab-requests-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './lab-requests.page.html',
  styleUrl: './lab-requests.page.scss'
})
export class LabRequestsPage implements OnInit {
  loading = false;
  saving = false;
  error = '';
  successMessage = '';

  rows: ConsultationLabRow[] = [];
  selectedConsultationId = '';

  filters = {
    patientQuery: '',
    status: 'ALL' as ConsultationStatus | 'ALL',
    requestState: 'ALL' as RequestStateFilter,
    urgency: 'ALL' as LabUrgency | 'ALL',
    requestSearch: ''
  };

  editorRequests: LabRequestItem[] = [];

  readonly statuses: Array<ConsultationStatus | 'ALL'> = ['ALL', 'OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
  readonly urgencies: LabUrgency[] = ['Routine', 'Urgent', 'STAT'];

  constructor(private api: ClinicalApiService) {}

  ngOnInit(): void {
    this.loadRows();
  }

  get filteredRows(): ConsultationLabRow[] {
    const term = this.filters.requestSearch.trim().toLowerCase();

    return this.rows.filter((row) => {
      const requests = row.labRequests ?? [];
      const matchesState = this.filters.requestState === 'ALL'
        || (this.filters.requestState === 'WITH_REQUESTS' && requests.length > 0)
        || (this.filters.requestState === 'WITHOUT_REQUESTS' && requests.length === 0);
      const matchesUrgency = this.filters.urgency === 'ALL'
        || requests.some((item) => item.urgency === this.filters.urgency);
      const matchesSearch = !term || this.rowTokens(row).some((value) => value.includes(term));
      return matchesState && matchesUrgency && matchesSearch;
    });
  }

  get selectedRow(): ConsultationLabRow | null {
    return this.filteredRows.find((row) => row.consultation?.id === this.selectedConsultationId) ?? null;
  }

  get totalConsultations(): number {
    return this.rows.length;
  }

  get consultationsWithRequests(): number {
    return this.rows.filter((row) => row.labRequests.length > 0).length;
  }

  get urgentRequestCount(): number {
    return this.rows.reduce((count, row) =>
      count + row.labRequests.filter((item) => item.urgency === 'Urgent' || item.urgency === 'STAT').length, 0);
  }

  get selectedRequestCount(): number {
    return this.editorRequests.length;
  }

  loadRows(): void {
    this.loading = true;
    this.error = '';
    this.successMessage = '';

    const status = this.filters.status === 'ALL' ? undefined : this.filters.status;
    this.api.listMyConsultations({
      patientQuery: this.filters.patientQuery.trim() || undefined,
      status
    }).subscribe({
      next: (consultations) => {
        const items = consultations ?? [];
        if (items.length === 0) {
          this.rows = [];
          this.selectedConsultationId = '';
          this.editorRequests = [];
          this.loading = false;
          return;
        }

        forkJoin(
          items.map((consultation) =>
            this.api.getConsultationOutcome(String(consultation.id)).pipe(
              map((outcome) => ({
                consultation,
                outcome,
                labRequests: this.parseLabRequests(outcome?.labRequests)
              })),
              catchError(() => of({
                consultation,
                outcome: null,
                labRequests: [] as LabRequestItem[]
              }))
            )
          )
        ).subscribe({
          next: (rows) => {
            this.rows = rows;
            this.ensureSelectedRow();
            this.loading = false;
          },
          error: () => {
            this.rows = [];
            this.loading = false;
            this.error = 'Failed to load lab requests.';
          }
        });
      },
      error: () => {
        this.rows = [];
        this.loading = false;
        this.error = 'Failed to load consultations for lab requests.';
      }
    });
  }

  applyFilters(): void {
    this.loadRows();
  }

  resetFilters(): void {
    this.filters = {
      patientQuery: '',
      status: 'ALL',
      requestState: 'ALL',
      urgency: 'ALL',
      requestSearch: ''
    };
    this.loadRows();
  }

  selectConsultation(row: ConsultationLabRow): void {
    this.selectedConsultationId = String(row.consultation?.id ?? '');
    this.editorRequests = row.labRequests.map((item) => ({ ...item }));
    this.successMessage = '';
    this.error = '';
  }

  addRequest(): void {
    this.editorRequests = [
      ...this.editorRequests,
      { test: '', urgency: 'Routine', note: '' }
    ];
  }

  removeRequest(index: number): void {
    this.editorRequests = this.editorRequests.filter((_, i) => i !== index);
  }

  clearAllRequests(): void {
    this.editorRequests = [];
  }

  saveRequests(): void {
    const selected = this.selectedRow;
    if (!selected) {
      this.error = 'Please select a consultation first.';
      return;
    }

    const cleaned = this.editorRequests
      .map((item) => ({
        test: (item.test ?? '').trim(),
        urgency: item.urgency ?? 'Routine',
        note: (item.note ?? '').trim()
      }))
      .filter((item) => item.test.length > 0);

    if (this.editorRequests.length > 0 && cleaned.length !== this.editorRequests.length) {
      this.error = 'Each lab request must include a test name or be removed.';
      return;
    }

    this.saving = true;
    this.error = '';
    this.successMessage = '';

    this.api.updateConsultationLabRequests(
      String(selected.consultation.id),
      this.serializeLabRequests(cleaned)
    ).subscribe({
      next: (outcome) => {
        const updatedRow: ConsultationLabRow = {
          consultation: selected.consultation,
          outcome,
          labRequests: cleaned
        };
        this.rows = this.rows.map((row) =>
          row.consultation?.id === selected.consultation.id ? updatedRow : row
        );
        this.editorRequests = cleaned.map((item) => ({ ...item }));
        this.saving = false;
        this.successMessage = cleaned.length
          ? 'Lab requests saved successfully.'
          : 'Lab requests cleared successfully.';
      },
      error: () => {
        this.saving = false;
        this.error = 'Failed to save lab requests.';
      }
    });
  }

  statusBadge(status?: string): string {
    if (status === 'COMPLETED') return 'bg-soft-success text-success';
    if (status === 'CANCELLED') return 'bg-soft-danger text-danger';
    if (status === 'IN_PROGRESS') return 'bg-soft-primary text-primary';
    return 'bg-soft-warning text-warning';
  }

  urgencyBadge(urgency: LabUrgency): string {
    if (urgency === 'STAT') return 'bg-soft-danger text-danger';
    if (urgency === 'Urgent') return 'bg-soft-warning text-warning';
    return 'bg-soft-info text-info';
  }

  requestPreview(row: ConsultationLabRow): string {
    if (!row.labRequests.length) return 'No lab requests saved';
    return row.labRequests.map((item) => item.test).slice(0, 2).join(', ');
  }

  private ensureSelectedRow(): void {
    const visible = this.filteredRows;
    const alreadySelected = visible.find((row) => row.consultation?.id === this.selectedConsultationId);
    if (alreadySelected) {
      this.editorRequests = alreadySelected.labRequests.map((item) => ({ ...item }));
      return;
    }

    const fallback = visible[0] ?? this.rows[0] ?? null;
    if (!fallback) {
      this.selectedConsultationId = '';
      this.editorRequests = [];
      return;
    }

    this.selectedConsultationId = String(fallback.consultation?.id ?? '');
    this.editorRequests = fallback.labRequests.map((item) => ({ ...item }));
  }

  private rowTokens(row: ConsultationLabRow): string[] {
    return [
      String(row.consultation?.id ?? ''),
      String(row.consultation?.patientId ?? ''),
      String(row.consultation?.patientName ?? ''),
      String(row.consultation?.status ?? ''),
      ...row.labRequests.flatMap((item) => [item.test ?? '', item.note ?? '', item.urgency ?? ''])
    ].map((value) => value.toLowerCase());
  }

  private parseLabRequests(raw: string | null | undefined): LabRequestItem[] {
    const source = (raw ?? '').trim();
    if (!source) return [];

    try {
      const parsed = JSON.parse(source);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((item) => item && typeof item === 'object')
          .map((item) => ({
            test: String(item.test ?? '').trim(),
            urgency: this.normalizeUrgency(String(item.urgency ?? 'Routine')),
            note: String(item.note ?? '').trim()
          }))
          .filter((item) => item.test.length > 0);
      }
    } catch {
      // Fallback to line-based parsing for legacy plain text.
    }

    return source
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const parts = line.split('|').map((part) => part.trim());
        if (parts.length >= 3) {
          return {
            urgency: this.normalizeUrgency(parts[0]),
            test: parts[1],
            note: parts.slice(2).join(' | ')
          };
        }

        return {
          test: line,
          urgency: 'Routine' as LabUrgency,
          note: ''
        };
      });
  }

  private serializeLabRequests(items: LabRequestItem[]): string {
    if (!items.length) return '';
    return JSON.stringify(items);
  }

  private normalizeUrgency(value: string): LabUrgency {
    if (value === 'STAT') return 'STAT';
    if (value === 'Urgent') return 'Urgent';
    return 'Routine';
  }
}
