import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import {
  ConvoType,
  DataService,
  NotificationLog,
  NotificationSettings,
  PlaAlfaMunicipalityCatalogItem,
  PlaAlfaMunicipalityStatusItem,
  User,
} from '../../services/data.service';
import { PushNotificationsService } from '../../services/push-notifications.service';
import { NotificationsAdminComponent } from '../../modules/notifications/notifications-admin.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, NotificationsAdminComponent],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css',
})
export class SettingsComponent {
  showModal = signal(false);
  activeTab = signal<'device' | 'system' | 'orchestrator' | 'pla-alfa'>('device');
  deviceLoading = signal(false);
  adminLoading = signal(false);
  adminConfig = signal<NotificationSettings | null>(null);
  adminLogs = signal<NotificationLog[]>([]);
  adminUsers = signal<User[]>([]);
  adminConvoTypes = signal<ConvoType[]>([]);
  adminConfigError = signal('');
  adminLogsError = signal('');
  plaAlfaLoading = signal(false);
  plaAlfaSaving = signal(false);
  plaAlfaRefreshingStatus = signal(false);
  plaAlfaError = signal('');
  plaAlfaInfo = signal('');
  plaAlfaCatalog = signal<PlaAlfaMunicipalityCatalogItem[]>([]);
  plaAlfaSelected = signal<string[]>([]);
  plaAlfaStatus = signal<PlaAlfaMunicipalityStatusItem[]>([]);
  plaAlfaUpdatedAt = signal<string | null>(null);
  plaAlfaSearch = signal('');
  plaAlfaComarcaFilter = signal('all');

  constructor(
    public authService: AuthService,
    public pushNotificationsService: PushNotificationsService,
    private dataService: DataService,
  ) {}

  async openModal(tab: 'device' | 'system' | 'orchestrator' | 'pla-alfa' = 'device') {
    this.activeTab.set(this.authService.isAdmin() ? tab : 'device');
    this.showModal.set(true);
    document.body.classList.add('modal-open');
    this.deviceLoading.set(true);

    // Cargar configuración del sistema en paralelo (sin esperar al token del dispositivo)
    if (this.authService.isAdmin()) {
      this.loadAdminData();
      this.loadPlaAlfaData();
    }

    try {
      await this.pushNotificationsService.syncState({ openModalIfNeeded: false });
    } catch {
      // Keep modal open even if device sync fails.
    } finally {
      this.deviceLoading.set(false);
    }
  }

  closeModal() {
    this.showModal.set(false);
    this.pushNotificationsService.closeSetupModal();
    document.body.classList.remove('modal-open');
  }

  setActiveTab(tab: 'device' | 'system' | 'orchestrator' | 'pla-alfa') {
    if (tab === 'system' && !this.authService.isAdmin()) {
      return;
    }

    if (tab === 'orchestrator' && !this.authService.isAdmin()) {
      return;
    }

    if (tab === 'pla-alfa' && !this.authService.isAdmin()) {
      return;
    }

    this.activeTab.set(tab);

    if (tab === 'system' && this.authService.isAdmin() && !this.adminConfig() && !this.adminLoading()) {
      this.loadAdminData();
    }

    if (tab === 'pla-alfa' && this.authService.isAdmin() && !this.plaAlfaCatalog().length && !this.plaAlfaLoading()) {
      this.loadPlaAlfaData();
    }

  }

  async activateNotifications() {
    await this.pushNotificationsService.requestPermissionAndRegister();
  }

  loadNotificationLogs() {
    if (!this.authService.isAdmin()) {
      return;
    }

    this.adminLogsError.set('');
    this.dataService.getNotificationLogs(30).subscribe({
      next: (logs) => this.adminLogs.set(logs),
      error: (err) => this.adminLogsError.set(err.message || 'Error en carregar el registre de notificacions.'),
    });
  }

  private loadAdminData() {
    this.adminLoading.set(true);
    this.adminConfigError.set('');
    this.adminLogsError.set('');


    // Cargar tipos de convocatorias (debería ser instantáneo)
    this.dataService.getConvoTypes().subscribe({
      next: (convoTypes) => {
        this.adminConvoTypes.set(convoTypes);
      },
      error: (err) => {
        console.error('Error cargando tipos de convocatorias:', err);
      },
    });

    // Cargar usuarios (debería ser rápido)
    this.dataService.getUsers().subscribe({
      next: (users) => {
        this.adminUsers.set(users);
      },
      error: (err) => {
        console.error('Error cargando usuarios:', err);
      },
    });

    // Cargar configuración
    this.dataService.getNotificationConfig().subscribe({
      next: (config) => {
        this.adminConfig.set(config);
        this.adminLoading.set(false);
      },
      error: (err) => {
        this.adminConfigError.set(err.message || 'No s\'ha pogut carregar la configuració.');
        this.adminLoading.set(false);
      },
    });

    // Cargar logs
    this.dataService.getNotificationLogs(30).subscribe({
      next: (logs) => this.adminLogs.set(logs),
      error: (err) => this.adminLogsError.set(err.message || 'Error en carregar el registre de notificacions.'),
    });
  }

  loadPlaAlfaData() {
    if (!this.authService.isAdmin()) {
      return;
    }

    this.plaAlfaLoading.set(true);
    this.plaAlfaError.set('');
    this.plaAlfaInfo.set('');

    this.dataService.getPlaAlfaCatalog().subscribe({
      next: (response) => {
        this.plaAlfaCatalog.set(response.municipalities || []);
        this.plaAlfaSelected.set(response.selectedMunicipalities || []);
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
    this.plaAlfaInfo.set('');
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
      return 'Sense nivell';
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
      return 'pla-alfa-level-5';
    }

    return `pla-alfa-level-${level}`;
  }

  savePlaAlfaSelection() {
    if (!this.authService.isAdmin()) {
      return;
    }

    this.plaAlfaSaving.set(true);
    this.plaAlfaError.set('');
    this.plaAlfaInfo.set('');

    this.dataService.updatePlaAlfaMunicipalities(this.plaAlfaSelected()).subscribe({
      next: () => {
        this.plaAlfaSaving.set(false);
        this.plaAlfaInfo.set('Municipis de Pla Alfa actualitzats correctament.');
        this.refreshPlaAlfaStatus();
      },
      error: (err) => {
        this.plaAlfaSaving.set(false);
        this.plaAlfaError.set(err.message || 'No s\'ha pogut desar la selecció de municipis.');
      },
    });
  }

  refreshPlaAlfaStatus() {
    this.plaAlfaRefreshingStatus.set(true);

    this.dataService.getPlaAlfaMunicipalitiesStatus().subscribe({
      next: (response) => {
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
}