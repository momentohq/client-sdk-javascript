// Utility functions related to displaying things to the user.

export function truncateString(value: string, maxLength = 32) {
  if (value.length > maxLength) {
    return value.substring(0, maxLength) + '...';
  } else {
    return value;
  }
}

const DISPLAY_SIZE_LIMIT = 5;

function truncateStringArrayToSize(xs: string[], length: number): string[] {
  if (xs.length <= length) {
    return xs;
  } else {
    return xs.slice(0, length).concat(['...']);
  }
}

export function truncateStringArray(
  xs: string[],
  length: number = DISPLAY_SIZE_LIMIT
): string[] {
  const xss = truncateStringArrayToSize(xs, length);
  return xss.map(v => {
    return truncateString(v);
  });
}
