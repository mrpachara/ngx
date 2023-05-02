import { EnvironmentProviders } from '@angular/core';
import { Oauth2ClientConfig } from './types';

export function provideOauth2AccessToken(
  config: Oauth2ClientConfig,
): EnvironmentProviders;
export function provideOauth2AccessToken(
  configs: Oauth2ClientConfig[],
): EnvironmentProviders;

export function provideOauth2AccessToken(
  configs: Oauth2ClientConfig | Oauth2ClientConfig[],
): EnvironmentProviders {
  console.debug(configs);
  throw new Error('Not implemented');
}
