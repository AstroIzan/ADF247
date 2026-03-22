import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService, Convocatoria, ConvoType, User } from '../../services/data.service';

@Component({
  selector: 'app-convos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './convos.component.html',
  styleUrl: './convos.component.css'
})
export class ConvosComponent {
  @Input() convocatorias: Convocatoria[] = [];
  @Input() convoTypes: ConvoType[] = [];
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
    title: '',
    convoTypeId: 'all',
    responsableId: 'all',
    status: 'all',
    dateFrom: '',
    dateTo: '',
  });

  formData = signal<Partial<Convocatoria>>({
    date: '',
    title: '',
    ubiSortida: '',
    responsableId: undefined,
    convoTypeId: undefined,
    startTime: '',
    finalTime: '',
    moreThan2: false,
    isActive: true
  });

  filteredConvocatorias = computed(() => {
    const activeFilters = this.filters();
    const titleQuery = activeFilters.title.trim().toLowerCase();
    const fromTime = activeFilters.dateFrom ? new Date(activeFilters.dateFrom).setHours(0, 0, 0, 0) : null;
    const toTime = activeFilters.dateTo ? new Date(activeFilters.dateTo).setHours(23, 59, 59, 999) : null;

    return this.convocatorias.filter((convo) => {
      const matchesTitle = !titleQuery || (convo.title || '').toLowerCase().includes(titleQuery);
      const matchesType = activeFilters.convoTypeId === 'all' || String(convo.convoTypeId) === activeFilters.convoTypeId;
      const matchesResponsable = activeFilters.responsableId === 'all' || String(convo.responsableId) === activeFilters.responsableId;
      const matchesStatus =
        activeFilters.status === 'all' ||
        (activeFilters.status === 'active' ? convo.isActive : !convo.isActive);

      const convoTime = new Date(convo.date).getTime();
      const matchesFrom = fromTime === null || convoTime >= fromTime;
      const matchesTo = toTime === null || convoTime <= toTime;

      return matchesTitle && matchesType && matchesResponsable && matchesStatus && matchesFrom && matchesTo;
    });
  });

  constructor(private dataService: DataService) {}

  openFilters() {
    this.showFilters.set(true);
  }

  closeFilters() {
    this.showFilters.set(false);
  }

  updateFilterField(field: 'title' | 'convoTypeId' | 'responsableId' | 'status' | 'dateFrom' | 'dateTo', value: string) {
    this.filters.set({
      ...this.filters(),
      [field]: value,
    });
  }

  resetFilters() {
    this.filters.set({
      title: '',
      convoTypeId: 'all',
      responsableId: 'all',
      status: 'all',
      dateFrom: '',
      dateTo: '',
    });
  }

  openForm(convo?: Convocatoria) {
    if (convo) {
      this.editingId.set(convo.id);
      this.formData.set({ ...convo });
    } else {
      this.editingId.set(null);
      this.formData.set({
        date: '',
        title: '',
        ubiSortida: '',
        responsableId: undefined,
        convoTypeId: undefined,
        startTime: '',
        finalTime: '',
        moreThan2: false,
        isActive: true
      });
    }
    this.showForm.set(true);
  }

  closeForm() {
    this.showForm.set(false);
  }

  submitForm() {
    const data = this.formData();

    if (!data.date || !data.title || !data.responsableId || !data.convoTypeId) {
      alert('La fecha, titulo, responsable y tipo de convocatoria son obligatorios');
      return;
    }

    this.formSubmitting.set(true);

    if (this.editingId()) {
      this.dataService.updateConvocatoria(this.editingId()!, data).subscribe({
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
      this.dataService.createConvocatoria(data).subscribe({
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

  deleteConvocatoria(id: number) {
    if (this.deleteConfirming() === id) {
      this.dataService.deleteConvocatoria(id).subscribe({
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

  getUserName(userId?: number): string {
    if (!userId) return '-';
    const user = this.users.find((u) => u.id === userId);
    return user ? `${user.name} ${user.lastName || ''}` : '-';
  }

  getConvoTypeName(typeId?: number): string {
    if (!typeId) return '-';
    const type = this.convoTypes.find((t) => t.id === typeId);
    return type ? type.name : '-';
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-ES');
  }
}