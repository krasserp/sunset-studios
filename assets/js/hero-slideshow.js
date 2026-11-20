(() => {
  const slideshow = document.querySelector('[data-hero-slideshow]');
  const firstImage = slideshow.querySelector('img');
  const laterSlides = slideshow.querySelector('template');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  async function start() {
    if (reducedMotion.matches) return;

    await firstImage.decode().catch(() => {});
    if (document.readyState !== 'complete') {
      await new Promise(resolve => window.addEventListener('load', resolve, { once: true }));
    }
    // Let the first slide paint before asking the browser for the rest.
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    if (reducedMotion.matches) return;

    slideshow.appendChild(laterSlides.content.cloneNode(true));
    const images = slideshow.querySelectorAll('.slide:not(.slide-1) img');
    const decoded = await Promise.allSettled(Array.from(images, image => image.decode()));
    if (decoded.every(result => result.status === 'fulfilled')) {
      slideshow.classList.add('slideshow-ready');
    }
  }

  start();
})();
