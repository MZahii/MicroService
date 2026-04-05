import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom, forkJoin } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { getValidToken } from '../../../core/auth/keycloak.service';
import { AuthStorageService } from '../../../core/auth/auth-storage.service';
import { environment } from '../../../../environments/environment';

interface UserRow {
  id: number;
  username: string;
  cin?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  sex?: string;
  role: string;
  accountStatus: string;
  enabled: boolean;
}

interface ContractRow {
  id: number;
  staffUserId: number;
  contractReference: string;
  contractType: string;
  status: string;
  jobTitle: string;
  department?: string;
  startDate: string;
  endDate: string;
  salary: number;
  currency?: string;
  hoursPerWeek: number;
  notes?: string;
}

type StaffRole = 'DOCTOR' | 'NURSE' | 'SURGEON' | 'PHARMACIST' | 'RECEPTIONIST';
type Sex = 'MALE' | 'FEMALE';
type ContractType = 'CDI' | 'CDD' | 'INTERNSHIP' | 'PART_TIME' | 'TEMPORARY';

@Component({
  selector: 'app-staff-user-details',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './staff-user-details.html',
  styleUrl: './staff-user-details.scss'
})
export class StaffUserDetails implements OnInit {
  loading = false;
  savingProfile = false;
  savingContractId: number | null = null;
  errorMessage = '';
  successMessage = '';
  role = '';
  returnTo: 'staff' | 'staff-details' | 'contracts' | 'hr-list' = 'staff';
  backRoute = '/backoffice/staff';
  backLabel = 'Back To Staff List';
  user: UserRow | null = null;
  contracts: ContractRow[] = [];
  editProfile = false;
  editingContractId: number | null = null;

