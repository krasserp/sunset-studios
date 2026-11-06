const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('assets/js/consent.js', 'utf8');
const plain = value => JSON.parse(JSON.stringify(value));
const queue = page => Array.from(page.window.fbq.queue, args => Array.from(args));
const cookieFor = choice => 'sunset-cookie-consent-v1=' + encodeURIComponent(JSON.stringify(choice));
const gtm = 'https://www.googletagmanager.com/gtm.js?id=GTM-KV9P8PLM';
const pixel = 'https://connect.facebook.net/en_US/fbevents.js';

function setup({ host = 'sunset-studios.one', analyticsEnabled = 'true', marketingEnabled = 'true',
  cookie = '', protocol = 'https:', previous = null } = {}) {
  const element = () => ({
    handlers: {}, dataset: {},
    addEventListener(name, fn) { this.handlers[name] = fn; },
    setAttribute() {}, focus() {}
  });
  const ids = Object.fromEntries(['cookie-consent', 'cookie-preferences', 'cookie-analytics',
    'cookie-marketing', 'cookie-embeds', 'cookie-customize', 'site-consent-script']
    .map(id => [id, element()]));
  Object.assign(ids['site-consent-script'].dataset, { analyticsEnabled, marketingEnabled });
  const buttons = Object.fromEntries(['all', 'none', 'custom'].map(mode => [mode,
    Object.assign(element(), { dataset: { consentChoice: mode } })]));
  const launcher = element();
  const panel = ids['cookie-consent'];
  panel.showModal = () => { panel.open = true; };
  panel.close = () => { panel.open = false; panel.handlers.close(); };
  panel.querySelectorAll = () => Object.values(buttons);
  panel.querySelector = () => buttons.all;
  const frame = { dataset: { consentSrc: 'https://www.google.com/maps?test=1' },
    removeAttribute(name) { delete this[name]; } };
  const note = {};
  const requests = [], writes = [], handlers = {};
  let reloads = 0;
  const document = {
    get cookie() { return cookie; },
    set cookie(value) { writes.push(value); cookie = value.split(';')[0]; },
    getElementById: id => ids[id],
    querySelector: () => launcher,
    querySelectorAll: selector => ({
      '[data-cookie-settings]': [launcher],
      'iframe[data-consent-src]': [frame], '.embed-consent-note': [note]
    })[selector] || [],
    createElement: () => ({}),
    head: { appendChild(script) { requests.push(script.src); } }
  };
  const window = {
    location: { hostname: host, protocol, reload() { reloads++; } },
    addEventListener(name, fn) { handlers[name] = fn; }
  };
  vm.runInNewContext(source, {
    document, window, localStorage: { getItem: () => JSON.stringify(previous), removeItem() {} },
    Date, JSON, Boolean, String, Number, Math, encodeURIComponent, decodeURIComponent
  });
  return { window, requests, writes, panel, frame, note,
    accept: () => buttons.all.handlers.click(), reject: () => buttons.none.handlers.click(),
    save(choice) {
      for (const key of ['analytics', 'marketing', 'embeds']) ids['cookie-' + key].checked = !!choice[key];
      buttons.custom.handlers.click();
    },
    focus: () => handlers.focus(), setCookie: value => { cookie = value; },
    reloads: () => reloads
  };
}

for (const host of ['sunset-studios.one', 'music.sunset-studios.one']) {
  test(`Accept All enables independent categories once on ${host}`, () => {
    const page = setup({ host });
    assert.equal(page.requests.length, 0);
    assert.equal(page.window.fbq, undefined);
    page.accept(); page.focus(); page.accept();
    assert.deepEqual(page.requests, [gtm, pixel]);
    assert.deepEqual(queue(page), [
      ['set', 'autoConfig', false, '990608840778572'],
      ['init', '990608840778572'], ['track', 'PageView']
    ]);
    assert.deepEqual(plain(page.window.sunsetConsent), { analytics: true, marketing: true, embeds: true });
    assert.match(page.writes[0], /Domain=sunset-studios.one/);
    assert.match(decodeURIComponent(page.writes[0]), /"marketing":true/);
    page.reject();
    assert.deepEqual(plain(page.window.sunsetConsent), { analytics: false, marketing: false, embeds: false });
    assert.deepEqual(queue(page).at(-1), ['consent', 'revoke']);
    assert.equal(page.reloads(), 1);
  });
}

test('analytics-only consent loads Google but never Meta', () => {
  const page = setup(); page.save({ analytics: true }); page.focus();
  assert.deepEqual(page.requests, [gtm]);
  assert.equal(page.window.fbq, undefined);
  assert.equal(page.window.sunsetConsent.marketing, false);
});

test('marketing-only consent loads Meta without Google and keeps PageView once', () => {
  const page = setup(); page.save({ marketing: true }); page.focus();
  assert.deepEqual(page.requests, [pixel]);
  assert.equal(page.window.dataLayer, undefined);
  assert.equal(page.window.sunsetConsent.analytics, false);
  assert.equal(queue(page).filter(x => x[1] === 'PageView').length, 1);
});

