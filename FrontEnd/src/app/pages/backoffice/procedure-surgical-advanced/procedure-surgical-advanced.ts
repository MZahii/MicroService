import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  Complication,
  PostOpObservation,
  PreOpAssessment,
  ProcedureApiService,
  SurgicalCase
} from '../../../core/services/procedure-api.service';

@Component({
  selector: 'app-procedure-surgical-advanced',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './procedure-surgical-advanced.html',
  styleUrl: './procedure-surgical-advanced.scss'
})
export class ProcedureSurgicalAdvancedComponent implements OnInit {
  loading = false;
  saving = false;
  errorMessage = '';
  successMessage = '';

  surgicalCases: SurgicalCase[] = [];
  preOps: PreOpAssessment[] = [];
  postOps: PostOpObservation[] = [];
  complications: Complication[] = [];

  selectedCaseId = '';
  editingComplicationId: number | null = null;

  preOpForm = {
    hemodynamicsOk: false,
    infectionScreenOk: false,
    anesthesiaClearanceOk: false,
    consentSigned: false,
    note: ''
  };

  postOpForm = {
    hemodynamicsStable: false,
    bleedingControlled: false,
    painControlled: false,
    consciousnessNormal: false,
    note: ''
  };

  complicationForm = {
    description: ''
  };

  constructor(
    private procedureApi: ProcedureApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadAll();
  }

  get selectedCase(): SurgicalCase | undefined {
    const id = Number(this.selectedCaseId);
    return this.surgicalCases.find((c) => c.id === id);
  }

  get preOpEligible(): boolean {
    return this.preOpForm.hemodynamicsOk
      && this.preOpForm.infectionScreenOk
      && this.preOpForm.anesthesiaClearanceOk
      && this.preOpForm.consentSigned;
  }

  get preOpDecisionLabel(): string {
    return this.preOpEligible ? 'ELIGIBLE FOR INTERVENTION' : 'BLOCKED - PRE-OP NOT VALIDATED';
  }

  get postOpStable(): boolean {
    return this.postOpForm.hemodynamicsStable
      && this.postOpForm.bleedingControlled
      && this.postOpForm.painControlled
      && this.postOpForm.consciousnessNormal;
  }

  get postOpDecisionLabel(): string {
    return this.postOpStable ? 'PATIENT STABLE' : 'PATIENT NOT STABLE';
  }

  get preOpHistoryForSelectedCase(): PreOpAssessment[] {
    const id = Number(this.selectedCaseId);
    return this.preOps.filter((p) => p.surgicalCaseId === id);
  }

  get postOpHistoryForSelectedCase(): PostOpObservation[] {
    const id = Number(this.selectedCaseId);
    return this.postOps.filter((p) => p.surgicalCaseId === id);
  }

  get complicationsForSelectedCase(): Complication[] {
    const id = Number(this.selectedCaseId);
    return this.complications.filter((item) => item.surgicalCaseId === id);
  }

  parseRecord(notes: string | null | undefined): Record<string, string> {
    const parsed: Record<string, string> = {};
    const raw = (notes ?? '').trim();
    if (!raw.includes(';') || !raw.includes('=')) {
      parsed['note'] = raw;
      return parsed;
    }

    for (const part of raw.split(';')) {
      const index = part.indexOf('=');
      if (index <= 0) continue;
      const key = part.slice(0, index).trim();
      const value = part.slice(index + 1).trim();
      parsed[key] = value;
    }

    return parsed;
  }

  yesNo(value: string | undefined): string {
    return value === 'true' ? 'Yes' : 'No';
  }

  loadAll(): void {
    this.loading = true;
    this.errorMessage = '';

    this.procedureApi.getSurgicalCases().subscribe({
      next: (cases) => {
        this.surgicalCases = cases ?? [];
        if (!this.selectedCaseId && this.surgicalCases.length > 0) {
          this.selectedCaseId = String(this.surgicalCases[0].id);
        }
        this.loadObservations();
        this.refreshView();
      },
      error: (err: { error?: { message?: string }; message?: string }) => {
        this.loading = false;
        this.errorMessage = err?.error?.message || err?.message || 'Failed to load surgical cases.';
        this.refreshView();
      }
    });
  }

