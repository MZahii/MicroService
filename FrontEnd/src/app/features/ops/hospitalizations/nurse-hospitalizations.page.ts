import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  HospitalizationCaseDto,
  HospitalizationSummaryDto,
  HospitalizationTaskDto,
  HospitalizationTaskStatus,
  OpsApiService
} from '../../../core/services/ops-api.service';

interface TaskDraftState {
  status: HospitalizationTaskStatus;
  note: string;
  numericValue: number | null;
  textValue: string;
  unit: string;
}

@Component({
  selector: 'app-nurse-hospitalizations-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './nurse-hospitalizations.page.html',
  styleUrl: './nurse-hospitalizations.page.scss'
})
export class NurseHospitalizationsPage implements OnInit {
  loading = false;
  savingTaskId = '';
  error = '';
  detailError = '';
  summaries: HospitalizationSummaryDto[] = [];
  selectedHospitalization: HospitalizationCaseDto | null = null;
  taskDrafts: Record<string, TaskDraftState> = {};

  taskStatuses: HospitalizationTaskStatus[] = ['PENDING', 'DONE', 'NOT_DONE'];

  constructor(private opsApi: OpsApiService) {}

  ngOnInit(): void {
    this.loadActiveHospitalizations();
  }

  loadActiveHospitalizations(): void {
    this.loading = true;
    this.error = '';
    this.opsApi.listActiveHospitalizationsForNurse().subscribe({
      next: (items) => {
        this.summaries = items || [];
        this.loading = false;
        if (this.summaries.length > 0) {
          this.openHospitalization(this.summaries[0].id);
        } else {
          this.selectedHospitalization = null;
        }
      },
      error: () => {
        this.loading = false;
        this.error = 'Unable to load active hospitalization cases.';
      }
    });
  }

  openHospitalization(id: string): void {
    this.detailError = '';
    this.opsApi.getHospitalization(id).subscribe({
      next: (item) => {
        this.selectedHospitalization = item;
        this.taskDrafts = {};
        (item.tasks || []).forEach((task) => {
          this.taskDrafts[task.id] = this.createDraft(task);
        });
      },
      error: () => {
        this.detailError = 'Unable to load hospitalization details.';
      }
    });
  }

  submitTask(task: HospitalizationTaskDto): void {
    const draft = this.taskDrafts[task.id];
    if (!draft) return;

    this.savingTaskId = task.id;
    this.opsApi.updateTask(task.id, {
      status: draft.status,
      note: draft.note,
      numericValue: draft.numericValue,
      textValue: draft.textValue,
      unit: draft.unit
    }).subscribe({
      next: () => {
        this.savingTaskId = '';
        if (this.selectedHospitalization?.id) {
          this.openHospitalization(this.selectedHospitalization.id);
        }
        this.loadActiveHospitalizations();
      },
      error: () => {
        this.savingTaskId = '';
        this.detailError = 'Unable to save task update.';
      }
    });
  }

  trackSummary(_: number, item: HospitalizationSummaryDto): string {
    return item.id;
  }

  trackTask(_: number, item: HospitalizationTaskDto): string {
    return item.id;
  }

  private createDraft(task: HospitalizationTaskDto): TaskDraftState {
    return {
      status: task.status || 'PENDING',
      note: task.latestNote || '',
      numericValue: task.latestNumericValue ?? null,
      textValue: task.latestTextValue || '',
      unit: task.latestUnit || task.expectedUnit || ''
    };
  }
}
