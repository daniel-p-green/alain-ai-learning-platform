#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { fetchText } from './util.js';

const server = new McpServer({ name: 'arxiv-server', version: '0.1.0' });

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

server.registerTool('arxiv_search', {
  description: 'Search arXiv by free-text query',
  inputSchema: {
    query: z.string(),
    max_results: z.number().default(5)
  }
}, async ({ query, max_results }) => {
  const url = `http://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(query)}&start=0&max_results=${max_results}`;
  const { ok, status, text } = await fetchText(url);
  if (!ok) return makeError(`arXiv API error ${status}`);
  const entries = [];
  const parts = text.split('<entry>').slice(1);
  for (const p of parts) {
    const id = (p.match(/<id>([^<]+)<\/id>/) || [])[1];
    const title = ((p.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '').trim();
    const published = (p.match(/<published>([^<]+)<\/published>/) || [])[1];
    const pdf = (p.match(/href="([^"]+)"[^>]*rel="related"[^>]*type="application\/pdf"/) || [])[1];
    entries.push({ id, title, published, pdf_url: pdf || null });
  }
  return makeSuccess({ entries });
});

await server.connect(new StdioServerTransport());
