/**
 * Thin Worker in front of the static assets. One-hop 301s to the canonical URL:
 * - http://  -> https://
 * - www.ilovecalx.com and the workers.dev preview host -> ilovecalx.com
 * - extensionless paths without a trailing slash -> path + "/" (pages are folders)
 * Everything else is served from ./dist by the assets binding.
 */
const CANONICAL_HOST = 'ilovecalx.com';
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (LOCAL_HOSTS.has(url.hostname)) return env.ASSETS.fetch(request);

    let changed = false;
    if (url.hostname !== CANONICAL_HOST) {
      url.hostname = CANONICAL_HOST;
      changed = true;
    }
    if (url.protocol !== 'https:') {
      url.protocol = 'https:';
      changed = true;
    }
    const last = url.pathname.split('/').pop();
    if (last && !last.includes('.')) {
      url.pathname += '/';
      changed = true;
    }
    if (changed && (request.method === 'GET' || request.method === 'HEAD')) {
      url.port = '';
      return Response.redirect(url.toString(), 301);
    }
    return env.ASSETS.fetch(request);
  },
};
