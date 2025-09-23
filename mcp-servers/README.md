# ALAIN MCP Servers (local)

This folder provides minimal MCP (Model Context Protocol) servers for research tooling, designed to plug into LM Studio (OpenAI‑compatible) via MCP stdio.

Servers included
- hf-server.js — Hugging Face Hub: list files, fetch files at revision, get README
- github-server.js — GitHub: get file at ref/SHA, list files, list releases
- arxiv-server.js — arXiv: search papers, get PDF links
- web-server.js — Generic HTTP fetch (use responsibly, respect robots.txt)
- fs-server.js — Filesystem writer (restricted to BASE_DIR)

Quick start
1) Install deps (Node 18+):
   npm install
2) Run a server (example):
   node hf-server.js
3) Point LM Studio mcp.json to the server using stdio (see examples below).

LM Studio mcp.json (stdio examples)
{
  "mcpServers": {
    "hf-local": {
      "command": "node",
      "args": ["/absolute/path/to/alain-ai-learning-platform/mcp-servers/hf-server.js"],
      "env": { "HF_TOKEN": "YOUR_HF_TOKEN" }
    },
    "github-local": {
      "command": "node",
      "args": ["/absolute/path/to/alain-ai-learning-platform/mcp-servers/github-server.js"],
      "env": { "GITHUB_TOKEN": "YOUR_GH_TOKEN" }
    },
    "arxiv-local": {
      "command": "node",
      "args": ["/absolute/path/to/alain-ai-learning-platform/mcp-servers/arxiv-server.js"]
    },
    "web-local": {
      "command": "node",
      "args": ["/absolute/path/to/alain-ai-learning-platform/mcp-servers/web-server.js"]
    },
    "fs-local": {
      "command": "node",
      "args": ["/absolute/path/to/alain-ai-learning-platform/mcp-servers/fs-server.js"],
      "env": { "BASE_DIR": "/absolute/path/where/writes/are/allowed" }
    }
  }
}

Notes
- Use environment variables for credentials; avoid hard‑coding secrets.
- These servers use stdio transport via @modelcontextprotocol/sdk; LM Studio should manage their lifecycle.
- If your LM Studio only supports HTTP MCP servers, let me know — I can provide an Express‑based HTTP MCP bridge, but stdio is the recommended/default transport for MCP.
