import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'

const ROOT = resolve(__dirname, '..')
const PROMPTS_DIR = resolve(ROOT, '../prompts/alain-kit')

function readPrompt(rel: string) {
  const p = resolve(PROMPTS_DIR, rel)
  return readFileSync(p, 'utf8')
}

describe('Harmony prompts (offline) comply with best practices', () => {
  const files = [
    'research.offline.harmony.txt',
    'cache.management.harmony.txt',
    'orchestrator.offline.harmony.txt',
  ] as const

  it('all prompts exist and contain Harmony tokens and role headers', () => {
    for (const f of files) {
      const s = readPrompt(f)
      expect(s).toMatch(/<\|start\|>system<\|message\|>/)
      expect(s).toMatch(/# Valid channels: analysis, commentary, final/)
    }
  })

  it('enforce commentary channel for tools', () => {
    for (const f of files) {
      const s = readPrompt(f)
      expect(s).toMatch(/Calls to these tools must go to the commentary channel: 'functions'/)
    }
  })

  it('require tool-call-only discipline and <|constrain|> json mention', () => {
    const s1 = readPrompt('research.offline.harmony.txt')
    expect(s1).toMatch(/Emit results via a single tool call only: functions\.emit_offline_research/)
    expect(s1).toMatch(/Tool call arguments MUST be JSON and use <\|constrain\|> json/)

    const s2 = readPrompt('cache.management.harmony.txt')
    expect(s2).toMatch(/Emit only a tool call for the requested operation/)
    expect(s2).toMatch(/Tool call arguments MUST be JSON and use <\|constrain\|> json/)

    const s3 = readPrompt('orchestrator.offline.harmony.txt')
    expect(s3).toMatch(/Emit orchestration results via a single tool call only: functions\.orchestrate_offline_workflow/)
    expect(s3).toMatch(/Tool call arguments MUST be JSON and use <\|constrain\|> json/)
  })

  it('mention canonical tool names', () => {
    const s1 = readPrompt('research.offline.harmony.txt')
    expect(s1).toMatch(/function\s+emit_offline_research\(/)

    const s2 = readPrompt('cache.management.harmony.txt')
    // allow either dispatcher or individual tools
    expect(
      /function\s+manage_cache\(|function\s+initialize_model_cache\(/.test(s2)
    ).toBe(true)

    const s3 = readPrompt('orchestrator.offline.harmony.txt')
    expect(s3).toMatch(/function\s+orchestrate_offline_workflow\(/)
  })

  it('standardizes quality targets to 90\+ where applicable', () => {
    const s = readPrompt('research.offline.harmony.txt')
    expect(s).toMatch(/QUALITY SCORE TARGET: 90\+\/100/)
    expect(s).not.toMatch(/QUALITY SCORE TARGET: 95\+\/100/)
  })
})
