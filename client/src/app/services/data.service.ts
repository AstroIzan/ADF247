import { Injectable } from '@angular/core';
import { HttpService } from './http.service';
import { Observable } from 'rxjs';

export interface User {
  id: number;
  nCarnet: string;
  nIndicatiu?: string;
  phone?: string;
  name: string;
  lastName?: string;
  password?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  adfId?: number;
  roles: {
    isCapOperatiu: boolean;
    isCapColla: boolean;
    isAdmin: boolean;
    isGroc: boolean;
    isDeveloper: boolean;
    isSecretariat?: boolean;
  };
}

export interface Adf {
  id: number;
  number: number;
  name: string;
  municipalities: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AdfOverview {
  adf: Adf;
  users: number;
  activeUsers: number;
  convocatorias: number;
  upcomingConvocatorias: number;
  inProgressConvocatorias: number;
  responses: number;
  vehicles: number;
}

export interface AdfVehicle {
  id: number;
  indicatiu: string;
  modelo?: string | null;
  matricula?: string | null;
  litres: number;
}

export interface AdfConvocatoria {
  id: number;
  adfId: number;
  title: string;
  date: string;
  startTime: string;
  finalTime?: string | null;
  isActive: boolean;
  sortida: boolean;
  actualStartTime?: string | null;
  actualEndTime?: string | null;
  type: string;
  responses: number;
}

export interface AdfUser {
  id: number;
  adfId: number;
  nCarnet: string;
  name: string;
  lastName?: string | null;
  nIndicatiu?: string | null;
  isActive: boolean;
  isAdmin: boolean;
  isDeveloper: boolean;
  isSecretariat: boolean;
  isCapOperatiu: boolean;
  isCapColla: boolean;
  isGroc: boolean;
  isVerd: boolean;
}

export interface ConvoType {
  id: number;
  name: string;
  minGrocSortida: number;
  minVerdSortida: number;
  defaultLocation?: string | null;
}

export interface Convocatoria {
  id: number;
  date: string;
  title: string;
  ubiSortida: string;
  responsableId: number | null;
  convoTypeId: number;
  startTime: string;
  finalTime?: string;
  actualStartTime?: string | null;
  actualEndTime?: string | null;
  isActive: boolean;
  autoAssignResponsable: boolean;
  sortida: boolean;
  responseWindowMinutes?: number | null;
  responseCount?: number;
  responsable?: {
    id: number;
    nCarnet: string;
    name: string;
    lastName?: string | null;
  } | null;
  user?: User;
  convoType?: ConvoType;
  _count?: {
    respostas: number;
  };
}

export interface Respuesta {
  id: number;
  convoId: number;
  userNCarnet: string;
  response: boolean;
  source: 'manual' | 'auto-window' | 'auto-no-window';
  autoAssignReason?: string | null;
  isCustom: boolean;
  customText?: string | null;
  fullHorari: boolean;
  attendanceConfirmed: boolean;
  attendanceJustified?: boolean;
  createdAt?: string;
  updatedAt?: string;
  convocatoria?: Convocatoria;
  user?: User;
}

export interface CampaignVehicleCatalogItem {
  indicativo: string;
  modelo: string;
  matricula?: string | null;
  litros: number;
  kms: number;
}

export interface CampaignFormVehicleInput {
  vehicleName: string;
  kms?: number;
  initialKms: number;
  finalKms?: number | null;
  status: 'active' | 'withdrawn';
  statusNotes?: string | null;
  conductorUserId: number | null;
  volunteerUserIds: number[];
}

export interface CampaignFormSubmitPayload {
  dia?: string;
  volunteerUserIds: number[];
  vehicles: CampaignFormVehicleInput[];
  finalObservations?: string | null;
}

export interface CampaignFormPrefill {
  dia?: string;
  volunteerUserIds: number[];
  vehicles: CampaignFormVehicleInput[];
  finalObservations?: string | null;
}

export interface CampaignFormContext {
  convocatoria: Convocatoria;
  responsable: {
    id: number;
    nCarnet: string;
    name: string;
    lastName?: string | null;
  } | null;
  eligibleUsers: Array<{
    id: number;
    nCarnet: string;
    name: string;
    lastName?: string | null;
  }>;
  vehicleCatalog: CampaignVehicleCatalogItem[];
  lockedVehicleNames?: string[];
  prefill?: CampaignFormPrefill | null;
}

export interface CampaignFormRecord {
  id: number;
  convocatoriaId: number;
  serviceMoment: 'START' | 'END';
  dia: string;
  responsableId: number | null;
  responsableNCarnet: string | null;
  createdByNCarnet: string | null;
  createdAt: string;
  updatedAt: string;
  finalObservations?: string | null;
  voluntaris: number[];
  vehicles: CampaignFormVehicleInput[];
  convocatoria: {
    id: number;
    title: string;
    date: string;
  } | null;
}

export interface UserHoursSummaryRow {
  userId: number;
  userNCarnet: string;
  userName: string;
  campaignHours: number;
  offCampaignHours: number;
  unansweredCount: number;
  noShowCount: number;
  unansweredPenaltyHours: number;
  noShowPenaltyHours: number;
  totalHours: number;
}

export interface UserHoursSummaryResponse {
  generatedAt: string;
  isConfigured: boolean;
  settings: {
    campaignStartDate: string | null;
    campaignEndDate: string | null;
    unansweredPenaltyThreshold: number;
    unansweredPenaltyHours: number;
    noShowPenaltyHours: number;
  };
  users: UserHoursSummaryRow[];
}

export interface AvailabilityWindow {
  id: number;
  userNCarnet: string;
  fromDateTime: string;
  toDateTime: string;
  availabilityType: 'available' | 'unavailable';
  source: 'manual' | 'import' | 'system';
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AvailabilityWindowUpsertPayload {
  userNCarnet: string;
  fromDateTime: string;
  toDateTime: string;
  availabilityType: 'available' | 'unavailable';
  source?: 'manual' | 'import' | 'system';
  notes?: string | null;
}

export interface UsersCsvImportPayload {
  csvContent: string;
  fileName?: string;
}

export interface UsersCsvImportRowResult {
  rowNumber: number;
  nCarnet?: string | null;
  status: 'inserted' | 'rejected';
  reason?: string;
}

export interface UsersCsvImportResult {
  totalRows: number;
  inserted: number;
  rejected: number;
  rows: UsersCsvImportRowResult[];
}

export interface PlaAlfaMunicipalityCatalogItem {
  municipality: string;
  comarca: string | null;
  objectId: number | null;
  selected: boolean;
}

export interface PlaAlfaCatalogResponse {
  updatedAt: string;
  selectedMunicipalities: string[];
  principalMunicipality: string | null;
  municipalities: PlaAlfaMunicipalityCatalogItem[];
}

export interface PlaAlfaMunicipalityStatusItem {
  municipality: string;
  isPrincipal: boolean;
  comarca: string | null;
  todayLevel: number | null;
  tomorrowLevel: number | null;
  todayForecast: PlaAlfaWeatherForecast | null;
  todayForecastSource: 'aemet' | 'open-meteo' | null;
  tomorrowForecast: PlaAlfaWeatherForecast | null;
  tomorrowForecastSource: 'aemet' | 'open-meteo' | null;
  forecastSource: 'aemet' | 'open-meteo' | 'mixed' | null;
  todayObjectId: number | null;
  tomorrowObjectId: number | null;
  foundToday: boolean;
  foundTomorrow: boolean;
}

export interface PlaAlfaWeatherForecast {
  temperatureC: {
    min: number | null;
    max: number | null;
  };
  humidityPct: {
    min: number | null;
    max: number | null;
  };
  wind: {
    maxSpeedKmh: number | null;
    direction: string | null;
  };
}

export interface PlaAlfaMunicipalitiesStatusResponse {
  updatedAt: string;
  principalMunicipality: string | null;
  municipalities: PlaAlfaMunicipalityStatusItem[];
}

export interface PlaAlfaSelectionUpdatePayload {
  municipalities: string[];
  principalMunicipality?: string | null;
}

export interface MessagingNotificationLog {
  id: number;
  convocatoriaId?: number | null;
  trigger: string;
  status: string;
  title: string;
  body: string;
  createdAt: string;
  requestedCount: number;
  successCount: number;
  failureCount: number;
  errorMessage?: string | null;
}

export interface TaskExecutionLog {
  taskExecutionId: number;
  taskDefinitionId: number;
  taskName: string;
  startedAt: string;
  finishedAt?: string | null;
  lastKeepAlive: string;
  finalStatus?: string | null;
}

export interface MessagingSystemStatus {
  database: 'connected';
  activeDevices: number;
  queuedNotifications: number;
  lastNotification: {
    id: number;
    trigger: string;
    status: string;
    createdAt: string;
    completedAt?: string | null;
    errorMessage?: string | null;
  } | null;
  lastExecution: {
    taskExecutionId: number;
    taskName: string;
    startedAt: string;
    finishedAt?: string | null;
    finalStatus?: string | null;
  } | null;
}

export interface MessagingConfiguration {
  id: number;
  key: string;
  name: string;
  titleTemplate: string;
  bodyTemplate: string;
  audienceRuleJson: string;
  enabled: boolean;
  updatedAt: string;
}

export interface SystemConfigurationVehicle {
  indicatiu: string;
  modelo?: string | null;
  matricula?: string | null;
  litres: number;
  kms: number;
}

export interface WeeklyConvocatoriaSchedule {
  convoTypeId: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface SystemConfiguration {
  autoCreateUnavailableForUsersWithoutWindow: boolean;
  notifyOnAutoAvailableResponse: boolean;
  pviEnabled: boolean;
  weeklyConvoTypeIds: number[];
  campaignHoursConvoTypeIds: number[];
  weeklyConvocatoriaSchedules: WeeklyConvocatoriaSchedule[];
  weeklyRequestWeekday: number;
  weeklyRequestHour: number;
  weeklyRequestMinute: number;
  availabilityManagerNCarnets: string[];
  dailyNotificationsHour: number;
  dailyNotificationsMinute: number;
  campaignStartDate: string | null;
  campaignEndDate: string | null;
  unansweredPenaltyThreshold: number;
  unansweredPenaltyHours: number;
  noShowPenaltyHours: number;
  vehicleCatalog: SystemConfigurationVehicle[];
  updatedAt: string;
}

export interface NotificationDeliveryLog {
  id: number;
  nCarnet: string;
  status: string;
  attemptCount: number;
  sentAt?: string | null;
  errorMessage?: string | null;
  createdAt: string;
}

export interface TaskExecutionDetailLog extends TaskExecutionLog {
  details: { taskExecutionDetailId: number; eventType: number; occurredAt: string; message: string; detailsJson?: string | null }[];
}

export interface UserHoursDetail {
  userId: number;
  nCarnet: string;
  items: {
    convocatoriaId: number;
    title: string;
    type?: string | null;
    startTime: string;
    finalTime?: string | null;
    answered: boolean;
    response: boolean | null;
    attended: boolean;
    justified: boolean;
  }[];
}

export interface PlaAlfaSimulation {
  principalMunicipality: string | null;
  todayLevel: number | null;
  tomorrowLevel: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class DataService {

  constructor(private http: HttpService) {}

  // === ADF ===
  getAdfs(): Observable<Adf[]> {
    return this.http.get<Adf[]>('/adf');
  }

  getAdfOverview(): Observable<AdfOverview[]> {
    return this.http.get<AdfOverview[]>('/adf/overview');
  }

  saveAdf(id: number | null, data: { number: number; name: string; municipalities: string[] }): Observable<Adf> {
    return id ? this.http.put<Adf>(`/adf/${id}`, data) : this.http.post<Adf>('/adf', data);
  }

  deleteAdf(id: number): Observable<Adf> {
    return this.http.delete<Adf>(`/adf/${id}`);
  }

  getAdfConvocatorias(id: number): Observable<AdfConvocatoria[]> {
    return this.http.get<AdfConvocatoria[]>(`/adf/${id}/convocatorias`);
  }

  getAdfVehicles(id: number): Observable<AdfVehicle[]> {
    return this.http.get<AdfVehicle[]>(`/adf/${id}/vehicles`);
  }

  getAdfUsers(id: number): Observable<AdfUser[]> {
    return this.http.get<AdfUser[]>(`/adf/${id}/users`);
  }

  createAdfVehicle(id: number, data: { indicatiu: string; modelo?: string; matricula?: string; litres?: number; kms?: number }): Observable<AdfVehicle> {
    return this.http.post<AdfVehicle>(`/adf/${id}/vehicles`, data);
  }

  // === USERS ===
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>('/users');
  }

  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`/users/${id}`);
  }

