import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  DataService,
  MessagingNotificationLog,
  NotificationDeliveryLog,
  PlaAlfaSimulation,
  TaskExecutionDetailLog,
  TaskExecutionLog,
} from '../../services/data.service';

type DevTab = 'runbooks' | 'registre' | 'execucions';
type Runbook = 'all' | 'weekly-convos' | 'daily-notifications';

@Component({
  selector: 'app-dev',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dev.component.html',
  styleUrl: './dev.component.css',
})
export class DevComponent implements OnInit {
  activeTab = signal<DevTab>('runbooks');
  error = signal('');
  notice = signal('');

  simulation = signal<PlaAlfaSimulation | null>(null);
  simulationSaving = signal(false);
  runningRunbook = signal<Runbook | null>(null);

  logs = signal<MessagingNotificationLog[]>([]);
  executions = signal<TaskExecutionLog[]>([]);
  loadingLogs = signal(false);
  loadingExecutions = signal(false);

  selectedNotification = signal<MessagingNotificationLog | null>(null);
  deliveries = signal<NotificationDeliveryLog[]>([]);
  loadingDeliveries = signal(false);

  selectedExecution = signal<TaskExecutionDetailLog | null>(null);
  loadingExecutionDetail = signal(false);

  readonly levels = [0, 1, 2, 3, 4, 5];
  readonly runbooks: { key: Runbook; name: string; description: string }[] = [
    {
      key: 'weekly-convos',
      name: 'Generar convocatòries setmanals',
      description: 'Consulta el nivell de Pla Alfa, genera les convocatòries de la setmana vinent i avisa els usuaris pendents.',
    },
    {
      key: 'daily-notifications',
      name: 'Notificacions diàries',
      description: 'Envia els avisos de les convocatòries d’avui: respostes pendents i estat de sortida.',
    },
    {
      key: 'all',
      name: 'Tots els runbooks',
      description: 'Executa tots els processos Batch seguits.',
    },
  ];

  constructor(private dataService: DataService) {}

  ngOnInit() {
    this.loadSimulation();
  }

  setTab(tab: DevTab) {
    this.activeTab.set(tab);
    if (tab === 'registre') this.loadLogs();
    if (tab === 'execucions') this.loadExecutions();
  }

  private msg(error: any, fallback: string): string {
    return error?.error?.message || error?.message || fallback;
  }

  loadSimulation() {
    this.dataService.getPlaAlfaSimulation().subscribe({
      next: (simulation) => this.simulation.set(simulation),
      error: (error) => this.error.set(this.msg(error, 'No s’ha pogut carregar la simulació.')),
    });
  }

  updateLevel(field: 'todayLevel' | 'tomorrowLevel', value: string) {
    const simulation = this.simulation();
    if (!simulation) return;
    this.simulation.set({ ...simulation, [field]: value === '' ? null : Number(value) });
  }

  saveSimulation() {
    const simulation = this.simulation();
    if (!simulation || this.simulationSaving()) return;
    this.simulationSaving.set(true);
    this.error.set('');
    this.notice.set('');
    this.dataService.updatePlaAlfaSimulation({
      todayLevel: simulation.todayLevel,
      tomorrowLevel: simulation.tomorrowLevel,
    }).subscribe({
      next: (saved) => {
        this.simulation.set(saved);
        this.simulationSaving.set(false);
        this.notice.set('Simulació desada. Només s’aplica a les execucions manuals.');
      },
      error: (error) => {
        this.simulationSaving.set(false);
        this.error.set(this.msg(error, 'No s’ha pogut desar la simulació.'));
      },
    });
  }

  run(runbook: Runbook) {
    if (this.runningRunbook()) return;
    this.runningRunbook.set(runbook);
    this.error.set('');
    this.notice.set('');
    this.dataService.runAllBatchJobs(runbook).subscribe({
      next: () => {
        this.runningRunbook.set(null);
        this.notice.set('Execució sol·licitada. Apareixerà a Execucions en menys d’un minut.');
      },
      error: (error) => {
        this.runningRunbook.set(null);
        this.error.set(this.msg(error, 'No s’ha pogut sol·licitar l’execució.'));
      },
    });
  }

  loadLogs() {
    this.loadingLogs.set(true);
    this.dataService.getMessagingLogs().subscribe({
      next: (logs) => {
        this.logs.set(logs);
        this.loadingLogs.set(false);
      },
      error: (error) => {
        this.loadingLogs.set(false);
        this.error.set(this.msg(error, 'No s’ha pogut carregar el registre.'));
      },
    });
  }

  loadExecutions() {
    this.loadingExecutions.set(true);
    this.dataService.getTaskExecutions().subscribe({
      next: (executions) => {
        this.executions.set(executions);
        this.loadingExecutions.set(false);
      },
      error: (error) => {
        this.loadingExecutions.set(false);
        this.error.set(this.msg(error, 'No s’han pogut carregar les execucions.'));
      },
    });
  }

  openDeliveries(log: MessagingNotificationLog) {
    this.selectedNotification.set(log);
    this.deliveries.set([]);
    this.loadingDeliveries.set(true);
    this.dataService.getNotificationDeliveries(log.id).subscribe({
      next: (deliveries) => {
        this.deliveries.set(deliveries);
        this.loadingDeliveries.set(false);
      },
      error: (error) => {
        this.loadingDeliveries.set(false);
        this.error.set(this.msg(error, 'No s’han pogut carregar els destinataris.'));
      },
    });
  }

  closeDeliveries() {
    this.selectedNotification.set(null);
  }

  openExecution(execution: TaskExecutionLog) {
    this.loadingExecutionDetail.set(true);
    this.selectedExecution.set({ ...execution, details: [] } as TaskExecutionDetailLog);
    this.dataService.getTaskExecutionDetail(execution.taskExecutionId).subscribe({
      next: (detail) => {
        this.selectedExecution.set(detail);
        this.loadingExecutionDetail.set(false);
      },
      error: (error) => {
        this.loadingExecutionDetail.set(false);
        this.error.set(this.msg(error, 'No s’ha pogut carregar el detall.'));
      },
    });
  }

  closeExecution() {
    this.selectedExecution.set(null);
  }
}
