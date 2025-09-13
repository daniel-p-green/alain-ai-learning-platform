import { describe, it, expect } from 'vitest';
import { api, APIClientError } from '../lib/api';

function makeResponse(body: any, init?: { status?: number; json?: boolean }) {
  const status = init?.status ?? 200;
  const headers = new Headers();
  if (init?.json !== false) headers.set('content-type', 'application/json');
  const payload = typeof body === 'string' ? body : JSON.stringify(body);
  return new Response(payload, { status, headers });
}

describe('api.parseGenerateResponse', () => {
  it('returns success on valid envelope', async () => {
    const resp = makeResponse({ success: true, tutorialId: 'abc' });
    const ok = await api.parseGenerateResponse(resp);
    expect(ok.tutorialId).toBe('abc');
  });

  it('throws APIClientError on error envelope', async () => {
    const resp = makeResponse({ success: false, error: { message: 'Bad request', details: ['x'] } }, { status: 400 });
    await expect(api.parseGenerateResponse(resp)).rejects.toBeInstanceOf(APIClientError);
  });

  it('throws on unexpected format', async () => {
    const resp = makeResponse('not-json', { json: false, status: 500 });
    await expect(api.parseGenerateResponse(resp)).rejects.toBeInstanceOf(APIClientError);
  });
});
