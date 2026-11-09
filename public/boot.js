// Runs before first paint (kept as a file so the Content-Security-Policy needs no inline scripts).
(function () {
  var root = document.documentElement;
  root.classList.add('js');
  // Splash intro: homepage only, once per browser session, never with reduced motion.
  try {
    if (location.pathname === '/' && !sessionStorage.getItem('cresta-splash')
        && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      sessionStorage.setItem('cresta-splash', '1');
      root.classList.add('has-splash');
      var end = function () { root.classList.remove('has-splash'); };
      setTimeout(end, 3500);
      document.addEventListener('click', end, { once: true });
      document.addEventListener('keydown', end, { once: true });
    }
  } catch (e) { /* storage blocked: skip the splash */ }
})();
