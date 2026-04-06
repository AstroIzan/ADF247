import { Injectable, signal } from '@angular/core';
import { DataService, LogsIndexInfo } from './data.service';

@Injectable({
  providedIn: 'root'
})
export class LogsAccessService {
  readonly loading = signal(false);
  readonly allowed = signal(false);
  readonly indexes = signal<LogsIndexInfo[]>([]);
  readonly error = signal('');

  constructor(private dataService: DataService) {}

  refresh(): void {
    this.loading.set(true);
    this.error.set('');

    this.dataService.getLogsAccess().subscribe({
      next: (response) => {
        this.allowed.set(Boolean(response?.allowed));
        this.indexes.set(Array.isArray(response?.indexes) ? response.indexes : []);
        this.loading.set(false);
      },
      error: (err) => {
        this.allowed.set(false);
        this.indexes.set([]);
        this.error.set(err?.message || 'No s\'ha pogut comprovar l\'accés als logs.');
        this.loading.set(false);
      },
    });
  }

  clear(): void {
    this.allowed.set(false);
    this.indexes.set([]);
    this.error.set('');
    this.loading.set(false);
  }
}
