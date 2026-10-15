import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ConvoType,
  DataService,
  PlaAlfaSimulation,
  SystemConfiguration,
  SystemConfigurationVehicle,
  User,
  WeeklyConvocatoriaSchedule,
} from '../../services/data.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-system-configuration',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './system-configuration.component.html',
  styleUrl: './system-configuration.component.css',
})
export class SystemConfigurationComponent {
  loading = signal(true);
  saving = signal(false);
  error = signal('');
  configuration = signal<SystemConfiguration | null>(null);
  convoTypes = signal<ConvoType[]>([]);
  users = signal<User[]>([]);
  newVehicle = signal<SystemConfigurationVehicle>({ indicatiu: '', modelo: '', litres: 0, kms: 0 });
  plaAlfaSimulation = signal<PlaAlfaSimulation | null>(null);
  simulationSaving = signal(false);
  developerUpdatingUserId = signal<number | null>(null);

  constructor(private dataService: DataService, private authService: AuthService) {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.error.set('');
    let pending = 3;
    const complete = () => {
      pending--;
      if (pending === 0) this.loading.set(false);
    };

    this.dataService.getSystemConfiguration().subscribe({
      next: (configuration) => {
        this.configuration.set(configuration);
        complete();
      },
      error: (error) => {
        this.error.set(error.message || 'No s’ha pogut carregar la configuració del sistema.');
        complete();
      },
    });
    this.dataService.getConvoTypes().subscribe({
      next: (types) => {
        this.convoTypes.set(types);
        complete();
      },
      error: (error) => {
        this.error.set(error.message || 'No s’han pogut carregar els tipus de convocatòria.');
        complete();
      },
    });
    this.dataService.getUsers().subscribe({
      next: (users) => {
        this.users.set(users);
        complete();
      },
      error: (error) => {
        this.error.set(error.message || 'No s’han pogut carregar els usuaris.');
        complete();
      },
    });
    if (this.authService.isDeveloper()) {
      this.dataService.getPlaAlfaSimulation().subscribe({
        next: (simulation) => this.plaAlfaSimulation.set(simulation),
        error: (error) => this.error.set(error.message || 'No s’ha pogut carregar la simulació de Pla Alfa.'),
      });
    }
  }

  isDeveloper() {
    return this.authService.isDeveloper();
  }

  savePlaAlfaSimulation() {
    const simulation = this.plaAlfaSimulation();
    if (!simulation || this.simulationSaving()) return;
    this.simulationSaving.set(true);
    this.error.set('');
    this.dataService.updatePlaAlfaSimulation({
      todayLevel: simulation.todayLevel,
      tomorrowLevel: simulation.tomorrowLevel,
    }).subscribe({
      next: (saved) => {
        this.plaAlfaSimulation.set(saved);
        this.simulationSaving.set(false);
      },
      error: (error) => {
        this.error.set(error.error?.message || error.message || 'No s’ha pogut desar la simulació de Pla Alfa.');
        this.simulationSaving.set(false);
      },
    });
  }

  updatePlaAlfaSimulation(field: 'todayLevel' | 'tomorrowLevel', value: string) {
    const simulation = this.plaAlfaSimulation();
    if (!simulation) return;
    this.plaAlfaSimulation.set({
      ...simulation,
      [field]: value === '' ? null : Number(value),
    });
  }

  isWeeklyTypeSelected(typeId: number) {
    return this.configuration()?.weeklyConvoTypeIds.includes(typeId) ?? false;
  }

  toggleWeeklyType(typeId: number, selected: boolean) {
    this.updateConfiguration((configuration) => ({
      ...configuration,
      weeklyConvoTypeIds: selected
        ? [...new Set([...configuration.weeklyConvoTypeIds, typeId])]
        : configuration.weeklyConvoTypeIds.filter((id) => id !== typeId),
      weeklyConvocatoriaSchedules: selected
        ? [...configuration.weeklyConvocatoriaSchedules, { convoTypeId: typeId, dayOfWeek: 1, startTime: '08:00', endTime: '14:00' }]
        : configuration.weeklyConvocatoriaSchedules.filter((schedule) => schedule.convoTypeId !== typeId),
    }));
  }

  schedulesForType(typeId: number) {
    return this.configuration()?.weeklyConvocatoriaSchedules.filter((schedule) => schedule.convoTypeId === typeId) ?? [];
  }

