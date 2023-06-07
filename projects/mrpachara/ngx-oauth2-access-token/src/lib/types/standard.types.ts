export type JwtTokenType = `${string}.${string}`;

export type JwtHeader = {
  typ?: 'JWT';
  cty?: 'JWT';
  iss?: string; // issuer
  sub?: string; // subject
  aud?: string; // audience
  alg?: string; // signing algorithm
  enc?: string; // encrypting method
  kid?: string; // kid for JWKS
};

export type JwtClaims = {
  iss?: string; // issuer
  sub?: string; // subject
  aud?: string; // audience
  exp?: number; // expiration time
  nbf?: number; // not before
  iat?: number; // issued at
  jti?: string; // JWT ID
};

/**
 * A JSON Web Key (JWK) is a JavaScript Object Notation (JSON) [RFC7159] data
 * structure that represents a cryptographic key.
 *
 * The X.509 parts are **not** included in this type.
 */
export type JwkBase = {
  /** Key type represents the format of JWK */
  kty: string;

  /** Key ID */
  kid?: string;

  /** Algorithm */
  alg?: string;

  /** Used of key */
  use?: 'sig' | 'enc';
};

/** Symmetric Key */
export type JwkSymmetricKeyBase = JwkBase & {
  kty: 'oct';
  k: string;
};

/** Hash-based Algorithm */
export type JwkHashBase = JwkSymmetricKeyBase & {
  alg?: `H${string}`;
};

/** HMAC - Hash-based Message Authentication Codes Algorithm */
export type JwkHmac<SHA extends '256' | '384' | '512' = '256' | '384' | '512'> =
  JwkHashBase & {
    alg?: `HS${SHA}`;
  };

/** Asymmetric Key */
export type JwkAsymmetricKeyBase = JwkBase & {
  /**
   * Asymatic JWK for _public key_ presentation should **not** present the
   * _private key_ parts. If it does, the encrypted content is considered to be
   * **untrusted**.
   *
   * The implementation **must** check this value to be `undefined`.
   */
  d: never;
};

/** RSA Key */
export type JwkRsaBase = JwkAsymmetricKeyBase & {
  kty: 'RSA';
  n: string;
  e: string;
};

/** RSASSA - RSASSA-PKCS1-v1_5 Algorithm */
export type JwkRsassa<
  SHA extends '256' | '384' | '512' = '256' | '384' | '512',
> = JwkRsaBase & {
  alg?: `RS${SHA}`;
};

/** EC - Elliptic Curve Key */
export type JwkEcBase = JwkAsymmetricKeyBase & {
  kty: 'EC';
  crv: string;
  x: string;
};

/** ECDSA - Elliptic Curve Digital Signature Algorithm */
export type JwkEcdsa<P extends '256' | '384' | '512' = '256' | '384' | '512'> =
  JwkEcBase & {
    alg?: `ES${P}`;
    crv: `P-${P}`;
    y: string;
  };

/** JWK Set */
export type JwkSet = {
  keys: JwkBase[];
};

export type AccessTokenRequest = {
  grant_type: string;
  client_id?: string;
  client_secret?: string;
  state?: string;
};

export type PasswordGrantAccessTokenRequest = AccessTokenRequest & {
  grant_type: 'password';
  username: string;
  password: string;
  scope: string;
};

export type ClientGrantAccessTokenRequest = AccessTokenRequest & {
  grant_type: 'client_credentials';
  scope: string;
};

export type AuthorizationCodeGrantAccessTokenRequest = AccessTokenRequest & {
  grant_type: 'authorization_code';
  code: string;
  code_verifier?: string;
  redirect_uri: string;
  scope?: never;
};

export type RefreshTokenGrantAccessTokenRequest = AccessTokenRequest & {
  grant_type: 'refresh_token';
  refresh_token: string;
  scope?: string;
};

export type CustomGrantAccessTokenRequest = AccessTokenRequest & {
  grant_type: `urn:${string}`;
};

