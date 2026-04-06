import { Component, ViewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from './services/auth.service';
import { LogsAccessService } from './services/logs-access.service';
import { PushNotificationsService } from './services/push-notifications.service';
import { ProfileComponent } from './pages/profile/profile.component';
import { SettingsComponent } from './pages/settings/settings.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, ProfileComponent, SettingsComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  @ViewChild(ProfileComponent) profileComponent?: ProfileComponent;
  @ViewChild(SettingsComponent) settingsComponent?: SettingsComponent;
  currentPath = '';
  notificationWarning = '';
  isMobileMenuOpen = false;

  constructor(
    public authService: AuthService,
    public logsAccessService: LogsAccessService,
    private router: Router,
    public pushNotificationsService: PushNotificationsService,
  ) {
    this.currentPath = this.router.url || '/'

    effect(() => {
      if (this.authService.isAuthenticated()) {
        this.logsAccessService.refresh()
        void this.handleHomeNotificationCheck()
      } else {
        this.logsAccessService.clear()
        this.notificationWarning = ''
      }
    })

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        const navEvent = event as NavigationEnd
        this.currentPath = navEvent.urlAfterRedirects
        this.isMobileMenuOpen = false
        void this.handleHomeNotificationCheck()
      })

      void this.handleHomeNotificationCheck()
  }

  goTo(path: string) {
    this.router.navigate([path]);
  }

  openProfileModal() {
    this.profileComponent?.openModal();
  }

  openSettingsModal(tab: 'device' | 'system' = 'device') {
    this.settingsComponent?.openModal(tab);
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu() {
    this.isMobileMenuOpen = false;
  }

  openProfileFromMenu() {
    this.openProfileModal();
    this.closeMobileMenu();
  }

  openSettingsFromMenu(tab: 'device' | 'system' = 'device') {
    this.openSettingsModal(tab);
    this.closeMobileMenu();
  }

  logoutFromMenu() {
    this.closeMobileMenu();
    this.authService.logout();
  }

  isHomeRoute() {
    return this.currentPath.startsWith('/home');
  }

  private async handleHomeNotificationCheck() {
    if (!this.authService.isLoggedIn()) {
      return
    }

    if (!this.isHomeRoute()) {
      try {
        await this.pushNotificationsService.syncState({ openModalIfNeeded: false })
      } catch {
        // ignore sync errors outside home
      }
      this.updateNotificationWarning()
      this.openNotificationSettingsIfNeeded()
      return
    }

    try {
      await this.pushNotificationsService.ensurePermissionAndDeviceOnHomeEntry()
    } catch {
      // ignore — updateNotificationWarning will reflect current state
    }
    this.updateNotificationWarning()
    this.openNotificationSettingsIfNeeded()
  }

  private updateNotificationWarning() {
    if (!this.isHomeRoute() || !this.authService.isLoggedIn()) {
      this.notificationWarning = ''
      return
    }

    const permission = this.pushNotificationsService.permission()

    if (permission === 'unsupported') {
      this.notificationWarning = ''
      return
    }

    if (permission === 'denied') {
      this.notificationWarning = 'Notificacions bloquejades al navegador. Activa-les a la configuració del lloc per rebre avisos.'
      return
    }

    if (permission !== 'granted') {
      this.notificationWarning = 'Has d\'acceptar permisos de notificació per rebre avisos de convocatòries.'
      return
    }

    if (!this.pushNotificationsService.isSupported()) {
      // Permission granted but FCM not supported — no token possible
      this.notificationWarning = ''
      return
    }

    if (!this.pushNotificationsService.hasRegisteredCurrentToken()) {
      this.notificationWarning = 'Aquest dispositiu encara no està registrat al servidor. Revisa-ho a Configuració.'
      return
    }

    this.notificationWarning = ''
  }

  private openNotificationSettingsIfNeeded() {
    if (!this.pushNotificationsService.modalVisible()) {
      return
    }

    setTimeout(() => {
      this.settingsComponent?.openModal('device')
    }, 0)
  }
}
