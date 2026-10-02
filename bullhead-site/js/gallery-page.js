(function () {
  var g = document.getElementById('gg'), lb = document.getElementById('lb');
  var LOCAL = [
    ['gallery-01-frontage.webp','Bullhead One on the Nairobi-Mombasa road: Fish Point, Chips Point, Bull Head Hotel and the Butchery'],
    ['gallery-02-choma.webp','Nyama choma, straight off the pan'],
    ['gallery-03-chips.webp','Fresh chips from the Chips Point kitchen'],
    ['gallery-04-chicken.webp','Chicken in the Chips Point warmer'],
    ['gallery-05-oven.webp','The charcoal oven, loaded with meat'],
    ['gallery-06-fryer.webp','Chips coming out of the fryer'],
    ['gallery-07-hotel.webp','Seating at Bull Head Hotel'],
    ['gallery-08-counter.webp','The counter, the warmer and the aquarium'],
    ['gallery-09-tables.webp','Tables ready at Bull Head Hotel'],
    ['gallery-10-fishpoint.webp','Fish Point'],
    ['gallery-11-chipspoint.webp','Chips Point'],
    ['gallery-12-water.webp','Bull Head Hotel drinking water, 1.5 litres'],
    ['gallery-13-oven-tray.webp','Turning the meat in the charcoal oven'],
    ['gallery-14-guests.webp','Guests at the tables'],
    ['gallery-15-service.webp','Service at Bull Head Hotel'],
    ['gallery-16-dining.webp','The dining room'],
    ['gallery-17-fishpoint-crew.webp','The Fish Point crew'],
    ['gallery-18-water-cold.webp','Bull Head Hotel drinking water'],
    ['gallery-19-round-table.webp','A round table, ready for a group'],
    ['gallery-20-hotel-window.webp','Bull Head Hotel and the butchery window'],
    ['gallery-21-chipspoint-hotel.webp','Chips Point and Bull Head Hotel'],
    ['gallery-22-fishpoint-two.webp','Two of the Fish Point team'],
    ['gallery-23-table-jug.webp','A table set with water'],
    ['gallery-24-fishpoint-front.webp','Fish Point']
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
