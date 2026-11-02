// *** MOCK *** local stand-in for the worker, for testing only. Returns a FAKE
// response shaped by the real JSON schema. Values are placeholders, not valuations.
import http from 'node:http';
const PORT = Number(process.env.PORT || 8787);
http.createServer((req, res) => {
  const origin = req.headers.origin || '';
  const cors = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ? { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } : {};
  if (req.method === 'OPTIONS') { res.writeHead(204, cors); return res.end(); }
  if (req.method !== 'POST' || req.url !== '/api/analyze-image') { res.writeHead(404, { 'Content-Type': 'application/json', ...cors }); return res.end('{"error":"API endpoint not found"}'); }
  let body = ''; req.on('data', (c) => (body += c));
  req.on('end', () => {
    let image; try { image = JSON.parse(body).image; } catch {}
    if (typeof image !== 'string' || !image) { res.writeHead(400, { 'Content-Type': 'application/json', ...cors }); return res.end('{"error":"A base64 image string is required."}'); }
    console.log(`[MOCK] received image, ${image.length} chars, prefix ${image.slice(0, 23)}`);
    res.writeHead(200, { 'Content-Type': 'application/json', ...cors });
    res.end(JSON.stringify({
      name: 'MOCK ITEM (test response)',
      usdValue: 100,
      description: 'Mock response from local test server — not a real valuation.',
      tags: ['mock', 'test', 'placeholder'],
      valuationReasoning: 'MOCK: fixed placeholder value used for end-to-end testing; no market search performed.',
      sources: [{ title: 'Mock source (example.com)', uri: 'https://example.com/' }],
    }));
  });
}).listen(PORT, () => console.log(`[MOCK] worker stub on http://localhost:${PORT}`));
