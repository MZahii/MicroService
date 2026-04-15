import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthStorageService } from '../auth/auth-storage.service';

export type HospitalizationStatus = 'REQUESTED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type HospitalizationTaskStatus = 'PENDING' | 'DONE' | 'NOT_DONE';
export type HospitalizationTaskType =
  | 'WEIGHT_CHECK'
  | 'MEDICATION'
  | 'TEMPERATURE'
  | 'BLOOD_MONITORING'
  | 'PATIENT_MONITORING'
  | 'CUSTOM';
export type HospitalizationMeasurementKind = 'NONE' | 'NUMERIC' | 'TEXT';

export interface CreateHospitalizationTaskPayload {
  type: HospitalizationTaskType;
  title: string;
  instructions?: string;
  measurementKind?: HospitalizationMeasurementKind;
  expectedUnit?: string;
  displayOrder?: number;
}

export interface CreateHospitalizationPayload {
  patientId: number;
  consultationId?: string;
  reason: string;
  tasks: CreateHospitalizationTaskPayload[];
}

export interface HospitalizationTaskUpdatePayload {
  status: HospitalizationTaskStatus;
  note?: string;
  numericValue?: number | null;
  textValue?: string;
  unit?: string;
}

export interface HospitalizationTaskExecutionDto {
  id: string;
  status: HospitalizationTaskStatus;
  nurseKeycloakId: string;
  nurseUsername: string;
  note?: string;
  numericValue?: number | null;
  textValue?: string;
  unit?: string;
  recordedAt: string;
}

export interface HospitalizationTaskDto {
  id: string;
  type: HospitalizationTaskType;
  title: string;
  instructions?: string;
  measurementKind: HospitalizationMeasurementKind;
  expectedUnit?: string;
  displayOrder: number;
  status: HospitalizationTaskStatus;
  latestNote?: string;
  latestNumericValue?: number | null;
  latestTextValue?: string;
  latestUnit?: string;
  lastUpdatedByNurseId?: string;
  lastUpdatedByNurseUsername?: string;
  lastUpdatedAt?: string;
  executions: HospitalizationTaskExecutionDto[];
}

export interface HospitalizationCaseDto {
  id: string;
  patientId: number;
  consultationId?: string;
  doctorKeycloakId: string;
  doctorUsername: string;
  reason: string;
  status: HospitalizationStatus;
  createdAt: string;
  updatedAt: string;
  tasks: HospitalizationTaskDto[];
}

export interface HospitalizationSummaryDto {
  id: string;
  patientId: number;
  consultationId?: string;
  doctorUsername: string;
  reason: string;
  status: HospitalizationStatus;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  createdAt: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class OpsApiService {
  private readonly base = (window as any).__env?.API_BASE || 'http://localhost:8083';

  constructor(private http: HttpClient, private auth: AuthStorageService) {}

  private authHeaders(): HttpHeaders {
    const token = this.auth.getAccessToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return new HttpHeaders(headers);
  }

  createHospitalization(payload: CreateHospitalizationPayload): Observable<HospitalizationCaseDto> {
    return this.http.post<HospitalizationCaseDto>(
      `${this.base}/api/ops/hospitalizations`,
      payload,
      { headers: this.authHeaders() }
    );
  }

  addHospitalizationTask(
    hospitalizationId: string,
    payload: CreateHospitalizationTaskPayload
  ): Observable<HospitalizationTaskDto> {
    return this.http.post<HospitalizationTaskDto>(
      `${this.base}/api/ops/hospitalizations/${hospitalizationId}/tasks`,
      payload,
      { headers: this.authHeaders() }
    );
  }

  getHospitalization(hospitalizationId: string): Observable<HospitalizationCaseDto> {
    return this.http.get<HospitalizationCaseDto>(
      `${this.base}/api/ops/hospitalizations/${hospitalizationId}`,
      { headers: this.authHeaders() }
    );
  }

  getHospitalizationProgress(hospitalizationId: string): Observable<HospitalizationCaseDto> {
    return this.http.get<HospitalizationCaseDto>(
      `${this.base}/api/ops/hospitalizations/${hospitalizationId}/progress`,
      { headers: this.authHeaders() }
    );
  }

  listActiveHospitalizationsForNurse(): Observable<HospitalizationSummaryDto[]> {
    return this.http.get<HospitalizationSummaryDto[]>(
      `${this.base}/api/ops/nurse/hospitalizations/active`,
      { headers: this.authHeaders() }
    );
  }

  updateTask(taskId: string, payload: HospitalizationTaskUpdatePayload): Observable<HospitalizationTaskDto> {
    return this.http.put<HospitalizationTaskDto>(
      `${this.base}/api/ops/nurse/tasks/${taskId}`,
      payload,
      { headers: this.authHeaders() }
    );
  }
}
