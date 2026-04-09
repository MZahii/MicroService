import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface SoapNotes {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

export interface DiagnosisItem {
  label: string;
  code?: string;
  severity?: string;
  notes?: string;
}

export interface LabRequestItem {
  test: string;
  urgency: 'Routine' | 'Urgent' | 'STAT';
  note?: string;
}

export interface PrescriptionItem {
  medication: string;
  dosage: string;
  frequency: string;
  durationDays?: number;
  note?: string;
  doseMgPerKg?: number;
  minDoseMgPerKg?: number;
  maxDoseMgPerKg?: number;
}

export interface ConsultationMetrics {
  heightCm?: number;
  creatinineMgDl?: number;
  weightKg?: number;
  ageYears?: number;
}

export interface ConsultationWorkspaceDraft {
  soap: SoapNotes;
  diagnosisList: DiagnosisItem[];
  treatmentPlan: string;
  guardianInstructions: string;
  followUpDate?: string;
  labRequests: LabRequestItem[];
  prescriptions: PrescriptionItem[];
  metrics: ConsultationMetrics;
  updatedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class ConsultationWorkspaceService {
  getDraft(consultationId: string): Observable<ConsultationWorkspaceDraft> {
    const raw = localStorage.getItem(this.storageKey(consultationId));
    if (raw) {
      try {
        return of(JSON.parse(raw) as ConsultationWorkspaceDraft);
      } catch {
        // ignore parse errors
      }
    }

    return of(this.emptyDraft());
  }

  saveDraft(consultationId: string, draft: ConsultationWorkspaceDraft): Observable<boolean> {
    const payload = { ...draft, updatedAt: new Date().toISOString() };
    localStorage.setItem(this.storageKey(consultationId), JSON.stringify(payload));
    return of(true);
  }

  completeConsultation(consultationId: string, draft: ConsultationWorkspaceDraft): Observable<boolean> {
    // TODO: Replace with real clinical-service endpoint for completing a consultation workspace.
    const payload = { ...draft, updatedAt: new Date().toISOString() };
    localStorage.setItem(this.storageKey(consultationId), JSON.stringify(payload));
    return of(true);
  }

  private emptyDraft(): ConsultationWorkspaceDraft {
    return {
      soap: {
        subjective: '',
        objective: '',
        assessment: '',
        plan: ''
      },
      diagnosisList: [],
      treatmentPlan: '',
      guardianInstructions: '',
      followUpDate: '',
      labRequests: [],
      prescriptions: [],
      metrics: {
        heightCm: undefined,
        creatinineMgDl: undefined,
        weightKg: undefined,
        ageYears: undefined
      }
    };
  }

  private storageKey(consultationId: string): string {
    return `clinical_workspace_${consultationId}`;
  }
}
