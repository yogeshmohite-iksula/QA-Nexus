// F26 EvalHarness — 4 eval rows. AC042 verbatim per M5 close-gate.
// Also renders Autonomy ladder (H3 "Autonomy ladder Governance · per-agent")
// inside this section per spec.

'use client';

import { F26_RAW } from '@/components/admin/agents-page.canned-data';
import type { F26EvalHarnessData, F26AutonomyLadderData } from '@/components/admin/agents/types';

const LADDER_H3 =
  F26_RAW.headings.h3.find((h) => h.startsWith('Autonomy ladder')) ?? 'Autonomy ladder';
const MODEL_H3 =
  F26_RAW.headings.h3.find((h) => h.startsWith('Model parameters')) ?? 'Model parameters';

interface Props {
  data: F26EvalHarnessData;
  autonomyLadder: F26AutonomyLadderData;
}

export function EvalHarness({ data, autonomyLadder }: Props) {
  return (
    <section aria-labelledby="eval-h">
      <header className="section-head">
        <h2 id="eval-h" className="visually-hidden">
          Eval harness
        </h2>
        <h3 className="section-h2">
          {LADDER_H3} <span className="pill-note text-muted">Governance · per-agent</span>
        </h3>
      </header>
      <div className="section-body">
        <div className="eval-suite text-muted">
          <strong>{data.suite}</strong> <span>· {data.suiteDescription}</span>
        </div>
        <div className="eval-table-wrap">
          <table className="eval-table" aria-label="Recent eval runs">
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Label</th>
                <th scope="col">Score</th>
                <th scope="col">Trend</th>
                <th scope="col">Detail</th>
                <th scope="col">Fails</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row, i) => (
                <tr
                  key={i}
                  data-label={row.label}
                  data-tone={
                    row.trend.includes('PASS')
                      ? 'pass'
                      : row.trend.includes('Improved')
                        ? 'pass'
                        : row.trend.includes('Declined')
                          ? 'fail'
                          : 'info'
                  }
                >
                  <td>{row.date}</td>
                  <td>
                    <strong>{row.label}</strong>
                  </td>
                  <td>{row.scorePct}%</td>
                  <td>{row.trend}</td>
                  <td>{row.detail}</td>
                  <td>
                    <span className="eval-fail-count">{row.failCount}</span>{' '}
                    <span className="text-muted">({row.fails.join(', ')})</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <h3 className="section-h2 autonomy-h3">{MODEL_H3}</h3>
        <ol className="autonomy-ladder" aria-label="Autonomy ladder">
          {autonomyLadder.map((step) => (
            <li key={step.level} className="autonomy-step" data-level={step.level}>
              <div className="autonomy-head">
                <span className="autonomy-level">L{step.level}</span>
                <strong className="autonomy-name">{step.name}</strong>
                {'tag' in step && step.tag && (
                  <span className="autonomy-tag text-muted">{step.tag}</span>
                )}
              </div>
              <p className="autonomy-desc text-muted">{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
