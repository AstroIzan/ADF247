import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';
import {
  BomberEntry, Convocatoria, DataService, Intervencio, IntervencioContext, IntervencioPayload, OtherAdfEntry, TypeIncendi,
} from '../../services/data.service';

const DEFAULT_CENTER: L.LatLngTuple = [41.7, 1.8];

@Component({
  selector: 'app-intervencions-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './intervencions-modal.component.html',
  styleUrl: './intervencions-modal.component.css',
})
export class IntervencionsModalComponent implements OnInit, OnDestroy {
  private data = inject(DataService);

  @Input() convocatoria: Convocatoria | null = null;
  @Output() closed = new EventEmitter<void>();
  @ViewChild('mapHost') set mapHost(ref: ElementRef<HTMLDivElement> | undefined) {
    if (ref && !this.map) this.initMap(ref.nativeElement);
  }

  readonly levels = [0, 1, 2, 3, 4, 5];
  items = signal<Intervencio[]>([]);
  context = signal<IntervencioContext | null>(null);
  types = signal<TypeIncendi[]>([]);
  loading = signal(false);
  saving = signal(false);
  error = signal('');
  listDate = signal(this.today());
  editing = signal<Intervencio | null>(null);
  formOpen = signal(false);
  form = signal<IntervencioPayload>(this.emptyForm());
  manualResponsable = signal(false);
  excludedVolunteers = signal<Set<number>>(new Set());
  geocoding = signal(false);
  levelHint = signal('');
  suggestion = signal('');
  deleteConfirm = signal<number | null>(null);

  mapsUrl = computed(() => {
    const f = this.form();
    return f.latitude != null && f.longitude != null ? `https://www.google.com/maps?q=${f.latitude},${f.longitude}` : '';
  });
  totalGrocs = computed(() => this.form().ownGrocs + this.form().otherAdfsGrocs);
  totalVerds = computed(() => this.form().ownVerds + this.form().otherAdfsVerds);

  private map: L.Map | null = null;
  private marker: L.CircleMarker | null = null;

  ngOnInit(): void {
    this.reload();
  }

  ngOnDestroy(): void {
    this.destroyMap();
  }

  title(): string {
    return this.convocatoria ? `Intervencions · ${this.convocatoria.title}` : 'Intervencions';
  }

  reload(): void {
    this.loading.set(true);
    this.error.set('');
    const request = this.convocatoria
      ? this.data.getIntervencions({ convocatoriaId: this.convocatoria.id })
      : this.data.getIntervencions({ date: this.listDate() });
    request.subscribe({
      next: items => { this.items.set(items); this.loading.set(false); },
      error: err => { this.error.set(err?.error?.message ?? 'No s\'han pogut carregar les intervencions.'); this.loading.set(false); },
    });
  }

  changeListDate(value: string): void {
    this.listDate.set(value);
    this.reload();
  }

  openNew(): void {
    const date = this.convocatoria ? this.dateOf(this.convocatoria.startTime) : this.listDate();
    this.editing.set(null);
    this.form.set({ ...this.emptyForm(), date, convocatoriaId: this.convocatoria?.id ?? null, responsableUserId: this.convocatoria?.responsableId ?? null });
    this.manualResponsable.set(false);
    this.loadContext(true);
    this.openForm();
  }

  openEdit(item: Intervencio): void {
    this.editing.set(item);
    const { id, adfId, responsableDisplay, mapsUrl, totalGrocs, totalVerds, ...payload } = item;
    this.form.set({ ...payload });
    this.manualResponsable.set(!item.responsableUserId && !!item.responsableName);
    this.loadContext(false);
    this.openForm();
  }

  private openForm(): void {
    this.excludedVolunteers.set(new Set());
    this.destroyMap();
    this.suggestion.set('');
    this.levelHint.set('');
    this.formOpen.set(true);
  }

  closeForm(): void {
    this.destroyMap();
    this.formOpen.set(false);
    this.error.set('');
  }

  update<K extends keyof IntervencioPayload>(key: K, value: IntervencioPayload[K]): void {
    this.form.update(f => ({ ...f, [key]: value }));
  }

  num(value: unknown): number {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  }

  private loadContext(applyDefaults: boolean): void {
    const f = this.form();
    this.data.getIntervencionsContext({ date: f.date, time: f.noticeTime ?? f.startTime ?? undefined, convocatoriaId: this.form().convocatoriaId ?? this.convocatoria?.id }).subscribe({
      next: ctx => {
        this.context.set(ctx);
        this.types.set(ctx.types);
        if (applyDefaults) {
          this.applyResponsableSuggestion(ctx);
          this.applyOwnVehicleTotals();
          this.refreshLevel();
        }
      },
      error: err => this.error.set(err?.error?.message ?? 'No s\'ha pogut carregar el context.'),
    });
  }

