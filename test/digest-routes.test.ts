import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

const base = { adapter: 'shim', installed: '2026-10-29T14:06:00+01:00', beatEverySeconds: 60 };

function appWith(files: Record<string, string>) {
  const runsDir = mkdtempSync(join(tmpdir(), 'rig-routes-'));
  for (const [name, text] of Object.entries(files)) writeFileSync(join(runsDir, name), text);
  return createApp({ ...base, runsDir });
}

const ok = '{"at":"2026-01-01T01:00:00+01:00","job":"a/job","status":"ok","owner":"rook"}\n';

describe('digest routes', () => {
  it('200 for a night with rows, page and JSON agree on jobs and order', async () => {
    const app = appWith({
      '2026-01-01.jsonl':
        '{"at":"2026-01-01T02:00:00+01:00","job":"z/job","status":"ok","owner":null}\n' + ok,
    });
    const page = await app.request('/digest/2026-01-01');
    const json = await app.request('/api/digest/2026-01-01');
    expect(page.status).toBe(200);
    expect(json.status).toBe(200);
    const jobs = ((await json.json()) as { rows: { job: string }[] }).rows.map((r) => r.job);
    expect(jobs).toEqual(['a/job', 'z/job']);
    const html = await page.text();
    expect(html.indexOf('a/job')).toBeLessThan(html.indexOf('z/job'));
    expect(html).toContain('—');
  });

  it('404 for a night with no file', async () => {
    const app = appWith({});
    expect((await app.request('/digest/2026-01-01')).status).toBe(404);
    const json = await app.request('/api/digest/2026-01-01');
    expect(json.status).toBe(404);
    expect(await json.json()).toEqual({ error: 'no such night' });
  });

  it('empty night renders "nothing ran"', async () => {
    const app = appWith({ '2026-01-01.jsonl': '' });
    const page = await app.request('/digest/2026-01-01');
    expect(page.status).toBe(200);
    expect(await page.text()).toContain('nothing ran');
    const json = await app.request('/api/digest/2026-01-01');
    expect(await json.json()).toEqual({ night: '2026-01-01', rows: [], badLines: 0 });
  });

  it('a bad line is counted and the night still renders', async () => {
    const app = appWith({ '2026-01-01.jsonl': ok + '{"at":"2026-01-01T0\n' });
    const page = await app.request('/digest/2026-01-01');
    expect(page.status).toBe(200);
    expect(await page.text()).toContain('a/job');
    const body = (await (await app.request('/api/digest/2026-01-01')).json()) as { badLines: number; rows: unknown[] };
    expect(body.badLines).toBe(1);
    expect(body.rows).toHaveLength(1);
  });

  it('marks retries of 3 or more and fail', async () => {
    const r = (s: string) => `{"at":"2026-01-01T01:00:00+01:00","job":"r/job","status":"${s}","owner":"rook"}\n`;
    const app = appWith({
      '2026-01-01.jsonl': r('retry') + r('retry') + r('retry') + r('ok') + '{"at":"2026-01-01T03:00:00+01:00","job":"f/job","status":"fail","owner":"rook","error":"boom"}\n',
    });
    const html = await (await app.request('/digest/2026-01-01')).text();
    expect(html).toContain('⚠');
    expect(html).toContain('boom');
  });
});
