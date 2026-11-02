import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const globalGuard: CanActivateFn = (_route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  if (!authService.isGlobalViewer()) {
    router.navigate(['/home']);
    return false;
  }

  return true;
};