  updateWeeklySchedule(typeId: number, index: number, field: keyof WeeklyConvocatoriaSchedule, value: string | number) {
    this.updateConfiguration((configuration) => {
      let occurrence = 0;
      return {
        ...configuration,
        weeklyConvocatoriaSchedules: configuration.weeklyConvocatoriaSchedules.map((schedule) => {
          if (schedule.convoTypeId !== typeId) return schedule;
          const currentIndex = occurrence++;
          return currentIndex === index ? { ...schedule, [field]: value } : schedule;
        }),
      };
    });
  }

  addWeeklySchedule(typeId: number) {
    this.updateConfiguration((configuration) => ({
      ...configuration,
      weeklyConvocatoriaSchedules: [...configuration.weeklyConvocatoriaSchedules, {
        convoTypeId: typeId,
        dayOfWeek: 1,
        startTime: '08:00',
        endTime: '14:00',
      }],
    }));
  }

  removeWeeklySchedule(typeId: number, index: number) {
    this.updateConfiguration((configuration) => {
      let occurrence = 0;
      return {
        ...configuration,
        weeklyConvocatoriaSchedules: configuration.weeklyConvocatoriaSchedules.filter((schedule) => {
          if (schedule.convoTypeId !== typeId) return true;
          return occurrence++ !== index;
        }),
      };
    });
  }

  isAvailabilityManagerSelected(nCarnet: string) {
    return this.configuration()?.availabilityManagerNCarnets.includes(nCarnet) ?? false;
  }

  toggleAvailabilityManager(nCarnet: string, selected: boolean) {
    this.updateConfiguration((configuration) => ({
      ...configuration,
      availabilityManagerNCarnets: selected
        ? [...new Set([...configuration.availabilityManagerNCarnets, nCarnet])]
        : configuration.availabilityManagerNCarnets.filter((value) => value !== nCarnet),
    }));
  }

  getAdminUsers() {
    return this.users().filter((user) => user.isActive && user.roles.isAdmin);
  }

  getActiveUsers() {
    return this.users().filter((user) => user.isActive);
  }

  getDeveloperUsers() {
    return this.getActiveUsers().filter((user) => this.isDeveloperSelected(user));
  }

  isDeveloperSelected(user: User) {
    return Boolean(user.roles?.isDeveloper);
  }

  toggleDeveloper(user: User, selected: boolean) {
    if (this.developerUpdatingUserId() !== null) return;

    this.developerUpdatingUserId.set(user.id);
    this.error.set('');
    this.dataService.updateUser(user.id, {
      roles: {
        ...user.roles,
        isDeveloper: selected,
      },
    }).subscribe({
      next: (updatedUser) => {
        this.users.set(this.users().map((item) => item.id === updatedUser.id ? updatedUser : item));
        this.developerUpdatingUserId.set(null);
      },
      error: (error) => {
        this.error.set(error.error?.message || error.message || 'No s’ha pogut actualitzar el permís de desenvolupador.');
        this.developerUpdatingUserId.set(null);
      },
    });
  }

  addVehicle() {
    const vehicle = this.newVehicle();
    if (!vehicle.indicatiu.trim()) {
      this.error.set('L’indicatiu del vehicle és obligatori.');
      return;
    }

    this.updateConfiguration((configuration) => ({
      ...configuration,
      vehicleCatalog: [...configuration.vehicleCatalog, {
        indicatiu: vehicle.indicatiu.trim(),
        modelo: vehicle.modelo?.trim() || null,
        litres: Number(vehicle.litres) || 0,
        kms: Number(vehicle.kms) || 0,
      }],
    }));
    this.newVehicle.set({ indicatiu: '', modelo: '', litres: 0, kms: 0 });
  }

  removeVehicle(indicatiu: string) {
    this.updateConfiguration((configuration) => ({
      ...configuration,
      vehicleCatalog: configuration.vehicleCatalog.filter((vehicle) => vehicle.indicatiu !== indicatiu),
    }));
  }

  save() {
    const configuration = this.configuration();
    if (!configuration || this.saving()) return;
    this.saving.set(true);
    this.error.set('');
    const { updatedAt: _, ...request } = configuration;
    this.dataService.updateSystemConfiguration(request).subscribe({
      next: (saved) => {
        this.configuration.set(saved);
        this.saving.set(false);
      },
      error: (error) => {
        this.error.set(error.error?.message || error.message || 'No s’ha pogut desar la configuració del sistema.');
        this.saving.set(false);
      },
    });
  }

  private updateConfiguration(update: (configuration: SystemConfiguration) => SystemConfiguration) {
    const configuration = this.configuration();
    if (configuration) this.configuration.set(update(configuration));
  }
}
