import { JwkOkp } from './bases';

/** EdDSA - Edwards-Curve Digital Signature Algorithm */
export interface JwkEddsa<ED extends '25519' | '448' = '25519' | '448'>
  extends JwkOkp {
  readonly alg?: 'EdDSA';
  readonly crv: `Ed${ED}`;
}
