export interface UserInfoClaims {
  /** Subject - Identifier for the End-User at the Issuer. */
  readonly sub?: string;

  /**
   * _End-User_'s full name in displayable form including all name parts,
   * possibly including titles and suffixes, ordered according to the End-User's
   * locale and preferences.
   */
  readonly name?: string;

  /**
   * Given name(s) or first name(s) of the _End-User_. Note that in some
   * cultures, people can have multiple given names; all can be present, with
   * the names being separated by space characters.
   */
  readonly given_name?: string;

  /**
   * Surname(s) or last name(s) of the _End-User_. Note that in some cultures,
   * people can have multiple family names or no family name; all can be
   * present, with the names being separated by space characters.
   */
  readonly family_name?: string;

  /**
   * Middle name(s) of the End-User. Note that in some cultures, people can have
   * multiple middle names; all can be present, with the names being separated
   * by space characters. Also note that in some cultures, middle names are not
   * used.
   */
  readonly middle_name?: string;

  /**
   * Casual name of the _End-User_ that may or may not be the same as the
   * `"given_name"`. For instance, a `"nickname"` value of _Mike_ might be
   * returned alongside a `given_name` value of _Michael_.
   */
  readonly nickname?: string;

  /**
   * Shorthand name by which the _End-User_ wishes to be referred to at the
   * _RP_, such as _janedoe_ or _j.doe_. This value **MAY** be any valid JSON
   * string including special characters such as `@`, `/`, or whitespace. The
   * _RP_ **MUST NOT** rely upon this value being unique, as discussed in
   * [Section
   * 5.7](https://openid.net/specs/openid-connect-core-1_0.html#ClaimStability).
   */
  readonly preferred_username?: string;

  /**
   * `URL` of the _End-User_'s profile page. The contents of this Web page
   * **SHOULD** be about the _End-User_.
   */
  readonly profile?: string;

  /**
   * `URL` of the _End-User_'s profile picture. This `URL` **MUST** refer to an
   * image file (for example, a PNG, JPEG, or GIF image file), rather than to a
   * Web page containing an image. Note that this `URL` **SHOULD** specifically
   * reference a profile photo of the _End-User_ suitable for displaying when
   * describing the _End-User_, rather than an arbitrary photo taken by the
   * _End-User_.
   */
  readonly picture?: string;

  /**
   * `URL` of the _End-User_'s Web page or blog. This Web page **SHOULD**
   * contain information published by the _End-User_ or an organization that the
   * _End-User_ is affiliated with.
   */
  readonly website?: string;

  /**
   * _End-User_'s preferred e-mail address. Its value **MUST** conform to the
   * [RFC 5322](https://www.rfc-editor.org/rfc/rfc5322.html) addr-spec syntax.
   * The _RP_ **MUST NOT** rely upon this value being unique, as discussed in
   * [Section
   * 5.7](https://openid.net/specs/openid-connect-core-1_0.html#ClaimStability).
   */
  readonly email?: string;

  /**
   * `true` if the _End-User_'s e-mail address has been **verified**; otherwise
   * `false`. When this Claim Value is `true`, this means that the _OP_ took
   * affirmative steps to ensure that this e-mail address was controlled by the
   * _End-User_ at the time the verification was performed. The means by which
   * an e-mail address is verified is context-specific, and dependent upon the
   * trust framework or contractual agreements within which the parties are
   * operating.
   */
  readonly email_verified?: boolean;

  /**
   * _End-User_'s gender. Values defined by this specification are `female` and
   * `male`. Other values **MAY** be used when neither of the defined values are
   * applicable.
   */
  readonly gender?: string;

  /**
   * _End-User_'s birthday, represented as an [ISO
   * 8601:2004](https://www.iso.org/standard/40874.html) `YYYY-MM-DD` format.
   * The year **MAY** be `0000`, indicating that it is omitted. To represent
   * only the year, `YYYY` format is allowed. Note that depending on the
   * underlying platform's date related function, providing just year can result
   * in varying month and day, so the implementers need to take this factor into
   * account to correctly process the dates.
   */
  readonly birthdate?: string;

