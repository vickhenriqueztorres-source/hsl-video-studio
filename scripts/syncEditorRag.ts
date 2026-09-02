import path from 'path';
import {syncEditorRagSnapshot} from '../hsl/editorial/editor/editorRagRuntime';

const defaultSourceRoot = 'C:\\Users\\brend\\OneDrive\\Desktop\\PROJETO 30K ATE 27\\AGENTES - ANTIGRAVITY - HSL\\RAG EDITOR';
const sourceRoot = path.resolve(process.argv[2] || process.env.HSL_EDITOR_RAG_ROOT || defaultSourceRoot);
const outputPath = path.resolve(process.argv[3] || 'assets/editorial-references/editor/editor-rag-index.json');

const snapshot = syncEditorRagSnapshot(sourceRoot, outputPath);

process.stdout.write(`${JSON.stringify({
  status: 'HSL_EDITOR_RAG_SYNCED',
  output_path: outputPath,
  concepts: snapshot.concepts.length,
  total_chunks: snapshot.chunk_receipts.length,
  phrase_fingerprints: snapshot.phrase_fingerprints.length,
  stores_source_prose: snapshot.storage_policy.stores_source_prose
}, null, 2)}\n`);
