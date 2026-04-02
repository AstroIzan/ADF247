import { Injectable } from '@angular/core';
import { HttpService } from './http.service';
import { Observable } from 'rxjs';

export interface User {
  id: number;
  nCarnet: string;
  nIndicatiu?: string;
  name: string;
  lastName?: string;
  password?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  roles: {
    isCapOperatiu: boolean;
    isCapColla: boolean;
    isAdmin: boolean;
    isGroc: boolean;
  };
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
  isActive: boolean;
  autoAssignResponsable: boolean;
  sortida: boolean;
  responseCount?: number;
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
  createdAt?: string;
  updatedAt?: string;
  convocatoria?: Convocatoria;
  user?: User;
}

export interface NotificationSettings {
  schedule: {
    dailyRunHour: number;
    dailyRunMinute: number;
    weeklyRequestWeekday: number;
  };
  typeGroups: {
    weeklyTypeNames: string[];
    sortidaTypeNames: string[];
    availabilityManagerNCarnets: string[];
    guardiaSourceTypeName: string;
    guardiaPviTypeName: string;
  };
  responseRequest: {
    sendOnCreationForNonWeekly: boolean;
    pendingLeadDays: number;
    pendingLeadHours: number;
    link: string;
    creationTitle: string;
    creationBody: string;
    fireTitle?: string;
    fireBody?: string;
    weeklyCreatedTitle?: string;
    weeklyCreatedBody?: string;
    pendingTitle: string;
    pendingBody: string;
  };
  weeklyRequest: {
    enabled: boolean;
    requestWeekday: number;
    requestHour: number;
    requestMinute: number;
    link: string;
    title: string;
    body: string;
  };
  sortidaStatus: {
    enabled: boolean;
    confirmDaysBefore: number;
    confirmHour: number;
    confirmMinute: number;
    link: string;
    titleYes: string;
    bodyYes: string;
    titleNo: string;
    bodyNo: string;
    titleCancelled?: string;
    bodyCancelled?: string;
    titleReten?: string;
    bodyReten?: string;
    perTypeTemplates?: Record<string, {
      title: string;
      body: string;
    }>;
  };
  availabilityMatching?: {
    conflictPolicy: 'unavailable-wins' | 'available-wins' | 'skip-on-conflict';
    createAvailableResponses: boolean;
    createUnavailableResponses: boolean;
    autoCreateUnavailableForUsersWithoutWindow: boolean;
    notifyOnAutoAvailableResponse: boolean;
  };
  automation?: NotificationAutomationConfig;
}

export interface NotificationAutomationTaskConfig {
  taskKey: string;
  notifyKind: 'pending-responses' | 'sortida-status' | 'weekly-digest' | 'sortida-confirmed' | 'sortida-cancelled' | 'sortida-reten' | 'weekly-pending';
  enabled: boolean;
  schedule: {
    kind: 'daily' | 'weekly' | 'manual';
  };
  convoTypeFilter: string[];
  timeoutMs: number;
  retryPolicy: {
    maxRetries: number;
  };
  dependsOn: string[];
}

export interface NotificationAutomationConfig {
  retentionDays: number;
  viewerNCarnets: string[];
  monitoring: {
    enabled: boolean;
    alertRecipientNCarnets: string[];
    alertOnMissedRun: boolean;
    alertOnTaskFailure: boolean;
  };
  tasks: NotificationAutomationTaskConfig[];
}

export interface NotificationAutomationTaskRun {
  id: number;
  taskKey: string;
  status: 'running' | 'success' | 'failed' | 'skipped';
  startedAt: string;
  finishedAt?: string | null;
  durationMs?: number | null;
  errorMessage?: string | null;
  details?: {
    skipped?: boolean;
    reason?: string | null;
    notificationCount?: number | null;
    targetedUsers?: number | null;
  } | null;
}

export interface NotificationAutomationRun {
  id: number;
  correlationId?: string;
  trigger: string;
  source: string;
  status: 'running' | 'success' | 'partial' | 'failed' | 'skipped';
  startedAt: string;
  finishedAt?: string | null;
  durationMs?: number | null;
  errorMessage?: string | null;
  actor?: {
    id: number;
    nCarnet: string;
    name: string;
    lastName?: string | null;
  } | null;
  tasks: NotificationAutomationTaskRun[];
}

