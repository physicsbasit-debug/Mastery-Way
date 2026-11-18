import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

// Temporary exception for a dev-only transitive dependency with no published fix.
// Remove this exception as soon as a fixed version is available.
const ALLOWED_ADVISORY = 'https://github.com/advisories/GHSA-fc5q-39xc-vjpf';
const EXPIRY = Date.parse('2026-12-19T00:00:00Z');
const severityRank = { info: 0, low: 1, moderate: 2, high: 3, critical: 4 };

export function evaluateAudit(report, lock, now = new Date()) {
  const fail = reason => ({ ok: false, reason });
  if (report?.auditReportVersion !== 2 || !report.vulnerabilities || !report.metadata?.vulnerabilities || !lock?.packages || report.error) return fail('Invalid or incomplete npm audit report');
  const entries = Object.entries(report.vulnerabilities);
  if (report.metadata.vulnerabilities.total !== entries.length) return fail('Inconsistent audit report');
  const isAllowed = (name, visiting = new Set()) => {
    const item = report.vulnerabilities[name];
    if (!item || visiting.has(name) || !Array.isArray(item.nodes) || item.nodes.length === 0 || !Array.isArray(item.via) || item.via.length === 0) return false;
    if (!item.nodes.every(node => lock.packages[node]?.dev === true)) return false;
    const next = new Set(visiting).add(name);
    return item.via.every(via => typeof via === 'string' ? isAllowed(via, next) : via?.name === 'picomatch' && via.url === ALLOWED_ADVISORY);
  };
  const excepted = [];
  for (const [name, vulnerability] of entries) {
    const rank = severityRank[vulnerability.severity];
    if (rank === undefined) return fail(`Unknown severity for ${name}`);
    if (rank < severityRank.moderate) continue;
    if (now.getTime() >= EXPIRY || !isAllowed(name)) return fail(`Unresolved vulnerability: ${name}`);
    excepted.push(name);
  }
  return { ok: true, excepted };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = spawnSync('npm', ['audit', '--json'], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  if (result.error || ![0, 1].includes(result.status)) { console.error('npm audit could not run:', result.error || result.stderr); process.exit(1); }
  try {
    const report = JSON.parse(result.stdout);
    const decision = evaluateAudit(report, JSON.parse(readFileSync('package-lock.json', 'utf8')));
    if (!decision.ok) { console.error(decision.reason); console.error(result.stdout); process.exit(1); }
    if (decision.excepted.length) console.warn(`WARNING: temporary dev-only exception for ${ALLOWED_ADVISORY}; packages: ${decision.excepted.join(', ')}. Expires 2026-12-19 UTC. The vulnerability is not fixed.`);
    else console.log('Dependency audit passed without exceptions.');
  } catch (error) { console.error('Cannot validate npm audit:', error); process.exit(1); }
}
