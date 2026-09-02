import { HslComplianceChecker } from '../spec/hsl-compliance-checker';

const result = HslComplianceChecker.checkCompliance('HSL_EPISODE_010_KESSLER_SYNDROME');
console.log('ALL PASSED:', result.passed);
console.log('Passed count:', result.passedRules, '/', result.totalRules);
for (const r of result.results) {
  console.log((r.passed ? '✅ ' : '❌ ') + r.ruleId + ': ' + r.name + ' -> ' + r.measured);
}
