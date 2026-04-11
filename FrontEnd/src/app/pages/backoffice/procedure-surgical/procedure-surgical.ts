import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProcedureApiService, SurgicalCase } from '../../../core/services/procedure-api.service';

@Component({
  selector: 'app-procedure-surgical',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './procedure-surgical.html',
  styleUrl: './procedure-surgical.scss'
})
export class ProcedureSurgicalComponent implements OnInit {
  loading = false;
  saving = false;
  errorMessage = '';
  successMessage = '';

  cases: SurgicalCase[] = [];
  searchTerm = '';
  caseStatusFilter = 'ALL';
  showArchived = false;
  readonly caseStatuses = [
    'OPEN',
    'READY_FOR_INTERVENTION',
    'BLOCKED_PREOP',
    'IN_PROGRESS',
    'POSTOP_STABLE',
    'POSTOP_UNSTABLE',
    'DONE',
    'CANCELLED',
    'ARCHIVED'
  ];
  readonly editableCaseStatuses = [
    'OPEN',
    'READY_FOR_INTERVENTION',
    'BLOCKED_PREOP',
    'IN_PROGRESS',
    'POSTOP_STABLE',
    'POSTOP_UNSTABLE',
    'DONE',
    'CANCELLED',
    'ARCHIVED'
  ];
  readonly offerStatuses = ['PENDING', 'ACCEPTED', 'REJECTED'];
  readonly surgeryCategories = ['MINOR_SURGERY', 'MAJOR_SURGERY'];
  readonly urgencyLevels = ['SCHEDULED', 'URGENT'];
  readonly genders = ['MALE', 'FEMALE'];
  readonly caseStatusLabels: Record<string, string> = {
    OPEN: 'Open',
    READY_FOR_INTERVENTION: 'Ready for Intervention',
    BLOCKED_PREOP: 'Blocked (Pre-Op)',
    IN_PROGRESS: 'In Progress',
    POSTOP_STABLE: 'Post-Op Stable',
    POSTOP_UNSTABLE: 'Post-Op Unstable',
    DONE: 'Done',
    CANCELLED: 'Cancelled',
    ARCHIVED: 'Archived'
  };
  readonly offerStatusLabels: Record<string, string> = {
    PENDING: 'Pending',
    ACCEPTED: 'Accepted',
    REJECTED: 'Rejected'
  };
  readonly surgeryCategoryLabels: Record<string, string> = {
    MINOR_SURGERY: 'Minor Surgery',
    MAJOR_SURGERY: 'Major Surgery'
  };
  readonly urgencyLabels: Record<string, string> = {
    SCHEDULED: 'Scheduled',
    URGENT: 'Urgent'
  };
  readonly genderLabels: Record<string, string> = {
    MALE: 'Male',
    FEMALE: 'Female'
  };

  createForm = {
    firstName: '',
    lastName: '',
    age: 0,
    gender: 'MALE',
    medicalRecordNumber: '',
    surgeryType: '',
    procedureName: '',
    surgeryCategory: 'MAJOR_SURGERY',
    urgencyLevel: 'SCHEDULED',
    surgeonId: '',
    assistantSurgeonId: '',
    anesthesiologistId: '',
    nurseTeam: '',
    scheduledDate: '',
    scheduledStartTime: '',
    estimatedDurationMinutes: 180,
    operatingRoom: '',
    status: 'OPEN'
  };

  editStatus: Record<number, string> = {};
  editOfferStatus: Record<number, string> = {};

  constructor(
    private procedureApi: ProcedureApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadCases();
  }

  get filteredCases(): SurgicalCase[] {
    const term = this.searchTerm.trim().toLowerCase();
    return this.cases.filter((surgicalCase) => {
      const isArchived = surgicalCase.status === 'ARCHIVED';
      if (!this.showArchived && isArchived) {
        return false;
      }

      const fullName = `${surgicalCase.firstName ?? ''} ${surgicalCase.lastName ?? ''}`.trim().toLowerCase();
      const surgeryType = (surgicalCase.surgeryType ?? '').toLowerCase();
      const procedureName = (surgicalCase.procedureName ?? '').toLowerCase();
      const medicalRecordNumber = (surgicalCase.medicalRecordNumber ?? '').toLowerCase();
      const operatingRoom = (surgicalCase.operatingRoom ?? '').toLowerCase();
      const matchesSearch =
        !term ||
        fullName.includes(term) ||
        surgeryType.includes(term) ||
        procedureName.includes(term) ||
        medicalRecordNumber.includes(term) ||
        operatingRoom.includes(term);
      const matchesCaseStatus =
        this.caseStatusFilter === 'ALL' || surgicalCase.status === this.caseStatusFilter;
      return matchesSearch && matchesCaseStatus;
    });
  }

  loadCases(): void {
    this.loading = true;
    this.errorMessage = '';

    this.procedureApi.getSurgicalCases().subscribe({
      next: (cases) => {
        this.cases = cases ?? [];
        this.editStatus = {};
        this.editOfferStatus = {};

        for (const surgicalCase of this.cases) {
          this.editStatus[surgicalCase.id] = surgicalCase.status;
          this.editOfferStatus[surgicalCase.id] = surgicalCase.offerStatus;
        }

        this.loading = false;
        this.refreshView();
      },
      error: (err: { error?: { message?: string }; message?: string }) => {
        this.loading = false;
        this.errorMessage = err?.error?.message || err?.message || 'Failed to load surgical cases.';
        this.refreshView();
      }
    });
  }

