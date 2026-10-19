(() => {
  const header = document.querySelector('.site-header');
  const toggle = header.querySelector('.nav-toggle');
  const navigation = header.querySelector('.nav');
  const mobile = window.matchMedia('(max-width: 640px)');
  function setOpen(open) {
    toggle.setAttribute('aria-expanded', String(open));
    header.classList.toggle('nav-open', open);
  }
  header.classList.add('nav-enhanced');
  toggle.hidden = false;
  toggle.addEventListener('click', () => {
    setOpen(toggle.getAttribute('aria-expanded') !== 'true');
  });
  navigation.addEventListener('click', event => {
    if (event.target.closest('a')) setOpen(false);
  });
  header.addEventListener('keydown', event => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      toggle.focus();
    }
  });
  document.addEventListener('click', event => {
    if (!header.contains(event.target)) setOpen(false);
  });
  header.addEventListener('focusout', event => {
    if (!header.contains(event.relatedTarget)) setOpen(false);
  });
  mobile.addEventListener('change', () => {
    if (navigation.contains(document.activeElement) && mobile.matches) toggle.focus();
    setOpen(false);
  });
})();
