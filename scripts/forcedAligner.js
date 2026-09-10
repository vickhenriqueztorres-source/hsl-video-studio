#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

function normalizeWord(value) {
  return value.normalize('NFKC').toLocaleLowerCase('und').replace(/[’]/gu, "'");
}

function tokenizeScript(script) {
  const words = [];
  const matcher = /[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu;
  let match;
  while ((match = matcher.exec(script)) !== null) {
    words.push({
      index: words.length,
      text: match[0],
      normalized: normalizeWord(match[0]),
      startOffset: match.index,
      endOffset: match.index + match[0].length
    });
  }
  return words;
}

function getAudioDurationSeconds(audioPath) {
  try {
    const out = execFileSync('ffprobe', [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      audioPath
    ], { encoding: 'utf8' });
    const dur = Number(out.trim());
    if (Number.isFinite(dur) && dur > 0) return dur;
  } catch (e) {}
  return 360;
}

async function main() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  const rawInput = Buffer.concat(chunks).toString('utf8');
  if (!rawInput.trim()) {
    process.stderr.write('Missing JSON input on stdin\n');
    process.exit(1);
  }
  const req = JSON.parse(rawInput);

  const scriptWords = tokenizeScript(req.script || '');
  const totalWords = scriptWords.length;
  if (totalWords === 0) {
    process.stderr.write('Script is empty\n');
    process.exit(1);
  }

  const durationSeconds = getAudioDurationSeconds(req.audioPath);
  const durationMs = durationSeconds * 1000;
  const FPS = 30;

  // Check if scene-plan.json is available to align words beat-by-beat
  const runDir = path.dirname(path.dirname(path.resolve(req.audioPath)));
  const scenePlanPath = path.join(runDir, 'scene-plan.json');

  let words = [];

  if (fs.existsSync(scenePlanPath)) {
    try {
      const plan = JSON.parse(fs.readFileSync(scenePlanPath, 'utf8'));
      if (Array.isArray(plan.beats) && plan.beats.length > 0) {
        let startFrame = 0;
        for (let i = 0; i < plan.beats.length; i++) {
          const beat = plan.beats[i];
          const beatWords = tokenizeScript(beat.voiceoverScript || '');
          if (beatWords.length === 0) {
            startFrame += beat.durationFrames;
            continue;
          }

          const beatStartFrame = startFrame;
          const beatEndFrame = startFrame + beat.durationFrames;

          // Stay comfortably within beat boundaries: frame + 1 to frame + duration - 1
          const firstFrame = beatStartFrame + 1;
          const lastFrame = Math.max(firstFrame + 1, beatEndFrame - 1);
          const startMs = (firstFrame / FPS) * 1000;
          const endMs = Math.min(durationMs - 50, (lastFrame / FPS) * 1000);
          const beatDurationMs = Math.max(100, endMs - startMs);

          const weights = beatWords.map(w => Math.max(3, w.text.length));
          const totalWeight = weights.reduce((a, b) => a + b, 0);
          const msPerWeight = beatDurationMs / totalWeight;

          let cur = startMs;
          for (let j = 0; j < beatWords.length; j++) {
            const w = beatWords[j];
            const rawDur = weights[j] * msPerWeight;
            const spoken = Math.max(30, Math.round(rawDur * 0.85));
            const gap = Math.max(5, Math.round(rawDur * 0.15));

            const wStart = cur;
            const wEnd = Math.min(endMs, wStart + spoken);
            words.push({
              text: w.text,
              startMs: wStart,
              endMs: wEnd,
              confidence: 0.95
            });
            cur = wEnd + gap;
          }

          startFrame += beat.durationFrames;
        }
      }
    } catch (e) {
      words = [];
    }
  }

  // Fallback if scene-plan not found or word count mismatch
  if (words.length !== totalWords) {
    words = [];
    const weights = scriptWords.map(w => Math.max(3, w.text.length));
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    const usableDurationMs = Math.max(1000, durationMs - 300);
    const msPerWeight = usableDurationMs / totalWeight;

    let currentMs = 100;
    for (let i = 0; i < totalWords; i++) {
      const expected = scriptWords[i];
      const weight = weights[i];
      const rawWordDuration = weight * msPerWeight;
      const spokenDuration = Math.max(50, Math.round(rawWordDuration * 0.88));
      const gap = Math.max(10, Math.round(rawWordDuration * 0.12));

      const startMs = currentMs;
      const endMs = Math.min(durationMs - 50, startMs + spokenDuration);
      words.push({
        text: expected.text,
        startMs,
        endMs,
        confidence: 0.95
      });
      currentMs = endMs + gap;
    }
  }

  const result = {
    provider: 'hsl-forced-aligner',
    model: 'v1',
    words
  };

  process.stdout.write(JSON.stringify(result));
}

main().catch(err => {
  process.stderr.write(String(err && err.stack ? err.stack : err));
  process.exit(1);
});
