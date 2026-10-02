(function () {
  var g = document.getElementById('gg'), lb = document.getElementById('lb');
  var LOCAL = [
    ['bullhead-one-storefront.jpg','Bullhead One on the Nairobi-Mombasa road'],
    ['zone-butchery-choma.jpg','Bull Head Butchery and Choma Zone'],
    ['zone-chips-point.jpg','Chips Point'],
    ['zone-hotel.jpg','Bull Head Hotel']
  ];
  function showLocal() {
    g.innerHTML = '';
    LOCAL.forEach(function (p) {
      var src = '/assets/img/' + p[0], f = document.createElement('figure'), i = document.createElement('img'), c = document.createElement('figcaption');
      i.loading = 'lazy'; i.decoding = 'async'; i.alt = p[1]; i.src = src; c.textContent = p[1]; f.appendChild(i); f.appendChild(c);
      f.onclick = function () { document.getElementById('lbImg').src = src; document.getElementById('lbCap').textContent = p[1]; lb.classList.add('on'); };
      g.appendChild(f);
    });
  }
  fetch('/api/photos').then(function (r) { return r.json(); }).then(function (d) {
    g.innerHTML = '';
    if (!d.photos || !d.photos.length) { showLocal(); return; }
    d.photos.forEach(function (p) {
      var f = document.createElement('figure'), i = document.createElement('img');
      var q = '/api/photos?img=' + p.id, v = '&v=' + (p.v || 0);
      i.loading = 'lazy'; i.decoding = 'async'; i.alt = p.caption || 'Bullhead'; i.src = q + (p.t ? '&t=1' : '') + v; f.appendChild(i);
      if (p.caption) { var c = document.createElement('figcaption'); c.textContent = p.caption; f.appendChild(c); }
      f.onclick = function () { document.getElementById('lbImg').src = q + v; document.getElementById('lbCap').textContent = p.caption || ''; lb.classList.add('on'); };
      g.appendChild(f);
    });
  }).catch(function () { showLocal(); });
  lb.onclick = function () { lb.classList.remove('on'); };
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') lb.classList.remove('on'); });
})();
