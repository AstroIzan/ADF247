import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { DataService, Convocatoria, Respuesta, User } from '../../services/data.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit {
  selectedDate = signal(this.toDateInputValue(new Date()));
  currentMonth = signal(this.startOfMonth(new Date()));
  convocatorias = signal<Convocatoria[]>([]);
  allRespuestas = signal<Respuesta[]>([]);
  users = signal<User[]>([]);
  loading = signal(false);
  error = signal('');
  respondingConvoId = signal<number | null>(null);
  showCustomModal = signal(false);
  customConvo = signal<Convocatoria | null>(null);
  customResponse = signal({
    response: true,
    fullHorari: false,
    customText: '',
    customStartTime: '',
    customEndTime: '',
  });

  monthLabel = computed(() => {
    return new Intl.DateTimeFormat('es-ES', {
      month: 'long',
      year: 'numeric',
    }).format(this.currentMonth());
  });

  weekDays = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  calendarDays = computed(() => {
    const monthStart = this.currentMonth();
    const monthStartWeekday = (monthStart.getDay() + 6) % 7;
    const gridStart = new Date(monthStart);
    gridStart.setDate(monthStart.getDate() - monthStartWeekday);

    const cells: Array<{ date: Date; key: string; inCurrentMonth: boolean; isSelected: boolean; isToday: boolean }> = [];
    const todayKey = this.toDateInputValue(new Date());
    const selectedKey = this.selectedDate();

    for (let i = 0; i < 42; i++) {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + i);
      const key = this.toDateInputValue(date);

      cells.push({
        date,
        key,
        inCurrentMonth: date.getMonth() === monthStart.getMonth(),
        isSelected: key === selectedKey,
        isToday: key === todayKey,
      });
    }

    return cells;
  });

  dayConvos = computed(() => {
    const selected = this.selectedDate();

    return this.convocatorias().filter((convo) => {
      const convoDate = new Date(convo.date);
      return this.toDateInputValue(convoDate) === selected;
    });
  });

  myRespuestas = computed(() => {
    const nCarnet = this.authService.getCurrentUser()?.nCarnet;
    if (!nCarnet) {
      return [];
    }

    return this.allRespuestas().filter((r) => r.userNCarnet === nCarnet);
  });

  daySummaryByDate = computed(() => {
    const responseByConvoId = new Map(this.myRespuestas().map((r) => [r.convoId, r]));
    const summaryMap: Record<string, { total: number; responded: number; pending: number }> = {};

    for (const convo of this.convocatorias()) {
      const dateKey = this.toDateInputValue(new Date(convo.date));

      if (!summaryMap[dateKey]) {
        summaryMap[dateKey] = {
          total: 0,
          responded: 0,
          pending: 0,
        };
      }

      summaryMap[dateKey].total += 1;

      if (responseByConvoId.has(convo.id)) {
        summaryMap[dateKey].responded += 1;
      } else {
        summaryMap[dateKey].pending += 1;
      }
    }

    return summaryMap;
  });

  userByNCarnet = computed(() => {
    return new Map(this.users().map((user) => [user.nCarnet, user]));
  });

  constructor(
    public authService: AuthService,
    private dataService: DataService,
    private router: Router
  ) {}

  ngOnInit() {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    this.loadConvocatorias();
    this.loadRespuestas();
    this.loadUsers();
  }

  loadConvocatorias() {
    this.loading.set(true);
    this.error.set('');

    this.dataService.getConvocatorias().subscribe({
      next: (items) => {
        this.convocatorias.set(items);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'Error al cargar convocatorias');
        this.loading.set(false);
      },
    });
  }

  loadRespuestas() {
    this.dataService.getRespuestas().subscribe({
      next: (items) => {
        const nCarnet = this.authService.getCurrentUser()?.nCarnet;
        if (!nCarnet) {
          this.allRespuestas.set([]);
          return;
        }

        this.allRespuestas.set(items);
      },
      error: () => {
        // En home no bloqueamos la UI si falla el listado de respuestas.
        this.allRespuestas.set([]);
      },
    });
  }

  loadUsers() {
    this.dataService.getUsers().subscribe({
      next: (items) => {
        this.users.set(items);
      },
      error: () => {
        this.users.set([]);
      },
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

  selectCalendarDate(date: Date) {
    this.selectedDate.set(this.toDateInputValue(date));

    if (
      date.getMonth() !== this.currentMonth().getMonth() ||
      date.getFullYear() !== this.currentMonth().getFullYear()
    ) {
      this.currentMonth.set(this.startOfMonth(date));
    }
  }

  getMyRespuesta(convoId: number): Respuesta | null {
    return this.myRespuestas().find((r) => r.convoId === convoId) || null;
  }

  getMyRespuestaLabel(convoId: number): string {
    const respuesta = this.getMyRespuesta(convoId);
    if (!respuesta) {
      return 'Sin responder';
    }

    return respuesta.response ? 'Disponible' : 'No disponible';
  }

  respondToConvocatoria(convoId: number, canAttend: boolean) {
    const user = this.authService.getCurrentUser();

    if (!user?.nCarnet) {
      this.error.set('No se pudo identificar el usuario para responder.');
      return;
    }

    const existing = this.getMyRespuesta(convoId);
    this.respondingConvoId.set(convoId);

    if (existing) {
      this.dataService.updateRespuesta(existing.id, { response: canAttend }).subscribe({
        next: () => {
          this.loadRespuestas();
          this.respondingConvoId.set(null);
        },
        error: (err) => {
          this.error.set(err.message || 'No se pudo guardar la respuesta.');
          this.respondingConvoId.set(null);
        },
      });

      return;
    }

    this.dataService.createRespuesta({
      convoId,
      userNCarnet: user.nCarnet,
      response: canAttend,
      isCustom: false,
      fullHorari: false,
    }).subscribe({
      next: () => {
        this.loadRespuestas();
        this.respondingConvoId.set(null);
      },
      error: (err) => {
        this.error.set(err.message || 'No se pudo guardar la respuesta.');
        this.respondingConvoId.set(null);
      },
    });
  }

  openCustomModal(convo: Convocatoria) {
    const existing = this.getMyRespuesta(convo.id);
    const parsedCustom = this.parseCustomText(existing?.customText || '');

    this.customConvo.set(convo);
    this.customResponse.set({
      response: existing?.response ?? true,
      fullHorari: existing?.fullHorari ?? false,
      customText: parsedCustom.comment,
      customStartTime: parsedCustom.customStartTime,
      customEndTime: parsedCustom.customEndTime,
    });
    this.showCustomModal.set(true);
  }

  closeCustomModal() {
    this.showCustomModal.set(false);
    this.customConvo.set(null);
  }

  updateCustomField(
    field: 'response' | 'fullHorari' | 'customText' | 'customStartTime' | 'customEndTime',
    value: boolean | string
  ) {
    this.customResponse.set({
      ...this.customResponse(),
      [field]: value,
    });
  }

  saveCustomResponse() {
    const convo = this.customConvo();
    const user = this.authService.getCurrentUser();

    if (!convo || !user?.nCarnet) {
      this.error.set('No se pudo guardar la respuesta personalizada.');
      return;
    }

    const trimmedComment = this.customResponse().customText.trim();
    const customStartTime = this.customResponse().customStartTime.trim();
    const customEndTime = this.customResponse().customEndTime.trim();

    if ((customStartTime && !customEndTime) || (!customStartTime && customEndTime)) {
      this.error.set('Si defines un horario custom, debes indicar hora de inicio y hora de fin.');
      return;
    }

    const hasComment = trimmedComment.length > 0;
    const hasCustomRange = customStartTime.length > 0 && customEndTime.length > 0;
    const isCustom = hasComment || hasCustomRange;

    const payload = {
      convoId: convo.id,
      userNCarnet: user.nCarnet,
      response: this.customResponse().response,
      isCustom,
      fullHorari: this.customResponse().fullHorari,
      customText: isCustom
        ? this.composeCustomText({
            comment: trimmedComment,
            customStartTime,
            customEndTime,
          })
        : null,
    };

    const existing = this.getMyRespuesta(convo.id);
    this.respondingConvoId.set(convo.id);

    const onSuccess = () => {
      this.loadRespuestas();
      this.respondingConvoId.set(null);
      this.closeCustomModal();
    };

    const onError = (err: any) => {
      this.error.set(err.message || 'No se pudo guardar la respuesta personalizada.');
      this.respondingConvoId.set(null);
    };

    if (existing) {
      this.dataService.updateRespuesta(existing.id, payload).subscribe({
        next: onSuccess,
        error: onError,
      });
      return;
    }

    this.dataService.createRespuesta(payload).subscribe({
      next: onSuccess,
      error: onError,
    });
  }

  deleteCustomResponse() {
    const convo = this.customConvo();

    if (!convo) {
      return;
    }

    const existing = this.getMyRespuesta(convo.id);
    if (!existing) {
      return;
    }

    this.respondingConvoId.set(convo.id);

    this.dataService.deleteRespuesta(existing.id).subscribe({
      next: () => {
        this.loadRespuestas();
        this.respondingConvoId.set(null);
        this.closeCustomModal();
      },
      error: (err) => {
        this.error.set(err.message || 'No se pudo eliminar la respuesta.');
        this.respondingConvoId.set(null);
      },
    });
  }

  hasExistingResponseForCustomConvo() {
    const convo = this.customConvo();
    if (!convo) {
      return false;
    }

    return !!this.getMyRespuesta(convo.id);
  }

  getDaySummary(dateKey: string) {
    return this.daySummaryByDate()[dateKey] || {
      total: 0,
      responded: 0,
      pending: 0,
    };
  }

  getConvocatoriaRoleSummary(convoId: number) {
    const usersByNCarnet = this.userByNCarnet();

    return this.allRespuestas().reduce(
      (summary, respuesta) => {
        if (respuesta.convoId !== convoId) {
          return summary;
        }

        const responseUser = usersByNCarnet.get(respuesta.userNCarnet);
        const isGroc = Boolean(responseUser?.roles?.isGroc);

        if (isGroc) {
          summary.groc += 1;
        } else {
          summary.noGroc += 1;
        }

        return summary;
      },
      { groc: 0, noGroc: 0 }
    );
  }

  goToDashboard() {
    if (this.authService.isAdmin()) {
      this.router.navigate(['/dashboard']);
    }
  }

  logout() {
    this.authService.logout();
  }

  private toDateInputValue(date: Date) {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  }

  private startOfMonth(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  private composeCustomText(values: { comment: string; customStartTime: string; customEndTime: string }) {
    const parts: string[] = [];

    if (values.customStartTime && values.customEndTime) {
      parts.push(`Horario custom: ${values.customStartTime} - ${values.customEndTime}`);
    }

    if (values.comment) {
      parts.push(`Comentario: ${values.comment}`);
    }

    return parts.join(' | ');
  }

  private parseCustomText(rawCustomText: string) {
    const text = rawCustomText.trim();
    const horarioRegex = /Horario custom:\s*([0-2]\d:[0-5]\d)\s*-\s*([0-2]\d:[0-5]\d)/i;
    const commentRegex = /Comentario:\s*(.*)$/i;

    const horarioMatch = text.match(horarioRegex);
    const commentMatch = text.match(commentRegex);

    const customStartTime = horarioMatch?.[1] || '';
    const customEndTime = horarioMatch?.[2] || '';

    let comment = commentMatch?.[1]?.trim() || '';

    if (!comment && text && !horarioMatch) {
      comment = text;
    }

    return {
      comment,
      customStartTime,
      customEndTime,
    };
  }
}

