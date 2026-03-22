import { Component, signal, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { DataService, User, Convocatoria, ConvoType, Respuesta } from '../../services/data.service';
import { UsersModule } from '../../modules/users/users.module';
import { ConvosModule } from '../../modules/convos/convos.module';
import { DispoModule } from '../../modules/dispo/dispo.module';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, UsersModule, ConvosModule, DispoModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  activeTab = signal<string>('users');
  username = signal<string>('');

  // Users data
  users = signal<User[]>([]);
  loadingUsers = signal(false);
  userError = signal('');

  // Convos data
  convocatorias = signal<Convocatoria[]>([]);
  convoTypes = signal<ConvoType[]>([]);
  loadingConvos = signal(false);
  convoError = signal('');

  // Respuestas data
  respuestas = signal<Respuesta[]>([]);
  loadingRespuestas = signal(false);
  respuestaError = signal('');

  constructor(
    private authService: AuthService,
    private dataService: DataService,
    private router: Router
  ) {
    // Verificar autenticación al entrar
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.username.set(currentUser.name);
    }
  }

  ngOnInit() {
    // Verificar que sigue siendo válida la sesión
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    
    this.loadAllData();
  }

  loadAllData() {
    this.loadUsers();
    this.loadConvocatorias();
    this.loadConvoTypes();
    this.loadRespuestas();
  }

  loadUsers() {
    this.loadingUsers.set(true);
    this.userError.set('');
    this.dataService.getUsers().subscribe({
      next: (data) => {
        this.users.set(data);
        this.loadingUsers.set(false);
      },
      error: (err) => {
        this.userError.set(err.message);
        this.loadingUsers.set(false);
      }
    });
  }

  loadConvocatorias() {
    this.loadingConvos.set(true);
    this.convoError.set('');
    this.dataService.getConvocatorias().subscribe({
      next: (data) => {
        this.convocatorias.set(data);
        this.loadingConvos.set(false);
      },
      error: (err) => {
        this.convoError.set(err.message);
        this.loadingConvos.set(false);
      }
    });
  }

  loadConvoTypes() {
    this.dataService.getConvoTypes().subscribe({
      next: (data) => {
        this.convoTypes.set(data);
      },
      error: (err) => {
        console.error('Error loading convo types:', err);
      }
    });
  }

  loadRespuestas() {
    this.loadingRespuestas.set(true);
    this.respuestaError.set('');
    this.dataService.getRespuestas().subscribe({
      next: (data) => {
        this.respuestas.set(data);
        this.loadingRespuestas.set(false);
      },
      error: (err) => {
        this.respuestaError.set(err.message);
        this.loadingRespuestas.set(false);
      }
    });
  }

  onUserChanged() {
    this.loadUsers();
  }

  onConvoChanged(convo: any) {
    // Si convo es null, es un delete, hacer reload completo
    if (!convo) {
      this.loadConvocatorias();
      this.loadConvoTypes();
      return;
    }

    // Para update/create, actualizar el array local
    const currentConvos = this.convocatorias();
    const existingIndex = currentConvos.findIndex(c => c.id === convo.id);

    if (existingIndex >= 0) {
      // Es un update, reemplazar en el array
      const updated = [...currentConvos];
      updated[existingIndex] = convo;
      this.convocatorias.set(updated);
    } else {
      // Es un create, añadir al inicio
      this.convocatorias.set([convo, ...currentConvos]);
    }
  }

  onRespuestaChanged() {
    this.loadRespuestas();
  }

  logout() {
    this.authService.logout();
  }
}
