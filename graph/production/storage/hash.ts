import fs from 'node:fs';
import { createHash } from 'node:crypto';

export function md5File(file:string):Promise<string>{
  return new Promise((resolve,reject)=>{
    const hash=createHash('md5'),stream=fs.createReadStream(file);
    stream.on('data',chunk=>hash.update(chunk));stream.on('error',reject);stream.on('end',()=>resolve(hash.digest('hex')));
  });
}
