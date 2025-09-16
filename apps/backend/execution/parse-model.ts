import { api, APIError } from "encore.dev/api";

interface ParseResponse {
  success: boolean;
  model?: { org: string; name: string; url: string; card?: any };
  error?: { code: string; message: string };
}

export const parseModel = api<{ hfUrl: string }, ParseResponse>(
  { expose: true, method: "GET", path: "/parse-model" },
  async ({ hfUrl }) => {
    if (!hfUrl) throw APIError.invalidArgument("hfUrl required");
    const urlMatch = hfUrl.match(/huggingface\.co\/([^\/]+)\/([^\/]+)/) || hfUrl.match(/^([^\s\/]+)\/(.+)$/);
    if (!urlMatch) return { success: false, error: { code: "invalid_hf_url", message: "Invalid HF URL or owner/repo" } };
    const org = urlMatch[1];
    const name = urlMatch[2];
    // Strict offline mode: do not attempt to fetch metadata
    const offline = (() => {
      const v = (process.env.OFFLINE_MODE || '').toLowerCase();
      return v === '1' || v === 'true' || v === 'yes' || v === 'on';
    })();
    if (offline) {
      return { success: true, model: { org, name, url: `https://huggingface.co/${org}/${name}` } };
    }
    try {
      const resp = await fetch(`https://huggingface.co/api/models/${org}/${name}`, { headers: { 'User-Agent': 'ALAIN-Parser/1.0' } });
      if (!resp.ok) return { success: true, model: { org, name, url: `https://huggingface.co/${org}/${name}` } };
      const card = await resp.json();
      return { success: true, model: { org, name, url: `https://huggingface.co/${org}/${name}`, card } };
    } catch {
      return { success: true, model: { org, name, url: `https://huggingface.co/${org}/${name}` } };
    }
  }
);
