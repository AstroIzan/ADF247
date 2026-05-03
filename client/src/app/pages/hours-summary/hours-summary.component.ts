import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { DataService, UserHoursSummaryRow } from '../../services/data.service';

@Component({
  selector: 'app-hours-summary',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hours-summary.component.html',
  styleUrl: './hours-summary.component.css',
})
export class HoursSummaryComponent implements OnInit {
  loading = signal(false);
  error = signal('');
  generatedAt = signal<string | null>(null);
  rows = signal<UserHoursSummaryRow[]>([]);

  constructor(
    private authService: AuthService,
    private dataService: DataService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    if (!this.authService.isAdmin()) {
      this.router.navigate(['/home']);
      return;
    }

    this.loadSummary();
  }

  loadSummary() {
    this.loading.set(true);
    this.error.set('');

    this.dataService.getHoursSummary().subscribe({
      next: (summary) => {
        this.rows.set(Array.isArray(summary?.users) ? summary.users : []);
        this.generatedAt.set(summary?.generatedAt || null);
        this.loading.set(false);
      },
      error: (err) => {
        this.rows.set([]);
        this.generatedAt.set(null);
        this.error.set(err.message || 'No s\'ha pogut carregar el resum d\'hores.');
        this.loading.set(false);
      },
    });
  }

  formatRoundedHours(value: number | null | undefined) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return 0;
    }

    return Math.round(parsed);
  }
}
