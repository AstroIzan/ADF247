import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { PushNotificationsService } from '../../services/push-notifications.service';
import { DataService, MessagingNotificationLog, TaskExecutionLog } from '../../services/data.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css',
})
export class SettingsComponent {
  showModal = signal(false);
  activeTab = signal<'device' | 'messaging' | 'tasks'>('device');
  deviceLoading = signal(false);
  adminLoading = signal(false);
  adminError = signal('');
  notificationLogs = signal<MessagingNotificationLog[]>([]);
  taskExecutions = signal<TaskExecutionLog[]>([]);

  constructor(
    public authService: AuthService,
    public pushNotificationsService: PushNotificationsService,
    private dataService: DataService,
  ) {}

  async openModal(tab: 'device' | 'messaging' | 'tasks' = 'device') {
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

  setActiveTab(tab: 'device' | 'messaging' | 'tasks') {
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
      if (completed === 2) this.adminLoading.set(false);
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
  }
}