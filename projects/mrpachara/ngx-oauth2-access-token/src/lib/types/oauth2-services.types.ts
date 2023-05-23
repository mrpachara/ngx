declare module './storages.types' {
  interface StateData {
    codeVerifier?: string;
  }
}

export type Scopes = [string, ...string[]];

export type AccessTokenWithType = {
  type: string;
  token: string;
};
