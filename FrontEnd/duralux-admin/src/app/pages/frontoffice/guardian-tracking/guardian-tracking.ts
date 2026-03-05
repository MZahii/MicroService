import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import {
  CareTask,
  DialysisOutcome,
  DialysisPlan,
  DialysisSession,
  ProcedureApiService,
  SurgicalCase
} from '../../../core/services/procedure-api.service';

type StatusTone = 'success' | 'warning' | 'danger' | 'neutral';

type TimelineEvent = {
  when: Date | null;
  title: string;
  detail: string;
  tone: StatusTone;
};

type ChildOption = {
  key: string;
  label: string;
  patientId: string;
};

@Component({
  selector: 'app-guardian-tracking',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './guardian-tracking.html',
  styleUrl: './guardian-tracking.scss'
})
export class GuardianTrackingComponent implements OnInit {
  loading = false;
  errorMessage = '';

  plans: DialysisPlan[] = [];
  sessions: DialysisSession[] = [];
  outcomes: DialysisOutcome[] = [];
  surgicalCases: SurgicalCase[] = [];
  careTasks: CareTask[] = [];

  childOptions: ChildOption[] = [];
  selectedChildKey = '';

  constructor(private procedureApi: ProcedureApiService) {}

  ngOnInit(): void {
    this.loadTrackingData();
  }

  get selectedChild(): ChildOption | undefined {
    return this.childOptions.find((child) => child.key === this.selectedChildKey);
  }

  get selectedDialysisPlans(): DialysisPlan[] {
    if (!this.selectedChild) return [];
    return this.plans.filter((plan) => this.matchesChild(plan.patientId, plan.firstName, plan.lastName));
  }

  get selectedPlanIds(): number[] {
    return this.selectedDialysisPlans.map((plan) => plan.id);
  }

  get selectedSessions(): DialysisSession[] {
    const ids = new Set(this.selectedPlanIds);
    return this.sessions.filter((session) => ids.has(session.planId));
  }

  get selectedSessionIds(): number[] {
    return this.selectedSessions.map((session) => session.id);
  }

  get selectedOutcomes(): DialysisOutcome[] {
    const ids = new Set(this.selectedSessionIds);
    return this.outcomes.filter((outcome) => ids.has(outcome.sessionId));
  }

  get selectedSurgicalCases(): SurgicalCase[] {
    if (!this.selectedChild) return [];
    return this.surgicalCases.filter((sCase) => this.matchesChild(sCase.patientId, sCase.firstName, sCase.lastName));
  }

  get selectedSurgicalCaseIds(): number[] {
    return this.selectedSurgicalCases.map((sCase) => sCase.id);
  }

  get selectedCareTasks(): CareTask[] {
    const ids = new Set(this.selectedSurgicalCaseIds);
    return this.careTasks.filter((task) => ids.has(task.surgicalCaseId));
  }

  get activeDialysisPlan(): DialysisPlan | undefined {
    return this.selectedDialysisPlans.find((plan) => plan.status !== 'ARCHIVED') ?? this.selectedDialysisPlans[0];
  }

  get nextSession(): DialysisSession | undefined {
    const now = new Date();
    return this.selectedSessions
      .map((session) => ({ session, date: this.parseDate(session.sessionDate) }))
      .filter((item) => item.date && item.date >= now)
      .sort((a, b) => (a.date!.getTime() - b.date!.getTime()))
      .map((item) => item.session)[0];
  }

  get latestOutcome(): DialysisOutcome | undefined {
    return [...this.selectedOutcomes].sort((a, b) => b.id - a.id)[0];
  }

  get latestSurgicalCase(): SurgicalCase | undefined {
    return [...this.selectedSurgicalCases]
      .sort((a, b) => this.dateWeight(b.scheduledDate, b.scheduledStartTime) - this.dateWeight(a.scheduledDate, a.scheduledStartTime))[0];
  }

