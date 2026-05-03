import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  DataService,
  PlaAlfaMunicipalityCatalogItem,
  PlaAlfaMunicipalityStatusItem,
  PlaAlfaWeatherForecast,
} from '../../services/data.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-pla-alfa',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pla-alfa.component.html',
  styleUrl: './pla-alfa.component.css',
})
export class PlaAlfaComponent implements OnInit {
  plaAlfaLoading = signal(false);
  plaAlfaSaving = signal(false);
  plaAlfaRefreshingStatus = signal(false);
  plaAlfaError = signal('');
  plaAlfaInfo = signal('');
  plaAlfaCatalog = signal<PlaAlfaMunicipalityCatalogItem[]>([]);
  plaAlfaSelected = signal<string[]>([]);
  plaAlfaPrincipal = signal<string | null>(null);
  plaAlfaStatus = signal<PlaAlfaMunicipalityStatusItem[]>([]);
  plaAlfaUpdatedAt = signal<string | null>(null);
  plaAlfaSearch = signal('');
  plaAlfaComarcaFilter = signal('all');
  readonly isAdminUser = signal(false);

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

    this.isAdminUser.set(this.authService.isAdmin());

    if (this.isAdminUser()) {
      this.loadPlaAlfaData();
      return;
    }

    this.refreshPlaAlfaStatus();
  }

  loadPlaAlfaData() {
    this.plaAlfaLoading.set(true);
    this.plaAlfaError.set('');
    this.plaAlfaInfo.set('');

    this.dataService.getPlaAlfaCatalog().subscribe({
      next: (response) => {
        this.plaAlfaCatalog.set(response.municipalities || []);
        this.plaAlfaSelected.set(response.selectedMunicipalities || []);
        this.plaAlfaPrincipal.set(response.principalMunicipality || null);
        this.plaAlfaLoading.set(false);
        this.refreshPlaAlfaStatus();
      },
      error: (err) => {
        this.plaAlfaError.set(err.message || 'No s\'ha pogut carregar el catàleg de municipis de Pla Alfa.');
        this.plaAlfaLoading.set(false);
      },
    });
  }

  onPlaAlfaSearchInput(event: Event) {
    const input = event.target as HTMLInputElement;
    this.plaAlfaSearch.set((input.value || '').trim().toLowerCase());
  }

  onPlaAlfaComarcaFilterChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.plaAlfaComarcaFilter.set(select.value || 'all');
  }

  togglePlaAlfaMunicipality(municipality: string, checked: boolean) {
    const selected = new Set(this.plaAlfaSelected());

    if (checked) {
      selected.add(municipality);
    } else {
      selected.delete(municipality);
    }

    this.plaAlfaSelected.set(Array.from(selected).sort((a, b) => a.localeCompare(b, 'ca')));

    if (!checked && this.plaAlfaPrincipal() === municipality) {
      this.plaAlfaPrincipal.set(null);
    }

    this.plaAlfaInfo.set('');
  }

  setPrincipalMunicipality(municipality: string, checked: boolean) {
    if (!checked) {
      if (this.plaAlfaPrincipal() === municipality) {
        this.plaAlfaPrincipal.set(null);
      }
      return;
    }

    if (!this.isPlaAlfaMunicipalitySelected(municipality)) {
      this.togglePlaAlfaMunicipality(municipality, true);
    }

    this.plaAlfaPrincipal.set(municipality);
    this.plaAlfaInfo.set('');
  }

  isPrincipalMunicipality(municipality: string) {
    return this.plaAlfaPrincipal() === municipality;
  }

  isPlaAlfaMunicipalitySelected(municipality: string) {
    return this.plaAlfaSelected().includes(municipality);
  }

  getPlaAlfaComarcaOptions() {
    const options = new Set<string>();

    for (const item of this.plaAlfaCatalog()) {
      if (item.comarca) {
        options.add(item.comarca);
      }
    }

    return Array.from(options).sort((a, b) => a.localeCompare(b, 'ca'));
  }

  getFilteredPlaAlfaCatalog() {
    const search = this.plaAlfaSearch();
    const comarca = this.plaAlfaComarcaFilter();
    const selected = new Set(this.plaAlfaSelected());
    const filtered: PlaAlfaMunicipalityCatalogItem[] = [];

    for (const item of this.plaAlfaCatalog()) {
      const isSelected = selected.has(item.municipality);
      const municipality = item.municipality.toLowerCase();
      const comarcaValue = (item.comarca || '').toLowerCase();
      const matchesSearch = !search || municipality.includes(search) || comarcaValue.includes(search);
      const matchesComarca = comarca === 'all' || (item.comarca || '') === comarca;

      if (isSelected || (matchesSearch && matchesComarca)) {
        filtered.push(item);
      }
    }

    return filtered.sort((a, b) => {
      const aSelected = selected.has(a.municipality) ? 0 : 1;
      const bSelected = selected.has(b.municipality) ? 0 : 1;

      if (aSelected !== bSelected) {
        return aSelected - bSelected;
      }

      return a.municipality.localeCompare(b.municipality, 'ca');
    });
  }

  areAllPlaAlfaMunicipalitiesSelected() {
    const catalog = this.plaAlfaCatalog();
    if (!catalog.length) {
      return false;
    }

    return this.plaAlfaSelected().length === catalog.length;
  }

  toggleSelectAllPlaAlfaMunicipalities() {
    if (this.areAllPlaAlfaMunicipalitiesSelected()) {
      this.plaAlfaSelected.set([]);
      this.plaAlfaInfo.set('Selecció de municipis buidada.');
      return;
    }

    const allMunicipalities = this.plaAlfaCatalog()
      .map((item) => item.municipality)
      .sort((a, b) => a.localeCompare(b, 'ca'));

    this.plaAlfaSelected.set(allMunicipalities);
    this.plaAlfaInfo.set('S\'han seleccionat tots els municipis.');
  }

  getPlaAlfaLevelLabel(level: number | null | undefined) {
    if (!Number.isInteger(level) || level === null || level === undefined) {
      return 'N/D';
    }

    return `Alfa ${level}`;
  }

  getPlaAlfaLevelClass(level: number | null | undefined) {
    if (!Number.isInteger(level) || level === null || level === undefined) {
      return 'pla-alfa-level-unknown';
    }

    if (level < 0) {
      return 'pla-alfa-level-unknown';
    }

    if (level > 5) {
      return 'pla-alfa-level-unknown';
    }

    return `pla-alfa-level-${level}`;
  }

  formatPlaAlfaWeatherSummary(forecast: PlaAlfaWeatherForecast | null | undefined) {
    if (!forecast) {
      return 'Sense previsio';
    }

    const tempText = this.formatRange(forecast.temperatureC.min, forecast.temperatureC.max, '°C');
    const humidityText = this.formatRange(forecast.humidityPct.min, forecast.humidityPct.max, '%');
    const windSpeed = this.formatSingleValue(forecast.wind.maxSpeedKmh, 'km/h');
    const windDir = (forecast.wind.direction || '').trim();
    const windAngleDeg = this.getWindDirectionAngleDeg(windDir);
    const windDirectionName = this.getWindDirectionName(windDir);

    return {
      temperature: tempText,
      humidity: humidityText,
      windSpeed,
      windDirection: windDir,
      windDirectionName,
      windAngleDeg,
    };
  }

  private getWindDirectionName(direction: string) {
    const normalized = String(direction || '').trim().toUpperCase();

    if (!normalized) {
      return '';
    }

    const catalanNameMap: Record<string, string> = {
      N: 'Tramuntana',
      NNE: 'Tramuntana-Gregal',
      NE: 'Gregal',
      ENE: 'Gregal-Llevant',
      E: 'Llevant',
      ESE: 'Llevant-Xaloc',
      SE: 'Xaloc',
      SSE: 'Xaloc-Migjorn',
      S: 'Migjorn',
      SSO: 'Migjorn-Garbí',
      SSW: 'Migjorn-Garbí',
      SO: 'Garbí',
      SW: 'Garbí',
      OSO: 'Garbí-Ponent',
      WSW: 'Garbí-Ponent',
      O: 'Ponent',
      W: 'Ponent',
      ONO: 'Ponent-Mestral',
      WNW: 'Ponent-Mestral',
      NO: 'Mestral',
      NW: 'Mestral',
      NNO: 'Mestral-Tramuntana',
      NNW: 'Mestral-Tramuntana',
    };

    return catalanNameMap[normalized] || '';
  }

  private getWindDirectionAngleDeg(direction: string) {
    const normalized = String(direction || '').trim().toUpperCase();

    if (!normalized) {
      return null;
    }

    const directionMap: Record<string, number> = {
      N: 180,
      NE: 225,
      E: 270,
      SE: 315,
      S: 0,
      SO: 45,
      O: 90,
      NO: 135,
      NW: 135,
      W: 90,
      SW: 45,
    };

    return directionMap[normalized] ?? null;
  }

  private formatRange(min: number | null | undefined, max: number | null | undefined, suffix: string) {
    const minValue = Number.isFinite(min) ? Number(min) : null;
    const maxValue = Number.isFinite(max) ? Number(max) : null;

    if (minValue === null && maxValue === null) {
      return '-';
    }

    if (minValue !== null && maxValue !== null) {
      return `${minValue}${suffix} / ${maxValue}${suffix}`;
    }

    const singleValue = minValue ?? maxValue;
    return singleValue === null ? '-' : `${singleValue}${suffix}`;
  }

  private formatSingleValue(value: number | null | undefined, suffix: string) {
    const numericValue = Number.isFinite(value) ? Number(value) : null;
    return numericValue === null ? '-' : `${numericValue} ${suffix}`;
  }

  savePlaAlfaSelection() {
    if (!this.isAdminUser()) {
      return;
    }

    this.plaAlfaSaving.set(true);
    this.plaAlfaError.set('');
    this.plaAlfaInfo.set('');

    this.dataService.updatePlaAlfaMunicipalities({
      municipalities: this.plaAlfaSelected(),
      principalMunicipality: this.plaAlfaPrincipal(),
    }).subscribe({
      next: (response) => {
        this.plaAlfaPrincipal.set(response.principalMunicipality || null);
        this.plaAlfaSaving.set(false);
        this.plaAlfaInfo.set('Municipis de Pla Alfa actualitzats correctament.');
        this.refreshPlaAlfaStatus(true);
      },
      error: (err) => {
        this.plaAlfaSaving.set(false);
        this.plaAlfaError.set(err.message || 'No s\'ha pogut desar la selecció de municipis.');
      },
    });
  }

  refreshPlaAlfaStatus(forceRefresh = false) {
    this.plaAlfaRefreshingStatus.set(true);

    this.dataService.getPlaAlfaMunicipalitiesStatus(forceRefresh).subscribe({
      next: (response) => {
        this.plaAlfaPrincipal.set(response.principalMunicipality || null);
        this.plaAlfaStatus.set(response.municipalities || []);
        this.plaAlfaUpdatedAt.set(response.updatedAt || null);
        this.plaAlfaRefreshingStatus.set(false);
      },
      error: (err) => {
        this.plaAlfaRefreshingStatus.set(false);
        this.plaAlfaError.set(err.message || 'No s\'ha pogut carregar l\'estat de Pla Alfa.');
      },
    });
  }

  getForecastSourceLabel(source: 'aemet' | 'open-meteo' | 'mixed' | null | undefined) {
    if (source === 'aemet') {
      return 'AEMET';
    }

    if (source === 'open-meteo') {
      return 'Open-Meteo';
    }

    if (source === 'mixed') {
      return 'Mixto';
    }

    return 'Sense font';
  }

  getForecastSourceIcon(source: 'aemet' | 'open-meteo' | 'mixed' | null | undefined) {
    if (source === 'aemet') {
      return '🟡';
    }

    if (source === 'open-meteo') {
      return '🔵';
    }

    if (source === 'mixed') {
      return '🟡🔵';
    }

    return '⚪';
  }
}
