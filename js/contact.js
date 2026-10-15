(() => {
  const form = document.getElementById('wf-form-Contact-11-Form');
  if (!form) return;
  const wrapper = form.closest('.w-form');
  const success = wrapper.querySelector('.w-form-done');
  const failure = wrapper.querySelector('.w-form-fail');
  const submit = form.querySelector('[type="submit"]');
  const originalLabel = submit.value;
  let token = '', widget, busy = false;
  const showError = message => {
    failure.textContent = message;
    failure.setAttribute('role', 'alert');
    failure.style.display = 'block';
  };
  const trap = document.createElement('input');
  trap.type = 'text'; trap.name = 'website'; trap.tabIndex = -1;
  trap.autocomplete = 'off'; trap.setAttribute('aria-hidden', 'true');
  trap.style.cssText = 'position:absolute;left:-10000px;width:1px;height:1px;';
  form.appendChild(trap);
  const challenge = document.createElement('div');
  submit.before(challenge);
  submit.disabled = true;
  form.addEventListener('submit', async event => {
    event.preventDefault(); event.stopImmediatePropagation();
    if (busy || !form.reportValidity()) return;
    if (!token) { showError('Please complete the security check, then try again.'); return; }
    busy = true; submit.disabled = true; submit.value = submit.dataset.wait || 'Sending...';
    failure.style.display = 'none';
    try {
      const response = await fetch('/api/contact', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.elements['Contact-11-Name'].value, email: form.elements['Contact-11-Email'].value, message: form.elements['Contact-11-Message'].value, website: trap.value, token }),
        signal: AbortSignal.timeout(25000)
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Your message could not be sent. Please try again.');
      form.hidden = true; form.style.display = 'none';
      success.style.display = 'block'; success.tabIndex = -1; success.focus(); form.reset();
    } catch (error) {
      showError(error.name === 'TimeoutError' ? 'The request timed out. Please check your connection and try again.' : error.message);
    } finally {
      busy = false; token = ''; submit.value = originalLabel; submit.disabled = true;
      if (window.turnstile && widget !== undefined) window.turnstile.reset(widget);
    }
  }, true);
  (async () => {
    try {
      const response = await fetch('/api/contact/config');
      if (!response.ok) throw new Error('Form not configured');
      const { siteKey } = await response.json();
      if (!siteKey) throw new Error('Missing site key');
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.onload = resolve; script.onerror = reject; document.head.appendChild(script);
      });
      widget = window.turnstile.render(challenge, {
        sitekey: siteKey, action: 'contact', size: 'flexible',
        callback: value => { token = value; if (!busy) submit.disabled = false; },
        'expired-callback': () => { token = ''; submit.disabled = true; },
        'error-callback': () => { token = ''; submit.disabled = true; showError('Security check could not load. Please refresh and try again.'); }
      });
    } catch { showError('The form is temporarily unavailable. Please email contactus@solarcentrictech.com.'); }
  })();
})();
