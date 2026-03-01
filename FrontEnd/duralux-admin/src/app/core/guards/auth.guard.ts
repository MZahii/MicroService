import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthStorageService } from '../auth/auth-storage.service';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const authStorage = inject(AuthStorageService);

  if (authStorage.isAuthenticated()) {
    return true;
  }

  return router.parseUrl('/login');
};