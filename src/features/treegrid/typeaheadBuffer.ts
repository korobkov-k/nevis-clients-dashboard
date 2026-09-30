export const TYPEAHEAD_TIMEOUT_MS = 500;

/**
 * Accumulates typed characters into a search prefix. Uses event timestamps rather than timers,
 * so behaviour is deterministic and testable without faking the clock.
 */
export function createTypeaheadBuffer(timeoutMs = TYPEAHEAD_TIMEOUT_MS) {
  let query = '';
  let lastTimestamp = -Infinity;

  return {
    append(character: string, timestamp: number): string {
      const next = character.toLocaleLowerCase();
      query = timestamp - lastTimestamp > timeoutMs ? next : query + next;
      lastTimestamp = timestamp;
      // Repeating one character cycles through matches instead of searching for "bbb".
      const first = query.charAt(0);
      return query === first.repeat(query.length) ? first : query;
    },
  };
}