test('embedded content still works independently of analytics and marketing', () => {
  const page = setup();
  assert.equal(page.frame.src, undefined);
  page.save({ embeds: true });
  assert.equal(page.frame.src, page.frame.dataset.consentSrc);
  assert.equal(page.note.hidden, true);
  assert.deepEqual(page.requests, []);
  page.reject();
  assert.equal(page.frame.src, undefined);
  assert.equal(page.frame.hidden, true);
  assert.equal(page.reloads(), 0);
});

test('rejecting optional services never starts Meta', () => {
  const page = setup(); page.reject(); page.focus();
  assert.deepEqual(page.requests, []);
  assert.equal(page.window.fbq, undefined);
});

for (const storage of ['cookie', 'localStorage']) {
  test(`legacy ${storage} analytics consent does not authorize marketing`, () => {
    const legacy = { analytics: true, embeds: true, at: Date.now() - 1000 };
    const page = setup(storage === 'cookie' ? { cookie: cookieFor(legacy) } : { previous: legacy });
    assert.deepEqual(page.requests, [gtm]);
    assert.equal(page.window.fbq, undefined);
    assert.equal(page.window.sunsetConsent.marketing, false);
    assert.equal(page.frame.src, page.frame.dataset.consentSrc);
    if (storage === 'localStorage') {
      assert.match(decodeURIComponent(page.writes[0]), /"marketing":false/);
    }
  });
}

test('saved explicit marketing consent starts Meta on the next page load', () => {
  const page = setup({ cookie: cookieFor({ analytics: false, marketing: true, embeds: false, at: Date.now() }) });
  assert.deepEqual(page.requests, [pixel]);
  assert.equal(page.window.sunsetConsent.marketing, true);
  assert.equal(page.panel.hidden, true);
});

for (const choice of [
  { analytics: true, marketing: true, embeds: true, at: Date.now() - 181 * 86400000 },
  { analytics: true, marketing: true, embeds: true, at: Date.now() + 86400000 },
  { analytics: true, marketing: 'yes', embeds: true, at: Date.now() }
]) {
  test(`invalid or expired consent fails closed (${choice.marketing}, ${choice.at})`, () => {
    const page = setup({ cookie: cookieFor(choice) });
    assert.deepEqual(page.requests, []);
    assert.equal(page.window.sunsetConsent.marketing, false);
    assert.equal(page.panel.open, true);
  });
}

test('withdrawing marketing stops Meta immediately, reloads, and preserves analytics choice', () => {
  const page = setup(); page.accept(); page.save({ analytics: true, marketing: false, embeds: true });
  assert.equal(page.window.sunsetConsent.marketing, false);
  assert.equal(page.window.sunsetConsent.analytics, true);
  assert.deepEqual(queue(page).at(-1), ['consent', 'revoke']);
  assert.equal(page.reloads(), 1);
  assert.deepEqual(page.requests, [gtm, pixel]);
});

test('focus honors marketing withdrawn on the other production host', () => {
  const page = setup(); page.accept();
  page.setCookie(cookieFor({ analytics: true, marketing: false, embeds: true, at: Date.now() }));
  page.focus();
  assert.equal(page.window.sunsetConsent.marketing, false);
  assert.equal(page.window.sunsetConsent.analytics, true);
  assert.equal(page.reloads(), 1);
});

test('deleted shared consent disables effective state before reloading', () => {
  const page = setup(); page.accept(); page.setCookie(''); page.focus();
  assert.deepEqual(plain(page.window.sunsetConsent), { analytics: false, marketing: false, embeds: false });
  assert.equal(page.reloads(), 1);
});

for (const host of ['staging.sunset-studios.one', 'localhost', 'sunset-studios.one.example.com',
  'www.sunset-studios.one', 'preview.music.sunset-studios.one']) {
  test(`tracking stays blocked and consent isolated on ${host}`, () => {
    const page = setup({ host, cookie: cookieFor({ analytics: true, marketing: true, embeds: true, at: Date.now() }) });
    page.accept(); page.focus();
    assert.deepEqual(page.requests, []);
    assert.equal(page.window.sunsetConsent.marketing, false);
    assert.equal(page.window.sunsetConsent.analytics, false);
    assert.match(page.writes[0], /^sunset-preview-consent-v1=/);
    assert.doesNotMatch(page.writes[0], /Domain=/);
  });
}

test('marketing and analytics build switches work independently', () => {
  const google = setup({ marketingEnabled: 'false' }); google.accept();
  assert.deepEqual(google.requests, [gtm]);
  assert.equal(google.window.sunsetConsent.marketing, false);
  const meta = setup({ analyticsEnabled: 'false' }); meta.accept();
  assert.deepEqual(meta.requests, [pixel]);
  assert.equal(meta.window.sunsetConsent.analytics, false);
});

test('both trackers fail closed without build flags or HTTPS', () => {
  for (const options of [ { analyticsEnabled: '', marketingEnabled: '' }, { protocol: 'http:' } ]) {
    const page = setup(options); page.accept();
    assert.deepEqual(page.requests, []);
    assert.equal(page.window.sunsetConsent.analytics, false);
    assert.equal(page.window.sunsetConsent.marketing, false);
  }
});
