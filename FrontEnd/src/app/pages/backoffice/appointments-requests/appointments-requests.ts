import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AppointmentsApiService, AppointmentRequestItem, AppointmentStatus, PatientDirectoryItem } from '../../../core/services/appointments-api.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-appointments-requests',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './appointments-requests.html',
  styleUrl: './appointments-requests.scss'
})
export class AppointmentsRequestsComponent implements OnInit {
  loading = true;
  actionLoading = false;
  errorMessage = '';
  successMessage = '';
  toastMessage = '';
  items: AppointmentRequestItem[] = [];
  search = '';
  dateFilter = '';
  page = 1;
  readonly pageSize = 10;
  patientsById: Record<number, string> = {};
  private toastTimer?: ReturnType<typeof setTimeout>;

  sortBy: 'patient' | 'type' | 'requestedDate' | 'preferredTime' | 'status' = 'requestedDate';
  sortDirection: 'asc' | 'desc' = 'desc';

  statusFilter: AppointmentStatus | 'ALL' = 'ALL';
  readonly statuses: Array<AppointmentStatus | 'ALL'> = ['ALL', 'REQUESTED', 'APPROVED', 'REJECTED', 'CANCELLED'];
  readonly rejectReasons = ['Doctor unavailable', 'Time slot full', 'Incomplete information', 'Other'];
  readonly doctorOptions = ['Dr. Sarah Martin', 'Dr. Adam Ben Salem', 'Dr. Leila Trabelsi', 'Dr. Karim Gharbi'];

  detailsModalOpen = false;
  approveModalOpen = false;
  rejectModalOpen = false;
  selectedId = '';
  scheduledDate = '';
  scheduledTime = '';
  assignedDoctor = '';
  location = '';
  approvalNotes = '';
  rejectReason = '';
  rejectNotes = '';
  rejectConfirmed = false;

  constructor(private appointmentsApi: AppointmentsApiService) {}

  ngOnInit(): void {
    this.loadPatientsDirectory();
    this.load();
  }

  ngOnDestroy(): void {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
  }

  private loadPatientsDirectory(): void {
    this.appointmentsApi.getPatientsDirectory().subscribe({
      next: (patients) => {
        this.patientsById = patients.reduce((acc: Record<number, string>, patient: PatientDirectoryItem) => {
          acc[patient.id] = `${patient.firstName} ${patient.lastName}`.trim();
          return acc;
        }, {});
      },
      error: () => {
        this.patientsById = {};
      }
    });
  }

  getPatientDisplay(patientId: number): string {
    return this.patientsById[patientId] ?? `#${patientId}`;
  }

  get selectedRequest(): AppointmentRequestItem | undefined {
    return this.items.find(item => item.id === this.selectedId);
  }

  getRequestType(item: AppointmentRequestItem): string {
    const source = item.reason.toLowerCase();
    if (source.includes('dialysis')) return 'Dialysis';
    if (source.includes('lab')) return 'Lab Test';
    if (source.includes('follow')) return 'Follow-up';
    if (source.includes('emergency')) return 'Emergency';
    return 'Consultation';
  }

  getPreferredTime(item: AppointmentRequestItem): string {
    if (!item.requestedDate) return 'No Preference';
    const date = new Date(item.requestedDate);
    if (Number.isNaN(date.getTime())) return 'No Preference';
    const hour = date.getHours();
    if (hour >= 8 && hour < 12) return 'Morning (8:00 - 12:00)';
    if (hour >= 14 && hour < 18) return 'Afternoon (14:00 - 18:00)';
    return 'No Preference';
  }

  getDisplayReason(item: AppointmentRequestItem): string {
    return item.reason;
  }

  getStatusBadgeClass(status: AppointmentStatus): string {
    if (status === 'APPROVED') return 'text-bg-success';
    if (status === 'REJECTED' || status === 'CANCELLED') return 'text-bg-secondary';
    return 'text-bg-warning';
  }

  get minDateTimeLocal(): string {
    const now = new Date();
    now.setSeconds(0, 0);
    const offset = now.getTimezoneOffset();
    const localDate = new Date(now.getTime() - offset * 60000);
    return localDate.toISOString().slice(0, 16);
  }

  get isScheduledDateInvalid(): boolean {
    if (!this.scheduledDate || !this.scheduledTime) return true;
    return new Date(`${this.scheduledDate}T${this.scheduledTime}`).getTime() <= Date.now();
  }

  get isApproveFormInvalid(): boolean {
    return !this.scheduledDate || !this.scheduledTime || !this.assignedDoctor || this.isScheduledDateInvalid;
  }

  get rejectNotesLength(): number {
    return this.rejectNotes.length;
  }

  get approvalNotesLength(): number {
    return this.approvalNotes.length;
  }

  get isRejectFormInvalid(): boolean {
    return !this.rejectReason || !this.rejectNotes.trim() || this.rejectNotes.length > 500 || !this.rejectConfirmed;
  }

  private compareText(a: string, b: string): number {
    return a.localeCompare(b, undefined, { sensitivity: 'base' });
  }

  setSort(column: 'patient' | 'type' | 'requestedDate' | 'preferredTime' | 'status'): void {
    if (this.sortBy === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = column;
      this.sortDirection = 'asc';
    }
    this.page = 1;
  }

