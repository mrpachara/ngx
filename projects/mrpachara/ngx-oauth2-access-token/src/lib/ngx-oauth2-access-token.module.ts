import { NgModule } from '@angular/core';

import { AccessTokenLocalStorageFactory } from './storage/local-storage/access-token-local.storage.factory';
import { AuthorizationCodeLocalStorageFactory } from './storage/local-storage/authorization-code-local.storage.factory';
import {
  ACCESS_TOKEN_STORAGE_FACTORY,
  AUTHORIZATION_CODE_STORAGE_FACTORY,
} from './tokens';

export const NGX_OAUTH2_ACCESS_TOKEN_PROVIDERS = [
  {
    provide: ACCESS_TOKEN_STORAGE_FACTORY,
    useClass: AccessTokenLocalStorageFactory,
  },
  {
    provide: AUTHORIZATION_CODE_STORAGE_FACTORY,
    useClass: AuthorizationCodeLocalStorageFactory,
  },
] as const;

@NgModule({
  declarations: [],
  providers: [...NGX_OAUTH2_ACCESS_TOKEN_PROVIDERS],
})
export class NgxOauth2AccessTokenModule {}