  createUser(data: Partial<User>): Observable<User> {
    return this.http.post<User>('/users', data);
  }

  updateUser(id: number, data: Partial<User>): Observable<User> {
    return this.http.put<User>(`/users/${id}`, data);
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete<any>(`/users/${id}`);
  }

  importUsersFromCsv(payload: UsersCsvImportPayload): Observable<UsersCsvImportResult> {
    return this.http.post<UsersCsvImportResult>('/users/import', payload);
  }

  // === CONVOCATION TYPES ===
  getConvoTypes(): Observable<ConvoType[]> {
    return this.http.get<ConvoType[]>('/convos/types');
  }

  getSystemConfiguration(): Observable<SystemConfiguration> {
    return this.http.get<SystemConfiguration>('/system-configuration');
  }

  updateSystemConfiguration(configuration: Omit<SystemConfiguration, 'updatedAt'>): Observable<SystemConfiguration> {
    return this.http.put<SystemConfiguration>('/system-configuration', configuration);
  }

  getPlaAlfaSimulation(): Observable<PlaAlfaSimulation> {
    return this.http.get<PlaAlfaSimulation>('/system-configuration/developer/pla-alfa-simulation');
  }

  updatePlaAlfaSimulation(payload: { todayLevel: number | null; tomorrowLevel: number | null }): Observable<PlaAlfaSimulation> {
    return this.http.put<PlaAlfaSimulation>('/system-configuration/developer/pla-alfa-simulation', payload);
  }

