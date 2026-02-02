// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./components/auth/login/login.component').then(
        (m) => m.LoginComponent
      ),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./components/auth/register/register.component').then(
        (m) => m.RegisterComponent
      ),
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./components/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: 'timesheets',
    loadComponent: () =>
      import(
        './components/timesheet/timesheet-list/timesheet-list.component'
      ).then((m) => m.TimesheetListComponent),
    canActivate: [authGuard],
  },
  {
    path: 'timesheets/new',
    loadComponent: () =>
      import(
        './components/timesheet/timesheet-form/timesheet-form.component'
      ).then((m) => m.TimesheetFormComponent),
    canActivate: [authGuard],
  },
  {
    path: 'timesheets/approvals',
    loadComponent: () =>
      import(
        './components/timesheet/timesheet-approval/timesheet-approval.component'
      ).then((m) => m.TimesheetApprovalComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'manager'] },
  },
  {
    path: 'analytics',
    loadComponent: () =>
      import(
        './components/analytics/productivity-analytics/productivity-analytics.component'
      ).then((m) => m.ProductivityAnalyticsComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'manager'] },
  },
  {
    path: '**',
    redirectTo: '/login',
  },
];
