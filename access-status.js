// ============================================
//   Crucible — download dialog logic
// ============================================
//
// Opens the platform-picker download dialog when the visitor clicks any
// element with [data-open-download], or arrives at a URL with #download.

(function () {
  function getDialog() { return document.getElementById('download-dialog'); }

  // Event delegation for open / close buttons
  document.addEventListener('click', (e) => {
    const opener = e.target.closest('[data-open-download]');
    if (opener) {
      e.preventDefault();
      const dlg = getDialog();
      if (dlg) {
        dlg.showModal();
      } else {
        location.href = '/#download';
      }
      return;
    }
    const closer = e.target.closest('[data-close-download]');
    if (closer) {
      getDialog()?.close();
      const href = closer.getAttribute('href');
      if (!href || href === '#') {
        e.preventDefault();
      }
    }
  });

  // Close on backdrop click + auto-open if URL has #download
  document.addEventListener('DOMContentLoaded', () => {
    const dlg = getDialog();
    if (dlg) {
      dlg.addEventListener('click', (e) => {
        if (e.target === dlg) dlg.close();
      });
      if (location.hash === '#download') {
        dlg.showModal();
        history.replaceState(null, '', location.pathname);
      }
    }
  });
})();
