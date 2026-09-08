import path from 'node:path';
import {spawnSync} from 'node:child_process';

// Offline regression entrypoint: fixtures replace external generation and accounts.
const root=path.resolve(__dirname,'..');
if(process.platform==='win32') {
  const result=spawnSync('powershell.exe',['-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-File','graph/production/__tests__/fireflyLogin.test.ps1'],{cwd:root,stdio:'inherit',windowsHide:true});
  if(result.error)throw result.error;
  if(result.status!==0)process.exit(result.status??1);
}
const checks=[
  [require.resolve('typescript/bin/tsc'),'--noEmit'],
  ...['mediaPlan','ledger','fireflyFlow','fireflyAdapter','klingSupervisor','fireflyMedia','renderIdentity','phase2','production','phase25']
    .map(name=>['-r','ts-node/register/transpile-only',`graph/production/__tests__/${name}.test.ts`]),
  ['-r','ts-node/register/transpile-only','graph/console/progress.test.ts'],
];
for(const args of checks){
  const result=spawnSync(process.execPath,args,{cwd:root,stdio:'inherit',windowsHide:true});
  if(result.error)throw result.error;
  if(result.status!==0)process.exit(result.status??1);
}
console.log('FIREFLY_P0_OFFLINE_REGRESSION_OK');
