// api/chat.js
// Vercel serverless function — proxies requests to Dify chat API.
// Keeps DIFY_API_KEY and DIFY_BASE_URL server-side, never exposed to browser.

export const config = { runtime: 'edge' };

export default async function handler(req) {
  // Only allow POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Read env vars (set in Vercel dashboard)
  const DIFY_API_KEY  = process.env.DIFY_API_KEY;
  const DIFY_BASE_URL = (process.env.DIFY_BASE_URL || 'https://api.dify.ai').replace(/\/$/, '');

  if (!DIFY_API_KEY) {
    return new Response(JSON.stringify({ error: 'DIFY_API_KEY not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { query, conversation_id, user } = body;

  if (!query || typeof query !== 'string' || !query.trim()) {
    return new Response(JSON.stringify({ error: 'query is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Build Dify request payload
  const difyPayload = {
    inputs: {},
    query: query.trim(),
    response_mode: 'streaming',          // SSE — required for streaming
    user: user || 'hr-user-default',
    conversation_id: conversation_id || '', // empty string = new conversation
    auto_generate_name: true,
  };

  // Forward to Dify
  let difyRes;
  try {
    difyRes = await fetch(`${DIFY_BASE_URL}/v1/chat-messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DIFY_API_KEY}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify(difyPayload),
    });
  } catch (fetchErr) {
    return new Response(JSON.stringify({ error: `Cannot reach Dify: ${fetchErr.message}` }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!difyRes.ok) {
    const errText = await difyRes.text().catch(() => '');
    let errMsg = `Dify returned ${difyRes.status}`;
    try {
      const parsed = JSON.parse(errText);
      errMsg = parsed.message || parsed.error || errMsg;
    } catch {}
    return new Response(JSON.stringify({ error: errMsg }), {
      status: difyRes.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Stream Dify SSE response directly back to browser
  return new Response(difyRes.body, {
    status: 200,
    headers: {
      'Content-Type':                'text/event-stream',
      'Cache-Control':               'no-cache',
      'X-Accel-Buffering':           'no',   // disable nginx buffering
      'Access-Control-Allow-Origin': '*',
    },
  });
}