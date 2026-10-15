# Solarcentric Technologies

Static website exported from Webflow, hosted on Cloudflare Pages at
https://solarcentrictech.com.

## Cloudflare Pages

- Production branch: `main`
- Framework preset: None
- Build command: leave blank
- Build output directory: `/`

Push changes to `main` to trigger automatic deployment. Cloudflare Web Analytics
is enabled through the Pages dashboard.

## Contact page

The contact page provides direct email, telephone and Google Maps links. It does
not collect form submissions or require an email Worker, API key or Turnstile.
Its page-specific styling is in `css/contact.css`.

The contact hero subtext fades in after the title entrance animation finishes.
Updated CSS and JavaScript use versioned URLs to avoid stale browser assets.
