import { Component, OnInit, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { DataService, Convocatoria, ConvoType, Respuesta, User } from '../../services/data.service';
import { DateFormatService } from '../../services/date-format.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit {
  private dateFormatService = inject(DateFormatService);
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
  adminActionFeedback = signal('');
  runningConvoAdminActionKey = signal<string | null>(null);
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
  showGuardiaResponsesModal = signal(false);
  guardiaResponsesConvo = signal<Convocatoria | null>(null);
  showRespuestaInfoModal = signal(false);
  respuestaInfo = signal<{
    userName: string;
    customStartTime: string;
    customEndTime: string;
    comment: string;
    fullHorari: boolean;
  } | null>(null);
  showCreateConvoModal = signal(false);
  showCreateResponsableMenu = signal(false);
  showAdminResponsableMenu = signal(false);
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
    autoAssignResponsable: true,
    sortida: false,
  });

  monthLabel = computed(() => {
    return new Intl.DateTimeFormat('ca-ES', {
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
        this.error.set(err.message || 'Error en carregar convocatories');
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

  getSortidaBadgeLabel(sortida?: boolean) {
    return sortida ? 'Se surt' : 'No se surt';
  }

  getResponsableRoleLabel(userId: number | null): 'groc' | 'verd' | '' {
    if (!userId) {
      return '';
    }

    const user = this.users().find((item) => item.id === userId);
    if (!user) {
      return '';
    }

    return user.roles?.isGroc ? 'groc' : 'verd';
  }

  getResponsableLeadershipLabel(userId: number | null): 'cap-operatiu' | 'cap-colla' | '' {
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

  getResponsablePickerName(userId: number | null): string {
    if (!userId) {
      return 'Selecciona responsable';
    }

    const user = this.users().find((item) => item.id === userId);
    if (!user) {
      return 'Selecciona responsable';
    }

    return `${user.name} ${user.lastName || ''}`.trim();
  }

  toggleCreateResponsableMenu() {
    this.showCreateResponsableMenu.set(!this.showCreateResponsableMenu());
  }

  toggleAdminResponsableMenu() {
    this.showAdminResponsableMenu.set(!this.showAdminResponsableMenu());
  }

  selectCreateResponsable(userId: number) {
    this.updateCreateConvoField('responsableId', userId);
    this.showCreateResponsableMenu.set(false);
  }

  selectAdminResponsable(userId: number) {
    this.updateAdminConvoField('responsableId', String(userId));
    this.showAdminResponsableMenu.set(false);
  }

  isRunningConvoAdminAction(action: 'sortida' | 'automation', convoId: number) {
    return this.runningConvoAdminActionKey() === `${action}-${convoId}`;
  }

  toggleConvoSortida(convo: Convocatoria) {
    if (!this.authService.isAdmin()) {
      return;
    }

    if (this.isConvocatoriaClosed(convo)) {
      this.error.set('La convocatòria està tancada i no permet canviar la sortida manualment.');
      return;
    }

    this.error.set('');
    this.adminActionFeedback.set('');
    this.runningConvoAdminActionKey.set(`sortida-${convo.id}`);

    this.dataService.updateConvocatoria(convo.id, { sortida: !convo.sortida }).subscribe({
      next: (updatedConvo) => {
        this.runningConvoAdminActionKey.set(null);
        this.replaceConvocatoriaInState(updatedConvo);
        this.adminActionFeedback.set(`Sortida actualitzada per a ${updatedConvo.title}.`);
      },
      error: (err) => {
        this.runningConvoAdminActionKey.set(null);
        this.error.set(err.message || 'No s\'ha pogut actualitzar la sortida.');
      },
    });
  }

  runConvoAutomation(convo: Convocatoria) {
    if (!this.authService.isAdmin()) {
      return;
    }

    this.error.set('');
    this.adminActionFeedback.set('');
    this.runningConvoAdminActionKey.set(`automation-${convo.id}`);

    this.dataService.runConvocatoriaNotificationAutomation(convo.id).subscribe({
      next: (result) => {
        this.runningConvoAdminActionKey.set(null);
        const sortidaSummary = result?.sortidaSummary;
        const sortidaSent = sortidaSummary && !sortidaSummary.skipped;

        this.loadConvocatorias();
        this.adminActionFeedback.set(
          sortidaSent
            ? `Automatitzacio enviada per a ${convo.title}: pendents + estat de sortida.`
            : `Automatitzacio enviada per a ${convo.title}: avís de pendents (sense estat de sortida encara).`
        );
      },
      error: (err) => {
        this.runningConvoAdminActionKey.set(null);
        this.error.set(err.message || 'No s\'ha pogut executar l\'automatitzacio de notificacions.');
      },
    });
  }

  getMyRespuestaLabel(convoId: number): string {
    const respuesta = this.getMyRespuesta(convoId);
    if (!respuesta) {
      return 'Sense respondre';
    }

    return respuesta.response ? 'Disponible' : 'No disponible';
  }

  respondToConvocatoria(convoId: number, canAttend: boolean) {
    const user = this.authService.getCurrentUser();
    const convo = this.convocatorias().find((item) => item.id === convoId);

    if (!convo) {
      this.error.set('No s\'ha trobat la convocatòria per respondre.');
      return;
    }

    if (this.isConvocatoriaClosed(convo)) {
      this.error.set('Aquesta convocatòria ja no està disponible per respondre.');
      return;
    }

    if (!user?.nCarnet) {
      this.error.set('No s\'ha pogut identificar l\'usuari per respondre.');
      return;
    }

    const existing = this.getMyRespuesta(convoId);
    this.respondingConvoId.set(convoId);

    if (existing) {
      this.dataService.updateRespuesta(existing.id, { response: canAttend, fullHorari: canAttend }).subscribe({
        next: () => {
          this.loadRespuestas();
          this.respondingConvoId.set(null);
        },
        error: (err) => {
          this.error.set(err.message || 'No s\'ha pogut desar la resposta.');
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
      fullHorari: canAttend,
    }).subscribe({
      next: () => {
        this.loadRespuestas();
        this.respondingConvoId.set(null);
      },
      error: (err) => {
        this.error.set(err.message || 'No s\'ha pogut desar la resposta.');
        this.respondingConvoId.set(null);
      },
    });
  }

  openCustomModal(convo: Convocatoria) {
    if (this.isConvocatoriaClosed(convo)) {
      this.error.set('Aquesta convocatòria ja no està disponible per modificar respostes.');
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

    // Validación real-time de rango de horarios
    if (field === 'customStartTime' || field === 'customEndTime') {
      const updated = this.customResponse();
      const startTime = field === 'customStartTime' ? (value as string) : updated.customStartTime;
      const endTime = field === 'customEndTime' ? (value as string) : updated.customEndTime;

      this.error.set('');

      if (startTime && endTime && startTime >= endTime) {
        this.error.set('L\'hora de fi ha de ser posterior a la d\'inici.');
      }
    }
  }

  saveCustomResponse() {
    const convo = this.customConvo();
    const user = this.authService.getCurrentUser();

    if (!convo || !user?.nCarnet) {
      this.error.set('No s\'ha pogut desar la resposta personalitzada.');
      return;
    }

    if (this.isConvocatoriaClosed(convo)) {
      this.error.set('Aquesta convocatòria ja no està disponible per respondre.');
      return;
    }

    const trimmedComment = this.customResponse().customText.trim();
    const customStartTime = this.customResponse().customStartTime.trim();
    const customEndTime = this.customResponse().customEndTime.trim();

    if ((customStartTime && !customEndTime) || (!customStartTime && customEndTime)) {
      this.error.set('Si defineixes un horari personalitzat, has d\'indicar hora d\'inici i hora de fi.');
      return;
    }

    if (customStartTime && customEndTime && customStartTime >= customEndTime) {
      this.error.set('L\'hora de fi ha de ser posterior a la d\'inici.');
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
      this.error.set(err.message || 'No s\'ha pogut desar la resposta personalitzada.');
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
      this.error.set('Aquesta convocatòria ja no permet canvis.');
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
        this.error.set(err.message || 'No s\'ha pogut eliminar la resposta.');
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

  canOpenGuardiaResponses(convo: Convocatoria) {
    if (!this.isGuardiaConvocatoria(convo)) {
      return false;
    }

    if (this.authService.isAdmin()) {
      return true;
    }

    const currentUserId = this.authService.getCurrentUser()?.id;
    return Boolean(currentUserId && convo.responsableId === currentUserId);
  }

  openGuardiaResponsesModal(convo: Convocatoria) {
    if (!this.canOpenGuardiaResponses(convo)) {
      return;
    }

    this.guardiaResponsesConvo.set(convo);
    this.showGuardiaResponsesModal.set(true);
  }

  closeGuardiaResponsesModal() {
    this.showGuardiaResponsesModal.set(false);
    this.guardiaResponsesConvo.set(null);
  }

  getPositiveRespuestasForConvocatoria(convoId: number) {
    const usersByNCarnet = this.userByNCarnet();

    return this.allRespuestas()
      .filter((respuesta) => respuesta.convoId === convoId && respuesta.response)
      .sort((left, right) => {
        const leftCreatedAt = usersByNCarnet.get(left.userNCarnet)?.createdAt;
        const rightCreatedAt = usersByNCarnet.get(right.userNCarnet)?.createdAt;
        const leftTime = leftCreatedAt ? new Date(leftCreatedAt).getTime() : Number.MAX_SAFE_INTEGER;
        const rightTime = rightCreatedAt ? new Date(rightCreatedAt).getTime() : Number.MAX_SAFE_INTEGER;

        if (leftTime !== rightTime) {
          return leftTime - rightTime;
        }

        const byName = this.getUserNameByNCarnet(left.userNCarnet).localeCompare(this.getUserNameByNCarnet(right.userNCarnet));
        if (byName !== 0) {
          return byName;
        }

        return String(left.userNCarnet || '').localeCompare(String(right.userNCarnet || ''));
      });
  }

  hasRespuestaInfo(respuesta: Respuesta) {
    const parsed = this.parseCustomText(respuesta.customText || '');
    return Boolean(parsed.comment || (parsed.customStartTime && parsed.customEndTime));
  }

  openRespuestaInfoModal(respuesta: Respuesta) {
    const parsed = this.parseCustomText(respuesta.customText || '');
    this.respuestaInfo.set({
      userName: this.getUserNameByNCarnet(respuesta.userNCarnet),
      customStartTime: parsed.customStartTime,
      customEndTime: parsed.customEndTime,
      comment: parsed.comment,
      fullHorari: Boolean(respuesta.fullHorari),
    });
    this.showRespuestaInfoModal.set(true);
  }

  closeRespuestaInfoModal() {
    this.showRespuestaInfoModal.set(false);
    this.respuestaInfo.set(null);
  }

  canViewConvocatoriaSummary(convo: Convocatoria) {
    if (this.authService.isAdmin()) {
      return true;
    }

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      return false;
    }

    if (Number(convo.responsableId) === Number(currentUser.id)) {
      return true;
    }

    const responsableUser = this.userById().get(convo.responsableId);
    if (!responsableUser?.nCarnet || !currentUser.nCarnet) {
      return false;
    }

    return responsableUser.nCarnet === currentUser.nCarnet;
  }

  getResponsableName(responsableId?: number) {
    if (!responsableId) {
      return '-';
    }

    const user = this.userById().get(responsableId);
    if (!user) {
      return '-';
    }

    return `${user.nCarnet} - ${user.name} ${user.lastName || ''}`.trim();
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

  isUserGrocByNCarnet(nCarnet?: string) {
    if (!nCarnet) {
      return false;
    }

    const user = this.userByNCarnet().get(nCarnet);
    return Boolean(user?.roles?.isGroc);
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
    this.showAdminResponsableMenu.set(false);
    this.showAdminConvoModal.set(true);
  }

  closeAdminConvoModal() {
    this.showAdminResponsableMenu.set(false);
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
      this.error.set('Completa titol, data, hora d\'inici, responsable i tipus.');
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
        this.error.set(err.message || 'No s\'ha pogut actualitzar la convocatòria.');
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
      autoAssignResponsable: true,
      sortida: false,
    });
    this.createConvoError.set('');
    this.showCreateResponsableMenu.set(false);
    this.showCreateConvoModal.set(true);
  }

  closeCreateConvoModal() {
    this.showCreateResponsableMenu.set(false);
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

      if (field === 'convoTypeId') {
        const forcedTitle = this.getForcedCreateTitleByTypeId(next.convoTypeId);
        if (forcedTitle) {
          next.title = forcedTitle;
        }
      }

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

    const forcedTitle = this.getForcedCreateTitleByTypeId(form.convoTypeId);
    const titleToUse = forcedTitle || (form.title || '').trim();

    if (!titleToUse || !form.responsableId || !form.convoTypeId) {
      this.createConvoError.set('Completa responsable i tipus per crear.');
      return;
    }

    const isGuardiaType = this.isGuardiaTypeById(form.convoTypeId);
    const isIncendiType = this.isIncendiTypeById(form.convoTypeId);

    let payloads: Partial<Convocatoria>[] = [];

    if (isGuardiaType) {
      if (!form.guardiaRangeStart || !form.guardiaRangeEnd) {
        this.createConvoError.set('Per a guardia has d\'indicar un rang de dates.');
        return;
      }

      if (!form.guardiaMorning && !form.guardiaAfternoon) {
        this.createConvoError.set('Selecciona almenys un torn de guardia (mati o tarda).');
        return;
      }

      payloads = this.buildGuardiaPayloads({
        ...form,
        title: titleToUse,
      });

      if (payloads.length === 0) {
        this.createConvoError.set('No hi ha dies laborables al rang seleccionat per crear guardies.');
        return;
      }
    } else if (this.isSemanalTypeById(form.convoTypeId)) {
      if (!form.semanalRangeStart || !form.semanalRangeEnd) {
        this.createConvoError.set('Per a setmanal has d\'indicar data d\'inici i de fi.');
        return;
      }

      const validSlots = (form.semanalSlots || []).filter((slot) => slot.start && slot.end);

      if (validSlots.length === 0) {
        this.createConvoError.set('Has d\'afegir almenys una franja horaria setmanal.');
        return;
      }

      const hasInvalidSlot = validSlots.some((slot) => slot.start >= slot.end);
      if (hasInvalidSlot) {
        this.createConvoError.set('Cada franja setmanal ha de tenir una hora d\'inici menor que l\'hora final.');
        return;
      }

      payloads = this.buildSemanalPayloads(
        {
          ...form,
          title: titleToUse,
        },
        validSlots
      );

      if (payloads.length === 0) {
        this.createConvoError.set('No s\'han pogut generar convocatories setmanals amb aquest rang.');
        return;
      }
    } else if (isIncendiType) {
      const readyIn = Number(form.incendiReadyInMinutes) || 0;
      if (!this.incendiReadyOptions.includes(readyIn)) {
        this.createConvoError.set('Selecciona un marge valid per a Incendi (10, 15, 20, 25 o 30 minuts).');
        return;
      }

      const now = new Date();
      const startDateTime = new Date(now.getTime() + readyIn * 60000);
      const finalDateTime = new Date(startDateTime.getTime() + 4 * 60 * 60000);
      const startDate = this.toDateInputValue(startDateTime);
      const finalDate = this.toDateInputValue(finalDateTime);

      payloads = [
        {
          title: titleToUse,
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
        this.createConvoError.set('Completa data i hora d\'inici per crear la convocatòria.');
        return;
      }

      payloads = [
        {
          title: titleToUse,
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
        this.loadRespuestas();
      },
      error: (err) => {
        this.createConvoError.set(err.message || 'No s\'ha pogut crear la convocatòria.');
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

  shouldHideCreateConvoTitleField() {
    return Boolean(this.getForcedCreateTitleByTypeId(this.createConvoForm().convoTypeId));
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

  private replaceConvocatoriaInState(updatedConvo: Convocatoria) {
    this.convocatorias.set(
      this.convocatorias().map((item) => (item.id === updatedConvo.id ? updatedConvo : item))
    );

    if (this.adminConvo()?.id === updatedConvo.id) {
      this.adminConvo.set(updatedConvo);
      this.adminConvoForm.set({
        ...this.adminConvoForm(),
        sortida: Boolean(updatedConvo.sortida),
      });
    }
  }

  private isGuardiaTypeById(convoTypeId: number | null) {
    if (!convoTypeId) {
      return false;
    }

    const type = this.convoTypes().find((item) => item.id === convoTypeId);
    return Boolean(type?.name && /guardia/i.test(type.name));
  }

  private isGuardiaConvocatoria(convo: Convocatoria) {
    const typeName = convo.convoType?.name || this.getConvoTypeName(convo.convoTypeId);
    return /guardia/i.test(typeName || '');
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

  private getForcedCreateTitleByTypeId(convoTypeId: number | null) {
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

    if (!text) {
      return {
        comment: '',
        customStartTime: '',
        customEndTime: '',
      };
    }

    // Regex mejorada: más tolerante con espacios múltiples y variaciones
    const horarioRegex = /Horario\s+custom:\s*([0-2]\d:[0-5]\d)\s*-\s*([0-2]\d:[0-5]\d)/i;
    const commentRegex = /Comentario:\s*(.+?)(?:\s*\||\s*$)/i;

    const horarioMatch = text.match(horarioRegex);
    const commentMatch = text.match(commentRegex);

    const customStartTime = horarioMatch?.[1] || '';
    const customEndTime = horarioMatch?.[2] || '';
    let comment = commentMatch?.[1]?.trim() || '';

    // Si no hay patrón reconocido, tratar todo como comentario
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

