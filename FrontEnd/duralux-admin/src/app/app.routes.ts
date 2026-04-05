import { Routes } from '@angular/router';

import { PublicLayoutComponent } from './layouts/public-layout/public-layout';
import { BackofficeLayoutComponent } from './layouts/backoffice-layout/backoffice-layout';
import { FrontofficeLayoutComponent } from './layouts/frontoffice-layout/frontoffice-layout.component';

import { Dashboard } from './pages/backoffice/dashboard/dashboard';
import { CreateHr } from './pages/backoffice/create-hr/create-hr';
import { CreateStaff } from './pages/backoffice/create-staff/create-staff';
import { StaffList } from './pages/backoffice/staff-list/staff-list';
import { StaffUserDetails } from './pages/backoffice/staff-user-details/staff-user-details';
import { HrList } from './pages/backoffice/hr-list/hr-list';
import { StaffRolesDetails } from './pages/backoffice/staff-roles-details/staff-roles-details';
import { CreateGuardianPatient } from './pages/backoffice/create-guardian-patient/create-guardian-patient';
import { ExistingGuardianPatient } from './pages/backoffice/existing-guardian-patient/existing-guardian-patient';
import { PatientsList } from './pages/backoffice/patients-list/patients-list';
import { GuardiansLinkedProfiles } from './pages/backoffice/guardians-linked-profiles/guardians-linked-profiles';
import { ContractsList } from './pages/backoffice/contracts-list/contracts-list';
import { CreateContract } from './pages/backoffice/create-contract/create-contract';
import { FrontofficeHomeComponent } from './pages/frontoffice/frontoffice-home/frontoffice-home';
import { FrontofficePatientDetailsComponent } from './pages/frontoffice/frontoffice-patient-details/frontoffice-patient-details';
import { MyContractComponent } from './pages/shared/my-contract/my-contract';
import { LogsComponent } from './pages/backoffice/logs/logs';

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
        path: 'hr-list',
        component: HrList,
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
        path: 'staff/:id',
        component: StaffUserDetails,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'HR'] }
      },
      {
        path: 'staff-details',
        component: StaffRolesDetails,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'HR'] }
      },
      {
        path: 'create-guardian-patient',
        component: CreateGuardianPatient,
        canActivate: [roleGuard],
        data: { roles: ['RECEPTIONIST'] }
      },
      {
        path: 'existing-guardian-patient',
        component: ExistingGuardianPatient,
        canActivate: [roleGuard],
        data: { roles: ['RECEPTIONIST'] }
      },
      {
        path: 'patients',
        component: PatientsList,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'RECEPTIONIST'] }
      },
      {
        path: 'guardians-linked',
        component: GuardiansLinkedProfiles,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'RECEPTIONIST'] }
      },
      {
        path: 'contracts',
        component: ContractsList,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'HR'] }
      },
      {
        path: 'contracts/create',
        component: CreateContract,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'HR'] }
      },
      {
        path: 'my-contract',
        component: MyContractComponent,
        canActivate: [roleGuard],
        data: { roles: ['HR', 'DOCTOR', 'NURSE', 'SURGEON', 'PHARMACIST', 'RECEPTIONIST'] }
      },
      {
        path: 'logs',
        component: LogsComponent,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] }
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
      { path: 'patients/:id', component: FrontofficePatientDetailsComponent },
      { path: 'my-contract', component: MyContractComponent }
    ]
  },

  // ================= FALLBACK =================
  { path: '**', redirectTo: '' }
];
