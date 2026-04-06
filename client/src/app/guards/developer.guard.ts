import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { DataService } from '../services/data.service';
import { map, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export const developerGuard: CanActivateFn = () => {
  const dataService = inject(DataService);
  const router = inject(Router);

  return dataService.getLogsAccess().pipe(
    map((response) => {
      if (response?.allowed) {
        return true;
      }

      return router.createUrlTree(['/home']);
    }),
    catchError(() => of(router.createUrlTree(['/home'])))
  );
};
