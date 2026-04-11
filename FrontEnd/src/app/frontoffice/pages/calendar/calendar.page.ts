import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { ClinicalApiService } from '../../../core/services/clinical-api.service';
import { GuardianPatientsService } from '../../../features/administrative/api/guardian-patients.service';

interface CalendarDay {
  date: Date;
  inMonth: boolean;
  isToday: boolean;
  events: any[];
}

@Component({
  selector: 'app-guardian-calendar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './calendar.page.html',
  styleUrl: './calendar.page.scss'
})
export class CalendarPage implements OnInit {
  viewDate = new Date();
  weeks: CalendarDay[][] = [];
  appointments: any[] = [];

  loading = false;
  error = '';
  selectedAppointment: any | null = null;

  constructor(
    private api: ClinicalApiService,
    private guardianPatients: GuardianPatientsService
  ) {}

  ngOnInit(): void {
    this.viewDate = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth(), 1);
    this.loadMonth();
  }

  prevMonth(): void {
    this.viewDate = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth() - 1, 1);
    this.loadMonth();
  }

  nextMonth(): void {
    this.viewDate = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth() + 1, 1);
    this.loadMonth();
  }

  selectAppointment(appointment: any): void {
    this.selectedAppointment = appointment;
  }

  closeDetails(): void {
    this.selectedAppointment = null;
  }

  get monthLabel(): string {
    return this.viewDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  }

  statusBadge(status?: string): string {
    if (status === 'CONFIRMED') return 'bg-success text-white';
    if (status === 'CANCELLED' || status === 'NO_SHOW') return 'bg-danger text-white';
    return 'bg-warning text-dark';
  }

  private loadMonth(): void {
    this.loading = true;
    this.error = '';
    this.selectedAppointment = null;
    const start = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth(), 1, 0, 0, 0);
    const end = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth() + 1, 0, 23, 59, 59);

    this.guardianPatients.getGuardianPatientIds().pipe(
      switchMap((patientIds: number[]) => {
        if (!patientIds.length) return of([]);
        const requests = patientIds.map((patientId: number) =>
          this.api.listAppointments({
            patientId,
            from: this.toIso(start),
            to: this.toIso(end)
          }).pipe(catchError(() => of([])))
        );
        return forkJoin(requests).pipe(
          map((sets: any[][]) => sets.flat())
        );
      }),
      map((items: any[]) => this.dedupeAppointments(items)),
      catchError(() => {
        this.error = 'Failed to load calendar appointments.';
        return of([]);
      })
    ).subscribe({
      next: (items: any[]) => {
        this.appointments = items || [];
        this.loading = false;
        this.buildCalendar();
      },
      error: () => {
        this.appointments = [];
        this.loading = false;
        this.error = 'Failed to load calendar appointments.';
        this.buildCalendar();
      }
    });
  }

  private buildCalendar(): void {
    const first = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth(), 1);
    const start = new Date(first);
    start.setDate(first.getDate() - first.getDay());

    const eventMap = this.mapEventsByDate();
    const weeks: CalendarDay[][] = [];
    let cursor = new Date(start);

    for (let week = 0; week < 6; week++) {
      const days: CalendarDay[] = [];
      for (let day = 0; day < 7; day++) {
        const key = this.dateKey(cursor);
        days.push({
          date: new Date(cursor),
          inMonth: cursor.getMonth() === this.viewDate.getMonth(),
          isToday: this.isSameDay(cursor, new Date()),
          events: eventMap[key] ?? []
        });
        cursor.setDate(cursor.getDate() + 1);
      }
      weeks.push(days);
    }

    this.weeks = weeks;
  }

  private mapEventsByDate(): Record<string, any[]> {
    const map: Record<string, any[]> = {};
    (this.appointments || []).forEach((appt) => {
      const key = this.dateKey(new Date(appt.scheduledAt));
      if (!map[key]) map[key] = [];
      map[key].push(appt);
    });
    return map;
  }

  private dateKey(date: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  private toIso(date: Date): string {
    return date.toISOString();
  }

  private isSameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear()
      && a.getMonth() === b.getMonth()
      && a.getDate() === b.getDate();
  }

  private dedupeAppointments(list: any[]): any[] {
    const seen = new Set<string>();
    return (list || []).filter(item => {
      const key = String(item?.id ?? `${item?.patientId}-${item?.scheduledAt}`);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}