export interface NotificationAutomationTaskExecutionResult {
  runId: number;
  taskKey: string;
  status: 'success' | 'failed';
  result?: Record<string, unknown> | null;
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

export interface NotificationLog {
  id: number;
  title: string;
  body: string;
  data?: Record<string, unknown> | null;
  targetScope: string;
  requestedCount: number;
  successCount: number;
  failureCount: number;
  status: string;
  errorMessage?: string | null;
  createdAt: string;
  senderUserId?: number | null;
}

export interface DeviceTokenAdmin {
  id: number;
  token: string;
  platform?: string | null;
  isActive: boolean;
  lastSeenAt?: string | null;
  createdAt?: string | null;
  user?: { id: number; nCarnet: string; name: string; lastName?: string | null } | null;
}

export interface ApiHealthStatus {
  ok: boolean;
  service: string;
  dependencies?: {
    firebase?: {
      configured: boolean;
      message?: string;
    };
  };
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
  municipalities: PlaAlfaMunicipalityCatalogItem[];
}

export interface PlaAlfaMunicipalityStatusItem {
  municipality: string;
  comarca: string | null;
  todayLevel: number | null;
  tomorrowLevel: number | null;
  todayObjectId: number | null;
  tomorrowObjectId: number | null;
  foundToday: boolean;
  foundTomorrow: boolean;
}

export interface PlaAlfaMunicipalitiesStatusResponse {
  updatedAt: string;
  municipalities: PlaAlfaMunicipalityStatusItem[];
}

@Injectable({
  providedIn: 'root'
})
export class DataService {

  constructor(private http: HttpService) {}

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

  updateConvocatoria(id: number, data: Partial<Convocatoria>): Observable<Convocatoria> {
    return this.http.put<Convocatoria>(`/convos/${id}`, data);
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

  // === NOTIFICATIONS ===
  getNotificationConfig(): Observable<NotificationSettings> {
    return this.http.get<NotificationSettings>('/notifications/config');
  }

  updateNotificationConfig(data: Partial<NotificationSettings>): Observable<NotificationSettings> {
    return this.http.put<NotificationSettings>('/notifications/config', data);
  }

  getNotificationLogs(limit = 30): Observable<NotificationLog[]> {
    return this.http.get<NotificationLog[]>(`/notifications/logs?limit=${limit}`);
  }

  getAllDeviceTokens(): Observable<DeviceTokenAdmin[]> {
    return this.http.get<DeviceTokenAdmin[]>('/notifications/device-tokens/all');
  }

  sendConvocatoriaResponseRequest(convoId: number): Observable<any> {
    return this.http.post<any>(`/notifications/dispatch/convocatoria/${convoId}/response-request`, {});
  }

  sendConvocatoriaSortidaStatus(convoId: number): Observable<any> {
    return this.http.post<any>(`/notifications/dispatch/convocatoria/${convoId}/sortida-status`, {});
  }

  sendPendingResponsesReminder(): Observable<any> {
    return this.http.post<any>('/notifications/dispatch/pending-responses', {});
  }

  sendWeeklyResponseDigest(): Observable<any> {
    return this.http.post<any>('/notifications/dispatch/weekly-response-digest', {});
  }

  sendTomorrowSortidaNotifications(): Observable<any> {
    return this.http.post<any>('/notifications/dispatch/tomorrow-sortida', {});
  }

  runNotificationAutomation(): Observable<any> {
    return this.http.post<any>('/notifications/automation/run', {});
  }

  runConvocatoriaNotificationAutomation(convoId: number): Observable<any> {
    return this.http.post<any>(`/notifications/automation/convocatoria/${convoId}/run`, {});
  }

  runNotificationAutomationTask(taskKey: string): Observable<NotificationAutomationTaskExecutionResult> {
    return this.http.post<NotificationAutomationTaskExecutionResult>(`/notifications/automation/tasks/${taskKey}/run`, {});
  }

  getNotificationAutomationRuns(limit = 50): Observable<NotificationAutomationRun[]> {
    return this.http.get<NotificationAutomationRun[]>(`/notifications/automation/runs?limit=${limit}`);
  }

  getNotificationAutomationRunById(id: number): Observable<NotificationAutomationRun> {
    return this.http.get<NotificationAutomationRun>(`/notifications/automation/runs/${id}`);
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

  getHealthStatus(): Observable<ApiHealthStatus> {
    return this.http.get<ApiHealthStatus>('/health');
  }

  getPlaAlfaCatalog(): Observable<PlaAlfaCatalogResponse> {
    return this.http.get<PlaAlfaCatalogResponse>('/pla-alfa/catalog');
  }

  updatePlaAlfaMunicipalities(municipalities: string[]): Observable<{ updatedAt: string; municipalities: string[] }> {
    return this.http.put<{ updatedAt: string; municipalities: string[] }>('/pla-alfa/municipalities', { municipalities });
  }

  getPlaAlfaMunicipalitiesStatus(): Observable<PlaAlfaMunicipalitiesStatusResponse> {
    return this.http.get<PlaAlfaMunicipalitiesStatusResponse>('/pla-alfa/municipalities');
  }
}
