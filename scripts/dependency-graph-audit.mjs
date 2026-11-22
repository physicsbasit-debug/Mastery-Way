#!/usr/bin/env node
// Read-only repository dependency audit. No packages or source files are deleted.
import { readdirSync, readFileSync } from 'node:fs';
import ts from 'typescript';
import { dirname, extname, join, resolve, relative, sep } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const extensions = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.css', '.json', '.png', '.svg', '.jpg', '.jpeg', '.webp'];
const excluded = new Set(['node_modules', 'dist', '.git', '.vite', 'coverage']);
function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    if (entry.isDirectory()) return excluded.has(entry.name) ? [] : walk(join(dir, entry.name));
    return extensions.includes(extname(entry.name)) ? [join(dir, entry.name)] : [];
  });
}
const all = walk(root);
const source = all.filter(p => /\.(?:tsx?|jsx?|mjs)$/.test(p) && !p.includes(`${sep}tests${sep}`));
const set = new Set(all);
const edges = new Map();
const external = new Map();
const missing = [];
function importSpecifiers(file, code) {
  const kind = file.endsWith('.tsx') ? ts.ScriptKind.TSX : file.endsWith('.jsx') ? ts.ScriptKind.JSX : ts.ScriptKind.TS;
  const ast = ts.createSourceFile(file, code, ts.ScriptTarget.Latest, true, kind);
  const result = [];
  function visit(node) {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
        node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
      result.push(node.moduleSpecifier.text);
    }
    if (ts.isCallExpression(node) && node.arguments.length === 1 &&
        ts.isStringLiteral(node.arguments[0]) &&
        (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
          (ts.isIdentifier(node.expression) && node.expression.text === 'require'))) {
      result.push(node.arguments[0].text);
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
  return result;
}
function resolveLocal(from, spec) {
  const base = spec.startsWith('@/') ? join(root, spec.slice(2)) : resolve(dirname(from), spec);
  const options = [base, ...extensions.map(ext => base + ext), ...extensions.map(ext => join(base, 'index' + ext))];
  return options.find(p => set.has(p)) ?? null;
}
for (const file of source) {
  const code = readFileSync(file, 'utf8');
  const refs = new Set();
  for (const spec of importSpecifiers(file, code)) {
    if (spec.startsWith('.') || spec.startsWith('@/')) {
      const target = resolveLocal(file, spec);
      if (target) refs.add(target);
      else missing.push({ from: relative(root, file), spec });
    } else if (!spec.startsWith('node:')) {
      const pkg = spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0];
      if (!external.has(pkg)) external.set(pkg, new Set());
      external.get(pkg).add(relative(root, file));
    }
  }
  edges.set(file, refs);
}
const entries = ['main.tsx', 'app.tsx', 'vite.config.ts', 'scripts/security-audit-policy.mjs', 'scripts/dependency-graph-audit.mjs']
  .map(p => join(root, p)).filter(p => set.has(p));
const reachable = new Set();
function visit(file) {
  if (reachable.has(file)) return;
  reachable.add(file);
  for (const next of edges.get(file) || []) visit(next);
}
entries.forEach(visit);
const retained = new Set(['comparison/']);
// Preserved modules also retain their transitive imports, even outside comparison/.
for (const file of source) {
  const name = relative(root, file).split(sep).join('/');
  if ([...retained].some(prefix => name.startsWith(prefix))) visit(file);
}
const unreachable = source.map(p => relative(root, p).split(sep).join('/'))
  .filter(p => !reachable.has(join(root, p)));
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const declared = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
const unusedCandidates = declared.filter(p => !external.has(p) &&
  !['typescript', 'vite', '@vitejs/plugin-react', '@tailwindcss/vite', 'tailwindcss', '@types/node', '@types/react', '@types/react-dom'].includes(p));
const undeclared = [...external.keys()].filter(p => !declared.includes(p));
const report = {
  sourceFiles: source.length,
  importsResolved: [...edges.values()].reduce((n, s) => n + s.size, 0),
  externalPackagesUsed: [...external.keys()].sort(),
  missingRelativeImports: missing,
  unreachableCandidates: unreachable.sort(),
  intentionallyRetained: ['comparison/'],
  unusedDependencyCandidates: unusedCandidates,
  undeclaredPackageImports: undeclared,
  limitations: 'TypeScript AST literal import graph only; computed imports, CSS url(), public assets, tests and framework conventions require manual review. Candidates are not safe-to-delete findings.'
};
process.stdout.write(JSON.stringify(report, null, 2) + '\n');
if (missing.length || undeclared.length) process.exitCode = 1;
