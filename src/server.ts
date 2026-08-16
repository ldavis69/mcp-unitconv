import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { convert, supportedUnits } from './units.ts';

const server = new Server(
  { name: 'mcp-unitconv', version: '0.1.0' },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'convert',
      description: 'Convert a value between units of length, mass, time or temperature.',
      inputSchema: {
        type: 'object',
        properties: {
          value: { type: 'number', description: 'Numeric value to convert' },
          from: { type: 'string', description: `Source unit, one of: ${supportedUnits().join(', ')}` },
          to: { type: 'string', description: 'Target unit, same dimension as source' },
        },
        required: ['value', 'from', 'to'],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  if (req.params.name !== 'convert') throw new Error(`Unknown tool: ${req.params.name}`);
  const { value, from, to } = req.params.arguments as { value: number; from: string; to: string };
  try {
    const r = convert(value, from, to);
    return { content: [{ type: 'text', text: `${value} ${from} = ${r.value} ${to}` }] };
  } catch (e) {
    return { content: [{ type: 'text', text: `Error: ${(e as Error).message}` }], isError: true };
  }
});

await server.connect(new StdioServerTransport());
