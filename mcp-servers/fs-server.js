#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { sha256Hex } from './util.js';

const BASE_DIR = process.env.BASE_DIR || process.cwd();

function safeJoin(base, p) {
  const resolved = path.resolve(base, p);
  if (!resolved.startsWith(path.resolve(base))) {
    throw new Error('Path escapes BASE_DIR');
  }
  return resolved;
}

const server = new McpServer({ name: 'fs-server', version: '0.1.0' });

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

server.registerTool('fs_save_text', {
  description: 'Write a UTF-8 text file under BASE_DIR',
  inputSchema: {
    relative_path: z.string(),
    content: z.string()
  }
}, async ({ relative_path, content }) => {
  try {
    const full = safeJoin(BASE_DIR, relative_path);
    await fs.promises.mkdir(path.dirname(full), { recursive: true });
    await fs.promises.writeFile(full, content, 'utf8');
    const sha = sha256Hex(Buffer.from(content));
    return makeSuccess({ path: full, sha256: sha });
  } catch (error) {
    return makeError(error instanceof Error ? error.message : String(error));
  }
});

server.registerTool('fs_save_base64', {
  description: 'Write a base64-encoded file under BASE_DIR',
  inputSchema: {
    relative_path: z.string(),
    content_base64: z.string()
  }
}, async ({ relative_path, content_base64 }) => {
  try {
    const full = safeJoin(BASE_DIR, relative_path);
    await fs.promises.mkdir(path.dirname(full), { recursive: true });
    const buf = Buffer.from(content_base64, 'base64');
    await fs.promises.writeFile(full, buf);
    const sha = sha256Hex(buf);
    return makeSuccess({ path: full, sha256: sha });
  } catch (error) {
    return makeError(error instanceof Error ? error.message : String(error));
  }
});

await server.connect(new StdioServerTransport());
