export function convertToB64String(v: string | Uint8Array): string {
  if (typeof v === 'string') {
    return btoa(v);
  }
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return btoa(String.fromCharCode.apply(null, v));
}

export function createMetadata(cacheName: string): {cache: string} {
  return {cache: cacheName};
}
