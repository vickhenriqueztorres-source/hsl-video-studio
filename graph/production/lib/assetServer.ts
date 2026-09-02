import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { AddressInfo } from 'node:net';
let active: { root: string; server: http.Server; baseUrl: string } | undefined;
let starting: Promise<{ baseUrl: string }> | undefined;

export async function responds(baseUrl?: string): Promise<boolean> {
  if (!baseUrl || !/^http:\/\/127\.0\.0\.1:\d+$/.test(baseUrl)) return false;
  return new Promise(resolve => {
    const req = http.request(baseUrl, { method: 'HEAD', timeout: 500 }, res => { res.resume(); resolve(true); });
    req.on('timeout', () => { req.destroy(); resolve(false); });
    req.on('error', () => resolve(false)); req.end();
  });
}
export async function ensureRunning(root: string): Promise<{ baseUrl: string }> {
  if (active) {
    if (active.root !== path.resolve(root)) throw new Error('ASSET_SERVER_ROOT_CONFLICT');
    return { baseUrl: active.baseUrl };
  }
  if (starting) return starting;
  starting = (async () => {
    const server = http.createServer((req, res) => {
      try {
        const url = new URL(req.url || '/', 'http://127.0.0.1');
        const clean = decodeURIComponent(url.pathname).replace(/^\/+/, '').replace(/^public\//, '');
        const relative = path.normalize(clean);
        const candidates = [path.resolve(root, 'public', relative), path.resolve(root, relative)];
        const file = candidates.find(f => {
          const rel = path.relative(root, f);
          return rel && !rel.startsWith('..') && !path.isAbsolute(rel) && fs.existsSync(f) && fs.statSync(f).isFile();
        });
        if (!file) { res.writeHead(404); res.end('Not Found'); return; }
        const stat = fs.statSync(file);
        const types: Record<string, string> = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.mp4': 'video/mp4', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.json': 'application/json' };
        res.setHeader('Access-Control-Allow-Origin', '*'); res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Content-Type', types[path.extname(file).toLowerCase()] ?? 'application/octet-stream');
        let start = 0, end = stat.size - 1;
        if (req.headers.range) {
          const match = req.headers.range.match(/bytes=(\d*)-(\d*)/);
          start = match?.[1] ? parseInt(match[1], 10) : 0;
          end = Math.min(match?.[2] ? parseInt(match[2], 10) : stat.size - 1, stat.size - 1);
          if (start >= stat.size || start > end) { res.writeHead(416, { 'Content-Range': `bytes */${stat.size}` }); res.end(); return; }
          res.writeHead(206, { 'Content-Range': `bytes ${start}-${end}/${stat.size}`, 'Content-Length': end - start + 1 });
        } else res.setHeader('Content-Length', stat.size);
        if (req.method === 'HEAD') { res.end(); return; }
        fs.createReadStream(file, { start, end }).on('error', () => res.destroy()).pipe(res);
      } catch (e) { res.statusCode = 500; res.end(String(e)); }
    });
    await new Promise<void>((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
    const baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    active = { root: path.resolve(root), server, baseUrl };
    return { baseUrl };
  })();
  try { return await starting; } finally { starting = undefined; }
}
export async function closeAssetServer() {
  if (starting) await starting;
  const instance = active; active = undefined;
  if (instance) await new Promise<void>((resolve, reject) => {
    instance.server.close(err => err ? reject(err) : resolve()); instance.server.closeAllConnections();
  });
}
