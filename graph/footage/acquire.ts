import fs from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { spawnTool } from '../lib/proc';
import type { FfprobeMediaInfo } from '../../hsl/core/hslPathResolver';
import type {
  FootageAcquisitionResult, FootageArtifact, FootageBrief, FootageCandidate,
  FootageOptions, FootageRightsReceipt, FootageVisualReview,
} from './contracts';
import { footageHash } from './planner';
import {allowedFootageUrl,fetchFootageUrl,searchFootageSource} from './sources';
export interface FootageRuntimeDependencies { inspect(file: string): FfprobeMediaInfo }

function sha256(file: string): string {
  const hash = createHash('sha256');
  const fd = fs.openSync(file, 'r'), buffer = Buffer.allocUnsafe(1024 * 1024);
  try { for (;;) { const read = fs.readSync(fd, buffer, 0, buffer.length, null); if (!read) break; hash.update(buffer.subarray(0, read)); } }
  finally { fs.closeSync(fd); }
  return hash.digest('hex');
}

function atomicJson(file: string, value: unknown): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temp = `${file}.${randomUUID()}.tmp`;
  try { fs.writeFileSync(temp, JSON.stringify(value, null, 2), 'utf8'); fs.renameSync(temp, file); }
  finally { if (fs.existsSync(temp)) fs.unlinkSync(temp); }
}

function readJson<T>(file: string): T | undefined {
  try { return JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '')) as T; } catch { return undefined; }
}

async function download(candidateItem: FootageCandidate, target: string, maximumBytes: number): Promise<number> {
  const source = allowedFootageUrl(candidateItem.downloadUrl,candidateItem.source);
  const response = await fetchFootageUrl(source, { headers: { Accept: 'video/*' } },120_000,candidateItem.source);
  if (!response.ok || !response.body) throw new Error(`FOOTAGE_DOWNLOAD_FAILED:${response.status}`);
  allowedFootageUrl(response.url,candidateItem.source);
  const contentType=response.headers.get('content-type')?.toLowerCase()??'';
  if(contentType&&!contentType.includes('video/')&&!['application/ogg','application/octet-stream'].some(value=>contentType.includes(value)))throw new Error(`FOOTAGE_DOWNLOAD_CONTENT_TYPE_INVALID:${contentType}`);
  const declared = Number(response.headers.get('content-length') ?? 0);
  if (declared > maximumBytes) throw new Error('FOOTAGE_DOWNLOAD_BUDGET_EXCEEDED');
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const temp = `${target}.${randomUUID()}.part`;
  const handle = fs.openSync(temp, 'wx');
  let total = 0;
  try {
    const reader = response.body.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maximumBytes) { await reader.cancel(); throw new Error('FOOTAGE_DOWNLOAD_BUDGET_EXCEEDED'); }
      fs.writeSync(handle, value);
    }
    fs.closeSync(handle);
    fs.renameSync(temp, target);
  } catch (error) {
    try { fs.closeSync(handle); } catch {}
    throw error;
  } finally { if (fs.existsSync(temp)) fs.unlinkSync(temp); }
  return total;
}

function rights(candidateItem: FootageCandidate): FootageRightsReceipt {
  if(!candidateItem.commercialUse||!candidateItem.modificationsAllowed)throw new Error(`FOOTAGE_LICENSE_INELIGIBLE:${candidateItem.source}:${candidateItem.externalId}`);
  const sourceLabel={pexels:'Pexels',pixabay:'Pixabay',wikimedia:'Wikimedia Commons',nasa:'NASA',archive:'Internet Archive'}[candidateItem.source];
  return { schema: 'hsl-footage-rights/v1', source: candidateItem.source, externalId: candidateItem.externalId,
    pageUrl: candidateItem.pageUrl, creator: candidateItem.creator, creatorUrl: candidateItem.creatorUrl,
    licenseName: candidateItem.licenseName, licenseUrl: candidateItem.licenseUrl, commercialUse: true,
    modificationsAllowed: true, attributionRequired: candidateItem.attributionRequired,
    creditLine: `Video by ${candidateItem.creator} via ${sourceLabel} — ${candidateItem.pageUrl}`,
    checkedAt: new Date().toISOString(), policyVersion: 'hsl-footage-rights/1', decision: 'eligible' };
}

