import { Routes } from '@angular/router';

import { AuthorizationCodeCallbackComponent } from '@mrpachara/ngx-oauth2-access-token';

import { HomeComponent } from './core/home/home.component';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },

  // NOTE: HomeComponent should call AccessTokenService.fetchToken()
  //       or AccessTokenService.extract(idTokenService).
  { path: 'home', component: HomeComponent },

  {
    path: 'google/authorization',
    component: AuthorizationCodeCallbackComponent,
  },
];
