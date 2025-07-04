/**
 * `sign` compute digital signature or MAC
 *
 * `verify` verify digital signature or MAC
 *
 * `encrypt` encrypt content
 *
 * `decrypt` decrypt content and validate decryption, if applicable
 *
 * `wrapKey` encrypt key
 *
 * `unwrapKey` decrypt key and validate decryption, if applicable
 *
 * `deriveKey` derive key
 *
 * `deriveBits` derive bits not to be used as a key
 */
export type KeyOpsType =
  | 'sign'
  | 'verify'
  | 'encrypt'
  | 'decrypt'
  | 'wrapKey'
  | 'unwrapKey'
  | 'deriveKey'
  | 'deriveBits';
