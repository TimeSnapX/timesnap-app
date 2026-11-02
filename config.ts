// Single place to configure the analysis backend (Cloudflare Worker in ./worker).
// Deployed Cloudflare Worker (worker/). 
// For local dev/testing you can override with ?api=http://localhost:8787 (stored in sessionStorage).
const DEFAULT_API_BASE = 'https://timesnap-api.timesnapx.workers.dev';

function resolveApiBase(): string {
  try {
    const q = new URLSearchParams(location.search).get('api');
    if (q && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(q)) sessionStorage.setItem('timesnap.apiBase', q);
    return sessionStorage.getItem('timesnap.apiBase') || DEFAULT_API_BASE;
  } catch { return DEFAULT_API_BASE; }
}
export const API_BASE = resolveApiBase();