export type StandardGrantsAccesTokenRequest =
  | PasswordGrantAccessTokenRequest
  | ClientGrantAccessTokenRequest
  | AuthorizationCodeGrantAccessTokenRequest
  | RefreshTokenGrantAccessTokenRequest
  | CustomGrantAccessTokenRequest;

export type CodeChallengeMethod = 'S256' | 'plain';

export type AuthorizationCodeRequest = {
  response_type: 'code';
  client_id: string;
  client_secret?: never;
  scope: string;
  code_challenge?: string;
  code_challenge_method?: CodeChallengeMethod;
  redirect_uri: string;
  state: string;
};

export type AccessTokenResponse = {
  token_type: string;
  access_token: string;
  expires_in?: number;
  refresh_token?: string;
};

export type StandardGrantType = StandardGrantsAccesTokenRequest['grant_type'];

export type UserInfoClaims = Partial<{
  /** Subject - Identifier for the End-User at the Issuer. */
  sub: string;

  /**
   * End-User's full name in displayable form including all name parts, possibly
   * including titles and suffixes, ordered according to the End-User's locale
   * and preferences.
   */
  name: string;

  /**
   * Given name(s) or first name(s) of the End-User. Note that in some cultures,
   * people can have multiple given names; all can be present, with the names
   * being separated by space characters.
   */
  given_name: string;

  /**
   * Surname(s) or last name(s) of the End-User. Note that in some cultures,
   * people can have multiple family names or no family name; all can be
   * present, with the names being separated by space characters.
   */
  family_name: string;

  /**
   * Middle name(s) of the End-User. Note that in some cultures, people can have
   * multiple middle names; all can be present, with the names being separated
   * by space characters. Also note that in some cultures, middle names are not
   * used.
   */
  middle_name: string;

  /**
   * Casual name of the End-User that may or may not be the same as the
   * given_name. For instance, a nickname value of Mike might be returned
   * alongside a given_name value of Michael.
   */
  nickname: string;

  /**
   * Shorthand name by which the End-User wishes to be referred to at the RP,
   * such as janedoe or j.doe. This value MAY be any valid JSON string including
   * special characters such as @, /, or whitespace. The RP MUST NOT rely upon
   * this value being unique, as discussed in Section 5.7.
   */
  preferred_username: string;

  /**
   * URL of the End-User's profile page. The contents of this Web page SHOULD be
   * about the End-User.
   */
  profile: string;

  /**
   * URL of the End-User's profile picture. This URL MUST refer to an image file
   * (for example, a PNG, JPEG, or GIF image file), rather than to a Web page
   * containing an image. Note that this URL SHOULD specifically reference a
   * profile photo of the End-User suitable for displaying when describing the
   * End-User, rather than an arbitrary photo taken by the End-User.
   */
  picture: string;

  /**
   * URL of the End-User's Web page or blog. This Web page SHOULD contain
   * information published by the End-User or an organization that the End-User
   * is affiliated with.
   */
  website: string;

  /**
   * End-User's preferred e-mail address. Its value MUST conform to the RFC 5322
   * [RFC5322] addr-spec syntax. The RP MUST NOT rely upon this value being
   * unique, as discussed in Section 5.7.
   */
  email: string;

  /**
   * True if the End-User's e-mail address has been verified; otherwise false.
   * When this Claim Value is true, this means that the OP took affirmative
   * steps to ensure that this e-mail address was controlled by the End-User at
   * the time the verification was performed. The means by which an e-mail
   * address is verified is context-specific, and dependent upon the trust
   * framework or contractual agreements within which the parties are
   * operating.
   */
  email_verified: boolean;

  /**
   * End-User's gender. Values defined by this specification are female and
   * male. Other values MAY be used when neither of the defined values are
   * applicable.
   */
  gender: string;

  /**
   * End-User's birthday, represented as an ISO 8601:2004 [ISO8601‑2004]
   * YYYY-MM-DD format. The year MAY be 0000, indicating that it is omitted. To
   * represent only the year, YYYY format is allowed. Note that depending on the
   * underlying platform's date related function, providing just year can result
   * in varying month and day, so the implementers need to take this factor into
   * account to correctly process the dates.
   */
  birthdate: string;

  /**
   * String from zoneinfo [zoneinfo] time zone database representing the
   * End-User's time zone. For example, Europe/Paris or America/Los_Angeles.
   */
  zoneinfo: string;

  /**
   * End-User's locale, represented as a BCP47 [RFC5646] language tag. This is
   * typically an ISO 639-1 Alpha-2 [ISO639‑1] language code in lowercase and an
   * ISO 3166-1 Alpha-2 [ISO3166‑1] country code in uppercase, separated by a
   * dash. For example, en-US or fr-CA. As a compatibility note, some
   * implementations have used an underscore as the separator rather than a
   * dash, for example, en_US; Relying Parties MAY choose to accept this locale
   * syntax as well.
   */
  locale: string;

  /**
   * End-User's preferred telephone number. E.164 [E.164] is RECOMMENDED as the
   * format of this Claim, for example, +1 (425) 555-1212 or +56 (2) 687 2400.
   * If the phone number contains an extension, it is RECOMMENDED that the
   * extension be represented using the RFC 3966 [RFC3966] extension syntax, for
   * example, +1 (604) 555-1234;ext=5678.
   */
  phone_number: string;

  /**
   * True if the End-User's phone number has been verified; otherwise false.
   * When this Claim Value is true, this means that the OP took affirmative
   * steps to ensure that this phone number was controlled by the End-User at
   * the time the verification was performed. The means by which a phone number
   * is verified is context-specific, and dependent upon the trust framework or
   * contractual agreements within which the parties are operating. When true,
   * the phone_number Claim MUST be in E.164 format and any extensions MUST be
   * represented in RFC 3966 format.
   */
  phone_number_verified: boolean;

  /**
   * End-User's preferred postal address. The value of the address member is a
   * JSON [RFC4627] structure containing some or all of the members defined in
   * Section 5.1.1.
   */
  address: Partial<{
    /**
     * Full mailing address, formatted for display or use on a mailing label.
     * This field MAY contain multiple lines, separated by newlines. Newlines
     * can be represented either as a carriage return/line feed pair ("\r\n") or
     * as a single line feed character ("\n").
     */
    formatted: string;

    /**
     * Full street address component, which MAY include house number, street
     * name, Post Office Box, and multi-line extended street address
     * information. This field MAY contain multiple lines, separated by
     * newlines. Newlines can be represented either as a carriage return/line
     * feed pair ("\r\n") or as a single line feed character ("\n").
     */
    street_address: string;

    /** City or locality component. */
    locality: string;

    /** State, province, prefecture, or region component. */
    region: string;

    /** Zip code or postal code component. */
    postal_code: string;

    /** Country name component. */
    country: string;
  }>;

  /**
   * Time the End-User's information was last updated. Its value is a JSON
   * number representing the number of seconds from 1970-01-01T0:0:0Z as
   * measured in UTC until the date/time.
   */
  updated_at: number;
}>;

