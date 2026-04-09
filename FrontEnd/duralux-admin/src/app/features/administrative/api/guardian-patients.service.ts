import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthStorageService } from '../../../core/auth/auth-storage.service';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class GuardianPatientsService {
  private base = (window as any).__env?.API_BASE || environment.apiBaseUrl;

  constructor(
    private http: HttpClient,
    private authStorage: AuthStorageService
  ) {}

  private authHeaders(): HttpHeaders {
    const token = this.authStorage.getAccessToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return new HttpHeaders(headers);
  }

  getGuardianPatientIds(): Observable<number[]> {
    const user = this.authStorage.getUser();
    const guardianUserId = Number(user?.userId || 0);

    if (!guardianUserId) {
      // TODO: replace with real endpoint once guardian identity is fully wired.
      return of([1]);
    }

    const params = new HttpParams().set('guardianUserId', String(guardianUserId));

    return this.http.get<any[]>(
      `${this.base}/api/patients`,
      { headers: this.authHeaders(), params }
    ).pipe(
      map(list => (list ?? [])
        .map(item => Number(item?.id))
        .filter(id => Number.isFinite(id))),
      catchError(() => {
        // TODO: replace with real endpoint for guardian -> patient mapping.
        return of([1]);
      })
    );
  }
}
