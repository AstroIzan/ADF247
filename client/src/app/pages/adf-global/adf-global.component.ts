import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Adf, AdfConvocatoria, AdfOverview, AdfUser, DataService } from '../../services/data.service';

type DetailTab = 'convocatories' | 'usuaris';

@Component({
  selector: 'app-adf-global',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './adf-global.component.html',
  styleUrl: './adf-global.component.css',
})
export class AdfGlobalComponent implements OnInit {
  overview = signal<AdfOverview[]>([]);
  loading = signal(false);
  error = signal('');
  notice = signal('');

  editing = signal(false);
  editingId = signal<number | null>(null);
  formNumber = signal<number | null>(null);
  formName = signal('');
  formMunicipalities = signal('');
  saving = signal(false);

  selected = signal<Adf | null>(null);
  detailTab = signal<DetailTab>('convocatories');
  detailLoading = signal(false);
  convocatories = signal<AdfConvocatoria[]>([]);
  users = signal<AdfUser[]>([]);

  constructor(private dataService: DataService) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.error.set('');
    this.dataService.getAdfOverview().subscribe({
      next: (items) => {
        this.overview.set(items);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'No s\'ha pogut carregar el panell global.');
        this.loading.set(false);
      },
    });
  }

  openForm(adf?: Adf) {
    this.editingId.set(adf?.id ?? null);
    this.formNumber.set(adf?.number ?? null);
    this.formName.set(adf?.name ?? '');
    this.formMunicipalities.set((adf?.municipalities ?? []).join(', '));
    this.editing.set(true);
  }

  closeForm() {
    this.editing.set(false);
  }

  save() {
    const number = this.formNumber();
    if (!number || !this.formName().trim()) {
      this.error.set('El número i el nom de l\'ADF són obligatoris.');
      return;
    }
    this.saving.set(true);
    this.error.set('');
    const municipalities = this.formMunicipalities().split(',').map((item) => item.trim()).filter(Boolean);
    this.dataService.saveAdf(this.editingId(), { number, name: this.formName().trim(), municipalities }).subscribe({
      next: () => {
        this.saving.set(false);
        this.editing.set(false);
        this.notice.set('ADF desada correctament.');
        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err?.error?.message || 'No s\'ha pogut desar l\'ADF.');
      },
    });
  }

  remove(adf: Adf) {
    if (!confirm(`Eliminar l'ADF ${adf.number} - ${adf.name}?`)) return;
    this.dataService.deleteAdf(adf.id).subscribe({
      next: () => {
        this.notice.set('ADF eliminada.');
        if (this.selected()?.id === adf.id) this.selected.set(null);
        this.load();
      },
      error: (err) => this.error.set(err?.error?.message || 'No s\'ha pogut eliminar l\'ADF.'),
    });
  }

  select(adf: Adf) {
    this.selected.set(adf);
    this.detailTab.set('convocatories');
    this.loadDetail(adf);
  }

  setTab(tab: DetailTab) {
    this.detailTab.set(tab);
  }

  private loadDetail(adf: Adf) {
    this.detailLoading.set(true);
    this.convocatories.set([]);
    this.users.set([]);
    let pending = 2;
    const done = () => {
      if (--pending === 0) this.detailLoading.set(false);
    };
    this.dataService.getAdfConvocatorias(adf.id).subscribe({
      next: (items) => { this.convocatories.set(items); done(); },
      error: (err) => { this.error.set(err?.error?.message || 'Error carregant convocatòries.'); done(); },
    });
    this.dataService.getAdfUsers(adf.id).subscribe({
      next: (items) => { this.users.set(items); done(); },
      error: (err) => { this.error.set(err?.error?.message || 'Error carregant usuaris.'); done(); },
    });
  }
}
