import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { HomeComponent } from './pages/home/home.component';
import { AvailabilityComponent } from './pages/availability/availability.component';
import { PlaAlfaComponent } from './pages/pla-alfa/pla-alfa.component';
import { HoursSummaryComponent } from './pages/hours-summary/hours-summary.component';
import { SystemConfigurationComponent } from './pages/system-configuration/system-configuration.component';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';
import { managerGuard } from './guards/manager.guard';
import { developerGuard } from './guards/developer.guard';
import { globalGuard } from './guards/global.guard';
import { AdfGlobalComponent } from './pages/adf-global/adf-global.component';
import { DevComponent } from './pages/dev/dev.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'home',
    component: HomeComponent,
    canActivate: [authGuard]
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard, managerGuard]
  },
  {
    path: 'availability',
    component: AvailabilityComponent,
    canActivate: [authGuard]
  },
  {
    path: 'pla-alfa',
    component: PlaAlfaComponent,
    canActivate: [authGuard]
  },
  {
    path: 'hours-summary',
    component: HoursSummaryComponent,
    canActivate: [authGuard, managerGuard]
  },
  {
    path: 'system',
    component: SystemConfigurationComponent,
    canActivate: [authGuard, adminGuard]
  },
  {
    path: 'adf-global',
    component: AdfGlobalComponent,
    canActivate: [authGuard, globalGuard]
  },
  {
    path: 'dev',
    component: DevComponent,
    canActivate: [authGuard, developerGuard]
  },
  {
    path: '**',
    redirectTo: '/home'
  }
];