  profileForm = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    sex: 'MALE' as Sex,
    role: 'DOCTOR' as StaffRole
  };

  contractForm = {
    contractType: 'CDI' as ContractType,
    jobTitle: '',
    department: '',
    startDate: '',
    endDate: '',
    salary: 0,
    hoursPerWeek: '' as number | '',
    notes: ''
  };

  readonly staffRoles: StaffRole[] = ['DOCTOR', 'NURSE', 'SURGEON', 'PHARMACIST', 'RECEPTIONIST'];
  readonly sexOptions: Sex[] = ['MALE', 'FEMALE'];
  readonly contractTypeOptions: ContractType[] = ['CDI', 'CDD', 'INTERNSHIP', 'PART_TIME', 'TEMPORARY'];
  readonly hrJobTitleOptions: string[] = ['HR Manager', 'Manager Assistant'];
  readonly staffJobTitleOptions: string[] = [
    'Pediatric Nephrologist',
    'Nurse',
    'Surgeon',
    'Pharmacist',
    'Receptionist',
    'Administrative Officer'
  ];
  readonly hrDepartmentOptions: string[] = ['Human Resources', 'Administration'];
  readonly staffDepartmentOptions: string[] = ['Medical', 'Nursing', 'Surgery', 'Pharmacy', 'Reception'];
  readonly hoursPerWeekOptionsByType: Record<ContractType, number[]> = {
    CDI: [35, 40, 45],
    CDD: [30, 35, 40],
    INTERNSHIP: [20, 25, 30, 35],
    PART_TIME: [10, 15, 20, 25, 30],
    TEMPORARY: [20, 30, 40]
  };

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private authStorage: AuthStorageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.role = this.authStorage.getRole() ?? '';
    this.resolveReturnNavigation();
    this.loadUserDetails();
  }

  private resolveReturnNavigation(): void {
    const requested = this.route.snapshot.queryParamMap.get('returnTo');
    if (requested === 'contracts') {
      this.returnTo = 'contracts';
      this.backRoute = '/backoffice/contracts';
      this.backLabel = 'Back To Contracts';
      return;
    }

    if (requested === 'hr-list') {
      this.returnTo = 'hr-list';
      this.backRoute = '/backoffice/hr-list';
      this.backLabel = 'Back To HR List';
      return;
    }

    if (requested === 'staff-details' || this.role === 'ADMIN') {
      this.returnTo = 'staff-details';
      this.backRoute = '/backoffice/staff-details';
      this.backLabel = 'Back To Staff Details';
      return;
    }

    this.returnTo = 'staff';
    this.backRoute = '/backoffice/staff';
    this.backLabel = 'Back To Staff List';
  }

  get fullName(): string {
    if (!this.user) return '-';
    const name = `${this.user.firstName ?? ''} ${this.user.lastName ?? ''}`.trim();
    return name || '-';
  }

  get isHr(): boolean {
    return this.role === 'HR';
  }

  get isAdmin(): boolean {
    return this.role === 'ADMIN';
  }

  get isHrUser(): boolean {
    return this.user?.role === 'HR';
  }

  get canEditProfile(): boolean {
    if (!this.user) return false;
    if (this.isAdmin) return this.isHrUser;
    if (this.isHr) return !this.isHrUser;
    return false;
  }

  get canToggleAccountStatus(): boolean {
    if (!this.user) return false;
    if (this.isHr) return this.staffRoles.includes(this.user.role as StaffRole);
    return this.isAdmin && this.isHrUser;
  }

  get canManageContracts(): boolean {
    if (this.isHr) return true;
    return this.role === 'ADMIN' && this.user?.role === 'HR';
  }

  get contractJobTitleOptions(): string[] {
    if (!this.canManageContracts || !this.user) return [];
    return this.user.role === 'HR' ? this.hrJobTitleOptions : this.staffJobTitleOptions;
  }

  get contractDepartmentOptions(): string[] {
    if (!this.canManageContracts || !this.user) return [];
    return this.user.role === 'HR' ? this.hrDepartmentOptions : this.staffDepartmentOptions;
  }

  get hoursPerWeekOptions(): number[] {
    return this.hoursPerWeekOptionsByType[this.contractForm.contractType] ?? [];
  }

  get pageTitle(): string {
    return this.user?.role === 'HR' ? 'HR User Details' : 'Staff User Details';
  }

  startProfileEdit(): void {
    if (!this.user || !this.canEditProfile) return;
    this.editProfile = true;
    this.successMessage = '';
    this.errorMessage = '';
    this.profileForm = {
      firstName: this.user.firstName ?? '',
      lastName: this.user.lastName ?? '',
      email: this.user.email ?? '',
      phone: this.user.phone ?? '',
      dateOfBirth: this.user.dateOfBirth ?? '',
      sex: (this.user.sex as Sex) || 'MALE',
      role: (this.user.role as StaffRole) || 'DOCTOR'
    };
  }

  cancelProfileEdit(): void {
    this.editProfile = false;
  }

  startContractEdit(contract: ContractRow): void {
    if (!this.canManageContracts) return;
    this.editingContractId = contract.id;
    this.successMessage = '';
    this.errorMessage = '';
    this.contractForm = {
      contractType: contract.contractType as ContractType,
      jobTitle: contract.jobTitle ?? '',
      department: contract.department ?? '',
      startDate: contract.startDate ?? '',
      endDate: contract.endDate ?? '',
      salary: Number(contract.salary ?? 0),
      hoursPerWeek: Number(contract.hoursPerWeek ?? 40),
      notes: contract.notes ?? ''
    };
  }

  cancelContractEdit(): void {
    this.editingContractId = null;
  }

  async saveProfile(): Promise<void> {
    if (!this.user || !this.canEditProfile || this.savingProfile) return;
    this.savingProfile = true;
    this.successMessage = '';
    this.errorMessage = '';
    try {
      const firstName = this.profileForm.firstName.trim();
      const lastName = this.profileForm.lastName.trim();
      const email = this.profileForm.email.trim();
      const dateOfBirth = this.profileForm.dateOfBirth;

      if (firstName.length < 3 || lastName.length < 3) {
        throw new Error('First name and last name must have at least 3 letters.');
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error('Please enter a valid email.');
      }
      if (!this.isAdult(dateOfBirth)) {
        throw new Error('Account age must be at least 18 years.');
      }

      const token = await getValidToken();
      const headers = new HttpHeaders({
        Authorization: `Bearer ${token}`
      });
      const isHrAccount = this.user.role === 'HR';
      const payload = isHrAccount
        ? {
            firstName,
            lastName,
            email,
            dateOfBirth,
            sex: this.profileForm.sex
          }
        : {
            firstName,
            lastName,
            email,
            phone: this.user.phone || null,
            dateOfBirth,
            sex: this.profileForm.sex,
            role: this.user.role
          };
      const endpoint = isHrAccount
        ? `${environment.apiBaseUrl}/api/users/hr/${this.user.id}`
        : `${environment.apiBaseUrl}/api/users/staff/${this.user.id}`;

      const updated = await firstValueFrom(
        this.http.patch<UserRow>(
          endpoint,
          payload,
          { headers }
        )
      );
      this.user = updated;
      this.editProfile = false;
      this.successMessage = 'Profile updated successfully.';
      await this.loadUserDetails();
    } catch (error: unknown) {
      const err = error as { error?: { message?: string }; message?: string };
      this.errorMessage = err?.error?.message || err?.message || 'Failed to update profile.';
    } finally {
      this.savingProfile = false;
      this.cdr.detectChanges();
    }
  }

  async saveContract(contractId: number): Promise<void> {
    if (!this.canManageContracts || this.savingContractId !== null) return;
    this.savingContractId = contractId;
    this.successMessage = '';
    this.errorMessage = '';
    try {
      if (!this.contractJobTitleOptions.includes(this.contractForm.jobTitle)) {
        throw new Error('Invalid job title.');
      }
      if (!this.contractDepartmentOptions.includes(this.contractForm.department)) {
        throw new Error('Invalid department.');
      }
      if (this.contractForm.hoursPerWeek === '' || !this.hoursPerWeekOptions.includes(Number(this.contractForm.hoursPerWeek))) {
        throw new Error('Please select valid hours/week based on contract type.');
      }
      const salaryValue = Number(this.contractForm.salary);
      if (!Number.isFinite(salaryValue) || salaryValue <= 0) {
        throw new Error('Salary must be a positive number greater than 0.');
      }
      if (new Date(this.contractForm.endDate).getTime() < new Date(this.contractForm.startDate).getTime()) {
        throw new Error('End date must be after start date.');
      }

      const token = await getValidToken();
      const headers = new HttpHeaders({
        Authorization: `Bearer ${token}`
      });
      const payload = {
        contractType: this.contractForm.contractType,
        jobTitle: this.contractForm.jobTitle,
        department: this.contractForm.department || null,
        startDate: this.contractForm.startDate,
        endDate: this.contractForm.endDate,
        salary: salaryValue,
        currency: 'TND',
        hoursPerWeek: Number(this.contractForm.hoursPerWeek),
        notes: this.contractForm.notes || null
      };
      const updated = await firstValueFrom(
        this.http.put<ContractRow>(
          `${environment.apiBaseUrl}/api/contracts/${contractId}`,
          payload,
          { headers }
        )
      );
      this.contracts = this.contracts.map(c => c.id === contractId ? updated : c);
      this.editingContractId = null;
      this.successMessage = 'Contract updated successfully.';
      await this.loadUserDetails();
    } catch (error: unknown) {
      const err = error as { error?: { message?: string }; message?: string };
      this.errorMessage = err?.error?.message || err?.message || 'Failed to update contract.';
    } finally {
      this.savingContractId = null;
      this.cdr.detectChanges();
    }
  }

  onContractTypeChange(): void {
    if (this.contractForm.hoursPerWeek === '') return;
    if (!this.hoursPerWeekOptions.includes(Number(this.contractForm.hoursPerWeek))) {
      this.contractForm.hoursPerWeek = '';
    }
  }

  async toggleUserAccountStatus(): Promise<void> {
    if (!this.user || !this.canToggleAccountStatus) return;
    const hasRunningContract = this.contracts.some(c => c.status === 'ACTIVE' || c.status === 'SUSPENDED');
    const target = this.user.accountStatus === 'INACTIVE'
      ? (hasRunningContract ? 'ACTIVE' : 'PENDING_CONTRACT')
      : 'INACTIVE';
    const confirmed = window.confirm(`Confirm changing ${this.user.username} status to ${target}?`);
    if (!confirmed) return;
    try {
      const token = await getValidToken();
      const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
      await firstValueFrom(this.http.patch(
        `${environment.apiBaseUrl}/api/contracts/staff/${this.user.id}/status?status=${target}`,
        {},
        { headers }
      ));
      await this.loadUserDetails();
      this.successMessage = `Account status changed to ${target}.`;
    } catch (error: unknown) {
      const err = error as { error?: { message?: string }; message?: string };
      this.errorMessage = err?.error?.message || err?.message || 'Failed to update account status.';
    } finally {
      this.cdr.detectChanges();
    }
  }

  private isAdult(dateOfBirth: string): boolean {
    if (!dateOfBirth) return false;
    const birth = new Date(dateOfBirth);
    if (Number.isNaN(birth.getTime())) return false;
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const monthDiff = now.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
      age--;
    }
    return age >= 18;
  }

  async runContractAction(contractId: number, action: 'suspend' | 'resume' | 'end'): Promise<void> {
    if (!this.canManageContracts) return;
    const confirmed = window.confirm(`Confirm ${action.toUpperCase()} contract?`);
    if (!confirmed) return;

    try {
      const token = await getValidToken();
      const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
      await firstValueFrom(this.http.patch(
        `${environment.apiBaseUrl}/api/contracts/${contractId}/${action}`,
        {},
        { headers }
      ));
      await this.loadUserDetails();
      this.cdr.detectChanges();
    } catch (error: unknown) {
      const err = error as { error?: { message?: string }; message?: string };
      this.errorMessage = err?.error?.message || err?.message || `Failed to ${action} contract.`;
      this.cdr.detectChanges();
    }
  }

  private async loadUserDetails(): Promise<void> {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.user = null;
    this.contracts = [];

    try {
      const userId = Number(this.route.snapshot.paramMap.get('id'));
      if (!Number.isFinite(userId) || userId <= 0) {
        throw new Error('Invalid staff user id.');
      }

      const token = await getValidToken();
      const headers = new HttpHeaders({
        Authorization: `Bearer ${token}`
      });

      const response = await firstValueFrom(forkJoin({
        users: this.http.get<UserRow[] | unknown>(`${environment.apiBaseUrl}/api/users`, { headers }),
        contracts: this.http.get<ContractRow[] | unknown>(
          `${environment.apiBaseUrl}/api/contracts?staffUserId=${userId}`,
          { headers }
        )
      }));

      const users = Array.isArray(response?.users) ? response.users : [];
      const selected = users.find(u => u.id === userId) ?? null;
      if (!selected) {
        throw new Error('Staff user not found.');
      }

      this.user = selected;
      this.contracts = Array.isArray(response?.contracts) ? response.contracts : [];
    } catch (error: unknown) {
      const err = error as { error?: { message?: string }; message?: string };
      this.errorMessage = err?.error?.message || err?.message || 'Failed to load staff details.';
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }
}
