import { SignedJsonWebInfo } from '../jwt';
import { JwkBase } from '../standard';

/** Signed JSON Web verifier */
export type SignedJsonWebVerifier = (
  signedJsonWebInfo: SignedJsonWebInfo,
  jwks: JwkBase[],
) => Promise<boolean | undefined>;
