import { Component, Input, Output, EventEmitter, signal, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService, Respuesta, Convocatoria, User } from '../../services/data.service';

@Component({
  selector: 'app-respuestas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './respuestas.component.html',
  styleUrl: './respuestas.component.css'
})
export class RespuestasComponent {
  respuestas = input<Respuesta[]>([]);
  convocatorias = input<Convocatoria[]>([]);
  users = input<User[]>([]);
  loading = input(false);
  error = input('');
  @Output() onChanged = new EventEmitter<void>();

  showForm = signal(false);
  showFilters = signal(false);
  editingId = signal<number | null>(null);
  formSubmitting = signal(false);
  deleteConfirming = signal<number | null>(null);

  filters = signal({
    response: 'all',
    isCustom: 'all',
    fullHorari: 'all',
    userNCarnet: 'all',
    convoId: 'all',
  });

  formData = signal<Partial<Respuesta>>({
    convoId: undefined,
    userNCarnet: '',
    response: true,
    isCustom: false,
    customText: '',
    fullHorari: false
  });

  filteredRespuestas = computed(() => {
    const activeFilters = this.filters();

    return this.respuestas().filter((respuesta) => {
      const matchesResponse =
        activeFilters.response === 'all' ||
        (activeFilters.response === 'yes' ? respuesta.response : !respuesta.response);

      const matchesCustom =
        activeFilters.isCustom === 'all' ||
        (activeFilters.isCustom === 'yes' ? respuesta.isCustom : !respuesta.isCustom);

      const matchesFullHorari =
        activeFilters.fullHorari === 'all' ||
        (activeFilters.fullHorari === 'yes' ? respuesta.fullHorari : !respuesta.fullHorari);

      const matchesUser =
        activeFilters.userNCarnet === 'all' ||
        respuesta.userNCarnet === activeFilters.userNCarnet;

      const matchesConvo =
        activeFilters.convoId === 'all' ||
        String(respuesta.convoId) === activeFilters.convoId;

      return matchesResponse && matchesCustom && matchesFullHorari && matchesUser && matchesConvo;
    });
  });

  constructor(private dataService: DataService) {}

  openFilters() {
    this.showFilters.set(true);
  }

  closeFilters() {
    this.showFilters.set(false);
  }

  updateFilterField(field: 'response' | 'isCustom' | 'fullHorari' | 'userNCarnet' | 'convoId', value: string) {
    this.filters.set({
      ...this.filters(),
      [field]: value,
    });
  }

  resetFilters() {
    this.filters.set({
      response: 'all',
      isCustom: 'all',
      fullHorari: 'all',
      userNCarnet: 'all',
      convoId: 'all',
    });
  }

  openForm(respuesta?: Respuesta) {
    if (respuesta) {
      this.editingId.set(respuesta.id);
      this.formData.set({ ...respuesta });
    } else {
      this.editingId.set(null);
      this.formData.set({
        convoId: undefined,
        userNCarnet: '',
        response: true,
        isCustom: false,
        customText: '',
        fullHorari: false
      });
    }
    this.showForm.set(true);
  }

  closeForm() {
    this.showForm.set(false);
  }

  submitForm() {
    const data = this.formData();

    if (!data.convoId || !data.userNCarnet) {
      alert('La convocatoria y el usuario son obligatorios');
      return;
    }

    this.formSubmitting.set(true);

    if (this.editingId()) {
      this.dataService.updateRespuesta(this.editingId()!, data).subscribe({
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
      this.dataService.createRespuesta(data).subscribe({
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

  deleteRespuesta(id: number) {
    if (this.deleteConfirming() === id) {
      this.dataService.deleteRespuesta(id).subscribe({
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

  getConvoTitle(convoId?: number): string {
    if (!convoId) return '-';
    const convo = this.convocatorias().find((c) => c.id === convoId);
    return convo ? convo.title : '-';
  }

  getUserName(nCarnet?: string): string {
    if (!nCarnet) return '-';
    const user = this.users().find((u) => u.nCarnet === nCarnet);
    return user ? `${user.name} ${user.lastName || ''}` : nCarnet;
  }
}