import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConvoType, DataService, NotificationLog, NotificationSettings, User } from '../../services/data.service';

type NotificationSettingsForm = {
  dailyRunHour: number;
  dailyRunMinute: number;
  weeklyRequestWeekday: number;
  weeklyRequestHour: number;
  weeklyRequestMinute: number;
  weeklyTypeNames: string[];
  availabilityManagerNCarnets: string[];
  pendingLeadDays: number;
  pendingLeadHours: number;
  sortidaTypeNames: string;
  sortidaConfirmDaysBefore: number;
  sortidaConfirmHour: number;
  sortidaConfirmMinute: number;
  responseLink: string;
  creationTitle: string;
  creationBody: string;
  pendingTitle: string;
  pendingBody: string;
  weeklyEnabled: boolean;
  weeklyLink: string;
  weeklyTitle: string;
  weeklyBody: string;
  sortidaEnabled: boolean;
  sortidaLink: string;
  sortidaTitleYes: string;
  sortidaBodyYes: string;
  sortidaTitleNo: string;
  sortidaBodyNo: string;
};

@Component({
  selector: 'app-notifications-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notifications-admin.component.html',
  styleUrl: './notifications-admin.component.css'
})
export class NotificationsAdminComponent {
  readonly pageSizeOptions = [10, 25, 50];
  private _config: NotificationSettings | null = null;

  @Input()
  set config(value: NotificationSettings | null) {
    this._config = value;
    if (value) {
      this.form = this.mapConfigToForm(value);
    }
  }

  get config(): NotificationSettings | null {
    return this._config;
  }

  @Input() logs: NotificationLog[] = [];
  @Input() loading = false;
  @Input() loadingLogs = false;
  @Input() error = '';
  @Input() logsError = '';
  @Input() convoTypes: ConvoType[] = [];
  @Input() users: User[] = [];
  @Output() onLogsRefresh = new EventEmitter<void>();

  activeTab = 'config';
  saving = false;
  actionMessage = '';
  saveError = '';
  logsPageSize = 10;
  logsPageIndex = 1;
  form: NotificationSettingsForm = this.createEmptyForm();

  readonly weekdayOptions = [
    { value: 0, label: 'Diumenge' },
    { value: 1, label: 'Dilluns' },
    { value: 2, label: 'Dimarts' },
    { value: 3, label: 'Dimecres' },
    { value: 4, label: 'Dijous' },
    { value: 5, label: 'Divendres' },
    { value: 6, label: 'Dissabte' },
  ];

  constructor(private dataService: DataService) {}

  get logsTotalPages() {
    return Math.max(1, Math.ceil(this.logs.length / this.logsPageSize));
  }

  get logsCurrentPage() {
    return Math.min(this.logsPageIndex, this.logsTotalPages);
  }

  get paginatedLogs() {
    const start = (this.logsCurrentPage - 1) * this.logsPageSize;
    return this.logs.slice(start, start + this.logsPageSize);
  }

  setLogsPageSize(value: string) {
    const nextSize = Number(value);
    this.logsPageSize = this.pageSizeOptions.includes(nextSize) ? nextSize : 10;
    this.logsPageIndex = 1;
  }

  goToPreviousLogsPage() {
    this.logsPageIndex = Math.max(1, this.logsCurrentPage - 1);
  }

  goToNextLogsPage() {
    this.logsPageIndex = Math.min(this.logsTotalPages, this.logsCurrentPage + 1);
  }

  toggleWeeklyType(typeName: string, enabled: boolean) {
    const current = new Set(this.form.weeklyTypeNames);
    if (enabled) {
      current.add(typeName);
    } else {
      current.delete(typeName);
    }

    this.form = {
      ...this.form,
      weeklyTypeNames: Array.from(current),
    };
  }

  toggleAvailabilityManager(nCarnet: string, enabled: boolean) {
    const current = new Set(this.form.availabilityManagerNCarnets);
    if (enabled) {
      current.add(nCarnet);
    } else {
      current.delete(nCarnet);
    }

    this.form = {
      ...this.form,
      availabilityManagerNCarnets: Array.from(current),
    };
  }