  loadObservations(): void {
    this.procedureApi.getPreOpAssessments().subscribe({
      next: (preOps) => {
        this.preOps = preOps ?? [];
        this.procedureApi.getPostOpObservations().subscribe({
          next: (postOps) => {
            this.postOps = postOps ?? [];
            this.procedureApi.getComplications().subscribe({
              next: (complications) => {
                this.complications = complications ?? [];
                this.loading = false;
                this.refreshView();
              },
              error: (err: { error?: { message?: string }; message?: string }) => {
                this.loading = false;
                this.errorMessage = err?.error?.message || err?.message || 'Failed to load complications.';
                this.refreshView();
              }
            });
          },
          error: (err: { error?: { message?: string }; message?: string }) => {
            this.loading = false;
            this.errorMessage = err?.error?.message || err?.message || 'Failed to load post-op observations.';
            this.refreshView();
          }
        });
      },
      error: (err: { error?: { message?: string }; message?: string }) => {
        this.loading = false;
        this.errorMessage = err?.error?.message || err?.message || 'Failed to load pre-op assessments.';
        this.refreshView();
      }
    });
  }

  startComplicationEdit(item: Complication): void {
    this.editingComplicationId = item.id;
    this.complicationForm.description = item.description ?? '';
    this.errorMessage = '';
    this.successMessage = '';
    this.refreshView();
  }

  cancelComplicationEdit(): void {
    this.editingComplicationId = null;
    this.complicationForm.description = '';
    this.refreshView();
  }

  submitComplication(): void {
    const surgicalCaseId = Number(this.selectedCaseId);
    const description = this.complicationForm.description.trim();

    if (!surgicalCaseId || Number.isNaN(surgicalCaseId)) {
      this.errorMessage = 'Please select a surgical case.';
      this.refreshView();
      return;
    }

    if (description.length < 5) {
      this.errorMessage = 'Complication description must contain at least 5 characters.';
      this.refreshView();
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const request$ = this.editingComplicationId
      ? this.procedureApi.updateComplication(this.editingComplicationId, { description })
      : this.procedureApi.createComplication({ surgicalCaseId, description });

    request$.subscribe({
      next: () => {
        this.successMessage = this.editingComplicationId
          ? 'Complication updated successfully.'
          : 'Complication recorded successfully.';
        this.saving = false;
        this.editingComplicationId = null;
        this.complicationForm.description = '';
        this.refreshView();
        this.loadAll();
      },
      error: (err: { error?: { message?: string }; message?: string }) => {
        this.saving = false;
        this.errorMessage = err?.error?.message || err?.message || 'Failed to save complication.';
        this.refreshView();
      }
    });
  }

  submitPreOp(): void {
    const surgicalCaseId = Number(this.selectedCaseId);
    if (!surgicalCaseId || Number.isNaN(surgicalCaseId)) {
      this.errorMessage = 'Please select a surgical case.';
      return;
    }

    const note = this.preOpForm.note.trim();
    const formattedNotes =
      `hemodynamicsOk=${this.preOpForm.hemodynamicsOk};` +
      `infectionScreenOk=${this.preOpForm.infectionScreenOk};` +
      `anesthesiaClearanceOk=${this.preOpForm.anesthesiaClearanceOk};` +
      `consentSigned=${this.preOpForm.consentSigned};` +
      `decision=${this.preOpDecisionLabel};` +
      `note=${note}`;

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.procedureApi.createPreOpAssessment({ surgicalCaseId, notes: formattedNotes }).subscribe({
      next: () => {
        this.successMessage = `Pre-Op submitted. Decision: ${this.preOpDecisionLabel}. Case status updated automatically.`;
        this.saving = false;
        this.refreshView();
        this.loadAll();
      },
      error: (err: { error?: { message?: string }; message?: string }) => {
        this.saving = false;
        this.errorMessage = err?.error?.message || err?.message || 'Failed to submit pre-op.';
        this.refreshView();
      }
    });
  }

  submitPostOp(): void {
    const surgicalCaseId = Number(this.selectedCaseId);
    if (!surgicalCaseId || Number.isNaN(surgicalCaseId)) {
      this.errorMessage = 'Please select a surgical case.';
      return;
    }

    const note = this.postOpForm.note.trim();
    const formattedNotes =
      `hemodynamicsStable=${this.postOpForm.hemodynamicsStable};` +
      `bleedingControlled=${this.postOpForm.bleedingControlled};` +
      `painControlled=${this.postOpForm.painControlled};` +
      `consciousnessNormal=${this.postOpForm.consciousnessNormal};` +
      `decision=${this.postOpDecisionLabel};` +
      `note=${note}`;

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.procedureApi.createPostOpObservation({ surgicalCaseId, notes: formattedNotes }).subscribe({
      next: () => {
        this.successMessage = `Post-Op submitted. Decision: ${this.postOpDecisionLabel}. Care tasks may be auto-generated if unstable.`;
        this.saving = false;
        this.refreshView();
        this.loadAll();
      },
      error: (err: { error?: { message?: string }; message?: string }) => {
        this.saving = false;
        this.errorMessage = err?.error?.message || err?.message || 'Failed to submit post-op.';
        this.refreshView();
      }
    });
  }

  private refreshView(): void {
    this.cdr.detectChanges();
  }
}
