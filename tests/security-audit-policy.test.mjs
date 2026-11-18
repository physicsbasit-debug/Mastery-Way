import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateAudit } from '../scripts/security-audit-policy.mjs';

const advisory = { name: 'picomatch', severity: 'high', url: 'https://github.com/advisories/GHSA-fc5q-39xc-vjpf' };
const lock = { packages: { 'node_modules/picomatch': {dev: true}, 'node_modules/vite': {dev: true} } };
const report = {auditReportVersion: 2, vulnerabilities: {picomatch: {severity: 'high', via: [advisory], nodes: ['node_modules/picomatch']}, vite: {severity: 'high', via: ['picomatch'], nodes: ['node_modules/vite']}}, metadata: {vulnerabilities: {info: 0, low: 0, moderate: 0, high: 2, critical: 0, total: 2}}};
test('allows only documented development advisory within exception period', () => assert.equal(evaluateAudit(report, lock, new Date('2026-11-18T00:00:00Z')).ok, true));
test('rejects exception after expiry', () => assert.equal(evaluateAudit(report, lock, new Date('2026-12-19T00:00:00Z')).ok, false));
test('rejects production dependency', () => assert.equal(evaluateAudit(report, {packages: {'node_modules/picomatch': {}, 'node_modules/vite': {dev:true}}}, new Date('2026-11-18')).ok, false));
test('rejects unrelated advisory through an otherwise allowed dependency', () => {const r=structuredClone(report); r.vulnerabilities.vite.via.push({name:'vite',severity:'moderate',url:'https://github.com/advisories/GHSA-other'}); assert.equal(evaluateAudit(r,lock,new Date('2026-11-18')).ok,false)});
test('rejects broken or unresolved audit reports', () => {assert.equal(evaluateAudit({error:{code:'E503'}},lock,new Date()).ok,false);const r=structuredClone(report);r.vulnerabilities.vite.via=['unknown'];assert.equal(evaluateAudit(r,lock,new Date()).ok,false)});
test('accepts clean audit report', () => assert.equal(evaluateAudit({auditReportVersion:2,vulnerabilities:{},metadata:{vulnerabilities:{total:0}}},lock,new Date()).ok,true));
