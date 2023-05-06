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

// export function sha256(plain: string): Observable<string> {
//   const encoder = new TextEncoder();
//   const data = encoder.encode(plain);
//   return from(crypto.subtle.digest('SHA-256', data)).pipe(
//     map((hashed) => {
//       let str = '';
//       const bytes = new Uint8Array(hashed);
//       const len = bytes.byteLength;
//       for (let i = 0; i < len; i++) {
//         str += String.fromCharCode(bytes[i]);
//       }

//       return str;
//     }),
//   );
// }

export async function sha256(plain: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', data));

  // NOTE: String.fromCharCode(...bytes) has a limit number of characters.
  //       So we use reduce() instead.
  return bytes.reduce((carry, byte) => carry + String.fromCharCode(byte), '');
}

export function base64UrlEncode(plain: string): string {
  return btoa(plain).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
