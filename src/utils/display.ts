// Utility functions related to displaying things to the user.

export function truncateString(value: string, maxLength = 32) {
  if (value.length > maxLength) {
    return value.substring(0, maxLength) + '...';
  } else {
    return value;
  }
}

const DISPLAY_SIZE_LIMIT = 5;

function truncateStringArrayToSize(
  stringArray: string[],
  length: number
): string[] {
  if (stringArray.length <= length) {
    return stringArray;
  } else {
    return stringArray.slice(0, length).concat(['...']);
  }
}

export function truncateStringArray(
  stringArray: string[],
  length: number = DISPLAY_SIZE_LIMIT
): string[] {
  const truncatedStringArray = truncateStringArrayToSize(stringArray, length);
  return truncatedStringArray.map(s => {
    return truncateString(s);
  });
}
