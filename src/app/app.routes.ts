import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./login/login.page').then(m => m.LoginPage)
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then(m => m.LoginPage)
  },
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then(m => m.HomePage),
    canActivate: [authGuard]
  },
  {
    path: 'map',
    loadComponent: () => import('./map/map.page').then(m => m.MapPage),
    canActivate: [authGuard]
  },
  {
    path: 'notice',
    loadComponent: () => import('./notice/notice.page').then(m => m.NoticePage),
    canActivate: [authGuard]
  },
  {
    path: 'maps',
    loadComponent: () => import('./maps/maps.page').then( m => m.MapsPage),
    canActivate: [authGuard]
  },
  {
    path: 'notifications',
    loadComponent: () => import('./notifications/notifications.page').then( m => m.NotificationsPage),
    canActivate: [authGuard]
  },
  {
    path: 'report',
    loadComponent: () => import('./report/report.page').then( m => m.ReportPage),
    canActivate: [authGuard]
  },
  {
    path: 'info',
    loadComponent: () => import('./info/info.page').then( m => m.InfoPage),
    canActivate: [authGuard]
  }
];