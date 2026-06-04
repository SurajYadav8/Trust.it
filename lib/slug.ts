const ALPHABET =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

export function generateSlug(length = 14): string {
  if (typeof globalThis.crypto?.getRandomValues === "function") {
    const bytes = new Uint8Array(length);
    globalThis.crypto.getRandomValues(bytes);
    let out = "";
    for (let i = 0; i < length; i++) {
      out += ALPHABET[bytes[i] % ALPHABET.length];
    }
    return out;
  }
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return out;
}
