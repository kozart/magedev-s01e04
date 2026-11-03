import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { readNight } from '../src/digest/reader.js';

describe('readNight', () => {
  it('reads 2026-10-28: 5 jobs, 1 bad line', () => {
    const d = readNight('runs', '2026-10-28');
    expect(d?.badLines).toBe(1);
    expect(d?.rows.map((r) => r.job)).toEqual([
      'digest/render',
      'fixtures/refresh',
      'lane/sync',
      'notes/backup',
      'rig/rotate-logs',
    ]);
    const fx = d?.rows.find((r) => r.job === 'fixtures/refresh');
    expect(fx).toMatchObject({ runs: 4, retries: 3, lastStatus: 'ok', owner: 'rook' });
    expect(d?.rows.find((r) => r.job === 'notes/backup')).toMatchObject({ lastStatus: 'fail', lastError: 'quota exceeded' });
  });

  it('keeps a row with a null owner', () => {
    expect(readNight('runs', '2026-10-28')?.rows.find((r) => r.job === 'digest/render')?.owner).toBeNull();
  });

  it('keeps the offset from the log', () => {
    expect(readNight('runs', '2026-10-28')?.rows.find((r) => r.job === 'rig/rotate-logs')?.first).toBe('2026-10-28T23:00:02+01:00');
  });

  it('returns null for a night with no file, and an empty digest for an empty file', () => {
    const dir = mkdtempSync(join(tmpdir(), 'rig-'));
    writeFileSync(join(dir, '2026-01-01.jsonl'), '');
    expect(readNight(dir, '2026-01-02')).toBeNull();
    expect(readNight(dir, '2026-01-01')).toEqual({ night: '2026-01-01', rows: [], badLines: 0 });
    expect(readNight(dir, '../x')).toBeNull();
  });
});