  isAvailabilityManagerSelected(nCarnet: string): boolean {
    return this.form.availabilityManagerNCarnets.includes(nCarnet);
  }

  getAdminUsers(): User[] {
    return this.users.filter((user) => Boolean(user.roles?.isAdmin));
  }

  getAvailabilityManagersSummary(): string {
    const selected = this.form.availabilityManagerNCarnets;
    if (selected.length === 0) {
      return 'Selecciona responsables';
    }

    const adminUsersByCarnet = new Map(this.getAdminUsers().map((user) => [user.nCarnet, user]));
    const labels = selected
      .map((nCarnet) => {
        const user = adminUsersByCarnet.get(nCarnet);
        if (!user) {
          return null;
        }

        return `${user.nCarnet} - ${user.name} ${user.lastName || ''}`.trim();
      })
      .filter((label): label is string => Boolean(label));

    if (labels.length === 0) {
      return 'Selecciona responsables';
    }

    if (labels.length <= 2) {
      return labels.join(' · ');
    }

    return `${labels[0]} · +${labels.length - 1} més`;
  }

  isWeeklyTypeSelected(typeName: string): boolean {
    return this.form.weeklyTypeNames.includes(typeName);
  }

  saveConfig() {
    this.saving = true;
    this.saveError = '';
    this.actionMessage = '';

    this.dataService.updateNotificationConfig(this.buildPayload()).subscribe({
      next: (config) => {
        this.form = this.mapConfigToForm(config);
        this.saving = false;
        this.actionMessage = 'Configuració de notificacions desada.';
      },
      error: (err) => {
        this.saveError = err.message;
        this.saving = false;
      }
    });
  }

  private createEmptyForm(): NotificationSettingsForm {
    return {
      dailyRunHour: 8,
      dailyRunMinute: 0,
      weeklyRequestWeekday: 5,
      weeklyRequestHour: 19,
      weeklyRequestMinute: 0,
      weeklyTypeNames: ['Guardia', 'Guardia PVI', 'Semanal'],
      availabilityManagerNCarnets: [],
      pendingLeadDays: 0,
      pendingLeadHours: 24,
      sortidaTypeNames: '',
      sortidaConfirmDaysBefore: 1,
      sortidaConfirmHour: 19,
      sortidaConfirmMinute: 0,
      responseLink: '/dashboard',
      creationTitle: 'Nova convocatòria per respondre',
      creationBody: '{title} ({type}) per al dia {date}. Revisa i respon la teva disponibilitat.',
      pendingTitle: 'Tens convocatòries pendents',
      pendingBody: 'Encara tens {count} convocatòries pendents per respondre.',
      weeklyEnabled: true,
      weeklyLink: '/dashboard',
      weeklyTitle: 'Disponibilitat pendent per convocatòries setmanals',
      weeklyBody: 'Tens convocatòries setmanals de la setmana vinent pendents de resposta.',
      sortidaEnabled: true,
      sortidaLink: '/dashboard',
      sortidaTitleYes: 'Demà sí que se surt',
      sortidaBodyYes: '{title} ({type}) està confirmada per demà {date}.',
      sortidaTitleNo: 'Demà no se surt',
      sortidaBodyNo: '{title} ({type}) finalment no surt demà {date}.',
    };
  }

