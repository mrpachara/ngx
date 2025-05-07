/**
 * Generate a random string.
 *
 * @param length The required length
 * @returns The random sting
 */
export function randomString(length: number): string {
  const alloc = new Uint32Array(length / 2);
  crypto.getRandomValues(alloc);
  return Array.from(alloc, (value) =>
    // NOTE: when use radix 36, the group of starting number digits,
    //       e.g. 0, 1, 2, ... , 9, a, b ..., may be appear too often
    //       than the group of last number digits,
    //       because radix-2 based is not divisible by it.
    ('0' + value.toString(36)).slice(-2),
  ).join('');
}

/**
 * Hash the given `plain` by using `SHA-256`.
 *
 * @param plain The plain data
 * @returns The `Promise` of hased data
 */
export async function sha256(plain: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', data));

  // NOTE: String.fromCharCode(...bytes) has a limit number of characters.
  //       So we use reduce() instead.
  return bytes.reduce((carry, byte) => carry + String.fromCharCode(byte), '');
}

/**
 * Encode the given `plain` to Base64 URL-safe.
 *
 * @param plain The plain data
 * @returns The encoded data
 */
export function base64UrlEncode(plain: string): string {
  return btoa(plain).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Decode the given `base64` from Base64 URL-safe.
 *
 * @param base64 The Base64 URL-safe encoded
 * @returns The decoded data
 */
export function base64UrlDecode(base64: string): string {
  return atob(base64.replace(/_/g, '/').replace(/-/g, '+'));
}
