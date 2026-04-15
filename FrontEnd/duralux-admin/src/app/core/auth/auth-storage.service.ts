import { Injectable } from '@angular/core';
import { LoginResponse } from './auth-api.service';

@Injectable({
  providedIn: 'root'
})
export class AuthStorageService {
  private readonly ACCESS_TOKEN_KEY = 'np_access_token';
  private readonly REFRESH_TOKEN_KEY = 'np_refresh_token';
  private readonly ROLE_KEY = 'np_role';
  private readonly REDIRECT_KEY = 'np_redirect_to';
  private readonly USER_KEY = 'np_user';

  saveSession(response: LoginResponse, rememberMe: boolean = true): void {
    this.clear();

    const storage = rememberMe ? localStorage : sessionStorage;

    storage.setItem(this.ACCESS_TOKEN_KEY, response.accessToken);
    storage.setItem(this.REFRESH_TOKEN_KEY, response.refreshToken);
    storage.setItem(this.ROLE_KEY, response.role);
    storage.setItem(this.REDIRECT_KEY, response.redirectTo);

    storage.setItem(
      this.USER_KEY,
      JSON.stringify({
        userId: response.userId,
        keycloakId: response.keycloakId,
        username: response.username,
        email: response.email,
        firstName: response.firstName,
        lastName: response.lastName,
        mustChangePassword: response.mustChangePassword
      })
    );
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY)
      ?? sessionStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY)
      ?? sessionStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  getRole(): string | null {
    return localStorage.getItem(this.ROLE_KEY)
      ?? sessionStorage.getItem(this.ROLE_KEY);
  }

  getRedirectTo(): string | null {
    return localStorage.getItem(this.REDIRECT_KEY)
      ?? sessionStorage.getItem(this.REDIRECT_KEY);
  }

  getUser(): any | null {
    const raw =
      localStorage.getItem(this.USER_KEY)
      ?? sessionStorage.getItem(this.USER_KEY);

    return raw ? JSON.parse(raw) : null;
  }

  isPasswordChangeRequired(): boolean {
    return !!this.getUser()?.mustChangePassword;
  }

  setPasswordChangeRequired(required: boolean): void {
    const user = this.getUser();
    if (!user) return;
    user.mustChangePassword = required;
    const storage = localStorage.getItem(this.USER_KEY) ? localStorage : sessionStorage;
    storage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  clear(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.ROLE_KEY);
    localStorage.removeItem(this.REDIRECT_KEY);
    localStorage.removeItem(this.USER_KEY);

    sessionStorage.removeItem(this.ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(this.REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(this.ROLE_KEY);
    sessionStorage.removeItem(this.REDIRECT_KEY);
    sessionStorage.removeItem(this.USER_KEY);
  }
}
