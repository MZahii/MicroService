import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthStorageService } from './auth-storage.service';
import { getValidToken } from './keycloak.service';

export const authTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const authStorage = inject(AuthStorageService);

  const isApiRequest = req.url.startsWith(environment.apiBaseUrl);
  const isLoginRequest = req.url.endsWith('/api/auth/login');

  if (!isApiRequest || isLoginRequest) {
    return next(req);
  }

  const storedToken = authStorage.getAccessToken();
  if (!storedToken || !storedToken.trim()) {
    return next(req);
  }

  return from(getValidToken()).pipe(
    switchMap((token) => {
      const authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });

      return next(authReq);
    }),
    catchError(() => next(req))
  );
};
