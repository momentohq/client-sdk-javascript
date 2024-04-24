export type SetBatchItem = {
  key: string | Uint8Array;
  value: string | Uint8Array;
  ttl: number;
};
