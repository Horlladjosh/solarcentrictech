(() => {
  const heading = document.querySelector('.direct-contact-hero .h1');
  const subtext = document.querySelector('.direct-contact-intro');
  if (!heading || !subtext) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let revealed = false;
  const reveal = () => {
    if (revealed) return;
    revealed = true;
    subtext.style.opacity = '1';
    if (!reduced && subtext.animate) {
      subtext.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: 'ease-out' });
    }
  };
  if (reduced) { reveal(); return; }
  const started = performance.now();
  const check = () => {
    const style = getComputedStyle(heading);
    let settled = style.transform === 'none';
    try { settled ||= new DOMMatrixReadOnly(style.transform).isIdentity; } catch {}
    if ((Number(style.opacity) >= 0.999 && settled) || performance.now() - started > 6000) {
      reveal();
    } else { requestAnimationFrame(check); }
  };
  requestAnimationFrame(check);
})();