  refreshContext(): void {
    const f = this.form();
    this.data.getIntervencionsContext({ date: f.date, time: f.noticeTime ?? f.startTime ?? undefined, convocatoriaId: this.form().convocatoriaId ?? this.convocatoria?.id }).subscribe({
      next: ctx => {
        this.context.set(ctx);
        if (!this.convocatoria && !this.editing()) this.applyResponsableSuggestion(ctx);
      },
    });
    this.refreshLevel();
  }

  private applyResponsableSuggestion(ctx: IntervencioContext): void {
    if (this.convocatoria) return;
    if (ctx.matched) {
      this.form.update(f => ({ ...f, convocatoriaId: ctx.matched!.id, responsableUserId: ctx.matched!.responsableId, responsableName: null, responsableAdf: null }));
      this.suggestion.set(`Responsable de la convocatòria iniciada «${ctx.matched.title}».`);
    } else if (ctx.candidates.length) {
      const first = ctx.candidates[0];
      this.form.update(f => ({ ...f, convocatoriaId: first.id, responsableUserId: first.responsableId, responsableName: null, responsableAdf: null }));
      this.suggestion.set(`Recomanat: responsable de la convocatòria del dia «${first.title}».`);
    } else {
      this.suggestion.set('');
    }
  }

  onResponsableMode(manual: boolean): void {
    this.manualResponsable.set(manual);
    this.form.update(f => manual
      ? { ...f, responsableUserId: null }
      : { ...f, responsableName: null, responsableAdf: null });
  }

  onVehiclesChange(vehicle: string, checked: boolean): void {
    this.form.update(f => ({
      ...f,
      ownVehicles: checked ? [...f.ownVehicles, vehicle] : f.ownVehicles.filter(v => v !== vehicle),
    }));
    this.applyOwnVehicleTotals();
  }

  private applyOwnVehicleTotals(): void {
    const volunteers = this.vehicleVolunteers().filter(v => !this.excludedVolunteers().has(v.id));
    if (!this.vehicleVolunteers().length) return;
    this.form.update(f => ({
      ...f,
      ownGrocs: volunteers.filter(v => v.isGroc).length,
      ownVerds: volunteers.filter(v => !v.isGroc).length,
    }));
  }

  vehicleVolunteers(): { id: number; nCarnet: string; name: string; nIndicatiu: string | null; isGroc: boolean }[] {
    const ctx = this.context();
    if (!ctx) return [];
    const selected = new Set(this.form().ownVehicles);
    const seen = new Map<number, { id: number; nCarnet: string; name: string; nIndicatiu: string | null; isGroc: boolean }>();
    for (const vehicle of ctx.convocatoriaVehicles) {
      if (!selected.has(vehicle.vehicleName)) continue;
      for (const volunteer of vehicle.volunteers ?? []) seen.set(volunteer.id, volunteer);
    }
    return [...seen.values()];
  }

  toggleVolunteer(id: number, checked: boolean): void {
    this.excludedVolunteers.update(set => {
      const next = new Set(set);
      if (checked) next.delete(id); else next.add(id);
      return next;
    });
    this.applyOwnVehicleTotals();
  }

  adfOptions(current?: string | null): string[] {
    const options = (this.context()?.adfs ?? []).map(adf => `${adf.number} · ${adf.name}`);
    return current && !options.includes(current) ? [...options, current] : options;
  }
  vehicleOptions(): string[] {
    const ctx = this.context();
    if (!ctx) return this.form().ownVehicles;
    const names = new Set([...ctx.vehicleCatalog, ...ctx.convocatoriaVehicles.map(v => v.vehicleName), ...this.form().ownVehicles]);
    return [...names].filter(Boolean);
  }

  refreshLevel(): void {
    const date = this.form().date;
    const today = this.today();
    const tomorrow = this.toDateValue(new Date(Date.now() + 86400000));
    if (date !== today && date !== tomorrow) {
      this.levelHint.set('Només hi ha nivell Pla Alfa per a avui i demà.');
      return;
    }
    this.data.getPlaAlfaMunicipalitiesStatus().subscribe({
      next: status => {
        const principal = status.municipalities.find(m => m.isPrincipal) ?? status.municipalities[0];
        const level = principal ? (date === today ? principal.todayLevel : principal.tomorrowLevel) : null;
        if (level != null) {
          this.update('level', level);
          this.levelHint.set(`Nivell obtingut de ${principal!.municipality}.`);
        } else {
          this.levelHint.set('No s\'ha pogut obtenir el nivell.');
        }
      },
      error: () => this.levelHint.set('No s\'ha pogut obtenir el nivell.'),
    });
  }

