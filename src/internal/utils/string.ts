export const decodeFromBase64 = (base64: string) =>
  Buffer.from(base64, 'base64').toString();

export const encodeToBase64 = (str: string) =>
  Buffer.from(str).toString('base64');
