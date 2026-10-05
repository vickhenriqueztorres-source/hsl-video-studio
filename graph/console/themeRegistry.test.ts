import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {findDuplicate,nextEpisodeId,reserveTheme,similarity,suggestThemes,themeRecords,dynamicThemes,saveDynamicThemes} from './themeRegistry';
const root=fs.mkdtempSync(path.join(os.tmpdir(),'hsl-theme-')),run=path.join(root,'runs','HSL_EPISODE_011');fs.mkdirSync(run,{recursive:true});
fs.writeFileSync(path.join(run,'scene-plan.json'),JSON.stringify({episodeTitle:'THE HIDDEN SYSTEM THAT KEEPS PLANES FLYING',subtitle:'AIRPORT JET FUEL LOGISTICS',thesis:'The hidden product is synchronized fuel logistics'}));
assert.ok(similarity('logística de combustível de aeroportos','AIRPORT JET FUEL LOGISTICS')>=.6);
assert.equal(findDuplicate('Airport fuel logistics',root)?.record.episodeId,'HSL_EPISODE_011');
assert.ok(!suggestThemes(root,20).some(x=>/airport fuel/i.test(x.theme)));
assert.equal(nextEpisodeId(root),'HSL_EPISODE_012');reserveTheme('HSL_EPISODE_012','Urban water pressure',root);
assert.equal(findDuplicate('pressure in urban water systems',root)?.record.episodeId,'HSL_EPISODE_012');assert.equal(themeRecords(root).length,2);

// BRECHA channel tests & isolation
assert.equal(nextEpisodeId('brecha', root), 'BRECHA_EPISODE_001');
reserveTheme('BRECHA_EPISODE_001', 'Roubaram o celular. O banco foi aberto 8 minutos depois', 'brecha', root);
assert.equal(nextEpisodeId('brecha', root), 'BRECHA_EPISODE_002');
assert.equal(nextEpisodeId('hsl', root), 'HSL_EPISODE_013'); // HSL episode sequence unaffected
assert.equal(findDuplicate('celular roubado e banco', 'brecha', root)?.record.episodeId, 'BRECHA_EPISODE_001');
assert.equal(findDuplicate('celular roubado e banco', 'hsl', root), null); // Isolated from HSL
const brechaIdeas = suggestThemes('brecha', root, 10);
assert.ok(brechaIdeas.length > 0);
assert.ok(!brechaIdeas.some(x => /8 minutos/i.test(x.theme))); // Reserved theme excluded

// Dynamic themes & segment match tests
const testDynamicTheme = {
  theme: 'Nova pauta dinâmica de teste de engenharia extrema',
  title: 'The Extreme Engineering Dynamic Test',
  entity: 'Testing Infrastructure',
  mechanism: 'Automated test suite execution',
  constraint: 'Zero duplicate tolerance',
  consequence: 'System fails if duplicates are allowed',
  thesis: 'Testing guarantees robustness.'
};

const savedCount = saveDynamicThemes([testDynamicTheme], 'hsl', root);
assert.equal(savedCount, 1);
assert.equal(dynamicThemes('hsl', root).length, 1);
const hslSuggestions = suggestThemes('hsl', root, 50);
assert.ok(hslSuggestions.some(t => t.title === 'The Extreme Engineering Dynamic Test'));

// Test segment matching blocks exact title even with extended subtitle/thesis
reserveTheme('HSL_EPISODE_015', 'The Overnight System That Keeps Supermarket Shelves Full · EXTENDED SUBTITLE', 'hsl', root);
const dupMatch = findDuplicate('The Overnight System That Keeps Supermarket Shelves Full · A logística noturna · Entity', 'hsl', root);
assert.ok(dupMatch !== null);
assert.equal(dupMatch?.score, 1);

console.log('THEME_REGISTRY_TEST_OK');
