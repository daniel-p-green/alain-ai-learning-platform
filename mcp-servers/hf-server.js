#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { fetchText, fetchBuffer, sha256Hex } from './util.js';

const HF_TOKEN = process.env.HF_TOKEN || '';

const server = new McpServer({
  name: 'hf-server',
  version: '0.1.0'
});

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

function authHeaders() {
  return HF_TOKEN ? { Authorization: `Bearer ${HF_TOKEN}` } : {};
}

server.registerTool('hf_list_files', {
  description: 'List files in a Hugging Face model repo',
  inputSchema: {
    repo_id: z.string(),
    revision: z.string().optional()
  }
}, async ({ repo_id, revision }) => {
  const url = `https://huggingface.co/api/models/${encodeURIComponent(repo_id)}${revision ? `?revision=${encodeURIComponent(revision)}` : ''}`;
  const { status, ok, text } = await fetchText(url, authHeaders());
  if (!ok) return makeError(`HF API error ${status}`);
  const data = JSON.parse(text);
  const files = (data.siblings || []).map((s) => ({ path: s.rfilename, size: s.size ?? null }));
  return makeSuccess({ files });
});

server.registerTool('hf_get_readme', {
  description: 'Get model card README.md at a specific revision (defaults to main)',
  inputSchema: {
    repo_id: z.string(),
    revision: z.string().optional()
  }
}, async ({ repo_id, revision }) => {
  const rev = revision || 'main';
  const url = `https://huggingface.co/${encodeURIComponent(repo_id)}/resolve/${encodeURIComponent(rev)}/README.md`;
  const { ok, status, text } = await fetchText(url, authHeaders());
  if (!ok) return makeError(`HF resolve error ${status}`);
  const payload = {
    path: 'README.md',
    content: text,
    sha256: sha256Hex(Buffer.from(text))
  };
  return makeSuccess(payload, text);
});

server.registerTool('hf_get_file', {
  description: 'Download a file from a model repo at a given revision',
  inputSchema: {
    repo_id: z.string(),
    path: z.string(),
    revision: z.string().optional(),
    encoding: z.enum(['text', 'base64']).optional()
  }
}, async ({ repo_id, path, revision, encoding }) => {
  const rev = revision || 'main';
  const url = `https://huggingface.co/${encodeURIComponent(repo_id)}/resolve/${encodeURIComponent(rev)}/${path}`;
  const { ok, status, buffer } = await fetchBuffer(url, authHeaders());
  if (!ok) return makeError(`HF resolve error ${status}`);
  const sha = sha256Hex(buffer);
  if (encoding === 'base64') {
    return makeSuccess({ path, content_base64: buffer.toString('base64'), sha256: sha });
  }
  return makeSuccess({ path, content: buffer.toString('utf8'), sha256: sha });
});

await server.connect(new StdioServerTransport());
