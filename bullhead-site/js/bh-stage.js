/* Bullhead stage layer. Hero slideshow (crossfade + push-in), depth parallax, 3D tilt, magnetic CTAs. */
(function () {
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ----- hero slideshow ----- */
  var hero = document.querySelector('.hero[data-stage]');
  var media = hero && hero.querySelector('.hero-media');
  var first = media && media.querySelector('#heroImg');
  if (hero && media && first) {
    var list; try { list = JSON.parse(hero.getAttribute('data-stage')); } catch (e) { list = null; }
    if (list && list.length > 1) {
      var deck = document.createElement('div'); deck.className = 'st-deck';
      var origins = ['50% 60%', '30% 55%', '70% 50%', '50% 40%'];
      function wrap(img, n) { var w = document.createElement('div'); w.className = 'st-slide'; w.style.setProperty('--o', origins[n % origins.length]); w.appendChild(img); return w; }
      first.parentNode.insertBefore(deck, first);
      var slides = [wrap(first, 0)]; deck.appendChild(slides[0]); slides[0].classList.add('on');
      var ui = document.createElement('div'); ui.className = 'st-ui';
      var segsBox = document.createElement('div'); segsBox.className = 'st-segs';
      var tag = document.createElement('p'); tag.className = 'st-tag'; tag.setAttribute('aria-live', 'off');
      ui.appendChild(segsBox); ui.appendChild(tag); hero.appendChild(ui);
      var segs = [], cur = 0, DUR = 6.5;
      ui.style.setProperty('--dur', DUR + 's'); segsBox.style.setProperty('--dur', DUR + 's');
      list.forEach(function (it, n) {
        var b = document.createElement('button'); b.type = 'button'; b.className = 'st-seg';
        b.setAttribute('aria-label', 'Show photo ' + (n + 1) + ' of ' + list.length + ': ' + it.t);
        b.appendChild(document.createElement('i'));
        b.addEventListener('click', function () { go(n); });
        segsBox.appendChild(b); segs.push(b);
      });
      function setTag(n) { var it = list[n]; tag.innerHTML = '<b></b>'; tag.firstChild.textContent = it.t; if (it.d) tag.appendChild(document.createTextNode(' \u2014 ' + it.d)); tag.classList.remove('swap'); void tag.offsetWidth; tag.classList.add('swap'); }
      function mark(n) { segs.forEach(function (b, k) { b.classList.toggle('done', k < n); b.classList.toggle('on', k === n); if (k === n) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); }); }
      function build(n) {
        if (slides[n]) return slides[n];
        var im = new Image(); im.decoding = 'async'; im.alt = list[n].a || ''; im.src = list[n].s; if (list[n].p) im.style.objectPosition = list[n].p;
        if (list[n].w) im.srcset = list[n].w;
        var w = wrap(im, n); deck.appendChild(w); slides[n] = w; return w;
      }
      function go(n) {
        n = (n + list.length) % list.length; if (n === cur) { mark(n); return; }
        var target = build(n), leave = slides[cur];
        var show = function () {
          leave.classList.remove('on'); leave.classList.add('out');
          target.classList.remove('out'); target.classList.add('on');
          setTimeout(function () { leave.classList.remove('out'); }, 1400);
          cur = n; mark(n); setTag(n); build((n + 1) % list.length);
        };
        var im = target.firstChild; if (im.complete) show(); else { im.addEventListener('load', show, { once: true }); im.addEventListener('error', function () { go(n + 1); }, { once: true }); }
      }
      segsBox.addEventListener('animationend', function (e) { if (e.animationName === 'st-fill' && !still) go(cur + 1); });
      mark(0); setTag(0);
      var boot = function () { build(1); };
      if (document.readyState === 'complete') boot(); else window.addEventListener('load', boot);
      if (still) { segs.forEach(function (b) { b.style.setProperty('--dur', '0s'); }); }
      /* pause: hover, tab hidden, off screen */
      var onScreen = true;
      function pause(v) { hero.classList.toggle('is-paused', v || !onScreen || document.hidden); }
      hero.addEventListener('mouseenter', function () { if (fine) pause(true); });
      hero.addEventListener('mouseleave', function () { pause(false); });
      document.addEventListener('visibilitychange', function () { pause(false); });
      if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { onScreen = es[0].isIntersecting; pause(false); }, { threshold: .15 }).observe(hero);
      /* swipe */
      var x0 = null, y0 = null;
      hero.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
      hero.addEventListener('touchend', function (e) {
        if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0; x0 = null;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) go(cur + (dx < 0 ? 1 : -1));
      }, { passive: true });
      hero.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') go(cur + 1); if (e.key === 'ArrowLeft') go(cur - 1); });
    }
    /* depth parallax: copy drifts one way, photo the other */
    if (fine && !still) {
      var tk = false, px = 0, py = 0;
      hero.addEventListener('pointermove', function (e) {
        var r = hero.getBoundingClientRect(); px = (e.clientX - r.left) / r.width * 2 - 1; py = (e.clientY - r.top) / r.height * 2 - 1;
        if (tk) return; tk = true; requestAnimationFrame(function () { tk = false; hero.style.setProperty('--px', px.toFixed(3)); hero.style.setProperty('--py', py.toFixed(3)); });
      });
      hero.addEventListener('pointerleave', function () { hero.style.setProperty('--px', 0); hero.style.setProperty('--py', 0); });
    }
  }

  /* ----- 3D tilt ----- */
  if (fine && !still) {
    Array.prototype.forEach.call(document.querySelectorAll('.zones-grid .explore-card, .bh-card'), function (c) {
      c.classList.add('st-tilt');
      var tk = false;
      c.addEventListener('pointermove', function (e) {
        var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        if (tk) return; tk = true;
        requestAnimationFrame(function () {
          tk = false; c.classList.add('is-live');
          c.style.setProperty('--ry', ((x - .5) * 10).toFixed(2) + 'deg'); c.style.setProperty('--rx', ((.5 - y) * 8).toFixed(2) + 'deg');
          c.style.setProperty('--gx', (x * 100).toFixed(1) + '%'); c.style.setProperty('--gy', (y * 100).toFixed(1) + '%');
        });
      });
      c.addEventListener('pointerleave', function () { c.classList.remove('is-live'); c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg'); });
    });
    /* magnetic CTAs */
    Array.prototype.forEach.call(document.querySelectorAll('.hero-actions .btn, .btn-primary'), function (b) {
      b.addEventListener('pointermove', function (e) { var r = b.getBoundingClientRect(); b.style.setProperty('--mx', ((e.clientX - r.left - r.width / 2) * .18).toFixed(1) + 'px'); b.style.setProperty('--my', ((e.clientY - r.top - r.height / 2) * .28).toFixed(1) + 'px'); });
      b.addEventListener('pointerleave', function () { b.style.setProperty('--mx', '0px'); b.style.setProperty('--my', '0px'); });
    });
  }
})();

