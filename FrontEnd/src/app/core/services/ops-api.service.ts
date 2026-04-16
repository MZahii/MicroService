import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, of, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthStorageService } from '../auth/auth-storage.service';
import {
  AddDossierContributorRequest,
  CreateDossierEntryRequest,
  CreatePatientDossierRequest,
  DischargeDossierRequest,
  DossierContributorResponse,
  DossierEntryResponse,
  DossierEntrySignatureResponse,
  DossierEntryType,
  DossierStatus,
  PagedResponse,
  PatientDossierResponse,
  PatientDossierSummaryResponse,
  SignDossierEntryRequest,
  ContributorRole,
  HospitalizationCaseResponse,
  HospitalizationSummaryResponse,
  HospitalizationTaskRequest,
  HospitalizationTaskResponse,
  HospitalizationTaskUpdateRequest
} from '../models/ops.models';

export type CreateHospitalizationTaskPayload = {
  type: HospitalizationTaskRequest['type'];
  title: string;
  instructions?: string;
  measurementKind?: HospitalizationTaskRequest['measurementKind'];
  expectedUnit?: string;
  displayOrder?: number;
};

export type CreateHospitalizationPayload = {
  patientId: number;
  consultationId?: string;
  reason: string;
  tasks?: CreateHospitalizationTaskPayload[];
};

export type HospitalizationCaseDto = HospitalizationCaseResponse;
export type HospitalizationSummaryDto = HospitalizationSummaryResponse;
export type HospitalizationTaskDto = HospitalizationTaskResponse;
export type HospitalizationTaskStatus = HospitalizationTaskRequest['type'] extends never
  ? never
  : HospitalizationTaskUpdateRequest['status'];
export type HospitalizationMeasurementKind = HospitalizationTaskRequest['measurementKind'];
export type HospitalizationTaskType = HospitalizationTaskRequest['type'];

@Injectable({ providedIn: 'root' })
export class OpsApiService {
  private readonly baseUrl = `${environment.apiBaseUrl}/api/ops/dossiers`;
  private readonly hospitalizationBaseUrl = `${environment.apiBaseUrl}/api`;

  constructor(
    private http: HttpClient,
    private authStorage: AuthStorageService
  ) {}

  createDossier(payload: CreatePatientDossierRequest): Observable<PatientDossierResponse> {
    return this.http.post<PatientDossierResponse>(
      this.baseUrl,
      payload,
      { headers: this.userContextHeaders() }
    );
  }

  getDossierById(dossierId: string): Observable<PatientDossierResponse> {
    return this.http.get<PatientDossierResponse>(
      `${this.baseUrl}/${dossierId}`,
      { headers: this.userContextHeaders() }
    );
  }

  listDossiers(filters?: {
    status?: DossierStatus | '';
    patientId?: number | null;
    doctorId?: string | null;
    nurseId?: string | null;
    page?: number;
    size?: number;
  }): Observable<PagedResponse<PatientDossierSummaryResponse>> {
    let params = new HttpParams();
    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.patientId !== undefined && filters?.patientId !== null) {
      params = params.set('patientId', String(filters.patientId));
    }
    if (filters?.doctorId) params = params.set('doctorId', filters.doctorId);
    if (filters?.nurseId) params = params.set('nurseId', filters.nurseId);
    params = params.set('page', String(filters?.page ?? 0));
    params = params.set('size', String(filters?.size ?? 20));

