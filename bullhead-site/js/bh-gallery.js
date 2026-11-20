/* Bullhead gallery stage: 3D coverflow reel + full-screen viewer + staggered grid reveal. Works from the figures the page already builds. */
(function () {
  var gg = document.getElementById('gg'); if (!gg) return;
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var items = [], sec = null, cur = 0, timer = null, shown = true, viewerOpen = false, lastCount = -1;

  function collect() {
    items = Array.prototype.map.call(gg.querySelectorAll('figure'), function (f) {
      var im = f.querySelector('img'), cap = f.querySelector('figcaption');
      var thumb = im ? (im.getAttribute('src') || '') : '';
      return { el: f, thumb: thumb, full: thumb.replace('&t=1', ''), cap: (cap && cap.textContent) || (im && im.alt) || '' };
    }).filter(function (x) { return x.thumb; });
  }

  /* ----- coverflow ----- */
  var stage, capEl, countEl, slides = [];
  function buildFlow() {
    if (sec) { sec.remove(); sec = null; }
    var feat = items.slice(0, 9); if (feat.length < 4) return;
    sec = document.createElement('section'); sec.className = 'bhc'; sec.setAttribute('aria-roledescription', 'carousel'); sec.setAttribute('aria-label', 'Featured photos');
    sec.innerHTML = '<div class="bhc-stage" tabindex="0"></div><p class="bhc-cap" aria-live="polite"></p><div class="bhc-ui"><button type="button" class="bhc-b" data-p aria-label="Previous photo">\u2039</button><span class="bhc-n"></span><button type="button" class="bhc-b" data-n aria-label="Next photo">\u203a</button></div>';
    stage = sec.querySelector('.bhc-stage'); capEl = sec.querySelector('.bhc-cap'); countEl = sec.querySelector('.bhc-n');
    slides = feat.map(function (it, n) {
      var d = document.createElement('div'); d.className = 'bhc-item'; var im = new Image(); im.alt = it.cap; im.src = it.thumb; im.decoding = 'async'; if (n > 2) im.loading = 'lazy'; d.appendChild(im); stage.appendChild(d);
      d.addEventListener('click', function () { if (n === cur) openViewer(n); else go(n); }); return d;
    });
    gg.parentNode.insertBefore(sec, gg);
    sec.querySelector('[data-p]').onclick = function () { go(cur - 1); restart(); };
    sec.querySelector('[data-n]').onclick = function () { go(cur + 1); restart(); };
    stage.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') { go(cur + 1); restart(); } else if (e.key === 'ArrowLeft') { go(cur - 1); restart(); } else if (e.key === 'Enter') openViewer(cur); });
    var x0 = null, moved = false;
    stage.addEventListener('pointerdown', function (e) { x0 = e.clientX; moved = false; });
    stage.addEventListener('pointermove', function (e) { if (x0 !== null && Math.abs(e.clientX - x0) > 8) moved = true; });
    stage.addEventListener('pointerup', function (e) { if (x0 === null) return; var dx = e.clientX - x0; x0 = null; if (Math.abs(dx) > 44) { go(cur + (dx < 0 ? 1 : -1)); restart(); } });
    stage.addEventListener('click', function (e) { if (moved) { e.stopPropagation(); e.preventDefault(); } }, true);
    sec.addEventListener('mouseenter', function () { shown = false; stop(); }); sec.addEventListener('mouseleave', function () { shown = true; restart(); });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { shown = es[0].isIntersecting; restart(); }, { threshold: .25 }).observe(sec);
    cur = 0; layout(); restart();
  }
  function layout() {
    var n = slides.length;
    slides.forEach(function (s, i) {
      var d = i - cur; if (d > n / 2) d -= n; if (d < -n / 2) d += n;
      var a = Math.abs(d); s.style.setProperty('--d', d); s.style.setProperty('--a', Math.min(a, 3));
      s.classList.toggle('is-on', d === 0); s.style.zIndex = 20 - a; s.style.opacity = a > 3 ? 0 : 1; s.style.pointerEvents = a > 3 ? 'none' : '';
      s.setAttribute('aria-hidden', d === 0 ? 'false' : 'true');
    });
    capEl.textContent = items[cur].cap; countEl.textContent = (cur + 1) + ' / ' + n;
  }
  function go(n) { cur = (n + slides.length) % slides.length; layout(); }
  function stop() { clearInterval(timer); timer = null; }
  function restart() { stop(); if (!still && shown && !viewerOpen && !document.hidden && slides.length) timer = setInterval(function () { go(cur + 1); }, 4200); }
  document.addEventListener('visibilitychange', restart);

  /* ----- viewer ----- */
  var vw, vImg, vCap, vCount, vi = 0, opener = null;
  function ensureViewer() {
    if (vw) return;
    vw = document.createElement('div'); vw.className = 'bhv'; vw.setAttribute('role', 'dialog'); vw.setAttribute('aria-modal', 'true'); vw.setAttribute('aria-label', 'Photo viewer'); vw.hidden = true;
    vw.innerHTML = '<button type="button" class="bhv-x" aria-label="Close viewer">\u00d7</button><button type="button" class="bhv-a bhv-p" aria-label="Previous photo">\u2039</button><figure class="bhv-f"><img alt=""><figcaption></figcaption></figure><button type="button" class="bhv-a bhv-n" aria-label="Next photo">\u203a</button><span class="bhv-c"></span>';
    document.body.appendChild(vw); vImg = vw.querySelector('img'); vCap = vw.querySelector('figcaption'); vCount = vw.querySelector('.bhv-c');
    vw.querySelector('.bhv-x').onclick = closeViewer; vw.querySelector('.bhv-p').onclick = function () { show(vi - 1); }; vw.querySelector('.bhv-n').onclick = function () { show(vi + 1); };
    vw.addEventListener('click', function (e) { if (e.target === vw || e.target.classList.contains('bhv-f')) closeViewer(); });
    document.addEventListener('keydown', function (e) { if (vw.hidden) return; if (e.key === 'Escape') closeViewer(); else if (e.key === 'ArrowRight') show(vi + 1); else if (e.key === 'ArrowLeft') show(vi - 1); else if (e.key === 'Tab') { var f = vw.querySelectorAll('button'); var first = f[0], last = f[f.length - 1]; if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); } } });
    var x0 = null; vw.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    vw.addEventListener('touchend', function (e) { if (x0 === null) return; var d = e.changedTouches[0].clientX - x0; x0 = null; if (Math.abs(d) > 50) show(vi + (d < 0 ? 1 : -1)); }, { passive: true });
  }
  function show(n) {
    vi = (n + items.length) % items.length; var it = items[vi]; vw.classList.add('is-swap');
    var im = new Image(); im.onload = im.onerror = function () { vImg.src = it.full; vImg.alt = it.cap; vCap.textContent = it.cap; vCount.textContent = (vi + 1) + ' / ' + items.length; vw.classList.remove('is-swap'); };
    im.src = it.full; var nx = new Image(); nx.src = items[(vi + 1) % items.length].full;
  }
  function openViewer(n) { ensureViewer(); opener = document.activeElement; viewerOpen = true; stop(); vw.hidden = false; document.documentElement.style.overflow = 'hidden'; requestAnimationFrame(function () { vw.classList.add('is-open'); }); show(n); vw.querySelector('.bhv-x').focus(); }
  function closeViewer() { vw.classList.remove('is-open'); document.documentElement.style.overflow = ''; viewerOpen = false; setTimeout(function () { vw.hidden = true; }, 280); if (opener && opener.focus) opener.focus(); restart(); }

  gg.addEventListener('click', function (e) { var f = e.target.closest('figure'); if (!f) return; var n = items.findIndex(function (x) { return x.el === f; }); if (n < 0) return; e.stopPropagation(); e.preventDefault(); openViewer(n); }, true);

  /* ----- grid reveal ----- */
  var io = ('IntersectionObserver' in window && !still) ? new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }); }, { rootMargin: '0px 0px -8% 0px' }) : null;
  function reveal() { if (!io) return; Array.prototype.forEach.call(gg.querySelectorAll('figure:not(.st-rv)'), function (f, i) { f.classList.add('st-rv'); f.style.setProperty('--i', (i % 3) * 90 + 'ms'); io.observe(f); }); }

  var t = null;
  function sync() { collect(); if (items.length !== lastCount) { lastCount = items.length; if (items.length) buildFlow(); } reveal(); }
  new MutationObserver(function () { clearTimeout(t); t = setTimeout(sync, 120); }).observe(gg, { childList: true });
  sync();
})();
