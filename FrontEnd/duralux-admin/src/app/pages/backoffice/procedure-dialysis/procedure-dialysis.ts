import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DialysisPlan, ProcedureApiService } from '../../../core/services/procedure-api.service';

@Component({
  selector: 'app-procedure-dialysis',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './procedure-dialysis.html',
  styleUrl: './procedure-dialysis.scss'
})
export class ProcedureDialysisComponent implements OnInit {
  loading = false;
  saving = false;
  errorMessage = '';
  successMessage = '';

  plans: DialysisPlan[] = [];
  searchTerm = '';
  statusFilter = 'ALL';
  showArchived = false;
  readonly planStatuses = ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'ARCHIVED'];
  readonly dialysisTypes = ['HEMODIALYSIS', 'PERITONEAL_DIALYSIS'];

  createForm = {
    firstName: '',
    lastName: '',
    doctorId: '',
    dialysisType: 'HEMODIALYSIS',
    sessionsPerWeek: 3,
    sessionDurationMinutes: 240,
    startDate: '',
    endDate: '',
    daysOfWeek: 'Monday, Wednesday, Friday',
    bloodFlowRate: null as number | null,
    dialysateFlowRate: null as number | null,
    ultrafiltrationGoal: null as number | null,
    dialysisCenterId: '',
    roomNumber: '',
    machineId: ''
  };

  editState: Record<number, string> = {};

  constructor(private procedureApi: ProcedureApiService) {}

  ngOnInit(): void {
    this.loadPlans();
  }

  get filteredPlans(): DialysisPlan[] {
    const term = this.searchTerm.trim().toLowerCase();
    return this.plans.filter((plan) => {
      const isArchived = plan.status === 'ARCHIVED';
      if (!this.showArchived && isArchived) {
        return false;
      }

      const matchesStatus = this.statusFilter === 'ALL' || plan.status === this.statusFilter;
      const fullName = `${plan.firstName ?? ''} ${plan.lastName ?? ''}`.trim().toLowerCase();
      const matchesSearch =
        !term ||
        fullName.includes(term);
      return matchesStatus && matchesSearch;
    });
  }

  loadPlans(): void {
    this.loading = true;
    this.errorMessage = '';

    this.procedureApi.getDialysisPlans().subscribe({
      next: (plans) => {
        this.plans = plans ?? [];
        this.editState = this.plans.reduce<Record<number, string>>((acc, plan) => {
          acc[plan.id] = plan.status;
          return acc;
        }, {});
        this.loading = false;
      },
      error: (err: { error?: { message?: string }; message?: string }) => {
        this.loading = false;
        this.errorMessage = err?.error?.message || err?.message || 'Failed to load dialysis plans.';
      }
    });
  }

  createPlan(): void {
    const firstName = this.createForm.firstName.trim();
    const lastName = this.createForm.lastName.trim();
    const doctorId = this.createForm.doctorId.trim();
    const dialysisType = this.createForm.dialysisType.trim();
    const sessionsPerWeek = Number(this.createForm.sessionsPerWeek);
    const sessionDurationMinutes = Number(this.createForm.sessionDurationMinutes);
    const startDate = this.createForm.startDate;
    const endDate = this.createForm.endDate || null;
    const daysOfWeek = this.createForm.daysOfWeek.trim();
    const bloodFlowRate = this.createForm.bloodFlowRate;
    const dialysateFlowRate = this.createForm.dialysateFlowRate;
    const ultrafiltrationGoal = this.createForm.ultrafiltrationGoal;
    const dialysisCenterId = this.createForm.dialysisCenterId.trim() || null;
    const roomNumber = this.createForm.roomNumber.trim() || null;
    const machineId = this.createForm.machineId.trim() || null;
    const status = 'PLANNED';

    if (
      !firstName
      || !lastName
      || !doctorId
      || !dialysisType
      || !sessionsPerWeek
      || !sessionDurationMinutes
      || !startDate
      || !daysOfWeek
    ) {
      this.errorMessage = 'Please fill required fields: patient, doctor, type, frequency and planning.';
      return;
    }

    const patientId = `PT-${Date.now()}`;

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.procedureApi.createDialysisPlan({
      patientId,
      firstName,
      lastName,
      doctorId,
      dialysisType,
      sessionsPerWeek,
      sessionDurationMinutes,
      startDate,
      endDate,
      daysOfWeek,
      bloodFlowRate,
      dialysateFlowRate,
      ultrafiltrationGoal,
      dialysisCenterId,
      roomNumber,
      machineId,
      status
    }).subscribe({
      next: () => {
        this.createForm = {
          firstName: '',
          lastName: '',
          doctorId: '',
          dialysisType: 'HEMODIALYSIS',
          sessionsPerWeek: 3,
          sessionDurationMinutes: 240,
          startDate: '',
          endDate: '',
          daysOfWeek: 'Monday, Wednesday, Friday',
          bloodFlowRate: null,
          dialysateFlowRate: null,
          ultrafiltrationGoal: null,
          dialysisCenterId: '',
          roomNumber: '',
          machineId: ''
        };
        this.successMessage = 'Dialysis plan created successfully.';
        this.saving = false;
        this.loadPlans();
      },
      error: (err: { error?: { message?: string }; message?: string }) => {
        this.saving = false;
        this.errorMessage = err?.error?.message || err?.message || 'Failed to create dialysis plan.';
      }
    });
  }

  updatePlan(plan: DialysisPlan): void {
    const status = (this.editState[plan.id] ?? '').trim().toUpperCase();

    if (!status) {
      this.errorMessage = 'Status is required.';
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    this.procedureApi.updateDialysisPlan(plan.id, { status }).subscribe({
      next: () => {
        this.successMessage = 'Dialysis plan updated successfully.';
        this.loadPlans();
      },
      error: (err: { error?: { message?: string }; message?: string }) => {
        this.errorMessage = err?.error?.message || err?.message || 'Failed to update dialysis plan.';
      }
    });
  }

  archivePlan(plan: DialysisPlan): void {
    if (plan.status === 'ARCHIVED') {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    this.procedureApi.updateDialysisPlan(plan.id, { status: 'ARCHIVED' }).subscribe({
      next: () => {
        this.successMessage = 'Dialysis plan archived successfully.';
        this.loadPlans();
      },
      error: (err: { error?: { message?: string }; message?: string }) => {
        this.errorMessage = err?.error?.message || err?.message || 'Failed to archive dialysis plan.';
      }
    });
  }

}
