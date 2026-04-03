import { Component, OnInit, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { CampaignVehicleCatalogItem, DataService, CampaignFormContext, CampaignFormRecord, CampaignFormSubmitPayload, CampaignFormVehicleInput, Convocatoria, ConvoType, Respuesta, User } from '../../services/data.service';
import { DateFormatService } from '../../services/date-format.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit {
  private readonly maxKmIncreasePerForm = 9999;
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
    isActive: true,
    autoAssignResponsable: false,
    sortida: false,
  });
  showCustomTextModal = signal(false);
  customTextPreview = signal('');
  showLifecycleModal = signal(false);
  lifecycleConvo = signal<Convocatoria | null>(null);
  lifecycleForm = signal({
    actualStartTime: '',
    actualEndTime: '',
  });
  showCampaignFormModal = signal(false);
  campaignFormConvo = signal<Convocatoria | null>(null);
  campaignFormMode = signal<'start' | 'finish' | null>(null);
  campaignFormContext = signal<CampaignFormContext | null>(null);
  campaignFormLoading = signal(false);
  campaignFormSubmitting = signal(false);
  showCampaignRecordsModal = signal(false);
  campaignRecordsConvo = signal<Convocatoria | null>(null);
  campaignRecords = signal<CampaignFormRecord[]>([]);
  campaignRecordsLoading = signal(false);
  campaignRecordsDeletingId = signal<number | null>(null);
  campaignRecordExpandedIds = signal<number[]>([]);
  campaignVolunteerMenuOpen = signal(false);
  campaignVehicleMenuOpen = signal(false);
  campaignVehicleVolunteerMenuVehicle = signal<string | null>(null);
  campaignConductorMenuVehicle = signal<string | null>(null);
  campaignForm = signal({
    dia: this.toDateTimeLocalValue(new Date().toISOString()),
    volunteerUserIds: [] as number[],
    vehicles: [] as Array<{
      vehicleName: string;
      kms: number;
      conductorUserId: number | null;
      volunteerUserIds: number[];
    }>,
  });
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
      return 'Sense responsable (auto-assignació)';
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

  selectCreateResponsable(userId: number | null) {
    this.updateCreateConvoField('responsableId', userId as any);
    this.showCreateResponsableMenu.set(false);
  }

  selectAdminResponsable(userId: number | null) {
    this.updateAdminConvoField('responsableId', userId !== null ? String(userId) : '');
    this.showAdminResponsableMenu.set(false);
  }

  isRunningConvoAdminAction(action: 'sortida' | 'automation' | 'start' | 'finish' | 'edit', convoId: number) {
    return this.runningConvoAdminActionKey() === `${action}-${convoId}`;
  }

  canManageConvocatoriaLifecycle(convo: Convocatoria) {
    if (this.authService.isAdmin()) {
      return true;
    }

    const currentUserId = this.authService.getCurrentUser()?.id;
    return Boolean(currentUserId && Number(convo.responsableId) === Number(currentUserId));
  }

  canStartConvocatoriaLifecycle(convo: Convocatoria) {
    if (convo.actualStartTime) {
      return false;
    }

    const convoDate = new Date(convo.date);
    if (Number.isNaN(convoDate.getTime())) {
      return false;
    }

    return this.toDateInputValue(convoDate) === this.todayDate;
  }

  getLifecycleAction(convo: Convocatoria): 'start' | 'finish' | 'edit' | null {
    if (!this.canManageConvocatoriaLifecycle(convo)) {
      return null;
    }

    if (!convo.actualStartTime) {
      return this.canStartConvocatoriaLifecycle(convo) ? 'start' : null;
    }

    if (!convo.actualEndTime) {
      return 'finish';
    }

    return 'edit';
  }

  getLifecycleActionLabel(convo: Convocatoria) {
    const action = this.getLifecycleAction(convo);

    if (action === 'start') {
      return 'Iniciar';
    }

    if (action === 'finish') {
      return 'Finalitzar';
    }

    if (action === 'edit') {
      return 'Editar horari';
    }

    return '';
  }

  onLifecycleAction(convo: Convocatoria) {
    const action = this.getLifecycleAction(convo);

    if (action === 'start') {
      this.openCampaignFormModal(convo, 'start');
      return;
    }

    if (action === 'finish') {
      this.openCampaignFormModal(convo, 'finish');
      return;
    }

    if (action === 'edit') {
      this.openLifecycleEdition(convo);
    }
  }

  startConvocatoriaLifecycle(convo: Convocatoria) {
    if (!this.canManageConvocatoriaLifecycle(convo)) {
      return;
    }

    if (!this.canStartConvocatoriaLifecycle(convo)) {
      this.error.set('Nomes pots iniciar la guardia el mateix dia de la convocatoria.');
      return;
    }

    if (this.campaignFormSubmitting()) {
      return;
    }

    this.error.set('');
    this.adminActionFeedback.set('');
    this.campaignFormSubmitting.set(true);
    this.runningConvoAdminActionKey.set(`start-${convo.id}`);

    const payload = this.buildCampaignFormPayload();

    this.dataService.startConvocatoria(convo.id, payload).subscribe({
      next: (updatedConvo) => {
        this.campaignFormSubmitting.set(false);
        this.runningConvoAdminActionKey.set(null);
        this.replaceConvocatoriaInState(updatedConvo);
        this.adminActionFeedback.set(`Convocatoria iniciada: ${updatedConvo.title}.`);
        this.closeCampaignFormModal();
      },
      error: (err) => {
        this.campaignFormSubmitting.set(false);
        this.runningConvoAdminActionKey.set(null);
        this.error.set(err.message || 'No s\'ha pogut iniciar la convocatòria.');
      },
    });
  }

  finishConvocatoriaLifecycle(convo: Convocatoria) {
    if (!this.canManageConvocatoriaLifecycle(convo)) {
      return;
    }

    if (this.campaignFormSubmitting()) {
      return;
    }

    this.error.set('');
    this.adminActionFeedback.set('');
    this.campaignFormSubmitting.set(true);
    this.runningConvoAdminActionKey.set(`finish-${convo.id}`);

    const payload = this.buildCampaignFormPayload();

    this.dataService.finishConvocatoria(convo.id, payload).subscribe({
      next: (updatedConvo) => {
        this.campaignFormSubmitting.set(false);
        this.runningConvoAdminActionKey.set(null);
        this.replaceConvocatoriaInState(updatedConvo);
        this.adminActionFeedback.set(`Convocatoria finalitzada: ${updatedConvo.title}.`);
        this.closeCampaignFormModal();
      },
      error: (err) => {
        this.campaignFormSubmitting.set(false);
        this.runningConvoAdminActionKey.set(null);
        this.error.set(err.message || 'No s\'ha pogut finalitzar la convocatòria.');
      },
    });
  }

  openCampaignFormModal(convo: Convocatoria, mode: 'start' | 'finish') {
    if (!this.canManageConvocatoriaLifecycle(convo)) {
      return;
    }

    this.campaignFormConvo.set(convo);
    this.campaignFormMode.set(mode);
    this.campaignFormLoading.set(true);
    this.error.set('');

    this.dataService.getCampaignFormContext(convo.id, mode).subscribe({
      next: (context) => {
        this.campaignFormContext.set(context);

        const prefill = mode === 'finish' ? context.prefill : null;
        const fallbackDia = this.toDateTimeLocalValue(new Date().toISOString());
        const diaValue = prefill?.dia ? this.toDateTimeLocalValue(prefill.dia) : fallbackDia;

        this.campaignForm.set({
          dia: diaValue,
          volunteerUserIds: prefill?.volunteerUserIds?.length
            ? [...prefill.volunteerUserIds]
            : context.eligibleUsers.map((user) => user.id),
          vehicles: prefill?.vehicles?.length
            ? prefill.vehicles.map((vehicle) => ({
                vehicleName: vehicle.vehicleName,
                kms: Number(vehicle.kms || 0),
                conductorUserId: vehicle.conductorUserId,
                volunteerUserIds: [...(vehicle.volunteerUserIds || [])],
              }))
            : [],
        });
        this.campaignFormLoading.set(false);
        this.showCampaignFormModal.set(true);
      },
      error: (err) => {
        this.campaignFormLoading.set(false);
        this.error.set(err.message || 'No s\'ha pogut preparar el formulari de campanya.');
      },
    });
  }

  closeCampaignFormModal() {
    this.showCampaignFormModal.set(false);
    this.campaignFormConvo.set(null);
    this.campaignFormMode.set(null);
    this.campaignFormContext.set(null);
    this.campaignFormSubmitting.set(false);
    this.campaignForm.set({
      dia: this.toDateTimeLocalValue(new Date().toISOString()),
      volunteerUserIds: [],
      vehicles: [],
    });
    this.campaignVolunteerMenuOpen.set(false);
    this.campaignVehicleMenuOpen.set(false);
    this.campaignVehicleVolunteerMenuVehicle.set(null);
    this.campaignConductorMenuVehicle.set(null);
  }

  openCampaignRecordsModal(convo: Convocatoria) {
    if (!this.canManageConvocatoriaLifecycle(convo)) {
      return;
    }

    this.error.set('');
    this.campaignRecordsConvo.set(convo);
    this.campaignRecordsLoading.set(true);
    this.campaignRecordsDeletingId.set(null);
    this.campaignRecordExpandedIds.set([]);
    this.campaignRecords.set([]);
    this.showCampaignRecordsModal.set(true);

    this.dataService.getCampaignForms({ convoId: convo.id }).subscribe({
      next: (forms) => {
        this.campaignRecords.set(forms);
        this.campaignRecordsLoading.set(false);
      },
      error: (err) => {
        this.campaignRecordsLoading.set(false);
        this.error.set(err.message || 'No s\'han pogut carregar els formularis de la convocatòria.');
      },
    });
  }

  closeCampaignRecordsModal() {
    this.showCampaignRecordsModal.set(false);
    this.campaignRecordsConvo.set(null);
    this.campaignRecordsLoading.set(false);
    this.campaignRecordsDeletingId.set(null);
    this.campaignRecordExpandedIds.set([]);
    this.campaignRecords.set([]);
  }

  toggleCampaignRecordDetails(formId: number) {
    const current = new Set(this.campaignRecordExpandedIds());

    if (current.has(formId)) {
      current.delete(formId);
    } else {
      current.add(formId);
    }

    this.campaignRecordExpandedIds.set(Array.from(current));
  }

  isCampaignRecordDetailsOpen(formId: number) {
    return this.campaignRecordExpandedIds().includes(formId);
  }

  getCampaignFormMomentLabel(serviceMoment: 'START' | 'END') {
    return serviceMoment === 'START' ? 'Inici de servei' : 'Final de servei';
  }

  getCampaignFormVolunteersCount(form: CampaignFormRecord) {
    return Array.isArray(form.voluntaris) ? form.voluntaris.length : 0;
  }

  getCampaignFormVehiclesCount(form: CampaignFormRecord) {
    return Array.isArray(form.vehicles) ? form.vehicles.length : 0;
  }

  getCampaignFormResponsableLabel(form: CampaignFormRecord) {
    if (form.responsableId) {
      const user = this.userById().get(form.responsableId);
      if (user) {
        return `${user.nCarnet} - ${user.name} ${user.lastName || ''}`.trim();
      }
    }

    if (form.responsableNCarnet) {
      const user = this.userByNCarnet().get(form.responsableNCarnet);
      if (user) {
        return `${user.nCarnet} - ${user.name} ${user.lastName || ''}`.trim();
      }

      return form.responsableNCarnet;
    }

    return '-';
  }

  getCampaignFormCreatedByLabel(form: CampaignFormRecord) {
    if (!form.createdByNCarnet) {
      return '-';
    }

    const user = this.userByNCarnet().get(form.createdByNCarnet);
    if (!user) {
      return form.createdByNCarnet;
    }

    return `${user.nCarnet} - ${user.name} ${user.lastName || ''}`.trim();
  }

  getCampaignFormVolunteerLabels(form: CampaignFormRecord) {
    if (!Array.isArray(form.voluntaris) || form.voluntaris.length === 0) {
      return [];
    }

    return form.voluntaris.map((userId) => {
      const user = this.userById().get(userId);
      if (!user) {
        return String(userId);
      }

      return `${user.nCarnet} - ${user.name} ${user.lastName || ''}`.trim();
    });
  }

  getCampaignFormVehicleConductorLabel(vehicle: CampaignFormVehicleInput) {
    if (vehicle.conductorUserId == null) {
      return 'Sense conductor';
    }

    const user = this.userById().get(vehicle.conductorUserId);
    if (!user) {
      return String(vehicle.conductorUserId);
    }

    return `${user.nCarnet} - ${user.name} ${user.lastName || ''}`.trim();
  }

  getCampaignFormVehicleVolunteerLabels(vehicle: CampaignFormVehicleInput) {
    if (!Array.isArray(vehicle.volunteerUserIds) || vehicle.volunteerUserIds.length === 0) {
      return [];
    }

    return vehicle.volunteerUserIds.map((userId) => {
      const user = this.userById().get(userId);
      if (!user) {
        return String(userId);
      }

      return `${user.nCarnet} - ${user.name} ${user.lastName || ''}`.trim();
    });
  }

  deleteCampaignFormRecord(form: CampaignFormRecord) {
    const convo = this.campaignRecordsConvo();
    if (!convo || !this.canManageConvocatoriaLifecycle(convo)) {
      return;
    }

    const confirmed = window.confirm(
      `Vols eliminar el formulari de ${this.getCampaignFormMomentLabel(form.serviceMoment)} (${new Date(form.createdAt).toLocaleString('ca-ES')})?`
    );

    if (!confirmed) {
      return;
    }

    this.error.set('');
    this.campaignRecordsDeletingId.set(form.id);

    this.dataService.deleteCampaignForm(form.id).subscribe({
      next: () => {
        this.campaignRecordsDeletingId.set(null);
        this.campaignRecords.set(this.campaignRecords().filter((item) => item.id !== form.id));
        this.adminActionFeedback.set('Formulari eliminat correctament.');
      },
      error: (err) => {
        this.campaignRecordsDeletingId.set(null);
        this.error.set(err.message || 'No s\'ha pogut eliminar el formulari.');
      },
    });
  }

  isCampaignVolunteerSelected(userId: number) {
    return this.campaignForm().volunteerUserIds.includes(userId);
  }

  toggleCampaignVolunteer(userId: number, checked?: boolean) {
    const current = new Set(this.campaignForm().volunteerUserIds);
    const shouldSelect = checked === undefined ? !current.has(userId) : checked;

    if (shouldSelect) {
      current.add(userId);
    } else {
      current.delete(userId);
    }

    const nextVolunteerIds = Array.from(current);
    const nextVehicles = this.campaignForm().vehicles.map((vehicle) => ({
      ...vehicle,
      conductorUserId: vehicle.conductorUserId && nextVolunteerIds.includes(vehicle.conductorUserId)
        ? vehicle.conductorUserId
        : null,
      volunteerUserIds: vehicle.volunteerUserIds.filter((id) => nextVolunteerIds.includes(id)),
    }));

    this.campaignForm.set({
      ...this.campaignForm(),
      volunteerUserIds: nextVolunteerIds,
      vehicles: nextVehicles,
    });
  }

  updateCampaignFormDia(value: string) {
    this.campaignForm.set({
      ...this.campaignForm(),
      dia: value,
    });
  }

  toggleCampaignVolunteerMenu() {
    this.campaignVolunteerMenuOpen.set(!this.campaignVolunteerMenuOpen());
    this.campaignVehicleMenuOpen.set(false);
    this.campaignVehicleVolunteerMenuVehicle.set(null);
    this.campaignConductorMenuVehicle.set(null);
  }

  getCampaignVolunteersSummary() {
    const selected = this.campaignForm().volunteerUserIds;

    if (selected.length === 0) {
      return 'Selecciona voluntaris';
    }

    const labels = selected.map((userId) => this.getCampaignUserLabel(userId));
    if (labels.length <= 2) {
      return labels.join(' · ');
    }

    return `${labels[0]} · +${labels.length - 1} més`;
  }

  getCampaignVehicleCatalogLabel(vehicle: CampaignVehicleCatalogItem) {
    const indicativo = String(vehicle?.indicativo || '').trim();
    const modelo = String(vehicle?.modelo || '').trim();
    const litros = Number(vehicle?.litros || 0);
    const kms = Number(vehicle?.kms || 0);

    const parts = [indicativo];
    if (modelo) {
      parts.push(modelo);
    }

    if (litros > 0) {
      parts.push(`${litros}L`);
    }

    parts.push(`${Number.isFinite(kms) && kms >= 0 ? kms : 0} km`);

    return parts.filter(Boolean).join(' · ');
  }

  isCampaignVehicleLocked(indicativo: string) {
    const locked = this.campaignFormContext()?.lockedVehicleNames || [];
    return locked.includes(indicativo);
  }

  getCampaignVehicleDisplayName(indicativo: string) {
    const vehicleFromCatalog = this.campaignFormContext()?.vehicleCatalog?.find(
      (item) => item.indicativo === indicativo
    );

    if (!vehicleFromCatalog) {
      return indicativo;
    }

    return this.getCampaignVehicleCatalogLabel(vehicleFromCatalog);
  }

  toggleCampaignVehicleMenu() {
    this.campaignVehicleMenuOpen.set(!this.campaignVehicleMenuOpen());
    this.campaignVolunteerMenuOpen.set(false);
    this.campaignVehicleVolunteerMenuVehicle.set(null);
    this.campaignConductorMenuVehicle.set(null);
  }

  toggleCampaignVehicleSelection(indicativo: string) {
    if (this.isCampaignVehicleLocked(indicativo)) {
      return;
    }

    if (this.isCampaignVehicleSelected(indicativo)) {
      this.removeCampaignVehicleSection(indicativo);
      return;
    }

    this.addCampaignVehicleSection(indicativo);
  }

  getCampaignVehiclesSummary() {
    const selected = this.campaignForm().vehicles || [];
    if (selected.length === 0) {
      return 'Selecciona vehicles';
    }

    const labels = selected.map((vehicle) => {
      const vehicleFromCatalog = this.campaignFormContext()?.vehicleCatalog?.find(
        (item) => item.indicativo === vehicle.vehicleName
      );

      if (vehicleFromCatalog) {
        return this.getCampaignVehicleCatalogLabel(vehicleFromCatalog);
      }

      return vehicle.vehicleName;
    });

    if (labels.length <= 2) {
      return labels.join(' · ');
    }

    return `${labels[0]} · +${labels.length - 1} més`;
  }

  addCampaignVehicleSection(vehicleName: string) {
    const normalizedName = String(vehicleName || '').trim();
    if (!normalizedName) {
      return;
    }

    if (this.campaignForm().vehicles.some((vehicle) => vehicle.vehicleName === normalizedName)) {
      return;
    }

    const catalogVehicle = this.campaignFormContext()?.vehicleCatalog?.find(
      (vehicle) => vehicle.indicativo === normalizedName
    );
    const initialKms = Number(catalogVehicle?.kms || 0);

    const nextVehicles = [
      ...this.campaignForm().vehicles,
      {
        vehicleName: normalizedName,
        kms: Number.isFinite(initialKms) && initialKms >= 0 ? initialKms : 0,
        conductorUserId: null,
        volunteerUserIds: [],
      },
    ];

    this.updateCampaignVehicles(nextVehicles);
  }

  removeCampaignVehicleSection(vehicleName: string) {
    const nextVehicles = this.campaignForm().vehicles.filter((vehicle) => vehicle.vehicleName !== vehicleName);
    this.updateCampaignVehicles(nextVehicles);
  }

  updateCampaignVehicleField(vehicleName: string, field: 'kms' | 'conductorUserId', value: string) {
    const vehicles = this.campaignForm().vehicles.map((vehicle) => {
      if (vehicle.vehicleName !== vehicleName) {
        return vehicle;
      }

      if (field === 'kms') {
        if (String(value).trim() === '') {
          return vehicle;
        }

        const parsed = Number(value);
        return {
          ...vehicle,
          kms: Number.isFinite(parsed) && parsed >= 0 ? parsed : 0,
        };
      }

      return {
        ...vehicle,
        conductorUserId: value ? Number(value) : null,
      };
    });

    this.updateCampaignVehicles(vehicles);
  }

  toggleCampaignVehicleVolunteer(vehicleName: string, userId: number, checked?: boolean) {
    const vehicles = this.campaignForm().vehicles.map((vehicle) => {
      if (vehicle.vehicleName !== vehicleName) {
        return vehicle;
      }

      const current = new Set(vehicle.volunteerUserIds);
      const shouldSelect = checked === undefined ? !current.has(userId) : checked;

      if (shouldSelect && !this.canAssignUserAsVehicleVolunteer(vehicleName, userId)) {
        return vehicle;
      }

      if (shouldSelect) {
        current.add(userId);
      } else {
        current.delete(userId);
      }

      return {
        ...vehicle,
        volunteerUserIds: Array.from(current),
      };
    });

    this.updateCampaignVehicles(vehicles);
  }

  isCampaignVehicleVolunteerSelected(vehicleName: string, userId: number) {
    const vehicle = this.campaignForm().vehicles.find((item) => item.vehicleName === vehicleName);
    return Boolean(vehicle?.volunteerUserIds.includes(userId));
  }

  toggleCampaignVehicleVolunteerMenu(vehicleName: string) {
    this.campaignVehicleVolunteerMenuVehicle.set(
      this.campaignVehicleVolunteerMenuVehicle() === vehicleName ? null : vehicleName
    );
    this.campaignVolunteerMenuOpen.set(false);
    this.campaignConductorMenuVehicle.set(null);
  }

  isCampaignVehicleVolunteerMenuOpen(vehicleName: string) {
    return this.campaignVehicleVolunteerMenuVehicle() === vehicleName;
  }

  getCampaignVehicleVolunteersSummary(vehicleName: string) {
    const vehicle = this.campaignForm().vehicles.find((item) => item.vehicleName === vehicleName);
    const selected = vehicle?.volunteerUserIds || [];

    if (selected.length === 0) {
      return 'Selecciona voluntaris del vehicle';
    }

    const labels = selected.map((userId) => this.getCampaignUserLabel(userId));
    if (labels.length <= 2) {
      return labels.join(' · ');
    }

    return `${labels[0]} · +${labels.length - 1} més`;
  }

  getCampaignAssignableVolunteerIds(vehicleName: string) {
    return this.campaignForm().volunteerUserIds.filter((userId) => this.canAssignUserAsVehicleVolunteer(vehicleName, userId));
  }

  canAssignUserAsVehicleVolunteer(vehicleName: string, userId: number) {
    const vehicles = this.campaignForm().vehicles;

    const assignedAsConductor = vehicles.some((vehicle) => vehicle.conductorUserId === userId);
    if (assignedAsConductor) {
      return false;
    }

    const assignedInOtherVehicle = vehicles.some(
      (vehicle) => vehicle.vehicleName !== vehicleName && vehicle.volunteerUserIds.includes(userId)
    );

    return !assignedInOtherVehicle;
  }

  getCampaignAssignableConductorIds(vehicleName: string) {
    return this.campaignForm().volunteerUserIds.filter((userId) => this.canAssignUserAsConductor(vehicleName, userId));
  }

  canAssignUserAsConductor(vehicleName: string, userId: number) {
    if (!this.campaignForm().volunteerUserIds.includes(userId)) {
      return false;
    }

    const vehicles = this.campaignForm().vehicles;
    const assignedAsConductorInOtherVehicle = vehicles.some(
      (vehicle) => vehicle.vehicleName !== vehicleName && vehicle.conductorUserId === userId
    );

    return !assignedAsConductorInOtherVehicle;
  }

  toggleCampaignConductorMenu(vehicleName: string) {
    this.campaignConductorMenuVehicle.set(
      this.campaignConductorMenuVehicle() === vehicleName ? null : vehicleName
    );
    this.campaignVolunteerMenuOpen.set(false);
    this.campaignVehicleVolunteerMenuVehicle.set(null);
  }

  isCampaignConductorMenuOpen(vehicleName: string) {
    return this.campaignConductorMenuVehicle() === vehicleName;
  }

  selectCampaignVehicleConductor(vehicleName: string, userId: number | null) {
    if (userId != null && !this.canAssignUserAsConductor(vehicleName, userId)) {
      return;
    }

    let vehicles = this.campaignForm().vehicles.map((vehicle) => {
      if (vehicle.vehicleName !== vehicleName) {
        return vehicle;
      }

      const nextConductor = vehicle.conductorUserId === userId ? null : userId;
      return {
        ...vehicle,
        conductorUserId: nextConductor,
      };
    });

    if (userId != null) {
      vehicles = vehicles.map((vehicle) => ({
        ...vehicle,
        volunteerUserIds: vehicle.volunteerUserIds.filter((id) => id !== userId),
      }));
    }

    this.updateCampaignVehicles(vehicles);
    this.campaignConductorMenuVehicle.set(null);
  }

  getCampaignVehicleConductorSummary(vehicleName: string) {
    const vehicle = this.campaignForm().vehicles.find((item) => item.vehicleName === vehicleName);
    if (!vehicle || !vehicle.conductorUserId) {
      return 'Sense conductor';
    }

    return this.getCampaignUserLabel(vehicle.conductorUserId);
  }

  getCampaignVehicleCurrentKms(vehicleName: string) {
    const catalogVehicle = this.campaignFormContext()?.vehicleCatalog?.find((item) => item.indicativo === vehicleName);
    const catalogKms = Number(catalogVehicle?.kms || 0);
    if (Number.isFinite(catalogKms) && catalogKms >= 0) {
      return Number(catalogKms.toFixed(2));
    }

    const selectedVehicle = this.campaignForm().vehicles.find((item) => item.vehicleName === vehicleName);
    const selectedKms = Number(selectedVehicle?.kms || 0);
    return Number.isFinite(selectedKms) && selectedKms >= 0 ? Number(selectedKms.toFixed(2)) : 0;
  }

  getCampaignVehicleKmsInputValue(vehicleName: string) {
    if (this.campaignFormMode() === 'finish') {
      return '';
    }

    const selectedVehicle = this.campaignForm().vehicles.find((item) => item.vehicleName === vehicleName);
    return selectedVehicle ? selectedVehicle.kms : 0;
  }

  getCampaignVehicleKmsPlaceholder(vehicleName: string) {
    return String(this.getCampaignVehicleCurrentKms(vehicleName));
  }

  private validateCampaignVehicleKms() {
    for (const vehicle of this.campaignForm().vehicles) {
      const currentKms = this.getCampaignVehicleCurrentKms(vehicle.vehicleName);
      const nextKms = Number(vehicle.kms || 0);

      if (!Number.isFinite(nextKms) || nextKms < 0) {
        this.error.set(`Els KM del vehicle ${vehicle.vehicleName} no son valids.`);
        return false;
      }

      if (nextKms < currentKms) {
        this.error.set(`Els KM del vehicle ${vehicle.vehicleName} no poden ser inferiors als actuals (${currentKms}).`);
        return false;
      }

      if ((nextKms - currentKms) > this.maxKmIncreasePerForm) {
        this.error.set(`L'increment de KM del vehicle ${vehicle.vehicleName} es massa alt. Revisa si hi ha un zero de mes.`);
        return false;
      }
    }

    return true;
  }

  private updateCampaignVehicles(vehicles: Array<{
    vehicleName: string;
    kms: number;
    conductorUserId: number | null;
    volunteerUserIds: number[];
  }>) {
    const allowedVolunteerIds = new Set(this.campaignForm().volunteerUserIds);

    const normalizedVehicles = vehicles.map((vehicle) => ({
      ...vehicle,
      conductorUserId: vehicle.conductorUserId != null && allowedVolunteerIds.has(vehicle.conductorUserId)
        ? vehicle.conductorUserId
        : null,
      volunteerUserIds: Array.from(new Set((vehicle.volunteerUserIds || []).filter((id) => allowedVolunteerIds.has(id)))),
    }));

    const assignedConductorIds = new Set<number>();
    const uniqueConductorVehicles = normalizedVehicles.map((vehicle) => {
      const conductorId = vehicle.conductorUserId;
      if (conductorId == null) {
        return vehicle;
      }

      if (assignedConductorIds.has(conductorId)) {
        return {
          ...vehicle,
          conductorUserId: null,
        };
      }

      assignedConductorIds.add(conductorId);
      return vehicle;
    });

    const conductorIds = new Set(
      uniqueConductorVehicles
        .map((vehicle) => vehicle.conductorUserId)
        .filter((id): id is number => id != null)
    );

    const assignedVolunteerIds = new Set<number>();
    const resolvedVehicles = uniqueConductorVehicles.map((vehicle) => {
      const filteredVolunteerIds = vehicle.volunteerUserIds.filter((id) => {
        if (conductorIds.has(id)) {
          return false;
        }

        if (assignedVolunteerIds.has(id)) {
          return false;
        }

        assignedVolunteerIds.add(id);
        return true;
      });

      return {
        ...vehicle,
        volunteerUserIds: filteredVolunteerIds,
      };
    });

    this.campaignForm.set({
      ...this.campaignForm(),
      vehicles: resolvedVehicles,
    });
  }

  isCampaignVehicleSelected(vehicleName: string) {
    return this.campaignForm().vehicles.some((vehicle) => vehicle.vehicleName === vehicleName);
  }

  getCampaignUserLabel(userId: number) {
    const user = this.campaignFormContext()?.eligibleUsers.find((item) => item.id === userId);
    if (!user) {
      return String(userId);
    }

    return `${user.nCarnet} - ${user.name} ${user.lastName || ''}`.trim();
  }

  executeCampaignLifecycleAction() {
    const convo = this.campaignFormConvo();
    const mode = this.campaignFormMode();

    if (!convo || !mode) {
      return;
    }

    if (!this.validateCampaignVehicleKms()) {
      return;
    }

    if (mode === 'start') {
      this.startConvocatoriaLifecycle(convo);
      return;
    }

    this.finishConvocatoriaLifecycle(convo);
  }

  private buildCampaignFormPayload(): CampaignFormSubmitPayload {
    const diaValue = this.campaignForm().dia?.trim();
    const parsedDia = diaValue ? new Date(diaValue) : new Date();
    const dia = Number.isNaN(parsedDia.getTime()) ? new Date().toISOString() : parsedDia.toISOString();

    return {
      dia,
      volunteerUserIds: [...this.campaignForm().volunteerUserIds],
      vehicles: this.campaignForm().vehicles.map((vehicle) => ({
        vehicleName: vehicle.vehicleName,
        kms: Number(vehicle.kms || 0),
        conductorUserId: vehicle.conductorUserId,
        volunteerUserIds: [...vehicle.volunteerUserIds],
      })),
    };
  }

  openLifecycleEdition(convo: Convocatoria) {
    if (!this.canManageConvocatoriaLifecycle(convo)) {
      return;
    }

    this.lifecycleConvo.set(convo);
    this.lifecycleForm.set({
      actualStartTime: this.toDateTimeLocalValue(convo.actualStartTime),
      actualEndTime: this.toDateTimeLocalValue(convo.actualEndTime),
    });
    this.showLifecycleModal.set(true);
  }

  closeLifecycleModal() {
    this.showLifecycleModal.set(false);
    this.lifecycleConvo.set(null);
    this.lifecycleForm.set({
      actualStartTime: '',
      actualEndTime: '',
    });
  }

  updateLifecycleField(field: 'actualStartTime' | 'actualEndTime', value: string) {
    this.lifecycleForm.set({
      ...this.lifecycleForm(),
      [field]: value,
    });
  }

  saveLifecycleEdition() {
    const convo = this.lifecycleConvo();
    if (!convo || !this.canManageConvocatoriaLifecycle(convo)) {
      return;
    }

    const startInput = this.lifecycleForm().actualStartTime.trim();
    const endInput = this.lifecycleForm().actualEndTime.trim();

    if (!startInput) {
      this.error.set('La hora real d\'inici és obligatòria per desar.');
      return;
    }

    const parsedStart = new Date(startInput);
    if (Number.isNaN(parsedStart.getTime())) {
      this.error.set('La hora real d\'inici no té un format vàlid.');
      return;
    }

    let parsedEnd: Date | null = null;
    if (endInput) {
      parsedEnd = new Date(endInput);
      if (Number.isNaN(parsedEnd.getTime())) {
        this.error.set('La hora real de fi no té un format vàlid.');
        return;
      }

      if (parsedEnd < parsedStart) {
        this.error.set('La hora real de fi no pot ser anterior a la d\'inici.');
        return;
      }
    }

    this.error.set('');
    this.adminActionFeedback.set('');
    this.runningConvoAdminActionKey.set(`edit-${convo.id}`);

    this.dataService.updateConvocatoriaLifecycle(convo.id, {
      actualStartTime: parsedStart.toISOString(),
      actualEndTime: parsedEnd ? parsedEnd.toISOString() : null,
    }).subscribe({
      next: (updatedConvo) => {
        this.runningConvoAdminActionKey.set(null);
        this.replaceConvocatoriaInState(updatedConvo);
        this.adminActionFeedback.set(`Registre d'hores actualitzat: ${updatedConvo.title}.`);
        this.closeLifecycleModal();
      },
      error: (err) => {
        this.runningConvoAdminActionKey.set(null);
        this.error.set(err.message || 'No s\'ha pogut editar el registre d\'hores.');
      },
    });
  }

  clearLifecycleEdition() {
    const convo = this.lifecycleConvo();
    if (!convo || !this.canManageConvocatoriaLifecycle(convo)) {
      return;
    }

    this.error.set('');
    this.adminActionFeedback.set('');
    this.runningConvoAdminActionKey.set(`edit-${convo.id}`);

    this.dataService.updateConvocatoriaLifecycle(convo.id, {
      actualStartTime: null,
      actualEndTime: null,
    }).subscribe({
      next: (updatedConvo) => {
        this.runningConvoAdminActionKey.set(null);
        this.replaceConvocatoriaInState(updatedConvo);
        this.adminActionFeedback.set(`Registre d'hores eliminat: ${updatedConvo.title}.`);
        this.closeLifecycleModal();
      },
      error: (err) => {
        this.runningConvoAdminActionKey.set(null);
        this.error.set(err.message || 'No s\'ha pogut eliminar el registre d\'hores.');
      },
    });
  }

  toggleConvoSortida(convo: Convocatoria) {
    if (!this.canManageConvocatoriaLifecycle(convo)) {
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
    if (!this.canManageConvocatoriaLifecycle(convo)) {
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
        if (
          respuesta.convoId !== convoId ||
          respuesta.response !== true ||
          respuesta.attendanceConfirmed !== true
        ) {
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
    return Boolean(currentUserId && Number(convo.responsableId) === Number(currentUserId));
  }

  canManageAttendanceForConvo(convo: Convocatoria | null) {
    if (!convo) {
      return false;
    }

    if (this.authService.isAdmin()) {
      return true;
    }

    const currentUserId = this.authService.getCurrentUser()?.id;
    return Boolean(currentUserId && Number(convo.responsableId) === Number(currentUserId));
  }

  isAttendanceJustified(respuesta: Respuesta) {
    return respuesta.attendanceConfirmed === false && respuesta.attendanceJustified === true;
  }

  getAttendanceBadgeText(respuesta: Respuesta) {
    if (this.isAttendanceJustified(respuesta)) {
      return 'No assistit justificat';
    }

    return respuesta.attendanceConfirmed ? 'Presentat' : 'No presentat';
  }

  updateAttendanceStatus(respuesta: Respuesta, attendanceConfirmed: boolean, attendanceJustified = false) {
    if (!this.canManageAttendanceForConvo(respuesta.convocatoria || null)) {
      this.error.set('No tens permisos per modificar l\'assistència d\'aquesta convocatòria.');
      return;
    }

    this.dataService.updateRespuesta(respuesta.id, { attendanceConfirmed, attendanceJustified }).subscribe({
      next: () => {
        this.loadRespuestas();
      },
      error: (err) => {
        this.error.set(err.message || 'No s\'ha pogut actualitzar l\'assistència.');
      },
    });
  }

  toggleAttendanceJustification(respuesta: Respuesta) {
    if (respuesta.attendanceConfirmed) {
      return;
    }

    this.updateAttendanceStatus(respuesta, false, !this.isAttendanceJustified(respuesta));
  }

  updateAttendanceConfirmation(respuesta: Respuesta, attendanceConfirmed: boolean) {
    this.updateAttendanceStatus(respuesta, attendanceConfirmed, false);
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

    const responsableUser = convo.responsableId ? this.userById().get(convo.responsableId) : null;
    if (!responsableUser?.nCarnet || !currentUser.nCarnet) {
      return false;
    }

    return responsableUser.nCarnet === currentUser.nCarnet;
  }

  getResponsableName(responsableId?: number | null) {
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
    if (!this.canManageConvocatoriaLifecycle(convo)) {
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
    field: 'title' | 'date' | 'ubiSortida' | 'responsableId' | 'convoTypeId' | 'startTime' | 'finalTime' | 'isActive' | 'autoAssignResponsable' | 'sortida',
    value: string | boolean
  ) {
    const current = this.adminConvoForm();

    if (field === 'responsableId' || field === 'convoTypeId') {
      const next = {
        ...current,
        [field]: value ? Number(value) : null,
      };

      if (field === 'responsableId' && next.responsableId !== null) {
        next.autoAssignResponsable = false;
      }

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

    if (!form.title || !form.date || !form.convoTypeId || !form.startTime) {
      this.error.set('Completa titol, data, hora d\'inici i tipus.');
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

  deleteAdminConvocatoria() {
    const convo = this.adminConvo();

    if (!convo) {
      return;
    }

    const confirmed = window.confirm(`Vols eliminar la convocatòria "${convo.title}"?`);
    if (!confirmed) {
      return;
    }

    this.adminConvoSaving.set(true);

    this.dataService.deleteConvocatoria(convo.id).subscribe({
      next: () => {
        this.adminConvoSaving.set(false);
        this.closeAdminConvoModal();
        this.loadConvocatorias();
        this.loadRespuestas();
      },
      error: (err) => {
        this.error.set(err.message || 'No s\'ha pogut eliminar la convocatòria.');
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

      if (field === 'responsableId' && next.responsableId !== null) {
        next.autoAssignResponsable = false;
      }

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

    if (!titleToUse || !form.convoTypeId) {
      this.createConvoError.set('Completa el tipus per crear.');
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

  getConvocatoriaElapsedLabel(convo: Convocatoria) {
    if (!convo.actualStartTime) {
      return null;
    }

    const startDate = new Date(convo.actualStartTime);
    if (Number.isNaN(startDate.getTime())) {
      return null;
    }

    const endSource = convo.actualEndTime || new Date().toISOString();
    const endDate = new Date(endSource);
    if (Number.isNaN(endDate.getTime()) || endDate.getTime() < startDate.getTime()) {
      return null;
    }

    const elapsedMinutes = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60));
    const hours = Math.floor(elapsedMinutes / 60);
    const minutes = elapsedMinutes % 60;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }

  getVisibleConvocatoriaElapsedLabel(convo: Convocatoria) {
    if (!this.canViewConvocatoriaSummary(convo)) {
      return null;
    }

    return this.getConvocatoriaElapsedLabel(convo);
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

    const raw = String(value);

    // For ISO datetimes, convert to local time (handles UTC winter/summer offset correctly).
    if (raw.includes('T')) {
      const date = new Date(raw);
      if (!Number.isNaN(date.getTime())) {
        const hh = String(date.getHours()).padStart(2, '0');
        const mm = String(date.getMinutes()).padStart(2, '0');
        return `${hh}:${mm}`;
      }
    }

    const match = raw.match(/(\d{2}:\d{2})/);
    if (match) {
      return match[1];
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

  private toDateTimeLocalValue(value?: string | null) {
    if (!value) {
      return '';
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return '';
    }

    const yyyy = parsed.getFullYear();
    const mm = String(parsed.getMonth() + 1).padStart(2, '0');
    const dd = String(parsed.getDate()).padStart(2, '0');
    const hh = String(parsed.getHours()).padStart(2, '0');
    const min = String(parsed.getMinutes()).padStart(2, '0');

    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
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

