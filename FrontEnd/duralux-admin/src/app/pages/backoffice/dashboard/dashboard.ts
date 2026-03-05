import {
  AfterViewInit,
  Component
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthStorageService } from '../../../core/auth/auth-storage.service';

declare global {
  interface Window {
    feather?: any;
  }
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements AfterViewInit {
  currentYear = new Date().getFullYear();

  constructor(private authStorage: AuthStorageService) {}

  get user(): any | null {
    return this.authStorage.getUser();
  }

  get role(): string {
    return this.authStorage.getRole() ?? '';
  }

  get isAdmin(): boolean {
    return this.role === 'ADMIN';
  }

  get isHr(): boolean {
    return this.role === 'HR';
  }

  get isSurgeon(): boolean {
    return this.role === 'SURGEON';
  }

  get displayName(): string {
    if (this.user?.firstName && this.user?.lastName) {
      return `${this.user.firstName} ${this.user.lastName}`;
    }

    return this.user?.username ?? 'User';
  }

  get displayEmail(): string {
    return this.user?.email ?? 'No email';
  }

  get roleBadgeClass(): string {
    if (this.isAdmin) {
      return 'bg-soft-primary text-primary';
    }

    if (this.isHr) {
      return 'bg-soft-warning text-warning';
    }

    if (this.isSurgeon) {
      return 'bg-soft-success text-success';
    }

    return 'bg-soft-secondary text-muted';
  }

  get roleDescription(): string {
    if (this.isAdmin) {
      return 'Global administration and platform supervision';
    }

    if (this.isHr) {
      return 'Human resources and operational management';
    }

    if (this.isSurgeon) {
      return 'Procedure-service operations for surgical and dialysis management';
    }

    return 'Connected backoffice user';
  }

  get mainActionLabel(): string {
    if (this.isAdmin) {
      return 'Create HR Account';
    }

    if (this.isHr) {
      return 'Create Staff Account';
    }

    if (this.isSurgeon) {
      return 'Open Surgical Management';
    }

    return 'Open Management';
  }

  get mainActionLink(): string {
    if (this.isAdmin) {
      return '/backoffice/create-hr';
    }

    if (this.isHr) {
      return '/backoffice/create-staff';
    }

    if (this.isSurgeon) {
      return '/backoffice/procedures/surgical';
    }

    return '/backoffice/dashboard';
  }

  get statistics(): Array<{
    title: string;
    value: string;
    subtitle: string;
    progressLabel: string;
    progressValue: number;
    icon: string;
    progressClass: string;
  }> {
    return [
      ...(this.isSurgeon
        ? [
          {
            title: 'Surgical Cases',
            value: 'Live',
            subtitle: 'Create and update surgical cases',
            progressLabel: 'procedure-service connected',
            progressValue: 100,
            icon: 'feather-scissors',
            progressClass: 'bg-success'
          },
          {
            title: 'Dialysis Plans',
            value: 'Live',
            subtitle: 'Manage dialysis plans from backoffice',
            progressLabel: 'procedure-service connected',
            progressValue: 100,
            icon: 'feather-activity',
            progressClass: 'bg-info'
          },
          {
            title: 'Offer Decisions',
            value: 'Live',
            subtitle: 'Update transplant offer statuses',
            progressLabel: 'SURGEON workflow',
            progressValue: 100,
            icon: 'feather-check-circle',
            progressClass: 'bg-primary'
          },
          {
            title: 'Service Access',
            value: '8089',
            subtitle: 'Direct access to procedure-service',
            progressLabel: 'Local API endpoint',
            progressValue: 100,
            icon: 'feather-server',
            progressClass: 'bg-warning'
          }
        ]
        : []),
      ...(!this.isSurgeon
        ? [
      {
        title: 'Staff Management',
        value: 'Module',
        subtitle: 'Accounts, roles and staff follow-up',
        progressLabel: this.isAdmin ? 'Admin overview' : 'HR operational access',
        progressValue: 100,
        icon: 'feather-users',
        progressClass: 'bg-primary'
      },
      {
        title: 'Patients',
        value: 'Module',
        subtitle: 'Guardians, children and linked profiles',
        progressLabel: 'Patient and guardian workflow',
        progressValue: 100,
        icon: 'feather-heart',
        progressClass: 'bg-success'
      },
      {
        title: 'Clinic Resources',
        value: 'Module',
        subtitle: 'Rooms, beds, dialysis machines and equipment',
        progressLabel: 'Clinic resource management',
        progressValue: 100,
        icon: 'feather-home',
        progressClass: 'bg-info'
      },
      {
        title: 'Security Status',
        value: 'OK',
        subtitle: 'Gateway + Keycloak + roles',
        progressLabel: 'Authentication enabled',
        progressValue: 100,
        icon: 'feather-shield',
        progressClass: 'bg-warning'
      }
        ]
        : [])
    ];
  }

  get quickLinks(): Array<{ label: string; description: string; link: string; icon: string; visible: boolean }> {
    return [
      ...(this.isSurgeon
        ? [
          {
            label: 'Surgical Management',
            description: 'Create cases and update surgical workflow statuses',
            link: '/backoffice/procedures/surgical',
            icon: 'feather-scissors',
            visible: true
          },
          {
            label: 'Dialysis Management',
            description: 'Create and update dialysis plans from procedure-service',
            link: '/backoffice/procedures/dialysis',
            icon: 'feather-activity',
            visible: true
          }
        ]
        : []),
      ...(!this.isSurgeon
        ? [
      {
        label: 'Staff',
        description: this.isAdmin
          ? 'View staff list and staff-related management'
          : 'Manage staff accounts and related operations',
        link: '/backoffice/staff',
        icon: 'feather-users',
        visible: this.isAdmin || this.isHr
      },
      {
        label: 'Patients',
        description: this.isAdmin
          ? 'View patients and guardians overview'
          : 'Create guardian account and linked patient profile',
        link: '/backoffice/patients',
        icon: 'feather-user',
        visible: this.isAdmin || this.isHr
      },
      {
        label: 'Clinic Resources',
        description: this.isAdmin
          ? 'View clinic resources and structure'
          : 'Create and manage clinic resources',
        link: '/backoffice/clinic-resources',
        icon: 'feather-grid',
        visible: this.isAdmin || this.isHr
      },
      {
        label: 'Create HR Account',
        description: 'Reserved for platform administration',
        link: '/backoffice/create-hr',
        icon: 'feather-user-plus',
        visible: this.isAdmin
      },
      {
        label: 'Create Staff Account',
        description: 'Reserved for HR operational flow',
        link: '/backoffice/create-staff',
        icon: 'feather-briefcase',
        visible: this.isHr
      },
      {
        label: 'Create Guardian + Patient',
        description: 'Create guardian account and linked child profile',
        link: '/backoffice/create-guardian-patient',
        icon: 'feather-heart',
        visible: this.isHr
      }
        ]
        : [])
    ];
  }

  get latestItems(): Array<{ module: string; action: string; role: string; status: string }> {
    if (this.isAdmin) {
      return [
        {
          module: 'Staff',
          action: 'Create HR accounts',
          role: 'ADMIN',
          status: 'Allowed'
        },
        {
          module: 'Patients',
          action: 'View patient and guardian modules',
          role: 'ADMIN',
          status: 'Allowed'
        },
        {
          module: 'Clinic Resources',
          action: 'View clinic resource modules',
          role: 'ADMIN',
          status: 'Allowed'
        }
      ];
    }

    if (this.isSurgeon) {
      return [
        {
          module: 'Surgical',
          action: 'Create and update surgical cases',
          role: 'SURGEON',
          status: 'Allowed'
        },
        {
          module: 'Dialysis',
          action: 'Create and update dialysis plans',
          role: 'SURGEON',
          status: 'Allowed'
        },
        {
          module: 'Procedure Service',
          action: 'Update transplant offer decisions',
          role: 'SURGEON',
          status: 'Allowed'
        }
      ];
    }

    return [
      {
        module: 'Staff',
        action: 'Create and manage staff accounts',
        role: 'HR',
        status: 'Allowed'
      },
      {
        module: 'Patients',
        action: 'Create guardian account + patient profile',
        role: 'HR',
        status: 'Allowed'
      },
      {
        module: 'Clinic Resources',
        action: 'Create and manage clinic resources',
        role: 'HR',
        status: 'Allowed'
      }
    ];
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      try {
        if (window.feather) {
          window.feather.replace();
        }
      } catch (error) {
        console.error('Feather init error:', error);
      }
    }, 100);
  }
}
