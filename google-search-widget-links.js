/* Keep Google's Search Suggestions HTML unchanged while ensuring links
   navigate outside the embedded iframe instead of vanishing inside it. */
(() => {
  const iframe = document.getElementById('mealAiGoogleSearchWidget');
  if (!iframe) return;
  const marker = '<base target="_blank">';
  const normalize = () => {
    const original = iframe.getAttribute('srcdoc');
    if (!original || original.includes(marker)) return;
    // The base target affects only the browsing destination of links.
    // Google's supplied widget markup, CSS and content are preserved intact.
    iframe.setAttribute('srcdoc', marker + original);
  };
  new MutationObserver(normalize).observe(iframe, {
    attributes: true,
    attributeFilter: ['srcdoc']
  });
  normalize();
})();