import { Component, Output, EventEmitter, signal, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService, ConvoType } from '../../services/data.service';

@Component({
  selector: 'app-convo-types',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './convo-types.component.html',
  styleUrl: './convo-types.component.css'
})
export class ConvoTypesComponent {
  readonly pageSizeOptions = [10, 25, 50];
  convoTypes = input<ConvoType[]>([]);
  @Output() onChanged = new EventEmitter<void>();

  showForm = signal(false);
  showFilters = signal(false);
  editingId = signal<number | null>(null);
  formSubmitting = signal(false);
  deleteConfirming = signal<number | null>(null);

  filters = signal({
    name: '',
    id: '',
  });

  formData = signal<Partial<ConvoType>>({
    name: '',
    minGrocSortida: 0,
    minVerdSortida: 0,
    defaultLocation: '',
  });

  filteredConvoTypes = computed(() => {
    const activeFilters = this.filters();
    const nameQuery = activeFilters.name.trim().toLowerCase();
    const idQuery = activeFilters.id.trim();

    return this.convoTypes().filter((type) => {
      const matchesName = !nameQuery || (type.name || '').toLowerCase().includes(nameQuery);
      const matchesId = !idQuery || String(type.id).includes(idQuery);
      return matchesName && matchesId;
    });
  });

  pageSize = signal(10);
  pageIndex = signal(1);

  totalPages = computed(() => {
    const total = this.filteredConvoTypes().length;
    return Math.max(1, Math.ceil(total / this.pageSize()));
  });

  currentPage = computed(() => Math.min(this.pageIndex(), this.totalPages()));

  paginatedConvoTypes = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filteredConvoTypes().slice(start, start + this.pageSize());
  });

  constructor(private dataService: DataService) {}

  openFilters() {
    this.showFilters.set(true);
  }

  closeFilters() {
    this.showFilters.set(false);
  }

  updateFilterField(field: 'name' | 'id', value: string) {
    this.filters.set({
      ...this.filters(),
      [field]: value,
    });
    this.pageIndex.set(1);
  }

  resetFilters() {
    this.filters.set({
      name: '',
      id: '',
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

  openForm(type?: ConvoType) {
    if (type) {
      this.editingId.set(type.id);
      this.formData.set({ ...type });
    } else {
      this.editingId.set(null);
      this.formData.set({
        name: '',
        minGrocSortida: 0,
        minVerdSortida: 0,
        defaultLocation: '',
      });
    }
    this.showForm.set(true);
  }

  closeForm() {
    this.showForm.set(false);
  }

  submitForm() {
    const data = this.formData();

    if (!data.name) {
      alert('El nom es obligatori');
      return;
    }

    this.formSubmitting.set(true);

    if (this.editingId()) {
      this.dataService.updateConvoType(this.editingId()!, data).subscribe({
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
      this.dataService.createConvoType(data).subscribe({
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

  deleteType(id: number) {
    if (this.deleteConfirming() === id) {
      this.dataService.deleteConvoType(id).subscribe({
        next: () => {
          this.deleteConfirming.set(null);
          this.onChanged.emit();
        },
        error: (err) => {
          alert('Error en eliminar: ' + err.message);
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

    if ((field === 'minGrocSortida' || field === 'minVerdSortida') && Number.isNaN(value)) {
      (data as any)[field] = 0;
    } else {
      (data as any)[field] = value;
    }

    this.formData.set({ ...data });
  }
}