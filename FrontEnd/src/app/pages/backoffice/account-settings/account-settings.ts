import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthStorageService } from '../../../core/auth/auth-storage.service';
import { getValidToken } from '../../../core/auth/keycloak.service';
import { environment } from '../../../../environments/environment';

interface AccountSettingsResponse {
  id: number;
  keycloakId: string;
  username: string;
  cin: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  sex?: string;
  role: string;
  accountStatus: string;
  enabled: boolean;
  avatarUrl?: string;
  preferredLanguage: string;
  notificationsEnabled: boolean;
  theme: string;
  mustChangePassword: boolean;
}

@Component({
  selector: 'app-account-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './account-settings.html',
  styleUrl: './account-settings.scss'
})
export class AccountSettingsComponent implements OnInit {
  loading = false;
  savingProfile = false;
  savingPrefs = false;
  savingPassword = false;

  errorMessage = '';
  successMessage = '';

  activeTab: 'profile' | 'security' | 'preferences' = 'profile';
  forcePasswordChange = false;

  settings: AccountSettingsResponse | null = null;

  profileForm = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    avatarUrl: ''
  };

  preferencesForm = {
    preferredLanguage: 'en',
    notificationsEnabled: true,
    theme: 'light'
  };

  securityForm = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    private authStorage: AuthStorageService
  ) {}

  async ngOnInit(): Promise<void> {
    this.forcePasswordChange = this.route.snapshot.queryParamMap.get('forcePasswordChange') === 'true'
      || this.authStorage.isPasswordChangeRequired();

    if (this.forcePasswordChange) {
      this.activeTab = 'security';
    }

    await this.loadSettings();
  }

  setTab(tab: 'profile' | 'security' | 'preferences'): void {
    if (this.forcePasswordChange && tab !== 'security') {
      return;
    }
    this.activeTab = tab;
  }

  async loadSettings(): Promise<void> {
    this.loading = true;
    this.errorMessage = '';

    try {
      const headers = await this.authHeaders();
      const response = await firstValueFrom(
        this.http.get<AccountSettingsResponse>(`${environment.apiBaseUrl}/api/users/me/settings`, { headers })
      );
      this.settings = response;
      this.profileForm = {
        firstName: response.firstName ?? '',
        lastName: response.lastName ?? '',
        email: response.email ?? '',
        phone: response.phone ?? '',
        avatarUrl: response.avatarUrl ?? ''
      };
      this.preferencesForm = {
        preferredLanguage: response.preferredLanguage ?? 'en',
        notificationsEnabled: response.notificationsEnabled,
        theme: response.theme ?? 'light'
      };

      if (!response.mustChangePassword) {
        this.authStorage.setPasswordChangeRequired(false);
        if (this.forcePasswordChange) {
          this.forcePasswordChange = false;
          if (this.activeTab !== 'security') {
            this.activeTab = 'profile';
          }
        }
      }
    } catch (error: any) {
      this.errorMessage = error?.error?.message || error?.message || 'Failed to load account settings.';
    } finally {
      this.loading = false;
    }
  }

  async saveProfile(): Promise<void> {
    this.savingProfile = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      const headers = await this.authHeaders();
      await firstValueFrom(
        this.http.patch(`${environment.apiBaseUrl}/api/users/me/profile`, {
          firstName: this.profileForm.firstName,
          lastName: this.profileForm.lastName,
          email: this.profileForm.email,
          phone: this.profileForm.phone || null,
          avatarUrl: this.profileForm.avatarUrl || null
        }, { headers })
      );
      this.successMessage = 'Profile updated successfully.';
      await this.loadSettings();
    } catch (error: any) {
      this.errorMessage = error?.error?.message || error?.message || 'Failed to update profile.';
    } finally {
      this.savingProfile = false;
    }
  }

  async savePreferences(): Promise<void> {
    this.savingPrefs = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      const headers = await this.authHeaders();
      await firstValueFrom(
        this.http.patch(`${environment.apiBaseUrl}/api/users/me/preferences`, {
          preferredLanguage: this.preferencesForm.preferredLanguage,
          notificationsEnabled: this.preferencesForm.notificationsEnabled,
          theme: this.preferencesForm.theme
        }, { headers })
      );
      this.successMessage = 'Preferences updated successfully.';
      await this.loadSettings();
    } catch (error: any) {
      this.errorMessage = error?.error?.message || error?.message || 'Failed to update preferences.';
    } finally {
      this.savingPrefs = false;
    }
  }

  async changePassword(): Promise<void> {
    this.savingPassword = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      const headers = await this.authHeaders();
      await firstValueFrom(
        this.http.post(`${environment.apiBaseUrl}/api/users/me/change-password`, {
          currentPassword: this.securityForm.currentPassword,
          newPassword: this.securityForm.newPassword,
          confirmPassword: this.securityForm.confirmPassword
        }, { headers })
      );

      this.securityForm = {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      };

      this.successMessage = 'Password changed successfully.';
      this.authStorage.setPasswordChangeRequired(false);
      await this.loadSettings();

      if (this.forcePasswordChange) {
        this.forcePasswordChange = false;
        await this.router.navigateByUrl('/backoffice/dashboard');
      }
    } catch (error: any) {
      this.errorMessage = error?.error?.message || error?.message || 'Failed to change password.';
    } finally {
      this.savingPassword = false;
    }
  }

  private async authHeaders(): Promise<HttpHeaders> {
    const token = await getValidToken();
    return new HttpHeaders({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' });
  }
}
