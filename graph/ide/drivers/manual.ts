import path from 'node:path';
import { interrupt } from '@langchain/langgraph';
import { DriverResult, PreparedTask } from '../types';

export function runManual(prepared: PreparedTask, reason?: string): DriverResult {
  // Do not catch GraphInterrupt: it is LangGraph control flow, not an IDE error.
  const answer = interrupt({
    kind: 'IDE_MANUAL', provider: prepared.task.provider, node: prepared.task.node,
    promptPath: prepared.promptPath, outputPath: prepared.outputPath, schemaPath: prepared.schemaPath,
    reason,
    instructions: 'Leia prompt.md, escreva output.json conforme schema.json e execute --resume ' + prepared.task.threadId,
  }) as { outputPath?: string } | undefined;
  if (answer?.outputPath !== undefined && typeof answer.outputPath !== 'string') {
    return { reason: 'O outputPath informado no resume deve ser uma string.' };
  }
  return { outputPath: answer?.outputPath ? path.resolve(prepared.repoRoot, answer.outputPath) : prepared.outputPath };
}
