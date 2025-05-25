import { JoseHeader } from '../jose';

export interface JweHeader extends JoseHeader {
  /**
   * This parameter has the same meaning, syntax, and processing rules as the
   * `"alg"` Header Parameter defined in Section 4.1.1 of
   * [[JWS](https://datatracker.ietf.org/doc/html/rfc7515)], except that the
   * Header Parameter identifies the cryptographic algorithm used to encrypt or
   * determine the value of the CEK. The encrypted content is not usable if the
   * `"alg"` value does not represent a supported algorithm, or if the recipient
   * does not have a key that can be used with that algorithm.
   *
   * A list of defined `"alg"` values for this use can be found in the IANA
   * "JSON Web Signature and Encryption Algorithms" registry established by
   * [[JWA](https://datatracker.ietf.org/doc/html/rfc7518)]; the initial
   * contents of this registry are the values defined in Section 4.1 of
   * [[JWA](https://datatracker.ietf.org/doc/html/rfc7518)].
   */
  readonly alg: NonNullable<JoseHeader['alg']>;

  /**
   * The `"enc"` (encryption algorithm) Header Parameter identifies the content
   * encryption algorithm used to perform authenticated encryption on the
   * plaintext to produce the ciphertext and the Authentication Tag. This
   * algorithm MUST be an AEAD algorithm with a specified key length. The
   * encrypted content is not usable if the `"enc"` value does not represent a
   * supported algorithm. `"enc"` values should either be registered in the IANA
   * "JSON Web Signature and Encryption Algorithms" registry established by
   * [[JWA](https://datatracker.ietf.org/doc/html/rfc7518)] or be a value that
   * contains a Collision-Resistant Name. The `"enc"` value is a case-sensitive
   * ASCII string containing a StringOrURI value. This Header Parameter MUST be
   * present and MUST be understood and processed by implementations.
   *
   * A list of defined `"enc"` values for this use can be found in the IANA
   * "JSON Web Signature and Encryption Algorithms" registry established by
   * [[JWA](https://datatracker.ietf.org/doc/html/rfc7518)]; the initial
   * contents of this registry are the values defined in Section 5.1 of
   * [[JWA](https://datatracker.ietf.org/doc/html/rfc7518)].
   */
  readonly enc: string;
}
