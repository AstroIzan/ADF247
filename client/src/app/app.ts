import { Component, ViewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from './services/auth.service';
import { PushNotificationsService } from './services/push-notifications.service';
import { ProfileComponent } from './pages/profile/profile.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, ProfileComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  @ViewChild(ProfileComponent) profileComponent?: ProfileComponent;
  currentPath = '';
  notificationWarning = '';

  constructor(
    public authService: AuthService,
    private router: Router,
    public pushNotificationsService: PushNotificationsService,
  ) {
    this.currentPath = this.router.url || '/'

    effect(() => {
      if (this.authService.isAuthenticated()) {
        void this.handleHomeNotificationCheck()
      } else {
        this.notificationWarning = ''
      }
    })

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        const navEvent = event as NavigationEnd
        this.currentPath = navEvent.urlAfterRedirects
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

  closeNotificationsSetup() {
    this.pushNotificationsService.closeSetupModal();
  }

  async requestNotificationPermissions() {
    await this.pushNotificationsService.requestPermissionAndRegister();
    this.updateNotificationWarning();
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
      return
    }

    try {
      await this.pushNotificationsService.ensurePermissionAndDeviceOnHomeEntry()
    } catch {
      // ignore — updateNotificationWarning will reflect current state
    }
    this.updateNotificationWarning()
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
      this.notificationWarning = 'Aquest dispositiu encara no està registrat al servidor. Torna a entrar a les notificacions.'
      return
    }

    this.notificationWarning = ''
  }
}
