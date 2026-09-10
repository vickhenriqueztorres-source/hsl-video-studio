/* Trusted worker entrypoint for host execution. */
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const ts = require('typescript');
const { bundle } = require('@remotion/bundler');
const { selectComposition, renderMedia } = require('@remotion/renderer');

async function main() {
  const [,, inputDir, outputDir, repoRoot] = process.argv;
  if (!inputDir || !outputDir || !repoRoot) {
    throw new Error('Usage: hostWorker.cjs <inputDir> <outputDir> <repoRoot>');
  }
  const request = JSON.parse(fs.readFileSync(path.join(inputDir, 'request.json'), 'utf8'));
  const source = path.join(inputDir, 'source');
  const roots = [];
  function files(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) files(p);
      else if (/\.tsx?$/.test(p)) roots.push(p);
    }
  }
  files(source);
  const program = ts.createProgram(roots, {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.CommonJS,
    moduleResolution: ts.ModuleResolutionKind.Node10,
    jsx: ts.JsxEmit.ReactJSX,
    esModuleInterop: true,
    strict: true,
    skipLibCheck: true,
    noEmit: true,
    types: ['react', 'react-dom'],
  });
  const diagnostics = ts.getPreEmitDiagnostics(program);
  if (diagnostics.some(d => d.category === ts.DiagnosticCategory.Error)) {
    throw new Error(ts.formatDiagnosticsWithColorAndContext(diagnostics, {
      getCanonicalFileName: s => s,
      getCurrentDirectory: () => source,
      getNewLine: () => '\n',
    }));
  }
  const bundleDir = path.join(outputDir, 'bundle');
  const serveUrl = await bundle({
    entryPoint: path.join(source, 'index.tsx'),
    outDir: bundleDir,
    enableCaching: false,
    publicDir: null,
    rootDir: repoRoot,
  });
  const options = {
    serveUrl,
    chromiumOptions: { gl: 'angle' },
    timeoutInMilliseconds: 300_000,
  };
  const composition = await selectComposition({ ...options, id: 'AuthoredMotion' });
  const videoPath = path.join(outputDir, request.phase + '.mp4');
  await renderMedia({
    ...options,
    composition,
    codec: 'h264',
    outputLocation: videoPath,
    scale: request.phase === 'preview' ? 0.5 : 1,
    concurrency: 1,
    crf: 18,
    pixelFormat: 'yuv420p',
    onBrowserLog: log => { if (log.type === 'error') throw new Error(log.text); },
  });
  const frames = [];
  for (const frame of request.frames) {
    const name = `frame-${String(frame).padStart(6, '0')}.png`;
    const framePath = path.join(outputDir, name);
    execFileSync('ffmpeg', ['-v', 'error', '-i', videoPath, '-vf', `select=eq(n\\,${frame})`, '-frames:v', '1', '-y', framePath], { timeout: 60_000 });
    frames.push({ frame, path: name });
  }
  const probe = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-count_frames', '-show_entries', 'stream=width,height,r_frame_rate,nb_read_frames', '-of', 'json', videoPath], { encoding: 'utf8', timeout: 120_000 }));
  const stream = probe.streams[0];
  const [num, den] = stream.r_frame_rate.split('/').map(Number);
  const metadata = {
    videoPath: path.basename(videoPath),
    frames,
    durationInFrames: Number(stream.nb_read_frames),
    fps: num / den,
    width: stream.width,
    height: stream.height,
    renderer: `remotion@${require('remotion/package.json').version}/chromium-angle`,
    isolation: 'host-process',
  };
  fs.writeFileSync(path.join(outputDir, 'result.json'), JSON.stringify(metadata));
  if (fs.existsSync(bundleDir)) {
    try { fs.rmSync(bundleDir, { recursive: true, force: true }); } catch {}
  }
}
main().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
