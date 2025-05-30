import { JwkRsa } from './bases';

/** RSASSA - RSASSA-PKCS1-v1_5 Algorithm */
export interface JwkRsassa<
  SHA extends '256' | '384' | '512' = '256' | '384' | '512',
> extends JwkRsa {
  readonly alg: `RS${SHA}`;
}
