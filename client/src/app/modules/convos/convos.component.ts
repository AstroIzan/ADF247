import { Component, HostListener, Input, Output, EventEmitter, signal, computed, input, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService, Convocatoria, ConvoType, User } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';
import { DateFormatService } from '../../services/date-format.service';

type ConvocatoriaFormData = Partial<Convocatoria> & {
  incendiReadyInMinutes?: number;
};

@Component({
  selector: 'app-convos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './convos.component.html',
  styleUrl: './convos.component.css'
})
export class ConvosComponent implements OnDestroy {
  private dateFormatService = inject(DateFormatService);
  readonly incendiReadyOptions = [10, 15, 20, 25, 30];
  readonly pageSizeOptions = [10, 25, 50];
  readonly todayDate = this.toDateInputValue(new Date());
  convocatorias = input<Convocatoria[]>([]);
  convoTypes = input<ConvoType[]>([]);
  users = input<User[]>([]);
  loading = input(false);
  error = input('');
  @Output() onChanged = new EventEmitter<Convocatoria>();
  readonly hourOptions = this.buildHourOptions();
  readonly minuteOptions = this.buildMinuteOptions();

  showForm = signal(false);
  showFilters = signal(false);
  editingId = signal<number | null>(null);
  formSubmitting = signal(false);
  deleteConfirming = signal<number | null>(null);
  actionFeedback = signal('');
  sendingNotificationKey = signal<string | null>(null);
  selectedConvo = signal<Convocatoria | null>(null);
  showTimeMenu = signal(false);
  timeMenuHour = signal('');
  timeMenuMinute = signal('');
  timeMenuField = signal<'startTime' | 'finalTime' | null>(null);
  showResponsableMenu = signal(false);

  filters = signal({
    title: '',
    convoTypeId: 'all',
    responsableId: 'all',
    status: 'all',
    dateFrom: '',
    dateTo: '',
  });

  formData = signal<ConvocatoriaFormData>({
    date: '',
    title: '',
    ubiSortida: '',
    responsableId: undefined,
    convoTypeId: undefined,
    startTime: '',
    finalTime: '',
    incendiReadyInMinutes: 10,
    autoAssignResponsable: true,
    sortida: false,
    isActive: true
  });

  filteredConvocatorias = computed(() => {
    const activeFilters = this.filters();
    const titleQuery = activeFilters.title.trim().toLowerCase();
    const fromTime = activeFilters.dateFrom ? new Date(activeFilters.dateFrom).setHours(0, 0, 0, 0) : null;
    const toTime = activeFilters.dateTo ? new Date(activeFilters.dateTo).setHours(23, 59, 59, 999) : null;

    return this.convocatorias().filter((convo) => {
      const matchesTitle = !titleQuery || (convo.title || '').toLowerCase().includes(titleQuery);
      const matchesType = activeFilters.convoTypeId === 'all' || String(convo.convoTypeId) === activeFilters.convoTypeId;
      const matchesResponsable = activeFilters.responsableId === 'all' || String(convo.responsableId) === activeFilters.responsableId;
      const matchesStatus =
        activeFilters.status === 'all' ||
        (activeFilters.status === 'active' ? convo.isActive : !convo.isActive);

      const convoTime = new Date(convo.date).getTime();
      const matchesFrom = fromTime === null || convoTime >= fromTime;
      const matchesTo = toTime === null || convoTime <= toTime;

      return matchesTitle && matchesType && matchesResponsable && matchesStatus && matchesFrom && matchesTo;
    });
  });

  pageSize = signal(10);
  pageIndex = signal(1);

  totalPages = computed(() => {
    const total = this.filteredConvocatorias().length;
    return Math.max(1, Math.ceil(total / this.pageSize()));
  });

  currentPage = computed(() => Math.min(this.pageIndex(), this.totalPages()));

