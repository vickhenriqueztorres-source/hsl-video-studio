import path from 'node:path';
import { validateQueue } from '../lib/imageQueue';

function parse(argv:string[]){let queue='',fix=false;for(let i=0;i<argv.length;i++){if(argv[i]==='--fix')fix=true;else if(argv[i]==='--queue'&&argv[i+1])queue=argv[++i];else throw new Error(`Argumento desconhecido: ${argv[i]}`);}if(!queue)throw new Error('Uso: --queue <QUEUE.json> [--fix]');return{queue:path.resolve(queue),fix};}
async function main(){const a=parse(process.argv.slice(2)),r=await validateQueue(a.queue,a.fix);console.table(r.results.map(x=>({beatId:x.beatId,status:x.status,attempts:x.attempts,size:x.width&&x.height?`${x.width}x${x.height}`:'-',error:x.lastError??''})));if(r.queue.items.some(x=>x.status!=='done'))process.exitCode=2;}
if(require.main===module)main().catch(e=>{console.error(e instanceof Error?e.message:e);process.exitCode=1});
