import { JwkHash } from './bases';

/** HMAC - Hash-based Message Authentication Codes Algorithm */
export interface JwkHmac<
  SHA extends '256' | '384' | '512' = '256' | '384' | '512',
> extends JwkHash {
  readonly alg: `HS${SHA}`;
}