  runAllBatchJobs(runbook: 'all' | 'weekly-convos' | 'daily-notifications' = 'all'): Observable<{ id: number; requestedAt: string }> {
    return this.http.post<{ id: number; requestedAt: string }>('/system-configuration/developer/run-all-batch', { runbook });
  }

  getNotificationDeliveries(notificationId: number): Observable<NotificationDeliveryLog[]> {
    return this.http.get<NotificationDeliveryLog[]>(`/messaging/${notificationId}/deliveries`);
  }

  getTaskExecutionDetail(executionId: number): Observable<TaskExecutionDetailLog> {
    return this.http.get<TaskExecutionDetailLog>(`/messaging/task-executions/${executionId}`);
  }

  getConvoTypeById(id: number): Observable<ConvoType> {
    return this.http.get<ConvoType>(`/convos/types/${id}`);
  }

  createConvoType(data: Partial<ConvoType>): Observable<ConvoType> {
    return this.http.post<ConvoType>('/convos/types', data);
  }

  updateConvoType(id: number, data: Partial<ConvoType>): Observable<ConvoType> {
    return this.http.put<ConvoType>(`/convos/types/${id}`, data);
  }

  deleteConvoType(id: number): Observable<any> {
    return this.http.delete<any>(`/convos/types/${id}`);
  }

