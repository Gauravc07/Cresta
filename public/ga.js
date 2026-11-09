// Google Analytics 4 loader. Only included when a Measurement ID is set in Admin > Settings.
// Kept as a file so the Content-Security-Policy needs no inline scripts.
(function () {
  var id = document.currentScript && document.currentScript.getAttribute('data-ga');
  if (!id) return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', id);
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
  document.head.appendChild(s);
})();