/* ----- inner-page reels: crossfading photo sets behind the page hero ----- */
(function () {
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  Array.prototype.forEach.call(document.querySelectorAll('.page-hero[data-reel]'), function (ph) {
    var list; try { list = JSON.parse(ph.getAttribute('data-reel')); } catch (e) { return; }
    var img = ph.querySelector(':scope > img'); if (!img || !list || list.length < 2) return;
    var deck = document.createElement('div'); deck.className = 'st-deck';
    function wrap(im, n) { var w = document.createElement('div'); w.className = 'st-slide'; w.style.setProperty('--o', ['50% 55%', '35% 50%', '65% 50%'][n % 3]); w.appendChild(im); return w; }
    img.parentNode.insertBefore(deck, img);
    var slides = [wrap(img, 0)]; deck.appendChild(slides[0]); slides[0].classList.add('on');
    var cur = 0, timer = null, shown = true;
    function build(n) { if (slides[n]) return slides[n]; var im = new Image(); im.decoding = 'async'; im.alt = list[n].a || ''; im.src = list[n].s; var w = wrap(im, n); deck.appendChild(w); slides[n] = w; return w; }
    function next() {
      var n = (cur + 1) % list.length, t = build(n), leave = slides[cur], im = t.firstChild;
      var show = function () { leave.classList.remove('on'); leave.classList.add('out'); t.classList.remove('out'); t.classList.add('on'); setTimeout(function () { leave.classList.remove('out'); }, 1400); cur = n; build((n + 1) % list.length); };
      if (im.complete) show(); else im.addEventListener('load', show, { once: true });
    }
    function run() { clearInterval(timer); if (!still && shown && !document.hidden) timer = setInterval(next, 6500); }
    window.addEventListener('load', function () { build(1); run(); });
    document.addEventListener('visibilitychange', run);
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { shown = es[0].isIntersecting; run(); }).observe(ph);
  });
})();

/* ----- mobile action bar (home, visit, contact, gallery) ----- */
(function () {
  var m = document.querySelector('meta[name="bh-actions"]');
  if (!m || document.getElementById('stAbar')) return;
  var c; try { c = JSON.parse(m.getAttribute('content')); } catch (e) { return; }
  var ic = {
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4v7a3 3 0 0 0 3 3v6"/><path d="M7 4v6"/><path d="M10 4v7a3 3 0 0 1-3 3"/><path d="M18 20V4c-2.2 1.2-3.5 3.8-3.5 7.5V14H18"/></svg>',
    wa: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 20.5l1.7-5.4A8.4 8.4 0 1 1 21 11.5z"/></svg>',
    tel: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/></svg>',
    map: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>'
  };
  var bar = document.createElement('nav'); bar.id = 'stAbar'; bar.className = 'st-abar'; bar.setAttribute('aria-label', 'Quick actions');
  bar.innerHTML =
    '<a class="st-go" href="/menu">' + ic.menu + '<span data-sw="Agiza">Order</span></a>' +
    '<a href="' + c.wa + '" target="_blank" rel="noopener">' + ic.wa + '<span>WhatsApp</span></a>' +
    '<a href="tel:' + c.tel + '">' + ic.tel + '<span data-sw="Piga simu">Call</span></a>' +
    '<a href="' + c.map + '" target="_blank" rel="noopener">' + ic.map + '<span data-sw="Ramani">Map</span></a>';
  document.body.appendChild(bar); document.body.classList.add('has-abar');
  var home = !!document.querySelector('.hero'), typing = false;
  function upd() { var past = !home || window.scrollY > (window.innerHeight || 700) * .7; bar.classList.toggle('is-in', past && !typing); }
  window.addEventListener('scroll', upd, { passive: true });
  document.addEventListener('focusin', function (e) { if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) { typing = true; upd(); } });
  document.addEventListener('focusout', function () { typing = false; upd(); });
  upd();
})();

(function () {
  var hero = document.querySelector('.hero'); if (!hero) return;
  function upd() { document.body.classList.toggle('st-past', hero.getBoundingClientRect().bottom < 90); }
  window.addEventListener('scroll', upd, { passive: true }); upd();
})();
