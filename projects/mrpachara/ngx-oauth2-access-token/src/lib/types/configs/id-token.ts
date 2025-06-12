/** ID token configuration */
export interface IdTokenConfig {
  /**
   * By default, the ID token will be extracted from `id_token` claim. If this
   * property is `true`, the ID token will be extracted from `access_token`
   * claim. The default value is `false`.
   */
  readonly providedInAccessToken?: boolean;
}
