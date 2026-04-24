/**
 * Safely extracts a displayable string from a value that might be a string or an object.
 * Used for rendering AI response fields that may return structured objects instead of plain strings.
 * Tries the given field names in order if the value is an object.
 */
export function safeText(value: any, ...preferredFields: string[]): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value === 'object') {
    for (const f of preferredFields) {
      if (value[f] !== null && value[f] !== undefined) {
        if (typeof value[f] === 'string') return value[f];
        if (typeof value[f] === 'number') return String(value[f]);
      }
    }
    const commonFields = ['text', 'name', 'description', 'label', 'value', 'message', 'summary', 'title'];
    for (const f of commonFields) {
      if (typeof value[f] === 'string') return value[f];
    }
    return JSON.stringify(value);
  }
  return String(value);
}
