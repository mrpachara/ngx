import { inject } from '@angular/core';
import { Router, Routes } from '@angular/router';
import {
  AuthorizationCodeCallbackComponent,
  provideAuthorizationCodeCallbackData,
} from '@mrpachara/ngx-oauth2-access-token';
import { myOauth } from './app.config.new';
import { HomeComponent } from './core/home/home.component';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },

  // NOTE: HomeComponent should call AccessTokenService.fetchToken()
  //       or AccessTokenService.extract(idTokenService).
  { path: 'home', component: HomeComponent },

  {
    path: 'google/authorization',
    providers: [
      provideAuthorizationCodeCallbackData<{ intendedUrl: string }>(() => ({
        id: myOauth,
        processFactory: () => {
          const router = inject(Router);

          return ({ intendedUrl }) => {
            router.navigateByUrl(intendedUrl);
          };
        },
      })),
    ],
    component: AuthorizationCodeCallbackComponent,
  },
];
