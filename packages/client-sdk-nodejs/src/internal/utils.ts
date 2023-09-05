export function convert(v: string | Uint8Array): Uint8Array {
  if (typeof v === 'string') {
    return new TextEncoder().encode(v);
  }
  return v;
}
