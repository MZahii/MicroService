import { Routes } from '@angular/router';

import { PublicLayoutComponent } from './layouts/public-layout/public-layout';
import { BackofficeLayoutComponent } from './layouts/backoffice-layout/backoffice-layout';
import { FrontofficeLayoutComponent } from './layouts/frontoffice-layout/frontoffice-layout.component';

import { Dashboard } from './pages/backoffice/dashboard/dashboard';
import { CreateHr } from './pages/backoffice/create-hr/create-hr';
import { CreateStaff } from './pages/backoffice/create-staff/create-staff';
import { StaffList } from './pages/backoffice/staff-list/staff-list';
import { ProcedureDialysisComponent } from './pages/backoffice/procedure-dialysis/procedure-dialysis';
import { ProcedureDialysisOutcomesComponent } from './pages/backoffice/procedure-dialysis-outcomes/procedure-dialysis-outcomes';
import { ProcedureDialysisPrescriptionsComponent } from './pages/backoffice/procedure-dialysis-prescriptions/procedure-dialysis-prescriptions';
import { ProcedureDialysisSessionsComponent } from './pages/backoffice/procedure-dialysis-sessions/procedure-dialysis-sessions';
import { ProcedureSurgicalComponent } from './pages/backoffice/procedure-surgical/procedure-surgical';
import { ProcedureSurgicalAdvancedComponent } from './pages/backoffice/procedure-surgical-advanced/procedure-surgical-advanced';
import { FrontofficeHomeComponent } from './pages/frontoffice/frontoffice-home/frontoffice-home';
import { GuardianTrackingComponent } from './pages/frontoffice/guardian-tracking/guardian-tracking';

import { HomePageComponent } from './pages/public/home-page/home-page';
import { AboutPageComponent } from './pages/public/about-page/about-page';
import { ServicesPageComponent } from './pages/public/services-page/services-page';
import { DoctorsPageComponent } from './pages/public/doctors-page/doctors-page';
import { FaqPageComponent } from './pages/public/faq-page/faq-page';
import { TermsPageComponent } from './pages/public/terms-page/terms-page';
import { PrivacyPageComponent } from './pages/public/privacy-page/privacy-page';
import { ContactPageComponent } from './pages/public/contact-page/contact-page';
import { Login } from './pages/public/login/login';

import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  // ================= PUBLIC WEBSITE =================
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      { path: '', component: HomePageComponent },
      { path: 'about', component: AboutPageComponent },
      { path: 'services', component: ServicesPageComponent },
      { path: 'doctors', component: DoctorsPageComponent },
      { path: 'faq', component: FaqPageComponent },
      { path: 'terms', component: TermsPageComponent },
      { path: 'privacy', component: PrivacyPageComponent },
      { path: 'contact', component: ContactPageComponent },
      { path: 'login', component: Login }
    ]
  },

  // ================= BACKOFFICE =================
  {
    path: 'backoffice',
    component: BackofficeLayoutComponent,
    canActivate: [authGuard, roleGuard],
    data: {
      roles: ['ADMIN', 'HR', 'DOCTOR', 'NURSE', 'SURGEON', 'PHARMACIST', 'RECEPTIONIST']
    },
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', component: Dashboard },
      {
        path: 'create-hr',
        component: CreateHr,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] }
      },
      {
        path: 'create-staff',
        component: CreateStaff,
        canActivate: [roleGuard],
        data: { roles: ['HR'] }
      },
      {
        path: 'staff',
        component: StaffList,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'HR'] }
      },
      {
        path: 'procedures/dialysis',
        component: ProcedureDialysisComponent,
        canActivate: [roleGuard],
        data: { roles: ['SURGEON'] }
      },
      {
        path: 'procedures/dialysis-sessions',
        component: ProcedureDialysisSessionsComponent,
        canActivate: [roleGuard],
        data: { roles: ['SURGEON'] }
      },
      {
        path: 'procedures/dialysis-outcomes',
        component: ProcedureDialysisOutcomesComponent,
        canActivate: [roleGuard],
        data: { roles: ['SURGEON'] }
      },
      {
        path: 'procedures/dialysis-prescriptions',
        component: ProcedureDialysisPrescriptionsComponent,
        canActivate: [roleGuard],
        data: { roles: ['SURGEON'] }
      },
      {
        path: 'procedures/surgical',
        component: ProcedureSurgicalComponent,
        canActivate: [roleGuard],
        data: { roles: ['SURGEON'] }
      },
      {
        path: 'procedures/surgical-advanced',
        component: ProcedureSurgicalAdvancedComponent,
        canActivate: [roleGuard],
        data: { roles: ['SURGEON'] }
      }
    ]
  },

  // ================= FRONTOFFICE =================
  {
    path: 'frontoffice',
    component: FrontofficeLayoutComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['GUARDIAN'] },
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'home' },
      { path: 'home', component: FrontofficeHomeComponent },
      { path: 'tracking', component: GuardianTrackingComponent }
    ]
  },

  // ================= FALLBACK =================
  { path: '**', redirectTo: '' }
];
