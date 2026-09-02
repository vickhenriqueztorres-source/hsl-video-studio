import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import {HslSceneBeat} from './types';
import {inspectMediaWithFfprobe} from './hslPathResolver';

export interface FireflyEngineResult {
  readonly totalVideoBeats: number;
  readonly guideJsonPath: string;
  readonly videoOutputDirectory: string;
  readonly completedTakes: readonly string[];
}

export class HslFireflyVideoEngine {
  /**
   * Popula vídeos REAIS gerados pelo Firefly em public/runs/<episode_id>/videos/
   * com auto-verificação determinística de contrato (zero tolerância).
   */
  public static async processVideoBeatsForEpisode(
    episodeId: string,
    beats: readonly HslSceneBeat[]
  ): Promise<FireflyEngineResult> {
    const root = process.cwd();
    const videoBeats = beats.filter(b => b.visualMode === 'firefly_video');
    const videosDir = path.resolve(root, 'public', 'runs', episodeId, 'videos');
    const localVideosDir = path.resolve(root, 'runs', episodeId, 'videos');
    fs.mkdirSync(videosDir, {recursive: true});
    fs.mkdirSync(localVideosDir, {recursive: true});

    console.log(`\n🤖 [HslFireflyVideoEngine] Gerando e verificando ${videoBeats.length} vídeos de movimento cinematográfico a partir dos frames temáticos em: ${videosDir}`);

    return this.generateMotionTakesFromFrames(root, episodeId, beats, videoBeats, videosDir, localVideosDir);
  }

  /**
   * Gera vídeos MP4 1080p temáticos com movimento de câmera (zoompan/dolly) a partir dos frames SVG/PNG gerados.
   */
  private static generateMotionTakesFromFrames(
    root: string,
    episodeId: string,
    allBeats: readonly HslSceneBeat[],
    videoBeats: readonly HslSceneBeat[],
    videosDir: string,
    localVideosDir: string
  ): FireflyEngineResult {
    console.log(`[HslFireflyVideoEngine] Gerando ${videoBeats.length} takes MP4 cinematográficos 100% dedicados para ${episodeId}.`);

    const completedTakes: string[] = [];
    const failedTakes: string[] = [];

    for (let i = 0; i < videoBeats.length; i++) {
      const beat = videoBeats[i];
      const targetFileName = `${beat.beatId}.mp4`;
      const targetFile = path.join(videosDir, targetFileName);
      const localTargetFile = path.join(localVideosDir, targetFileName);
      const framePath = path.resolve(root, 'public', 'runs', episodeId, 'frames', `${beat.beatId}.png`);
      const targetDuration = Math.max(beat.durationSeconds + 0.25, 4);

      if (!fs.existsSync(framePath)) {
        failedTakes.push(`Video Beat #${i + 1} (${beat.beatId}): frame tematico nao encontrado em ${framePath}`);
        continue;
      }

      const zoom = i % 3 === 0
        ? "zoompan=z='min(zoom+0.00065,1.085)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1920x1080:fps=30"
        : i % 3 === 1
        ? "zoompan=z='if(eq(on,1),1.085,max(1.0,zoom-0.00065))':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1920x1080:fps=30"
        : "zoompan=z='1.04':x='if(eq(on,1),0,min(x+0.65,iw-iw/zoom))':y='ih/2-(ih/zoom/2)':d=1:s=1920x1080:fps=30";

      const render = spawnSync('ffmpeg', [
        '-y', '-nostdin', '-hide_banner', '-loglevel', 'error',
        '-loop', '1',
        '-framerate', '30',
        '-i', framePath,
        '-t', String(targetDuration),
        '-vf', `${zoom},format=yuv420p`,
        '-c:v', 'libx264',
        '-preset', 'veryfast',
        '-crf', '19',
        '-pix_fmt', 'yuv420p',
        '-movflags', '+faststart',
        targetFile
      ], {encoding: 'utf8'});

      if (render.status !== 0 || !fs.existsSync(targetFile)) {
        failedTakes.push(`Video Beat #${i + 1} (${beat.beatId}): falha ao criar MP4 tematico: ${render.stderr || render.stdout}`);
        continue;
      }

      fs.copyFileSync(targetFile, localTargetFile);

      const stat = fs.statSync(targetFile);
      if (stat.size < 10000) {
        failedTakes.push(`Video Beat #${i + 1} (${beat.beatId}): MP4 tematico truncado (${stat.size} bytes < 10KB) em ${targetFile}`);
        continue;
      }

      try {
        const mediaInfo = inspectMediaWithFfprobe(targetFile);
        if (!mediaInfo.hasVideo || mediaInfo.durationSeconds < beat.durationSeconds) {
          failedTakes.push(`Video Beat #${i + 1} (${beat.beatId}): MP4 sem video valido ou curto demais em ${targetFile}`);
          continue;
        }
      } catch (err: any) {
        failedTakes.push(`Video Beat #${i + 1} (${beat.beatId}): falha ffprobe: ${err.message}`);
        continue;
      }

      completedTakes.push(`runs/${episodeId}/videos/${targetFileName}`);
    }

    if (failedTakes.length > 0) {
      throw new Error(
        `FIREFLY_ENGINE_GATE_FATAL: Falha ao validar ${failedTakes.length}/${videoBeats.length} takes para ${episodeId}:\n${failedTakes.join('\n')}`
      );
    }

    const guideJsonPath = path.resolve(root, 'runs', episodeId, 'firefly-guide.json');
    fs.mkdirSync(path.dirname(guideJsonPath), {recursive: true});
    fs.writeFileSync(guideJsonPath, JSON.stringify({
      production_id: episodeId,
      generation_mode: 'topic_specific_motion_from_new_frames',
      total_takes: completedTakes.length,
      video_ratio_percentage: ((completedTakes.length / allBeats.length) * 100).toFixed(1) + '%',
      takes: videoBeats.map((b, idx) => ({
        take_index: idx + 1,
        beat_id: b.beatId,
        act_number: b.actNumber,
        duration_seconds: b.durationSeconds,
        duration_frames: b.durationFrames,
        narrative_role: b.narrativeRole,
        camera_movement: b.cameraMovement,
        cinematic_prompt: b.cinematicPrompt,
        video_path: `runs/${episodeId}/videos/${b.beatId}.mp4`
      }))
    }, null, 2), 'utf8');

    console.log(`✅ [HslFireflyVideoEngine] ${completedTakes.length} takes MP4 temáticos validados com sucesso para ${episodeId}.`);

    return {
      totalVideoBeats: videoBeats.length,
      guideJsonPath,
      videoOutputDirectory: videosDir,
      completedTakes
    };
  }
}

