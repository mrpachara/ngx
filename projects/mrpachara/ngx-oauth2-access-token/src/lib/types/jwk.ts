import { JwtInfo } from './oauth2-services.types';
import { JwkBase } from './standard';
import { Provided } from './utils';

export type JwtVerifier = (
  jwtInfo: Provided<JwtInfo, 'signature'>,
  jwks: JwkBase[],
) => Promise<boolean | undefined>;
