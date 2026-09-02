import { createProductionGraph } from './graph';

// The Agent Server owns persistence when this graph is loaded by LangGraph
// Studio. Production CLI runs continue to inject the repository SQLite saver.
export const graph = createProductionGraph();
