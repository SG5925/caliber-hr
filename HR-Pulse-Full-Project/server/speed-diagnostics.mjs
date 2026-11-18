import { monitorEventLoopDelay, performance } from 'node:perf_hooks';

const operations = [
  ['POST', /^\/api\/aadhaar\/scan$/, 'Aadhaar scans'],
  ['GET', /^\/api\/employee-master-register$/, 'Employee master register'],
  ['GET', /^\/api\/records\/employees$/, 'Employee records'],
  ['POST|PUT|PATCH', /^\/api\/records\/employees(?:\/[a-f0-9-]+)?$/i, 'Employee record saves'],
  ['GET', /^\/api\/approvals$/, 'Approval queue'],
  ['GET', /^\/api\/summary$/, 'Dashboard summary'],
  ['GET', /^\/api\/attendance\//, 'Attendance requests'],
];

export function createSpeedDiagnostics(query, poolStats) {
  const startedAt = new Date().toISOString();
  const delay = monitorEventLoopDelay({ resolution: 20 });
  const timings = new Map();
  let pendingCheck;

  function track(req, res, path) {
    const operation = operations.find(([methods, pattern]) =>
      methods.split('|').includes(req.method) && pattern.test(path)
    );
    if (!operation) return;
    const label = operation[2];
    const started = performance.now();
    res.once('finish', () => {
      const elapsed = performance.now() - started;
      const timing = timings.get(label) ?? { count: 0, totalMs: 0, worstMs: 0, failed: 0 };
      timing.count++;
      timing.totalMs += elapsed;
      timing.worstMs = Math.max(timing.worstMs, elapsed);
      if (res.statusCode >= 400) timing.failed++;
      timings.set(label, timing);
    });
  }

  async function checkDatabase() {
    const started = performance.now();
    try {
      await query('SELECT 1');
      return { ok: true, ms: performance.now() - started };
    } catch {
      return { ok: false, ms: performance.now() - started };
    }
  }

  async function report() {
    pendingCheck ??= checkDatabase().finally(() => { pendingCheck = undefined; });
    const database = await pendingCheck;
    return {
      startedAt,
      checkedAt: new Date().toISOString(),
      database,
      pool: poolStats?.() ?? null,
      eventLoop: delay.count ? { p95Ms: delay.percentile(95) / 1e6, worstMs: delay.max / 1e6 } : null,
      operations: Array.from(timings, ([label, { count, totalMs, worstMs, failed }]) =>
        ({ label, count, averageMs: totalMs / count, worstMs, failed })
      ).sort((a, b) => b.averageMs - a.averageMs),
    };
  }

  return { track, report, start: () => delay.enable(), stop: () => delay.disable() };
}
