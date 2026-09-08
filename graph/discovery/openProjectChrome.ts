import fs from 'node:fs';
import path from 'node:path';
import { requireSuccess, spawnTool } from '../lib/proc';

const agentRoot = process.env.HSL_FIREFLY_AGENT_DIR
  ?? 'C:\\Users\\brend\\OneDrive\\Desktop\\PROJETO 30K ATE 27\\02 - O OUTRO LADO\\AUTOMACAO - O OUTRO LADO\\agente firefly';
const profile = process.env.HSL_FIREFLY_PROFILE_DIR
  ?? 'D:\\HSL-FIREFLY-PROFILE';
const chromeCandidates = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
];
const chrome = chromeCandidates.find(fs.existsSync);
if (!chrome) throw new Error('PROJECT_CHROME_NOT_FOUND');
fs.mkdirSync(profile, { recursive: true });

const logPath = path.join(__dirname, '..', '..', 'runs', 'phase2-discovery', 'project-chrome.log');
spawnTool(chrome, [
  `--user-data-dir=${profile}`,
  '--new-window',
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-session-crashed-bubble',
  '--hide-crash-restore-bubble',
  'https://firefly.adobe.com/generate/video',
], { cwd: agentRoot, timeoutMs: 43_200_000, logPath })
  .then(result => requireSuccess(result, 'PROJECT_CHROME'))
  .catch(error => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
