(() => {
  const lightbox = document.getElementById('lightbox');
  const enlargedImage = document.getElementById('lightbox-img');
  const closeButton = lightbox.querySelector('.lightbox-close');
  const triggers = Array.from(document.querySelectorAll('.gallery-trigger'));
  const images = triggers.map(trigger => trigger.querySelector('img'));
  let currentIndex = 0;
  let openingTrigger;
  let backdropPress = false;
  let touchStart;

  function imageSource(image) {
    return image.dataset.full || image.src;
  }

  function showImage(index) {
    currentIndex = (index + images.length) % images.length;
    const image = images[currentIndex];
    enlargedImage.src = imageSource(image);
    enlargedImage.alt = image.alt;

    [-1, 1].forEach(offset => {
      const adjacent = images[(currentIndex + offset + images.length) % images.length];
      new Image().src = imageSource(adjacent);
    });
  }

  triggers.forEach((trigger, index) => {
    trigger.addEventListener('click', () => {
      openingTrigger = trigger;
      trigger.focus({ preventScroll: true });
      showImage(index);
      lightbox.showModal();
    });
  });

  closeButton.addEventListener('click', () => lightbox.close());
  lightbox.querySelector('.left').addEventListener('click', () => showImage(currentIndex - 1));
  lightbox.querySelector('.right').addEventListener('click', () => showImage(currentIndex + 1));
  lightbox.addEventListener('close', () => {
    backdropPress = false;
    touchStart = undefined;
    openingTrigger?.focus({ preventScroll: true });
  });

  lightbox.addEventListener('pointerdown', event => {
    backdropPress = event.target === lightbox;
  });
  lightbox.addEventListener('click', event => {
    if (backdropPress && event.target === lightbox) lightbox.close();
  });
  lightbox.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      showImage(currentIndex + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });

  lightbox.addEventListener('touchstart', event => {
    touchStart = event.touches.length === 1 && event.target === enlargedImage
      ? event.touches[0] : undefined;
  }, { passive: true });
  lightbox.addEventListener('touchend', event => {
    if (!touchStart) return;
    const end = event.changedTouches[0];
    const horizontal = touchStart.clientX - end.clientX;
    const vertical = touchStart.clientY - end.clientY;
    touchStart = undefined;
    if (Math.abs(horizontal) > 50 && Math.abs(horizontal) > Math.abs(vertical)) {
      showImage(currentIndex + (horizontal > 0 ? 1 : -1));
    }
  });
  lightbox.addEventListener('touchcancel', () => { touchStart = undefined; });
})();
