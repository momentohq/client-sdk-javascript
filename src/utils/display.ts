// Utility functions related to displaying things to the user.

export function truncateString(value: string, maxLength: number = 32) {
  if (value.length > maxLength) {
    return value.substring(0, maxLength) + '...';
  } else {
    return value
  }
}
