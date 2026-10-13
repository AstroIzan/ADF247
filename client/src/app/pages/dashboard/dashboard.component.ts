import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import {
  DataService,
  User,
  Convocatoria,
  ConvoType,
  Respuesta,
  UserHoursSummaryRow,
  CampaignFormRecord,
} from '../../services/data.service';
import { UsersModule } from '../../modules/users/users.module';
import { ConvosModule } from '../../modules/convos/convos.module';
import { DispoModule } from '../../modules/dispo/dispo.module';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, UsersModule, ConvosModule, DispoModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  activeTab = signal<string>('users');
  username = signal<string>('');
  isAdmin = signal(false);
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

  // Hours summary data
  userHoursSummaryRows = signal<UserHoursSummaryRow[]>([]);
  loadingUserHoursSummary = signal(false);
  userHoursSummaryError = signal('');

  // Campaign forms data
  campaignForms = signal<CampaignFormRecord[]>([]);
  loadingCampaignForms = signal(false);
  campaignFormsError = signal('');
  campaignFormsExpandedIds = signal<number[]>([]);
  campaignFormToDelete = signal<CampaignFormRecord | null>(null);
  deletingCampaignForm = signal(false);

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
      this.loadUserHoursSummary();
      this.loadCampaignForms();
    }
  }

  loadCampaignForms() {
    this.loadingCampaignForms.set(true);
    this.campaignFormsError.set('');
    this.campaignFormsExpandedIds.set([]);
    this.campaignFormToDelete.set(null);

    this.dataService.getCampaignForms().subscribe({
      next: (rows) => {
        this.campaignForms.set(Array.isArray(rows) ? rows : []);
        this.loadingCampaignForms.set(false);
      },
      error: (err) => {
        this.campaignForms.set([]);
        this.campaignFormsError.set(err.message || 'No s\'han pogut carregar els formularis de campanya.');
        this.loadingCampaignForms.set(false);
      }
    });
  }

  toggleCampaignFormDetails(formId: number) {
    const current = new Set(this.campaignFormsExpandedIds());
    if (current.has(formId)) {
      current.delete(formId);
    } else {
      current.add(formId);
    }

    this.campaignFormsExpandedIds.set(Array.from(current));
  }

  isCampaignFormDetailsOpen(formId: number) {
    return this.campaignFormsExpandedIds().includes(formId);
  }

  requestCampaignFormDelete(form: CampaignFormRecord) {
    this.campaignFormToDelete.set(form);
  }

  cancelCampaignFormDelete() {
    if (this.deletingCampaignForm()) {
      return;
    }

    this.campaignFormToDelete.set(null);
  }

  confirmCampaignFormDelete() {
    const target = this.campaignFormToDelete();
    if (!target || this.deletingCampaignForm()) {
      return;
    }

    this.deletingCampaignForm.set(true);
    this.campaignFormsError.set('');

    this.dataService.deleteCampaignForm(target.id).subscribe({
      next: () => {
        const nextRows = this.campaignForms().filter((row) => row.id !== target.id);
        this.campaignForms.set(nextRows);
        this.campaignFormsExpandedIds.set(this.campaignFormsExpandedIds().filter((id) => id !== target.id));
        this.deletingCampaignForm.set(false);
        this.campaignFormToDelete.set(null);
      },
      error: (err) => {
        this.deletingCampaignForm.set(false);
        this.campaignFormsError.set(err.message || 'No s\'ha pogut eliminar el formulari de campanya.');
      }
    });
  }

  getUserLabelById(userId: number) {
    const user = this.users().find((item) => item.id === userId);
    if (!user) {
      return String(userId);
    }

    return `${user.nCarnet} - ${user.name} ${user.lastName || ''}`.trim();
  }

  getCampaignFormVolunteerLabels(form: CampaignFormRecord) {
    return (form.voluntaris || []).map((userId) => this.getUserLabelById(userId));
  }

  getCampaignFormVehicleConductorLabel(vehicle: CampaignFormRecord['vehicles'][number]) {
    if (vehicle.conductorUserId == null) {
      return 'Sense conductor';
    }

    return this.getUserLabelById(vehicle.conductorUserId);
  }

  getCampaignFormVehicleVolunteerLabels(vehicle: CampaignFormRecord['vehicles'][number]) {
    return (vehicle.volunteerUserIds || []).map((userId) => this.getUserLabelById(userId));
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

  loadUserHoursSummary() {
    this.loadingUserHoursSummary.set(true);
    this.userHoursSummaryError.set('');

    this.dataService.getHoursSummary().subscribe({
      next: (summary) => {
        this.userHoursSummaryRows.set(Array.isArray(summary?.users) ? summary.users : []);
        this.loadingUserHoursSummary.set(false);
      },
      error: (err) => {
        this.userHoursSummaryRows.set([]);
        this.userHoursSummaryError.set(err.message || 'No s\'ha pogut carregar el resum d\'hores.');
        this.loadingUserHoursSummary.set(false);
      }
    });
  }

  onUserChanged() {
    this.loadUsers();
    if (this.isAdmin()) {
      this.loadUserHoursSummary();
    }
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

  logout() {
    this.authService.logout();
  }
}
