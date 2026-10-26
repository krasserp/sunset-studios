(() => {
  const video = document.getElementById('winter-hero-video');
  const button = document.getElementById('winter-motion');
  if (!video || !button) return;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobileViewport = window.matchMedia('(max-width: 760px)');
  let playRequest = 0;
  function pause() {
    playRequest++;
    video.pause();
    button.textContent = 'Play background video';
  }
  async function play() {
    const request = ++playRequest;
    const source = mobileViewport.matches ? video.dataset.videoMobileSrc : video.dataset.videoSrc;
    if (video.getAttribute('src') !== source) {
      video.src = source;
      video.load();
    }
    video.muted = true;
    try {
      await video.play();
      if (request === playRequest) button.textContent = 'Pause background video';
    } catch (_) {
      if (request === playRequest) button.textContent = 'Play background video';
    }
  }
  button.hidden = false;
  button.textContent = 'Play background video';
  button.addEventListener('click', () => video.paused ? play() : pause());
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) pause();
  });
  mobileViewport.addEventListener('change', () => {
    // Choose one appropriate asset; do not download both on initial load.
    if (!video.getAttribute('src')) return;
    const wasPlaying = !video.paused;
    pause();
    video.removeAttribute('src');
    video.load();
    if (wasPlaying && !reducedMotion.matches && !document.hidden) play();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pause();
  });
  if (!reducedMotion.matches && !navigator.connection?.saveData) play();
})();
