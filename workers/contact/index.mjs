const ORIGIN = 'https://solarcentrictech.com';
const RECIPIENT = 'triplefourmedia@gmail.com';
const SENDER = 'forms@solarcentrictech.com';
const json = (body, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/contact/config' && request.method === 'GET') {
      return env.TURNSTILE_SITE_KEY ? json({ siteKey: env.TURNSTILE_SITE_KEY }) : json({ error: 'Form is not configured yet.' }, 503);
    }
    if (url.pathname !== '/api/contact') return json({ error: 'Not found.' }, 404);
    if (request.method !== 'POST') return new Response(null, { status: 405, headers: { Allow: 'POST' } });
    if (request.headers.get('Origin') !== ORIGIN) return json({ error: 'Invalid origin.' }, 403);
    if (!env.EMAIL || !env.TURNSTILE_SECRET_KEY) return json({ error: 'Form is temporarily unavailable. Please email contactus@solarcentrictech.com.' }, 503);
    if (!(request.headers.get('Content-Type') || '').startsWith('application/json')) return json({ error: 'Expected JSON.' }, 415);
    let data;
    try {
      // Bound the stream before parsing, even when Content-Length is absent.
      const reader = request.body?.getReader();
      if (!reader) return json({ error: 'Empty request.' }, 400);
      const chunks = []; let size = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 32768) { await reader.cancel(); return json({ error: 'Message is too large.' }, 413); }
        chunks.push(value);
      }
      const bytes = new Uint8Array(size); let offset = 0;
      for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
      data = JSON.parse(new TextDecoder().decode(bytes));
    } catch { return json({ error: 'Invalid submission.' }, 400); }
    if (!data || typeof data !== 'object' || Array.isArray(data)) return json({ error: 'Invalid submission.' }, 400);
    if (data.website) return json({ success: true }); // Honeypot; never sends email.
    const name = typeof data.name === 'string' ? data.name.trim() : '';
    const email = typeof data.email === 'string' ? data.email.trim() : '';
    const message = typeof data.message === 'string' ? data.message.trim() : '';
    if (!name || name.length > 256 || /[\r\n]/.test(name) || email.length > 254 || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email) || !message || message.length > 5000) {
      return json({ error: 'Please enter a valid name, email address and message (up to 5,000 characters).' }, 400);
    }
    if (typeof data.token !== 'string' || !data.token || data.token.length > 2048) return json({ error: 'Please complete the security check.' }, 400);
    try {
      const verification = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: env.TURNSTILE_SECRET_KEY, response: data.token, remoteip: request.headers.get('CF-Connecting-IP') }),
        signal: AbortSignal.timeout(10000)
      });
      if (!verification.ok) throw new Error('Verification unavailable');
      const result = await verification.json();
      if (!result.success || result.hostname !== 'solarcentrictech.com' || result.action !== 'contact') return json({ error: 'Security check expired or failed. Please try again.' }, 403);
      await env.EMAIL.send({
        from: { email: SENDER, name: 'Solarcentric website' }, to: RECIPIENT,
        replyTo: email, subject: 'New Solarcentric website enquiry',
        text: `Name: ${name}\nEmail: ${email}\n\n${message}`
      });
      return json({ success: true });
    } catch (error) {
      console.error('Contact submission failed:', error.code || 'UPSTREAM_ERROR');
      return json({ error: 'Your message could not be sent. Please try again or email contactus@solarcentrictech.com.' }, 502);
    }
  }
};