  createCase(): void {
    const firstName = this.createForm.firstName.trim();
    const lastName = this.createForm.lastName.trim();
    const age = Number(this.createForm.age);
    const gender = this.createForm.gender.trim();
    const medicalRecordNumber = this.createForm.medicalRecordNumber.trim();
    const surgeryType = this.createForm.surgeryType.trim();
    const procedureName = this.createForm.procedureName.trim();
    const surgeryCategory = this.createForm.surgeryCategory.trim();
    const urgencyLevel = this.createForm.urgencyLevel.trim();
    const surgeonId = this.createForm.surgeonId.trim();
    const assistantSurgeonId = this.createForm.assistantSurgeonId.trim() || null;
    const anesthesiologistId = this.createForm.anesthesiologistId.trim() || null;
    const nurseTeam = this.createForm.nurseTeam.trim() || null;
    const scheduledDate = this.createForm.scheduledDate;
    const scheduledStartTime = this.createForm.scheduledStartTime;
    const estimatedDurationMinutes = Number(this.createForm.estimatedDurationMinutes);
    const operatingRoom = this.createForm.operatingRoom.trim() || null;
    const status = 'OPEN';

    if (
      !firstName
      || !lastName
      || !age
      || !gender
      || !medicalRecordNumber
      || !surgeryType
      || !procedureName
      || !surgeryCategory
      || !urgencyLevel
      || !surgeonId
      || !scheduledDate
      || !scheduledStartTime
      || !estimatedDurationMinutes
    ) {
      this.errorMessage = 'Please fill required fields: patient, operation, team and planning.';
      return;
    }

    const patientId = `PT-${Date.now()}`;

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.procedureApi.createSurgicalCase({
      patientId,
      firstName,
      lastName,
      age,
      gender,
      medicalRecordNumber,
      surgeryType,
      procedureName,
      surgeryCategory,
      urgencyLevel,
      surgeonId,
      assistantSurgeonId,
      anesthesiologistId,
      nurseTeam,
      scheduledDate,
      scheduledStartTime,
      estimatedDurationMinutes,
      operatingRoom,
      status
    }).subscribe({
      next: () => {
        this.createForm = {
          firstName: '',
          lastName: '',
          age: 0,
          gender: 'MALE',
          medicalRecordNumber: '',
          surgeryType: '',
          procedureName: '',
          surgeryCategory: 'MAJOR_SURGERY',
          urgencyLevel: 'SCHEDULED',
          surgeonId: '',
          assistantSurgeonId: '',
          anesthesiologistId: '',
          nurseTeam: '',
          scheduledDate: '',
          scheduledStartTime: '',
          estimatedDurationMinutes: 180,
          operatingRoom: '',
          status: 'OPEN'
        };
        this.successMessage = 'Surgical case created successfully.';
        this.saving = false;
        this.refreshView();
        this.loadCases();
      },
      error: (err: { error?: { message?: string }; message?: string }) => {
        this.saving = false;
        this.errorMessage = err?.error?.message || err?.message || 'Failed to create surgical case.';
        this.refreshView();
      }
    });
  }

  updateStatus(surgicalCase: SurgicalCase): void {
    const status = (this.editStatus[surgicalCase.id] ?? '').trim().toUpperCase();

    if (!status) {
      this.errorMessage = 'Case status is required.';
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    this.procedureApi.updateSurgicalCase(surgicalCase.id, { status }).subscribe({
      next: () => {
        this.successMessage = 'Surgical case status updated.';
        this.refreshView();
        this.loadCases();
      },
      error: (err: { error?: { message?: string }; message?: string }) => {
        this.errorMessage = err?.error?.message || err?.message || 'Failed to update surgical case.';
        this.refreshView();
      }
    });
  }

  updateOffer(surgicalCase: SurgicalCase): void {
    const offerStatus = (this.editOfferStatus[surgicalCase.id] ?? '').trim().toUpperCase();

    if (!offerStatus) {
      this.errorMessage = 'Offer status is required.';
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    this.procedureApi.updateTransplantOffer(surgicalCase.id, { offerStatus }).subscribe({
      next: () => {
        this.successMessage = 'Transplant offer updated.';
        this.refreshView();
        this.loadCases();
      },
      error: (err: { error?: { message?: string }; message?: string }) => {
        this.errorMessage = err?.error?.message || err?.message || 'Failed to update transplant offer.';
        this.refreshView();
      }
    });
  }

  archiveCase(surgicalCase: SurgicalCase): void {
    if (surgicalCase.status === 'ARCHIVED') {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    this.procedureApi.updateSurgicalCase(surgicalCase.id, { status: 'ARCHIVED' }).subscribe({
      next: () => {
        this.successMessage = 'Surgical case archived successfully.';
        this.refreshView();
        this.loadCases();
      },
      error: (err: { error?: { message?: string }; message?: string }) => {
        this.errorMessage = err?.error?.message || err?.message || 'Failed to archive surgical case.';
        this.refreshView();
      }
    });
  }

  labelFrom(labels: Record<string, string>, value: string | null | undefined): string {
    if (!value) {
      return '-';
    }
    return labels[value] ?? value;
  }

  formatDateTime(date: string | null | undefined, time: string | null | undefined): string {
    const datePart = (date ?? '').trim();
    const timePart = (time ?? '').trim();
    if (!datePart && !timePart) {
      return '-';
    }

    const safeTime = timePart.length >= 5 ? timePart.slice(0, 5) : timePart;
    return `${datePart || '-'} ${safeTime || ''}`.trim();
  }

  isLockedCase(surgicalCase: SurgicalCase): boolean {
    return surgicalCase.status === 'BLOCKED_PREOP' || surgicalCase.status === 'POSTOP_UNSTABLE';
  }

  private refreshView(): void {
    this.cdr.detectChanges();
  }
}
