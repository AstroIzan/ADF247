import { Component, OnInit, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { AvailabilityWindow, DataService } from '../../services/data.service';
import { DateFormatService } from '../../services/date-format.service';

@Component({
  selector: 'app-availability',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './availability.component.html',
  styleUrl: './availability.component.css',
})
export class AvailabilityComponent implements OnInit {
  private dateFormatService = inject(DateFormatService);
  private readonly spainDateFormatter = new Intl.DateTimeFormat('ca-ES', {
    timeZone: 'Europe/Madrid',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  private readonly spainTimeFormatter = new Intl.DateTimeFormat('ca-ES', {
    timeZone: 'Europe/Madrid',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  readonly weekdayLabels = ['Dl', 'Dt', 'Dc', 'Dj', 'Dv', 'Ds', 'Dg'];
  readonly hourOptions = this.buildHourOptions();
  readonly minuteOptions = this.buildMinuteOptions();
  windows = signal<AvailabilityWindow[]>([]);
  loading = signal(false);
  saving = signal(false);
  error = signal('');
  formError = signal('');
  actionMessage = signal('');
  editingWindowId = signal<number | null>(null);
  currentMonth = signal(this.startOfMonth(new Date()));
  isDateModalOpen = signal(false);
  selectedDateForModal = signal<string>('');

  form = signal({
    fromDate: this.toDateInputValue(new Date()),
    fromTime: '08:00',
    toDate: this.toDateInputValue(new Date()),
    toTime: '20:00',
  });

  selectedDateRanges = computed(() => {
    const dateKey = this.selectedDateForModal();
    if (!dateKey) return [];
    return this.getAvailabilityRangesForDateKey(dateKey);
  });

  selectedDateWindows = computed(() => {
    const dateKey = this.selectedDateForModal();
    if (!dateKey) return [];
    return this.getAvailabilityWindowsForDateKey(dateKey);
  });

  monthDays = computed(() => {
    const monthStart = this.currentMonth();
    const monthStartWeekday = (monthStart.getDay() + 6) % 7;
    const gridStart = new Date(monthStart);
    gridStart.setDate(monthStart.getDate() - monthStartWeekday);

    const cells: Array<{ date: Date; key: string; inCurrentMonth: boolean; hasAvailable: boolean; availableRanges: string[] }> = [];

    for (let i = 0; i < 42; i += 1) {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + i);
      const key = this.toDateInputValue(date);
      const ranges = this.getAvailabilityRangesForDateKey(key);

      cells.push({
        date,
        key,
        inCurrentMonth: date.getMonth() === monthStart.getMonth(),
        hasAvailable: ranges.length > 0,
        availableRanges: ranges,
      });
    }

    return cells;
  });

  filteredWindows = computed(() => {
    const month = this.currentMonth();
    const monthStart = new Date(month.getFullYear(), month.getMonth(), 1, 0, 0, 0, 0).getTime();
    const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 1, 0, 0, 0, 0).getTime();

    return this.windows().filter((item) => {
      const from = new Date(item.fromDateTime).getTime();
      const to = new Date(item.toDateTime).getTime();
      return from < monthEnd && to > monthStart;
    });
  });

  monthLabel = computed(() => {
    return new Intl.DateTimeFormat('ca-ES', {
      month: 'long',
      year: 'numeric',
    }).format(this.currentMonth());
  });

  monthName = computed(() => {
    return new Intl.DateTimeFormat('ca-ES', {
      month: 'long',
    }).format(this.currentMonth());
  });

  constructor(
    private authService: AuthService,
    private dataService: DataService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    this.loadWindows();
  }

  get currentUserLabel() {
    const user = this.authService.getCurrentUser();
    if (!user) {
      return '';
    }

    return `${user.nCarnet} - ${user.name} ${user.lastName || ''}`.trim();
  }

  get currentUserNCarnet() {
    return this.authService.getCurrentUser()?.nCarnet || '';
  }

  loadWindows() {
    const userNCarnet = this.currentUserNCarnet;

    if (!userNCarnet) {
      this.error.set('No s\'ha pogut identificar l\'usuari actual.');
      this.windows.set([]);
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.dataService.getAvailabilityWindows({ userNCarnet }).subscribe({
      next: (items) => {
        this.windows.set(items.filter((item) => item.availabilityType === 'available'));
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.windows.set([]);
        this.error.set(err.message || 'No s\'ha pogut carregar les finestres de disponibilitat.');
      },
    });
  }

  updateFormField(
    field: 'fromDate' | 'fromTime' | 'toDate' | 'toTime',
    value: string
  ) {
    this.formError.set('');
    this.form.set({
      ...this.form(),
      [field]: value,
    });
  }

  previousMonth() {
    const month = new Date(this.currentMonth());
    month.setMonth(month.getMonth() - 1);
    this.currentMonth.set(this.startOfMonth(month));
  }

  nextMonth() {
    const month = new Date(this.currentMonth());
    month.setMonth(month.getMonth() + 1);
    this.currentMonth.set(this.startOfMonth(month));
  }

  saveWindow() {
    const userNCarnet = this.currentUserNCarnet;

    if (!userNCarnet) {
      this.formError.set('No s\'ha pogut identificar l\'usuari actual.');
      return;
    }

    const current = this.form();
    if (!current.fromDate || !current.toDate || !current.fromTime || !current.toTime) {
      this.formError.set('Completa data i hora d\'inici/fi.');
      return;
    }

    const fromDay = new Date(`${current.fromDate}T00:00:00`).getTime();
    const toDay = new Date(`${current.toDate}T00:00:00`).getTime();
    if (fromDay > toDay) {
      this.formError.set('La data de fi ha de ser igual o posterior a la d\'inici.');
      return;
    }

    const sameDayFrom = new Date(`2000-01-01T${current.fromTime}:00`).getTime();
    const sameDayTo = new Date(`2000-01-01T${current.toTime}:00`).getTime();
    if (sameDayFrom >= sameDayTo) {
      this.formError.set('L\'hora de fi ha de ser posterior a l\'hora d\'inici.');
      return;
    }

    this.formError.set('');
    this.actionMessage.set('');
    this.saving.set(true);

    const onSuccess = (createdCount: number = 1) => {
      this.saving.set(false);
      if (this.editingWindowId()) {
        this.actionMessage.set('Finestra actualitzada.');
      } else {
        this.actionMessage.set(createdCount > 1 ? `${createdCount} finestres creades.` : 'Finestra creada.');
      }
      this.resetForm();
      this.loadWindows();
    };

    const onError = (err: any) => {
      this.saving.set(false);
      let errorMessage = 'No s\'ha pogut desar la finestra.';
      
      // Extraer el mensaje de error de diferentes formatos posibles
      if (err?.error?.message) {
        errorMessage = err.error.message;
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      this.formError.set(errorMessage);
      console.error('Error saving availability window:', err);
    };

    if (this.editingWindowId()) {
      const fromDateTime = this.composeDateTime(current.fromDate, current.fromTime);
      const toDateTime = this.composeDateTime(current.toDate, current.toTime);
      const payload = {
        userNCarnet,
        fromDateTime,
        toDateTime,
        availabilityType: 'available' as const,
        source: 'manual' as const,
      };

      this.dataService.updateAvailabilityWindow(this.editingWindowId() as number, payload).subscribe({
        next: () => onSuccess(1),
        error: onError,
      });
      return;
    }

    const dateRange = this.buildDateRange(current.fromDate, current.toDate);
    const requests = dateRange.map((date) => {
      const payload = {
        userNCarnet,
        fromDateTime: this.composeDateTime(date, current.fromTime),
        toDateTime: this.composeDateTime(date, current.toTime),
        availabilityType: 'available' as const,
        source: 'manual' as const,
      };
      return this.dataService.createAvailabilityWindow(payload);
    });

    forkJoin(requests).subscribe({
      next: () => onSuccess(dateRange.length),
      error: onError,
    });
  }

  editWindow(window: AvailabilityWindow) {
    this.editingWindowId.set(window.id);
    this.form.set({
      fromDate: this.extractDateValue(window.fromDateTime),
      fromTime: this.extractTimeValue(window.fromDateTime),
      toDate: this.extractDateValue(window.toDateTime),
      toTime: this.extractTimeValue(window.toDateTime),
    });

    this.error.set('');
    this.formError.set('');
    this.actionMessage.set('');
  }

  deleteWindow(item: AvailabilityWindow) {
    const confirmed = window.confirm('Vols eliminar aquesta finestra de disponibilitat?');
    if (!confirmed) {
      return;
    }

    this.error.set('');
    this.formError.set('');
    this.actionMessage.set('');

    this.dataService.deleteAvailabilityWindow(item.id).subscribe({
      next: () => {
        this.actionMessage.set('Finestra eliminada.');
        if (this.editingWindowId() === item.id) {
          this.resetForm();
        }
        this.loadWindows();
      },
      error: (err) => {
        this.error.set(err.message || 'No s\'ha pogut eliminar la finestra.');
      },
    });
  }

  resetForm() {
    this.editingWindowId.set(null);
    this.form.set({
      fromDate: this.toDateInputValue(new Date()),
      fromTime: '08:00',
      toDate: this.toDateInputValue(new Date()),
      toTime: '20:00',
    });
    this.formError.set('');
  }

  goHome() {
    this.router.navigate(['/home']);
  }

  formatDateTime(date: Date | string | null | undefined): string {
    return this.dateFormatService.formatDateTime(date);
  }

  formatDateOnly(date: Date | string | null | undefined): string {
    const parsed = this.parseDateValue(date);
    if (!parsed) return '';
    return this.spainDateFormatter.format(parsed);
  }

  formatTimeOnly(date: Date | string | null | undefined): string {
    const parsed = this.parseDateValue(date);
    if (!parsed) return '';
    return this.spainTimeFormatter.format(parsed);
  }

  formatDateForDisplay(dateISO: string | null | undefined): string {
    if (!dateISO) return '';
    
    // Convert YYYY-MM-DD to DD/MM/YYYY for display
    const match = dateISO.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const [, year, month, day] = match;
      return `${day}/${month}/${year}`;
    }
    
    return dateISO;
  }

  convertDisplayDateToISO(dateDisplay: string): string {
    if (!dateDisplay || dateDisplay.trim() === '') return '';
    
    // Convert DD/MM/YYYY to YYYY-MM-DD
    const match = dateDisplay.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (match) {
      const [, day, month, year] = match;
      const dayPad = String(day).padStart(2, '0');
      const monthPad = String(month).padStart(2, '0');
      return `${year}-${monthPad}-${dayPad}`;
    }
    
    // If already in YYYY-MM-DD format, return as is
    if (dateDisplay.match(/^\d{4}-\d{2}-\d{2}/)) {
      return dateDisplay;
    }
    
    return '';
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

  private getAvailabilityRangesForDateKey(dateKey: string): string[] {
    const dayStart = new Date(`${dateKey}T00:00:00`).getTime();
    const dayEnd = new Date(`${dateKey}T23:59:59`).getTime();

    return this.windows()
      .filter((item) => {
      const from = new Date(item.fromDateTime).getTime();
      const to = new Date(item.toDateTime).getTime();
      return to > dayStart && from < dayEnd && item.availabilityType === 'available';
      })
      .map((w) => ({
        from: new Date(w.fromDateTime),
        to: new Date(w.toDateTime),
      }))
      .sort((a, b) => a.from.getTime() - b.from.getTime())
      .map((window) => {
        const start = new Date(Math.max(window.from.getTime(), dayStart));
        const end = new Date(Math.min(window.to.getTime(), dayEnd));
        const fromTime = `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`;
        const toTime = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`;
        return `${fromTime} - ${toTime}`;
      });
  }

  private getAvailabilityWindowsForDateKey(dateKey: string): Array<{ id: number; range: string; window: AvailabilityWindow }> {
    const dayStart = new Date(`${dateKey}T00:00:00`).getTime();
    const dayEnd = new Date(`${dateKey}T23:59:59`).getTime();

    return this.windows()
      .filter((item) => {
        const from = new Date(item.fromDateTime).getTime();
        const to = new Date(item.toDateTime).getTime();
        return to > dayStart && from < dayEnd && item.availabilityType === 'available';
      })
      .map((w) => ({
        from: new Date(w.fromDateTime),
        to: new Date(w.toDateTime),
        id: w.id,
        window: w,
      }))
      .sort((a, b) => a.from.getTime() - b.from.getTime())
      .map((item) => {
        const start = new Date(Math.max(item.from.getTime(), dayStart));
        const end = new Date(Math.min(item.to.getTime(), dayEnd));
        const fromTime = `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`;
        const toTime = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`;
        return {
          id: item.id,
          range: `${fromTime} - ${toTime}`,
          window: item.window,
        };
      });
  }

  private extractDateValue(value: string) {
    // Extract YYYY-MM-DD directly from ISO string to avoid timezone issues
    if (typeof value === 'string') {
      const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (match) {
        return match[0]; // Return YYYY-MM-DD format
      }
    }
    
    // Fallback to parsing
    const parsed = new Date(value);
    const local = new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  }

  private extractTimeValue(value: string) {
    // Extract HH:MM from ISO format (YYYY-MM-DDTHH:MM:SS)
    // Look specifically for the T separator to get the actual time, not date components
    const match = String(value).match(/T(\d{2}):(\d{2})/);
    if (match) {
      return `${match[1]}:${match[2]}`;
    }
    
    // Fallback for other formats
    const timeMatch = String(value).match(/(\d{2}):(\d{2})/);
    return timeMatch ? `${timeMatch[1]}:${timeMatch[2]}` : '00:00';
  }

  private composeDateTime(date: string, time: string) {
    if (!date || !time) {
      return '';
    }

    return `${date}T${time}:00`;
  }

  private parseDateValue(value: Date | string | null | undefined): Date | null {
    if (!value) return null;
    const parsed = value instanceof Date ? value : new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private toDateInputValue(date: Date) {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  }

  private buildDateRange(fromDate: string, toDate: string): string[] {
    const result: string[] = [];
    const start = new Date(`${fromDate}T00:00:00`);
    const end = new Date(`${toDate}T00:00:00`);

    const cursor = new Date(start);
    while (cursor.getTime() <= end.getTime()) {
      result.push(this.toDateInputValue(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }

    return result;
  }

  private startOfMonth(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  openDateModal(cell: any) {
    this.selectedDateForModal.set(cell.key);
    this.isDateModalOpen.set(true);
  }

  closeDateModal() {
    this.isDateModalOpen.set(false);
    this.selectedDateForModal.set('');
  }

  editWindowFromModal(windowData: AvailabilityWindow) {
    this.editingWindowId.set(windowData.id);
    this.form.set({
      fromDate: this.extractDateValue(windowData.fromDateTime),
      fromTime: this.extractTimeValue(windowData.fromDateTime),
      toDate: this.extractDateValue(windowData.toDateTime),
      toTime: this.extractTimeValue(windowData.toDateTime),
    });
    this.closeDateModal();
    // Scroll to form
    setTimeout(() => {
      const formElement = document.querySelector('.card');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }

  deleteWindowFromModal(windowId: number) {
    const window = this.windows().find((w) => w.id === windowId);
    if (window) {
      this.deleteWindow(window);
      this.closeDateModal();
    }
  }
}
