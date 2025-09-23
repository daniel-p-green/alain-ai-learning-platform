#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { fetchText, fetchBuffer, sha256Hex } from './util.js';

const server = new McpServer({ name: 'web-server', version: '0.1.0' });

const makeError = (message) => ({
  isError: true,
  content: [{ type: 'text', text: message }]
});

const makeSuccess = (structuredContent, displayText) => ({
  structuredContent,
  content: [{
    type: 'text',
    text: displayText ?? JSON.stringify(structuredContent, null, 2)
  }]
});

server.registerTool('web_fetch', {
  description: 'Fetch a URL (GET). Respect robots.txt and site TOS. Use for public assets only.',
  inputSchema: {
    url: z.string(),
    as: z.enum(['text', 'buffer']).default('text'),
    max_bytes: z.number().optional()
  }
}, async ({ url, as, max_bytes }) => {
  if (as === 'buffer') {
    const { ok, status, buffer, headers } = await fetchBuffer(url);
    if (!ok) return makeError(`HTTP ${status}`);
    const limited = max_bytes ? buffer.subarray(0, max_bytes) : buffer;
    return makeSuccess({
      status,
      sha256: sha256Hex(limited),
      bytes: max_bytes ? limited.length : buffer.length,
      headers
    });
  }

  const { ok, status, text, headers } = await fetchText(url);
  if (!ok) return makeError(`HTTP ${status}`);
  const limited = typeof max_bytes === 'number' ? text.slice(0, max_bytes) : text;
  return makeSuccess({
    status,
    text: limited,
    sha256: sha256Hex(Buffer.from(limited)),
    headers
  }, limited);
});

await server.connect(new StdioServerTransport());
