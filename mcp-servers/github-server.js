#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { fetchText } from './util.js';

const GH_TOKEN = process.env.GITHUB_TOKEN || '';

function ghHeaders() {
  return {
    Accept: 'application/vnd.github+json',
    ...(GH_TOKEN ? { Authorization: `Bearer ${GH_TOKEN}` } : {})
  };
}

const server = new McpServer({ name: 'github-server', version: '0.1.0' });

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

server.registerTool('gh_get_file_at_ref', {
  description: 'Get file content at ref (branch, tag, or SHA)',
  inputSchema: {
    owner: z.string(),
    repo: z.string(),
    path: z.string(),
    ref: z.string()
  }
}, async ({ owner, repo, path, ref }) => {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(ref)}`;
  const { ok, status, text } = await fetchText(url, ghHeaders());
  if (!ok) return makeError(`GitHub API error ${status}`);
  const data = JSON.parse(text);
  if (!data.content) return makeError('No content');
  const buf = Buffer.from(data.content, 'base64');
  const payload = { path, content: buf.toString('utf8'), sha: data.sha };
  return makeSuccess(payload, payload.content);
});

server.registerTool('gh_list_files', {
  description: 'List files under a path at ref',
  inputSchema: {
    owner: z.string(),
    repo: z.string(),
    path: z.string().optional(),
    ref: z.string().optional()
  }
}, async ({ owner, repo, path, ref }) => {
  const p = path || '';
  const branch = ref || 'main';
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(p)}?ref=${encodeURIComponent(branch)}`;
  const { ok, status, text } = await fetchText(url, ghHeaders());
  if (!ok) return makeError(`GitHub API error ${status}`);
  const data = JSON.parse(text);
  const files = Array.isArray(data) ? data.map((entry) => ({ path: entry.path, type: entry.type, size: entry.size })) : [];
  return makeSuccess({ files });
});

server.registerTool('gh_list_releases', {
  description: 'List releases for a repo',
  inputSchema: {
    owner: z.string(),
    repo: z.string()
  }
}, async ({ owner, repo }) => {
  const url = `https://api.github.com/repos/${owner}/${repo}/releases`;
  const { ok, status, text } = await fetchText(url, ghHeaders());
  if (!ok) return makeError(`GitHub API error ${status}`);
  const data = JSON.parse(text);
  const releases = data.map((release) => ({
    tag_name: release.tag_name,
    name: release.name,
    published_at: release.published_at,
    body: release.body ? release.body.slice(0, 4000) : null
  }));
  return makeSuccess({ releases });
});

await server.connect(new StdioServerTransport());
