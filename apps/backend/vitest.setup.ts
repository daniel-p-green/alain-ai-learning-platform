import { vi } from 'vitest';

// Stub Encore API to avoid native runtime during tests
vi.mock('encore.dev/api', () => {
  class APIError extends Error {
    code: string;
    constructor(message: string, code = 'unknown') { super(message); this.code = code; }
    static invalidArgument(msg: string) { return new APIError(msg, 'invalid_argument'); }
    static failedPrecondition(msg: string) { return new APIError(msg, 'failed_precondition'); }
    static unauthenticated(msg: string) { return new APIError(msg, 'unauthenticated'); }
    static notFound(msg: string) { return new APIError(msg, 'not_found'); }
    static resourceExhausted(msg: string) { return new APIError(msg, 'resource_exhausted'); }
    static deadlineExceeded(msg: string) { return new APIError(msg, 'deadline_exceeded'); }
    static alreadyExists(msg: string) { return new APIError(msg, 'already_exists'); }
    static internal(msg: string) { return new APIError(msg, 'internal'); }
  }
  return {
    APIError,
    api: (_opts: any, handler: any) => handler,
  };
});

// Stub Encore config secrets
vi.mock('encore.dev/config', () => ({
  secret: (_: string) => () => '',
}));

// Stub Encore service to avoid initializing runtime during tests
vi.mock('encore.dev/service', () => {
  class Service {
    name: string;
    opts: any;
    constructor(name: string, opts?: any) {
      this.name = name;
      this.opts = opts || {};
    }
  }
  return { Service };
});

