import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { PushNotificationsService } from '../../services/push-notifications.service';
import { DataService, MessagingConfiguration, MessagingNotificationLog, TaskExecutionLog } from '../../services/data.service';

type NotificationTab = 'device' | 'configurations' | 'messaging' | 'tasks';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css',
})
export class SettingsComponent {
  showModal = signal(false);
  activeTab = signal<NotificationTab>('device');
  deviceLoading = signal(false);
  adminLoading = signal(false);
  adminError = signal('');
  notificationLogs = signal<MessagingNotificationLog[]>([]);
  taskExecutions = signal<TaskExecutionLog[]>([]);
  configurations = signal<MessagingConfiguration[]>([]);

  constructor(
    public authService: AuthService,
    public pushNotificationsService: PushNotificationsService,
    private dataService: DataService,
  ) {}

  async openModal(tab: NotificationTab = 'device') {
    this.activeTab.set(this.authService.isAdmin() ? tab : 'device');
    this.showModal.set(true);
    document.body.classList.add('modal-open');
    this.deviceLoading.set(true);
    if (this.authService.isAdmin()) this.loadAdminData();

    try {
      await this.pushNotificationsService.syncState({ openModalIfNeeded: false });
    } catch {
      // Keep the notification modal available when synchronization fails.
    } finally {
      this.deviceLoading.set(false);
    }
  }

  closeModal() {
    this.showModal.set(false);
    this.pushNotificationsService.closeSetupModal();
    document.body.classList.remove('modal-open');
  }

  setActiveTab(tab: NotificationTab) {
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
    let pending = 3;
    const complete = () => {
      pending--;
      if (pending === 0) this.adminLoading.set(false);
    };

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
  }

  toggleConfiguration(configuration: MessagingConfiguration) {
    const updated = { ...configuration, enabled: !configuration.enabled };
    this.adminError.set('');
    this.dataService.updateMessagingConfiguration(updated).subscribe({
      next: (saved) => this.configurations.set(this.configurations().map((item) => item.id === saved.id ? saved : item)),
      error: (error) => this.adminError.set(error.message || 'No s’ha pogut actualitzar la configuració.'),
    });
  }
}