  get globalStatus(): string {
    if (!this.latestSurgicalCase) {
      return 'NO_SURGICAL_CASE';
    }
    return this.latestSurgicalCase.status || 'UNKNOWN';
  }

  get globalStatusTone(): StatusTone {
    const status = this.globalStatus;
    if (status === 'READY_FOR_INTERVENTION' || status === 'POSTOP_STABLE' || status === 'DONE') return 'success';
    if (status === 'IN_PROGRESS' || status === 'OPEN') return 'warning';
    if (status === 'BLOCKED_PREOP' || status === 'POSTOP_UNSTABLE' || status === 'CANCELLED') return 'danger';
    return 'neutral';
  }

  get nextStepLabel(): string {
    switch (this.globalStatus) {
      case 'OPEN':
        return 'Complete Pre-Op checklist.';
      case 'READY_FOR_INTERVENTION':
        return 'Intervention can be started by medical team.';
      case 'IN_PROGRESS':
        return 'Surgery in progress. Wait for Post-Op observation.';
      case 'POSTOP_STABLE':
        return 'Continue routine recovery follow-up.';
      case 'BLOCKED_PREOP':
        return 'Case locked due to Pre-Op complications.';
      case 'POSTOP_UNSTABLE':
        return 'Case locked, intensive monitoring in progress.';
      case 'DONE':
        return 'Case closed. Continue long-term follow-up.';
      default:
        return 'No active medical workflow yet.';
    }
  }

  get openCareTasksCount(): number {
    return this.selectedCareTasks.filter((task) => !task.done).length;
  }

  get timeline(): TimelineEvent[] {
    const events: TimelineEvent[] = [];

    for (const plan of this.selectedDialysisPlans) {
      events.push({
        when: this.parseDate(plan.startDate),
        title: 'Dialysis Plan Created',
        detail: `${plan.dialysisType} | ${plan.sessionsPerWeek}/week | ${plan.status}`,
        tone: 'neutral'
      });
    }

    for (const session of this.selectedSessions) {
      events.push({
        when: this.parseDate(session.sessionDate),
        title: 'Dialysis Session',
        detail: `Session #${session.id}`,
        tone: 'neutral'
      });
    }

    for (const outcome of this.selectedOutcomes) {
      const session = this.sessions.find((s) => s.id === outcome.sessionId);
      events.push({
        when: session ? this.parseDate(session.sessionDate) : null,
        title: 'Dialysis Outcome',
        detail: `${outcome.validated ? 'Validated' : 'Not validated'}${outcome.summary ? ` | ${outcome.summary}` : ''}`,
        tone: outcome.validated ? 'success' : 'warning'
      });
    }

    for (const sCase of this.selectedSurgicalCases) {
      events.push({
        when: this.parseDateTime(sCase.scheduledDate, sCase.scheduledStartTime),
        title: 'Surgical Case',
        detail: `${sCase.surgeryType || '-'} | ${sCase.status}`,
        tone: this.statusToneFromSurgicalStatus(sCase.status)
      });
    }

    if (this.selectedCareTasks.length > 0) {
      events.push({
        when: null,
        title: 'Care Tasks',
        detail: `${this.openCareTasksCount} open task(s) for clinical follow-up`,
        tone: this.openCareTasksCount > 0 ? 'danger' : 'success'
      });
    }

    return events.sort((a, b) => {
      if (a.when && b.when) return b.when.getTime() - a.when.getTime();
      if (a.when && !b.when) return -1;
      if (!a.when && b.when) return 1;
      return 0;
    });
  }

  loadTrackingData(): void {
    this.loading = true;
    this.errorMessage = '';

    forkJoin({
      plans: this.procedureApi.getDialysisPlans(),
      sessions: this.procedureApi.getDialysisSessions(),
      outcomes: this.procedureApi.getDialysisOutcomes(),
      surgicalCases: this.procedureApi.getSurgicalCases(),
      careTasks: this.procedureApi.getCareTasks()
    }).subscribe({
      next: (result) => {
        this.plans = result.plans ?? [];
        this.sessions = result.sessions ?? [];
        this.outcomes = result.outcomes ?? [];
        this.surgicalCases = result.surgicalCases ?? [];
        this.careTasks = result.careTasks ?? [];
        this.buildChildOptions();
        this.loading = false;
      },
      error: (err: { error?: { message?: string }; message?: string }) => {
        this.loading = false;
        this.errorMessage = err?.error?.message || err?.message || 'Failed to load guardian tracking data.';
      }
    });
  }

