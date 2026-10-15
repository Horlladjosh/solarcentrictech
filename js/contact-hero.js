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
  let headingStartedAt;
  const check = () => {
    const now = performance.now();
    const style = getComputedStyle(heading);
    if (headingStartedAt === undefined && Number(style.opacity) > 0) headingStartedAt = now;
    if ((headingStartedAt !== undefined && now - headingStartedAt >= 1750) || now - started > 6000) reveal();
    else requestAnimationFrame(check);
  };
  requestAnimationFrame(check);
})();
