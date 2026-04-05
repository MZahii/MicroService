import { ApplicationConfig, provideAppInitializer } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { initializeKeycloak } from './core/auth/keycloak.service';
import { actorHeaderInterceptor } from './core/interceptors/actor-header.interceptor';


export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([actorHeaderInterceptor])),
    provideAppInitializer(() => initializeKeycloak())
  ]
};
