import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { PushNotificationsService } from '../../services/push-notifications.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css',
})
export class SettingsComponent {
  showModal = signal(false);
  activeTab = signal<'device'>('device');
  deviceLoading = signal(false);

  constructor(
    public authService: AuthService,
    public pushNotificationsService: PushNotificationsService,
  ) {}

  async openModal(tab: 'device' = 'device') {
    this.activeTab.set(tab);
    this.showModal.set(true);
    document.body.classList.add('modal-open');
    this.deviceLoading.set(true);

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

  setActiveTab(tab: 'device') {
    this.activeTab.set(tab);
  }

  async activateNotifications() {
    await this.pushNotificationsService.requestPermissionAndRegister();
  }

}