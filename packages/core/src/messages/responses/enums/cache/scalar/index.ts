export enum CacheGetResponse {
  Hit = 'Hit',
  Miss = 'Miss',
  Error = 'Error',
}

export enum CacheSetResponse {
  Success = 'Success',
  Error = 'Error',
}

export enum CacheDeleteResponse {
  Success = 'Success',
  Error = 'Error',
}

export enum CacheIncrementResponse {
  Success = 'Success',
  Error = 'Error',
}

export enum CacheGetBatchResponse {
  Success = 'Success',
  Error = 'Error',
}

export enum CacheSetBatchResponse {
  Success = 'Success',
  Error = 'Error',
}

export enum CacheSetIfAbsentResponse {
  Stored = 'Stored',
  NotStored = 'NotStored',
  Error = 'Error',
}

export enum CacheSetIfPresentResponse {
  Stored = 'Stored',
  NotStored = 'NotStored',
  Error = 'Error',
}

export enum CacheSetIfEqualResponse {
  Stored = 'Stored',
  NotStored = 'NotStored',
  Error = 'Error',
}

export enum CacheSetIfNotEqualResponse {
  Stored = 'Stored',
  NotStored = 'NotStored',
  Error = 'Error',
}

export enum CacheSetIfAbsentOrEqualResponse {
  Stored = 'Stored',
  NotStored = 'NotStored',
  Error = 'Error',
}

export enum CacheSetIfPresentAndNotEqualResponse {
  Stored = 'Stored',
  NotStored = 'NotStored',
  Error = 'Error',
}
