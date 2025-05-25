import { JoseHeader } from '../jose';
import { JwtClaims } from './claims';

export interface JwtHeader extends JoseHeader {
  /**
   * The `"typ"` (type) Header Parameter defined by
   * [[JWS](https://www.rfc-editor.org/rfc/rfc7515.html)] and
   * [[JWE](https://www.rfc-editor.org/rfc/rfc7516.html)] is used by JWT
   * applications to declare the media type
   * [[IANA.MediaTypes](https://www.iana.org/assignments/media-types/media-types.xhtml)]
   * of this complete JWT. This is intended for use by the JWT application when
   * values that are not JWTs could also be present in an application data
   * structure that can contain a JWT object; the application can use this value
   * to disambiguate among the different kinds of objects that might be present.
   * It will typically not be used by applications when it is already known that
   * the object is a JWT. This parameter is ignored by JWT implementations; any
   * processing of this parameter is performed by the JWT application. If
   * present, it is **RECOMMENDED** that its value be "JWT" to indicate that
   * this object is a JWT. While media type names are _case-insensitive_, it is
   * **RECOMMENDED** that "JWT" always be spelled using uppercase characters for
   * compatibility with legacy implementations. Use of this Header Parameter is
   * OPTIONAL.
   */
  readonly typ?: 'JWT';

  /**
   * The `"cty"` (content type) Header Parameter defined by
   * [[JWS](https://www.rfc-editor.org/rfc/rfc7515.html)] and
   * [[JWE](https://www.rfc-editor.org/rfc/rfc7516.html)] is used by this
   * specification to convey structural information about the JWT.
   *
   * In the normal case in which nested signing or encryption operations are not
   * employed, the use of this Header Parameter is NOT **RECOMMENDED**. In the
   * case that nested signing or encryption is employed, this Header Parameter
   * **MUST** be present; in this case, the value **MUST** be "JWT", to indicate
   * that a Nested JWT is carried in this JWT. While media type names are not
   * case sensitive, it is **RECOMMENDED** that "JWT" always be spelled using
   * uppercase characters for compatibility with legacy implementations. See
   * [Appendix A.2](https://datatracker.ietf.org/doc/html/rfc7519#appendix-A.2)
   * for an example of a Nested JWT.
   */
  readonly cty?: 'JWT';

  /**
   * The `"iss"` (issuer) claim identifies the principal that issued the JWT.
   * The processing of this claim is generally application specific. The `"iss"`
   * value is a **_case-sensitive_** string containing a StringOrURI value. Use
   * of this claim is OPTIONAL.
   *
   * @see {@link https://datatracker.ietf.org/doc/html/rfc7519#section-5.3|5.3.  Replicating Claims as Header Parameters}
   */
  readonly iss?: JwtClaims['iss'];

  /**
   * The `"sub"` (subject) claim identifies the principal that is the subject of
   * the JWT. The claims in a JWT are normally statements about the subject. The
   * subject value **MUST** either be scoped to be locally unique in the context
   * of the issuer or be globally unique. The processing of this claim is
   * generally application specific. The `"sub"` value is a **_case-sensitive_**
   * string containing a StringOrURI value. Use of this claim is OPTIONAL.
   *
   * @see {@link https://datatracker.ietf.org/doc/html/rfc7519#section-5.3|5.3.  Replicating Claims as Header Parameters}
   */
  readonly sub?: JwtClaims['sub'];

  /**
   * The `"aud"` (audience) claim identifies the recipients that the JWT is
   * intended for. Each principal intended to process the JWT **MUST** identify
   * itself with a value in the audience claim. If the principal processing the
   * claim does not identify itself with a value in the `"aud"` claim when this
   * claim is present, then the JWT **MUST** be rejected. In the general case,
   * the `"aud"` value is an array of **_case-sensitive_** strings, each
   * containing a StringOrURI value. In the special case when the JWT has one
   * audience, the `"aud"` value **MAY** be a single **_case-sensitive_** string
   * containing a StringOrURI value. The interpretation of audience values is
   * generally application specific. Use of this claim is OPTIONAL.
   *
   * @see {@link https://datatracker.ietf.org/doc/html/rfc7519#section-5.3|5.3.  Replicating Claims as Header Parameters}
   */
  readonly aud?: JwtClaims['aud'];
}