  addOtherAdf(): void {
    this.update('otherAdfs', [...this.form().otherAdfs, { adf: '', vehicle: '', firstIntervention: false }]);
  }

  patchOtherAdf(index: number, patch: Partial<OtherAdfEntry>): void {
    this.update('otherAdfs', this.form().otherAdfs.map((e, i) => i === index ? { ...e, ...patch } : e));
  }

  removeOtherAdf(index: number): void {
    this.update('otherAdfs', this.form().otherAdfs.filter((_, i) => i !== index));
  }

  addBomber(): void {
    this.update('bombers', [...this.form().bombers, { vehicle: '', firstIntervention: false }]);
  }

  patchBomber(index: number, patch: Partial<BomberEntry>): void {
    this.update('bombers', this.form().bombers.map((e, i) => i === index ? { ...e, ...patch } : e));
  }

  removeBomber(index: number): void {
    this.update('bombers', this.form().bombers.filter((_, i) => i !== index));
  }

  save(): void {
    const f = this.form();
    if (!f.date) { this.error.set('La data és obligatòria.'); return; }
    this.saving.set(true);
    this.error.set('');
    const payload: IntervencioPayload = {
      ...f,
      ownGrocs: f.ownGrocs,
      ownVerds: f.ownVerds,
      customGrocs: 0,
      customVerds: 0,
      noticeTime: f.noticeTime || null,
      startTime: f.startTime || null,
      endTime: f.endTime || null,
      surface: f.surface === null || (f.surface as unknown) === '' ? null : Number(f.surface),
    };
    this.data.saveIntervencio(this.editing()?.id ?? null, payload).subscribe({
      next: () => { this.saving.set(false); this.closeForm(); this.reload(); },
      error: err => { this.saving.set(false); this.error.set(err?.error?.message ?? 'No s\'ha pogut desar la intervenció.'); },
    });
  }

  remove(id: number): void {
    this.data.deleteIntervencio(id).subscribe({
      next: () => { this.deleteConfirm.set(null); this.reload(); },
      error: err => this.error.set(err?.error?.message ?? 'No s\'ha pogut eliminar.'),
    });
  }

  private initMap(host: HTMLDivElement): void {
    const f = this.form();
    const has = f.latitude != null && f.longitude != null;
    this.map = L.map(host).setView(has ? [f.latitude!, f.longitude!] : DEFAULT_CENTER, has ? 15 : 8);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap',
    }).addTo(this.map);
    if (has) this.setMarker(f.latitude!, f.longitude!);
    this.map.on('click', (event: L.LeafletMouseEvent) => this.pick(event.latlng.lat, event.latlng.lng));
    setTimeout(() => this.map?.invalidateSize(), 150);
  }

  private setMarker(lat: number, lon: number): void {
    if (!this.map) return;
    this.marker?.remove();
    this.marker = L.circleMarker([lat, lon], { radius: 10, color: '#b42318', fillColor: '#ef4444', fillOpacity: 0.8 }).addTo(this.map);
  }

  private pick(lat: number, lon: number): void {
    const latitude = Number(lat.toFixed(6));
    const longitude = Number(lon.toFixed(6));
    this.setMarker(latitude, longitude);
    this.form.update(f => ({ ...f, latitude, longitude }));
    this.geocoding.set(true);
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1&accept-language=ca`;
    fetch(url)
      .then(response => response.json())
      .then(result => {
        const a = result?.address ?? {};
        this.form.update(f => ({
          ...f,
          municipality: a.city ?? a.town ?? a.village ?? a.municipality ?? null,
          sector: a.suburb ?? a.neighbourhood ?? a.quarter ?? null,
          comarca: a.county ?? null,
        }));
      })
      .catch(() => this.error.set('No s\'ha pogut obtenir l\'adreça del punt; pots omplir-la a mà.'))
      .finally(() => this.geocoding.set(false));
  }

  private destroyMap(): void {
    this.map?.remove();
    this.map = null;
    this.marker = null;
  }

  private emptyForm(): IntervencioPayload {
    return {
      convocatoriaId: null, responsableUserId: null, responsableName: null, responsableAdf: null,
      date: this.today(), noticeTime: null, startTime: null, endTime: null, level: null,
      latitude: null, longitude: null, municipality: null, sector: null, comarca: null,
      ownVehicles: [], otherAdfsAttended: false, otherAdfs: [], otherAdfsGrocs: 0, otherAdfsVerds: 0,
      bombersAttended: false, bombers: [], ownGrocs: 0, ownVerds: 0, customGrocs: 0, customVerds: 0,
      surface: null, typeIncendiId: null,
    };
  }

  private today(): string {
    return this.toDateValue(new Date());
  }

  private toDateValue(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  private dateOf(value: string): string {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? this.today() : this.toDateValue(parsed);
  }
}
