import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { PushNotificationsService } from '../../services/push-notifications.service';
import { ConvoType, DataService, MessagingConfiguration, MessagingNotificationLog, MessagingSystemStatus, SystemConfiguration, SystemConfigurationVehicle, TaskExecutionLog, User } from '../../services/data.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css',
})
export class SettingsComponent {
  showModal = signal(false);
  activeTab = signal<'device' | 'system' | 'configurations' | 'messaging' | 'tasks'>('device');
  deviceLoading = signal(false);
  adminLoading = signal(false);
  adminError = signal('');
  notificationLogs = signal<MessagingNotificationLog[]>([]);
  taskExecutions = signal<TaskExecutionLog[]>([]);
  configurations = signal<MessagingConfiguration[]>([]);
  systemStatus = signal<MessagingSystemStatus | null>(null);
  systemConfiguration = signal<SystemConfiguration | null>(null);
  systemConfigurationSaving = signal(false);
  systemConvoTypes = signal<ConvoType[]>([]);
  systemUsers = signal<User[]>([]);
  newVehicle = signal<SystemConfigurationVehicle>({ indicatiu: '', modelo: '', kms: 0 });

  constructor(
    public authService: AuthService,
    public pushNotificationsService: PushNotificationsService,
    private dataService: DataService,
  ) {}

