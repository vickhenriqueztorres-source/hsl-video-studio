export interface ScriptWordSpan {
  readonly index: number;
  readonly text: string;
  readonly start: number;
  readonly end: number;
  readonly normalized: string;
}

export function normalizeScriptWord(value: string): string {
  return value.toLowerCase().replace(/[^\p{L}\p{N}']+/gu, '');
}

export function tokenizeScriptWords(script: string): readonly ScriptWordSpan[] {
  const words: ScriptWordSpan[] = [];
  const sanitized = (script || '').replace(/<[^>]+>/gu, match => ' '.repeat(match.length));
  const matcher = /\S+/g;
  let match: RegExpExecArray | null;
  while ((match = matcher.exec(sanitized)) !== null) {
    words.push({
      index: words.length,
      text: match[0],
      start: match.index,
      end: match.index + match[0].length,
      normalized: normalizeScriptWord(match[0])
    });
  }
  return words;
}

export function exactScriptSpan(
  script: string,
  words: readonly ScriptWordSpan[],
  startWord: number,
  endWord: number
): string {
  if (startWord < 0 || endWord <= startWord || endWord > words.length) return '';
  return script.slice(words[startWord].start, words[endWord - 1].end);
}
