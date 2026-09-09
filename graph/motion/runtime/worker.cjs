/* Trusted worker entrypoint. Generated source is only bundled and rendered in Chromium. */
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const ts = require('typescript');
const { bundle } = require('@remotion/bundler');
const { selectComposition, renderMedia, renderStill } = require('@remotion/renderer');

async function main() {
  const request = JSON.parse(fs.readFileSync('/input/request.json', 'utf8'));
  const source = '/work/source'; fs.mkdirSync(source, { recursive: true });
  fs.cpSync('/input/source', source, { recursive: true });
  fs.symlinkSync('/opt/motion/node_modules', '/work/node_modules', 'dir');
  const roots = [];
  function files(dir) { for (const entry of fs.readdirSync(dir, { withFileTypes: true })) { const p = path.join(dir, entry.name); if (entry.isDirectory()) files(p); else if (/\.tsx?$/.test(p)) roots.push(p); } }
  files(source);
  const program = ts.createProgram(roots, { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, moduleResolution: ts.ModuleResolutionKind.Node10, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true, strict: true, skipLibCheck: true, noEmit: true, types: ['react', 'react-dom'], typeRoots: ['/opt/motion/node_modules/@types'] });
  const diagnostics = ts.getPreEmitDiagnostics(program);
  if (diagnostics.some(d => d.category === ts.DiagnosticCategory.Error)) throw new Error(ts.formatDiagnosticsWithColorAndContext(diagnostics, { getCanonicalFileName: s => s, getCurrentDirectory: () => source, getNewLine: () => '\n' }));
  const serveUrl = await bundle({ entryPoint: path.join(source, 'index.tsx'), outDir: '/output/bundle', enableCaching: false, publicDir: null, rootDir: '/work' });
  const options = { serveUrl, browserExecutable: '/usr/bin/chromium', chromiumOptions: { gl: 'angle', enableMultiProcessOnLinux: true }, timeoutInMilliseconds: 120_000 };
  const composition = await selectComposition({ ...options, id: 'AuthoredMotion' });
  const videoPath = '/output/' + request.phase + '.mp4';
  await renderMedia({ ...options, composition, codec: 'h264', outputLocation: videoPath, scale: request.phase === 'preview' ? 0.5 : 1, concurrency: 1, crf: 18, pixelFormat: 'yuv420p', onBrowserLog: log => { if (log.type === 'error') throw new Error(log.text); } });
  const frames = [];
  for (const frame of request.frames) {
    const name = `frame-${String(frame).padStart(6, '0')}.png`;
    // Extract from the actual encoded result, so review covers the video being delivered.
    execFileSync('ffmpeg', ['-v', 'error', '-i', videoPath, '-vf', `select=eq(n\\,${frame})`, '-frames:v', '1', '-y', `/output/${name}`], { timeout: 60_000 });
    frames.push({ frame, path: name });
  }
  const probe = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-count_frames', '-show_entries', 'stream=width,height,r_frame_rate,nb_read_frames', '-of', 'json', videoPath], { encoding: 'utf8', timeout: 120_000 }));
  const stream = probe.streams[0]; const [num, den] = stream.r_frame_rate.split('/').map(Number);
  const metadata = { videoPath: path.basename(videoPath), frames, durationInFrames: Number(stream.nb_read_frames), fps: num / den, width: stream.width, height: stream.height, renderer: `remotion@${require('remotion/package.json').version}/chromium-angle`, isolation: 'docker-network-none-readonly-nonroot' };
  fs.writeFileSync('/output/result.json', JSON.stringify(metadata));
}
main().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