  async openModal(tab: 'device' | 'system' | 'configurations' | 'messaging' | 'tasks' = 'device') {
    this.activeTab.set(this.authService.isAdmin() ? tab : 'device');
    this.showModal.set(true);
    document.body.classList.add('modal-open');
    this.deviceLoading.set(true);
    if (this.authService.isAdmin()) this.loadAdminData();

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

  setActiveTab(tab: 'device' | 'system' | 'configurations' | 'messaging' | 'tasks') {
    if (tab !== 'device' && !this.authService.isAdmin()) return;
    this.activeTab.set(tab);
    if (tab !== 'device' && !this.adminLoading() && this.notificationLogs().length === 0 && this.taskExecutions().length === 0) {
      this.loadAdminData();
    }
  }

  async activateNotifications() {
    await this.pushNotificationsService.requestPermissionAndRegister();
  }

  loadAdminData() {
    if (!this.authService.isAdmin()) return;
    this.adminLoading.set(true);
    this.adminError.set('');
    let completed = 0;
    const complete = () => {
      completed++;
      if (completed === 7) this.adminLoading.set(false);
    };

    this.dataService.getMessagingSystemStatus().subscribe({
      next: (status) => {
        this.systemStatus.set(status);
        complete();
      },
      error: (error) => {
        this.adminError.set(error.message || 'No s’ha pogut carregar l’estat del sistema.');
        complete();
      },
    });
    this.dataService.getMessagingLogs().subscribe({
      next: (logs) => {
        this.notificationLogs.set(logs);
        complete();
      },
      error: (error) => {
        this.adminError.set(error.message || 'No s’han pogut carregar els registres de notificacions.');
        complete();
      },
    });
    this.dataService.getTaskExecutions().subscribe({
      next: (executions) => {
        this.taskExecutions.set(executions);
        complete();
      },
      error: (error) => {
        this.adminError.set(error.message || 'No s’han pogut carregar les execucions.');
        complete();
      },
    });
    this.dataService.getMessagingConfigurations().subscribe({
      next: (configurations) => {
        this.configurations.set(configurations);
        complete();
      },
      error: (error) => {
        this.adminError.set(error.message || 'No s’han pogut carregar les configuracions.');
        complete();
      },
    });
    this.dataService.getSystemConfiguration().subscribe({
      next: (configuration) => {
        this.systemConfiguration.set(configuration);
        complete();
      },
      error: (error) => {
        this.adminError.set(error.message || 'No s’ha pogut carregar la configuració del sistema.');
        complete();
      },
    });
    this.dataService.getConvoTypes().subscribe({
      next: (types) => {
        this.systemConvoTypes.set(types);
        complete();
      },
      error: (error) => {
        this.adminError.set(error.message || 'No s’han pogut carregar els tipus de convocatòria.');
        complete();
      },
    });
    this.dataService.getUsers().subscribe({
      next: (users) => {
        this.systemUsers.set(users);
        complete();
      },
      error: (error) => {
        this.adminError.set(error.message || 'No s’han pogut carregar els usuaris.');
        complete();
      },
    });
  }

  toggleConfiguration(configuration: MessagingConfiguration) {
    const updated = { ...configuration, enabled: !configuration.enabled };
    this.adminError.set('');
    this.dataService.updateMessagingConfiguration(updated).subscribe({
      next: (saved) => this.configurations.set(this.configurations().map((item) => item.id === saved.id ? saved : item)),
      error: (error) => this.adminError.set(error.message || 'No s’ha pogut actualitzar la configuració.'),
    });
  }

  isWeeklyTypeSelected(typeId: number) {
    return this.systemConfiguration()?.weeklyConvoTypeIds.includes(typeId) ?? false;
  }

  toggleWeeklyType(typeId: number, selected: boolean) {
    this.updateSystemConfiguration((configuration) => ({
      ...configuration,
      weeklyConvoTypeIds: selected
        ? [...new Set([...configuration.weeklyConvoTypeIds, typeId])]
        : configuration.weeklyConvoTypeIds.filter((id) => id !== typeId),
    }));
  }

  isAvailabilityManagerSelected(nCarnet: string) {
    return this.systemConfiguration()?.availabilityManagerNCarnets.includes(nCarnet) ?? false;
  }

  toggleAvailabilityManager(nCarnet: string, selected: boolean) {
    this.updateSystemConfiguration((configuration) => ({
      ...configuration,
      availabilityManagerNCarnets: selected
        ? [...new Set([...configuration.availabilityManagerNCarnets, nCarnet])]
        : configuration.availabilityManagerNCarnets.filter((value) => value !== nCarnet),
    }));
  }

  getAdminUsers() {
    return this.systemUsers().filter((user) => user.isActive && user.roles.isAdmin);
  }

  addVehicle() {
    const vehicle = this.newVehicle();
    if (!vehicle.indicatiu.trim()) {
      this.adminError.set('L’indicatiu del vehicle és obligatori.');
      return;
    }

    this.updateSystemConfiguration((configuration) => ({
      ...configuration,
      vehicleCatalog: [...configuration.vehicleCatalog, {
        indicatiu: vehicle.indicatiu.trim(),
        modelo: vehicle.modelo?.trim() || null,
        kms: Number(vehicle.kms) || 0,
      }],
    }));
    this.newVehicle.set({ indicatiu: '', modelo: '', kms: 0 });
  }

  removeVehicle(indicatiu: string) {
    this.updateSystemConfiguration((configuration) => ({
      ...configuration,
      vehicleCatalog: configuration.vehicleCatalog.filter((vehicle) => vehicle.indicatiu !== indicatiu),
    }));
  }

  saveSystemConfiguration() {
    const configuration = this.systemConfiguration();
    if (!configuration || this.systemConfigurationSaving()) return;
    this.systemConfigurationSaving.set(true);
    this.adminError.set('');
    const { updatedAt: _, ...request } = configuration;
    this.dataService.updateSystemConfiguration(request).subscribe({
      next: (saved) => {
        this.systemConfiguration.set(saved);
        this.systemConfigurationSaving.set(false);
      },
      error: (error) => {
        this.adminError.set(error.error?.message || error.message || 'No s’ha pogut desar la configuració del sistema.');
        this.systemConfigurationSaving.set(false);
      },
    });
  }

  private updateSystemConfiguration(update: (configuration: SystemConfiguration) => SystemConfiguration) {
    const configuration = this.systemConfiguration();
    if (configuration) {
      this.systemConfiguration.set(update(configuration));
    }
  }
}