function validRightsPolicy(receipt:FootageRightsReceipt):boolean{
  if(receipt.source==='pexels')return receipt.licenseName==='Pexels License'&&receipt.licenseUrl==='https://www.pexels.com/license/'&&!receipt.attributionRequired;
  if(receipt.source==='pixabay')return receipt.licenseName==='Pixabay Content License'&&receipt.licenseUrl==='https://pixabay.com/service/license-summary/'&&!receipt.attributionRequired;
  if(receipt.source==='nasa')return receipt.licenseName==='NASA Media Usage Guidelines'&&receipt.licenseUrl==='https://www.nasa.gov/nasa-brand-center/images-and-media/'&&receipt.attributionRequired;
  if(receipt.source==='archive')return /^creative commons attribution|public domain \/ cc0$/i.test(receipt.licenseName)&&/^https:\/\/creativecommons\.org\/(?:licenses\/by\/|publicdomain\/)/i.test(receipt.licenseUrl);
  const license=receipt.licenseUrl.toLowerCase(),name=receipt.licenseName.toLowerCase();
  let licenseHost='';try{licenseHost=new URL(license).hostname;}catch{return false;}
  if(!(licenseHost==='creativecommons.org'||licenseHost.endsWith('.creativecommons.org')||licenseHost==='commons.wikimedia.org'))return false;
  const publicDomain=/public domain|^pd\b|cc0/.test(name)||/creativecommons\.org\/publicdomain|creativecommons\.org\/publicdomain\/zero|commons\.wikimedia\.org\/wiki\/commons:reusing/.test(license);
  const attribution=/^cc[ -]?by(?:[ -]?\d|$)|creative commons attribution/.test(name)||/creativecommons\.org\/licenses\/by\//.test(license);
  return publicDomain||attribution&&receipt.attributionRequired;
}

async function conform(root: string, original: string, output: string, brief: FootageBrief): Promise<void> {
  fs.mkdirSync(path.dirname(output), { recursive: true });
  const temp = path.join(path.dirname(output), `.${path.basename(output, '.mp4')}.${randomUUID()}.mp4`);
  const filter = 'scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,fps=30';
  const result = await spawnTool('ffmpeg', ['-y','-v','error','-i',original,'-t',brief.durationSeconds.toFixed(6),
    '-an','-vf',filter,'-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',temp],
    { cwd: root, timeoutMs: 20 * 60_000 });
  if (result.exitCode !== 0 || result.timedOut || result.errorCode || !fs.existsSync(temp)) {
    if (fs.existsSync(temp)) fs.unlinkSync(temp);
    throw new Error(`FOOTAGE_CONFORM_FAILED:${result.stderr || result.errorCode || result.exitCode}`);
  }
  try { fs.renameSync(temp, output); } finally { if (fs.existsSync(temp)) fs.unlinkSync(temp); }
}

export async function buildFootageContactSheet(root:string,artifact:FootageArtifact):Promise<string>{
  const target=path.join(path.dirname(path.dirname(artifact.videoPath)),'footage','qa',artifact.beatId,'contact-sheet.png');
  fs.mkdirSync(path.dirname(target),{recursive:true});
  const interval=Math.max(0.1,artifact.durationSeconds/3);
  const result=await spawnTool('ffmpeg',['-y','-v','error','-i',artifact.videoPath,'-vf',`fps=1/${interval.toFixed(6)},scale=640:360,tile=3x1`,'-frames:v','1',target],{cwd:root,timeoutMs:120_000});
  if(result.exitCode!==0||result.timedOut||result.errorCode||!fs.existsSync(target))throw new Error(`FOOTAGE_CONTACT_SHEET_FAILED:${result.stderr||result.errorCode||result.exitCode}`);
  return target;
}

