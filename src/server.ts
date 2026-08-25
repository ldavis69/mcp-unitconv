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
  const args = req.params.arguments ?? {};
  const { value, from, to } = args as { value: unknown; from: unknown; to: unknown };
  if (typeof value !== 'number') {
    return { content: [{ type: 'text', text: `Error: value must be a number, got ${typeof value}` }], isError: true };
  }
  if (typeof from !== 'string') {
    return { content: [{ type: 'text', text: `Error: from must be a string, got ${typeof from}` }], isError: true };
  }
  if (typeof to !== 'string') {
    return { content: [{ type: 'text', text: `Error: to must be a string, got ${typeof to}` }], isError: true };
  }
  try {
    const r = convert(value, from, to);
    return { content: [{ type: 'text', text: `${value} ${from} = ${r.value} ${to}` }] };
  } catch (e) {
    return { content: [{ type: 'text', text: `Error: ${(e as Error).message}` }], isError: true };
  }
});

await server.connect(new StdioServerTransport());
