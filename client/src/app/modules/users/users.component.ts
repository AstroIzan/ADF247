import { Component, HostListener, Input, Output, EventEmitter, signal, computed, input, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService, User, UsersCsvImportResult, UserHoursSummaryRow } from '../../services/data.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css'
})
export class UsersComponent implements OnDestroy {
  readonly pageSizeOptions = [10, 25, 50];
  users = input<User[]>([]);
  hoursSummaryRows = input<UserHoursSummaryRow[]>([]);
  loading = input(false);
  error = input('');
  @Output() onChanged = new EventEmitter<void>();

  showForm = signal(false);
  showFilters = signal(false);
  editingId = signal<number | null>(null);
  formSubmitting = signal(false);
  deleteConfirming = signal<number | null>(null);
  selectedUser = signal<User | null>(null);
  changePassword = signal(false);
  confirmPassword = signal('');
  showImportModal = signal(false);
  importCsvName = signal('');
  importCsvHeaders = signal<string[]>([]);
  importCsvContent = signal('');
  importSubmitting = signal(false);
  importResult = signal<UsersCsvImportResult | null>(null);

  filters = signal({
    name: '',
    nIndicatiu: '',
    nCarnet: '',
    role: 'all',
  });

  formData = signal<Partial<User>>({
    nCarnet: '',
    nIndicatiu: '',
    phone: '',
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

    return this.users().filter((user) => {
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

  userHoursSummaryMap = computed(() => {
    const map = new Map<string, UserHoursSummaryRow>();
    for (const row of this.hoursSummaryRows()) {
      map.set(String(row.userNCarnet || ''), row);
    }
    return map;
  });

  pageSize = signal(10);
  pageIndex = signal(1);

  totalPages = computed(() => {
    const total = this.filteredUsers().length;
    return Math.max(1, Math.ceil(total / this.pageSize()));
  });

  currentPage = computed(() => Math.min(this.pageIndex(), this.totalPages()));

  paginatedUsers = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filteredUsers().slice(start, start + this.pageSize());
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
    this.pageIndex.set(1);
  }

  resetFilters() {
    this.filters.set({
      name: '',
      nIndicatiu: '',
      nCarnet: '',
      role: 'all',
    });
    this.pageIndex.set(1);
  }

  setPageSize(value: string) {
    const nextSize = Number(value);
    this.pageSize.set(this.pageSizeOptions.includes(nextSize) ? nextSize : 10);
    this.pageIndex.set(1);
  }

  goToPreviousPage() {
    this.pageIndex.set(Math.max(1, this.currentPage() - 1));
  }

  goToNextPage() {
    this.pageIndex.set(Math.min(this.totalPages(), this.currentPage() + 1));
  }

  openForm(user?: User) {
    this.changePassword.set(false);
    this.confirmPassword.set('');

    if (user) {
      this.editingId.set(user.id);
      this.formData.set({
        ...user,
        password: '',
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
        phone: '',
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
    document.body.classList.add('modal-open');
  }

  closeForm() {
    this.showForm.set(false);
    document.body.classList.remove('modal-open');
  }

  openImportCsvModal() {
    this.showImportModal.set(true);
    this.importResult.set(null);
    this.importCsvName.set('');
    this.importCsvHeaders.set([]);
    this.importCsvContent.set('');
    document.body.classList.add('modal-open');
  }

  closeImportCsvModal() {
    this.showImportModal.set(false);
    document.body.classList.remove('modal-open');
  }

  downloadCsvTemplate() {
    const template = [
      'nCarnet,nIndicatiu,phone,name,lastName,password,isActive,isAdmin,isGroc,isCapOperatiu,isCapColla',
      '247001,BR-01,600000001,Izan,Admin,Passw0rd!,true,true,false,false,false',
      '247002,BR-12,600000002,Joan,Perez,Passw0rd!,true,false,true,false,false',
    ].join('\n');

    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'users-import-template-v1.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  }

  async onCsvFileSelected(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const file = inputElement.files?.[0];

    if (!file) {
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('El fitxer supera el límit de 2MB.');
      inputElement.value = '';
      return;
    }

    const name = file.name.toLowerCase();

    if (!name.endsWith('.csv')) {
      alert('Només es permeten fitxers CSV.');
      inputElement.value = '';
      return;
    }

    const text = await file.text();
    const [headerLine] = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
    const headers = (headerLine || '')
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);

    this.importCsvName.set(file.name);
    this.importCsvHeaders.set(headers);
    this.importCsvContent.set(text);
    this.importResult.set(null);
  }

  submitCsvImport() {
    const csvContent = this.importCsvContent();

    if (!csvContent.trim()) {
      alert('Selecciona un fitxer CSV abans de processar.');
      return;
    }

    this.importSubmitting.set(true);

    this.dataService.importUsersFromCsv({
      csvContent,
      fileName: this.importCsvName() || undefined,
    }).subscribe({
      next: (result) => {
        this.importResult.set(result);
        this.importSubmitting.set(false);
        this.onChanged.emit();
      },
      error: (err) => {
        alert('Error en importar CSV: ' + (err?.error?.message || err.message || 'Error desconegut'));
        this.importSubmitting.set(false);
      },
    });
  }

  submitForm() {
    const data = this.formData();

    if (!data.nCarnet || !data.name) {
      alert('El numero de carnet i el nom son obligatoris.');
      return;
    }

    const isEditing = Boolean(this.editingId());
    const password = String(data.password || '').trim();
    const confirmPassword = this.confirmPassword().trim();

    if (!isEditing && !password) {
      alert('La contrasenya es obligatoria per crear un usuari.');
      return;
    }

    if (!isEditing && password !== confirmPassword) {
      alert('La confirmacio de contrasenya no coincideix.');
      return;
    }

    if (isEditing && this.changePassword()) {
      if (!password) {
        alert('Has d\'introduir una nova contrasenya.');
        return;
      }

      if (password !== confirmPassword) {
        alert('La confirmacio de contrasenya no coincideix.');
        return;
      }
    }

    const payload: Partial<User> = { ...data };

    if (isEditing && !this.changePassword()) {
      delete payload.password;
    }

    this.formSubmitting.set(true);

    if (this.editingId()) {
      this.dataService.updateUser(this.editingId()!, payload).subscribe({
        next: () => {
          this.formSubmitting.set(false);
          this.closeForm();
          this.onChanged.emit();
        },
        error: (err) => {
          alert('Error en actualitzar: ' + err.message);
          this.formSubmitting.set(false);
        }
      });
    } else {
      this.dataService.createUser(payload).subscribe({
        next: () => {
          this.formSubmitting.set(false);
          this.closeForm();
          this.onChanged.emit();
        },
        error: (err) => {
          alert('Error en crear: ' + err.message);
          this.formSubmitting.set(false);
        }
      });
    }
  }

  requestDelete(id: number) {
    this.deleteConfirming.set(id);
  }

  deleteUser(id: number) {
    this.dataService.deleteUser(id).subscribe({
      next: () => {
        this.deleteConfirming.set(null);
        this.onChanged.emit();
      },
      error: (err) => {
        alert('Error en eliminar: ' + err.message);
      }
    });
  }

  cancelDelete() {
    this.deleteConfirming.set(null);
  }

  @HostListener('document:click', ['$event'])
  handleDocumentClick(event: MouseEvent) {
    if (this.deleteConfirming() === null) {
      return;
    }

    const target = event.target as HTMLElement | null;
    if (target?.closest('.delete-menu')) {
      return;
    }

    this.cancelDelete();
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

  getUserCampaignHours(user: User) {
    const row = this.userHoursSummaryMap().get(String(user.nCarnet || ''));
    return row?.campaignHours ?? 0;
  }

  getUserOffCampaignHours(user: User) {
    const row = this.userHoursSummaryMap().get(String(user.nCarnet || ''));
    return row?.offCampaignHours ?? 0;
  }

  ngOnDestroy() {
    document.body.classList.remove('modal-open');
  }
}