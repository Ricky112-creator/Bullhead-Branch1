// 1) Redirect ONLY the exact production pages.dev hostname to the custom domain.
//    Preview deployments (<hash>.bullhead-branch1.pages.dev) have different hostnames and pass through untouched.
//    No loop is possible because the custom domain never matches this check.
//
// 2) Security headers on every response. They are added here (not only in _headers) because Cloudflare does not
//    apply _headers to responses a Function produces (every /api reply and the 404 page).
//    The CSP allows only what the site really loads: its own files, GSAP/Lenis from jsDelivr, the QR library from
//    cdnjs, Google Fonts, and the Google Maps embed on /visit. There are no inline scripts (they live in /js/).
//    If a page ever needs a new outside host, add it here or the browser will block it (the console says which rule).
const CSP = [
  "default-src 'self'",
  "script-src 'self' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob:",
  "connect-src 'self'",
  "frame-src https://www.google.com",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ');
const BASE_SECURITY = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'SAMEORIGIN',
  'Permissions-Policy': 'camera=(), microphone=()',
  // One year, this exact host only (no includeSubDomains / preload: those are hard to undo).
  'Strict-Transport-Security': 'max-age=31536000',
};
function secure(res) {
  let out;
  try { out = new Response(res.body, res); } catch (e) { return res; }
  for (const [k, v] of Object.entries(BASE_SECURITY)) if (!out.headers.has(k)) out.headers.set(k, v);
  if ((out.headers.get('Content-Type') || '').includes('text/html')) out.headers.set('Content-Security-Policy', CSP);
  return out;
}

export async function onRequest(context) {
  const url = new URL(context.request.url);
  if (url.hostname === 'bullhead-branch1.pages.dev') {
    url.protocol = 'https:';
    url.host = 'branch1.bullheadhotels.co.ke';
    return Response.redirect(url.toString(), 301);
  }
  return secure(await context.next());
}
