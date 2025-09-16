import JSZip from 'jszip'
import { NextResponse } from 'next/server'
import crypto from 'node:crypto'

function detectRequirements(nb: any): string[] {
  const pins: Record<string,string> = {
    'openai': 'openai==1.47.0',
    'python-dotenv': 'python-dotenv==1.0.1',
    'ipywidgets': 'ipywidgets==8.1.2',
    'huggingface_hub': 'huggingface_hub==0.25.2',
    'transformers': 'transformers==4.44.2',
    'llama_cpp': 'llama-cpp-python==0.2.84'
  }
  const found = new Set<string>()
  // Always include core helpers
  found.add('python-dotenv')
  found.add('ipywidgets')

  const cells = Array.isArray(nb?.cells) ? nb.cells : []
  for (const cell of cells) {
    const source = Array.isArray(cell.source) ? cell.source.join('') : (cell.source || '')
    if (cell.cell_type !== 'code') continue
    if (/\bimport\s+openai\b|\bfrom\s+openai\b/.test(source)) found.add('openai')
    if (/\bimport\s+huggingface_hub\b|\bfrom\s+huggingface_hub\b/.test(source)) found.add('huggingface_hub')
    if (/\bimport\s+transformers\b|\bfrom\s+transformers\b/.test(source)) found.add('transformers')
    if (/\bimport\s+llama_cpp\b|\bfrom\s+llama_cpp\b/.test(source)) found.add('llama_cpp')
  }
  return Array.from(found).map(k => pins[k]).filter(Boolean)
}

function buildEnvExample(nb: any): string {
  const lines = [
    'POE_API_KEY=',
    'OPENAI_BASE_URL=https://api.poe.com',
  ]
  const cells = Array.isArray(nb?.cells) ? nb.cells : []
  const text = cells.map((c:any)=>Array.isArray(c.source)?c.source.join(''):c.source||'').join('\n')
  if (/HUGGINGFACE|huggingface_hub/.test(text)) {
    lines.push('HF_TOKEN=')
  }
  return lines.join('\n') + '\n'
}

function buildReadme(title: string): string {
  return `# ${title || 'ALAIN-Kit Notebook'}\n\nQuick start (local):\n\n1. Create and activate a Python 3.10+ environment\n2. Install requirements:\n\n   pip install -r requirements.txt\n\n3. Copy env example and set keys as needed:\n\n   cp .env.example .env\n   # edit .env\n\n4. Launch Jupyter:\n\n   jupyter notebook\n\n5. Open the .ipynb and run the Setup cell first.\n\nColab:\n- Open the .ipynb in Google Colab and run the Setup cell.\n- Use the provided install cell; .env is not required in Colab.\n`}

export async function POST(req: Request) {
  let payload: any
  try { payload = await req.json() } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }) }
  const nb = payload?.notebook
  const filename = (payload?.filename || 'alain-notebook.ipynb').replace(/[^A-Za-z0-9._-]/g, '_')
  if (!nb || !nb.cells) return NextResponse.json({ error: 'notebook_required' }, { status: 400 })

  const zip = new JSZip()
  const nbJson = JSON.stringify(nb, null, 2)
  zip.file(filename, nbJson)
  // Build sidecar manifest mirroring the notebook name
  const sha = crypto.createHash('sha256').update(nbJson).digest('hex')
  const manifestName = filename.replace(/\.ipynb$/i, '') + '.alain.json'
  const manifest = {
    schemaVersion: '1.0.0',
    generatedAt: new Date().toISOString(),
    title: (() => { try { return String(nb?.cells?.[1]?.source?.[0] || '').replace(/^#\s+/, '').trim() } catch { return '' } })(),
    notebookFile: filename,
    integrity: { nbSha256: sha },
    alain: nb?.metadata?.alain || null,
  }
  zip.file(manifestName, JSON.stringify(manifest, null, 2))
  const reqs = detectRequirements(nb)
  zip.file('requirements.txt', reqs.join('\n') + (reqs.length ? '\n' : ''))
  zip.file('.env.example', buildEnvExample(nb))
  const title = (() => {
    try { return String(nb?.cells?.[1]?.source?.[0] || '').replace(/^#\s+/, '').trim() } catch { return '' }
  })()
  zip.file('README.md', buildReadme(title))

  const archiveBuffer = await zip.generateAsync({ type: 'nodebuffer' })
  return new NextResponse(archiveBuffer as any, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="alain-bundle-${Date.now()}.zip"`
    }
  })
}