export type IdTokenClaims = JwtClaims & {
  /**
   * REQUIRED. Issuer Identifier for the Issuer of the response. The iss value
   * is a case sensitive URL using the https scheme that contains scheme, host,
   * and optionally, port number and path components and no query or fragment
   * components.
   */
  iss: string;

  /**
   * REQUIRED. Subject Identifier. A locally unique and never reassigned
   * identifier within the Issuer for the End-User, which is intended to be
   * consumed by the Client, e.g., 24400320 or
   * AItOawmwtWwcT0k51BayewNvutrJUqsvl6qs7A4. It MUST NOT exceed 255 ASCII
   * characters in length. The sub value is a case sensitive string.
   */
  sub: string;

  /**
   * REQUIRED. Audience(s) that this ID Token is intended for. It MUST contain
   * the OAuth 2.0 client_id of the Relying Party as an audience value. It MAY
   * also contain identifiers for other audiences. In the general case, the aud
   * value is an array of case sensitive strings. In the common special case
   * when there is one audience, the aud value MAY be a single case sensitive
   * string.
   */
  aud: string;

  /**
   * REQUIRED. Expiration time on or after which the ID Token MUST NOT be
   * accepted for processing. The processing of this parameter requires that the
   * current date/time MUST be before the expiration date/time listed in the
   * value. Implementers MAY provide for some small leeway, usually no more than
   * a few minutes, to account for clock skew. Its value is a JSON number
   * representing the number of seconds from 1970-01-01T0:0:0Z as measured in
   * UTC until the date/time. See RFC 3339 [RFC3339] for details regarding
   * date/times in general and UTC in particular.
   */
  exp: number;

  /**
   * REQUIRED. Time at which the JWT was issued. Its value is a JSON number
   * representing the number of seconds from 1970-01-01T0:0:0Z as measured in
   * UTC until the date/time.
   */
  iat: number;

  /**
   * Time when the End-User authentication occurred. Its value is a JSON number
   * representing the number of seconds from 1970-01-01T0:0:0Z as measured in
   * UTC until the date/time. When a max_age request is made or when auth_time
   * is requested as an Essential Claim, then this Claim is REQUIRED; otherwise,
   * its inclusion is OPTIONAL. (The auth_time Claim semantically corresponds to
   * the OpenID 2.0 PAPE [OpenID.PAPE] auth_time response parameter.)
   */
  auth_time: number;

  /**
   * String value used to associate a Client session with an ID Token, and to
   * mitigate replay attacks. The value is passed through unmodified from the
   * Authentication Request to the ID Token. If present in the ID Token, Clients
   * MUST verify that the nonce Claim Value is equal to the value of the nonce
   * parameter sent in the Authentication Request. If present in the
   * Authentication Request, Authorization Servers MUST include a nonce Claim in
   * the ID Token with the Claim Value being the nonce value sent in the
   * Authentication Request. Authorization Servers SHOULD perform no other
   * processing on nonce values used. The nonce value is a case sensitive
   * string.
   */
  nonce?: string;

  /**
   * OPTIONAL. Authentication Context Class Reference. String specifying an
   * Authentication Context Class Reference value that identifies the
   * Authentication Context Class that the authentication performed satisfied.
   * The value "0" indicates the End-User authentication did not meet the
   * requirements of ISO/IEC 29115 [ISO29115] level 1. Authentication using a
   * long-lived browser cookie, for instance, is one example where the use of
   * "level 0" is appropriate. Authentications with level 0 SHOULD NOT be used
   * to authorize access to any resource of any monetary value. (This
   * corresponds to the OpenID 2.0 PAPE [OpenID.PAPE] nist_auth_level 0.) An
   * absolute URI or an RFC 6711 [RFC6711] registered name SHOULD be used as the
   * acr value; registered names MUST NOT be used with a different meaning than
   * that which is registered. Parties using this claim will need to agree upon
   * the meanings of the values used, which may be context-specific. The acr
   * value is a case sensitive string.
   */
  acr?: string;

  /**
   * OPTIONAL. Authentication Methods References. JSON array of strings that are
   * identifiers for authentication methods used in the authentication. For
   * instance, values might indicate that both password and OTP authentication
   * methods were used. The definition of particular values to be used in the
   * amr Claim is beyond the scope of this specification. Parties using this
   * claim will need to agree upon the meanings of the values used, which may be
   * context-specific. The amr value is an array of case sensitive strings.
   */
  amr?: string[];

  /**
   * OPTIONAL. Authorized party - the party to which the ID Token was issued. If
   * present, it MUST contain the OAuth 2.0 Client ID of this party. This Claim
   * is only needed when the ID Token has a single audience value and that
   * audience is different than the authorized party. It MAY be included even
   * when the authorized party is the same as the sole audience. The azp value
   * is a case sensitive string containing a StringOrURI value.
   */
  azp?: string;
} & UserInfoClaims;

export type Oauth2ErrorResponse = {
  error: string;
  error_description: string;
};