  get filteredItems(): AppointmentRequestItem[] {
    const q = this.search.trim().toLowerCase();

    const filtered = this.items
      .filter(item => {
        const patientName = this.getPatientDisplay(item.patientId).toLowerCase();
        const matchesText = !q
          || this.getDisplayReason(item).toLowerCase().includes(q)
          || patientName.includes(q)
          || String(item.patientId).includes(q)
          || item.status.toLowerCase().includes(q);

        const matchesDate = !this.dateFilter
          || item.createdAt.startsWith(this.dateFilter)
          || (item.requestedDate?.startsWith(this.dateFilter) ?? false)
          || (item.scheduledDate?.startsWith(this.dateFilter) ?? false);

        return matchesText && matchesDate && (this.statusFilter === 'ALL' || item.status === this.statusFilter);
      })
      .sort((a, b) => {
        let result = 0;
        if (this.sortBy === 'patient') {
          result = this.compareText(this.getPatientDisplay(a.patientId), this.getPatientDisplay(b.patientId));
        } else if (this.sortBy === 'type') {
          result = this.compareText(this.getRequestType(a), this.getRequestType(b));
        } else if (this.sortBy === 'requestedDate') {
          result = new Date(a.requestedDate ?? a.createdAt).getTime() - new Date(b.requestedDate ?? b.createdAt).getTime();
        } else if (this.sortBy === 'preferredTime') {
          result = this.compareText(this.getPreferredTime(a), this.getPreferredTime(b));
        } else {
          result = this.compareText(a.status, b.status);
        }

        return this.sortDirection === 'asc' ? result : -result;
      });

    return filtered;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredItems.length / this.pageSize));
  }

  get pagedItems(): AppointmentRequestItem[] {
    const safePage = Math.min(this.page, this.totalPages);
    const start = (safePage - 1) * this.pageSize;
    return this.filteredItems.slice(start, start + this.pageSize);
  }

  onFiltersChange(): void {
    this.page = 1;
  }

  previousPage(): void {
    this.page = Math.max(1, this.page - 1);
  }

  nextPage(): void {
    this.page = Math.min(this.totalPages, this.page + 1);
  }

  load(): void {
    this.loading = true;
    this.errorMessage = '';
    this.appointmentsApi.getRequests(this.statusFilter === 'ALL' ? undefined : this.statusFilter).pipe(
      finalize(() => {
        this.loading = false;
      })
    ).subscribe({
      next: (items) => {
        this.items = items;
        this.page = 1;
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Unable to load appointment requests.';
      }
    });
  }

  openApproveModal(id: string): void {
    this.selectedId = id;
    this.scheduledDate = '';
    this.scheduledTime = '';
    this.assignedDoctor = '';
    this.location = '';
    this.approvalNotes = '';
    this.approveModalOpen = true;
  }

  openDetailsModal(id: string): void {
    this.selectedId = id;
    this.detailsModalOpen = true;
  }

  openRejectModal(id: string): void {
    this.selectedId = id;
    this.rejectReason = '';
    this.rejectNotes = '';
    this.rejectConfirmed = false;
    this.rejectModalOpen = true;
  }

  closeApproveModal(): void {
    this.approveModalOpen = false;
  }

  closeRejectModal(): void {
    this.rejectModalOpen = false;
  }

  closeDetailsModal(): void {
    this.detailsModalOpen = false;
  }

  private showToast(message: string): void {
    this.toastMessage = message;
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
    this.toastTimer = setTimeout(() => {
      this.toastMessage = '';
    }, 2500);
  }

  private buildApprovalNotes(): string {
    const details = [
      `Assigned Doctor: ${this.assignedDoctor}`,
      this.location.trim() ? `Location/Room: ${this.location.trim()}` : null,
      this.approvalNotes.trim() ? `Receptionist Notes: ${this.approvalNotes.trim()}` : null
    ].filter(Boolean);

    return details.join(' | ');
  }

  approve(): void {
    if (!this.selectedId || this.isApproveFormInvalid || this.actionLoading) return;
    this.actionLoading = true;
    this.successMessage = '';

    const scheduledDateTime = `${this.scheduledDate}T${this.scheduledTime}:00`;

    this.appointmentsApi.approve(this.selectedId, {
      scheduledDate: scheduledDateTime,
      receptionistNotes: this.buildApprovalNotes() || null
    }).pipe(
      finalize(() => {
        this.actionLoading = false;
      })
    ).subscribe({
      next: () => {
        this.actionLoading = false;
        this.successMessage = 'Appointment request approved successfully.';
        this.closeApproveModal();
        this.load();
        this.showToast('Request approved and guardian notification sent.');
      },
      error: (err) => {
        this.actionLoading = false;
        this.errorMessage = err?.error?.message || 'Unable to approve this request right now. Please try again.';
      }
    });
  }

  reject(): void {
    if (!this.selectedId || this.isRejectFormInvalid || this.actionLoading) return;
    this.actionLoading = true;
    this.successMessage = '';

    this.appointmentsApi.reject(this.selectedId, {
      receptionistNotes: `Reason: ${this.rejectReason} | Notes: ${this.rejectNotes.trim()}`
    }).pipe(
      finalize(() => {
        this.actionLoading = false;
      })
    ).subscribe({
      next: () => {
        this.actionLoading = false;
        this.successMessage = 'Appointment request rejected successfully.';
        this.closeRejectModal();
        this.load();
        this.showToast('Request rejected and guardian notification sent.');
      },
      error: (err) => {
        this.actionLoading = false;
        this.errorMessage = err?.error?.message || 'Unable to reject this request right now. Please verify the details and try again.';
      }
    });
  }
}
