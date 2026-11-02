// Local contract test of worker/src/index.js with a STUBBED Gemini (no network, no key).
import worker from './src/index.js';
const calls = [];
globalThis.fetch = async (url, init) => {
  const b = JSON.parse(init.body); calls.push({ url, tools: b.tools, schema: !!b.generationConfig?.responseSchema, key: init.headers['x-goog-api-key'] });
  if (b.tools && process.env.SIM429) return new Response('{"error":{"message":"quota"}}', { status: 429 });
  return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: '```json\n{"name":"STUB","usdValue":"$1","description":"stub","tags":["a"],"valuationReasoning":"stub"}\n```' }] }, groundingMetadata: { groundingChunks: [{ web: { uri: 'https://e.x/1', title: 'E' } }, { web: { uri: 'https://e.x/1', title: 'dup' } }] } }] }));
};
const env = { GEMINI_API_KEY: 'test-key', ALLOWED_ORIGINS: 'https://timesnapx.github.io', MAX_BODY_BYTES: '8388608', RATE_LIMIT_PER_MINUTE: '3' };
const mk = (o, body) => new Request('https://w/api/analyze-image', { method: 'POST', headers: { Origin: o, 'Content-Type': 'application/json', 'CF-Connecting-IP': '1.2.3.' + Math.random() }, body });
const show = async (label, r) => console.log(label, r.status, r.headers.get('access-control-allow-origin'), await r.text());
await show('ok   ', await worker.fetch(mk('https://timesnapx.github.io', JSON.stringify({ image: 'data:image/png;base64,AAAA' })), env));
await show('bad-o', await worker.fetch(mk('https://evil.com', JSON.stringify({ image: 'x' })), env));
await show('noimg', await worker.fetch(mk('http://localhost:5173', '{}'), env));
await show('big  ', await worker.fetch(mk('http://localhost:5173', JSON.stringify({ image: 'A'.repeat(9e6) })), env));
await show('pref ', await worker.fetch(new Request('https://w/api/analyze-image', { method: 'OPTIONS', headers: { Origin: 'https://timesnapx.github.io' } }), env));
const h = { Origin: 'https://timesnapx.github.io', 'CF-Connecting-IP': '9.9.9.9' }; let last;
for (let i = 0; i < 4; i++) last = await worker.fetch(new Request('https://w/api/analyze-image', { method: 'POST', headers: h, body: '{"image":"AAAA"}' }), env);
console.log('ratelimit 4th', last.status);
console.log('gemini calls', JSON.stringify(calls[0]));
