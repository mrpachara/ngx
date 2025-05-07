import { JwkBase } from './jwk.base';

/** Asymmetric Key */
export interface JwkAsymmetricKeyBase extends JwkBase {
  /**
   * Asymatic JWK for _public key_ presentation should **not** present the
   * _private key_ parts. If it does, the encrypted content is considered to be
   * **untrusted**.
   *
   * The implementation **must** check this value to be `undefined`.
   */
  readonly d: never;
}
