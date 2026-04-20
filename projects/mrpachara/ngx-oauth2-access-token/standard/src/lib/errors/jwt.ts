import { JwsInfo, JwtInfo } from '../types';

type JwtOverJwsInfo = Extract<JwtInfo, JwsInfo>;
type WithProvidedJwtCliams<K extends keyof JwtOverJwsInfo['payload']> =
  JwtOverJwsInfo & {
    readonly payload: Required<Pick<JwtOverJwsInfo['payload'], K>>;
  };

export class JwtCannotBeUsedBeforeError extends Error {
  override readonly cause!: WithProvidedJwtCliams<'nbf'>;

  constructor(jwtOverJwsInfo: WithProvidedJwtCliams<'nbf'>) {
    super(`JWT cannot be used before ${jwtOverJwsInfo.payload.nbf}`, {
      cause: jwtOverJwsInfo,
    });
    this.name = this.constructor.name;
  }
}

export class JwtExpiredError extends Error {
  override readonly cause!: WithProvidedJwtCliams<'exp'>;

  constructor(jwtOverJwsInfo: WithProvidedJwtCliams<'exp'>) {
    super(`JWT was expired at ${jwtOverJwsInfo.payload.exp}`, {
      cause: jwtOverJwsInfo,
    });
    this.name = this.constructor.name;
  }
}
