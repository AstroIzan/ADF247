import { Component, ViewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
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

  constructor(
    public authService: AuthService,
    private router: Router,
    private pushNotificationsService: PushNotificationsService,
  ) {
    effect(() => {
      if (this.authService.isAuthenticated()) {
        void this.pushNotificationsService.initAndSyncToken()
      }
    })
  }

  goTo(path: string) {
    this.router.navigate([path]);
  }

  openProfileModal() {
    this.profileComponent?.openModal();
  }
}
