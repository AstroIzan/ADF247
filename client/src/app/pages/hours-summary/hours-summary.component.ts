import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { DataService, Intervencio, TypeIncendi, UserHoursDetail, UserHoursSummaryRow } from '../../services/data.service';
import { IntervencionsModalComponent } from '../../modules/intervencions/intervencions-modal.component';

@Component({
  selector: 'app-hours-summary',
  standalone: true,
  imports: [CommonModule, IntervencionsModalComponent],
  templateUrl: './hours-summary.component.html',
  styleUrl: './hours-summary.component.css',
})
export class HoursSummaryComponent implements OnInit {
  activeTab = signal<'hores' | 'intervencions'>('hores');
  intervencions = signal<Intervencio[]>([]);
  intervencionsLoading = signal(false);
  intervencionsError = signal('');
  intervencioTypes = signal<TypeIncendi[]>([]);
  viewIntervencio = signal<Intervencio | null>(null);
  editIntervencio = signal<Intervencio | null>(null);

  loadIntervencions() {
    this.intervencionsLoading.set(true);
    this.intervencionsError.set('');
    this.dataService.getIntervencions({}).subscribe({
      next: (items) => { this.intervencions.set(items); this.intervencionsLoading.set(false); },
      error: (error) => {
        this.intervencionsLoading.set(false);
        this.intervencionsError.set(error.error?.message || 'No s’han pogut carregar les intervencions.');
      },
    });
    this.dataService.getIntervencionsContext({}).subscribe({
      next: (ctx) => this.intervencioTypes.set(ctx.types),
      error: () => undefined,
    });
  }

  intervencioType(item: Intervencio) {
    return this.intervencioTypes().find((type) => type.id === item.typeIncendiId)?.name ?? '—';
  }

  closeIntervencioEdit() {
    this.editIntervencio.set(null);
    this.loadIntervencions();
  }

  detailUser = signal<UserHoursSummaryRow | null>(null);
  detail = signal<UserHoursDetail | null>(null);
  detailLoading = signal(false);
  detailError = signal('');

  openDetail(row: UserHoursSummaryRow) {
    this.detailUser.set(row);
    this.detail.set(null);
    this.detailError.set('');
    this.detailLoading.set(true);
    this.dataService.getUserHoursDetail(row.userId).subscribe({
      next: (detail) => {
        this.detail.set(detail);
        this.detailLoading.set(false);
      },
      error: (error) => {
        this.detailLoading.set(false);
        this.detailError.set(error.error?.message || error.message || 'No s’ha pogut carregar el detall.');
      },
    });
  }

  closeDetail() {
    this.detailUser.set(null);
  }

  detailStatus(item: UserHoursDetail['items'][number]) {
    if (!item.answered) return { label: 'No respost', css: 'status-warn' };
    if (!item.response) return { label: 'Resposta NO', css: 'status-muted' };
    if (item.attended) return { label: 'Ha assistit', css: 'status-ok' };
    return item.justified
      ? { label: 'No assisteix · justificat', css: 'status-warn' }
      : { label: 'No assisteix · sense justificar', css: 'status-bad' };
  }

  loading = signal(false);
  error = signal('');
  generatedAt = signal<string | null>(null);
  isConfigured = signal(true);
  rows = signal<UserHoursSummaryRow[]>([]);
  totalHours = computed(() => this.rows().reduce((total, row) => total + this.formatRoundedHours(row.totalHours), 0));
  totalPenalties = computed(() => this.rows().reduce(
    (total, row) => total + this.formatRoundedHours(row.unansweredPenaltyHours) + this.formatRoundedHours(row.noShowPenaltyHours),
    0,
  ));
  totalUnanswered = computed(() => this.rows().reduce((total, row) => total + (Number(row.unansweredCount) || 0), 0));

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

    if (!this.authService.isManager()) {
      this.router.navigate(['/home']);
      return;
    }

    this.loadSummary();
    this.loadIntervencions();
  }

  loadSummary() {
    this.loading.set(true);
    this.error.set('');

    this.dataService.getHoursSummary().subscribe({
      next: (summary) => {
        this.rows.set(Array.isArray(summary?.users) ? summary.users : []);
        this.generatedAt.set(summary?.generatedAt || null);
        this.isConfigured.set(summary?.isConfigured !== false);
        this.loading.set(false);
      },
      error: (err) => {
        this.rows.set([]);
        this.generatedAt.set(null);
        this.isConfigured.set(true);
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
