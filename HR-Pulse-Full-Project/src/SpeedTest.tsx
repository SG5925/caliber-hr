import { useState } from 'react';
import { Gauge } from 'lucide-react';
import { api } from './api';
import './speed-test.css';

type SpeedReport = {
  startedAt: string;
  checkedAt: string;
  database: { ok: boolean; ms: number };
  pool: { idle: number; waiting: number } | null;
  eventLoop: { p95Ms: number; worstMs: number } | null;
  operations: { label: string; count: number; averageMs: number; worstMs: number; failed: number }[];
};

const dateTime = new Intl.DateTimeFormat('en-IN', {
  dateStyle: 'medium', timeStyle: 'medium', timeZone: 'Asia/Kolkata',
});
const duration = (ms: number) => ms < 1000 ? Math.round(ms) + ' ms' : (ms / 1000).toFixed(1) + ' s';

export default function SpeedTest({ grant }: { grant: string }) {
  const [result, setResult] = useState<{ report: SpeedReport; roundTripMs: number }>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function run() {
    setBusy(true);
    setError('');
    setResult(undefined);
    const started = performance.now();
    try {
      const report = await api<SpeedReport>(grant, 'admin/speed-test');
      setResult({ report, roundTripMs: performance.now() - started });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const report = result?.report;
  const status = !report || !result ? null : !report.database.ok
    ? { tone: 'slow', title: 'Database unavailable', detail: 'The API responded, but the database check failed.' }
    : result.roundTripMs >= 1500 || report.database.ms >= 500
      ? { tone: 'slow', title: 'Speed slow', detail: 'API response reached 1.5 s or the database check reached 500 ms.' }
      : { tone: 'normal', title: 'Speed normal', detail: 'API response was under 1.5 s and the database check was under 500 ms.' };

  return <section className="data-card speed-test" aria-labelledby="speed-test-title">
    <div className="data-heading">
      <div><h2 id="speed-test-title">Speed Test</h2><p>Check HR Pulse API and database response times.</p></div>
      <div className="toolbar-buttons"><button className="primary" disabled={busy} onClick={() => void run()}>
        <Gauge aria-hidden="true"/>{busy ? 'Testing…' : 'Run speed test'}
      </button></div>
    </div>
    {error && <p className="error" role="alert">{error}</p>}
    {report && result && status && <>
      <div className={'speed-status ' + status.tone} role="status">
        <strong>{status.title}</strong><span>{status.detail}</span>
      </div>
      <p className="help-text">Checked {dateTime.format(new Date(report.checkedAt))} IST</p>
      <dl className="detail-grid">
        <div><dt>Browser to API round trip</dt><dd>{duration(result.roundTripMs)}</dd></div>
        <div><dt>Database check</dt><dd>{report.database.ok ? duration(report.database.ms) : 'Failed after ' + duration(report.database.ms)}</dd></div>
        {report.pool && <div><dt>Database connections</dt><dd>{report.pool.idle} idle, {report.pool.waiting} waiting</dd></div>}
        <div><dt>Server event loop delay</dt><dd>{report.eventLoop ? duration(report.eventLoop.p95Ms) + ' p95, ' + duration(report.eventLoop.worstMs) + ' worst' : 'Waiting for samples'}</dd></div>
      </dl>
      <h3>Slowest monitored operations</h3>
      <p className="help-text">Server timings since {dateTime.format(new Date(report.startedAt))} IST. Sorted by average response time.</p>
      {report.operations.length ? <div className="table-scroll"><table>
        <thead><tr><th scope="col">Operation</th><th scope="col">Requests</th><th scope="col">Average</th><th scope="col">Worst</th><th scope="col">Failed</th></tr></thead>
        <tbody>{report.operations.map(op => <tr key={op.label}>
          <th scope="row">{op.label}</th><td>{op.count}</td><td>{duration(op.averageMs)}</td><td>{duration(op.worstMs)}</td><td>{op.failed}</td>
        </tr>)}</tbody>
      </table></div> : <p>No monitored requests recorded yet.</p>}
    </>}
  </section>;
}