  paginatedConvocatorias = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filteredConvocatorias().slice(start, start + this.pageSize());
  });

  constructor(
    private dataService: DataService,
    private authService: AuthService,
  ) {}

  isAdmin() {
    return this.authService.isAdmin();
  }

  openFilters() {
    this.showFilters.set(true);
  }

  closeFilters() {
    this.showFilters.set(false);
  }

  updateFilterField(field: 'title' | 'convoTypeId' | 'responsableId' | 'status' | 'dateFrom' | 'dateTo', value: string) {
    this.filters.set({
      ...this.filters(),
      [field]: value,
    });
    this.pageIndex.set(1);
  }

  resetFilters() {
    this.filters.set({
      title: '',
      convoTypeId: 'all',
      responsableId: 'all',
      status: 'all',
      dateFrom: '',
      dateTo: '',
    });
    this.pageIndex.set(1);
  }

  setPageSize(value: string) {
    const nextSize = Number(value);
    this.pageSize.set(this.pageSizeOptions.includes(nextSize) ? nextSize : 10);
    this.pageIndex.set(1);
  }

  goToPreviousPage() {
    this.pageIndex.set(Math.max(1, this.currentPage() - 1));
  }

  goToNextPage() {
    this.pageIndex.set(Math.min(this.totalPages(), this.currentPage() + 1));
  }

  openForm(convo?: Convocatoria) {
    if (convo) {
      this.editingId.set(convo.id);
      this.formData.set(this.mapConvocatoriaToFormData(convo));
    } else {
      this.editingId.set(null);
      this.formData.set({
        date: `${this.todayDate}T00:00:00`,
        title: '',
        ubiSortida: '',
        responsableId: undefined,
        convoTypeId: undefined,
        startTime: '',
        finalTime: '',
        incendiReadyInMinutes: 10,
        autoAssignResponsable: true,
        sortida: false,
        isActive: true
      });
    }
    this.showForm.set(true);
    document.body.classList.add('modal-open');
  }

  closeForm() {
    this.showForm.set(false);
    this.showResponsableMenu.set(false);
    document.body.classList.remove('modal-open');
  }

  submitForm() {
    const data = { ...this.formData() };
    const isIncendiType = this.isIncendiTypeById(Number(data.convoTypeId));
    const isGuardiaType = this.isGuardiaTypeById(Number(data.convoTypeId));
    const forcedTitle = this.getForcedTitleForTypeId(Number(data.convoTypeId));

    if (forcedTitle) {
      data.title = forcedTitle;
    }

    if ((!data.title && !forcedTitle) || !data.responsableId || !data.convoTypeId) {
      alert('El responsable i el tipus de convocatòria son obligatoris.');
      return;
    }

    if (!isIncendiType && !data.date) {
      alert('La data es obligatòria.');
      return;
    }

    if (!isIncendiType && !data.startTime) {
      alert('L\'hora d\'inici es obligatòria.');
      return;
    }

    if (isIncendiType) {
      const readyIn = Number(data.incendiReadyInMinutes) || 0;
      if (!this.incendiReadyOptions.includes(readyIn)) {
        alert('Selecciona un marge valid per a Incendi (10, 15, 20, 25 o 30 minuts).');
        return;
      }

      const now = new Date();
      const startDateTime = new Date(now.getTime() + readyIn * 60000);
      const finalDateTime = new Date(startDateTime.getTime() + 4 * 60 * 60000);

      data.date = `${this.todayDate}T00:00:00`;
      data.startTime = this.toTimeInputValue(startDateTime);
      data.finalTime = this.toTimeInputValue(finalDateTime);
    }

    if ((isGuardiaType || isIncendiType) && !(data.ubiSortida || '').trim()) {
      data.ubiSortida = 'Brigadas';
    }

    const editingId = this.editingId();
    const isEditing = Boolean(editingId);
    const originalConvocatoria = isEditing
      ? this.convocatorias().find((item) => item.id === editingId)
      : null;

    const payload: Partial<Convocatoria> = {
      date: data.date,
      title: data.title,
      ubiSortida: data.ubiSortida,
      responsableId: data.responsableId,
      convoTypeId: data.convoTypeId,
      startTime: data.startTime,
      finalTime: data.finalTime || undefined,
      autoAssignResponsable: Boolean(data.autoAssignResponsable),
      isActive: Boolean(data.isActive),
    };

    const nextSortida = Boolean(data.sortida);
    const currentSortida = Boolean(originalConvocatoria?.sortida);
    const sortidaChanged = !isEditing || nextSortida !== currentSortida;
    if (sortidaChanged) {
      payload.sortida = nextSortida;
    }

    if (!isIncendiType && data.date) {
      const parsedDate = new Date(data.date);

      if (!Number.isNaN(parsedDate.getTime())) {
        const dateValue = this.toDateInputValue(parsedDate);
        payload.date = `${dateValue}T00:00:00`;

        if (data.startTime) {
          payload.startTime = `${dateValue}T${this.normalizeTimeValue(String(data.startTime))}:00`;
        }

        if (data.finalTime) {
          payload.finalTime = `${dateValue}T${this.normalizeTimeValue(String(data.finalTime))}:00`;
        }
      }
    } else if (isIncendiType && data.date) {
      const dateValue = this.toDateInputValue(new Date(data.date));
      payload.date = `${dateValue}T00:00:00`;
      payload.startTime = `${dateValue}T${this.normalizeTimeValue(String(data.startTime))}:00`;
      payload.finalTime = data.finalTime ? `${dateValue}T${this.normalizeTimeValue(String(data.finalTime))}:00` : undefined;
    }

    this.formSubmitting.set(true);

    if (this.editingId()) {
      this.dataService.updateConvocatoria(this.editingId()!, payload).subscribe({
        next: (updatedConvo) => {
          if (sortidaChanged) {
            this.dataService.sendConvocatoriaSortidaStatus(updatedConvo.id).subscribe({
              next: () => {
                this.actionFeedback.set(`S'ha actualitzat la convocatòria i enviat l'estat de sortida per a ${updatedConvo.title}.`);
              },
              error: () => {
                // Keep save successful even if notification dispatch fails.
              },
            });
          }
          this.formSubmitting.set(false);
          this.closeForm();
          this.onChanged.emit(updatedConvo);
        },
        error: (err) => {
          alert('Error en actualitzar: ' + err.message);
          this.formSubmitting.set(false);
        }
      });
    } else {
      this.dataService.createConvocatoria(payload).subscribe({
        next: (newConvo) => {
          this.formSubmitting.set(false);
          this.closeForm();
          this.onChanged.emit(newConvo);
        },
        error: (err) => {
          alert('Error en crear: ' + err.message);
          this.formSubmitting.set(false);
        }
      });
    }
  }

  requestDelete(id: number) {
    this.deleteConfirming.set(id);
  }

  deleteConvocatoria(id: number) {
    this.dataService.deleteConvocatoria(id).subscribe({
      next: () => {
        this.deleteConfirming.set(null);
        this.onChanged.emit(null as any);
      },
      error: (err) => {
        this.deleteConfirming.set(null);
        this.onChanged.emit(null as any);
      }
    });
  }

  cancelDelete() {
    this.deleteConfirming.set(null);
  }

  @HostListener('document:click', ['$event'])
  handleDocumentClick(event: MouseEvent) {
    if (this.deleteConfirming() === null) {
      return;
    }

    const target = event.target as HTMLElement | null;
    if (target?.closest('.delete-menu')) {
      return;
    }

    this.cancelDelete();
  }

  sendResponseRequest(convo: Convocatoria) {
    const key = `response-${convo.id}`;
    this.sendingNotificationKey.set(key);
    this.actionFeedback.set('');

    this.dataService.sendConvocatoriaResponseRequest(convo.id).subscribe({
      next: () => {
        this.sendingNotificationKey.set(null);
        this.actionFeedback.set(`S'ha enviat l'avís de resposta per a ${convo.title}.`);
      },
      error: (err) => {
        this.sendingNotificationKey.set(null);
        this.actionFeedback.set(`Error enviant avís de resposta: ${err.message}`);
      }
    });
  }

  sendSortidaStatus(convo: Convocatoria) {
    const key = `sortida-${convo.id}`;
    this.sendingNotificationKey.set(key);
    this.actionFeedback.set('');

    this.dataService.sendConvocatoriaSortidaStatus(convo.id).subscribe({
      next: () => {
        this.sendingNotificationKey.set(null);
        this.actionFeedback.set(`S'ha enviat l'estat de sortida per a ${convo.title}.`);
      },
      error: (err) => {
        this.sendingNotificationKey.set(null);
        this.actionFeedback.set(`Error enviant estat de sortida: ${err.message}`);
      }
    });
  }

  isSendingAction(action: 'response' | 'sortida', convoId: number) {
    return this.sendingNotificationKey() === `${action}-${convoId}`;
  }

  canSendSortidaNotification(convo: Convocatoria) {
    const convoDate = new Date(convo.date);
    if (Number.isNaN(convoDate.getTime())) {
      return false;
    }

    const threshold = new Date();
    threshold.setHours(0, 0, 0, 0);
    threshold.setDate(threshold.getDate() - 1);

    const convoDay = new Date(convoDate);
    convoDay.setHours(0, 0, 0, 0);
    return convoDay >= threshold;
  }

  updateFormField(field: string, value: any) {
    const data = this.formData();
    if (field === 'convoTypeId') {
      const next: ConvocatoriaFormData = {
        ...data,
        convoTypeId: Number(value) || undefined,
      };

      const forcedTitle = this.getForcedTitleForTypeId(Number(next.convoTypeId));
      if (forcedTitle) {
        next.title = forcedTitle;
      }

      if (this.isGuardiaTypeById(Number(next.convoTypeId))) {
        next.ubiSortida = this.getDefaultLocationForType(Number(next.convoTypeId)) || 'Brigadas';
      }

      if (this.isIncendiTypeById(Number(next.convoTypeId))) {
        next.date = `${this.todayDate}T00:00:00`;
        next.ubiSortida = this.getDefaultLocationForType(Number(next.convoTypeId)) || 'Brigadas';
        next.incendiReadyInMinutes = 10;
        next.startTime = '';
        next.finalTime = '';
      }

      if (!this.isGuardiaTypeById(Number(next.convoTypeId)) && !this.isIncendiTypeById(Number(next.convoTypeId))) {
        const defaultLocation = this.getDefaultLocationForType(Number(next.convoTypeId))
        if (defaultLocation) {
          next.ubiSortida = defaultLocation
        }
      }

      this.formData.set(next);
      return;
    }

    if (field === 'incendiReadyInMinutes') {
      this.formData.set({
        ...data,
        incendiReadyInMinutes: Number(value) || 10,
      });
      return;
    }

    if (field === 'responsableId') {
      this.formData.set({
        ...data,
        responsableId: Number(value) || undefined,
      });
      return;
    }

    this.formData.set({
      ...data,
      [field]: value,
    });
  }

  ngOnDestroy() {
    this.showResponsableMenu.set(false);
    document.body.classList.remove('modal-open');
  }

  isIncendiTypeSelected(): boolean {
    const convoTypeId = Number(this.formData().convoTypeId);
    return this.isIncendiTypeById(convoTypeId);
  }

  shouldHideTitleField(): boolean {
    if (this.editingId()) {
      return false;
    }

    const forcedTitle = this.getForcedTitleForTypeId(Number(this.formData().convoTypeId));
    return Boolean(forcedTitle);
  }

  getUserName(userId?: number | null): string {
    if (!userId) return '-';
    const user = this.users().find((u) => u.id === userId);
    return user ? `${user.name} ${user.lastName || ''}` : '-';
  }

  getConvoTypeName(typeId?: number): string {
    if (!typeId) return '-';
    const type = this.convoTypes().find((t) => t.id === typeId);
    return type ? type.name : '-';
  }

  getResponsableRoleLabel(userId?: number | null): 'groc' | 'verd' | '' {
    if (!userId) {
      return '';
    }

    const user = this.users().find((item) => item.id === userId);
    if (!user) {
      return '';
    }

    return user.roles?.isGroc ? 'groc' : 'verd';
  }

  getResponsableLeadershipLabel(userId?: number | null): 'cap-operatiu' | 'cap-colla' | '' {
    if (!userId) {
      return '';
    }

    const user = this.users().find((item) => item.id === userId);
    if (!user) {
      return '';
    }

    if (user.roles?.isCapOperatiu) {
      return 'cap-operatiu';
    }

    if (user.roles?.isCapColla) {
      return 'cap-colla';
    }

    return '';
  }

  getResponsableName(userId?: number | null): string {
    if (!userId) {
      return 'Selecciona un responsable';
    }

    const user = this.users().find((item) => item.id === userId);
    if (!user) {
      return 'Selecciona un responsable';
    }

    return `${user.name} ${user.lastName || ''}`.trim();
  }

  toggleResponsableMenu() {
    if (this.formSubmitting()) {
      return;
    }

    this.showResponsableMenu.set(!this.showResponsableMenu());
  }

  selectResponsable(userId: number) {
    this.updateFormField('responsableId', userId);
    this.showResponsableMenu.set(false);
  }

  formatDate(dateString: string): string {
    return this.dateFormatService.formatDate(dateString);
  }

  getSortidaLabel(sortida?: boolean): string {
    return sortida ? 'Sí' : 'No';
  }

  getSortidaCardLabel(sortida?: boolean): string {
    return sortida ? 'Se surt' : 'No se surt';
  }

  openTimePicker(input: HTMLInputElement, field: 'startTime' | 'finalTime') {
    const normalizedValue = this.normalizeTimeValue(input.value);
    const [hour = '', minute = ''] = normalizedValue ? normalizedValue.split(':') : ['', ''];

    if (this.shouldForceCustomTimeMenu()) {
      this.timeMenuField.set(field);
      this.timeMenuHour.set(hour);
      this.timeMenuMinute.set(minute);
      this.showTimeMenu.set(true);
      return;
    }

    const pickerInput = input as HTMLInputElement & { showPicker?: () => void };

    if (typeof pickerInput.showPicker === 'function') {
      try {
        pickerInput.showPicker();
        return;
      } catch {
        // Fallback to custom menu when native picker is unavailable.
      }
    }

    this.timeMenuField.set(field);
    this.timeMenuHour.set(hour);
    this.timeMenuMinute.set(minute);
    this.showTimeMenu.set(true);
  }

  closeTimeMenu() {
    this.showTimeMenu.set(false);
    this.timeMenuField.set(null);
    this.timeMenuHour.set('');
    this.timeMenuMinute.set('');
  }

  updateTimeMenuHour(value: string) {
    this.timeMenuHour.set(value);
  }

  updateTimeMenuMinute(value: string) {
    this.timeMenuMinute.set(value);
  }

  applyTimeMenuSelection() {
    const field = this.timeMenuField();
    const hour = this.timeMenuHour();
    const minute = this.timeMenuMinute();
    const value = hour && minute ? `${hour}:${minute}` : '';

    if (!field || !value) {
      this.closeTimeMenu();
      return;
    }

    this.updateFormField(field, value);
    this.closeTimeMenu();
  }

  private normalizeTimeValue(value?: string) {
    if (!value) {
      return '';
    }

    // If it's an ISO datetime string, extract HH:MM directly without timezone conversion
    if (value.includes('T')) {
      try {
        // Extract HH:MM from ISO format (e.g., "2026-03-27T15:30:00.000Z" -> "15:30")
        const match = value.match(/T(\d{2}):(\d{2})/);
        if (match) {
          return `${match[1]}:${match[2]}`;
        }
      } catch {
        // If parsing fails, continue with regex fallback
      }
    }

    // If it's already in HH:MM format, return as is
    const match = value.match(/(\d{2}:\d{2})/);
    return match?.[1] || '';
  }

  private buildHourOptions() {
    const options: string[] = [];
    for (let hour = 0; hour < 24; hour += 1) {
      options.push(String(hour).padStart(2, '0'));
    }
    return options;
  }

  private buildMinuteOptions() {
    const options: string[] = [];
    for (let minute = 0; minute < 60; minute += 1) {
      options.push(String(minute).padStart(2, '0'));
    }
    return options;
  }

  private shouldForceCustomTimeMenu() {
    const ua = navigator.userAgent || '';
    const isFirefoxFamily = /Firefox|Zen/i.test(ua) && !/Chrom(e|ium)|Edg\//i.test(ua);
    return isFirefoxFamily;
  }

  private isIncendiTypeById(convoTypeId?: number): boolean {
    if (!convoTypeId) {
      return false;
    }

    const type = this.convoTypes().find((item) => item.id === convoTypeId);
    return Boolean(type?.name && /incendi/i.test(type.name));
  }

  private isGuardiaTypeById(convoTypeId?: number): boolean {
    if (!convoTypeId) {
      return false;
    }

    const type = this.convoTypes().find((item) => item.id === convoTypeId);
    return Boolean(type?.name && /guardia/i.test(type.name));
  }

  private getForcedTitleForTypeId(convoTypeId?: number): string | null {
    if (!convoTypeId) {
      return null;
    }

    const type = this.convoTypes().find((item) => item.id === convoTypeId);
    const typeName = type?.name || '';

    if (/pvi/i.test(typeName)) {
      return 'PVI';
    }

    if (/guardia/i.test(typeName)) {
      return 'Guardia';
    }

    return null;
  }

  private getDefaultLocationForType(convoTypeId?: number): string {
    if (!convoTypeId) {
      return '';
    }

    const type = this.convoTypes().find((item) => item.id === convoTypeId);
    return type?.defaultLocation?.trim() || '';
  }

  private toDateInputValue(date: Date) {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  }

  private toTimeInputValue(date: Date) {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }

  private mapConvocatoriaToFormData(convo: Convocatoria): ConvocatoriaFormData {
    return {
      id: convo.id,
      date: this.toDateInputValue(new Date(convo.date)),
      title: convo.title || '',
      ubiSortida: convo.ubiSortida || '',
      responsableId: convo.responsableId,
      convoTypeId: convo.convoTypeId,
      startTime: this.normalizeTimeValue(convo.startTime),
      finalTime: this.normalizeTimeValue(convo.finalTime),
      incendiReadyInMinutes: 10,
      autoAssignResponsable: Boolean(convo.autoAssignResponsable),
      sortida: Boolean(convo.sortida),
      isActive: Boolean(convo.isActive),
    };
  }
}