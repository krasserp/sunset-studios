(() => {
  const form = document.getElementById('availability-form');
  if (!form || !form.dataset.endpoint) return;
  const button = form.querySelector('button[type="submit"]');
  const status = document.getElementById('form-status');
  const start = form.elements.start_date;
  const end = form.elements.end_date;
  const validateDates = () => {
    end.min = start.value;
    end.setCustomValidity(end.value && start.value && end.value < start.value
      ? 'End date must be on or after the start date.' : '');
  };
  start.addEventListener('change', validateDates);
  end.addEventListener('change', validateDates);
  let submitting = false;
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    validateDates();
    if (submitting || !form.reportValidity()) return;
    submitting = true;
    button.disabled = true;
    status.textContent = 'Sending your enquiry…';
    const fields = Object.fromEntries(new FormData(form));
    try {
      const response = await fetch(form.dataset.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(fields),
        signal: AbortSignal.timeout(20000)
      });
      if (!response.ok) throw new Error('Submission was not accepted');
    } catch (error) {
      status.textContent = 'We could not confirm delivery. Please try again or email phil@sunset-studios.one.';
      submitting = false;
      button.disabled = false;
      return;
    }
    // Only accepted enquiries count. Never send names, email, messages or dates to GTM.
    window.dataLayer = window.dataLayer || [];
    if (window.sunsetConsent?.analytics) window.dataLayer.push({
      event: 'form_submitted',
      form_id: 'availability-form',
      project_type: fields.project_type,
      people_count: Number(fields.people_count)
    });
    form.reset();
    status.textContent = 'Thank you — your enquiry has been sent. We’ll reply by email.';
    button.textContent = 'Enquiry sent';
  });
})();
