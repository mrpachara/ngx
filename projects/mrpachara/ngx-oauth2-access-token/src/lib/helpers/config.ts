import { IdTokenConfig, PickOptional } from '../types';

/** Default ID token configuration */
export const defaultIdTokenConfig: PickOptional<IdTokenConfig> = {
  providedInAccessToken: false,
} as const;

/**
 * Create the full ID token configuration.
 *
 * @param config The configuration
 * @returns The full configuration
 */
export function configIdToken(config: IdTokenConfig) {
  return {
    ...defaultIdTokenConfig,
    ...config,
  } as const;
}
