import { inject } from '@angular/core';
import { Router, Routes } from '@angular/router';
import {
  AuthorizationCodeCallback,
  provideAuthorizationCodeCallbackData,
} from '@mrpachara/ngx-oauth2-access-token';
import { Home } from './core/home/home';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },

  { path: 'home', component: Home },

  {
    path: 'google/authorization',
    providers: [
      provideAuthorizationCodeCallbackData<{ intendedUrl: string }>(() => ({
        // id: demoOauth,
        actionFactory: () => {
          const router = inject(Router);

          return ({ intendedUrl }) => {
            router.navigateByUrl(intendedUrl);
          };
        },
      })),
    ],
    component: AuthorizationCodeCallback,
  },
];
