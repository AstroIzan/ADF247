import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { NotificationsAdminComponent } from './notifications-admin.component';
import { DataService } from '../../services/data.service';

describe('NotificationsAdminComponent', () => {
  let component: NotificationsAdminComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationsAdminComponent],
      providers: [
        {
          provide: DataService,
          useValue: {
            getNotificationAutomationRuns: () => of([]),
            getNotificationAutomationRunById: () => of(null),
            runNotificationAutomationTask: () => of({ runId: 1, taskKey: 'pending-responses', status: 'success' }),
            updateNotificationConfig: () => of({}),
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(NotificationsAdminComponent);
    component = fixture.componentInstance;
  });

  it('calcula automationStats incluyendo executions omitides', () => {
    component.automationRuns = [
      {
        id: 1,
        correlationId: 'scheduled-1',
        trigger: 'scheduled',
        source: 'scheduler',
        status: 'success',
        startedAt: new Date().toISOString(),
        durationMs: 1000,
        tasks: [],
      },
      {
        id: 2,
        correlationId: 'missed-1',
        trigger: 'missed-run',
        source: 'scheduler',
        status: 'failed',
        startedAt: new Date().toISOString(),
        durationMs: 0,
        tasks: [],
      },
    ] as any;

    const stats = component.automationStats;
    expect(stats).not.toBeNull();
    expect(stats?.total).toBe(1);
    expect(stats?.missedCount).toBe(1);
    expect(stats?.successRate).toBe(100);
  });

  it('muestra etiqueta de trigger amigable', () => {
    expect(component.getRunTriggerLabel('missed-run')).toContain('Omesa');
    expect(component.getRunTriggerLabel('manual')).toBe('Manual');
  });
});