// Very lightweight in-memory SQLDatabase stub to support tutorial tests
vi.mock('encore.dev/storage/sqldb', () => {
  type Row = Record<string, any>;

  class Tx {
    private db: MemDB;
    private ops: (() => void)[] = [];
    constructor(db: MemDB) { this.db = db; }
    async exec(strings: TemplateStringsArray, ...values: any[]) { this.ops.push(() => this.db.exec(strings, ...values)); }
    async queryRow<T=Row>(strings: TemplateStringsArray, ...values: any[]): Promise<T | undefined> { return this.db.queryRow(strings, ...values); }
    async queryAll<T=Row>(strings: TemplateStringsArray, ...values: any[]): Promise<T[]> { return this.db.queryAll(strings, ...values); }
    query<T=Row>(strings: TemplateStringsArray, ...values: any[]): AsyncIterable<T> {
      const promise = this.db.queryAll<T>(strings, ...values);
      async function* iter() { for (const r of await promise) yield r; }
      return iter();
    }
    async commit() { this.ops.forEach(fn => fn()); this.ops = []; }
    async rollback() { this.ops = []; }
  }

  class MemDB {
    private seq: Record<string, number> = { tutorials: 1, tutorial_steps: 1, user_progress: 1, assessments: 1 };
    tutorials: Row[] = [];
    tutorial_steps: Row[] = [];
    user_progress: Row[] = [];
    assessments: Row[] = [];

    next(table: string) { return this.seq[table]++; }

    async begin() { return new Tx(this); }

    async exec(strings: TemplateStringsArray, ...values: any[]) {
      const sql = joinSQL(strings, values);
      // Minimal INSERT handlers
      if (/^\s*INSERT INTO tutorials /i.test(sql)) {
        const id = this.next('tutorials');
        const title = pickValue(values, ['title']) ?? extractValues(values)[0] ?? 'Untitled';
        const description = extractValues(values)[1] ?? '';
        const model = extractValues(values)[2] ?? '';
        const provider = extractValues(values)[3] ?? '';
        const difficulty = extractValues(values)[4] ?? 'beginner';
        const tags = extractValues(values)[5] ?? [];
        this.tutorials.push({ id, title, description, model, provider, difficulty, tags });
        return;
      }
      if (/^\s*INSERT INTO tutorial_steps /i.test(sql)) {
        // Support single or multi-row inserts via multiple calls in tests
        const id = this.next('tutorial_steps');
        const vals = extractValues(values);
        const [tutorial_id, step_order, title, content, code_template, expected_output, model_params] = vals;
        this.tutorial_steps.push({ id, tutorial_id, step_order, title, content, code_template: code_template ?? null, expected_output: expected_output ?? null, model_params: model_params ?? null, created_at: new Date() });
        return;
      }
      if (/^\s*INSERT INTO user_progress /i.test(sql)) {
        const id = this.next('user_progress');
        const [user_id, tutorial_id, current_step, completed_steps] = extractValues(values);
        this.user_progress.push({ id, user_id, tutorial_id, current_step, completed_steps, last_accessed: new Date() });
        return;
      }
      if (/^\s*DELETE FROM tutorial_steps /i.test(sql)) {
        const id = extractValues(values)[0];
        this.tutorial_steps = this.tutorial_steps.filter(r => r.id !== id);
        return;
      }
      if (/^\s*DELETE FROM assessments /i.test(sql)) {
        const [tutorial_id, step_order] = extractValues(values);
        this.assessments = this.assessments.filter(r => !(r.tutorial_id === tutorial_id && r.step_order === step_order));
        return;
      }
      if (/^\s*DELETE FROM tutorials /i.test(sql)) {
        const id = extractValues(values)[0];
        this.tutorials = this.tutorials.filter(r => r.id !== id);
        this.tutorial_steps = this.tutorial_steps.filter(r => r.tutorial_id !== id);
        this.user_progress = this.user_progress.filter(r => r.tutorial_id !== id);
        return;
      }
      if (/^\s*UPDATE tutorial_steps SET step_order = step_order \+ 1 /i.test(sql)) {
        const [tutorial_id, step_order] = extractValues(values);
        this.tutorial_steps.forEach(r => { if (r.tutorial_id === tutorial_id && r.step_order >= step_order) r.step_order += 1; });
        return;
      }
      if (/^\s*UPDATE tutorial_steps SET step_order = step_order - 1 /i.test(sql)) {
        const [tutorial_id, step_order] = extractValues(values);
        this.tutorial_steps.forEach(r => { if (r.tutorial_id === tutorial_id && r.step_order > step_order) r.step_order -= 1; });
        return;
      }
      if (/^\s*UPDATE tutorial_steps\s+SET step_order = /i.test(sql)) {
        const [newOrder, id] = extractValues(values);
        const row = this.tutorial_steps.find(r => r.id === id);
        if (row) row.step_order = newOrder;
        return;
      }
      if (/^\s*UPDATE user_progress\s+SET current_step = current_step \+ 1/i.test(sql)) {
        const [tutorial_id, step_order] = extractValues(values);
        this.user_progress.forEach(r => { if (r.tutorial_id === tutorial_id && r.current_step >= step_order) r.current_step += 1; r.last_accessed = new Date(); });
        return;
      }
      if (/^\s*UPDATE user_progress\s+SET current_step = current_step - 1/i.test(sql)) {
        const [tutorial_id, step_order] = extractValues(values);
        this.user_progress.forEach(r => { if (r.tutorial_id === tutorial_id && r.current_step > step_order) r.current_step -= 1; r.last_accessed = new Date(); });
        return;
      }
      if (/^\s*UPDATE user_progress\s+SET current_step = /i.test(sql)) {
        const [newOrder, tutorial_id, oldOrder] = extractValues(values);
        this.user_progress.forEach(r => { if (r.tutorial_id === tutorial_id && r.current_step === oldOrder) r.current_step = newOrder; r.last_accessed = new Date(); });
        return;
      }
      if (/^\s*UPDATE user_progress\s+SET completed_steps = /i.test(sql)) {
        const [completed_steps, id] = extractValues(values);
        const row = this.user_progress.find(r => r.id === id);
        if (row) { row.completed_steps = completed_steps; row.last_accessed = new Date(); }
        return;
      }
    }

    async queryRow<T=Row>(strings: TemplateStringsArray, ...values: any[]): Promise<T | undefined> {
      const sql = joinSQL(strings, values);
      // Support INSERT ... RETURNING id for tutorials and tutorial_steps
      if (/^\s*INSERT INTO tutorials /i.test(sql) && /RETURNING id/i.test(sql)) {
        const id = this.next('tutorials');
        const qs = extractQuoted(sql);
        const [title, description, model, provider, difficulty] = qs;
        const tags: any[] = [];
        this.tutorials.push({ id, title, description, model, provider, difficulty, tags });
        return { id } as any;
      }
      if (/^\s*INSERT INTO tutorial_steps /i.test(sql) && /RETURNING id/i.test(sql)) {
        const id = this.next('tutorial_steps');
        // Expect parameters for tutorial_id, step_order, and quoted strings for title/content possibly
        const vals = extractValues(values);
        const qs = extractQuoted(sql);
        const tutorial_id = vals[0];
        const step_order = vals[1] ?? 1;
        const title = qs[0] ?? 'Step';
        const content = qs[1] ?? '';
        const code_template = null;
        const expected_output = null;
        const model_params = null;
        this.tutorial_steps.push({ id, tutorial_id, step_order, title, content, code_template, expected_output, model_params, created_at: new Date() });
        return { id } as any;
      }
      const out = await this.queryAll<T>(strings, ...values);
      return out[0];
    }

    async queryAll<T=Row>(strings: TemplateStringsArray, ...values: any[]): Promise<T[]> {
      const sql = joinSQL(strings, values);
      if (/^\s*INSERT INTO tutorial_steps \(tutorial_id, step_order, title, content\) VALUES/i.test(sql) && !/RETURNING/i.test(sql)) {
        // Handle multi-row insert used in tests with string literals
        const tutorial_id = extractValues(values)[0];
        const qs = extractQuoted(sql);
        // Expect order: 'Step 1','Content 1','Step 2','Content 2', ...
        for (let i = 0; i < qs.length; i += 2) {
          const idx = i / 2 + 1;
          const title = qs[i];
          const content = qs[i+1];
          this.tutorial_steps.push({ id: this.next('tutorial_steps'), tutorial_id, step_order: idx, title, content, code_template: null, expected_output: null, model_params: null, created_at: new Date() });
        }
        return [] as any;
      }
      if (/^\s*SELECT id, title FROM tutorials WHERE id = /i.test(sql)) {
        const [id] = extractValues(values);
        const row = this.tutorials.find(r => r.id === id);
        return row ? [row as any] : [];
      }
      if (/^\s*SELECT MAX\(step_order\) as max_order/i.test(sql)) {
        const [tutorial_id] = extractValues(values);
        const filtered = this.tutorial_steps.filter(r => r.tutorial_id === tutorial_id);
        const max = filtered.length ? Math.max(...filtered.map(r => r.step_order)) : null;
        return [{ max_order: max }] as any;
      }
      if (/^\s*SELECT id, step_order\s*FROM tutorial_steps\s*WHERE tutorial_id = /i.test(sql) && /ORDER BY step_order ASC/i.test(sql)) {
        const [tutorial_id, step_order] = extractValues(values);
        const rows = this.tutorial_steps.filter(r => r.tutorial_id === tutorial_id && r.step_order >= step_order).sort((a,b)=>a.step_order-b.step_order);
        return rows as any;
      }
      if (/^\s*SELECT \* FROM tutorial_steps WHERE tutorial_id = /i.test(sql)) {
        const [tutorial_id] = extractValues(values);
        const rows = this.tutorial_steps.filter(r => r.tutorial_id === tutorial_id).sort((a,b)=>a.step_order-b.step_order);
        return rows as any;
      }
      if (/^\s*SELECT \* FROM tutorial_steps WHERE id = /i.test(sql)) {
        const [id] = extractValues(values);
        const row = this.tutorial_steps.find(r => r.id === id);
        return row ? [row as any] : [];
      }
      if (/^\s*SELECT ts\.id, ts\.tutorial_id, ts\.step_order, ts\.title, t\.title as tutorial_title/i.test(sql)) {
        const [id] = extractValues(values);
        const ts = this.tutorial_steps.find(r => r.id === id);
        if (!ts) return [];
        const t = this.tutorials.find(r => r.id === ts.tutorial_id);
        return [{ id: ts.id, tutorial_id: ts.tutorial_id, step_order: ts.step_order, title: ts.title, tutorial_title: t?.title || '' }] as any;
      }
      if (/^\s*SELECT ts\.id, ts\.tutorial_id, ts\.step_order, ts\.title, ts\.content,\s*ts\.code_template/i.test(sql)) {
        const [id] = extractValues(values);
        const ts = this.tutorial_steps.find(r => r.id === id);
        if (!ts) return [];
        const t = this.tutorials.find(r => r.id === ts.tutorial_id);
        return [{ ...ts, tutorial_title: t?.title || '' }] as any;
      }
      if (/^\s*SELECT COUNT\(\*\) as count\s*FROM tutorial_steps/i.test(sql)) {
        const [tutorial_id] = extractValues(values);
        const count = this.tutorial_steps.filter(r => r.tutorial_id === tutorial_id).length;
        return [{ count }] as any;
      }
      if (/^\s*SELECT COUNT\(\*\) as count\s*FROM user_progress/i.test(sql)) {
        const [tutorial_id] = extractValues(values);
        let count = this.user_progress.filter(r => r.tutorial_id === tutorial_id).length;
        if (/AND \(current_step = /i.test(sql)) {
          const [, step_order] = extractValues(values);
          count = this.user_progress.filter(r => r.tutorial_id === tutorial_id && (r.current_step === step_order || (r.completed_steps || []).includes(step_order))).length;
        }
        return [{ count }] as any;
      }
      if (/^\s*SELECT id, step_order, title\s*FROM tutorial_steps/i.test(sql)) {
        const [tutorial_id] = extractValues(values);
        const rows = this.tutorial_steps.filter(r => r.tutorial_id === tutorial_id).sort((a,b)=>a.step_order-b.step_order);
        return rows as any;
      }
      if (/^\s*SELECT id, completed_steps\s*FROM user_progress/i.test(sql)) {
        const [tutorial_id] = extractValues(values);
        const rows = this.user_progress.filter(r => r.tutorial_id === tutorial_id);
        return rows as any;
      }
      if (/array_length\(completed_steps, 1\)/i.test(sql)) {
        const [tutorial_id] = extractValues(values);
        const rows = this.user_progress.filter(r => r.tutorial_id === tutorial_id && Array.isArray(r.completed_steps) && r.completed_steps.length > 0);
        return rows as any;
      }
      return [] as any;
    }
    query<T=Row>(strings: TemplateStringsArray, ...values: any[]): AsyncIterable<T> {
      const promise = this.queryAll<T>(strings, ...values);
      async function* iter() { for (const r of await promise) yield r; }
      return iter();
    }

    async rawQueryRow<T=Row>(query: string, ...values: any[]): Promise<T | undefined> {
      if (/^\s*UPDATE tutorial_steps\s+SET /i.test(query)) {
        // Map dynamic updates based on provided fields
        const id = values[values.length - 1];
        const row = this.tutorial_steps.find(r => r.id === id);
        if (!row) return undefined;
        const setPart = query.split('SET')[1].split('WHERE')[0];
        const fields = setPart.split(',').map(s => s.trim().split('=')[0].trim());
        const vals = values.slice(0, fields.length);
        fields.forEach((f, i) => {
          const key = sqlFieldToKey(f);
          (row as any)[key] = vals[i];
        });
        return row as any;
      }
      return undefined;
    }
  }

  function joinSQL(strings: TemplateStringsArray, values: any[]) {
    let out = '';
    strings.forEach((s, i) => { out += s; if (i < values.length) out += `$${i+1}`; });
    return out.replace(/\s+/g, ' ').trim();
  }
  function extractValues(values: any[]) { return values; }
  function extractQuoted(sql: string): string[] {
    const m = sql.match(/'([^']*)'/g) || [];
    return m.map(s => s.slice(1, -1));
  }
  function pickValue(values: any[], keys: string[]) { return undefined; }
  function sqlFieldToKey(f: string) {
    const map: Record<string,string> = {
      'title': 'title',
      'content': 'content',
      'code_template': 'code_template',
      'expected_output': 'expected_output',
      'model_params': 'model_params',
    };
    return map[f] || f;
  }

  class SQLDatabase extends MemDB {}
  return { SQLDatabase };
});