  /**
   * String from [zoneinfo](https://www.iana.org/time-zones) time zone database
   * representing the _End-User_'s time zone. For example, `Europe/Paris` or
   * `America/Los_Angeles`.
   */
  readonly zoneinfo?: string;

  /**
   * _End-User_'s locale, represented as a BCP47 [RFC
   * 5646](https://www.rfc-editor.org/rfc/rfc5646.html) language tag. This is
   * typically an [ISO 639-1 Alpha-2](https://www.iso.org/standard/22109.html)
   * language code in lowercase and an [ISO 3166-1
   * Alpha-2](https://www.iso.org/iso-3166-country-codes.html) country code in
   * uppercase, separated by a dash. For example, `en-US` or `fr-CA`. As a
   * compatibility note, some implementations have used an underscore as the
   * separator rather than a dash, for example, `en_US`; Relying Parties **MAY**
   * choose to accept this locale syntax as well.
   */
  readonly locale?: string;

  /**
   * _End-User_'s preferred telephone number.
   * [E.164](https://www.itu.int/rec/T-REC-E.164-201011-I/en) is **RECOMMENDED**
   * as the format of this Claim, for example, `+1 (425) 555-1212` or `+56 (2)
   * 687 2400`. If the phone number contains an extension, it is **RECOMMENDED**
   * that the extension be represented using the [RFC
   * 3966](https://www.rfc-editor.org/rfc/rfc3966.html) extension syntax, for
   * example, `+1 (604) 555-1234;ext=5678`.
   */
  readonly phone_number?: string;

  /**
   * `true` if the _End-User_'s phone number has been verified; otherwise
   * `false`. When this Claim Value is `true`, this means that the OP took
   * affirmative steps to ensure that this phone number was controlled by the
   * End-User at the time the verification was performed. The means by which a
   * phone number is verified is context-specific, and dependent upon the trust
   * framework or contractual agreements within which the parties are operating.
   * When `true`, the `phone_number` Claim **MUST** be in
   * [E.164](https://www.itu.int/rec/T-REC-E.164-201011-I/en) format and any
   * extensions **MUST** be represented in [RFC
   * 3966](https://www.rfc-editor.org/rfc/rfc3966.html) format.
   */
  readonly phone_number_verified?: boolean;

  /**
   * _End-User_'s preferred postal address. The value of the address member is a
   * JSON [RFC 4627](https://www.rfc-editor.org/rfc/rfc4627.html) structure
   * containing some or all of the members defined in [Section
   * 5.1.1](https://openid.net/specs/openid-connect-core-1_0.html#AddressClaim).
   */
  readonly address?: {
    /**
     * Full mailing address, formatted for display or use on a mailing label.
     * This field **MAY** contain multiple lines, separated by newlines.
     * Newlines can be represented either as a carriage return/line feed pair
     * (`"\r\n"`) or as a single line feed character (`"\n"`).
     */
    readonly formatted?: string;

    /**
     * Full street address component, which **MAY** include house number, street
     * name, Post Office Box, and multi-line extended street address
     * information. This field **MAY** contain multiple lines, separated by
     * newlines. Newlines can be represented either as a carriage return/line
     * feed pair (`"\r\n"`) or as a single line feed character (`"\n"`).
     */
    readonly street_address?: string;

    /** City or locality component. */
    readonly locality?: string;

    /** State, province, prefecture, or region component. */
    readonly region?: string;

    /** Zip code or postal code component. */
    readonly postal_code?: string;

    /** Country name component. */
    readonly country?: string;
  };

  /**
   * Time the _End-User_'s information was last updated. Its value is a JSON
   * number representing the number of seconds from `1970-01-01T0:0:0Z` as
   * measured in UTC until the date/time.
   */
  readonly updated_at?: number;
}
