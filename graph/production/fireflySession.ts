import 'dotenv/config';
import path from 'node:path';
import { REPO_ROOT } from '../checkpointer';
import { fireflyEnvironment, openLoginChrome, probeSession } from './lib/firefly/process';

/** Terminal entrypoint: session only, with no queue ingestion or paid dispatch. */
export async function main(args = process.argv.slice(2)): Promise<number> {
  const command = args[0] ?? 'probe';
  if (args.length > 1 || !['probe','login'].includes(command)) throw new Error('Uso: npm run hsl:firefly:session -- probe|login');
  const environment = fireflyEnvironment();
  const runtime = path.join(REPO_ROOT,'out','firefly-session');
  const logPath = path.join(runtime,'session.log');
  if (command === 'login') {
    const script = path.join(environment.agentDir, 'scripts', 'interactive_login.py');
    const fs = require('fs');
    if (fs.existsSync(script)) {
      const { spawnSync } = require('child_process');
      const res = spawnSync(environment.python, [script], { stdio: 'inherit', env: { ...process.env, FIREFLY_CHROME_PROFILE_DIR: environment.profileDir } });
      return res.status ?? 0;
    }
    await openLoginChrome(environment,logPath);
    console.log('Autentique no Chrome Firefly aberto. Depois execute npm run hsl:firefly:session -- probe ou Continuar episódio no Matrix.');
    return 0;
  }
  const valid = await probeSession(environment,runtime,logPath);
  console.log(JSON.stringify({sessionValid:valid,profileDir:environment.profileDir,generationStarted:false,logPath},null,2));
  if (!valid) console.log('Login necessário: npm run hsl:firefly:session -- login');
  return valid ? 0 : 2;
}
if (require.main === module) main().then(code=>{process.exitCode=code;}).catch(error=>{console.error(error.message);process.exitCode=1;});
