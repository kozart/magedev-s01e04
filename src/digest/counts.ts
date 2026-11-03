import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export type NightCounts = { ok: number; retry: number; fail: number };

/**
 * Counts a night's log LINES by status (not jobs: a job with three retries and an ok is three
 * `retry` and one `ok`). A line is counted only if `reader.ts` would accept it as a log line;
 * anything else is skipped. Returns `null` when the night has no readable file.
 *
 * Self-contained on purpose: the line rules are copied, not imported, so reader.ts can change
 * without touching the status board.
 */
export function nightCounts(runsDir: string, night: string): NightCounts | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(night)) return null;
  let text: string;
  try {
    text = readFileSync(join(runsDir, `${night}.jsonl`), 'utf8');
  } catch {
    return null;
  }

  const counts: NightCounts = { ok: 0, retry: 0, fail: 0 };
  for (const raw of text.split(/\r?\n/)) {
    if (raw.trim() === '') continue;
    const status = lineStatus(raw);
    if (status) counts[status]++;
  }
  return counts;
}

function lineStatus(text: string): keyof NightCounts | null {
  let v: unknown;
  try {
    v = JSON.parse(text);
  } catch {
    return null;
  }
  if (typeof v !== 'object' || v === null) return null;
  const o = v as Record<string, unknown>;
  if (typeof o.at !== 'string' || typeof o.job !== 'string') return null;
  if (o.owner !== null && o.owner !== undefined && typeof o.owner !== 'string') return null;
  if (o.error !== undefined && typeof o.error !== 'string') return null;
  if (o.status === 'ok' || o.status === 'retry' || o.status === 'fail') return o.status;
  return null;
}