  // === CONVOCATORIAS ===
  getConvocatorias(): Observable<Convocatoria[]> {
    return this.http.get<Convocatoria[]>('/convos');
  }

  getConvocatoriaById(id: number): Observable<Convocatoria> {
    return this.http.get<Convocatoria>(`/convos/${id}`);
  }

  createConvocatoria(data: Partial<Convocatoria>): Observable<Convocatoria> {
    return this.http.post<Convocatoria>('/convos', data);
  }

  createConvocatorias(data: Partial<Convocatoria>[]): Observable<Convocatoria[]> {
    return this.http.post<Convocatoria[]>('/convos/bulk', data);
  }

  updateConvocatoria(id: number, data: Partial<Convocatoria>): Observable<Convocatoria> {
    return this.http.put<Convocatoria>(`/convos/${id}`, data);
  }

  startConvocatoria(id: number, campaignForm: CampaignFormSubmitPayload): Observable<Convocatoria> {
    return this.http.post<Convocatoria>(`/convos/${id}/start`, campaignForm);
  }

  finishConvocatoria(id: number, campaignForm: CampaignFormSubmitPayload): Observable<Convocatoria> {
    return this.http.post<Convocatoria>(`/convos/${id}/finish`, campaignForm);
  }

  getCampaignFormContext(id: number, mode?: 'start' | 'update' | 'finish'): Observable<CampaignFormContext> {
    const query = new URLSearchParams();
    if (mode) {
      query.set('mode', mode);
    }

    const queryText = query.toString();
    return this.http.get<CampaignFormContext>(`/convos/${id}/campaign-form-context${queryText ? `?${queryText}` : ''}`);
  }

