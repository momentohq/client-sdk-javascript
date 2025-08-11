export function convert(v: string | Uint8Array): Uint8Array {
  if (typeof v === 'string') {
    return new TextEncoder().encode(v);
  }
  return v;
}

export function getCurrentTimeAsDateObject(): Date {
  return new Date();
}

export function createDateObjectFromUnixMillisTimestamp(
  unixMillisTimestamp: number
): Date {
  return new Date(unixMillisTimestamp);
}

export function hasExceededDeadlineRelativeToNow(overallDeadline: Date) {
  return getCurrentTimeAsDateObject() >= overallDeadline;
}
