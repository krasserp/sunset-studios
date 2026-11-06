const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('assets/js/meta-events.js', 'utf8');
const plain = value => JSON.parse(JSON.stringify(value));

function setup({ marketing = true, pixel = true } = {}) {
  const events = [], listeners = [];
  const window = { sunsetConsent: { marketing }, location: { href: 'https://sunset-studios.one/' } };
  if (pixel) window.fbq = (...args) => events.push(args);
  const context = vm.createContext({ window, URL,
    document: { addEventListener(name, handler) { listeners.push({ name, handler }); } } });
  vm.runInContext(source, context);
  return { window, events, listeners, loadAgain: () => vm.runInContext(source, context),
    click({ href, action, tag = 'A', button = 0, defaultPrevented = false, disabled = false } = {}) {
      const link = { tagName: tag, href, dataset: { metaEvent: action }, disabled };
      // A nested text/SVG element resolves to its single closest matching control.
      const target = { closest: () => (tag === 'A' && href) || (tag === 'BUTTON' && action) ? link : null };
      listeners.forEach(({ handler }) => handler({ target, button, defaultPrevented }));
    }
  };
}

for (const href of ['https://wa.me/34828991139?text=Private%20message', 'https://api.whatsapp.com/send?phone=1234']) {
  test(`WhatsApp destination produces one Contact: ${new URL(href).hostname}`, () => {
    const page = setup(); page.click({ href });
    assert.deepEqual(plain(page.events), [['track', 'Contact', { contact_method: 'whatsapp' }]]);
  });
}

test('mailto destination produces one Contact with no email in the payload', () => {
  const page = setup(); page.click({ href: 'mailto:phil@sunset-studios.one?subject=Private' });
  assert.deepEqual(plain(page.events), [['track', 'Contact', { contact_method: 'email' }]]);
});

for (const [action, name] of [['availability', 'CheckAvailability'], ['flights', 'CheckFlights'], ['location', 'ViewLocation']]) {
  test(`nested CTA click produces one ${name}`, () => {
    const page = setup(); page.click({ href: '/contact/#availability-form', action });
    assert.deepEqual(plain(page.events), [['trackCustom', name]]);
  });
}

test('explicit CTA buttons work without blocking their default action', () => {
  const page = setup(); page.click({ tag: 'BUTTON', action: 'availability' });
  assert.deepEqual(plain(page.events), [['trackCustom', 'CheckAvailability']]);
});

test('ordinary navigation, Send Enquiry, unsafe URLs and lookalike domains do not count', () => {
  const page = setup();
  for (const href of ['/contact/', '/contact/#find-us-title', '/studio-services/',
    'https://wa.me.example.com/', 'https://example.com/?next=api.whatsapp.com', 'tel:+341234', 'javascript:void(0)']) {
    page.click({ href });
  }
  page.click({ tag: 'BUTTON' });
  page.click({ tag: 'BUTTON', action: 'lead' });
  page.click({ href: '/contact/', action: 'unknown' });
  assert.deepEqual(page.events, []);
});

test('cancelled, right clicks and disabled controls do not count', () => {
  const page = setup();
  page.click({ href: 'https://wa.me/123', defaultPrevented: true });
  page.click({ href: 'https://wa.me/123', button: 2 });
  page.click({ tag: 'BUTTON', action: 'availability', disabled: true });
  assert.deepEqual(page.events, []);
});

test('duplicate script execution still registers exactly one delegated listener', () => {
  const page = setup(); page.loadAgain();
  assert.equal(page.listeners.length, 1);
  assert.equal(page.listeners[0].name, 'click');
  page.click({ href: 'https://wa.me/123' });
  assert.equal(page.events.length, 1);
});

for (const options of [{ marketing: false }, { marketing: undefined }, { pixel: false }]) {
  test(`no marketing permission or missing pixel means no events: ${JSON.stringify(options)}`, () => {
    const page = setup(options);
    // Explicitly cover a missing consent object as well as a false flag.
    if (options.marketing === undefined && options.pixel !== false) page.window.sunsetConsent = undefined;
    page.click({ href: 'mailto:test@example.com' });
    page.click({ href: 'https://wa.me/123' });
    page.click({ href: '/contact/', action: 'availability' });
    page.window.sunsetTrackMeta('lead');
    assert.deepEqual(page.events, []);
  });
}

test('withdrawn marketing consent stops subsequent events immediately', () => {
  const page = setup(); page.click({ href: 'https://wa.me/123' });
  page.window.sunsetConsent.marketing = false;
  page.click({ href: 'mailto:test@example.com' }); page.window.sunsetTrackMeta('lead');
  assert.equal(page.events.length, 1);
});

test('tracking failures never interrupt navigation or throw to the form', () => {
  const page = setup(); page.window.fbq = () => { throw new Error('Blocked pixel'); };
  assert.doesNotThrow(() => page.click({ href: 'mailto:test@example.com' }));
  assert.doesNotThrow(() => page.window.sunsetTrackMeta('lead'));
});
