import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  DialysisPlan,
  DialysisPrescription,
  ProcedureApiService
} from '../../../core/services/procedure-api.service';

@Component({
  selector: 'app-procedure-dialysis-prescriptions',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './procedure-dialysis-prescriptions.html',
  styleUrl: './procedure-dialysis-prescriptions.scss'
})
export class ProcedureDialysisPrescriptionsComponent implements OnInit {
  loading = false;
  saving = false;
  errorMessage = '';
  successMessage = '';

  plans: DialysisPlan[] = [];
  prescriptions: DialysisPrescription[] = [];

  selectedPlanId = '';
  createDetails = '';
  searchTerm = '';

  editDetails: Record<number, string> = {};

  constructor(
    private procedureApi: ProcedureApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadInitialData();
  }

  get filteredPrescriptions(): DialysisPrescription[] {
    const term = this.searchTerm.trim().toLowerCase();

    return this.prescriptions.filter((prescription) => {
      if (!term) {
        return true;
      }
      return this.getPlanDisplay(prescription.planId).toLowerCase().includes(term);
    });
  }

  getPlanDisplay(planId: number): string {
    const plan = this.plans.find((p) => p.id === planId);
    if (!plan) {
      return 'Unknown patient';
    }

    return `${plan.firstName || '-'} ${plan.lastName || ''}`.trim();
  }

  loadInitialData(): void {
    this.loading = true;
    this.errorMessage = '';

    this.procedureApi.getDialysisPlans().subscribe({
      next: (plans) => {
        this.plans = plans ?? [];
        if (!this.selectedPlanId && this.plans.length > 0) {
          this.selectedPlanId = String(this.plans[0].id);
        }
        this.loadPrescriptions();
        this.refreshView();
      },
      error: (err: { error?: { message?: string }; message?: string }) => {
        this.loading = false;
        this.errorMessage = err?.error?.message || err?.message || 'Failed to load dialysis plans.';
        this.refreshView();
      }
    });
  }

  loadPrescriptions(): void {
    this.procedureApi.getDialysisPrescriptions().subscribe({
      next: (prescriptions) => {
        this.prescriptions = prescriptions ?? [];
        this.editDetails = {};
        for (const prescription of this.prescriptions) {
          this.editDetails[prescription.id] = prescription.details ?? '';
        }
        this.loading = false;
        this.refreshView();
      },
      error: (err: { error?: { message?: string }; message?: string }) => {
        this.loading = false;
        this.errorMessage = err?.error?.message || err?.message || 'Failed to load dialysis prescriptions.';
        this.refreshView();
      }
    });
  }

  createPrescription(): void {
    const planId = Number(this.selectedPlanId);
    const details = this.createDetails.trim();

    if (!planId || Number.isNaN(planId)) {
      this.errorMessage = 'Plan is required.';
      return;
    }

    if (!details) {
      this.errorMessage = 'Prescription details are required.';
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.procedureApi.createDialysisPrescription({ planId, details }).subscribe({
      next: () => {
        this.successMessage = 'Dialysis prescription created successfully.';
        this.createDetails = '';
        this.saving = false;
        this.refreshView();
        this.loadPrescriptions();
      },
      error: (err: { error?: { message?: string }; message?: string }) => {
        this.saving = false;
        this.errorMessage = err?.error?.message || err?.message || 'Failed to create dialysis prescription.';
        this.refreshView();
      }
    });
  }

  updatePrescription(prescription: DialysisPrescription): void {
    const details = (this.editDetails[prescription.id] ?? '').trim();

    if (!details) {
      this.errorMessage = 'Prescription details are required.';
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    this.procedureApi.updateDialysisPrescription(prescription.id, { details }).subscribe({
      next: () => {
        this.successMessage = 'Dialysis prescription updated successfully.';
        this.refreshView();
        this.loadPrescriptions();
      },
      error: (err: { error?: { message?: string }; message?: string }) => {
        this.errorMessage = err?.error?.message || err?.message || 'Failed to update dialysis prescription.';
        this.refreshView();
      }
    });
  }

  private refreshView(): void {
    this.cdr.detectChanges();
  }
}
