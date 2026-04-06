import { APP_INITIALIZER, ApplicationConfig, isDevMode, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { provideServiceWorker } from '@angular/service-worker';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { RequestLogInterceptor } from './interceptors/request-log.interceptor';
import { ClientLogsService } from './services/client-logs.service';

import { routes } from './app.routes';

function initClientLogs(clientLogsService: ClientLogsService) {
  return () => {
    clientLogsService.initialize();
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
    { provide: LOCALE_ID, useValue: 'ca-ES' },
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: RequestLogInterceptor, multi: true },
    { provide: APP_INITIALIZER, useFactory: initClientLogs, deps: [ClientLogsService], multi: true },
  ]
};
