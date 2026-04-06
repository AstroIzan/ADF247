import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { HomeComponent } from './pages/home/home.component';
import { AvailabilityComponent } from './pages/availability/availability.component';
import { LogsComponent } from './pages/logs/logs.component';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';
import { developerGuard } from './guards/developer.guard';

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
    canActivate: [authGuard, adminGuard]
  },
  {
    path: 'availability',
    component: AvailabilityComponent,
    canActivate: [authGuard]
  },
  {
    path: 'logs',
    component: LogsComponent,
    canActivate: [authGuard, developerGuard]
  },
  {
    path: '**',
    redirectTo: '/home'
  }
];
