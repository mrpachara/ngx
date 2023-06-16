import { Provided } from './utils.type';
import { JwtInfo } from './oauth2-services.types';
import { JwkBase } from './standard.types';

export interface JwtVerifier {
  verify(
    jwtInfo: Provided<JwtInfo, 'signature'>,
    jwks: JwkBase[],
  ): Promise<boolean | undefined>;
}
