export interface JwtHeader {
  /**
   * The "typ" (type) Header Parameter defined by
   * [[JWS](https://www.rfc-editor.org/rfc/rfc7519#ref-JWS)] and
   * [[JWE](https://www.rfc-editor.org/rfc/rfc7519#ref-JWE)] is used by JWT
   * applications to declare the media type
   * [[IANA.MediaTypes](https://www.rfc-editor.org/rfc/rfc7519#ref-IANA.MediaTypes)]
   * of this complete JWT. This is intended for use by the JWT application when
   * values that are not JWTs could also be present in an application data
   * structure that can contain a JWT object; the application can use this value
   * to disambiguate among the different kinds of objects that might be present.
   * It will typically not be used by applications when it is already known that
   * the object is a JWT. This parameter is ignored by JWT implementations; any
   * processing of this parameter is performed by the JWT application. If
   * present, it is RECOMMENDED that its value be "JWT" to indicate that this
   * object is a JWT. While media type names are not case sensitive, it is
   * RECOMMENDED that "JWT" always be spelled using uppercase characters for
   * compatibility with legacy implementations. Use of this Header Parameter is
   * OPTIONAL.
   */
  typ?: 'JWT';

  /**
   * The "cty" (content type) Header Parameter defined by
   * [[JWS](https://www.rfc-editor.org/rfc/rfc7519#ref-JWS)] and
   * [[JWE](https://www.rfc-editor.org/rfc/rfc7519#ref-JWE)] is used by this
   * specification to convey structural information about the JWT.
   */
  cty?: 'JWT';

  /**
   * The "iss" (issuer) claim identifies the principal that issued the JWT. The
   * processing of this claim is generally application specific. The "iss" value
   * is a case-sensitive string containing a StringOrURI value. Use of this
   * claim is OPTIONAL.
   */
  iss?: string;

  /**
   * The "sub" (subject) claim identifies the principal that is the subject of
   * the JWT. The claims in a JWT are normally statements about the subject. The
   * subject value MUST either be scoped to be locally unique in the context of
   * the issuer or be globally unique. The processing of this claim is generally
   * application specific. The "sub" value is a case-sensitive string containing
   * a StringOrURI value. Use of this claim is OPTIONAL.
   */
  sub?: string;

  /**
   * The "aud" (audience) claim identifies the recipients that the JWT is
   * intended for. Each principal intended to process the JWT MUST identify
   * itself with a value in the audience claim. If the principal processing the
   * claim does not identify itself with a value in the "aud" claim when this
   * claim is present, then the JWT MUST be rejected. In the general case, the
   * "aud" value is an array of case- sensitive strings, each containing a
   * StringOrURI value. In the special case when the JWT has one audience, the
   * "aud" value MAY be a single case-sensitive string containing a StringOrURI
   * value. The interpretation of audience values is generally application
   * specific. Use of this claim is OPTIONAL.
   */
  aud?: string;

  /**
   * The "alg" (algorithm) Header Parameter identifies the cryptographic
   * algorithm used to secure the JWS. The JWS Signature value is not valid if
   * the "alg" value does not represent a supported algorithm or if there is not
   * a key for use with that algorithm associated with the party that digitally
   * signed or MACed the content. "alg" values should either be registered in
   * the IANA "JSON Web Signature and Encryption Algorithms" registry
   * established by [[JWA](https://www.rfc-editor.org/rfc/rfc7518)] or be a
   * value that contains a Collision-Resistant Name. The "alg" value is a case-
   * sensitive ASCII string containing a StringOrURI value. This Header
   * Parameter MUST be present and MUST be understood and processed by
   * implementations.
   */
  alg?: string;

  /**
   * We just use this parameter for checking the type of token. This parameter
   * is required for JWE.
   */
  enc?: string; // encrypting method

  /**
   * The "kid" (key ID) Header Parameter is a hint indicating which key was used
   * to secure the JWS. This parameter allows originators to explicitly signal a
   * change of key to recipients. The structure of the "kid" value is
   * unspecified. Its value MUST be a case-sensitive string. Use of this Header
   * Parameter is OPTIONAL.
   */
  kid?: string;
}
