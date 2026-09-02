import {spawnSync} from 'child_process';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export interface ChatGptImageRequest {
  readonly id: string;
  readonly prompt: string;
  readonly targetPath: string;
}

export interface ChatGptImageResultItem {
  readonly id: string;
  readonly prompt: string;
  readonly filename: string;
  readonly filepath: string;
  readonly sha256: string;
  readonly width: number;
  readonly height: number;
  readonly copiedTo: string;
  readonly status: 'SUCCESS' | 'FAILED';
  readonly error?: string;
}

export interface ChatGptImageBatchResult {
  readonly status: 'CHATGPT_IMAGE_BATCH_SUCCESS' | 'CHATGPT_IMAGE_BATCH_PARTIAL' | 'CHATGPT_IMAGE_BATCH_FAILED';
  readonly totalRequested: number;
  readonly totalCompleted: number;
  readonly items: readonly ChatGptImageResultItem[];
}

function sha256File(filePath: string): string {
  return `sha256_${crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex')}`;
}

function imageDimensions(filePath: string): {width: number; height: number} {
  const probe = spawnSync('ffprobe', [
    '-v', 'error',
    '-select_streams', 'v:0',
    '-show_entries', 'stream=width,height',
    '-of', 'json',
    filePath
  ], {encoding: 'utf8'});
  if (probe.status !== 0) throw new Error(`CHATGPT_IMAGE_FFPROBE_FAILED:${filePath}:${probe.stderr}`);
  const parsed = JSON.parse(probe.stdout) as {streams?: Array<{width?: number; height?: number}>};
  const width = Number(parsed.streams?.[0]?.width || 0);
  const height = Number(parsed.streams?.[0]?.height || 0);
  if (!width || !height) throw new Error(`CHATGPT_IMAGE_DIMENSIONS_INVALID:${filePath}`);
  return {width, height};
}

export class ChatGptImageAdapter {
  private readonly botDir: string;
  private readonly queuePath: string;
  private readonly manifestPath: string;
  private readonly outputDir: string;

  constructor(customBotDir?: string) {
    this.botDir = path.resolve(customBotDir || path.join(process.cwd(), 'chatgpt-image-bot'));
    this.queuePath = path.join(this.botDir, 'prompts', 'queue.txt');
    this.manifestPath = path.join(this.botDir, 'output', 'manifest.jsonl');
    this.outputDir = path.join(this.botDir, 'output');
  }

  public getBotDirectory(): string {
    return this.botDir;
  }

  public loadCompletedManifestMap(): Map<string, {filepath: string; filename: string}> {
    const map = new Map<string, {filepath: string; filename: string}>();
    if (!fs.existsSync(this.manifestPath)) return map;

    const lines = fs.readFileSync(this.manifestPath, 'utf8').split(/\r?\n/);
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const entry = JSON.parse(line.trim()) as {status?: string; prompt?: string; filepath?: string; filename?: string};
        if (entry.status === 'success' && entry.prompt && entry.filepath && fs.existsSync(entry.filepath)) {
          map.set(entry.prompt.trim(), {filepath: entry.filepath, filename: entry.filename || path.basename(entry.filepath)});
        }
      } catch {
        // Ignora linhas malformatadas
      }
    }
    return map;
  }

  public runGeneratorBot(): void {
    console.log(`[ChatGPTImageAdapter] Executando bot gerador em: ${this.botDir}`);
    const pythonExe = process.platform === 'win32' ? 'python' : 'python3';

    const result = spawnSync(pythonExe, ['-m', 'src.main', '--run'], {
      cwd: this.botDir,
      encoding: 'utf8',
      env: {...process.env, PYTHONUNBUFFERED: '1'}
    });

    if (result.status !== 0) {
      console.warn(`[ChatGPTImageAdapter] Bot de imagens finalizou com código ${result.status}`);
      console.warn(`[ChatGPTImageAdapter] Stderr: ${result.stderr}`);
    } else {
      console.log('[ChatGPTImageAdapter] Geração de imagens no ChatGPT finalizada com sucesso!');
    }
  }

  public processRequests(requests: readonly ChatGptImageRequest[], autoRunBot = true): ChatGptImageBatchResult {
    if (!requests.length) {
      return {
        status: 'CHATGPT_IMAGE_BATCH_SUCCESS',
        totalRequested: 0,
        totalCompleted: 0,
        items: []
      };
    }

    fs.mkdirSync(path.dirname(this.queuePath), {recursive: true});

    // 1. Verifica quais prompts já possuem imagens geradas no manifesto
    let manifestMap = this.loadCompletedManifestMap();
    const pendingRequests = requests.filter(r => !manifestMap.has(r.prompt.trim()));

    // 2. Se houver pendentes, escreve na fila do bot e executa
    if (pendingRequests.length > 0) {
      console.log(`[ChatGPTImageAdapter] Adicionando ${pendingRequests.length} prompts à fila de geração do ChatGPT...`);
      const existingQueue = fs.existsSync(this.queuePath)
        ? fs.readFileSync(this.queuePath, 'utf8').split(/\r?\n/).filter(Boolean)
        : [];

      const newQueueSet = new Set(existingQueue);
      for (const req of pendingRequests) {
        newQueueSet.add(req.prompt.trim());
      }

      fs.writeFileSync(this.queuePath, Array.from(newQueueSet).join('\n') + '\n', 'utf8');

      if (autoRunBot) {
        this.runGeneratorBot();
        manifestMap = this.loadCompletedManifestMap();
      }
    }

    // 3. Processa e copia cada imagem solicitada para seu destino final
    const results: ChatGptImageResultItem[] = [];
    let completedCount = 0;

    for (const req of requests) {
      const match = manifestMap.get(req.prompt.trim());

      if (match && fs.existsSync(match.filepath)) {
        try {
          const dims = imageDimensions(match.filepath);
          const sha = sha256File(match.filepath);
          fs.mkdirSync(path.dirname(req.targetPath), {recursive: true});
          fs.copyFileSync(match.filepath, req.targetPath);
          completedCount += 1;

          results.push({
            id: req.id,
            prompt: req.prompt,
            filename: match.filename,
            filepath: match.filepath,
            sha256: sha,
            width: dims.width,
            height: dims.height,
            copiedTo: req.targetPath,
            status: 'SUCCESS'
          });
        } catch (err) {
          results.push({
            id: req.id,
            prompt: req.prompt,
            filename: match.filename,
            filepath: match.filepath,
            sha256: '',
            width: 0,
            height: 0,
            copiedTo: '',
            status: 'FAILED',
            error: err instanceof Error ? err.message : String(err)
          });
        }
      } else {
        results.push({
          id: req.id,
          prompt: req.prompt,
          filename: '',
          filepath: '',
          sha256: '',
          width: 0,
          height: 0,
          copiedTo: '',
          status: 'FAILED',
          error: 'IMAGEM_NAO_ENCONTRADA_NO_MANIFESTO_CHATGPT'
        });
      }
    }

    const overallStatus = completedCount === requests.length
      ? 'CHATGPT_IMAGE_BATCH_SUCCESS'
      : completedCount > 0
        ? 'CHATGPT_IMAGE_BATCH_PARTIAL'
        : 'CHATGPT_IMAGE_BATCH_FAILED';

    return {
      status: overallStatus,
      totalRequested: requests.length,
      totalCompleted: completedCount,
      items: results
    };
  }
}
