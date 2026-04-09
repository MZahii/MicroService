import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { AuthStorageService } from '../auth/auth-storage.service';

export interface DoctorSearchResult {
  id?: number;
  keycloakId?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
}

@Injectable({ providedIn: 'root' })
export class ClinicalApiService {
  private base = (window as any).__env?.API_BASE || 'http://localhost:8083';

  constructor(private http: HttpClient, private auth: AuthStorageService) {}

  private authHeaders(): HttpHeaders {
    const token = this.auth.getAccessToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return new HttpHeaders(headers);
  }

  private doctorHeaders(): HttpHeaders {
    const user = this.auth.getUser();
    const doctorId = user?.keycloakId;
    const token = this.auth.getAccessToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (doctorId) headers['X-Doctor-Id'] = doctorId;
    return new HttpHeaders(headers);
  }

  getDoctor(id: number): Observable<any> {
    return this.http.get<any>(
      `${this.base}/clinical/doctors/${id}`,
      { headers: this.doctorHeaders() }
    );
  }

  getPatient(id: number): Observable<any> {
    return this.http.get<any>(
      `${this.base}/clinical/patients/${id}`,
      { headers: this.doctorHeaders() }
    );
  }

  listMyConsultations(filters?: { patientQuery?: string; status?: string }): Observable<any[]> {
    let params = new HttpParams();
    if (filters?.patientQuery) params = params.set('patientQuery', filters.patientQuery);
    if (filters?.status && filters.status !== 'ALL') params = params.set('status', filters.status);
    return this.http.get<any[]>(
      `${this.base}/clinical/consultations/mine`,
      { headers: this.doctorHeaders(), params }
    );
  }

  createConsultation(payload: { patientId: number; dateTime: string }): Observable<any> {
    return this.http.post<any>(
      `${this.base}/clinical/consultations`,
      payload,
      { headers: this.doctorHeaders() }
    );
  }

  updateConsultation(
    id: string,
    payload: { dateTime?: string; status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' }
  ): Observable<any> {
    return this.http.put<any>(
      `${this.base}/clinical/consultations/${id}`,
      payload,
      { headers: this.doctorHeaders() }
    );
  }

  cancelConsultation(id: string): Observable<void> {
    return this.http.delete<void>(
      `${this.base}/clinical/consultations/${id}`,
      { headers: this.doctorHeaders() }
    );
  }

  listPatients(): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.base}/api/patients`,
      { headers: this.authHeaders() }
    );
  }

  searchPatients(query: string): Observable<any[]> {
    const trimmed = (query ?? '').trim();
    if (trimmed.length < 2) {
      return of([]);
    }

    const params = new HttpParams()
      .set('q', trimmed)
      .set('limit', '3');

    return this.http.get<any[]>(
      `${this.base}/administration/patients/search`,
      { headers: this.authHeaders(), params }
    );
  }

  listUsers(): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.base}/api/users`,
      { headers: this.authHeaders() }
    );
  }

  listDoctors(limit = 10): Observable<DoctorSearchResult[]> {
    const params = new HttpParams()
      .set('role', 'DOCTOR')
      .set('limit', String(limit));

    return this.http.get<DoctorSearchResult[]>(
      `${this.base}/users/staff`,
      { headers: this.authHeaders(), params }
    );
  }

  searchDoctors(query: string, limit = 3): Observable<DoctorSearchResult[]> {
    const trimmed = (query ?? '').trim();
    if (trimmed.length < 2) {
      return of([]);
    }

    const params = new HttpParams()
      .set('q', trimmed)
      .set('role', 'DOCTOR')
      .set('limit', String(limit));

    return this.http.get<DoctorSearchResult[]>(
      `${this.base}/users/staff/search`,
      { headers: this.authHeaders(), params }
    );
  }

  listAppointments(filters?: {
    doctorId?: string;
    patientId?: number | string;
    status?: string;
    from?: string;
    to?: string;
  }): Observable<any[]> {
    let params = new HttpParams();
    if (filters?.doctorId) params = params.set('doctorId', filters.doctorId);
    if (filters?.patientId !== undefined && filters?.patientId !== null && filters?.patientId !== '') {
      params = params.set('patientId', String(filters.patientId));
    }
    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.from) params = params.set('from', filters.from);
    if (filters?.to) params = params.set('to', filters.to);

    return this.http.get<any[]>(
      `${this.base}/clinical/appointments`,
      { headers: this.authHeaders(), params }
    );
  }

  listConsultations(filters?: {
    patientId?: number | string;
    status?: string;
    from?: string;
    to?: string;
  }): Observable<any[]> {
    let params = new HttpParams();
    if (filters?.patientId !== undefined && filters?.patientId !== null && filters?.patientId !== '') {
      params = params.set('patientId', String(filters.patientId));
    }
    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.from) params = params.set('from', filters.from);
    if (filters?.to) params = params.set('to', filters.to);

    return this.http.get<any[]>(
      `${this.base}/clinical/consultations`,
      { headers: this.authHeaders(), params }
    );
  }

  getConsultation(id: string): Observable<any> {
    return this.http.get<any>(
      `${this.base}/clinical/consultations/${id}`,
      { headers: this.authHeaders() }
    );
  }

  createAppointment(payload: {
    patientId: number;
    doctorId: string;
    scheduledAt: string;
    durationMinutes?: number;
    reason?: string;
  }): Observable<any> {
    return this.http.post<any>(
      `${this.base}/clinical/appointments`,
      payload,
      { headers: this.authHeaders() }
    );
  }

  updateAppointment(id: string, payload: {
    patientId?: number;
    doctorId?: string;
    scheduledAt?: string;
    durationMinutes?: number;
    reason?: string;
    status?: 'SCHEDULED' | 'CONFIRMED' | 'CANCELLED' | 'NO_SHOW';
  }): Observable<any> {
    return this.http.put<any>(
      `${this.base}/clinical/appointments/${id}`,
      payload,
      { headers: this.authHeaders() }
    );
  }

  cancelAppointment(id: string, reason?: string): Observable<any> {
    return this.http.post<any>(
      `${this.base}/clinical/appointments/${id}/cancel`,
      { reason },
      { headers: this.authHeaders() }
    );
  }

  startAppointmentConsultation(id: string): Observable<{ consultationId: string }> {
    return this.http.post<{ consultationId: string }>(
      `${this.base}/clinical/appointments/${id}/start-consultation`,
      {},
      { headers: this.doctorHeaders() }
    );
  }

  checkDoctorAvailability(
    doctorId: string,
    from: string,
    to: string
  ): Observable<{ available: boolean; conflictReason?: string }> {
    const params = new HttpParams()
      .set('doctorId', doctorId)
      .set('from', from)
      .set('to', to);
    return this.http.get<{ available: boolean; conflictReason?: string }>(
      `${this.base}/clinical/appointments/availability`,
      { headers: this.authHeaders(), params }
    );
  }

  listAuditEvents(limit = 200): Observable<any[]> {
    const params = new HttpParams().set('limit', String(limit));
    return this.http.get<any[]>(
      `${this.base}/clinical/audit`,
      { headers: this.authHeaders(), params }
    );
  }
}
