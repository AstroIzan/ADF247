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
  responsableId: number;
  convoTypeId: number;
  startTime: string;
  finalTime?: string;
  moreThan2: boolean;
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
  isCustom: boolean;
  customText?: string | null;
  fullHorari: boolean;
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
  };
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

  getHealthStatus(): Observable<ApiHealthStatus> {
    return this.http.get<ApiHealthStatus>('/health');
  }
}
