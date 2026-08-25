// ============================================
//   Crucible — Issue Report submission logic
// ============================================
//
// Handles the "Report an Issue" dialog. Submits to the same
// Google Apps Script web app as the CRM, with action=report-issue.
// Pre-fills email/GitHub from the stored access identity.

(function () {
  const SUBMIT_URL = 'https://crucible-issues-api.emberagentic.workers.dev/submit';
  const ACCESS_STORAGE_KEY = 'crucible-access-identity';

  function getStoredIdentity() {
    try { return JSON.parse(localStorage.getItem(ACCESS_STORAGE_KEY) || '{}'); } catch (_) { return {}; }
  }

  function getDialog() { return document.getElementById('issue-dialog'); }
  function getForm()   { return document.getElementById('issue-form'); }

  // ─── Pre-fill from stored identity ───────────────────────────────
  function prefill() {
    const id = getStoredIdentity();
    const form = getForm();
    if (!form) return;
    const emailField = form.querySelector('[name="email"]');
    const ghField    = form.querySelector('[name="github"]');
    if (emailField && id.email && !emailField.value) emailField.value = id.email;
    if (ghField && id.ghUser && !ghField.value)      ghField.value = id.ghUser;
  }

  // ─── Submit ──────────────────────────────────────────────────────
  async function submitIssue(form) {
    const status = form.querySelector('.issue-status');
    const btn    = form.querySelector('button[type="submit"]');
    const origText = btn.textContent;

    btn.disabled = true;
    btn.textContent = 'Submitting...';
    if (status) { status.textContent = ''; status.className = 'issue-status'; }

    const data = {
      action:      'report-issue',
      email:       form.querySelector('[name="email"]')?.value.trim() || '',
      github:      form.querySelector('[name="github"]')?.value.trim() || '',
      category:    form.querySelector('[name="category"]')?.value || 'bug',
      summary:     form.querySelector('[name="summary"]')?.value.trim() || '',
      description: form.querySelector('[name="description"]')?.value.trim() || '',
      page_url:    location.href,
      user_agent:  navigator.userAgent
    };

    if (!data.summary) {
      if (status) { status.textContent = 'Please enter a summary.'; status.className = 'issue-status issue-status-error'; }
      btn.disabled = false;
      btn.textContent = origText;
      return;
    }

    try {
      const r = await fetch(SUBMIT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await r.json();
      if (result.status === 'ok' || result.result === 'ok') {
        if (status) { status.textContent = 'Issue submitted — thank you!'; status.className = 'issue-status issue-status-ok'; }
        form.reset();
        prefill();
        setTimeout(() => { getDialog()?.close(); }, 1800);
      } else {
        throw new Error(result.error || 'Submission failed');
      }
    } catch (e) {
      if (status) { status.textContent = 'Failed to submit — try emailing tony@emberagenticlabs.com'; status.className = 'issue-status issue-status-error'; }
    } finally {
      btn.disabled = false;
      btn.textContent = origText;
    }
  }

  // ─── Event delegation ────────────────────────────────────────────
  document.addEventListener('click', (e) => {
    const opener = e.target.closest('[data-open-issue]');
    if (opener) {
      e.preventDefault();
      const dlg = getDialog();
      if (dlg) { dlg.showModal(); prefill(); }
      return;
    }
    const closer = e.target.closest('[data-close-issue]');
    if (closer) {
      e.preventDefault();
      getDialog()?.close();
    }
  });

  document.addEventListener('DOMContentLoaded', () => {
    const dlg = getDialog();
    if (dlg) {
      dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
    }
    const form = getForm();
    if (form) {
      form.addEventListener('submit', (e) => { e.preventDefault(); submitIssue(form); });
    }
  });
})();
