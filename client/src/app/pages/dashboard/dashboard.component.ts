import { Component, signal, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { DataService, User, Convocatoria, ConvoType, Respuesta, DeviceTokenAdmin, NotificationSettings, NotificationLog } from '../../services/data.service';
import { UsersModule } from '../../modules/users/users.module';
import { ConvosModule } from '../../modules/convos/convos.module';
import { DispoModule } from '../../modules/dispo/dispo.module';
import { NotificationsModule } from '../../modules/notifications/notifications.module';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, UsersModule, ConvosModule, DispoModule, NotificationsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  activeTab = signal<string>('users');
  username = signal<string>('');
  isAdmin = signal(false);
  adminActionLoading = signal(false);
  adminActionMessage = signal('');

  // Users data
  users = signal<User[]>([]);
  loadingUsers = signal(false);
  userError = signal('');

  // Convos data
  convocatorias = signal<Convocatoria[]>([]);
  convoTypes = signal<ConvoType[]>([]);
  loadingConvos = signal(false);
  convoError = signal('');

  // Respuestas data
  respuestas = signal<Respuesta[]>([]);
  loadingRespuestas = signal(false);
  respuestaError = signal('');

  // Devices data
  devices = signal<DeviceTokenAdmin[]>([]);
  loadingDevices = signal(false);
  deviceError = signal('');

  // Notifications data
  notificationConfig = signal<NotificationSettings | null>(null);
  notificationLogs = signal<NotificationLog[]>([]);
  loadingNotifConfig = signal(false);
  loadingNotifLogs = signal(false);
  notifConfigError = signal('');
  notifLogsError = signal('');
  firebaseConfigured = signal(true);
  firebaseHealthMessage = signal('');

  constructor(
    private authService: AuthService,
    private dataService: DataService,
    private router: Router
  ) {
    // Verificar autenticación al entrar
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.username.set(currentUser.name);
    }

    this.isAdmin.set(this.authService.isAdmin());
  }

  ngOnInit() {
    // Verificar que sigue siendo válida la sesión
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    
    this.loadAllData();
  }

  loadAllData() {
    this.loadUsers();
    this.loadConvocatorias();
    this.loadConvoTypes();
    this.loadRespuestas();
    if (this.isAdmin()) {
      this.loadDevices();
      this.loadNotificationConfig();
      this.loadNotificationLogs();
      this.loadHealthStatus();
    }
  }

  loadHealthStatus() {
    this.dataService.getHealthStatus().subscribe({
      next: (health) => {
        const firebase = health?.dependencies?.firebase;
        this.firebaseConfigured.set(Boolean(firebase?.configured));
        this.firebaseHealthMessage.set(firebase?.message || 'Firebase no configurat.');
      },
      error: (err) => {
        this.firebaseConfigured.set(false);
        this.firebaseHealthMessage.set(err.message || 'No s\'ha pogut validar l\'estat de Firebase.');
      }
    });
  }

  loadUsers() {
    this.loadingUsers.set(true);
    this.userError.set('');
    this.dataService.getUsers().subscribe({
      next: (data) => {
        this.users.set(data);
        this.loadingUsers.set(false);
      },
      error: (err) => {
        this.userError.set(err.message);
        this.loadingUsers.set(false);
      }
    });
  }

  loadConvocatorias() {
    this.loadingConvos.set(true);
    this.convoError.set('');
    this.dataService.getConvocatorias().subscribe({
      next: (data) => {
        this.convocatorias.set(data);
        this.loadingConvos.set(false);
      },
      error: (err) => {
        this.convoError.set(err.message);
        this.loadingConvos.set(false);
      }
    });
  }

  loadConvoTypes() {
    this.dataService.getConvoTypes().subscribe({
      next: (data) => {
        this.convoTypes.set(data);
      },
      error: (err) => {
        console.error('Error loading convo types:', err);
      }
    });
  }

  loadRespuestas() {
    this.loadingRespuestas.set(true);
    this.respuestaError.set('');
    this.dataService.getRespuestas().subscribe({
      next: (data) => {
        this.respuestas.set(data);
        this.loadingRespuestas.set(false);
      },
      error: (err) => {
        this.respuestaError.set(err.message);
        this.loadingRespuestas.set(false);
      }
    });
  }

  loadDevices() {
    this.loadingDevices.set(true);
    this.deviceError.set('');
    this.dataService.getAllDeviceTokens().subscribe({
      next: (data) => {
        this.devices.set(data);
        this.loadingDevices.set(false);
      },
      error: (err) => {
        this.deviceError.set(err.message);
        this.loadingDevices.set(false);
      }
    });
  }

  loadNotificationConfig() {
    this.loadingNotifConfig.set(true);
    this.notifConfigError.set('');
    this.dataService.getNotificationConfig().subscribe({
      next: (data) => {
        this.notificationConfig.set(data);
        this.loadingNotifConfig.set(false);
      },
      error: (err) => {
        this.notifConfigError.set(err.message);
        this.loadingNotifConfig.set(false);
      }
    });
  }

  loadNotificationLogs() {
    this.loadingNotifLogs.set(true);
    this.notifLogsError.set('');
    this.dataService.getNotificationLogs(30).subscribe({
      next: (data) => {
        this.notificationLogs.set(data);
        this.loadingNotifLogs.set(false);
      },
      error: (err) => {
        this.notificationLogs.set([]);
        this.notifLogsError.set(err.message || 'Error en carregar el registre de notificacions.');
        this.loadingNotifLogs.set(false);
      }
    });
  }

  onUserChanged() {
    this.loadUsers();
  }

  onConvoChanged(convo: any) {
    // Si convo es null, es un delete, hacer reload completo
    if (!convo) {
      this.loadConvocatorias();
      this.loadConvoTypes();
      return;
    }

    // Para update/create, actualizar el array local
    const currentConvos = this.convocatorias();
    const existingIndex = currentConvos.findIndex(c => c.id === convo.id);

    if (existingIndex >= 0) {
      // Es un update, reemplazar en el array
      const updated = [...currentConvos];
      updated[existingIndex] = convo;
      this.convocatorias.set(updated);
    } else {
      // Es un create, añadir al inicio
      this.convocatorias.set([convo, ...currentConvos]);
    }
  }

  onRespuestaChanged() {
    this.loadRespuestas();
  }

  runAdminAction(action: 'pending' | 'sortida' | 'weekly' | 'automation') {
    if (!this.isAdmin()) {
      return;
    }

    this.adminActionLoading.set(true);
    this.adminActionMessage.set('');

    const request = action === 'pending'
      ? this.dataService.sendPendingResponsesReminder()
      : action === 'sortida'
        ? this.dataService.sendTomorrowSortidaNotifications()
        : action === 'weekly'
          ? this.dataService.sendWeeklyResponseDigest()
          : this.dataService.runNotificationAutomation();

    request.subscribe({
      next: (result: any) => {
        this.adminActionLoading.set(false);
        this.adminActionMessage.set(this.getAdminActionSuccessMessage(action, result));
      },
      error: (err) => {
        this.adminActionLoading.set(false);
        this.adminActionMessage.set(`Error: ${err.message}`);
      }
    });
  }

  private getAdminActionSuccessMessage(action: 'pending' | 'sortida' | 'weekly' | 'automation', result?: any) {
    if (action === 'pending') {
      const targeted = Number(result?.targetedUsers || 0);
      if (targeted === 0) {
        return 'No hi ha usuaris amb pendents per avisar.';
      }

      const notifications = Array.isArray(result?.notifications) ? result.notifications : [];
      const delivered = notifications.reduce((acc: number, item: any) => acc + Number(item?.successCount || 0), 0);
      const failed = notifications.reduce((acc: number, item: any) => acc + Number(item?.failureCount || 0), 0);
      const noTargets = notifications.reduce(
        (acc: number, item: any) => acc + (item?.status === 'no-targets' ? 1 : 0),
        0
      );

      if (delivered === 0 && failed > 0) {
        return `S'ha intentat avisar ${targeted} usuari(s), però no s'ha entregat cap notificació.`;
      }

      if (delivered === 0 && failed === 0 && noTargets > 0) {
        return `Hi ha ${targeted} usuaris amb pendents però cap d'ells té dispositiu registrat actiu.`;
      }

      return `Recordatori enviat: ${delivered} entregades, ${failed} fallides (${targeted} amb pendents).`;
    }

    if (action === 'sortida') {
      const count = Number(result?.notificationCount || 0);
      if (count === 0) {
        return 'No hi ha convocatòries de sortida per notificar en el rang configurat.';
      }
      return `Notificacions de sortida enviades (${count}).`;
    }

    if (action === 'weekly') {
      if (result?.skipped) {
        return `Resum setmanal omès: ${result.reason || 'sense acció'}.`;
      }

      const delivered = Number(result?.notification?.successCount || 0);
      const failed = Number(result?.notification?.failureCount || 0);
      const targeted = Number(result?.targetedUsers || 0);

      if (targeted === 0) {
        return 'No hi ha usuaris pendents per al resum setmanal.';
      }

      if (delivered === 0 && failed > 0) {
        return `S'ha intentat enviar el resum setmanal a ${targeted} usuari(s), però cap notificació s'ha entregat.`;
      }

      return `Resum setmanal: ${delivered} entregades, ${failed} fallides (${targeted} destinataris).`;
    }

    if (result?.sortidaSummary || result?.weeklySummary || result?.pendingSummary) {
      return 'Automatització executada. Revisa Registre per al detall.';
    }

    return 'Automatització executada.';
  }

  logout() {
    this.authService.logout();
  }
}
