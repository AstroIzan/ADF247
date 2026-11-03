import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CampaignFormRecord, DataService, User } from '../../services/data.service';

@Component({
  selector: 'app-campaign-forms',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './campaign-forms.component.html',
  styleUrl: './campaign-forms.component.css',
})
export class CampaignFormsComponent implements OnInit {
  campaignForms = signal<CampaignFormRecord[]>([]);
  users = signal<User[]>([]);
  loadingCampaignForms = signal(false);
  campaignFormsError = signal('');
  campaignFormsExpandedIds = signal<number[]>([]);
  campaignFormToDelete = signal<CampaignFormRecord | null>(null);
  deletingCampaignForm = signal(false);

  constructor(private dataService: DataService) {}

  ngOnInit() {
    this.dataService.getUsers().subscribe({ next: (users) => this.users.set(users), error: () => undefined });
    this.loadCampaignForms();
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
      },
    });
  }

  toggleCampaignFormDetails(formId: number) {
    const current = new Set(this.campaignFormsExpandedIds());
    if (current.has(formId)) current.delete(formId);
    else current.add(formId);
    this.campaignFormsExpandedIds.set(Array.from(current));
  }

  isCampaignFormDetailsOpen(formId: number) {
    return this.campaignFormsExpandedIds().includes(formId);
  }

  requestCampaignFormDelete(form: CampaignFormRecord) {
    this.campaignFormToDelete.set(form);
  }

  cancelCampaignFormDelete() {
    if (this.deletingCampaignForm()) return;
    this.campaignFormToDelete.set(null);
  }

  confirmCampaignFormDelete() {
    const target = this.campaignFormToDelete();
    if (!target || this.deletingCampaignForm()) return;

    this.deletingCampaignForm.set(true);
    this.campaignFormsError.set('');

    this.dataService.deleteCampaignForm(target.id).subscribe({
      next: () => {
        this.campaignForms.set(this.campaignForms().filter((row) => row.id !== target.id));
        this.campaignFormsExpandedIds.set(this.campaignFormsExpandedIds().filter((id) => id !== target.id));
        this.deletingCampaignForm.set(false);
        this.campaignFormToDelete.set(null);
      },
      error: (err) => {
        this.deletingCampaignForm.set(false);
        this.campaignFormsError.set(err.message || 'No s\'ha pogut eliminar el formulari de campanya.');
      },
    });
  }

  getUserLabelById(userId: number) {
    const user = this.users().find((item) => item.id === userId);
    return user ? `${user.nCarnet} - ${user.name} ${user.lastName || ''}`.trim() : String(userId);
  }

  getCampaignFormVolunteerLabels(form: CampaignFormRecord) {
    return (form.voluntaris || []).map((userId) => this.getUserLabelById(userId));
  }

  getCampaignFormVehicleConductorLabel(vehicle: CampaignFormRecord['vehicles'][number]) {
    return vehicle.conductorUserId == null ? 'Sense conductor' : this.getUserLabelById(vehicle.conductorUserId);
  }

  getCampaignFormVehicleVolunteerLabels(vehicle: CampaignFormRecord['vehicles'][number]) {
    return (vehicle.volunteerUserIds || []).map((userId) => this.getUserLabelById(userId));
  }

  getResponsableLabel(form: CampaignFormRecord) {
    if (form.responsableId) return this.getUserLabelById(form.responsableId);
    return form.responsableNCarnet || '-';
  }

  getVehicleCrew(form: CampaignFormRecord, vehicle: CampaignFormRecord['vehicles'][number]) {
    const ids = Array.from(new Set([
      ...(vehicle.conductorUserId != null ? [vehicle.conductorUserId] : []),
      ...(vehicle.volunteerUserIds || []),
    ]));
    return ids.map((id) => ({
      label: this.getUserLabelById(id),
      isDriver: vehicle.conductorUserId === id,
      isResponsable: form.responsableId === id,
    }));
  }
}