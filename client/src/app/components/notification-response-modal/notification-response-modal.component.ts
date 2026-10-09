import { Component, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { Convocatoria, DataService } from '../../services/data.service';

@Component({
  selector: 'app-notification-response-modal',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './notification-response-modal.component.html',
  styleUrl: './notification-response-modal.component.css',
})
export class NotificationResponseModalComponent {
  readonly visible = signal(false);
  readonly loading = signal(false);
  readonly submitting = signal(false);
  readonly error = signal('');
  readonly convocatoria = signal<Convocatoria | null>(null);

  constructor(private data: DataService, private auth: AuthService) {}

  async open(convoId: number) {
    this.visible.set(true);
    this.loading.set(true);
    this.error.set('');
    this.convocatoria.set(null);
    try {
      this.convocatoria.set(await firstValueFrom(this.data.getConvocatoriaById(convoId)));
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No se ha podido cargar la convocatoria.');
    } finally {
      this.loading.set(false);
    }
  }

  close() {
    this.visible.set(false);
    this.convocatoria.set(null);
  }

  async respond(response: boolean) {
    const convocatoria = this.convocatoria();
    const userNCarnet = this.auth.getCachedNCarnet();
    if (!convocatoria || !userNCarnet) return;
    this.submitting.set(true);
    this.error.set('');
    try {
      await firstValueFrom(this.data.createRespuesta({
        convoId: convocatoria.id,
        userNCarnet,
        response,
        isCustom: false,
        fullHorari: response,
      }));
      this.close();
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No se ha podido guardar la respuesta.');
    } finally {
      this.submitting.set(false);
    }
  }
}
