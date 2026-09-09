import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import ts from 'typescript';
import { SourcePackage } from '../contracts';

export const sha256 = (value: string | Buffer): string => crypto.createHash('sha256').update(value).digest('hex');
export const fileHash = (file: string): string => sha256(fs.readFileSync(file));
export function atomicJson(file: string, value: unknown): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporary = `${file}.${crypto.randomUUID()}.tmp`;
  fs.writeFileSync(temporary, JSON.stringify(value, null, 2)); fs.renameSync(temporary, file);
}
export function within(root: string, relative: string): string {
  if (!/^[a-zA-Z0-9_./-]+\.(tsx|ts)$/.test(relative) || relative.includes('..') || relative.startsWith('/') || relative.startsWith('.') && !relative.startsWith('./')) throw new Error(`Unsafe source path: ${relative}`);
  const resolved = path.resolve(root, relative);
  if (!resolved.startsWith(path.resolve(root) + path.sep)) throw new Error('Source escaped workspace');
  return resolved;
}
const allowedImports = new Set(['react', 'react/jsx-runtime', 'remotion', 'three', '@react-three/fiber', '@remotion/three']);
const denied = new Set(['eval','Function','require','process','global','globalThis','window','document','fetch','XMLHttpRequest','WebSocket','Worker','SharedWorker','navigator','location','localStorage','sessionStorage','indexedDB','Date','performance','setTimeout','setInterval','requestAnimationFrame','useFrame','useEffect','useLayoutEffect','useLoader','TextureLoader','FileLoader','AudioLoader','GLTFLoader','constructor','__proto__','prototype','dangerouslySetInnerHTML','iframe','script','object','embed','link','img','video','audio','Img','Video','OffthreadVideo','Audio','IFrame','staticFile','loadFont','importScripts']);
/** Defense in depth; the renderer additionally requires a network-disabled container. */
export function validateSource(source: SourcePackage): void {
  if (!source || !Array.isArray(source.files) || source.files.length < 1 || source.files.length > 16) throw new Error('Source package must contain 1–16 files');
  const names = new Set<string>(); let total = 0;
  for (const file of source.files) {
    within('/source', file.path);
    if (names.has(file.path) || file.path === 'index.tsx') throw new Error('Duplicate or reserved source path');
    names.add(file.path); total += Buffer.byteLength(file.content);
    if (total > 200_000) throw new Error('Source package exceeds 200 KB');
  }
  if (!names.has(source.entrypoint)) throw new Error('Entrypoint missing');
  for (const file of source.files) {
    const tree = ts.createSourceFile(file.path, file.content, ts.ScriptTarget.ES2022, true, file.path.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    const diagnostics = ts.transpileModule(file.content, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 }, reportDiagnostics: true }).diagnostics ?? [];
    if (diagnostics.some(d => d.category === ts.DiagnosticCategory.Error)) throw new Error(ts.formatDiagnosticsWithColorAndContext(diagnostics, { getCanonicalFileName: s => s, getCurrentDirectory: () => '.', getNewLine: () => '\n' }));
    const walk = (node: ts.Node): void => {
      if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
        const spec = node.moduleSpecifier;
        if (spec) {
          if (!ts.isStringLiteral(spec)) throw new Error('Nonliteral import forbidden');
          const mod = spec.text;
          if (mod.startsWith('.')) {
            const local = path.posix.normalize(path.posix.join(path.posix.dirname(file.path), mod));
            if (![local, `${local}.ts`, `${local}.tsx`, `${local}/index.ts`, `${local}/index.tsx`].some(p => names.has(p))) throw new Error(`Import outside source package: ${mod}`);
          } else if (!allowedImports.has(mod)) throw new Error(`Import not permitted: ${mod}`);
        }
      }
      if (ts.isImportEqualsDeclaration(node) || ts.isImportTypeNode(node) || ts.isElementAccessExpression(node) || ts.isComputedPropertyName(node) || node.kind === ts.SyntaxKind.ImportKeyword) throw new Error('Dynamic import/property access is outside the motion authoring policy');
      if (ts.isIdentifier(node) && denied.has(node.text)) throw new Error(`Forbidden capability: ${node.text}`);
      if (ts.isStringLiteralLike(node) && (/^(https?:|file:|data:|javascript:|\/\/)/i.test(node.text) || denied.has(node.text))) throw new Error('External URL or capability string forbidden');
      if (ts.isPropertyAccessExpression(node) && node.expression.getText(tree) === 'Math' && node.name.text === 'random') throw new Error('Use frame-driven deterministic values, not Math.random');
      ts.forEachChild(node, walk);
    };
    walk(tree);
  }
}
export function collectCodeContext(root: string): { path: string; sha256: string; content: string }[] {
  return ['remotion/motion-runtime/sdk.tsx', 'package.json', 'graph/motion/contracts.ts'].map(relative => {
    const content = fs.readFileSync(path.join(root, relative), 'utf8');
    if (Buffer.byteLength(content) > 100_000) throw new Error('Code context exceeds inline limit');
    return { path: relative, sha256: sha256(content), content };
  });
}
