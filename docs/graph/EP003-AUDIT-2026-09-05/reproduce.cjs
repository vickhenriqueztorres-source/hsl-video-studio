// Isolated reproduction of current code paths; no media generation or provider calls.
require('ts-node/register/transpile-only');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const root = path.resolve(__dirname, '../../..');
const {renderFrameRanges} = require(path.join(root, 'graph/production/lib/remotion.ts'));
const {initialState} = require(path.join(root, 'graph/production/state.ts'));
const {preMuxGate} = require(path.join(root, 'graph/production/nodes/pre_mux_gate.ts'));
const {sfxRender} = require(path.join(root, 'graph/production/nodes/sfx_render.ts'));
const {fireflyGuide} = require(path.join(root, 'graph/production/nodes/firefly_real.ts'));
const {routeRender} = require(path.join(root, 'graph/production/nodes/fan_out_render.ts'));
const {formatCinematic35mmPrompt} = require(path.join(root, 'hsl/startframe/chatgptStartFrameRuntime.ts'));
const {configFor} = require(path.join(root, 'graph/production/runner.ts'));
const plan = JSON.parse(fs.readFileSync(path.join(root, 'runs/HSL_EPISODE_003/scene-plan.json'), 'utf8'));
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'hsl-ep003-audit-'));
const context = {root: scratch, deps: {inspect: file => ({durationSeconds: file.endsWith('.mp3') ? 155.352 : 600, hasAudio: file.endsWith('.mp3'), hasVideo: !file.endsWith('.mp3')}), syncNarration: async()=>({exitCode:1}), closeAssetServer: async()=>{}}};
const state = {...initialState({episodeId:'AUDIT_EP003',targetMinutes:6,graph:{mediaMode:'legacy'}}),scenePlan:plan,preMux:null,frames:[],videos:[],renderChunks:[],visualPrompts:[],timings:[],errors:[]};
(async()=>{
  const ranges = [];
  for (const minutes of [3,6,10,12]) for (const mode of ['legacy','real']) {
    const s = {...state,options:{...state.options,graph:{...state.options.graph,mediaMode:mode}},scenePlan:{...plan,totalFrames:minutes*60*30}};
    const actual = renderFrameRanges(s);
    ranges.push({minutes,mode,ranges:actual,renderedSeconds:actual.reduce((n,[a,b])=>n+b-a+1,0)/30});
  }
  const premux = await preMuxGate(context)(state,{});
  const manifest = JSON.parse(fs.readFileSync(path.join(scratch,'runs/AUDIT_EP003/run-manifest.json'),'utf8'));
  const sfx = await sfxRender(context)(state,{});
  const realState = {...state,options:{...state.options,graph:{...state.options.graph,mediaMode:'real'}},frames:plan.beats.map(b=>({beatId:b.beatId,path:'unused.png'})),visualPrompts:plan.beats.map(b=>({beatId:b.beatId,durationSeconds:b.durationSeconds,firstFrameFrom:'image'}))};
  const guide = fireflyGuide(context)(realState,{});
  const finalPath = path.join(scratch,'out/audit_ep003.mp4');fs.mkdirSync(path.dirname(finalPath),{recursive:true});fs.writeFileSync(finalPath,'stub, never decoded');
  const route = routeRender(context)(state); // Stub inspection accepts old 600s output; no duration match is required.
  const text = plan.beats.map(b=>b.voiceoverScript).join(' ');
  const chunks=[];let current='';for(const sentence of text.split(/(?<=[.?!])\s+/)){if((current+' '+sentence).length>2500){if(current.trim())chunks.push(current.trim());current=sentence;}else current+=(current?' ':'')+sentence;}if(current.trim())chunks.push(current.trim());
  const chunkFiles = ['chunk_000.mp3','chunk_001.mp3','chunk_002.mp3'].map(name=>{const file=path.join(root,'runs/temp_audio_chunks',name);const stat=fs.statSync(file);let probe=null;if(stat.size){const p=spawnSync('ffprobe',['-v','error','-show_entries','format=duration','-of','json',file],{encoding:'utf8',windowsHide:true});probe=JSON.parse(p.stdout);}return{name,size:stat.size,mtime:stat.mtime.toISOString(),probe};});
  const firstPrompt=plan.beats[0].cinematicPrompt;
  const result={scratch,scope:'Dependencies stubbed for pre-mux/render cache probes; source run read only.',ranges,failedSync:{reportedDifference:premux.preMux.durationDiffSeconds,threw:false,stageStatus:manifest.stages.STAGE_08_PRE_MUX_GATE.status},legacySfx:sfx,realModeSamePlan:{takes:guide.videoTakes.length,status:guide.__status},existing600sFinalRoutesTo:route,promptSanitizer:{returnedUnchanged:formatCinematic35mmPrompt(firstPrompt)===firstPrompt,stillContainsTypography:/typograph/i.test(formatCinematic35mmPrompt(firstPrompt))},narrationChunks:{planned:chunks.map((c,index)=>({index,characters:c.length,words:c.split(/\s+/).length})),files:chunkFiles,concatList:fs.readFileSync(path.join(root,'runs/temp_audio_chunks/concat_list.txt'),'utf8')},recursionLimit:configFor('AUDIT_EP003').recursionLimit};
  fs.writeFileSync(path.join(__dirname,'reproduction.json'),JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify(result,null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
