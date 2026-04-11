import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthStorageService } from './auth-storage.service';

export const authTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const authStorage = inject(AuthStorageService);

  const isApiRequest = req.url.startsWith(environment.apiBaseUrl);
  const isLoginRequest = req.url.endsWith('/api/auth/login');

  if (!isApiRequest || isLoginRequest) {
    return next(req);
  }

  const token = authStorage.getAccessToken();
  if (!token || !token.trim()) {
    return next(req);
  }

  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });

  return next(authReq);
};