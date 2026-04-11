import { Component, Input, Output, EventEmitter, inject, NgZone, OnInit, OnDestroy, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs';
import {
  CampaignVehicleCatalogItem,
  ConvoType,
  DataService,
  NotificationAutomationRun,
  NotificationAutomationTaskConfig,
  NotificationLog,
  NotificationSettings,
  UserHoursSummaryRow,
  User,
} from '../../services/data.service';
import { DateFormatService } from '../../services/date-format.service';

type TaskFormItem = {
  taskKey: string;
  notifyKind: 'pending-responses' | 'sortida-status' | 'weekly-digest' | 'sortida-confirmed' | 'sortida-cancelled' | 'sortida-reten' | 'weekly-pending';
  enabled: boolean;
  scheduleKind: 'daily' | 'weekly' | 'manual';
  convoTypeFilter: string[];
};

type NotificationSettingsForm = {
  autoCreateUnavailableForUsersWithoutWindow: boolean;
  notifyOnAutoAvailableResponse: boolean;
  dailyRunHour: number;
  dailyRunMinute: number;
  weeklyRequestWeekday: number;
  weeklyRequestHour: number;
  weeklyRequestMinute: number;
  weeklyTypeNames: string[];
  availabilityManagerNCarnets: string[];
  pendingLeadDays: number;
  pendingLeadHours: number;
  sortidaConfirmDaysBefore: number;
  sortidaConfirmHour: number;
  sortidaConfirmMinute: number;
  responseLink: string;
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
  campaignStartDate: string;
  campaignEndDate: string;
  unansweredPenaltyThreshold: number;
  unansweredPenaltyHours: number;
  noShowPenaltyHours: number;
  campaignVehicleCatalog: CampaignVehicleCatalogItem[];
  automationRetentionDays: number;
  automationViewerNCarnets: string[];
  automationDeveloperNCarnets: string[];
  automationMonitoringEnabled: boolean;
  automationAlertRecipientNCarnets: string[];
  automationAlertOnMissedRun: boolean;
  automationAlertOnTaskFailure: boolean;
  tasks: TaskFormItem[];
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
  private dateFormatService = inject(DateFormatService);
  private _config: NotificationSettings | null = null;

  @Input()
  set config(value: NotificationSettings | null) {
    this._config = value;
    if (value) {
      this.form = this.mapConfigToForm(value);
      if (this.hoursSummaryRows.length === 0 && !this.hoursSummaryLoading) {
        this.loadHoursSummary();
      }
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
  private _convoTypes: ConvoType[] = [];

  @Input()
  set convoTypes(value: ConvoType[]) {
    this._convoTypes = Array.isArray(value) ? value : [];
  }

  get convoTypes(): ConvoType[] {
    return this._convoTypes;
  }

  @Input() users: User[] = [];
  @Input() title = 'Notificacions';
  @Input() description = 'Configura quan i a qui es notifica cada tasca automàtica.';
  @Input() compact = false;
  private _visibleTabs: Array<'config' | 'logs' | 'automation' | 'orchestrator-config'> = ['config', 'logs', 'automation'];

  @Input()
  set visibleTabs(value: Array<'config' | 'logs' | 'automation' | 'orchestrator-config'>) {
    this._visibleTabs = Array.isArray(value) && value.length > 0 ? value : ['config', 'logs', 'automation'];

    if (!this._visibleTabs.includes(this.activeTab as 'config' | 'logs' | 'automation' | 'orchestrator-config')) {
      this.activeTab = this._visibleTabs[0];
      if (this.activeTab === 'automation' && this.automationRuns.length === 0) {
        this.loadAutomationRuns();
      }
    }
  }

  get visibleTabs() {
    return this._visibleTabs;
  }

  @Output() onLogsRefresh = new EventEmitter<void>();

  activeTab = 'config';
  saving = false;
  actionMessage = '';
  saveError = '';
  taskActionLoadingKey = '';
  logsPageSize = 10;
  logsPageIndex = 1;
  automationRuns = [] as NotificationAutomationRun[];
  selectedAutomationRun: NotificationAutomationRun | null = null;
  automationLoading = false;
  automationError = '';
  automationStatusFilter = 'all';
  automationTriggerFilter = 'all';
  automationTaskFilter = 'all';
  automationDateFrom = '';
  automationDateTo = '';
  hoursSummaryRows: UserHoursSummaryRow[] = [];
  hoursSummaryLoading = false;
  hoursSummaryError = '';
  hoursSummaryGeneratedAt = '';
  newCampaignVehicle = {
    indicativo: '',
    modelo: '',
    litros: 0,
    kms: 0,
  };
  showAddTaskForm = false;
  newTaskDraft: TaskFormItem = this.createEmptyNewTask();
  newTaskKeyError = '';
  expandedTaskKeys = new Set<string>();
  form: NotificationSettingsForm = this.createEmptyForm();

  readonly notifyKindOptions: { value: TaskFormItem['notifyKind']; label: string }[] = [
    { value: 'pending-responses', label: 'Recordatori disponibilitat' },
    { value: 'sortida-confirmed', label: 'Sortida confirmada (D+1)' },
    { value: 'sortida-cancelled', label: 'Convocatòria cancel·lada (D+1)' },
    { value: 'sortida-reten', label: 'Retén (D+1)' },
    { value: 'sortida-status', label: 'Sortida genèrica' },
    { value: 'weekly-pending', label: 'Resum setmanal pendents' },
    { value: 'weekly-digest', label: 'Digest setmanal' },
  ];

  get orchestratorTaskKeys(): string[] {
    return (this.form.tasks || []).map((t) => t.taskKey).filter(Boolean);
  }

  readonly weekdayOptions = [
    { value: 0, label: 'Diumenge' },
    { value: 1, label: 'Dilluns' },
    { value: 2, label: 'Dimarts' },
    { value: 3, label: 'Dimecres' },
    { value: 4, label: 'Dijous' },
    { value: 5, label: 'Divendres' },
    { value: 6, label: 'Dissabte' },
  ];

  private autoSave$ = new Subject<void>();
  private destroy$ = new Subject<void>();

  constructor(private dataService: DataService) {
    this.autoSave$
      .pipe(
        debounceTime(1500),
        takeUntil(this.destroy$),
      )
      .subscribe(() => {
        this.autoSaveConfig();
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  requestAutoSave() {
    this.autoSave$.next();
  }

  getConvoTypeNames(): string[] {
    const names = this.convoTypes
      .map((type) => (typeof type.name === 'string' ? type.name.trim() : ''))
      .filter(Boolean);

    return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b));
  }

  formatRoundedHours(value: number | null | undefined) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return 0;
    }

    return Math.round(parsed);
  }

  ngAfterViewInit() {
    // Trigger initial auto-save setup after view initialization
  }

  get hasSingleTab() {
    return this.visibleTabs.length <= 1;
  }

  isTabVisible(tab: 'config' | 'logs' | 'automation' | 'orchestrator-config') {
    return this.visibleTabs.includes(tab);
  }

  setActiveTab(tab: 'config' | 'logs' | 'automation' | 'orchestrator-config') {
    if (!this.isTabVisible(tab)) {
      return;
    }

    this.activeTab = tab;

    if (tab === 'automation' && this.automationRuns.length === 0) {
      this.loadAutomationRuns();
    }

    if (tab === 'config' && this.hoursSummaryRows.length === 0) {
      this.loadHoursSummary();
    }
  }

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

  get filteredAutomationRuns() {
    return this.automationRuns.filter((run) => {
      const matchesStatus = this.automationStatusFilter === 'all' || run.status === this.automationStatusFilter;
      const matchesTrigger = this.automationTriggerFilter === 'all' || run.trigger === this.automationTriggerFilter;
      const matchesTask = this.matchesTaskFilter(run);
      const matchesDate = this.matchesDateFilter(run);
      return matchesStatus && matchesTrigger && matchesTask && matchesDate;
    });
  }

  get automationTriggerOptions() {
    const values = new Set(this.automationRuns.map((run) => run.trigger).filter(Boolean));
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }

  get automationTaskOptions() {
    const values = new Set(
      this.automationRuns
        .flatMap((run) => run.tasks || [])
        .map((task) => task.taskKey)
        .filter(Boolean)
    );
    return Array.from(values).sort((a, b) => a.localeCompare(b));
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
    this.autoSave$.next();
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
    this.autoSave$.next();
  }

  toggleAutomationViewer(nCarnet: string, enabled: boolean) {
    const current = new Set(this.form.automationViewerNCarnets);
    if (enabled) {
      current.add(nCarnet);
    } else {
      current.delete(nCarnet);
    }

    this.form = {
      ...this.form,
      automationViewerNCarnets: Array.from(current),
    };
    this.autoSave$.next();
  }

  toggleAutomationAlertRecipient(nCarnet: string, enabled: boolean) {
    const current = new Set(this.form.automationAlertRecipientNCarnets);
    if (enabled) {
      current.add(nCarnet);
    } else {
      current.delete(nCarnet);
    }

    this.form = {
      ...this.form,
      automationAlertRecipientNCarnets: Array.from(current),
    };
    this.autoSave$.next();
  }

  toggleAutomationDeveloper(nCarnet: string, enabled: boolean) {
    const current = new Set(this.form.automationDeveloperNCarnets);
    if (enabled) {
      current.add(nCarnet);
    } else {
      current.delete(nCarnet);
    }

    this.form = {
      ...this.form,
      automationDeveloperNCarnets: Array.from(current),
    };
    this.autoSave$.next();
  }

  onAutomationMonitoringChanged(enabled: boolean) {
    this.form = {
      ...this.form,
      automationMonitoringEnabled: enabled,
    };

    this.autoSave$.next();
  }

  isAutomationViewerSelected(nCarnet: string): boolean {
    return this.form.automationViewerNCarnets.includes(nCarnet);
  }

  isAutomationAlertRecipientSelected(nCarnet: string): boolean {
    return this.form.automationAlertRecipientNCarnets.includes(nCarnet);
  }

  isAutomationDeveloperSelected(nCarnet: string): boolean {
    return this.form.automationDeveloperNCarnets.includes(nCarnet);
  }

  getAllActiveUsers(): User[] {
    return this.users.filter((user) => user.isActive);
  }

  getTaskScheduleLabel(task: TaskFormItem): string {
    if (task.scheduleKind === 'weekly') {
      const day = this.weekdayOptions.find((d) => d.value === this.form.weeklyRequestWeekday);
      return `Setmanal (${day?.label || 'N/A'})`;
    }
    if (task.scheduleKind === 'manual') return 'Manual';
    return 'Diari';
  }

  getTaskNextExecution(task: TaskFormItem): string {
    const kind = task.scheduleKind ?? 'daily';
    const now = new Date();
    const dailyHour = Number(this.form.dailyRunHour) || 0;
    const dailyMinute = Number(this.form.dailyRunMinute) || 0;

    if (kind === 'manual') return 'Manual';

    const next = new Date(now);
    next.setSeconds(0, 0);

    if (kind === 'weekly') {
      const targetWeekday = Number(this.form.weeklyRequestWeekday);
      next.setHours(dailyHour, dailyMinute, 0, 0);
      const currentDay = next.getDay();
      const daysUntil = ((targetWeekday - currentDay + 7) % 7) || 7;
      next.setDate(next.getDate() + daysUntil);
      if (next.getTime() <= now.getTime()) {
        next.setDate(next.getDate() + 7);
      }
    } else {
      next.setHours(dailyHour, dailyMinute, 0, 0);
      if (next.getTime() <= now.getTime()) {
        next.setDate(next.getDate() + 1);
      }
    }

    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(next.getDate())}/${pad(next.getMonth() + 1)} ${pad(next.getHours())}:${pad(next.getMinutes())}`;
  }

  getTaskDescription(task: TaskFormItem): string {
    const map: Record<string, string> = {
      'pending-responses': 'Recorda als usuaris que tenen convocatòries pendents de resposta.',
      'sortida-status': 'Informa si se surt o no a les convocatòries de l\'endemà.',
      'sortida-confirmed': 'Envia notificació de sortida confirmada per D+1 als que han respost que sí.',
      'sortida-cancelled': 'Envia notificació de convocatòria cancel·lada per D+1 (excepte Guardia/PVI).',
      'sortida-reten': 'Envia notificació de Retén per D+1 en Guardia/PVI amb sortida = false.',
      'weekly-pending': 'Cada dilluns envia el resum de pendents de disponibilitat de la setmana en curs.',
      'weekly-digest': 'Envia un resum setmanal per a convocatòries de tipus setmanal.',
    };
    return map[task.notifyKind] || '';
  }

  isTaskExpanded(taskKey: string): boolean {
    return this.expandedTaskKeys.has(taskKey);
  }

  toggleTaskExpanded(taskKey: string): void {
    const next = new Set(this.expandedTaskKeys);
    if (next.has(taskKey)) {
      next.delete(taskKey);
    } else {
      next.add(taskKey);
    }
    this.expandedTaskKeys = next;
  }

  getRunTriggerLabel(trigger: string): string {
    const map: Record<string, string> = {
      'scheduled': 'Programat',
      'manual': 'Manual',
      'task-manual': 'Tasca manual',
      'missed-run': '⚠️ Omesa',
    };
    return map[trigger] || trigger;
  }

  get automationStats() {
    const runs = this.automationRuns;
    if (runs.length === 0) return null;

    const scheduled = runs.filter((r) => r.trigger !== 'missed-run');
    const finished = scheduled.filter((r) => r.status !== 'running');
    const successes = finished.filter((r) => r.status === 'success').length;
    const failures = finished.filter((r) => r.status === 'failed').length;
    const partial = finished.filter((r) => r.status === 'partial').length;
    const successRate = finished.length > 0 ? Math.round((successes / finished.length) * 100) : null;
    const avgDurationMs = finished.length > 0
      ? Math.round(finished.reduce((acc, r) => acc + (r.durationMs ?? 0), 0) / finished.length)
      : null;
    const missedCount = runs.filter((r) => r.trigger === 'missed-run').length;
    const lastRun = scheduled[0] ?? null;

    return { total: scheduled.length, successes, failures, partial, successRate, avgDurationMs, missedCount, lastRun };
  }

  loadAutomationRuns() {
    this.automationLoading = true;
    this.automationError = '';

    this.dataService.getNotificationAutomationRuns(100).subscribe({
      next: (runs) => {
        this.automationRuns = runs;
        this.automationLoading = false;

        if (this.selectedAutomationRun) {
          const refreshSelected = runs.find((item) => item.id === this.selectedAutomationRun?.id);
          this.selectedAutomationRun = refreshSelected || null;
        }
      },
      error: (err) => {
        this.automationRuns = [];
        this.automationLoading = false;
        this.automationError = err.message || 'No s\'ha pogut carregar l\'historial de corrides.';
      },
    });
  }

  selectAutomationRun(run: NotificationAutomationRun) {
    this.selectedAutomationRun = run;
    this.automationError = '';

    this.dataService.getNotificationAutomationRunById(run.id).subscribe({
      next: (detail) => {
        this.selectedAutomationRun = detail;
      },
      error: (err) => {
        this.automationError = err.message || 'No s\'ha pogut carregar el detall de la corrida.';
      },
    });
  }

  runTaskManually(taskKey: string) {
    this.taskActionLoadingKey = taskKey;
    this.actionMessage = '';
    this.saveError = '';

    this.dataService.runNotificationAutomationTask(taskKey).subscribe({
      next: (result) => {
        this.taskActionLoadingKey = '';
        this.actionMessage = `Tasca ${result.taskKey} executada (${result.status}).`;
        this.loadAutomationRuns();
      },
      error: (err) => {
        this.taskActionLoadingKey = '';
        this.saveError = err.message || 'No s\'ha pogut executar la tasca.';
      },
    });
  }

  getTaskConfig(taskKey: string): NotificationAutomationTaskConfig | null {
    const tasks = this.config?.automation?.tasks || [];
    return tasks.find((task) => task.taskKey === taskKey) || null;
  }

  getRunActorLabel(run: NotificationAutomationRun): string {
    if (!run.actor) {
      return '-';
    }

    const fullName = `${run.actor.name} ${run.actor.lastName || ''}`.trim();
    return `${run.actor.nCarnet} - ${fullName}`;
  }

  getDurationLabel(durationMs?: number | null): string {
    return this.dateFormatService.formatDuration(durationMs);
  }

  private matchesTaskFilter(run: NotificationAutomationRun): boolean {
    if (this.automationTaskFilter === 'all') {
      return true;
    }

    return (run.tasks || []).some((task) => task.taskKey === this.automationTaskFilter);
  }

  private matchesDateFilter(run: NotificationAutomationRun): boolean {
    const startedAt = new Date(run.startedAt);
    if (Number.isNaN(startedAt.getTime())) {
      return false;
    }

    if (this.automationDateFrom) {
      const from = new Date(`${this.automationDateFrom}T00:00:00`);
      if (startedAt.getTime() < from.getTime()) {
        return false;
      }
    }

    if (this.automationDateTo) {
      const to = new Date(`${this.automationDateTo}T23:59:59`);
      if (startedAt.getTime() > to.getTime()) {
        return false;
      }
    }

    return true;
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

  getAutomationViewersSummary(): string {
    return this.getUsersSelectionSummary(
      this.form.automationViewerNCarnets,
      'Selecciona visualitzadors'
    );
  }

  getAutomationAlertRecipientsSummary(): string {
    return this.getUsersSelectionSummary(
      this.form.automationAlertRecipientNCarnets,
      'Selecciona destinataris'
    );
  }

  getAutomationDevelopersSummary(): string {
    return this.getUsersSelectionSummary(
      this.form.automationDeveloperNCarnets,
      'Selecciona developers'
    );
  }

  isWeeklyTypeSelected(typeName: string): boolean {
    return this.form.weeklyTypeNames.includes(typeName);
  }

  private autoSaveConfig() {
    this.dataService.updateNotificationConfig(this.buildPayload()).subscribe({
      next: (config) => {
        this.form = this.mapConfigToForm(config);
        this.saveError = '';
        this.loadHoursSummary();
      },
      error: (err) => {
        this.saveError = err.message || 'No s\'ha pogut desar la configuració.';
      }
    });
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
        this.loadHoursSummary();
      },
      error: (err) => {
        this.saveError = err.message;
        this.saving = false;
      }
    });
  }

  private createEmptyForm(): NotificationSettingsForm {
    return {
      autoCreateUnavailableForUsersWithoutWindow: false,
      notifyOnAutoAvailableResponse: false,
      dailyRunHour: 8,
      dailyRunMinute: 0,
      weeklyRequestWeekday: 5,
      weeklyRequestHour: 19,
      weeklyRequestMinute: 0,
      weeklyTypeNames: ['Guardia', 'PVI', 'Semanal'],
      availabilityManagerNCarnets: [],
      pendingLeadDays: 0,
      pendingLeadHours: 24,
      sortidaConfirmDaysBefore: 1,
      sortidaConfirmHour: 19,
      sortidaConfirmMinute: 0,
      responseLink: '/dashboard',
      weeklyEnabled: true,
      weeklyLink: '/dashboard',
      weeklyTitle: 'Disponibilitat pendent per convocatòries setmanals',
      weeklyBody: 'Tens convocatòries setmanals de la setmana vinent pendents de resposta.',
      sortidaEnabled: true,
      sortidaLink: '/dashboard',
      sortidaTitleYes: '**Convocatoria** {title}',
      sortidaBodyYes: 'Demà a les {horaInici} a {ubicació}\nResponsable {nºCarnet} {nom + cognom}',
      sortidaTitleNo: 'Convocatòria cancel·lada',
      sortidaBodyNo: '{title} ({type}) finalment no surt demà {date}.',
      campaignStartDate: '',
      campaignEndDate: '',
      unansweredPenaltyThreshold: 0,
      unansweredPenaltyHours: 1,
      noShowPenaltyHours: 4,
      campaignVehicleCatalog: [],
      automationRetentionDays: 7,
      automationViewerNCarnets: [],
      automationDeveloperNCarnets: [],
      automationMonitoringEnabled: false,
      automationAlertRecipientNCarnets: [],
      automationAlertOnMissedRun: true,
      automationAlertOnTaskFailure: true,
      tasks: [
        { taskKey: 'sortida-d1-confirmed', notifyKind: 'sortida-confirmed', enabled: true, scheduleKind: 'daily', convoTypeFilter: [] },
        { taskKey: 'sortida-d1-cancelled', notifyKind: 'sortida-cancelled', enabled: true, scheduleKind: 'daily', convoTypeFilter: [] },
        { taskKey: 'sortida-d1-reten', notifyKind: 'sortida-reten', enabled: true, scheduleKind: 'daily', convoTypeFilter: [] },
        { taskKey: 'weekly-request-guardia-pvi', notifyKind: 'weekly-digest', enabled: true, scheduleKind: 'weekly', convoTypeFilter: ['Guardia', 'PVI'] },
      ],
    };
  }

  private getDefaultConvocatoriaTitleTemplate(): string {
    return '**Convocatoria** {title}';
  }

  private getDefaultConvocatoriaBodyTemplate(): string {
    return 'Demà a les {horaInici} a {ubicació}\nResponsable {nºCarnet} {nom + cognom}';
  }

  private normalizeConvocatoriaTitleTemplate(value: string): string {
    const current = String(value || '').trim();
    if (!current || current === 'Nova convocatòria per respondre' || current === 'Demà sí que se surt' || current === 'Demà no se surt') {
      return this.getDefaultConvocatoriaTitleTemplate();
    }
    return current;
  }

  private normalizeConvocatoriaBodyTemplate(value: string): string {
    const current = String(value || '').trim();
    if (!current
      || current === '{title} ({type}) per al dia {date}. Revisa i respon la teva disponibilitat.'
      || current === '{title} ({type}) està confirmada per demà {date}.'
      || current === '{title} ({type}) finalment no surt demà {date}.') {
      return this.getDefaultConvocatoriaBodyTemplate();
    }
    return current;
  }

  private mapConfigToForm(config: NotificationSettings): NotificationSettingsForm {
    const automationTasks = (config.automation?.tasks && config.automation.tasks.length > 0)
      ? config.automation.tasks
      : [
        { taskKey: 'sortida-d1-confirmed', notifyKind: 'sortida-confirmed', enabled: true, schedule: { kind: 'daily' }, convoTypeFilter: [], timeoutMs: 120000, retryPolicy: { maxRetries: 0 }, dependsOn: [] },
        { taskKey: 'sortida-d1-cancelled', notifyKind: 'sortida-cancelled', enabled: true, schedule: { kind: 'daily' }, convoTypeFilter: [], timeoutMs: 120000, retryPolicy: { maxRetries: 0 }, dependsOn: [] },
        { taskKey: 'sortida-d1-reten', notifyKind: 'sortida-reten', enabled: true, schedule: { kind: 'daily' }, convoTypeFilter: [], timeoutMs: 120000, retryPolicy: { maxRetries: 0 }, dependsOn: [] },
        { taskKey: 'weekly-request-guardia-pvi', notifyKind: 'weekly-digest', enabled: true, schedule: { kind: 'weekly' }, convoTypeFilter: ['Guardia', 'PVI'], timeoutMs: 120000, retryPolicy: { maxRetries: 0 }, dependsOn: [] },
      ];

    return {
      autoCreateUnavailableForUsersWithoutWindow: config.availabilityMatching?.autoCreateUnavailableForUsersWithoutWindow ?? false,
      notifyOnAutoAvailableResponse: config.availabilityMatching?.notifyOnAutoAvailableResponse ?? false,
      dailyRunHour: config.schedule.dailyRunHour,
      dailyRunMinute: config.schedule.dailyRunMinute,
      weeklyRequestWeekday: config.schedule.weeklyRequestWeekday,
      weeklyRequestHour: config.weeklyRequest.requestHour,
      weeklyRequestMinute: config.weeklyRequest.requestMinute,
      weeklyTypeNames: [...config.typeGroups.weeklyTypeNames],
      availabilityManagerNCarnets: [...(config.typeGroups.availabilityManagerNCarnets || [])],
      pendingLeadDays: config.responseRequest.pendingLeadDays,
      pendingLeadHours: config.responseRequest.pendingLeadHours,
      sortidaConfirmDaysBefore: config.sortidaStatus.confirmDaysBefore,
      sortidaConfirmHour: config.sortidaStatus.confirmHour,
      sortidaConfirmMinute: config.sortidaStatus.confirmMinute,
      responseLink: config.responseRequest.link,
      weeklyEnabled: config.weeklyRequest.enabled,
      weeklyLink: config.weeklyRequest.link,
      weeklyTitle: config.weeklyRequest.title,
      weeklyBody: config.weeklyRequest.body,
      sortidaEnabled: config.sortidaStatus.enabled,
      sortidaLink: config.sortidaStatus.link,
      sortidaTitleYes: this.normalizeConvocatoriaTitleTemplate(config.sortidaStatus.titleYes),
      sortidaBodyYes: this.normalizeConvocatoriaBodyTemplate(config.sortidaStatus.bodyYes),
      sortidaTitleNo: this.normalizeConvocatoriaTitleTemplate(config.sortidaStatus.titleNo),
      sortidaBodyNo: this.normalizeConvocatoriaBodyTemplate(config.sortidaStatus.bodyNo),
      campaignStartDate: config.hourComputation?.campaignStartDate || '',
      campaignEndDate: config.hourComputation?.campaignEndDate || '',
      unansweredPenaltyThreshold: Number(config.hourComputation?.unansweredPenaltyThreshold ?? 0),
      unansweredPenaltyHours: Number(config.hourComputation?.unansweredPenaltyHours ?? 1),
      noShowPenaltyHours: Number(config.hourComputation?.noShowPenaltyHours ?? 4),
      campaignVehicleCatalog: (config.campaignForm?.vehicleCatalog || []).map((vehicle) => ({
        indicativo: String(vehicle.indicativo || '').trim(),
        modelo: String(vehicle.modelo || '').trim(),
        litros: Number(vehicle.litros || 0),
        kms: Number(vehicle.kms || 0),
      })),
      automationRetentionDays: config.automation?.retentionDays ?? 7,
      automationViewerNCarnets: [...(config.automation?.viewerNCarnets || [])],
      automationDeveloperNCarnets: [...(config.automation?.developerNCarnets || [])],
      automationMonitoringEnabled: config.automation?.monitoring?.enabled ?? false,
      automationAlertRecipientNCarnets: [...(config.automation?.monitoring?.alertRecipientNCarnets || [])],
      automationAlertOnMissedRun: config.automation?.monitoring?.alertOnMissedRun ?? true,
      automationAlertOnTaskFailure: config.automation?.monitoring?.alertOnTaskFailure ?? true,
      tasks: automationTasks.map((task) => ({
        taskKey: task.taskKey,
        notifyKind: (task.notifyKind || task.taskKey || 'sortida-confirmed') as TaskFormItem['notifyKind'],
        enabled: task.enabled,
        scheduleKind: (task.schedule?.kind || 'daily') as TaskFormItem['scheduleKind'],
        convoTypeFilter: Array.isArray(task.convoTypeFilter) ? [...task.convoTypeFilter] : [],
      })),
    };
  }

  private buildPayload(): NotificationSettings {
    const guardiaSourceTypeName = this.config?.typeGroups.guardiaSourceTypeName || 'Guardia';
    const guardiaPviTypeName = this.config?.typeGroups.guardiaPviTypeName || 'PVI';
    const sendOnCreationForNonWeekly = this.config?.responseRequest.sendOnCreationForNonWeekly ?? true;

    const adminCarnets = new Set(this.getAdminUsers().map((user) => user.nCarnet));
    const allActiveCarnets = new Set(this.getAllActiveUsers().map((user) => user.nCarnet));
    const selectedManagerCarnets = this.form.availabilityManagerNCarnets.filter((nCarnet) => adminCarnets.has(nCarnet));
    const selectedViewerCarnets = this.form.automationViewerNCarnets.filter((nCarnet) => allActiveCarnets.has(nCarnet));
    const selectedDeveloperCarnets = this.form.automationDeveloperNCarnets.filter((nCarnet) => allActiveCarnets.has(nCarnet));
    const selectedAlertCarnets = this.form.automationAlertRecipientNCarnets.filter((nCarnet) => allActiveCarnets.has(nCarnet));

    const existingTasks = this.config?.automation?.tasks || [];
    const mappedTasks = (this.form.tasks || []).filter((t) => t.taskKey.trim().length > 0).map((t) => {
      const existing = existingTasks.find((et) => et.taskKey === t.taskKey);
      return {
        taskKey: t.taskKey.trim(),
        notifyKind: t.notifyKind,
        enabled: t.enabled,
        schedule: { kind: t.scheduleKind },
        convoTypeFilter: [...t.convoTypeFilter],
        timeoutMs: Number(existing?.timeoutMs || 120000),
        retryPolicy: { maxRetries: Number(existing?.retryPolicy?.maxRetries || 0) },
        dependsOn: Array.isArray(existing?.dependsOn) ? existing.dependsOn : [],
      };
    });

    return {
      schedule: {
        dailyRunHour: Number(this.form.dailyRunHour),
        dailyRunMinute: Number(this.form.dailyRunMinute),
        weeklyRequestWeekday: Number(this.form.weeklyRequestWeekday),
      },
      typeGroups: {
        weeklyTypeNames: this.form.weeklyTypeNames,
        sortidaTypeNames: this.config?.typeGroups.sortidaTypeNames || [],
        availabilityManagerNCarnets: selectedManagerCarnets,
        guardiaSourceTypeName,
        guardiaPviTypeName,
      },
      responseRequest: {
        sendOnCreationForNonWeekly,
        pendingLeadDays: Number(this.form.pendingLeadDays),
        pendingLeadHours: Number(this.form.pendingLeadHours),
        link: this.form.responseLink,
        creationTitle: this.config?.responseRequest.creationTitle || this.getDefaultConvocatoriaTitleTemplate(),
        creationBody: this.config?.responseRequest.creationBody || this.getDefaultConvocatoriaBodyTemplate(),
        fireTitle: this.config?.responseRequest.fireTitle || 'Incendi',
        fireBody: this.config?.responseRequest.fireBody || 'S\'ha creat una convocatòria d\'incendi: {title} ({date}).',
        weeklyCreatedTitle: this.config?.responseRequest.weeklyCreatedTitle || 'Disponibilitat setmanal',
        weeklyCreatedBody: this.config?.responseRequest.weeklyCreatedBody || 'Aquesta setmana hi ha {count} convocatòries setmanals creades.',
        pendingTitle: this.config?.responseRequest.pendingTitle || 'Tens convocatòries pendents',
        pendingBody: this.config?.responseRequest.pendingBody || 'Encara tens {count} convocatòries pendents per respondre.',
      },
      availabilityMatching: {
        conflictPolicy: this.config?.availabilityMatching?.conflictPolicy || 'unavailable-wins',
        createAvailableResponses: this.config?.availabilityMatching?.createAvailableResponses ?? true,
        createUnavailableResponses: this.config?.availabilityMatching?.createUnavailableResponses ?? true,
        autoCreateUnavailableForUsersWithoutWindow: this.form.autoCreateUnavailableForUsersWithoutWindow,
        notifyOnAutoAvailableResponse: this.form.notifyOnAutoAvailableResponse,
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
        titleCancelled: this.config?.sortidaStatus.titleCancelled || this.form.sortidaTitleNo,
        bodyCancelled: this.config?.sortidaStatus.bodyCancelled || this.form.sortidaBodyNo,
        titleReten: this.config?.sortidaStatus.titleReten || this.form.sortidaTitleNo,
        bodyReten: this.config?.sortidaStatus.bodyReten || this.form.sortidaBodyNo,
      },
      hourComputation: {
        campaignStartDate: this.form.campaignStartDate || null,
        campaignEndDate: this.form.campaignEndDate || null,
        unansweredPenaltyThreshold: Number(this.form.unansweredPenaltyThreshold),
        unansweredPenaltyHours: Number(this.form.unansweredPenaltyHours),
        noShowPenaltyHours: Number(this.form.noShowPenaltyHours),
      },
      campaignForm: {
        vehicleCatalog: (this.form.campaignVehicleCatalog || []).map((vehicle) => ({
          indicativo: String(vehicle.indicativo || '').trim(),
          modelo: String(vehicle.modelo || '').trim(),
          litros: Number(vehicle.litros || 0),
          kms: Number(vehicle.kms || 0),
        })).filter((vehicle) => Boolean(vehicle.indicativo)),
      },
      automation: {
        retentionDays: Number(this.form.automationRetentionDays),
        viewerNCarnets: selectedViewerCarnets,
        developerNCarnets: selectedDeveloperCarnets,
        monitoring: {
          enabled: this.form.automationMonitoringEnabled,
          alertRecipientNCarnets: selectedAlertCarnets,
          alertOnMissedRun: this.form.automationAlertOnMissedRun,
          alertOnTaskFailure: this.form.automationAlertOnTaskFailure,
        },
        tasks: mappedTasks,
      },
    };
  }

    loadHoursSummary() {
      this.hoursSummaryLoading = true;
      this.hoursSummaryError = '';

      this.dataService.getHoursSummary().subscribe({
        next: (summary) => {
          this.hoursSummaryRows = Array.isArray(summary?.users) ? summary.users : [];
          this.hoursSummaryGeneratedAt = summary?.generatedAt || '';
          this.hoursSummaryLoading = false;
        },
        error: (err) => {
          this.hoursSummaryRows = [];
          this.hoursSummaryGeneratedAt = '';
          this.hoursSummaryLoading = false;
          this.hoursSummaryError = err.message || 'No s\'ha pogut carregar el resum d\'hores.';
        },
      });
    }

  addCampaignVehicle(): void {
    const indicativo = this.newCampaignVehicle.indicativo.trim();
    if (!indicativo) {
      return;
    }

    const normalizedIndicativo = indicativo.toLowerCase();
    if ((this.form.campaignVehicleCatalog || []).some((item) => item.indicativo.trim().toLowerCase() === normalizedIndicativo)) {
      return;
    }

    const litros = Number(this.newCampaignVehicle.litros);
    const kms = Number(this.newCampaignVehicle.kms);

    this.form = {
      ...this.form,
      campaignVehicleCatalog: [
        ...(this.form.campaignVehicleCatalog || []),
        {
          indicativo,
          modelo: this.newCampaignVehicle.modelo.trim(),
          litros: Number.isFinite(litros) && litros >= 0 ? litros : 0,
          kms: Number.isFinite(kms) && kms >= 0 ? kms : 0,
        },
      ],
    };

    this.newCampaignVehicle = {
      indicativo: '',
      modelo: '',
      litros: 0,
      kms: 0,
    };
    this.requestAutoSave();
  }

  removeCampaignVehicle(indicativo: string): void {
    this.form = {
      ...this.form,
      campaignVehicleCatalog: (this.form.campaignVehicleCatalog || []).filter((vehicle) => vehicle.indicativo !== indicativo),
    };
    this.requestAutoSave();
  }

  updateCampaignVehicleField(indicativo: string, field: 'modelo' | 'litros' | 'kms', value: string): void {
    const nextCatalog = (this.form.campaignVehicleCatalog || []).map((vehicle) => {
      if (vehicle.indicativo !== indicativo) {
        return vehicle;
      }

      if (field === 'modelo') {
        return {
          ...vehicle,
          modelo: value,
        };
      }

      if (field === 'litros') {
        const litros = Number(value);
        return {
          ...vehicle,
          litros: Number.isFinite(litros) && litros >= 0 ? litros : 0,
        };
      }

      const kms = Number(value);
      return {
        ...vehicle,
        kms: Number.isFinite(kms) && kms >= 0 ? kms : 0,
      };
    });

    this.form = {
      ...this.form,
      campaignVehicleCatalog: nextCatalog,
    };
    this.requestAutoSave();
  }

  addTask() {
    this.newTaskDraft = this.createEmptyNewTask();
    this.newTaskKeyError = '';
    this.showAddTaskForm = true;
  }

  confirmAddTask() {
    const key = this.newTaskDraft.taskKey.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
    if (!key) {
      this.newTaskKeyError = 'El nom és obligatori.';
      return;
    }
    if (this.form.tasks.some((t) => t.taskKey === key)) {
      this.newTaskKeyError = 'Ja existeix una tasca amb aquest nom.';
      return;
    }
    this.form = {
      ...this.form,
      tasks: [...this.form.tasks, { ...this.newTaskDraft, taskKey: key }],
    };
    this.showAddTaskForm = false;
    this.newTaskDraft = this.createEmptyNewTask();
    this.newTaskKeyError = '';
    this.autoSave$.next();
  }

  cancelAddTask() {
    this.showAddTaskForm = false;
    this.newTaskDraft = this.createEmptyNewTask();
    this.newTaskKeyError = '';
  }

  removeTask(index: number) {
    const taskKey = this.form.tasks[index]?.taskKey;
    const tasks = [...this.form.tasks];
    tasks.splice(index, 1);
    this.form = { ...this.form, tasks };
    if (taskKey) {
      const next = new Set(this.expandedTaskKeys);
      next.delete(taskKey);
      this.expandedTaskKeys = next;
    }
    this.autoSave$.next();
  }

  toggleTaskEnabled(index: number, enabled: boolean) {
    const tasks = [...this.form.tasks];
    tasks[index] = { ...tasks[index], enabled };
    this.form = { ...this.form, tasks };
    this.autoSave$.next();
  }

  updateTaskField(index: number, field: keyof TaskFormItem, value: unknown) {
    const tasks = [...this.form.tasks];
    tasks[index] = { ...tasks[index], [field]: value };
    this.form = { ...this.form, tasks };
    this.autoSave$.next();
  }

  toggleTaskConvoType(index: number, typeName: string, checked: boolean) {
    const tasks = [...this.form.tasks];
    const current = new Set(tasks[index].convoTypeFilter);
    if (checked) { current.add(typeName); } else { current.delete(typeName); }
    tasks[index] = { ...tasks[index], convoTypeFilter: Array.from(current) };
    this.form = { ...this.form, tasks };
    this.autoSave$.next();
  }

  isConvoTypeSelectedForTask(index: number, typeName: string): boolean {
    return this.form.tasks[index]?.convoTypeFilter?.includes(typeName) ?? false;
  }

  getTaskConvoTypeSummary(index: number): string {
    const filter = this.form.tasks[index]?.convoTypeFilter || [];
    if (filter.length === 0) return 'Tots els tipus';
    if (filter.length <= 2) return filter.join(' · ');
    return `${filter[0]} · +${filter.length - 1} més`;
  }

  toggleNewTaskConvoType(typeName: string, checked: boolean) {
    const current = new Set(this.newTaskDraft.convoTypeFilter);
    if (checked) { current.add(typeName); } else { current.delete(typeName); }
    this.newTaskDraft = { ...this.newTaskDraft, convoTypeFilter: Array.from(current) };
  }

  isConvoTypeSelectedForNewTask(typeName: string): boolean {
    return this.newTaskDraft.convoTypeFilter.includes(typeName);
  }

  getNewTaskConvoTypeSummary(): string {
    const filter = this.newTaskDraft.convoTypeFilter;
    if (filter.length === 0) return 'Tots els tipus';
    if (filter.length <= 2) return filter.join(' · ');
    return `${filter[0]} · +${filter.length - 1} més`;
  }

  private createEmptyNewTask(): TaskFormItem {
    return { taskKey: '', notifyKind: 'sortida-confirmed', enabled: true, scheduleKind: 'daily', convoTypeFilter: [] };
  }

  private getUsersSelectionSummary(selectedCarnets: string[], emptyLabel: string): string {
    if (selectedCarnets.length === 0) {
      return emptyLabel;
    }

    const usersByCarnet = new Map(this.getAllActiveUsers().map((user) => [user.nCarnet, user]));
    const labels = selectedCarnets
      .map((nCarnet) => {
        const user = usersByCarnet.get(nCarnet);
        if (!user) {
          return null;
        }

        return `${user.nCarnet} - ${user.name} ${user.lastName || ''}`.trim();
      })
      .filter((label): label is string => Boolean(label));

    if (labels.length === 0) {
      return emptyLabel;
    }

    if (labels.length <= 2) {
      return labels.join(' · ');
    }

    return `${labels[0]} · +${labels.length - 1} més`;
  }
}
