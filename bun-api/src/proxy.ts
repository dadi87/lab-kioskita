import { extractAuthUser } from './auth';

const PHP_API_BASE = process.env.PHP_API_URL || 'http://php-api';

export async function proxyToPhp(
  req: Request,
  targetScript: string,
  actionOverride?: string,
  extraParams?: Record<string, string>
): Promise<Response> {
  const url = new URL(req.url);
  const user = extractAuthUser(req);

  // Teruskan query params
  const targetUrl = new URL(`${PHP_API_BASE}/${targetScript}`);
  url.searchParams.forEach((val, key) => {
    targetUrl.searchParams.set(key, val);
  });

  if (actionOverride) {
    targetUrl.searchParams.set('action', actionOverride);
  }

  if (extraParams) {
    for (const [k, v] of Object.entries(extraParams)) {
      targetUrl.searchParams.set(k, v);
    }
  }

  const headers = new Headers();
  headers.set('Content-Type', req.headers.get('Content-Type') || 'application/json');

  if (user) {
    headers.set('X-User-Id', String(user.id));
    headers.set('X-User-Role', user.role);
    headers.set('X-Tenant-Id', String(user.tenant_id));
  }

  const method = req.method;
  let body: any = undefined;

  if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
    try {
      body = await req.text();
    } catch {
      body = undefined;
    }
  }

  try {
    const phpRes = await fetch(targetUrl.toString(), {
      method,
      headers,
      body,
    });

    const resBody = await phpRes.text();
    const contentType = phpRes.headers.get('Content-Type') || 'application/json';

    return new Response(resBody, {
      status: phpRes.status,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error: any) {
    return Response.json({
      success: false,
      error: `Gagal meneruskan request ke PHP legacy API: ${error.message}`,
    }, { status: 502 });
  }
}
