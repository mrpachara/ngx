import { Routes } from '@angular/router';

import { AutorizationCodeCallbackComponent } from '@mrpachara/ngx-oauth2-access-token';

import { HomeComponent } from './core/home/home.component';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  // NOTE: HomeComponent should call AccessTokenService.fetchAccessToken()
  { path: 'home', component: HomeComponent },
  {
    path: 'google/authorization',
    component: AutorizationCodeCallbackComponent,
  },
];
