import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import Database from 'better-sqlite3';

export const digest = (value: unknown): string => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function hashFile(file: string): string {
  const hash = crypto.createHash('sha256'), fd = fs.openSync(file, 'r'), buffer = Buffer.alloc(1024 * 1024);
  try { for (;;) { const n = fs.readSync(fd, buffer, 0, buffer.length, null); if (!n) break; hash.update(buffer.subarray(0,n)); } }
  finally { fs.closeSync(fd); }
  return hash.digest('hex');
}
export interface KlingBudget {
  kind: 'KLING_BUDGET'; model: 'Kling 2.5 Turbo'; planHash: string; scopeHash: string;
  videoBeats:number; totalTakes:number; reusableTakes:number; requiredGenerations:number; operationIds:string[];
  reconciliationRequired?:number;
}
export interface KlingAuthorization {
  id:string; planHash:string; scopeHash:string; operationIds:string[]; limit:number; approvedAt:string; source:'cli-limit'|'interactive';
}
export interface KlingOperation {
  id:string; authorizationId:string; planHash:string; recipeHash:string; inputHash:string;
  phase:'reserved'|'unstarted'|'submitted'|'uncertain'|'validated'; outputPath:string; outputHash?:string;
  duration?:number; error?:string; updatedAt:string;
}
export class KlingLedger {
  private db: Database.Database;
  constructor(readonly directory: string) {
    fs.mkdirSync(directory,{recursive:true});
    this.db = new Database(path.join(directory,'ledger.sqlite'));
    this.db.pragma('journal_mode = WAL'); this.db.pragma('busy_timeout = 5000');
    this.db.exec('CREATE TABLE IF NOT EXISTS authorizations (id TEXT PRIMARY KEY, scope TEXT UNIQUE NOT NULL, data TEXT NOT NULL); CREATE TABLE IF NOT EXISTS operations (id TEXT PRIMARY KEY, authorization TEXT NOT NULL, data TEXT NOT NULL);');
  }
  close() { this.db.close(); }
  authorization(scope:string):KlingAuthorization|undefined {
    const row=this.db.prepare('SELECT data FROM authorizations WHERE scope=?').get(scope) as {data:string}|undefined;
    return row?JSON.parse(row.data):undefined;
  }
  operation(id:string):KlingOperation|undefined {
    const row=this.db.prepare('SELECT data FROM operations WHERE id=?').get(id) as {data:string}|undefined;
    return row?JSON.parse(row.data):undefined;
  }
  authorize(b:KlingBudget,source:KlingAuthorization['source']):KlingAuthorization {
    if(!Number.isSafeInteger(b.requiredGenerations)||b.requiredGenerations<0||b.requiredGenerations>b.operationIds.length||new Set(b.operationIds).size!==b.operationIds.length)throw new Error('KLING_BUDGET_INVALID');
    return this.db.transaction(()=>{
      const existing=this.authorization(b.scopeHash); if(existing)return existing;
      const a:KlingAuthorization={id:digest(['authorization',b.scopeHash]),scopeHash:b.scopeHash,planHash:b.planHash,
        operationIds:b.operationIds,limit:b.requiredGenerations,source,approvedAt:new Date().toISOString()};
      this.db.prepare('INSERT INTO authorizations(id,scope,data) VALUES(?,?,?)').run(a.id,a.scopeHash,JSON.stringify(a));return a;
    }).immediate();
  }
  reserve(a:KlingAuthorization,operation:Omit<KlingOperation,'authorizationId'|'phase'|'updatedAt'>):{operation:KlingOperation;created:boolean} {
    return this.db.transaction(()=>{
      const stored=this.authorization(a.scopeHash);
      if(!stored||stored.id!==a.id||stored.planHash!==operation.planHash||!stored.operationIds.includes(operation.id))throw new Error('KLING_AUTHORIZATION_SCOPE_MISMATCH');
      const existing=this.operation(operation.id);
      if(existing){
        if(existing.planHash!==operation.planHash||existing.authorizationId!==a.id)throw new Error('KLING_AUTHORIZATION_SCOPE_MISMATCH');
        if(existing.recipeHash!==operation.recipeHash||existing.inputHash!==operation.inputHash||existing.outputPath!==operation.outputPath)throw new Error('KLING_OPERATION_INPUT_CHANGED');return{operation:existing,created:false};
      }
      const count=(this.db.prepare('SELECT COUNT(*) AS n FROM operations WHERE authorization=?').get(a.id) as {n:number}).n;
      if(count>=stored.limit)throw new Error('MAX_GENERATIONS_EXCEEDED');
      const result:KlingOperation={...operation,authorizationId:a.id,phase:'reserved',updatedAt:new Date().toISOString()};
      this.db.prepare('INSERT INTO operations(id,authorization,data) VALUES(?,?,?)').run(result.id,a.id,JSON.stringify(result));
      return{operation:result,created:true};
    }).immediate();
  }
  update(id:string,patch:Partial<Pick<KlingOperation,'phase'|'outputHash'|'duration'|'error'>>):KlingOperation {
    return this.db.transaction(()=>{
      const previous=this.operation(id);if(!previous)throw new Error('KLING_OPERATION_MISSING');
      if(previous.phase==='validated'&&patch.phase&&patch.phase!=='validated')throw new Error('KLING_OPERATION_REGRESSION');
      const next={...previous,...patch,updatedAt:new Date().toISOString()};
      this.db.prepare('UPDATE operations SET data=? WHERE id=?').run(JSON.stringify(next),id);return next;
    }).immediate();
  }
  count():number {return(this.db.prepare('SELECT COUNT(*) AS n FROM operations').get() as {n:number}).n;}
  export():unknown {return{schema:'hsl.kling-ledger.v1',authorizations:(this.db.prepare('SELECT data FROM authorizations ORDER BY id').all() as {data:string}[]).map(x=>JSON.parse(x.data)),operations:(this.db.prepare('SELECT data FROM operations ORDER BY id').all() as {data:string}[]).map(x=>JSON.parse(x.data))};}
}
