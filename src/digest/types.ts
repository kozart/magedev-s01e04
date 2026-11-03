export type RunStatus = 'ok' | 'retry' | 'fail';

// One row per job in a night's run log.
export type DigestRow = {
  job: string;
  /** `null` when the log has no owner; views show `—`. */
  owner: string | null;
  /** Number of log lines for this job. */
  runs: number;
  /** Number of lines with status `retry`. */
  retries: number;
  lastStatus: RunStatus;
  /** Error on the last line that had one, else `null`. */
  lastError: string | null;
  /** `at` of the first and last line, as written in the log (offset kept). */
  first: string;
  last: string;
};

export type Digest = {
  night: string;
  /** Rows sorted by job. */
  rows: DigestRow[];
  /** Lines that did not parse. Counted, never thrown. */
  badLines: number;
};

/**
 * Reads `<runsDir>/<night>.jsonl`. Returns `null` when the night has no file
 * (routes answer 404); an empty file gives `rows: []`.
 */
// Implemented in ./reader.ts as `readNight`.
export type ReadNight = (runsDir: string, night: string) => Digest | null;