  statusLabel(status: string | null | undefined): string {
    if (!status) return 'Unknown';
    const map: Record<string, string> = {
      OPEN: 'Open',
      READY_FOR_INTERVENTION: 'Ready For Intervention',
      BLOCKED_PREOP: 'Blocked Pre-Op',
      IN_PROGRESS: 'Intervention In Progress',
      POSTOP_STABLE: 'Post-Op Stable',
      POSTOP_UNSTABLE: 'Post-Op Unstable',
      DONE: 'Completed',
      CANCELLED: 'Cancelled',
      PLANNED: 'Planned'
    };
    return map[status] ?? status;
  }

  formatDate(value: string | null | undefined): string {
    const date = this.parseDate(value);
    return date ? date.toLocaleDateString() : '-';
  }

  formatDateTime(value: string | null | undefined): string {
    const date = this.parseDate(value);
    return date ? `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : '-';
  }

  private buildChildOptions(): void {
    const map = new Map<string, ChildOption>();

    for (const plan of this.plans) {
      const key = this.makeChildKey(plan.patientId, plan.firstName, plan.lastName);
      if (!map.has(key)) {
        map.set(key, {
          key,
          label: `${plan.firstName || '-'} ${plan.lastName || ''}`.trim(),
          patientId: plan.patientId || ''
        });
      }
    }

    for (const sCase of this.surgicalCases) {
      const key = this.makeChildKey(sCase.patientId, sCase.firstName, sCase.lastName);
      if (!map.has(key)) {
        map.set(key, {
          key,
          label: `${sCase.firstName || '-'} ${sCase.lastName || ''}`.trim(),
          patientId: sCase.patientId || ''
        });
      }
    }

    this.childOptions = [...map.values()];
    if (this.childOptions.length > 0 && !this.selectedChildKey) {
      this.selectedChildKey = this.childOptions[0].key;
    }
  }

  private matchesChild(patientId: string | null | undefined, firstName: string | null | undefined, lastName: string | null | undefined): boolean {
    if (!this.selectedChild) return false;
    return this.makeChildKey(patientId, firstName, lastName) === this.selectedChild.key;
  }

  private makeChildKey(patientId: string | null | undefined, firstName: string | null | undefined, lastName: string | null | undefined): string {
    const id = (patientId ?? '').trim().toLowerCase();
    if (id) return `id:${id}`;
    return `name:${(firstName ?? '').trim().toLowerCase()}|${(lastName ?? '').trim().toLowerCase()}`;
  }

  private parseDate(value: string | null | undefined): Date | null {
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private parseDateTime(date: string | null | undefined, time: string | null | undefined): Date | null {
    if (!date) return null;
    const safeTime = (time ?? '00:00').slice(0, 8);
    return this.parseDate(`${date}T${safeTime}`);
  }

  private statusToneFromSurgicalStatus(status: string | null | undefined): StatusTone {
    if (!status) return 'neutral';
    if (status === 'POSTOP_STABLE' || status === 'DONE' || status === 'READY_FOR_INTERVENTION') return 'success';
    if (status === 'BLOCKED_PREOP' || status === 'POSTOP_UNSTABLE' || status === 'CANCELLED') return 'danger';
    if (status === 'OPEN' || status === 'IN_PROGRESS') return 'warning';
    return 'neutral';
  }

  private dateWeight(date: string | null | undefined, time: string | null | undefined): number {
    const parsed = this.parseDateTime(date, time);
    return parsed ? parsed.getTime() : 0;
  }
}
