import { inject } from '@angular/core';
import { Router, Routes } from '@angular/router';
import {
  AuthorizationCodeCallbackComponent,
  provideAuthorizationCodeCallbackData,
} from '@mrpachara/ngx-oauth2-access-token';
import { demoOauth } from './app.config';
import { Home } from './core/home/home';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },

  { path: 'home', component: Home },

  {
    path: 'google/authorization',
    providers: [
      provideAuthorizationCodeCallbackData<{ intendedUrl: string }>(() => ({
        id: demoOauth,
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
