import { inject } from '@angular/core';
import { Router, Routes } from '@angular/router';
import {
  AUTHORIZATION_CODE_CALLBACK_DATA,
  AuthorizationCodeCallbackComponent,
  AuthorizationCodeCallbackData,
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
      {
        provide: AUTHORIZATION_CODE_CALLBACK_DATA,
        useFactory: () =>
          ({
            id: myOauth,
            processFactory: () => {
              const router = inject(Router);

              return ({ intendedUrl }) => {
                router.navigateByUrl(intendedUrl);
              };
            },
          }) satisfies AuthorizationCodeCallbackData<{ intendedUrl: string }>,
      },
    ],
    component: AuthorizationCodeCallbackComponent,
  },
];
