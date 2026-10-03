/* Bullhead motion kit. Carousel: native scroll-snap + dots/arrows/keys. Band: scroll-linked reveal. */
(function () {
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function raf(fn) { var w = false; return function () { if (w) return; w = true; requestAnimationFrame(function () { w = false; fn(); }); }; }

  /* ----- carousels ----- */
  Array.prototype.forEach.call(document.querySelectorAll('.bh-car'), function (car) {
    var track = car.querySelector('.bh-car__track'), slides = Array.prototype.slice.call(track.children);
    var dotsBox = car.querySelector('.bh-car__dots'), prev = car.querySelector('[data-prev]'), next = car.querySelector('[data-next]');
    if (!slides.length) return;
    var dots = slides.map(function (_, n) {
      var b = document.createElement('button'); b.type = 'button';
      b.setAttribute('aria-label', 'Photo ' + (n + 1) + ' of ' + slides.length);
      b.addEventListener('click', function () { to(n); });
      dotsBox.appendChild(b); return b;
    });
    var cur = 0;
    function to(n) {
      n = Math.max(0, Math.min(slides.length - 1, n));
      var s = slides[n], left = s.offsetLeft - (track.clientWidth - s.clientWidth) / 2;
      track.scrollTo({ left: left, behavior: still ? 'auto' : 'smooth' });
    }
    var sync = raf(function () {
      var mid = track.scrollLeft + track.clientWidth / 2, best = 0, d = 1e9;
      slides.forEach(function (s, n) { var dd = Math.abs(s.offsetLeft + s.clientWidth / 2 - mid); if (dd < d) { d = dd; best = n; } });
      cur = best;
      dots.forEach(function (b, n) { if (n === cur) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
      if (prev) prev.disabled = cur === 0;
      if (next) next.disabled = cur === slides.length - 1;
    });
    track.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    if (prev) prev.addEventListener('click', function () { to(cur - 1); });
    if (next) next.addEventListener('click', function () { to(cur + 1); });
    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); to(cur + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); to(cur - 1); }
    });
    sync();
  });

  /* ----- reveal bands ----- */
  var bands = Array.prototype.slice.call(document.querySelectorAll('.bh-band'));
  if (!bands.length || still) return;
  bands.forEach(function (band) {
    band.classList.add('is-live');
    var on = false, clamp = function (x) { return Math.max(0, Math.min(1, x)); };
    var upd = raf(function () {
      if (!on) return;
      var r = band.getBoundingClientRect(), vh = window.innerHeight || 800;
      band.style.setProperty('--p', clamp(1 - r.top / vh).toFixed(3));
      band.style.setProperty('--t', clamp((-r.top / Math.max(1, r.height - vh)) * 2.2).toFixed(3));
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { on = es[0].isIntersecting; if (on) upd(); }, { rootMargin: '10% 0px' }).observe(band);
    } else { on = true; }
    window.addEventListener('scroll', upd, { passive: true });
    window.addEventListener('resize', upd);
    upd();
  });
})();

/* ----- walk the strip: sticky pan across the frontage, one counter at a time ----- */
(function () {
  var walk = document.querySelector('.bh-walk');
  if (!walk || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var run = walk.querySelector('.bh-walk__runway'), img = walk.querySelector('.bh-walk__img');
  var stops = Array.prototype.slice.call(walk.querySelectorAll('.bh-walk__stop'));
  var dots = Array.prototype.slice.call(walk.querySelectorAll('.bh-walk__dots li'));
  var fr = stops.map(function (s) { return parseFloat(s.getAttribute('data-x')); });
  if (!run || !img || !stops.length) return;
  walk.classList.add('is-live');
  var on = false, last = -1;
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  var tick = (function () { var w = false; return function () { if (w) return; w = true; requestAnimationFrame(function () { w = false; draw(); }); }; })();
  function draw() {
    if (!on) return;
    var r = run.getBoundingClientRect(), vh = window.innerHeight || 800;
    var p = clamp(-r.top / Math.max(1, r.height - vh), 0, 1);
    var seg = p * (stops.length - 1), i = Math.floor(seg), f = seg - i;
    var vw = img.parentElement.clientWidth, W = img.clientWidth;
    function at(k) { return clamp(vw / 2 - fr[k] * W, vw - W, 0); }
    var a = at(clamp(i, 0, stops.length - 1)), b = at(clamp(i + 1, 0, stops.length - 1));
    var ease = f * f * (3 - 2 * f);
    img.style.setProperty('--x', (a + (b - a) * ease).toFixed(1) + 'px');
    var act = clamp(Math.round(seg), 0, stops.length - 1);
    if (act !== last) { last = act; stops.forEach(function (s, n) { s.classList.toggle('is-on', n === act); }); dots.forEach(function (d, n) { d.classList.toggle('is-on', n === act); }); }
  }
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { on = es[0].isIntersecting; if (on) tick(); }, { rootMargin: '20% 0px' }).observe(run); else on = true;
  window.addEventListener('scroll', tick, { passive: true });
  window.addEventListener('resize', tick);
  if (img.complete) tick(); else img.addEventListener('load', tick);
  tick();
})();
