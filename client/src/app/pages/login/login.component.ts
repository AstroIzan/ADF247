import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  nCarnet = '';
  password = '';
  loading = signal(false);
  errorMessage = signal('');
  returnUrl = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // Si ja esta autenticat, redirigir segons el rol
    if (this.authService.isLoggedIn()) {
      this.router.navigate([this.authService.isAdmin() ? '/dashboard' : '/home']);
      return;
    }

    // Obtenir la URL de retorn si existeix
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/home';
  }

  onSubmit() {
    if (!this.nCarnet || !this.password) {
      this.errorMessage.set('Si us plau, omple tots els camps');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    this.authService.login({ nCarnet: this.nCarnet, password: this.password })
      .subscribe({
        next: () => {
          this.router.navigate([this.returnUrl]);
        },
        error: (err) => {
          this.errorMessage.set(err.message || 'Error en l\'autenticació');
          this.loading.set(false);
        }
      });
  }
}
