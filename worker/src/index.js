// TimeSnap analysis API — Cloudflare Worker port of the AI Studio server.ts
// POST /api/analyze-image  { image: "<data URL or raw base64>" }
//   200 -> { name, usdValue, description, tags[], valuationReasoning?, sources: [{title, uri}] }
//   4xx/5xx -> { error: string }
// Same model, prompt, JSON schema and Google Search grounding (with 429 fallback without search) as server.ts.

const MODEL = 'gemini-2.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const PROMPT = `Identify the main object in this image. 
            Search for its current fair market value in USD (e.g., eBay sold listings, retail sites, or price aggregators). 
            Be precise with the valuation based on the search results.
            Provide a short description and 3-5 tags.
            Also provide a brief 'valuationReasoning' explaining the price range found and why this value was chosen.
            Return the result as JSON with keys: 'name', 'usdValue' (number), 'description', 'tags' (array of strings), and 'valuationReasoning' (string).`;

const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    name: { type: 'STRING' },
    usdValue: { type: 'NUMBER' },
    description: { type: 'STRING' },
    tags: { type: 'ARRAY', items: { type: 'STRING' } },
    valuationReasoning: { type: 'STRING' },
  },
  required: ['name', 'usdValue', 'description', 'tags'],
};

const SCHEMA_HINT = `
            Respond with ONLY a single JSON object (no markdown, no code fences) matching this JSON schema:
            ${JSON.stringify(RESPONSE_SCHEMA)}`;

function parseResult(text) {
  let t = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '');
  let obj;
  try { obj = JSON.parse(t); } catch {
    const a = t.indexOf('{'), b = t.lastIndexOf('}');
    if (a < 0 || b <= a) throw new Error('AI response was not valid JSON');
    obj = JSON.parse(t.slice(a, b + 1));
  }
  if (typeof obj.usdValue === 'string') obj.usdValue = Number(obj.usdValue.replace(/[^0-9.\-]/g, ''));
  if (typeof obj.name !== 'string' || !obj.name || typeof obj.description !== 'string' || !Array.isArray(obj.tags) || !Number.isFinite(obj.usdValue)) {
    throw new Error('AI response missing required fields');
  }
  const out = { name: obj.name, usdValue: obj.usdValue, description: obj.description, tags: obj.tags.map(String) };
  if (typeof obj.valuationReasoning === 'string') out.valuationReasoning = obj.valuationReasoning;
  return out;
}

const LOCAL_ORIGIN = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
const buckets = new Map(); // best-effort per-isolate rate limit

function corsHeaders(origin, env) {
  const allowed = (env.ALLOWED_ORIGINS || 'https://timesnapx.github.io').split(',').map((s) => s.trim());
  const ok = origin && (allowed.includes(origin) || LOCAL_ORIGIN.test(origin));
  return ok
    ? { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400', Vary: 'Origin' }
    : { Vary: 'Origin' };
}

function json(body, status, cors) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...cors } });
}

function rateLimited(ip, env) {
  const limit = Number(env.RATE_LIMIT_PER_MINUTE || 10);
  const now = Date.now();
  const b = buckets.get(ip);
  if (!b || now - b.start > 60_000) { buckets.set(ip, { start: now, count: 1 }); return false; }
  b.count += 1;
  if (buckets.size > 5000) buckets.clear();
  return b.count > limit;
}

class HttpError extends Error { constructor(status, msg) { super(msg); this.status = status; } }

async function callGemini(apiKey, contents, withSearch) {
  // gemini-2.5 rejects responseMimeType/responseSchema combined with tools, so with
  // google_search grounding the schema goes in the prompt and JSON is parsed from text.
  const body = withSearch
    ? { contents: [{ ...contents, parts: [contents.parts[0], { text: contents.parts[1].text + SCHEMA_HINT }] }], tools: [{ google_search: {} }] }
    : { contents: [contents], generationConfig: { responseMimeType: 'application/json', responseSchema: RESPONSE_SCHEMA } };
  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new HttpError(res.status, data?.error?.message || `Gemini request failed (${res.status})`);
  return data;
}


// ---- Market quotes proxy (Yahoo Finance spark, keyless). Fixed symbol sets only; edge-cached. ----
const QUOTE_SETS = {
  stocks: ['AAPL','MSFT','NVDA','GOOGL','AMZN','META','TSLA','BRK-B','AVGO','TSM','JPM','V','MA','UNH','XOM','JNJ','WMT','PG','HD','COST','ORCL','NFLX','AMD','KO','DIS','BAC',
    'SPY','QQQ','BHP.AX','CBA.AX','CSL.AX'],
  commodities: ['GC=F','SI=F','PL=F','PA=F','HG=F','CL=F','BZ=F','NG=F','ZW=F','ZC=F','KC=F','SB=F'],
};
const QUOTE_TTL = 600; // seconds

async function fetchSpark(symbols) {
  const url = `https://query1.finance.yahoo.com/v7/finance/spark?symbols=${encodeURIComponent(symbols.join(','))}&range=1d&interval=1d`;
  const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TimeSnap/1.0)', Accept: 'application/json' } });
  if (!r.ok) throw new HttpError(502, `Quote source returned ${r.status}`);
  const d = await r.json();
  return (d?.spark?.result || []).map((x) => {
    const m = x?.response?.[0]?.meta || {};
    const price = m.regularMarketPrice;
    const prev = m.chartPreviousClose ?? m.previousClose;
    return {
      symbol: x.symbol,
      name: m.longName || m.shortName || x.symbol,
      price: typeof price === 'number' ? price : null,
      currency: m.currency || 'USD',
      changePct: typeof m.regularMarketChangePercent === 'number' ? m.regularMarketChangePercent : (price && prev ? ((price - prev) / prev) * 100 : null),
      time: m.regularMarketTime ? m.regularMarketTime * 1000 : null,
      exchange: m.fullExchangeName || m.exchangeName || null,
    };
  }).filter((q) => q.price !== null);
}

