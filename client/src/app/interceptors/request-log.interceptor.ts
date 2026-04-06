import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { ClientLogsService } from '../services/client-logs.service';

@Injectable()
export class RequestLogInterceptor implements HttpInterceptor {
  constructor(private clientLogsService: ClientLogsService) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (req.url.includes('/api/logs/client')) {
      return next.handle(req);
    }

    const startedAt = performance.now();

    return next.handle(req).pipe(
      tap({
        next: (event) => {
          if (!(event instanceof HttpResponse)) {
            return;
          }

          const durationMs = Math.round(performance.now() - startedAt);
          const message = `HTTP ${req.method} ${req.urlWithParams} -> ${event.status}`;

          const context = {
            method: req.method,
            url: req.urlWithParams,
            statusCode: event.status,
            durationMs,
          };

          if (event.status >= 400) {
            this.clientLogsService.warn(message, 'client-http', context, 'accesslogs');
            return;
          }

          this.clientLogsService.info(message, 'client-http', context, 'accesslogs');
        },
        error: (error) => {
          const durationMs = Math.round(performance.now() - startedAt);
          const statusCode = Number(error?.status || 0);
          const message = `HTTP ${req.method} ${req.urlWithParams} -> ${statusCode || 'ERROR'}`;

          this.clientLogsService.error(message, 'client-http', {
            method: req.method,
            url: req.urlWithParams,
            statusCode: statusCode || null,
            durationMs,
            errorMessage: error?.message || null,
          }, 'accesslogs');
        },
      })
    );
  }
}
