import { NextResponse } from 'next/server'

// Minimal SSE route sketch for outline-first streaming.
// Streams: phase updates, each section title on completion, and final assembly.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const model = searchParams.get('model') || 'gpt-oss-20b'
  const difficulty = (searchParams.get('difficulty') || 'beginner') as 'beginner'|'intermediate'|'advanced'
  const maxSections = Number(searchParams.get('maxSections') || '8')

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: any) => {
        controller.enqueue(new TextEncoder().encode(`event: ${event}\n`))
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`))
      }
      try {
        send('status', { phase: 'start', model, difficulty })

        // Lazy-import ALAIN-Kit to avoid web bundling issues
        const { OutlineGenerator } = await import('../../../../../../alain-kit/core/outline-generator')
        const { SectionGenerator } = await import('../../../../../../alain-kit/core/section-generator')
        const { NotebookBuilder } = await import('../../../../../../alain-kit/core/notebook-builder')

        const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.poe.com'
        const apiKey = process.env.POE_API_KEY

        const outlineGen = new OutlineGenerator({ baseUrl })
        const sectionGen = new SectionGenerator({ baseUrl })
        const builder = new NotebookBuilder()

        // Phase A: Outline
        send('status', { phase: 'outline.start' })
        const outline = await outlineGen.generateOutline({ model, apiKey, difficulty })
        send('status', { phase: 'outline.done', steps: outline.outline?.length || 0, title: outline.title })

        // Phase B: Sections (stream after each section)
        const sections: any[] = []
        const total = Math.min(maxSections, outline.outline?.length || 0)
        for (let i = 1; i <= total; i++) {
          send('status', { phase: 'section.start', index: i, of: total, h2: outline.outline[i-1]?.title || `Step ${i}` })
          const sec = await sectionGen.generateSection({ outline, sectionNumber: i, previousSections: sections as any, modelReference: model, apiKey })
          sections.push(sec)
          send('status', { phase: 'section.done', index: i, title: sec.title })
        }

        // Phase C: Assembly
        send('status', { phase: 'assemble.start' })
        const notebook = builder.buildNotebook(outline as any, sections as any)
        send('complete', { notebook })
        controller.close()
      } catch (err: any) {
        const message = err?.message || String(err)
        controller.enqueue(new TextEncoder().encode(`event: error\n`))
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ error: message })}\n\n`))
        controller.close()
      }
    }
  })

  return new NextResponse(stream as any, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Transfer-Encoding': 'chunked'
    }
  })
}
