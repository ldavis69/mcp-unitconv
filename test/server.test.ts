import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const serverPath = fileURLToPath(new URL('../src/server.ts', import.meta.url));

// Drives the real server over stdio (child process + JSON-RPC) rather than
// calling into src/units.ts, so this catches wiring bugs the unit tests can't.
async function withClient(fn: (client: Client) => Promise<void>) {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [serverPath],
  });
  const client = new Client({ name: 'mcp-unitconv-test-client', version: '0.1.0' });
  await client.connect(transport);
  try {
    await fn(client);
  } finally {
    await client.close();
  }
}

test('lists the convert tool', async () => {
  await withClient(async (client) => {
    const { tools } = await client.listTools();
    assert.equal(tools.length, 1);
    assert.equal(tools[0].name, 'convert');
    assert.equal(tools[0].inputSchema.required?.length, 3);
  });
});

test('converts a value over stdio', async () => {
  await withClient(async (client) => {
    const result = await client.callTool({
      name: 'convert',
      arguments: { value: 1, from: 'km', to: 'm' },
    });
    assert.notEqual(result.isError, true);
    const content = result.content as Array<{ type: string; text: string }>;
    assert.equal(content[0].text, '1 km = 1000 m');
  });
});

test('reports a tool error for mismatched dimensions', async () => {
  await withClient(async (client) => {
    const result = await client.callTool({
      name: 'convert',
      arguments: { value: 1, from: 'km', to: 'kg' },
    });
    assert.equal(result.isError, true);
  });
});

test('reports a tool error for a non-numeric value', async () => {
  await withClient(async (client) => {
    const result = await client.callTool({
      name: 'convert',
      arguments: { value: 'one', from: 'km', to: 'm' },
    });
    assert.equal(result.isError, true);
    const content = result.content as Array<{ type: string; text: string }>;
    assert.match(content[0].text, /value must be a number/);
  });
});

test('rejects a call to an unknown tool', async () => {
  await withClient(async (client) => {
    await assert.rejects(() => client.callTool({ name: 'nope', arguments: {} }));
  });
});
