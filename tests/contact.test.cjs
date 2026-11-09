const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('assets/js/contact.js', 'utf8');
const tracking = fs.readFileSync('assets/js/meta-events.js', 'utf8');
const plain = value => JSON.parse(JSON.stringify(value));

function setup({ analytics = true, marketing = true, pixel = true, valid = true,
  response = async () => ({ ok: true }) } = {}) {
  const requests = [];
  const events = [];
  const button = { disabled: false, textContent: 'Send enquiry' };
  const status = { textContent: '' };
  const fields = {
    dates: 'Flexible test dates', project_name: 'Tracking test',
    project_type: 'recording', email: 'test@example.com'
  };
  let resets = 0;
  const form = {
    dataset: { endpoint: 'https://formspree.io/f/test' },
    querySelector: () => button,
    reportValidity: () => valid,
    reset: () => { resets++; },
    addEventListener: (_name, handler) => { form.submit = handler; }
  };
  const window = { sunsetConsent: { analytics, marketing } };
  if (pixel) window.fbq = (...args) => events.push(args);
  const context = vm.createContext({
    window,
    document: { getElementById: id => id === 'availability-form' ? form : status, addEventListener() {} },
    URL,
    FormData: function () { return new Map(Object.entries(fields)); },
    AbortSignal,
    fetch: (...args) => { requests.push(args); return response(...args); }
  });
  vm.runInContext(tracking, context);
  vm.runInContext(source, context);
  return {
    window, button, status, requests, events,
    resets: () => resets,
    submit: () => form.submit({ preventDefault() {} })
  };
}

test('one accepted enquiry sends one Lead and preserves the Google event', async () => {
  let accept;
  const page = setup({ response: () => new Promise(resolve => { accept = resolve; }) });
  assert.equal(page.events.length, 0);
  const pending = page.submit();
  await page.submit();
  assert.equal(page.requests.length, 1);
  assert.equal(page.events.length, 0);
  assert.equal(page.window.dataLayer, undefined);
  assert.equal(page.button.disabled, true);

  accept({ ok: true });
  await pending;
  await page.submit();
  assert.equal(page.requests.length, 1);
  assert.deepEqual(plain(page.events), [
    ['track', 'Lead', { content_name: 'Studio Enquiry' }]
  ]);
  assert.equal(page.window.dataLayer.length, 1);
  assert.deepEqual(plain(page.window.dataLayer), [{
    event: 'form_submitted', form_id: 'availability-form', project_type: 'recording'
  }]);
  assert.equal(page.resets(), 1);
  assert.match(page.status.textContent, /Thank you/);
});

for (const [name, response] of [
  ['rejected response', async () => ({ ok: false })],
  ['network failure', async () => { throw new TypeError('Network failure'); }],
  ['timeout', async () => { throw new DOMException('Timed out', 'TimeoutError'); }]
]) {
  test(`${name} sends no tracking and leaves the form available for retry`, async () => {
    const page = setup({ response });
    await page.submit();
    assert.equal(page.events.length, 0);
    assert.equal(page.window.dataLayer, undefined);
    assert.equal(page.resets(), 0);
    assert.equal(page.button.disabled, false);
    assert.match(page.status.textContent, /could not confirm delivery/);
  });
}

test('a successful retry produces one Lead after a failed attempt', async () => {
  let attempts = 0;
  const page = setup({ response: async () => ({ ok: ++attempts > 1 }) });
  await page.submit();
  await page.submit();
  assert.equal(page.requests.length, 2);
  assert.equal(page.events.length, 1);
  assert.equal(page.window.dataLayer.length, 1);
});

for (const consent of [false, undefined]) {
  test(`accepted enquiry without either consent (${consent}) sends no events`, async () => {
    const page = setup();
    page.window.sunsetConsent = consent === undefined ? undefined : { analytics: false, marketing: false };
    await page.submit();
    assert.equal(page.events.length, 0);
    assert.deepEqual(plain(page.window.dataLayer), []);
    assert.equal(page.resets(), 1);
    assert.match(page.status.textContent, /Thank you/);
  });
}

test('marketing-only consent sends Lead without changing Google consent', async () => {
  const page = setup({ analytics: false, marketing: true });
  await page.submit();
  assert.deepEqual(plain(page.events), [['track', 'Lead', { content_name: 'Studio Enquiry' }]]);
  assert.deepEqual(plain(page.window.dataLayer), []);
});

test('analytics-only consent sends the Google event without a Meta Lead', async () => {
  const page = setup({ analytics: true, marketing: false });
  await page.submit();
  assert.equal(page.events.length, 0);
  assert.equal(page.window.dataLayer.length, 1);
});

test('withdrawing marketing while a request is pending prevents Lead on success', async () => {
  let accept;
  const page = setup({ response: () => new Promise(resolve => { accept = resolve; }) });
  const pending = page.submit();
  page.window.sunsetConsent.marketing = false;
  accept({ ok: true });
  await pending;
  assert.equal(page.events.length, 0);
  assert.equal(page.window.dataLayer.length, 1);
  assert.equal(page.resets(), 1);
});

test('a throwing Pixel does not hide a successful enquiry', async () => {
  const page = setup();
  page.window.fbq = () => { throw new Error('Pixel unavailable'); };
  await page.submit();
  assert.equal(page.window.dataLayer.length, 1);
  assert.equal(page.resets(), 1);
  assert.match(page.status.textContent, /Thank you/);
});

test('missing Meta Pixel does not prevent Google tracking or submission confirmation', async () => {
  const page = setup({ pixel: false });
  await page.submit();
  assert.equal(page.window.dataLayer.length, 1);
  assert.equal(page.events.length, 0);
  assert.equal(page.resets(), 1);
  assert.match(page.status.textContent, /Thank you/);
});

test('invalid form does not submit or send tracking', async () => {
  const page = setup({ valid: false });
  await page.submit();
  assert.equal(page.requests.length, 0);
  assert.equal(page.events.length, 0);
  assert.equal(page.window.dataLayer, undefined);
});

test('withdrawing Analytics while pending prevents conversion and never replays it', async () => {
  let accept;
  const page = setup({ response: () => new Promise(resolve => { accept = resolve; }) });
  const pending = page.submit();
  page.window.sunsetConsent.analytics = false;
  accept({ ok: true });
  await pending;
  assert.deepEqual(plain(page.window.dataLayer), []);
  assert.equal(page.events.length, 1);
  page.window.sunsetConsent.analytics = true;
  await page.submit();
  assert.deepEqual(plain(page.window.dataLayer), []);
  assert.equal(page.requests.length, 1);
});

test('a later accepted enquiry on a fresh page produces its own form_submitted event', async () => {
  for (let enquiry = 0; enquiry < 2; enquiry++) {
    const page = setup();
    assert.equal(page.window.dataLayer, undefined);
    await page.submit();
    assert.equal(page.window.dataLayer.length, 1);
  }
});
