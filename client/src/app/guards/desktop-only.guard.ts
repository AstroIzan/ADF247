import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

const MIN_DESKTOP_WIDTH_PX = 1024;

export const desktopOnlyGuard: CanActivateFn = () => {
  const router = inject(Router);
  const width = typeof window !== 'undefined' ? window.innerWidth : MIN_DESKTOP_WIDTH_PX;

  if (width >= MIN_DESKTOP_WIDTH_PX) {
    return true;
  }

  return router.createUrlTree(['/home']);
};