  getCampaignForms(filters?: { convoId?: number; serviceMoment?: 'START' | 'END' }): Observable<CampaignFormRecord[]> {
    const query = new URLSearchParams();
    if (filters?.convoId) {
      query.set('convoId', String(filters.convoId));
    }
    if (filters?.serviceMoment) {
      query.set('serviceMoment', filters.serviceMoment);
    }

    const queryText = query.toString();
    return this.http.get<CampaignFormRecord[]>(`/convos/campaign-forms/list${queryText ? `?${queryText}` : ''}`);
  }

  deleteCampaignForm(id: number): Observable<CampaignFormRecord> {
    return this.http.delete<CampaignFormRecord>(`/convos/campaign-forms/${id}`);
  }

  getUserHoursDetail(userId: number): Observable<UserHoursDetail> {
    return this.http.get<UserHoursDetail>(`/convos/hours/summary/${userId}`);
  }

  getHoursSummary(): Observable<UserHoursSummaryResponse> {
    return this.http.get<UserHoursSummaryResponse>('/convos/hours/summary');
  }

  updateConvocatoriaLifecycle(
    id: number,
    payload: { actualStartTime?: string | null; actualEndTime?: string | null }
  ): Observable<Convocatoria> {
    return this.http.patch<Convocatoria>(`/convos/${id}/lifecycle`, payload);
  }

  updateCampaignForm(id: number, campaignForm: CampaignFormSubmitPayload): Observable<Convocatoria> {
    return this.http.put<Convocatoria>(`/convos/${id}/campaign-form`, campaignForm);
  }

  deleteConvocatoria(id: number): Observable<any> {
    return this.http.delete<any>(`/convos/${id}`);
  }

  // === RESPUESTAS ===
  getRespuestas(): Observable<Respuesta[]> {
    return this.http.get<Respuesta[]>('/dispo');
  }

  getRespuestaById(id: number): Observable<Respuesta> {
    return this.http.get<Respuesta>(`/dispo/${id}`);
  }

  createRespuesta(data: Partial<Respuesta>): Observable<Respuesta> {
    return this.http.post<Respuesta>('/dispo', data);
  }

