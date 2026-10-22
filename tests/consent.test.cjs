const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('static/js/consent.js', 'utf8');

function setup(host, enabled = 'true', cookie = '', protocol = 'https:') {
  const element = () => ({
    handlers: {}, dataset: {},
    addEventListener(name, fn) { this.handlers[name] = fn; },
    setAttribute() {}, focus() {}
  });
  const ids = Object.fromEntries(['cookie-consent', 'cookie-preferences', 'cookie-analytics',
    'cookie-embeds', 'cookie-customize', 'site-consent-script'].map(id => [id, element()]));
  ids['site-consent-script'].dataset.analyticsEnabled = enabled;
  const accept = Object.assign(element(), { dataset: { consentChoice: 'all' } });
  const reject = Object.assign(element(), { dataset: { consentChoice: 'none' } });
  const launcher = element();
  const panel = ids['cookie-consent'];
  panel.showModal = () => {};
  panel.close = () => panel.handlers.close();
  panel.querySelectorAll = () => [accept, reject];
  panel.querySelector = () => accept;
  const requests = [];
  const writes = [];
  const handlers = {};
  let reloads = 0;
  const document = {
    get cookie() { return cookie; },
    set cookie(value) { writes.push(value); cookie = value.split(';')[0]; },
    getElementById: id => ids[id],
    querySelector: () => launcher,
    querySelectorAll: selector => selector === '[data-cookie-settings]' ? [launcher] : [],
    createElement: () => ({}),
    head: { appendChild(script) { requests.push(script.src); } }
  };
  const window = {
    location: { hostname: host, protocol, reload() { reloads++; } },
    addEventListener(name, fn) { handlers[name] = fn; }
  };
  vm.runInNewContext(source, {
    document, window, localStorage: { getItem: () => null, removeItem() {} },
    Date, JSON, Boolean, String, Number, Math, encodeURIComponent, decodeURIComponent
  });
  return { window, requests, writes, accept: () => accept.handlers.click(),
    reject: () => reject.handlers.click(), focus: () => handlers.focus(),
    reloads: () => reloads };
}

for (const host of ['sunset-studios.one', 'music.sunset-studios.one']) {
  test(`GTM on ${host} requires consent and the build flag`, () => {
    const page = setup(host);
    assert.equal(page.requests.length, 0);
    page.accept();
    page.focus();
    assert.equal(page.requests.length, 1);
    assert.equal(page.window.sunsetConsent.analytics, true);
    assert.match(page.writes[0], /Domain=sunset-studios.one/);
    page.reject();
    assert.equal(page.window.sunsetConsent.analytics, false);
    assert.equal(page.reloads(), 1);
    const disabled = setup(host, 'false');
    disabled.accept();
    assert.equal(disabled.requests.length, 0);
    assert.equal(disabled.window.sunsetConsent.analytics, false);
  });
}

for (const host of ['staging.sunset-studios.one', 'localhost', 'sunset-studios.one.example.com',
  'www.sunset-studios.one', 'preview.music.sunset-studios.one']) {
  test(`GTM stays blocked and consent isolated on ${host}`, () => {
    const productionCookie = 'sunset-cookie-consent-v1=' + encodeURIComponent(JSON.stringify({
      analytics: true, embeds: true, at: Date.now()
    }));
    const page = setup(host, 'true', productionCookie);
    page.accept();
    page.focus();
    assert.equal(page.requests.length, 0);
    assert.equal(page.window.sunsetConsent.analytics, false);
    assert.match(page.writes[0], /^sunset-preview-consent-v1=/);
    assert.doesNotMatch(page.writes[0], /Domain=/);
  });
}

test('GTM fails closed without the build flag or HTTPS', () => {
  for (const [flag, protocol] of [['', 'https:'], ['true', 'http:']]) {
    const page = setup('sunset-studios.one', flag, '', protocol);
    page.accept();
    assert.equal(page.requests.length, 0);
    assert.equal(page.window.sunsetConsent.analytics, false);
  }
});
