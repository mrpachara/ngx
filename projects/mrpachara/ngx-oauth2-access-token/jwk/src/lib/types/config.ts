/** JWK configuration */
export interface JwkConfig {
  /** The issuer value that matchs `iss` claim in JWT, it is REQUIRED. */
  readonly issuer: string;

  /** The URL of JWK Set, it is REQUIRED. */
  readonly jwkSetUrl: string;
}

/** Map between `issuer` and remain JWK configuration */
export type JwkConfigs = Readonly<
  Record<JwkConfig['issuer'], Omit<JwkConfig, 'issuer'>>
>;