export function validateFootageArtifact(root: string, artifact: FootageArtifact, deps: FootageRuntimeDependencies, requireEditorialApproval = true): void {
  const files = [artifact.originalPath, artifact.videoPath, artifact.provenancePath, artifact.rightsReceiptPath, artifact.recipePath,
    ...(requireEditorialApproval && artifact.visualReviewPath ? [artifact.visualReviewPath] : [])];
  const base = path.resolve(root), outside = files.find(file => {
    const relative = path.relative(base, path.resolve(file));
    return !relative || relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative);
  });
  if (outside || files.some(file => !fs.existsSync(file))) throw new Error(`FOOTAGE_ARTIFACT_MISSING:${artifact.beatId}`);
  const receipt = readJson<FootageRightsReceipt>(artifact.rightsReceiptPath);
  const provenance=readJson<FootageArtifact>(artifact.provenancePath);
  const recipe=readJson<{originalSha256?:string;durationFrames?:number;fps?:number;width?:number;height?:number;audio?:string}>(artifact.recipePath);
  if (artifact.provider !== 'licensed-footage' || artifact.rightsStatus !== 'approved' || artifact.source!==receipt?.source
    || (requireEditorialApproval && (artifact.editorialStatus !== 'approved' || !artifact.visualReviewPath))
    || artifact.technicalStatus !== 'approved' || receipt?.decision !== 'eligible' || !validRightsPolicy(receipt)
    || receipt.commercialUse !== true || receipt.modificationsAllowed !== true || !receipt.creditLine
    || receipt.externalId !== artifact.externalId || receipt.pageUrl !== artifact.sourcePageUrl
    || receipt.creditLine !== artifact.creditLine) throw new Error(`FOOTAGE_RIGHTS_INVALID:${artifact.beatId}`);
  allowedFootageUrl(receipt.pageUrl,receipt.source);allowedFootageUrl(receipt.creatorUrl,receipt.source);
  if (sha256(artifact.originalPath) !== artifact.originalSha256 || sha256(artifact.videoPath) !== artifact.videoSha256) throw new Error(`FOOTAGE_HASH_INVALID:${artifact.beatId}`);
  if(!provenance||provenance.beatId!==artifact.beatId||provenance.externalId!==artifact.externalId||provenance.originalSha256!==artifact.originalSha256
    ||provenance.videoSha256!==artifact.videoSha256||provenance.rightsReceiptPath!==artifact.rightsReceiptPath||provenance.recipePath!==artifact.recipePath
    ||provenance.editorialStatus!==artifact.editorialStatus)throw new Error(`FOOTAGE_PROVENANCE_INVALID:${artifact.beatId}`);
  if(!recipe||recipe.originalSha256!==artifact.originalSha256||recipe.durationFrames!==artifact.durationFrames||recipe.fps!==30||recipe.width!==1920||recipe.height!==1080||recipe.audio!=='removed')throw new Error(`FOOTAGE_RECIPE_INVALID:${artifact.beatId}`);
  if(requireEditorialApproval){
    const review=readJson<FootageVisualReview>(artifact.visualReviewPath!);
    if(!review||review.schema!=='hsl-footage-visual-review/v1'||review.beatId!==artifact.beatId||review.artifactSha256!==artifact.videoSha256
      ||review.approved!==true||review.score<75||!review.showsRealCameraFootage||!review.semanticallyMatches||review.textOrWatermark||review.misleadingSpecificity)throw new Error(`FOOTAGE_VISUAL_REVIEW_INVALID:${artifact.beatId}`);
  }
  const info = deps.inspect(artifact.videoPath);
  if (!info.hasVideo || info.hasAudio || info.width !== 1920 || info.height !== 1080 || Math.abs(info.durationSeconds - artifact.durationSeconds) > 0.2) {
    throw new Error(`FOOTAGE_TECHNICAL_INVALID:${artifact.beatId}`);
  }
}

