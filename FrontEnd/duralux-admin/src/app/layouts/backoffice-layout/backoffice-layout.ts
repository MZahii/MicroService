import {
  AfterViewInit,
  Component,
  HostListener,
  OnDestroy,
  OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet
} from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { AuthStorageService } from '../../core/auth/auth-storage.service';
import { logout } from '../../core/auth/keycloak.service';
import { TemplateAssetsService } from '../../core/services/template-assets.service';

declare const window: any;

const BACKOFFICE_STYLES: string[] = [
  'assets/backoffice/css/bootstrap.min.css',
  'assets/backoffice/vendors/css/daterangepicker.min.css',
  'assets/backoffice/css/theme.min.css'
];

const BACKOFFICE_SCRIPTS: string[] = [
  'assets/backoffice/vendors/js/vendors.min.js',
  'assets/backoffice/vendors/js/daterangepicker.min.js',
  'assets/backoffice/js/common-init.min.js',
  'assets/backoffice/js/theme-customizer-init.min.js'
];

interface BackofficeNavChild {
  label: string;
  route?: string;
  implemented: boolean;
  note?: string;
}

interface BackofficeNavItem {
  key: string;
  label: string;
  icon: string;
  route?: string;
  exact?: boolean;
  children?: BackofficeNavChild[];
}

@Component({
  selector: 'app-backoffice-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './backoffice-layout.html',
  styleUrls: ['./backoffice-layout.scss']
})
export class BackofficeLayoutComponent implements OnInit, AfterViewInit, OnDestroy {
  user: any;
  role = '';
  navigationItems: BackofficeNavItem[] = [];

  private navSub?: Subscription;

  userMenuOpen = false;

  openMenus: Record<string, boolean> = {
    accounts: false,
    staff: false,
    patients: false,
    clinic: false
  };

  // updated with your real files
  logoPath = 'assets/backoffice/images/logo/Logo_fin.png';
  avatarPath = 'assets/backoffice/images/avatar/profil.png';

  constructor(
    private authStorage: AuthStorageService,
    private templateAssetsService: TemplateAssetsService,
    private router: Router
  ) {
    this.user = this.authStorage.getUser();
    this.role = this.authStorage.getRole() ?? '';
    this.navigationItems = this.buildNavigationItems();
  }

  get isAdmin(): boolean {
    return this.role === 'ADMIN';
  }

  get isHr(): boolean {
    return this.role === 'HR';
  }

  get displayName(): string {
    if (this.user?.firstName && this.user?.lastName) {
      return `${this.user.firstName} ${this.user.lastName}`;
    }

    return this.user?.username ?? 'User';
  }

  get displayEmail(): string {
    return this.user?.email ?? '';
  }

  get roleBadgeClass(): string {
    return this.isAdmin ? 'bg-soft-primary text-primary' : 'bg-soft-warning text-warning';
  }

  get headerTitle(): string {
    if (this.isAdmin) {
      return 'Admin Control Center';
    }

    if (this.isHr) {
      return 'HR Operations Dashboard';
    }

    return 'Backoffice Dashboard';
  }

  get headerSubtitle(): string {
    if (this.isAdmin) {
      return 'Manage HR access and supervise staff, patients, and clinic resources.';
    }

    if (this.isHr) {
      return 'Manage staff, guardians, patient profiles, and clinic resources.';
    }

    return 'Manage your backoffice workspace.';
  }

  private buildNavigationItems(): BackofficeNavItem[] {
    const items: BackofficeNavItem[] = [
      {
        key: 'dashboard',
        label: 'Dashboard',
        icon: 'feather-airplay',
        route: '/backoffice/dashboard',
        exact: true
      }
    ];

    if (this.isAdmin) {
      items.push({
        key: 'accounts',
        label: 'Accounts',
        icon: 'feather-users',
        children: [
          {
            label: 'Create HR Account',
            route: '/backoffice/create-hr',
            implemented: true
          },
          {
            label: 'HR List',
            implemented: false,
            note: 'Coming soon'
          }
        ]
      });
    }

    if (this.isHr) {
      items.push({
        key: 'accounts',
        label: 'Accounts',
        icon: 'feather-users',
        children: [
          {
            label: 'Create Staff Account',
            route: '/backoffice/create-staff',
            implemented: true
          },
          {
            label: 'Staff Accounts List',
            route: '/backoffice/staff',
            implemented: true
          }
        ]
      });
    }

    if (this.isAdmin || this.isHr) {
      items.push(
        {
          key: 'staff',
          label: 'Staff',
          icon: 'feather-briefcase',
          children: [
            {
              label: 'Staff List',
              route: '/backoffice/staff',
              implemented: true
            },
            {
              label: 'Roles & Staff Details',
              implemented: false,
              note: 'Coming soon'
            }
          ]
        },
        {
          key: 'patients',
          label: 'Patients',
          icon: 'feather-heart',
          children: [
            {
              label: 'Patients List',
              implemented: false,
              note: 'Coming soon'
            },
            ...(this.isHr
              ? [
                {
                  label: 'Create Guardian + Patient Profile',
                  implemented: false,
                  note: 'Coming soon'
                } as BackofficeNavChild
              ]
              : []),
            {
              label: 'Guardians & Linked Profiles',
              implemented: false,
              note: 'Coming soon'
            }
          ]
        },
        {
          key: 'clinic',
          label: 'Clinic Resources',
          icon: 'feather-grid',
          children: [
            {
              label: 'Resources List',
              implemented: false,
              note: 'Coming soon'
            },
            ...(this.isHr
              ? [
                {
                  label: 'Create Clinic Resource',
                  implemented: false,
                  note: 'Coming soon'
                } as BackofficeNavChild
              ]
              : []),
            {
              label: 'Rooms / Beds / Dialysis Machines',
              implemented: false,
              note: 'Coming soon'
            }
          ]
        }
      );
    }

    return items;
  }

  async ngOnInit(): Promise<void> {
    this.templateAssetsService.clearAll();

    document.body.classList.remove('public-body', 'frontoffice-body');
    document.body.classList.add('backoffice-body');

    await this.templateAssetsService.loadGroup(
      'backoffice',
      BACKOFFICE_STYLES,
      BACKOFFICE_SCRIPTS
    );

    this.navSub = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => {
        this.userMenuOpen = false;
        setTimeout(() => {
          this.refreshFeatherIcons();
        }, 120);
      });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.refreshFeatherIcons();
    }, 300);
  }

  ngOnDestroy(): void {
    this.navSub?.unsubscribe();
    this.templateAssetsService.unloadGroup('backoffice');
    document.body.classList.remove('backoffice-body');
  }

  toggleMenu(event: MouseEvent, key: string): void {
    event.preventDefault();
    event.stopPropagation();

    const willOpen = !this.openMenus[key];

    Object.keys(this.openMenus).forEach(menuKey => {
      this.openMenus[menuKey] = false;
    });

    this.openMenus[key] = willOpen;

    setTimeout(() => {
      this.refreshFeatherIcons();
    }, 0);
  }

  isMenuOpen(key: string): boolean {
    return !!this.openMenus[key];
  }

  toggleUserMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.userMenuOpen = !this.userMenuOpen;

    setTimeout(() => {
      this.refreshFeatherIcons();
    }, 0);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (!target?.closest('.user-menu')) {
      this.userMenuOpen = false;
    }
  }

  private refreshFeatherIcons(): void {
    try {
      if (window?.feather) {
        window.feather.replace();
      }
    } catch (error) {
      console.log('Feather init skipped:', error);
    }
  }

  async onLogout(): Promise<void> {
    this.userMenuOpen = false;
    await logout();
  }
}
