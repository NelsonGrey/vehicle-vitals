/**
 * Coerces a Firestore timestamp-like value into a JS Date.
 * Handles Firestore SDK Timestamp objects (.toDate()/.toMillis()), the
 * plain { seconds } / { _seconds } shape Firestore data takes after
 * crossing an HTTP callable boundary, ISO/parseable date strings, and
 * epoch millis. Returns null when the value can't be resolved, leaving
 * fallback behavior (e.g. "now", "0", a raw string) up to the caller.
 */
export function coerceFirestoreTimestamp(value: unknown): Date | null {
  if (!value) {
    return null;
  }

  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;

    if (typeof record.toDate === 'function') {
      try {
        return (record.toDate as () => Date)();
      } catch {
        return null;
      }
    }

    if (typeof record.toMillis === 'function') {
      const millis = (record.toMillis as () => number)();
      return Number.isFinite(millis) ? new Date(millis) : null;
    }

    const seconds =
      typeof record.seconds === 'number'
        ? record.seconds
        : typeof record._seconds === 'number'
          ? record._seconds
          : null;

    return seconds !== null ? new Date(seconds * 1000) : null;
  }

  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? new Date(parsed) : null;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? new Date(value) : null;
  }

  return null;
}
