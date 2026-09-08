import fs from 'node:fs';
import path from 'node:path';
import {hashFile} from './ledger';

export interface FireflyRepairReceipt {
  schema:'hsl.firefly-qa-repair.v1';
  operationId:string;
  sourcePath:string;
  sourceHash:string;
  outputPath:string;
  outputHash:string;
  transform:{kind:'trim-retime'|'terminal-state-loop';cleanEndSeconds:number;targetSeconds:number;fps:number;codec:'h264'};
  qaEvidencePath:string;
  qaEvidenceHash:string;
  createdAt:string;
}

export const repairReceiptPath=(runtime:string)=>path.join(runtime,'qa-repair.json');

function inside(parent:string,file:string):boolean {
  const relative=path.relative(path.resolve(parent),path.resolve(file));
  return relative!==''&&!relative.startsWith('..'+path.sep)&&!path.isAbsolute(relative);
}

/** A QA repair is a derived provider artifact, never a replacement for transport evidence. */
export function resolveFireflyArtifact(runtime:string,operationId:string,sourcePath:string,sourceHash:string):{path:string;receipt?:FireflyRepairReceipt;receiptHash?:string} {
  runtime=path.resolve(runtime);sourcePath=path.resolve(sourcePath);
  const receiptPath=repairReceiptPath(runtime);
  if(!fs.existsSync(receiptPath))return{path:sourcePath};
  let receipt:FireflyRepairReceipt;
  try{receipt=JSON.parse(fs.readFileSync(receiptPath,'utf8')) as FireflyRepairReceipt;}catch{throw new Error('FIREFLY_REPAIR_RECEIPT_INVALID:unreadable');}
  const outputPath=path.resolve(receipt.outputPath??''),evidencePath=path.resolve(receipt.qaEvidencePath??'');
  const transform=receipt.transform;
  if(receipt.schema!=='hsl.firefly-qa-repair.v1'||receipt.operationId!==operationId
    ||path.resolve(receipt.sourcePath??'')!==sourcePath||receipt.sourceHash!==sourceHash
    ||!inside(path.join(runtime,'repair'),outputPath)||!inside(path.join(runtime,'repair','qa'),evidencePath)
    ||!['trim-retime','terminal-state-loop'].includes(transform?.kind)||!(transform.cleanEndSeconds>0)||!(transform.targetSeconds>0)
    ||transform.fps!==30||transform.codec!=='h264')throw new Error('FIREFLY_REPAIR_RECEIPT_INVALID:identity');
  if(!fs.existsSync(sourcePath)||hashFile(sourcePath)!==sourceHash)throw new Error('FIREFLY_REPAIR_SOURCE_CHANGED');
  if(!fs.existsSync(outputPath)||hashFile(outputPath)!==receipt.outputHash)throw new Error('FIREFLY_REPAIR_OUTPUT_CHANGED');
  if(!fs.existsSync(evidencePath)||hashFile(evidencePath)!==receipt.qaEvidenceHash)throw new Error('FIREFLY_REPAIR_QA_CHANGED');
  const evidence=JSON.parse(fs.readFileSync(evidencePath,'utf8')) as {passed?:boolean;videoPath?:string;semantic?:{status?:string}};
  if(evidence.passed!==true||evidence.semantic?.status!=='passed'||path.resolve(evidence.videoPath??'')!==outputPath)throw new Error('FIREFLY_REPAIR_QA_INVALID');
  return{path:outputPath,receipt,receiptHash:hashFile(receiptPath)};
}
