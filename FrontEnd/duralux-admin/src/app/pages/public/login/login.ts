import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthApiService } from '../../../core/auth/auth-api.service';
import { AuthStorageService } from '../../../core/auth/auth-storage.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  loading = false;
  errorMessage = '';

  form = {
    identifier: '',
    password: '',
    rememberMe: true
  };

  constructor(
    private authApi: AuthApiService,
    private authStorage: AuthStorageService,
    private router: Router
  ) {}

  submit(): void {
    this.errorMessage = '';

    const identifier = this.form.identifier.trim();
    const password = this.form.password;

    if (!identifier || !password) {
      this.errorMessage = 'Username/email and password are required.';
      return;
    }

    if (this.loading) {
      return;
    }

    this.loading = true;

    this.authApi.login({
      identifier,
      password
    }).subscribe({
      next: (response) => {
        this.loading = false;
        this.authStorage.saveSession(response, this.form.rememberMe);
        this.router.navigateByUrl(response.redirectTo || '/');
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage =
          err?.error?.message ||
          'Invalid username/email or password.';
      }
    });
  }
}