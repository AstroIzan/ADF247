import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { DataService, Convocatoria, ConvoType, Respuesta, User } from '../../services/data.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit {
  readonly incendiReadyOptions = [10, 15, 20, 25, 30];
  readonly todayDate = this.toDateInputValue(new Date());
  readonly hourOptions = this.buildHourOptions();
  readonly minuteOptions = this.buildMinuteOptions();
  selectedDate = signal(this.toDateInputValue(new Date()));
  currentMonth = signal(this.startOfMonth(new Date()));
  convocatorias = signal<Convocatoria[]>([]);
  convoTypes = signal<ConvoType[]>([]);
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
  showAdminConvoModal = signal(false);
  adminConvo = signal<Convocatoria | null>(null);
  adminConvoSaving = signal(false);
  adminConvoForm = signal({
    title: '',
    date: '',
    ubiSortida: '',
    responsableId: null as number | null,
    convoTypeId: null as number | null,
    startTime: '',
    finalTime: '',
    moreThan2: false,
    isActive: true,
    autoAssignResponsable: false,
    sortida: false,
  });
  showCustomTextModal = signal(false);
  customTextPreview = signal('');
  showCreateConvoModal = signal(false);
  creatingConvo = signal(false);
  createConvoError = signal('');
  showTimeMenu = signal(false);
  timeMenuHour = signal('');
  timeMenuMinute = signal('');
  timeMenuContext = signal<{ field: string; index?: number } | null>(null);
  createConvoForm = signal({
    title: '',
    date: this.toDateInputValue(new Date()),
    guardiaRangeStart: this.toDateInputValue(new Date()),
    guardiaRangeEnd: this.toDateInputValue(new Date()),
    guardiaMorning: false,
    guardiaAfternoon: true,
    semanalRangeStart: this.toDateInputValue(new Date()),
    semanalRangeEnd: this.toDateInputValue(new Date()),
    semanalSlots: [{ start: '', end: '' }],
    ubiSortida: '',
    responsableId: null as number | null,
    convoTypeId: null as number | null,
    startTime: '',
    finalTime: '',
    incendiReadyInMinutes: 10,
    moreThan2: false,
    isActive: true,
    autoAssignResponsable: false,
    sortida: false,
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

    return this.convocatorias()
      .filter((convo) => {
        const convoDate = new Date(convo.date);
        return this.toDateInputValue(convoDate) === selected;
      })
      .sort((a, b) => {
        const aStart = this.getConvocatoriaStartDate(a)?.getTime() ?? Number.MAX_SAFE_INTEGER;
        const bStart = this.getConvocatoriaStartDate(b)?.getTime() ?? Number.MAX_SAFE_INTEGER;

        if (aStart !== bStart) {
          return aStart - bStart;
        }

        return a.id - b.id;
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

  dayAvailabilityByDate = computed(() => {
    const summaryMap: Record<string, { total: number; open: number; closed: number }> = {};

    for (const convo of this.convocatorias()) {
      const dateKey = this.toDateInputValue(new Date(convo.date));

      if (!summaryMap[dateKey]) {
        summaryMap[dateKey] = {
          total: 0,
          open: 0,
          closed: 0,
        };
      }

      summaryMap[dateKey].total += 1;

      if (this.isConvocatoriaClosed(convo)) {
        summaryMap[dateKey].closed += 1;
      } else {
        summaryMap[dateKey].open += 1;
      }
    }

    return summaryMap;
  });

  userByNCarnet = computed(() => {
    return new Map(this.users().map((user) => [user.nCarnet, user]));
  });

  userById = computed(() => {
    return new Map(this.users().map((user) => [user.id, user]));
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
    this.loadConvoTypes();
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

  loadConvoTypes() {
    this.dataService.getConvoTypes().subscribe({
      next: (items) => {
        this.convoTypes.set(items);
      },
      error: () => {
        this.convoTypes.set([]);
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
    const convo = this.convocatorias().find((item) => item.id === convoId);

    if (!convo) {
      this.error.set('No se encontro la convocatoria para responder.');
      return;
    }

    if (this.isConvocatoriaClosed(convo)) {
      this.error.set('Esta convocatoria ya no esta disponible para responder.');
      return;
    }

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
    if (this.isConvocatoriaClosed(convo)) {
      this.error.set('Esta convocatoria ya no esta disponible para modificar respuestas.');
      return;
    }

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

    if (this.isConvocatoriaClosed(convo)) {
      this.error.set('Esta convocatoria ya no esta disponible para responder.');
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

    if (this.isConvocatoriaClosed(convo)) {
      this.error.set('Esta convocatoria ya no permite cambios.');
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

  getDayAvailability(dateKey: string) {
    return this.dayAvailabilityByDate()[dateKey] || {
      total: 0,
      open: 0,
      closed: 0,
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

  getRespuestasForConvocatoria(convoId: number) {
    return this.allRespuestas().filter((respuesta) => respuesta.convoId === convoId);
  }

  canViewConvocatoriaSummary(convo: Convocatoria) {
    if (this.authService.isAdmin()) {
      return true;
    }

    const currentUserId = this.authService.getCurrentUser()?.id;
    if (!currentUserId) {
      return false;
    }

    return convo.responsableId === currentUserId;
  }

  getResponsableName(responsableId?: number) {
    if (!responsableId) {
      return '-';
    }

    const user = this.userById().get(responsableId);
    if (!user) {
      return '-';
    }

    return `${user.name} ${user.lastName || ''}`.trim();
  }

  getConvoTypeName(convoTypeId?: number) {
    if (!convoTypeId) {
      return '-';
    }

    const type = this.convoTypes().find((item) => item.id === convoTypeId);
    return type?.name || '-';
  }

  getUserNameByNCarnet(nCarnet?: string) {
    if (!nCarnet) {
      return '-';
    }

    const user = this.userByNCarnet().get(nCarnet);
    if (!user) {
      return nCarnet;
    }

    return `${user.name} ${user.lastName || ''}`.trim();
  }

  openAdminConvoModal(convo: Convocatoria) {
    if (!this.authService.isAdmin()) {
      return;
    }

    this.adminConvo.set(convo);
    this.adminConvoForm.set({
      title: convo.title || '',
      date: this.extractDateValue(convo.date),
      ubiSortida: convo.ubiSortida || '',
      responsableId: convo.responsableId || null,
      convoTypeId: convo.convoTypeId || null,
      startTime: this.extractTimeValue(convo.startTime),
      finalTime: this.extractTimeValue(convo.finalTime),
      moreThan2: Boolean(convo.moreThan2),
      isActive: Boolean(convo.isActive),
      autoAssignResponsable: Boolean(convo.autoAssignResponsable),
      sortida: Boolean(convo.sortida),
    });
    this.showAdminConvoModal.set(true);
  }

  closeAdminConvoModal() {
    this.showAdminConvoModal.set(false);
    this.adminConvo.set(null);
  }

  updateAdminConvoField(
    field: 'title' | 'date' | 'ubiSortida' | 'responsableId' | 'convoTypeId' | 'startTime' | 'finalTime' | 'moreThan2' | 'isActive' | 'autoAssignResponsable' | 'sortida',
    value: string | boolean
  ) {
    const current = this.adminConvoForm();

    if (field === 'responsableId' || field === 'convoTypeId') {
      const next = {
        ...current,
        [field]: value ? Number(value) : null,
      };

      if (field === 'convoTypeId') {
        const defaultLocation = this.getConvoTypeDefaultLocation(next.convoTypeId);
        if (defaultLocation) {
          next.ubiSortida = defaultLocation;
        }
      }

      this.adminConvoForm.set(next);
      return;
    }

    this.adminConvoForm.set({
      ...current,
      [field]: value,
    });
  }

  saveAdminConvoChanges() {
    const convo = this.adminConvo();
    const form = this.adminConvoForm();

    if (!convo) {
      return;
    }

    if (!form.title || !form.date || !form.responsableId || !form.convoTypeId || !form.startTime) {
      this.error.set('Completa titulo, fecha, hora inicio, responsable y tipo.');
      return;
    }

    const payload: Partial<Convocatoria> = {
      title: form.title.trim(),
      date: `${form.date}T00:00:00`,
      ubiSortida: form.ubiSortida.trim(),
      responsableId: form.responsableId,
      convoTypeId: form.convoTypeId,
      startTime: this.composeDateTime(form.date, form.startTime),
      finalTime: form.finalTime ? this.composeDateTime(form.date, form.finalTime) : undefined,
      moreThan2: form.moreThan2,
      isActive: form.isActive,
      autoAssignResponsable: form.autoAssignResponsable,
      sortida: form.sortida,
    };

    this.adminConvoSaving.set(true);

    this.dataService.updateConvocatoria(convo.id, payload).subscribe({
      next: () => {
        this.adminConvoSaving.set(false);
        this.closeAdminConvoModal();
        this.loadConvocatorias();
      },
      error: (err) => {
        this.error.set(err.message || 'No se pudo actualizar la convocatoria.');
        this.adminConvoSaving.set(false);
      },
    });
  }

  openCustomTextModal(customText?: string | null) {
    if (!customText?.trim()) {
      return;
    }

    this.customTextPreview.set(customText);
    this.showCustomTextModal.set(true);
  }

  closeCustomTextModal() {
    this.showCustomTextModal.set(false);
    this.customTextPreview.set('');
  }

  openCreateConvoModal() {
    if (!this.authService.isAdmin()) {
      return;
    }

    this.createConvoForm.set({
      title: '',
      date: this.selectedDate(),
      guardiaRangeStart: this.selectedDate(),
      guardiaRangeEnd: this.selectedDate(),
      guardiaMorning: false,
      guardiaAfternoon: true,
      semanalRangeStart: this.selectedDate(),
      semanalRangeEnd: this.selectedDate(),
      semanalSlots: [{ start: '', end: '' }],
      ubiSortida: '',
      responsableId: null,
      convoTypeId: null,
      startTime: '',
      finalTime: '',
      incendiReadyInMinutes: 10,
      moreThan2: false,
      isActive: true,
      autoAssignResponsable: false,
      sortida: false,
    });
    this.createConvoError.set('');
    this.showCreateConvoModal.set(true);
  }

  closeCreateConvoModal() {
    this.createConvoError.set('');
    this.showCreateConvoModal.set(false);
  }

  updateCreateConvoField(
    field:
      | 'title'
      | 'date'
      | 'guardiaRangeStart'
      | 'guardiaRangeEnd'
      | 'guardiaMorning'
      | 'guardiaAfternoon'
      | 'semanalRangeStart'
      | 'semanalRangeEnd'
      | 'ubiSortida'
      | 'responsableId'
      | 'convoTypeId'
      | 'startTime'
      | 'finalTime'
      | 'incendiReadyInMinutes'
      | 'moreThan2'
      | 'isActive'
      | 'autoAssignResponsable'
      | 'sortida',
    value: string | number | boolean
  ) {
    const current = this.createConvoForm();

    if (field === 'responsableId' || field === 'convoTypeId') {
      const next = {
        ...current,
        [field]: value ? Number(value) : null,
      };

      if (field === 'convoTypeId' && this.isGuardiaTypeById(next.convoTypeId)) {
        next.guardiaRangeStart = current.date || this.selectedDate();
        next.guardiaRangeEnd = current.date || this.selectedDate();
        next.ubiSortida = this.getConvoTypeDefaultLocation(next.convoTypeId) || 'Brigadas';

        if (!next.guardiaMorning && !next.guardiaAfternoon) {
          next.guardiaAfternoon = true;
        }
      }

      if (field === 'convoTypeId' && this.isSemanalTypeById(next.convoTypeId)) {
        next.semanalRangeStart = current.date || this.selectedDate();
        next.semanalRangeEnd = current.date || this.selectedDate();

        if (!next.semanalSlots?.length) {
          next.semanalSlots = [{ start: '', end: '' }];
        }
      }

      if (field === 'convoTypeId' && this.isIncendiTypeById(next.convoTypeId)) {
        next.incendiReadyInMinutes = 10;
        next.date = this.todayDate;
        next.ubiSortida = this.getConvoTypeDefaultLocation(next.convoTypeId) || 'Brigadas';
        next.startTime = '';
        next.finalTime = '';
      }

      if (
        field === 'convoTypeId' &&
        !this.isGuardiaTypeById(next.convoTypeId) &&
        !this.isIncendiTypeById(next.convoTypeId)
      ) {
        const defaultLocation = this.getConvoTypeDefaultLocation(next.convoTypeId);
        if (defaultLocation) {
          next.ubiSortida = defaultLocation;
        }
      }

      this.createConvoForm.set(next);
      return;
    }

    if (field === 'incendiReadyInMinutes') {
      this.createConvoForm.set({
        ...current,
        incendiReadyInMinutes: Number(value) || 10,
      });
      return;
    }

    this.createConvoForm.set({
      ...current,
      [field]: value,
    });
  }

  createConvocatoriaFromHome() {
    const form = this.createConvoForm();
    this.createConvoError.set('');

    if (!form.title || !form.responsableId || !form.convoTypeId) {
      this.createConvoError.set('Completa titulo, responsable y tipo para crear.');
      return;
    }

    const isGuardiaType = this.isGuardiaTypeById(form.convoTypeId);
    const isIncendiType = this.isIncendiTypeById(form.convoTypeId);

    let payloads: Partial<Convocatoria>[] = [];

    if (isGuardiaType) {
      if (!form.guardiaRangeStart || !form.guardiaRangeEnd) {
        this.createConvoError.set('Para guardia debes indicar rango de fechas.');
        return;
      }

      if (!form.guardiaMorning && !form.guardiaAfternoon) {
        this.createConvoError.set('Selecciona al menos un turno de guardia (manana o tarde).');
        return;
      }

      payloads = this.buildGuardiaPayloads(form);

      if (payloads.length === 0) {
        this.createConvoError.set('No hay dias laborables en el rango seleccionado para crear guardias.');
        return;
      }
    } else if (this.isSemanalTypeById(form.convoTypeId)) {
      if (!form.semanalRangeStart || !form.semanalRangeEnd) {
        this.createConvoError.set('Para semanal debes indicar fecha de inicio y fin.');
        return;
      }

      const validSlots = (form.semanalSlots || []).filter((slot) => slot.start && slot.end);

      if (validSlots.length === 0) {
        this.createConvoError.set('Debes anadir al menos una franja horaria semanal.');
        return;
      }

      const hasInvalidSlot = validSlots.some((slot) => slot.start >= slot.end);
      if (hasInvalidSlot) {
        this.createConvoError.set('Cada franja semanal debe tener una hora de inicio menor que la hora final.');
        return;
      }

      payloads = this.buildSemanalPayloads(form, validSlots);

      if (payloads.length === 0) {
        this.createConvoError.set('No se pudieron generar convocatorias semanales con ese rango.');
        return;
      }
    } else if (isIncendiType) {
      const readyIn = Number(form.incendiReadyInMinutes) || 0;
      if (!this.incendiReadyOptions.includes(readyIn)) {
        this.createConvoError.set('Selecciona un margen valido para Incendi (10, 15, 20, 25 o 30 minutos).');
        return;
      }

      const now = new Date();
      const startDateTime = new Date(now.getTime() + readyIn * 60000);
      const finalDateTime = new Date(startDateTime.getTime() + 4 * 60 * 60000);
      const startDate = this.toDateInputValue(startDateTime);
      const finalDate = this.toDateInputValue(finalDateTime);

      payloads = [
        {
          title: form.title.trim(),
          date: `${startDate}T00:00:00`,
          ubiSortida: (form.ubiSortida || '').trim() || 'Brigadas',
          responsableId: form.responsableId,
          convoTypeId: form.convoTypeId,
          startTime: this.composeDateTime(startDate, this.toTimeInputValue(startDateTime)),
          finalTime: this.composeDateTime(finalDate, this.toTimeInputValue(finalDateTime)),
          moreThan2: form.moreThan2,
          isActive: form.isActive,
          autoAssignResponsable: form.autoAssignResponsable,
          sortida: form.sortida,
        },
      ];
    } else {
      if (!form.date || !form.startTime) {
        this.createConvoError.set('Completa fecha y hora inicio para crear la convocatoria.');
        return;
      }

      payloads = [
        {
          title: form.title.trim(),
          date: `${form.date}T00:00:00`,
          ubiSortida: form.ubiSortida.trim(),
          responsableId: form.responsableId,
          convoTypeId: form.convoTypeId,
          startTime: this.composeDateTime(form.date, form.startTime),
          finalTime: form.finalTime ? this.composeDateTime(form.date, form.finalTime) : undefined,
          moreThan2: form.moreThan2,
          isActive: form.isActive,
          autoAssignResponsable: form.autoAssignResponsable,
          sortida: form.sortida,
        },
      ];
    }

    this.creatingConvo.set(true);

    forkJoin(payloads.map((payload) => this.dataService.createConvocatoria(payload))).subscribe({
      next: () => {
        this.creatingConvo.set(false);
        this.createConvoError.set('');
        this.closeCreateConvoModal();
        this.loadConvocatorias();
      },
      error: (err) => {
        this.createConvoError.set(err.message || 'No se pudo crear la convocatoria.');
        this.creatingConvo.set(false);
      },
    });
  }

  isGuardiaTypeSelected() {
    return this.isGuardiaTypeById(this.createConvoForm().convoTypeId);
  }

  isSemanalTypeSelected() {
    return this.isSemanalTypeById(this.createConvoForm().convoTypeId);
  }

  isIncendiTypeSelected() {
    return this.isIncendiTypeById(this.createConvoForm().convoTypeId);
  }

  addSemanalSlot() {
    const current = this.createConvoForm();
    this.createConvoForm.set({
      ...current,
      semanalSlots: [...(current.semanalSlots || []), { start: '', end: '' }],
    });
  }

  removeSemanalSlot(index: number) {
    const current = this.createConvoForm();
    const slots = [...(current.semanalSlots || [])];

    if (slots.length <= 1) {
      return;
    }

    slots.splice(index, 1);

    this.createConvoForm.set({
      ...current,
      semanalSlots: slots,
    });
  }

  updateSemanalSlot(index: number, field: 'start' | 'end', value: string) {
    const current = this.createConvoForm();
    const slots = [...(current.semanalSlots || [])];

    if (!slots[index]) {
      return;
    }

    slots[index] = {
      ...slots[index],
      [field]: value,
    };

    this.createConvoForm.set({
      ...current,
      semanalSlots: slots,
    });
  }

  private isGuardiaTypeById(convoTypeId: number | null) {
    if (!convoTypeId) {
      return false;
    }

    const type = this.convoTypes().find((item) => item.id === convoTypeId);
    return Boolean(type?.name && /guardia/i.test(type.name));
  }

  private isSemanalTypeById(convoTypeId: number | null) {
    if (!convoTypeId) {
      return false;
    }

    const type = this.convoTypes().find((item) => item.id === convoTypeId);
    return Boolean(type?.name && /semanal/i.test(type.name));
  }

  private isIncendiTypeById(convoTypeId: number | null) {
    if (!convoTypeId) {
      return false;
    }

    const type = this.convoTypes().find((item) => item.id === convoTypeId);
    return Boolean(type?.name && /incendi/i.test(type.name));
  }

  private getConvoTypeDefaultLocation(convoTypeId: number | null) {
    if (!convoTypeId) {
      return '';
    }

    const type = this.convoTypes().find((item) => item.id === convoTypeId);
    return type?.defaultLocation?.trim() || '';
  }

  private buildGuardiaPayloads(form: {
    title: string;
    guardiaRangeStart: string;
    guardiaRangeEnd: string;
    guardiaMorning: boolean;
    guardiaAfternoon: boolean;
    ubiSortida: string;
    responsableId: number | null;
    convoTypeId: number | null;
    moreThan2: boolean;
    isActive: boolean;
    autoAssignResponsable: boolean;
    sortida: boolean;
  }) {
    const start = new Date(`${form.guardiaRangeStart}T00:00:00`);
    const end = new Date(`${form.guardiaRangeEnd}T00:00:00`);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start.getTime() > end.getTime()) {
      return [];
    }

    const shifts: Array<{ start: string; end: string }> = [];

    if (form.guardiaMorning) {
      shifts.push({ start: '12:00', end: '16:00' });
    }

    if (form.guardiaAfternoon) {
      shifts.push({ start: '16:00', end: '20:00' });
    }

    const payloads: Partial<Convocatoria>[] = [];
    const cursor = new Date(start);
    const endKey = this.toDateInputValue(end);

    while (this.toDateInputValue(cursor) <= endKey) {
      const dateValue = this.toDateInputValue(cursor);

      for (const shift of shifts) {
        payloads.push({
          title: form.title.trim(),
          date: `${dateValue}T00:00:00`,
          ubiSortida: (form.ubiSortida || '').trim() || 'Brigadas',
          responsableId: form.responsableId || undefined,
          convoTypeId: form.convoTypeId || undefined,
          startTime: this.composeDateTime(dateValue, shift.start),
          finalTime: this.composeDateTime(dateValue, shift.end),
          moreThan2: form.moreThan2,
          isActive: form.isActive,
          autoAssignResponsable: form.autoAssignResponsable,
          sortida: form.sortida,
        });
      }

      cursor.setDate(cursor.getDate() + 1);
    }

    return payloads;
  }

  private buildSemanalPayloads(
    form: {
      title: string;
      semanalRangeStart: string;
      semanalRangeEnd: string;
      ubiSortida: string;
      responsableId: number | null;
      convoTypeId: number | null;
      moreThan2: boolean;
      isActive: boolean;
      autoAssignResponsable: boolean;
      sortida: boolean;
    },
    slots: Array<{ start: string; end: string }>
  ) {
    const start = new Date(`${form.semanalRangeStart}T00:00:00`);
    const end = new Date(`${form.semanalRangeEnd}T00:00:00`);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start.getTime() > end.getTime()) {
      return [];
    }

    const payloads: Partial<Convocatoria>[] = [];
    const cursor = new Date(start);
    const endKey = this.toDateInputValue(end);

    while (this.toDateInputValue(cursor) <= endKey) {
      const dateValue = this.toDateInputValue(cursor);

      for (const slot of slots) {
        payloads.push({
          title: form.title.trim(),
          date: `${dateValue}T00:00:00`,
          ubiSortida: form.ubiSortida.trim(),
          responsableId: form.responsableId || undefined,
          convoTypeId: form.convoTypeId || undefined,
          startTime: this.composeDateTime(dateValue, slot.start),
          finalTime: this.composeDateTime(dateValue, slot.end),
          moreThan2: form.moreThan2,
          isActive: form.isActive,
          autoAssignResponsable: form.autoAssignResponsable,
          sortida: form.sortida,
        });
      }

      cursor.setDate(cursor.getDate() + 1);
    }

    return payloads;
  }

  isConvocatoriaClosed(convo: Convocatoria) {
    const startDate = this.getConvocatoriaStartDate(convo);

    if (!startDate) {
      return false;
    }

    return Date.now() >= startDate.getTime();
  }

  private getConvocatoriaStartDate(convo: Convocatoria): Date | null {
    if (!convo.startTime) {
      return null;
    }

    const directDate = new Date(convo.startTime);
    if (!Number.isNaN(directDate.getTime())) {
      return directDate;
    }

    if (!convo.date) {
      return null;
    }

    const match = String(convo.startTime).match(/(\d{2}:\d{2})/);
    if (!match) {
      return null;
    }

    const composedDate = new Date(`${this.toDateInputValue(new Date(convo.date))}T${match[1]}:00`);
    if (Number.isNaN(composedDate.getTime())) {
      return null;
    }

    return composedDate;
  }

  private extractDateValue(value?: string) {
    if (!value) {
      return this.selectedDate();
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return this.selectedDate();
    }

    return this.toDateInputValue(date);
  }

  private extractTimeValue(value?: string) {
    if (!value) {
      return '';
    }

    const match = String(value).match(/(\d{2}:\d{2})/);
    if (match) {
      return match[1];
    }

    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toTimeString().slice(0, 5);
    }

    return '';
  }

  private composeDateTime(date: string, time: string) {
    return `${date}T${time}:00`;
  }

  openTimePicker(input: HTMLInputElement, field: string, index?: number) {
    const normalizedValue = this.normalizeTimeValue(input.value);
    const [hour = '', minute = ''] = normalizedValue ? normalizedValue.split(':') : ['', ''];

    if (this.shouldForceCustomTimeMenu()) {
      this.timeMenuContext.set({ field, index });
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

    this.timeMenuContext.set({ field, index });
    this.timeMenuHour.set(hour);
    this.timeMenuMinute.set(minute);
    this.showTimeMenu.set(true);
  }

  closeTimeMenu() {
    this.showTimeMenu.set(false);
    this.timeMenuContext.set(null);
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
    const context = this.timeMenuContext();
    const hour = this.timeMenuHour();
    const minute = this.timeMenuMinute();
    const value = hour && minute ? `${hour}:${minute}` : '';

    if (!context || !value) {
      this.closeTimeMenu();
      return;
    }

    switch (context.field) {
      case 'customStartTime':
      case 'customEndTime':
        this.updateCustomField(context.field, value);
        break;
      case 'adminStartTime':
        this.updateAdminConvoField('startTime', value);
        break;
      case 'adminEndTime':
        this.updateAdminConvoField('finalTime', value);
        break;
      case 'createStartTime':
        this.updateCreateConvoField('startTime', value);
        break;
      case 'createEndTime':
        this.updateCreateConvoField('finalTime', value);
        break;
      case 'semanalStartTime':
        if (typeof context.index === 'number') {
          this.updateSemanalSlot(context.index, 'start', value);
        }
        break;
      case 'semanalEndTime':
        if (typeof context.index === 'number') {
          this.updateSemanalSlot(context.index, 'end', value);
        }
        break;
      default:
        break;
    }

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

  private toTimeInputValue(date: Date) {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
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