async function handleQuotes(request, url, cors, ctx) {
  const set = url.searchParams.get('set');
  const symbols = QUOTE_SETS[set];
  if (!symbols) return json({ error: 'Unknown set' }, 400, cors);
  const cache = caches.default;
  const key = new Request(`https://timesnap-cache.internal/quotes/${set}`);
  let hit = await cache.match(key);
  let body;
  if (hit) body = await hit.text();
  else {
    const chunks = [];
    for (let i = 0; i < symbols.length; i += 20) chunks.push(symbols.slice(i, i + 20));
    const parts = await Promise.all(chunks.map(fetchSpark));
    body = JSON.stringify({ set, asOf: Date.now(), source: 'Yahoo Finance (via TimeSnap worker)', quotes: parts.flat() });
    ctx.waitUntil(cache.put(key, new Response(body, { headers: { 'Content-Type': 'application/json', 'Cache-Control': `public, max-age=${QUOTE_TTL}` } })));
  }
  return new Response(body, { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': `public, max-age=${QUOTE_TTL}`, 'X-Cache': hit ? 'HIT' : 'MISS', ...cors } });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin');
    const cors = corsHeaders(origin, env);

    if (url.pathname === '/api/quotes') {
      if (request.method === 'OPTIONS') return new Response(null, { status: cors['Access-Control-Allow-Origin'] ? 204 : 403, headers: { ...cors, 'Access-Control-Allow-Methods': 'GET, OPTIONS' } });
      if (request.method !== 'GET') return json({ error: 'Method not allowed' }, 405, cors);
      if (origin && !cors['Access-Control-Allow-Origin']) return json({ error: 'Origin not allowed' }, 403, cors);
      try { return await handleQuotes(request, url, cors, ctx); }
      catch (e) { return json({ error: e.message || 'Quote fetch failed' }, e.status || 502, cors); }
    }
    if (url.pathname !== '/api/analyze-image') return json({ error: 'API endpoint not found' }, 404, cors);
    if (request.method === 'OPTIONS') return new Response(null, { status: cors['Access-Control-Allow-Origin'] ? 204 : 403, headers: cors });
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405, cors);
    if (origin && !cors['Access-Control-Allow-Origin']) return json({ error: 'Origin not allowed' }, 403, cors);

    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    if (rateLimited(ip, env)) return json({ error: 'Too many requests. Please wait a minute and try again.' }, 429, cors);

    const maxBytes = Number(env.MAX_BODY_BYTES || 8 * 1024 * 1024);
    const declared = Number(request.headers.get('Content-Length') || 0);
    if (declared > maxBytes) return json({ error: 'Image too large (max 8 MB).' }, 413, cors);

    try {
      const raw = await request.text();
      if (raw.length > maxBytes) return json({ error: 'Image too large (max 8 MB).' }, 413, cors);
      let image;
      try { image = JSON.parse(raw)?.image; } catch { image = undefined; }
      if (typeof image !== 'string' || !image.trim()) return json({ error: 'A base64 image string is required.' }, 400, cors);

      if (!env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY environment variable is not configured.');

      const m = image.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/s);
      const mimeType = m ? m[1] : 'image/jpeg';
      const cleanBase64 = m ? m[2] : image.replace(/^data:[^;]+;base64,/, '');

      const contents = { role: 'user', parts: [{ inlineData: { mimeType, data: cleanBase64 } }, { text: PROMPT }] };

      let response;
      try {
        response = await callGemini(env.GEMINI_API_KEY, contents, true);
      } catch (e) {
        if (e.status === 429) response = await callGemini(env.GEMINI_API_KEY, contents, false);
        else throw e;
      }

      const cand = response?.candidates?.[0];
      const text = (cand?.content?.parts || []).filter((p) => typeof p.text === 'string' && !p.thought).map((p) => p.text).join('');
      if (!text) throw new Error('No response from AI');
      const result = parseResult(text);

      const chunks = cand?.groundingMetadata?.groundingChunks || [];
      const sources = chunks.filter((c) => c.web?.uri).map((c) => ({ title: c.web?.title || 'Source', uri: c.web?.uri || '' }));
      const uniqueSources = Array.from(new Map(sources.map((s) => [s.uri, s])).values());

      return json({ ...result, sources: uniqueSources }, 200, cors);
    } catch (error) {
      console.error('Gemini API Error:', error);
      const status = typeof error?.status === 'number' && error.status >= 400 && error.status < 600 ? error.status : 500;
      return json({ error: error instanceof Error ? error.message : 'Failed to analyze image.' }, status, cors);
    }
  },
};