  private mapConfigToForm(config: NotificationSettings): NotificationSettingsForm {
    return {
      dailyRunHour: config.schedule.dailyRunHour,
      dailyRunMinute: config.schedule.dailyRunMinute,
      weeklyRequestWeekday: config.schedule.weeklyRequestWeekday,
      weeklyRequestHour: config.weeklyRequest.requestHour,
      weeklyRequestMinute: config.weeklyRequest.requestMinute,
      weeklyTypeNames: [...config.typeGroups.weeklyTypeNames],
      availabilityManagerNCarnets: [...(config.typeGroups.availabilityManagerNCarnets || [])],
      pendingLeadDays: config.responseRequest.pendingLeadDays,
      pendingLeadHours: config.responseRequest.pendingLeadHours,
      sortidaTypeNames: config.typeGroups.sortidaTypeNames.join(', '),
      sortidaConfirmDaysBefore: config.sortidaStatus.confirmDaysBefore,
      sortidaConfirmHour: config.sortidaStatus.confirmHour,
      sortidaConfirmMinute: config.sortidaStatus.confirmMinute,
      responseLink: config.responseRequest.link,
      creationTitle: config.responseRequest.creationTitle,
      creationBody: config.responseRequest.creationBody,
      pendingTitle: config.responseRequest.pendingTitle,
      pendingBody: config.responseRequest.pendingBody,
      weeklyEnabled: config.weeklyRequest.enabled,
      weeklyLink: config.weeklyRequest.link,
      weeklyTitle: config.weeklyRequest.title,
      weeklyBody: config.weeklyRequest.body,
      sortidaEnabled: config.sortidaStatus.enabled,
      sortidaLink: config.sortidaStatus.link,
      sortidaTitleYes: config.sortidaStatus.titleYes,
      sortidaBodyYes: config.sortidaStatus.bodyYes,
      sortidaTitleNo: config.sortidaStatus.titleNo,
      sortidaBodyNo: config.sortidaStatus.bodyNo,
    };
  }

  private buildPayload(): NotificationSettings {
    const guardiaSourceTypeName = this.config?.typeGroups.guardiaSourceTypeName || 'Guardia';
    const guardiaPviTypeName = this.config?.typeGroups.guardiaPviTypeName || 'Guardia PVI';
    const sendOnCreationForNonWeekly = this.config?.responseRequest.sendOnCreationForNonWeekly ?? true;

    const adminCarnets = new Set(this.getAdminUsers().map((user) => user.nCarnet));
    const selectedManagerCarnets = this.form.availabilityManagerNCarnets.filter((nCarnet) => adminCarnets.has(nCarnet));

    return {
      schedule: {
        dailyRunHour: Number(this.form.dailyRunHour),
        dailyRunMinute: Number(this.form.dailyRunMinute),
        weeklyRequestWeekday: Number(this.form.weeklyRequestWeekday),
      },
      typeGroups: {
        weeklyTypeNames: this.form.weeklyTypeNames,
        sortidaTypeNames: this.parseCommaSeparated(this.form.sortidaTypeNames),
        availabilityManagerNCarnets: selectedManagerCarnets,
        guardiaSourceTypeName,
        guardiaPviTypeName,
      },
      responseRequest: {
        sendOnCreationForNonWeekly,
        pendingLeadDays: Number(this.form.pendingLeadDays),
        pendingLeadHours: Number(this.form.pendingLeadHours),
        link: this.form.responseLink,
        creationTitle: this.form.creationTitle,
        creationBody: this.form.creationBody,
        pendingTitle: this.form.pendingTitle,
        pendingBody: this.form.pendingBody,
      },
      weeklyRequest: {
        enabled: this.form.weeklyEnabled,
        requestWeekday: Number(this.form.weeklyRequestWeekday),
        requestHour: Number(this.form.weeklyRequestHour),
        requestMinute: Number(this.form.weeklyRequestMinute),
        link: this.form.weeklyLink,
        title: this.form.weeklyTitle,
        body: this.form.weeklyBody,
      },
      sortidaStatus: {
        enabled: this.form.sortidaEnabled,
        confirmDaysBefore: Number(this.form.sortidaConfirmDaysBefore),
        confirmHour: Number(this.form.sortidaConfirmHour),
        confirmMinute: Number(this.form.sortidaConfirmMinute),
        link: this.form.sortidaLink,
        titleYes: this.form.sortidaTitleYes,
        bodyYes: this.form.sortidaBodyYes,
        titleNo: this.form.sortidaTitleNo,
        bodyNo: this.form.sortidaBodyNo,
      },
    };
  }

  private parseCommaSeparated(value: string): string[] {
    return value
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
}