    return this.http.get<PagedResponse<PatientDossierSummaryResponse>>(
      this.baseUrl,
      { params, headers: this.userContextHeaders() }
    );
  }

  listMyAssignedDossiers(page = 0, size = 20): Observable<PagedResponse<PatientDossierSummaryResponse>> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('size', String(size));

    return this.http.get<PagedResponse<PatientDossierSummaryResponse>>(
      `${this.baseUrl}/my-assigned`,
      { params, headers: this.userContextHeaders() }
    );
  }

  createEntry(dossierId: string, payload: CreateDossierEntryRequest): Observable<DossierEntryResponse> {
    return this.http.post<DossierEntryResponse>(
      `${this.baseUrl}/${dossierId}/entries`,
      payload,
      { headers: this.userContextHeaders() }
    );
  }

  signEntry(
    dossierId: string,
    entryId: string,
    payload: SignDossierEntryRequest
  ): Observable<DossierEntrySignatureResponse> {
    return this.http.post<DossierEntrySignatureResponse>(
      `${this.baseUrl}/${dossierId}/entries/${entryId}/sign`,
      payload,
      { headers: this.userContextHeaders() }
    );
  }

  listEntries(
    dossierId: string,
    filters?: {
      from?: string | null;
      to?: string | null;
      type?: DossierEntryType | '';
      page?: number;
      size?: number;
    }
  ): Observable<PagedResponse<DossierEntryResponse>> {
    let params = new HttpParams();
    if (filters?.from) params = params.set('from', filters.from);
    if (filters?.to) params = params.set('to', filters.to);
    if (filters?.type) params = params.set('type', filters.type);
    params = params.set('page', String(filters?.page ?? 0));
    params = params.set('size', String(filters?.size ?? 30));

    return this.http.get<PagedResponse<DossierEntryResponse>>(
      `${this.baseUrl}/${dossierId}/entries`,
      { params, headers: this.userContextHeaders() }
    );
  }

  addContributor(
    dossierId: string,
    payload: AddDossierContributorRequest
  ): Observable<DossierContributorResponse> {
    return this.http.post<DossierContributorResponse>(
      `${this.baseUrl}/${dossierId}/contributors`,
      payload,
      { headers: this.userContextHeaders() }
    );
  }

  removeContributor(dossierId: string, contributorId: string, role: ContributorRole): Observable<void> {
    const params = new HttpParams().set('role', role);
    return this.http.delete<void>(
      `${this.baseUrl}/${dossierId}/contributors/${contributorId}`,
      { params, headers: this.userContextHeaders() }
    );
  }

  dischargeDossier(dossierId: string, payload: DischargeDossierRequest): Observable<PatientDossierResponse> {
    return this.http.put<PatientDossierResponse>(
      `${this.baseUrl}/${dossierId}/discharge`,
      payload,
      { headers: this.userContextHeaders() }
    );
  }

  archiveDossier(dossierId: string): Observable<PatientDossierResponse> {
    return this.http.put<PatientDossierResponse>(
      `${this.baseUrl}/${dossierId}/archive`,
      {},
      { headers: this.userContextHeaders() }
    );
  }

  createHospitalization(payload: CreateHospitalizationPayload): Observable<HospitalizationCaseResponse> {
    return this.http.post<HospitalizationCaseResponse>(
      `${this.hospitalizationBaseUrl}/hospitalizations`,
      payload,
      { headers: this.userContextHeaders() }
    );
  }

  getHospitalization(hospitalizationId: string): Observable<HospitalizationCaseResponse> {
    return this.getHospitalizationById(hospitalizationId);
  }

  getHospitalizationProgress(hospitalizationId: string): Observable<HospitalizationCaseResponse> {
    return this.getHospitalizationById(hospitalizationId);
  }

  getHospitalizationById(hospitalizationId: string): Observable<HospitalizationCaseResponse> {
    return this.getDossierById(hospitalizationId).pipe(
      map((dossier) => ({
        id: dossier.id,
        patientId: dossier.patientId,
        consultationId: dossier.sourceConsultationId,
        doctorKeycloakId: dossier.primaryDoctorId,
        doctorUsername: dossier.primaryDoctorId,
        reason: dossier.admissionReason,
        status: this.mapDossierStatusToHospitalizationStatus(dossier.status),
        createdAt: dossier.createdAt,
        updatedAt: dossier.updatedAt,
        tasks: []
      }))
    );
  }

  listActiveHospitalizationsForNurse(): Observable<HospitalizationSummaryResponse[]> {
    const role = this.normalizeActorRole(this.authStorage.getRole());
    const source$ = role === 'NURSE'
      ? this.listMyAssignedDossiers(0, 50)
      : this.listDossiers({ page: 0, size: 50 });

    return source$.pipe(
      map((page) => this.toHospitalizationSummaries(page.content ?? [])),
      catchError(() => {
        if (role === 'NURSE') {
          return of([] as HospitalizationSummaryResponse[]);
        }

        return this.listMyAssignedDossiers(0, 50).pipe(
          map((page) => this.toHospitalizationSummaries(page.content ?? [])),
          catchError(() => of([] as HospitalizationSummaryResponse[]))
        );
      })
    );
  }

  private toHospitalizationSummaries(items: PatientDossierSummaryResponse[]): HospitalizationSummaryResponse[] {
    return items.map((item) => ({
      id: item.id,
      patientId: item.patientId,
      consultationId: '',
      doctorUsername: '-',
      reason: `Priority ${item.admissionPriority}`,
      status: this.mapDossierStatusToHospitalizationStatus(item.status),
      totalTasks: 0,
      completedTasks: 0,
      pendingTasks: 0,
      createdAt: item.admittedAt,
      updatedAt: item.admittedAt
    }));
  }

  addHospitalizationTask(
    hospitalizationId: string,
    payload: HospitalizationTaskRequest
  ): Observable<HospitalizationTaskResponse> {
    return throwError(() => new Error('Task workflow is not available on current ops-service API.'));
  }

  updateHospitalizationTask(
    taskId: string,
    payload: HospitalizationTaskUpdateRequest
  ): Observable<HospitalizationTaskResponse> {
    return throwError(() => new Error('Task workflow is not available on current ops-service API.'));
  }

  updateTask(
    taskId: string,
    payload: HospitalizationTaskUpdateRequest
  ): Observable<HospitalizationTaskResponse> {
    return this.updateHospitalizationTask(taskId, payload);
  }

  private mapDossierStatusToHospitalizationStatus(status: string): 'REQUESTED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' {
    if (status === 'DISCHARGED' || status === 'ARCHIVED') {
      return 'COMPLETED';
    }
    if (status === 'ACTIVE' || status === 'IN_PROGRESS' || status === 'READY_FOR_DISCHARGE') {
      return 'ACTIVE';
    }
    return 'REQUESTED';
  }

  private userContextHeaders(): HttpHeaders {
    const user = this.authStorage.getUser();
    const accessToken = this.authStorage.getAccessToken();
    const role = this.normalizeActorRole(this.authStorage.getRole());
    const displayName = this.resolveDisplayName(user);
    const actorId = this.resolveActorId(user, accessToken);

    let headers = new HttpHeaders();
    if (actorId) headers = headers.set('X-User-Id', actorId);
    if (role) headers = headers.set('X-User-Role', role);
    if (displayName) headers = headers.set('X-User-Display-Name', displayName);

    return headers;
  }

  private resolveActorId(user: any, accessToken: string | null): string {
    const candidateIds = [
      String(user?.keycloakId ?? '').trim(),
      this.extractSubjectFromToken(accessToken)
    ];

    for (const candidate of candidateIds) {
      if (this.isUuid(candidate)) {
        return candidate;
      }
    }

    return '';
  }

  private extractSubjectFromToken(token: string | null): string {
    if (!token) {
      return '';
    }

    try {
      const parts = token.split('.');
      if (parts.length < 2) {
        return '';
      }

      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(base64.length + (4 - (base64.length % 4 || 4)) % 4, '=');
      const payload = JSON.parse(atob(padded)) as { sub?: unknown };
      return String(payload.sub ?? '').trim();
    } catch {
      return '';
    }
  }

  private isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }

  private resolveDisplayName(user: any): string {
    const firstName = String(user?.firstName ?? '').trim();
    const lastName = String(user?.lastName ?? '').trim();
    if (firstName || lastName) {
      return `${firstName} ${lastName}`.trim();
    }
    return String(user?.username ?? '').trim();
  }

  private normalizeActorRole(role: string | null): 'DOCTOR' | 'NURSE' | 'SYSTEM' | '' {
    if (role === 'DOCTOR') return 'DOCTOR';
    if (role === 'NURSE') return 'NURSE';
    if (role === 'SYSTEM') return 'SYSTEM';
    return '';
  }
}