  updateRespuesta(id: number, data: Partial<Respuesta>): Observable<Respuesta> {
    return this.http.put<Respuesta>(`/dispo/${id}`, data);
  }

  deleteRespuesta(id: number): Observable<any> {
    return this.http.delete<any>(`/dispo/${id}`);
  }

  sendConvocatoriaResponseRequest(convoId: number): Observable<any> {
    return this.http.post<any>(`/messaging/dispatch/convocatoria/${convoId}/response-request`, {});
  }

  sendConvocatoriaSortidaStatus(convoId: number): Observable<any> {
    return this.http.post<any>(`/messaging/dispatch/convocatoria/${convoId}/sortida-status`, {});
  }

  getMessagingLogs(): Observable<MessagingNotificationLog[]> {
    return this.http.get<MessagingNotificationLog[]>('/messaging/logs');
  }

  getMessagingSystemStatus(): Observable<MessagingSystemStatus> {
    return this.http.get<MessagingSystemStatus>('/messaging/system-status');
  }

  getTaskExecutions(): Observable<TaskExecutionLog[]> {
    return this.http.get<TaskExecutionLog[]>('/messaging/task-executions');
  }

  getMessagingConfigurations(): Observable<MessagingConfiguration[]> {
    return this.http.get<MessagingConfiguration[]>('/messaging/configurations');
  }

  updateMessagingConfiguration(configuration: MessagingConfiguration): Observable<MessagingConfiguration> {
    return this.http.put<MessagingConfiguration>(`/messaging/configurations/${configuration.id}`, {
      key: configuration.key,
      name: configuration.name,
      titleTemplate: configuration.titleTemplate,
      bodyTemplate: configuration.bodyTemplate,
      audienceRuleJson: configuration.audienceRuleJson,
      enabled: configuration.enabled,
    });
  }

  // === AVAILABILITY WINDOWS ===
  getAvailabilityWindows(filters?: {
    userNCarnet?: string;
    availabilityType?: 'available' | 'unavailable';
    fromDateTime?: string;
    toDateTime?: string;
  }): Observable<AvailabilityWindow[]> {
    const search = new URLSearchParams();

    if (filters?.userNCarnet) {
      search.set('userNCarnet', filters.userNCarnet);
    }

    if (filters?.availabilityType) {
      search.set('availabilityType', filters.availabilityType);
    }

    if (filters?.fromDateTime) {
      search.set('fromDateTime', filters.fromDateTime);
    }

    if (filters?.toDateTime) {
      search.set('toDateTime', filters.toDateTime);
    }

    const query = search.toString();
    return this.http.get<AvailabilityWindow[]>(`/availability/windows${query ? `?${query}` : ''}`);
  }

  createAvailabilityWindow(payload: AvailabilityWindowUpsertPayload): Observable<AvailabilityWindow> {
    return this.http.post<AvailabilityWindow>('/availability/windows', payload);
  }

  updateAvailabilityWindow(id: number, payload: Partial<AvailabilityWindowUpsertPayload>): Observable<AvailabilityWindow> {
    return this.http.put<AvailabilityWindow>(`/availability/windows/${id}`, payload);
  }

  deleteAvailabilityWindow(id: number): Observable<AvailabilityWindow> {
    return this.http.delete<AvailabilityWindow>(`/availability/windows/${id}`);
  }

  getPlaAlfaCatalog(): Observable<PlaAlfaCatalogResponse> {
    return this.http.get<PlaAlfaCatalogResponse>('/pla-alfa/catalog');
  }

  updatePlaAlfaMunicipalities(payload: PlaAlfaSelectionUpdatePayload): Observable<{ updatedAt: string; municipalities: string[]; principalMunicipality: string | null }> {
    return this.http.put<{ updatedAt: string; municipalities: string[]; principalMunicipality: string | null }>('/pla-alfa/municipalities', payload);
  }

