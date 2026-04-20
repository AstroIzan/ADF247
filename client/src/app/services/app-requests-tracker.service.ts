import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface AppRequestEvent {
  route: string;
  section?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AppRequestsTrackerService {
  private readonly endpoint = '/api/logs/app-requests';

  constructor(private readonly http: HttpClient) {}

  trackRoute(route: string): void {
    const normalizedRoute = this.normalizeRoute(route);
    const payload: AppRequestEvent = {
      route: normalizedRoute,
      section: this.deriveSection(normalizedRoute),
    };

    this.http.post(this.endpoint, payload).subscribe({
      error: () => {
        // Ignore tracking failures to keep navigation flow unaffected.
      },
    });
  }

  private normalizeRoute(rawRoute: string): string {
    const value = String(rawRoute || '').trim();
    if (!value) {
      return '/unknown';
    }

    return value.startsWith('/') ? value : `/${value}`;
  }

  private deriveSection(route: string): string {
    const cleaned = route.split('?')[0].split('#')[0];
    const parts = cleaned.split('/').filter(Boolean);
    return (parts[0] || 'home').toLowerCase();
  }
}
