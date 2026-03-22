import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService, User } from '../../services/data.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css'
})
export class UsersComponent {
  @Input() users: User[] = [];
  @Input() loading = false;
  @Input() error = '';
  @Output() onChanged = new EventEmitter<void>();

  showForm = signal(false);
  showFilters = signal(false);
  editingId = signal<number | null>(null);
  formSubmitting = signal(false);
  deleteConfirming = signal<number | null>(null);

  filters = signal({
    name: '',
    nIndicatiu: '',
    nCarnet: '',
    role: 'all',
  });

  formData = signal<Partial<User>>({
    nCarnet: '',
    nIndicatiu: '',
    name: '',
    lastName: '',
    password: '',
    isActive: true,
    roles: {
      isAdmin: false,
      isGroc: false,
      isCapColla: false,
      isCapOperatiu: false,
    }
  });

  filteredUsers = computed(() => {
    const activeFilters = this.filters();
    const nameQuery = activeFilters.name.trim().toLowerCase();
    const indicatiuQuery = activeFilters.nIndicatiu.trim().toLowerCase();
    const carnetQuery = activeFilters.nCarnet.trim().toLowerCase();

    return this.users.filter((user) => {
      const matchesName =
        !nameQuery ||
        `${user.name || ''} ${user.lastName || ''}`.toLowerCase().includes(nameQuery);

      const matchesIndicatiu = !indicatiuQuery || (user.nIndicatiu || '').toLowerCase().includes(indicatiuQuery);
      const matchesCarnet = !carnetQuery || (user.nCarnet || '').toLowerCase().includes(carnetQuery);

      const matchesRole =
        activeFilters.role === 'all' ||
        (activeFilters.role === 'none'
          ? !user.roles?.isAdmin && !user.roles?.isGroc && !user.roles?.isCapColla && !user.roles?.isCapOperatiu
          : Boolean((user.roles as any)?.[activeFilters.role]));

      return matchesName && matchesIndicatiu && matchesCarnet && matchesRole;
    });
  });

  constructor(private dataService: DataService) {}

  openFilters() {
    this.showFilters.set(true);
  }

  closeFilters() {
    this.showFilters.set(false);
  }

  updateFilterField(field: 'name' | 'nIndicatiu' | 'nCarnet' | 'role', value: string) {
    this.filters.set({
      ...this.filters(),
      [field]: value,
    });
  }

  resetFilters() {
    this.filters.set({
      name: '',
      nIndicatiu: '',
      nCarnet: '',
      role: 'all',
    });
  }

  openForm(user?: User) {
    if (user) {
      this.editingId.set(user.id);
      this.formData.set({
        ...user,
        roles: {
          isAdmin: Boolean(user.roles?.isAdmin),
          isGroc: Boolean(user.roles?.isGroc),
          isCapColla: Boolean(user.roles?.isCapColla),
          isCapOperatiu: Boolean(user.roles?.isCapOperatiu),
        }
      });
    } else {
      this.editingId.set(null);
      this.formData.set({
        nCarnet: '',
        nIndicatiu: '',
        name: '',
        lastName: '',
        password: '',
        isActive: true,
        roles: {
          isAdmin: false,
          isGroc: false,
          isCapColla: false,
          isCapOperatiu: false,
        }
      });
    }
    this.showForm.set(true);
  }

  closeForm() {
    this.showForm.set(false);
  }

  submitForm() {
    const data = this.formData();

    if (!data.nCarnet || !data.name) {
      alert('El numero de carnet y el nombre son obligatorios');
      return;
    }

    this.formSubmitting.set(true);

    if (this.editingId()) {
      this.dataService.updateUser(this.editingId()!, data).subscribe({
        next: () => {
          this.formSubmitting.set(false);
          this.closeForm();
          this.onChanged.emit();
        },
        error: (err) => {
          alert('Error al actualizar: ' + err.message);
          this.formSubmitting.set(false);
        }
      });
    } else {
      this.dataService.createUser(data).subscribe({
        next: () => {
          this.formSubmitting.set(false);
          this.closeForm();
          this.onChanged.emit();
        },
        error: (err) => {
          alert('Error al crear: ' + err.message);
          this.formSubmitting.set(false);
        }
      });
    }
  }

  deleteUser(id: number) {
    if (this.deleteConfirming() === id) {
      this.dataService.deleteUser(id).subscribe({
        next: () => {
          this.deleteConfirming.set(null);
          this.onChanged.emit();
        },
        error: (err) => {
          alert('Error al eliminar: ' + err.message);
        }
      });
    } else {
      this.deleteConfirming.set(id);
    }
  }

  cancelDelete() {
    this.deleteConfirming.set(null);
  }

  updateFormField(field: string, value: any) {
    const data = this.formData();
    (data as any)[field] = value;
    this.formData.set({ ...data });
  }

  updateRoleField(roleField: string, checked: boolean) {
    const data = this.formData();
    const roles = {
      isAdmin: false,
      isGroc: false,
      isCapColla: false,
      isCapOperatiu: false,
      ...(data.roles || {}),
    } as any;

    roles[roleField] = checked;

    this.formData.set({
      ...data,
      roles,
    });
  }

  getRoleLabels(user: User): string[] {
    const labels: string[] = [];

    if (user.roles?.isAdmin) labels.push('Admin');
    if (user.roles?.isGroc) labels.push('Groc');
    if (user.roles?.isCapColla) labels.push('Cap Colla');
    if (user.roles?.isCapOperatiu) labels.push('Cap Operatiu');

    return labels;
  }
}