import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';

interface EditForm {
  name: string;
  lastName: string;
  nCarnet?: string;
  nIndicatiu?: string;
  password: string;
  passwordConfirm: string;
  isActive?: boolean;
  roles?: {
    isAdmin?: boolean;
    isGroc?: boolean;
    isCapColla?: boolean;
    isCapOperatiu?: boolean;
  };
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent implements OnInit {
  showModal = signal(false);
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  passwordError = signal('');

  formData = signal<EditForm>({
    name: '',
    lastName: '',
    password: '',
    passwordConfirm: '',
  });

  constructor(
    public authService: AuthService,
    private dataService: DataService
  ) {}

  ngOnInit() {
    this.loadUserData();
  }

  loadUserData() {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.formData.set({
        name: user.name || '',
        lastName: user.lastName || '',
        nCarnet: user.nCarnet,
        nIndicatiu: user.nIndicatiu || '',
        password: '',
        passwordConfirm: '',
        isActive: true,
        roles: {
          isAdmin: (Array.isArray(user.roles) ? user.roles[0]?.isAdmin : user.roles?.isAdmin) || false,
          isGroc: (Array.isArray(user.roles) ? user.roles[0]?.isGroc : user.roles?.isGroc) || false,
          isCapColla: (Array.isArray(user.roles) ? user.roles[0]?.isCapColla : user.roles?.isCapColla) || false,
          isCapOperatiu: (Array.isArray(user.roles) ? user.roles[0]?.isCapOperatiu : user.roles?.isCapOperatiu) || false,
        },
      });
    }
  }

  openModal() {
    this.errorMessage.set('');
    this.successMessage.set('');
    this.passwordError.set('');
    this.loadUserData();
    this.showModal.set(true);
    document.body.classList.add('modal-open');
  }

  closeModal() {
    this.showModal.set(false);
    this.errorMessage.set('');
    this.successMessage.set('');
    this.passwordError.set('');
    this.formData.set({
      name: '',
      lastName: '',
      password: '',
      passwordConfirm: '',
    });
    document.body.classList.remove('modal-open');
  }

  validatePassword() {
    const form = this.formData();
    this.passwordError.set('');

    if (form.password && form.passwordConfirm) {
      if (form.password !== form.passwordConfirm) {
        this.passwordError.set('Les contrasenyes no coincideixen.');
        return false;
      }
      if (form.password.length < 6) {
        this.passwordError.set('La contrasenya ha de tenir mínim 6 caràcters.');
        return false;
      }
    }
    return true;
  }

  saveChanges() {
    const form = this.formData();
    const user = this.authService.getCurrentUser();

    if (!user) {
      this.errorMessage.set('No s\'ha pogut identificar l\'usuari.');
      return;
    }

    // Validacions bàsiques
    if (!form.name || form.name.trim().length === 0) {
      this.errorMessage.set('El nom és obligatori.');
      return;
    }

    if (!form.nCarnet || form.nCarnet.trim().length === 0) {
      this.errorMessage.set('El número de carnet és obligatori.');
      return;
    }

    if (!this.validatePassword()) {
      return;
    }

    // Construir payload segons rol
    const payload: any = {
      name: form.name.trim(),
      lastName: form.lastName?.trim() || undefined,
    };

    // Si es admin, permet editar més camps
    if (this.authService.isAdmin()) {
      if (form.nCarnet) {
        payload.nCarnet = form.nCarnet;
      }
      if (form.nIndicatiu !== undefined) {
        payload.nIndicatiu = form.nIndicatiu?.trim() || undefined;
      }
      if (form.isActive !== undefined) {
        payload.isActive = form.isActive;
      }
      if (form.roles) {
        payload.roles = form.roles;
      }
    }

    // Agregar contraseña si se cambió
    if (form.password) {
      payload.password = form.password;
    }

    // Limpiar contraseñas del payload si están vacías
    if (!form.password) {
      delete payload.password;
      delete payload.passwordConfirm;
    }

    this.isLoading.set(true);

    this.dataService.updateUser(user.id, payload).subscribe({
      next: (updatedUser) => {
        this.isLoading.set(false);
        this.successMessage.set('Dades actualitzades correctament.');

        // Actualizar el usuario en AuthService
        this.authService.updateCachedUser(updatedUser);

        // Cerrar modal inmediatamente
        this.closeModal();
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          err.error?.message || err.message || 'Error al actualitzar les dades.'
        );
      },
    });
  }

  onPasswordChange() {
    // Validació en temps real de contrasenya
    if (this.formData().password || this.formData().passwordConfirm) {
      this.validatePassword();
    }
  }

  toggleRole(role: 'isAdmin' | 'isGroc' | 'isCapColla' | 'isCapOperatiu') {
    const roles = this.formData().roles || {};
    roles[role] = !roles[role];
    this.formData.set({
      ...this.formData(),
      roles,
    });
  }

  getRoleLabel(role: string): string {
    const labels: { [key: string]: string } = {
      isAdmin: 'Administrador',
      isGroc: 'Groc',
      isCapColla: 'Cap de Colla',
      isCapOperatiu: 'Cap Operatiu',
    };
    return labels[role] || role;
  }
}
