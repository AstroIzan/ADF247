import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import {
  ConvoType,
  DataService,
  NotificationLog,
  NotificationSettings,
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
  activeTab = signal<'device' | 'system' | 'orchestrator'>('device');
  deviceLoading = signal(false);
  adminLoading = signal(false);
  adminConfig = signal<NotificationSettings | null>(null);
  adminLogs = signal<NotificationLog[]>([]);
  adminUsers = signal<User[]>([]);
  adminConvoTypes = signal<ConvoType[]>([]);
  adminConfigError = signal('');
  adminLogsError = signal('');

  constructor(
    public authService: AuthService,
    public pushNotificationsService: PushNotificationsService,
    private dataService: DataService,
  ) {}

  async openModal(tab: 'device' | 'system' | 'orchestrator' = 'device') {
    this.activeTab.set(this.authService.isAdmin() ? tab : 'device');
    this.showModal.set(true);
    document.body.classList.add('modal-open');
    this.deviceLoading.set(true);

    // Cargar configuración del sistema en paralelo (sin esperar al token del dispositivo)
    if (this.authService.isAdmin()) {
      this.loadAdminData();
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

  setActiveTab(tab: 'device' | 'system' | 'orchestrator') {
    if (tab === 'system' && !this.authService.isAdmin()) {
      return;
    }

    this.activeTab.set(tab);

    if (tab === 'system' && this.authService.isAdmin() && !this.adminConfig() && !this.adminLoading()) {
      this.loadAdminData();
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
}