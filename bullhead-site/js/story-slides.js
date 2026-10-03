(function () {
  var box = document.querySelector('.story-slides');
  if (!box) return;
  var slides = Array.prototype.slice.call(box.querySelectorAll('.story-slide'));
  if (slides.length < 2) return;
  var i = 0, timer = null, still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var dots = document.createElement('div');
  dots.className = 'story-dots';
  slides.forEach(function (_, n) {
    var b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', 'Photo ' + (n + 1) + ' of ' + slides.length);
    b.onclick = function () { go(n); restart(); };
    dots.appendChild(b);
    if (n) slides[n].setAttribute('aria-hidden', 'true');
  });
  box.appendChild(dots);
  var btns = dots.children;
  function go(n) {
    slides[i].classList.remove('on'); slides[i].setAttribute('aria-hidden', 'true');
    btns[i].classList.remove('on'); btns[i].removeAttribute('aria-current');
    i = (n + slides.length) % slides.length;
    slides[i].classList.add('on'); slides[i].removeAttribute('aria-hidden');
    btns[i].classList.add('on'); btns[i].setAttribute('aria-current', 'true');
  }
  function stop() { if (timer) { clearInterval(timer); timer = null; } }
  function restart() { stop(); if (!still && !document.hidden) timer = setInterval(function () { go(i + 1); }, 5000); }
  var x0 = null;
  box.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
  box.addEventListener('touchend', function (e) {
    if (x0 === null) return;
    var d = e.changedTouches[0].clientX - x0; x0 = null;
    if (Math.abs(d) > 40) { go(i + (d < 0 ? 1 : -1)); restart(); }
  }, { passive: true });
  box.addEventListener('mouseenter', stop);
  box.addEventListener('mouseleave', restart);
  document.addEventListener('visibilitychange', restart);
  btns[0].classList.add('on');
  btns[0].setAttribute('aria-current', 'true');
  restart();
})();