  getIntervencions(params: { convocatoriaId?: number; date?: string }): Observable<Intervencio[]> {
    const query = params.convocatoriaId ? `?convocatoriaId=${params.convocatoriaId}` : (params.date ? `?date=${params.date}` : '');
    return this.http.get<Intervencio[]>(`/intervencions${query}`);
  }

  getIntervencionsContext(params: { date?: string; time?: string; convocatoriaId?: number }): Observable<IntervencioContext> {
    const q = new URLSearchParams();
    if (params.date) q.set('date', params.date);
    if (params.time) q.set('time', params.time);
    if (params.convocatoriaId) q.set('convocatoriaId', String(params.convocatoriaId));
    return this.http.get<IntervencioContext>(`/intervencions/context?${q.toString()}`);
  }

  saveIntervencio(id: number | null, payload: IntervencioPayload): Observable<Intervencio> {
    return id
      ? this.http.put<Intervencio>(`/intervencions/${id}`, payload)
      : this.http.post<Intervencio>('/intervencions', payload);
  }

  deleteIntervencio(id: number): Observable<{ id: number }> {
    return this.http.delete<{ id: number }>(`/intervencions/${id}`);
  }

  createTypeIncendi(name: string): Observable<TypeIncendi> {
    return this.http.post<TypeIncendi>('/intervencions/types', { name });
  }
  getPlaAlfaMunicipalitiesStatus(forceRefresh = false): Observable<PlaAlfaMunicipalitiesStatusResponse> {
    const query = forceRefresh ? '?refresh=true' : '';
    return this.http.get<PlaAlfaMunicipalitiesStatusResponse>(`/pla-alfa/municipalities${query}`);
  }
}
export interface TypeIncendi { id: number; name: string; }
export interface OtherAdfEntry { adf: string; vehicle: string; firstIntervention: boolean; }
export interface BomberEntry { vehicle: string; firstIntervention: boolean; }

export interface IntervencioPayload {
  convocatoriaId: number | null;
  responsableUserId: number | null;
  responsableName: string | null;
  responsableAdf: string | null;
  date: string;
  noticeTime: string | null;
  startTime: string | null;
  endTime: string | null;
  level: number | null;
  latitude: number | null;
  longitude: number | null;
  municipality: string | null;
  sector: string | null;
  comarca: string | null;
  ownVehicles: string[];
  firstInterventionVehicle?: string | null;
  otherAdfsAttended: boolean;
  otherAdfs: OtherAdfEntry[];
  otherAdfsGrocs: number;
  otherAdfsVerds: number;
  bombersAttended: boolean;
  bombers: BomberEntry[];
  ownGrocs: number;
  ownVerds: number;
  customGrocs: number;
  customVerds: number;
  surface: number | null;
  typeIncendiId: number | null;
}

export interface Intervencio extends IntervencioPayload {
  id: number;
  adfId: number;
  responsableDisplay: string | null;
  mapsUrl: string | null;
  totalGrocs: number;
  totalVerds: number;
}

export interface IntervencioConvoCandidate {
  id: number;
  title: string;
  type: string | null;
  startTime: string;
  finalTime: string | null;
  started: boolean;
  responsableId: number | null;
  responsableName: string | null;
}

export interface IntervencioContext {
  users: { id: number; nCarnet: string; name: string; lastName: string; nIndicatiu: string | null }[];
  types: TypeIncendi[];
  adfs: { id: number; number: number; name: string; municipalities: string[]; vehicles: string[] }[];
  ownAdfId: number | null;
  vehicleCatalog: string[];
  matched: IntervencioConvoCandidate | null;
  candidates: IntervencioConvoCandidate[];
  convocatoriaVehicles: { vehicleName: string; grocs: number; verds: number; volunteers: { id: number; nCarnet: string; name: string; nIndicatiu: string | null; isGroc: boolean }[] }[];
}