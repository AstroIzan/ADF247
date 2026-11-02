import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Adf, PlaAlfaMunicipalityCatalogItem, AdfConvocatoria, AdfOverview, AdfUser, AdfVehicle, DataService } from '../../services/data.service';

type DetailTab = 'convocatories' | 'usuaris' | 'vehicles';

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
  formMunicipalities = signal<string[]>([]);
  municipalityCatalog = signal<PlaAlfaMunicipalityCatalogItem[]>([]);
  municipalitySearch = signal('');
  filteredCatalog = computed(() => {
    const query = this.normalize(this.municipalitySearch());
    const items = this.municipalityCatalog();
    return (query ? items.filter((item) => this.normalize(item.municipality + ' ' + (item.comarca ?? '')).includes(query)) : items).slice(0, 200);
  });
  saving = signal(false);

  selected = signal<Adf | null>(null);
  detailTab = signal<DetailTab>('convocatories');
  detailLoading = signal(false);
  convocatories = signal<AdfConvocatoria[]>([]);
  users = signal<AdfUser[]>([]);
  vehicles = signal<AdfVehicle[]>([]);

  constructor(private dataService: DataService) {}

  ngOnInit() {
    this.load();
    this.dataService.getPlaAlfaCatalog().subscribe({
      next: (catalog) => this.municipalityCatalog.set(catalog.municipalities ?? []),
      error: () => this.municipalityCatalog.set([]),
    });
  }

  private normalize(value: string) {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  }

  isSelected(name: string) {
    return this.formMunicipalities().some((item) => item.toLowerCase() === name.toLowerCase());
  }

  toggleMunicipality(name: string) {
    this.formMunicipalities.update((list) => this.isSelected(name)
      ? list.filter((item) => item.toLowerCase() !== name.toLowerCase())
      : [...list, name].sort((a, b) => a.localeCompare(b)));
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
    this.formMunicipalities.set([...(adf?.municipalities ?? [])]);
    this.municipalitySearch.set('');
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
    const municipalities = this.formMunicipalities();
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
    this.vehicles.set([]);
    let pending = 3;
    const done = () => {
      if (--pending === 0) this.detailLoading.set(false);
    };
    this.dataService.getAdfConvocatorias(adf.id).subscribe({
      next: (items) => { this.convocatories.set(items); done(); },
      error: (err) => { this.error.set(err?.error?.message || 'Error carregant convocatòries.'); done(); },
    });
    this.dataService.getAdfVehicles(adf.id).subscribe({
      next: (items) => { this.vehicles.set(items); done(); },
      error: (err) => { this.error.set(err?.error?.message || 'Error carregant vehicles.'); done(); },
    });
    this.dataService.getAdfUsers(adf.id).subscribe({
      next: (items) => { this.users.set(items); done(); },
      error: (err) => { this.error.set(err?.error?.message || 'Error carregant usuaris.'); done(); },
    });
  }
}
