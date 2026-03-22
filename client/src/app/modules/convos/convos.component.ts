import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService, Convocatoria, ConvoType, User } from '../../services/data.service';

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
export class ConvosComponent {
  readonly incendiReadyOptions = [10, 15, 20, 25, 30];
  readonly todayDate = this.toDateInputValue(new Date());
  @Input() convocatorias: Convocatoria[] = [];
  @Input() convoTypes: ConvoType[] = [];
  @Input() users: User[] = [];
  @Input() loading = false;
  @Input() error = '';
  @Output() onChanged = new EventEmitter<Convocatoria>();
  readonly hourOptions = this.buildHourOptions();
  readonly minuteOptions = this.buildMinuteOptions();

  showForm = signal(false);
  showFilters = signal(false);
  editingId = signal<number | null>(null);
  formSubmitting = signal(false);
  deleteConfirming = signal<number | null>(null);
  showTimeMenu = signal(false);
  timeMenuHour = signal('');
  timeMenuMinute = signal('');
  timeMenuField = signal<'startTime' | 'finalTime' | null>(null);

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
    autoAssignResponsable: false,
    sortida: false,
    moreThan2: false,
    isActive: true
  });

  filteredConvocatorias = computed(() => {
    const activeFilters = this.filters();
    const titleQuery = activeFilters.title.trim().toLowerCase();
    const fromTime = activeFilters.dateFrom ? new Date(activeFilters.dateFrom).setHours(0, 0, 0, 0) : null;
    const toTime = activeFilters.dateTo ? new Date(activeFilters.dateTo).setHours(23, 59, 59, 999) : null;

    return this.convocatorias.filter((convo) => {
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

  constructor(private dataService: DataService) {}

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
        autoAssignResponsable: false,
        sortida: false,
        moreThan2: false,
        isActive: true
      });
    }
    this.showForm.set(true);
  }

  closeForm() {
    this.showForm.set(false);
  }

  submitForm() {
    const data = { ...this.formData() };
    const isIncendiType = this.isIncendiTypeById(Number(data.convoTypeId));
    const isGuardiaType = this.isGuardiaTypeById(Number(data.convoTypeId));

    if (!data.title || !data.responsableId || !data.convoTypeId) {
      alert('El titulo, responsable y tipo de convocatoria son obligatorios');
      return;
    }

    if (!isIncendiType && !data.date) {
      alert('La fecha es obligatoria');
      return;
    }

    if (!isIncendiType && !data.startTime) {
      alert('La hora de inicio es obligatoria');
      return;
    }

    if (isIncendiType) {
      const readyIn = Number(data.incendiReadyInMinutes) || 0;
      if (!this.incendiReadyOptions.includes(readyIn)) {
        alert('Selecciona un margen valido para Incendi (10, 15, 20, 25 o 30 minutos).');
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

    const payload: Partial<Convocatoria> = {
      date: data.date,
      title: data.title,
      ubiSortida: data.ubiSortida,
      responsableId: data.responsableId,
      convoTypeId: data.convoTypeId,
      startTime: data.startTime,
      finalTime: data.finalTime || undefined,
      autoAssignResponsable: Boolean(data.autoAssignResponsable),
      sortida: Boolean(data.sortida),
      moreThan2: Boolean(data.moreThan2),
      isActive: Boolean(data.isActive),
    };

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
          this.formSubmitting.set(false);
          this.closeForm();
          this.onChanged.emit(updatedConvo);
        },
        error: (err) => {
          alert('Error al actualizar: ' + err.message);
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
          alert('Error al crear: ' + err.message);
          this.formSubmitting.set(false);
        }
      });
    }
  }

  deleteConvocatoria(id: number) {
    if (this.deleteConfirming() === id) {
      this.dataService.deleteConvocatoria(id).subscribe({
        next: () => {
          this.deleteConfirming.set(null);
          // Emitir null para indicar que debe hacer reload
          this.onChanged.emit(null as any);
        },
        error: (err) => {
          alert('Error al eliminar: ' + err.message);
        }
      });
    } else {
      this.deleteConfirming.set(id);
    }
  }

  cancelDelete() {
    this.deleteConfirming.set(null);
  }

  updateFormField(field: string, value: any) {
    const data = this.formData();
    if (field === 'convoTypeId') {
      const next: ConvocatoriaFormData = {
        ...data,
        convoTypeId: Number(value) || undefined,
      };

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

  isIncendiTypeSelected(): boolean {
    const convoTypeId = Number(this.formData().convoTypeId);
    return this.isIncendiTypeById(convoTypeId);
  }

  getUserName(userId?: number): string {
    if (!userId) return '-';
    const user = this.users.find((u) => u.id === userId);
    return user ? `${user.name} ${user.lastName || ''}` : '-';
  }

  getConvoTypeName(typeId?: number): string {
    if (!typeId) return '-';
    const type = this.convoTypes.find((t) => t.id === typeId);
    return type ? type.name : '-';
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-ES');
  }

  getSortidaLabel(sortida?: boolean): string {
    return sortida ? 'Si' : 'No';
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

    const type = this.convoTypes.find((item) => item.id === convoTypeId);
    return Boolean(type?.name && /incendi/i.test(type.name));
  }

  private isGuardiaTypeById(convoTypeId?: number): boolean {
    if (!convoTypeId) {
      return false;
    }

    const type = this.convoTypes.find((item) => item.id === convoTypeId);
    return Boolean(type?.name && /guardia/i.test(type.name));
  }

  private getDefaultLocationForType(convoTypeId?: number): string {
    if (!convoTypeId) {
      return '';
    }

    const type = this.convoTypes.find((item) => item.id === convoTypeId);
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
      moreThan2: Boolean(convo.moreThan2),
      isActive: Boolean(convo.isActive),
    };
  }
}