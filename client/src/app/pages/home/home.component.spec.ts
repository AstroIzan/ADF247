import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { HomeComponent } from './home.component';
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';
import { Router } from '@angular/router';

describe('HomeComponent', () => {
  let component: HomeComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        {
          provide: AuthService,
          useValue: {
            isLoggedIn: () => true,
            isAdmin: () => false,
            getCurrentUser: () => ({ id: 1, nCarnet: '247001' }),
          },
        },
        {
          provide: DataService,
          useValue: {
            getConvocatorias: () => of([]),
            getConvoTypes: () => of([]),
            getRespuestas: () => of([]),
            getUsers: () => of([]),
          },
        },
        {
          provide: Router,
          useValue: {
            navigate: () => Promise.resolve(true),
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
  });

  it('ordena respuestas positivas con fallback estable por nCarnet cuando faltan usuarios en cache', () => {
    component.users.set([]);
    component.allRespuestas.set([
      {
        id: 1,
        convoId: 10,
        userNCarnet: '247010',
        response: true,
        fullHorari: true,
        isCustom: false,
        source: 'manual',
      },
      {
        id: 2,
        convoId: 10,
        userNCarnet: '247001',
        response: true,
        fullHorari: true,
        isCustom: false,
        source: 'manual',
      },
    ] as any);

    const sorted = component.getPositiveRespuestasForConvocatoria(10);
    expect(sorted.map((r) => r.userNCarnet)).toEqual(['247001', '247010']);
  });

  it('prioriza createdAt de usuario al ordenar respuestas positivas', () => {
    component.users.set([
      {
        id: 1,
        nCarnet: '247001',
        name: 'Anna',
        lastName: 'A',
        password: '',
        isActive: true,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        roles: { isAdmin: false, isCapOperatiu: false, isCapColla: false, isGroc: false },
      },
      {
        id: 2,
        nCarnet: '247002',
        name: 'Bernat',
        lastName: 'B',
        password: '',
        isActive: true,
        createdAt: '2026-02-01T00:00:00.000Z',
        updatedAt: '2026-02-01T00:00:00.000Z',
        roles: { isAdmin: false, isCapOperatiu: false, isCapColla: false, isGroc: false },
      },
    ] as any);

    component.allRespuestas.set([
      {
        id: 1,
        convoId: 99,
        userNCarnet: '247002',
        response: true,
        fullHorari: true,
        isCustom: false,
        source: 'manual',
      },
      {
        id: 2,
        convoId: 99,
        userNCarnet: '247001',
        response: true,
        fullHorari: true,
        isCustom: false,
        source: 'manual',
      },
    ] as any);

    const sorted = component.getPositiveRespuestasForConvocatoria(99);
    expect(sorted.map((r) => r.userNCarnet)).toEqual(['247001', '247002']);
  });
});
