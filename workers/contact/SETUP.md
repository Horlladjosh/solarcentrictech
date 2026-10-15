# Contact form setup

The website stays on Cloudflare Pages. A separate Worker handles only
`solarcentrictech.com/api/contact*`. The site's original layout and success/error
containers are retained. The form stays unavailable until the Worker is configured.

## 1. Email sender

The test recipient is triplefourmedia@gmail.com and must be a verified destination.
Onboard solarcentrictech.com to Cloudflare Email Service so it can send from
forms@solarcentrictech.com. Follow Cloudflare's domain verification instructions.
If the domain already has an email provider, do not replace its MX records blindly;
use Cloudflare's supported sending-domain setup or a dedicated sending subdomain
(and update SENDER in index.mjs accordingly).

Sending to verified destinations is documented as free on all plans. Confirm the
account's available email sending setup before deployment.

## 2. Turnstile

Create a Managed widget for hostname solarcentrictech.com (no protocol or path).
Store the site key as TURNSTILE_SITE_KEY and the secret as TURNSTILE_SECRET_KEY on
the Worker. Never commit the secret. The site key is public and is returned through
/api/contact/config; the secret is used only on the server.

## 3. Deploy the Worker

Option A: Connect this repository to a new Worker with root directory
workers/contact, no build command, and deploy command `npx wrangler deploy`.
The included wrangler.jsonc defines the restricted EMAIL binding and route.
Add TURNSTILE_SITE_KEY (variable) and TURNSTILE_SECRET_KEY (secret) to its runtime
settings. Deploy again after settings are saved.

Option B: With Node and Wrangler installed, from this directory:

    npx wrangler login
    npx wrangler secret put TURNSTILE_SITE_KEY
    npx wrangler secret put TURNSTILE_SECRET_KEY
    npx wrangler deploy

The account must own the solarcentrictech.com zone. This Worker must not be assigned
the entire domain. Only the /api/contact* route belongs to it; Pages serves the rest.
The verified recipient is restricted in wrangler.jsonc as well as in code.

## 4. Test

Open https://solarcentrictech.com/contact, complete the security check, and send one
clearly labeled test message. Confirm it arrives in Gmail (including Spam), that
Reply targets the submitted visitor address, and that the success state appears.
No real delivery has been tested by the repository's local checks.

The form intentionally supports the canonical production domain only, not
pages.dev preview deployments. Preview submissions fail closed.

Server checks cover origin, bounded JSON size, field types/lengths, a honeypot,
and Turnstile success, hostname and action. No submission contents are logged.

To change the recipient later, update RECIPIENT and destination_address together,
verify the new recipient, and redeploy the Worker.
