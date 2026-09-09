export interface ScriptWord {
  readonly index: number;
  readonly text: string;
  readonly normalized: string;
  readonly startOffset: number;
  readonly endOffset: number;
}

export function normalizeWord(value: string): string {
  return value.normalize('NFKC').toLocaleLowerCase('und').replace(/[’]/gu, "'");
}

/** Tokenization is punctuation-independent and keeps offsets into the literal script. */
export function tokenizeScript(script: string): readonly ScriptWord[] {
  const words: ScriptWord[] = [];
  const matcher = /[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu;
  let match: RegExpExecArray | null;
  while ((match = matcher.exec(script)) !== null) {
    words.push({
      index: words.length,
      text: match[0],
      normalized: normalizeWord(match[0]),
      startOffset: match.index,
      endOffset: match.index + match[0].length
    });
  }
  return words;
}

export function literalWordSpan(
  script: string,
  words: readonly ScriptWord[],
  startWord: number,
  endWord: number
): string {
  if (startWord < 0 || endWord <= startWord || endWord > words.length) return '';
  return script.slice(words[startWord].startOffset, words[endWord - 1].endOffset);
}
