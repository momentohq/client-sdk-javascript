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

export enum CacheSetIfNotExistsResponse {
  Stored = 'Stored',
  NotStored = 'NotStored',
  Error = 'Error',
}

export enum CacheKeyExistsResponse {
  Success = 'Success',
  Error = 'Error',
}

export enum CacheKeysExistResponse {
  Success = 'Success',
  Error = 'Error',
}

export enum CacheItemGetTypeResponse {
  Hit = 'Hit',
  Miss = 'Miss',
  Error = 'Error',
}

export enum CacheItemGetTtlResponse {
  Hit = 'Hit',
  Miss = 'Miss',
  Error = 'Error',
}

// Note: update ttl has no NotSet response type
// as it sets the ttl unconditionally. We can still
// add this NotSet case later if actually needed.
export enum CacheUpdateTtlResponse {
  Set = 'Set',
  Miss = 'Miss',
  Error = 'Error',
}

export enum CacheIncreaseTtlResponse {
  Set = 'Set',
  NotSet = 'NotSet',
  Miss = 'Miss',
  Error = 'Error',
}

export enum CacheDecreaseTtlResponse {
  Set = 'Set',
  NotSet = 'NotSet',
  Miss = 'Miss',
  Error = 'Error',
}

export enum CacheGetWithHashResponse {
  Hit = 'Hit',
  Miss = 'Miss',
  Error = 'Error',
}

export enum CacheSetWithHashResponse {
  Stored = 'Stored',
  NotStored = 'NotStored',
  Error = 'Error',
}

export enum CacheSetIfPresentAndHashEqualResponse {
  Stored = 'Stored',
  NotStored = 'NotStored',
  Error = 'Error',
}

export enum CacheSetIfPresentAndHashNotEqualResponse {
  Stored = 'Stored',
  NotStored = 'NotStored',
  Error = 'Error',
}

export enum CacheSetIfAbsentOrHashEqualResponse {
  Stored = 'Stored',
  NotStored = 'NotStored',
  Error = 'Error',
}

export enum CacheSetIfAbsentOrHashNotEqualResponse {
  Stored = 'Stored',
  NotStored = 'NotStored',
  Error = 'Error',
}