export async function acquireFootage(
  root: string, episodeId: string, briefs: readonly FootageBrief[], options: FootageOptions,
  deps: FootageRuntimeDependencies,
): Promise<FootageAcquisitionResult> {
  const folder = path.join(root, 'runs', episodeId, 'footage');
  const candidatesPath = path.join(folder, 'candidates.json'), manifestPath = path.join(folder, 'footage-manifest.json');
  const inputHash=footageHash({episodeId,briefs,options,credentials:{pexels:!!process.env.PEXELS_API_KEY?.trim(),pixabay:!!process.env.PIXABAY_API_KEY?.trim()}});
  const cached = readJson<{ inputHash?:string;generatedAt?:string; artifacts?: FootageArtifact[]; failures?: Array<{beatId:string;reason:string}> }>(manifestPath);
  if (cached?.inputHash===inputHash) {
    if(cached.artifacts?.length){
      try {
        for (const artifact of cached.artifacts) validateFootageArtifact(root, artifact, deps, false);
        return { artifacts: cached.artifacts, failures: cached.failures ?? [], candidatesPath, manifestPath };
      } catch { /* Stale or incomplete cache is rebuilt below. */ }
    }else if(cached.generatedAt&&Date.now()-Date.parse(cached.generatedAt)<24*60*60*1000){
      return{artifacts:[],failures:cached.failures??[],candidatesPath,manifestPath};
    }
  }
  if (!briefs.length || options.mode !== 'auto') {
    const empty = { artifacts: [], failures: [], candidatesPath, manifestPath };
    atomicJson(candidatesPath, { schema: 'hsl-footage-candidates/v1', inputHash, items: [] });
    atomicJson(manifestPath, { schema: 'hsl-footage-manifest/v1', inputHash, ...empty,generatedAt:new Date().toISOString() });
    return empty;
  }
  const allCandidates: Array<{beatId:string;items:FootageCandidate[];sourceErrors:Array<{source:string;reason:string}>}> = [], artifacts: FootageArtifact[] = [];
  const failures: Array<{beatId:string;reason:string}> = [];
  let requests = 0, downloadedBytes = 0;
  for (const brief of briefs) {
    try {
      let found: FootageCandidate[] = [];
      const sourceErrors:Array<{source:string;reason:string}>=[];
      const unavailableSources=new Set<string>();
      for (const query of brief.queries) {
        for(const source of options.sources){
          if(unavailableSources.has(source))continue;
          if (++requests > options.maxSearchRequestsPerEpisode) throw new Error('FOOTAGE_SEARCH_BUDGET_EXCEEDED');
          try{found.push(...await searchFootageSource(source,query,brief.durationSeconds,options.maxCandidatesPerBeat));}
          catch(error){const reason=error instanceof Error?error.message:String(error);sourceErrors.push({source,reason});if(reason.endsWith('_API_KEY_REQUIRED'))unavailableSources.add(source);}
        }
      }
      const unique=[...new Map(found.map(item => [`${item.source}:${item.externalId}`, item])).values()];
      found=[];
      for(let rank=0;found.length<options.maxCandidatesPerBeat;rank++){
        let added=false;
        for(const source of options.sources){const item=unique.filter(candidate=>candidate.source===source)[rank];if(item){found.push(item);added=true;if(found.length===options.maxCandidatesPerBeat)break;}}
        if(!added)break;
      }
      allCandidates.push({ beatId: brief.beatId, items: found,sourceErrors });
      let completed: FootageArtifact | undefined, lastError = sourceErrors.length&&!found.length
        ?sourceErrors.length===1?sourceErrors[0].reason:`FOOTAGE_SOURCES_UNAVAILABLE:${sourceErrors.map(item=>`${item.source}=${item.reason}`).join('|')}`
        :'FOOTAGE_NO_SUITABLE_CANDIDATE';
      for (const item of found.slice(0, options.maxDownloadsPerBeat)) {
        const safeId=item.externalId.replace(/[^A-Za-z0-9_.-]/g,'_');
        const assetFolder = path.join(folder, 'assets', `${item.source}-${safeId}`);
        const original = path.join(assetFolder, 'original.mp4');
        const remaining = options.maxDownloadBytesPerEpisode - downloadedBytes;
        if (remaining < 1) throw new Error('FOOTAGE_DOWNLOAD_BUDGET_EXCEEDED');
        try {
          if (fs.existsSync(original)) {
            try {
              const cachedInfo = deps.inspect(original);
              if (!cachedInfo.hasVideo || cachedInfo.durationSeconds + 0.05 < brief.durationSeconds) fs.unlinkSync(original);
            } catch { fs.unlinkSync(original); }
          }
          if (!fs.existsSync(original)) downloadedBytes += await download(item, original, remaining);
          const sourceInfo = deps.inspect(original);
          if (!sourceInfo.hasVideo || sourceInfo.durationSeconds + 0.05 < brief.durationSeconds) throw new Error('FOOTAGE_SOURCE_TOO_SHORT_OR_INVALID');
          const rightsReceipt = rights(item), rightsPath = path.join(assetFolder, 'license-evidence.json');
          atomicJson(path.join(assetFolder, 'source.json'), { candidate: item, apiMetadataHash: footageHash(item), capturedAt: new Date().toISOString() });
          atomicJson(rightsPath, rightsReceipt);
          const output = path.join(root, 'runs', episodeId, 'videos', `${brief.beatId}.mp4`);
          await conform(root, original, output, brief);
          const recipePath = path.join(folder, 'conform', `${brief.beatId}.recipe.json`);
          atomicJson(recipePath, { schema: 'hsl-footage-conform/v1', originalSha256: sha256(original),
            sourceStartSeconds: 0, durationFrames: brief.durationFrames, fps: 30, width: 1920, height: 1080,
            audio: 'removed', fit: 'cover-center', filter: 'scale+crop+fps', encoder: 'libx264/crf18' });
          const provenancePath = `${output}.provenance.json`;
          const candidateArtifact:FootageArtifact = { schema: 'hsl-footage-artifact/v1', beatId: brief.beatId, sourceBeatId: brief.sourceBeatId,
            provider: 'licensed-footage', source: item.source, externalId: item.externalId, sourcePageUrl: item.pageUrl,
            originalPath: original, originalSha256: sha256(original), videoPath: output, videoSha256: sha256(output),
            provenancePath, rightsReceiptPath: rightsPath, recipePath, durationFrames: brief.durationFrames,
            durationSeconds: brief.durationSeconds, width: 1920, height: 1080, fps: 30,
            rightsStatus: 'approved', editorialStatus: 'pending', technicalStatus: 'approved', creditLine: rightsReceipt.creditLine };
          atomicJson(provenancePath, candidateArtifact);
          validateFootageArtifact(root, candidateArtifact, deps, false);
          const publicPath = path.join(root, 'public', 'runs', episodeId, 'videos', `${brief.beatId}.mp4`);
          fs.mkdirSync(path.dirname(publicPath), { recursive: true }); fs.copyFileSync(output, publicPath);
          completed=candidateArtifact;
          break;
        } catch (error) { lastError = error instanceof Error ? error.message : String(error); }
      }
      if (completed) artifacts.push(completed); else failures.push({ beatId: brief.beatId, reason: lastError });
    } catch (error) { failures.push({ beatId: brief.beatId, reason: error instanceof Error ? error.message : String(error) }); }
  }
  atomicJson(candidatesPath, { schema: 'hsl-footage-candidates/v1', inputHash, items: allCandidates, requests, downloadedBytes });
  const result = { artifacts, failures, candidatesPath, manifestPath };
  atomicJson(manifestPath, { schema: 'hsl-footage-manifest/v1', inputHash, ...result, generatedAt: new Date().toISOString() });
  return result;
}
