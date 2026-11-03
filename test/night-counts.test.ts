import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { nightCounts } from '../src/digest/counts.js';

const config = { adapter: 'shim', installed: '2026-10-29T14:06:00+01:00', beatEverySeconds: 60, runsDir: 'runs' };

describe('nightCounts', () => {
  it('counts log lines by status for 2026-10-28, skipping the bad line', () => {
    expect(nightCounts('runs', '2026-10-28')).toEqual({ ok: 10, retry: 4, fail: 1 });
  });

  it('returns null for a night with no file or a malformed night', () => {
    expect(nightCounts('runs', '2026-01-02')).toBeNull();
    expect(nightCounts('runs', '../x')).toBeNull();
  });
});

describe('status board night links', () => {
  it('links each night to its digest with its counts', async () => {
    const html = await (await createApp(config).request('/')).text();
    expect(html).toContain('<a href="/digest/2026-10-28">2026-10-28</a> · <span>ok 10 · retry 4 · fail 1</span>');
    expect(html).toContain('<a href="/digest/2026-10-27">2026-10-27</a> · <span>ok 7 · retry 0 · fail 0</span>');
  });
});
