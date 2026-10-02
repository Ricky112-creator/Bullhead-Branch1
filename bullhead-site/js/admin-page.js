(function () {
  var $ = function (id) { return document.getElementById(id); };
  var KEY = 'bullheadAdminToken';
  var TEMPLATES = [
    ['🐟 Fresh in', 'Fresh tilapia in today — come get it while it lasts', 'stock', 'Samaki tilapia wabichi wamefika leo — njoo uchukue kabla hawajaisha'],
    ['🔥 Special', "Today's special: ", 'special', 'Maalum ya leo: '],
    ['🕒 Late hours', 'Open all night — hot food ready anytime', 'notice', 'Tuko wazi usiku kucha — chakula moto wakati wowote'],
    ['🎉 Holiday', 'Happy holiday to all our esteemed customers — we are open 24 hours', 'notice', 'Heri ya sikukuu kwa wateja wetu wapendwa — tuko wazi masaa 24'],
    ['⚠️ Sold out', 'Sold out for now: ', 'closing', 'Vimeisha kwa sasa: ']
  ];
  var TYPES = { special: ['🔥 Special', "Today's special", 'Maalum ya leo', '#b45309', '#e08a1a'], stock: ['🐟 Fresh stock', 'Fresh in', 'Mpya sasa', '#15803d', '#2fae63'], notice: ['📢 Notice', 'Update', 'Taarifa', '#1d4ed8', '#4f86f7'], closing: ['⚠️ Heads up', 'Heads up', 'Tahadhari', '#991b1b', '#e0392f'] };
  var DURS = [['4 hours', 4], ['12 hours', 12], ['24 hours', 24], ['3 days', 72], ['Until I remove it', '']];
  var type = 'special', dur = 24, pvLang = 'en', token = '';

  function toast(msg, err) { var t = $('toast'); t.textContent = msg; t.className = 'show' + (err ? ' err' : ''); clearTimeout(toast.h); toast.h = setTimeout(function () { t.className = ''; }, err ? 8000 : 3200); }
  function auth() { return 'Bearer ' + token; }
  function when(iso) { try { return new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); } catch (e) { return ''; } }
  function mk(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }

  function chipGroup(el, items, isOn, pick) {
    el.innerHTML = '';
    items.forEach(function (it) {
      var b = mk('button', 'chip' + (isOn(it) ? ' on' : ''), it.label); b.type = 'button';
      b.onclick = function () { pick(it); chipGroup(el, items, isOn, pick); }; el.appendChild(b);
    });
  }
  function drawTypes() { chipGroup($('types'), Object.keys(TYPES).map(function (k) { return { k: k, label: TYPES[k][0] }; }), function (i) { return i.k === type; }, function (i) { type = i.k; refresh(); }); }
  function drawDurs() { chipGroup($('durs'), DURS.map(function (d) { return { v: d[1], label: d[0] }; }), function (i) { return i.v === dur; }, function (i) { dur = i.v; }); }
  chipGroup($('tpls'), TEMPLATES.map(function (t) { return { t: t, label: t[0] }; }), function () { return false; }, function (i) {
    $('text').value = i.t[1]; $('textSw').value = i.t[3]; type = i.t[2]; refresh(); $('text').focus();
    $('tpls').querySelectorAll('.chip').forEach(function (c) { c.classList.remove('on'); });
  });

  function refresh() {
    var en = $('text').value, sw = $('textSw').value, T = TYPES[type];
    $('charCount').textContent = en.length + ' / 140'; $('charSw').textContent = sw.length + ' / 140';
    var say = (pvLang === 'sw' && sw.trim()) ? sw : en;
    $('pvText').textContent = say.trim() || 'Your message appears here…';
    $('pvPill').textContent = pvLang === 'sw' ? T[2] : T[1];
    $('pv').style.setProperty('--a', T[3]); $('pv').style.setProperty('--b', T[4]);
    $('pvCta').style.display = $('cta').checked ? '' : 'none';
    $('pvCta').textContent = pvLang === 'sw' ? 'Agiza kwa WhatsApp' : 'Order on WhatsApp';
    drawTypes();
  }
  $('text').addEventListener('input', refresh); $('textSw').addEventListener('input', refresh); $('cta').addEventListener('change', refresh);
  $('pvLang').addEventListener('click', function (e) { var l = e.target.dataset.l; if (!l) return; pvLang = l; Array.prototype.forEach.call($('pvLang').children, function (b) { b.classList.toggle('on', b.dataset.l === l); }); refresh(); });

  function row(u, live) {
    var T = TYPES[u.type] || TYPES.notice, r = mk('div', 'item');
    var d = mk('span', 'dot'); d.style.background = T[4]; r.appendChild(d);
    var b = mk('div', 'body'); b.appendChild(mk('p', '', u.text));
    if (u.textSw) b.appendChild(mk('p', '', u.textSw)).style.opacity = .65;
    b.appendChild(mk('small', '', (live ? '● Live · ' : 'Ended · ') + 'posted ' + when(u.postedAt) + ' · ' + (u.taps || 0) + ' WhatsApp tap' + (u.taps === 1 ? '' : 's')));
    r.appendChild(b);
    var a = mk('div', 'acts');
    function act(label, cls, fn) { var x = mk('button', 'mini ' + cls, label); x.type = 'button'; x.onclick = fn; a.appendChild(x); }
    act('Repost', '', function () { $('text').value = u.text; $('textSw').value = u.textSw || ''; type = u.type || 'notice'; $('cta').checked = u.cta !== false; refresh(); window.scrollTo({ top: 0, behavior: 'smooth' }); toast('Loaded — tweak it and post'); });
    act('Share', 'wa', function () { window.open('https://wa.me/?text=' + encodeURIComponent(u.text + '\n— Bullhead, Emali · branch1.bullheadhotels.co.ke'), '_blank'); });
    if (live) act('Remove', '', function () { if (confirm('Take this update off the website?')) remove(u.id); });
    r.appendChild(a); return r;
  }
  // Staff codes can't open Updates/Menu/Insights, so if the owner check fails we try the code
  // against Orders. If that works, show the Orders tab only.
  function enterStaff() {
    return fetch('/api/orders', { headers: { Authorization: auth() } }).then(function (r) {
      if (!r.ok) throw new Error('auth');
      $('tabs').style.display = 'none'; $('postBar').hidden = true; $('alertsBtn').hidden = true;
      $('gate').hidden = true; $('app').hidden = false; showTab('orders'); startOrders();
    });
  }
  function load(first) {
    return fetch('/api/updates?all=1', { headers: { Authorization: auth() } })
      .then(function (r) { if (r.status === 401) return { staff: true }; if (!r.ok) throw new Error('net'); return r.json(); })
      .then(function (d) {
        if (d.staff) return enterStaff();
        var all = d.updates || [], now = Date.now(), wk = now - 7 * 864e5, live = [], past = [], t7 = 0, tAll = 0;
        all.forEach(function (u) { var lv = !u.expiresAt || new Date(u.expiresAt).getTime() > now; (lv ? live : past).push(u); tAll += u.taps || 0; if (new Date(u.postedAt).getTime() > wk) t7 += u.taps || 0; });
        $('sLive').textContent = live.length; $('sTaps7').textContent = t7; $('sTapsAll').textContent = tAll;
        $('list').innerHTML = ''; if (!live.length) $('list').appendChild(mk('p', 'empty', 'Nothing live right now. Post one above 👆')); live.forEach(function (u) { $('list').appendChild(row(u, true)); });
        $('past').innerHTML = ''; if (!past.length) $('past').appendChild(mk('p', 'empty', 'Your past updates will show up here.')); past.forEach(function (u) { $('past').appendChild(row(u, false)); });
        $('gate').hidden = true; $('app').hidden = false; showTab(curTab); startOrders(); checkAlerts();
      });
  }

  function signIn() {
    token = $('token').value.trim(); if (!token) return toast('Enter your access code', true);
    $('loginBtn').disabled = true;
    load().then(function () {
      if ($('remember').checked) localStorage.setItem(KEY, token); else { localStorage.removeItem(KEY); sessionStorage.setItem(KEY, token); }
    }).catch(function (e) { toast(e.message === 'auth' ? 'That access code is not right' : 'Could not connect — try again', true); })
      .finally(function () { $('loginBtn').disabled = false; });
  }
  $('loginBtn').onclick = signIn; $('token').addEventListener('keydown', function (e) { if (e.key === 'Enter') signIn(); });
  $('logout').onclick = function () { localStorage.removeItem(KEY); sessionStorage.removeItem(KEY); token = ''; $('token').value = ''; $('app').hidden = true; $('postBar').hidden = true; $('gate').hidden = false; $('alertsBtn').hidden = true; clearInterval(ordTimer); ordTimer = null; seen = null; $('menuBar').hidden = true; menuLoaded = false; };

  function remove(id) {
    fetch('/api/updates?id=' + encodeURIComponent(id), { method: 'DELETE', headers: { Authorization: auth() } })
      .then(function (r) { if (!r.ok) throw new Error(); toast('Removed from the website'); load(); })
      .catch(function () { toast('Could not remove — try again', true); });
  }

  $('trBtn').onclick = function () {
    if (!$('text').value.trim()) return toast('Write the English message first', true);
    $('trBtn').textContent = 'Translating…';
    fetch('/api/updates?translate=1', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: auth() }, body: JSON.stringify({ text: $('text').value.trim() }) })
      .then(function (r) { return r.json().then(function (d) { if (!r.ok) throw new Error(d.error || 'Failed'); return d; }); })
      .then(function (d) { $('textSw').value = d.text; refresh(); toast('Draft ready — please read it over'); })
      .catch(function (e) { toast(e.message + ' — type the Swahili yourself', true); })
      .finally(function () { $('trBtn').textContent = '🌍 Draft it for me'; });
  };

  $('postBtn').onclick = function () {
    var text = $('text').value.trim(); if (!text) { toast('Write a message first', true); $('text').focus(); return; }
    $('postBtn').disabled = true; $('postBtn').textContent = 'Posting…';
    fetch('/api/updates', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: auth() },
      body: JSON.stringify({ text: text, textSw: $('textSw').value.trim(), type: type, cta: $('cta').checked, expiresInHours: dur || undefined }) })
      .then(function (r) { if (!r.ok) throw new Error(r.status === 401 ? 'Wrong access code' : 'Could not post'); return r.json(); })
      .then(function () { $('text').value = ''; $('textSw').value = ''; refresh(); toast('Live on your website ✓'); load(); })
      .catch(function (e) { toast(e.message, true); })
      .finally(function () { $('postBtn').disabled = false; $('postBtn').textContent = 'Post to website'; });
  };


  // ---------- Tabs ----------
  var curTab = 'orders';
  function showTab(t) {
    curTab = t;
    document.querySelectorAll('[data-tab]').forEach(function (s) { s.hidden = s.dataset.tab !== t; });
    document.querySelectorAll('#tabs button').forEach(function (b) { b.classList.toggle('on', b.dataset.t === t); });
    if (t === 'menu') loadMenu();
    if (typeof updateBars === 'function') updateBars(); else $('postBar').hidden = t !== 'updates' || $('app').hidden;
    window.scrollTo(0, 0);
  }
  $('tabs').addEventListener('click', function (e) { var t = e.target.closest('button'); if (t) showTab(t.dataset.t); });

  // ---------- Orders ----------
  var orders = [], seen = null, ordTimer = null;
  var TYPE_LBL = { 'dine-in': 'Dine in', delivery: 'Delivery', 'drive-through': 'Drive-through', reserve: 'Reservation', 'on-the-way': 'On my way' };
  function beep() { try { var a = new (window.AudioContext || window.webkitAudioContext)(), o = a.createOscillator(), g = a.createGain(); o.connect(g); g.connect(a.destination); o.frequency.value = 880; g.gain.value = .15; o.start(); o.stop(a.currentTime + .18); setTimeout(function () { var o2 = a.createOscillator(); o2.connect(g); o2.frequency.value = 1175; o2.start(); o2.stop(a.currentTime + .22); }, 220); } catch (e) {} }
  function ago(iso) { var m = Math.round((Date.now() - new Date(iso)) / 60000); return m < 1 ? 'just now' : m < 60 ? m + ' min ago' : Math.round(m / 60) + ' h ago'; }
  function etaText(o) {
    if (!o.etaAt) return ''; var m = Math.round((new Date(o.etaAt) - Date.now()) / 60000);
    return m > 1 ? '🚗 arrives in ~' + m + ' min' : '🚗 should be here now';
  }
  var STATUS_LBL = { unconfirmed: 'Unconfirmed', cancelled: 'Cancelled' };
  function ordCard(o) {
    var code = orderCode(o.id), unc = o.status === 'unconfirmed';
    var c = mk('div', 'order ' + o.status), top = mk('div', 'top'), l = mk('div');
    var tg = mk('span', 'tag' + (o.type === 'on-the-way' ? ' way' : ''), TYPE_LBL[o.type] || 'Order'); l.appendChild(tg);
    if (code) l.appendChild(mk('span', 'tag code', '#' + code));
    if (STATUS_LBL[o.status] && o.status !== 'cancelled') l.appendChild(mk('span', 'tag unc', STATUS_LBL[o.status]));
    if (o.status === 'cancelled') l.appendChild(mk('span', 'tag', 'Cancelled'));
    l.appendChild(mk('span', 'who', o.name || 'Customer'));
    var sm = mk('div', '', ''); sm.style.cssText = 'font-size:.78rem;color:var(--mute);margin-top:4px';
    sm.textContent = ago(o.ts) + (o.table ? ' · Table ' + o.table : '') + (o.partySize ? ' · ' + o.partySize + ' people' : '') + (o.arriving ? ' · at ' + o.arriving : '') + (o.address ? ' · ' + o.address : '');
    l.appendChild(sm); top.appendChild(l);
    if (o.etaAt) { var e = mk('b', '', etaText(o)); e.style.cssText = 'color:var(--green);font-size:.85rem;text-align:right'; top.appendChild(e); }
    c.appendChild(top);
    if (unc && (Date.now() - new Date(o.ts)) > 30 * 60000) c.appendChild(mk('div', 'stale', '⏳ No confirmation yet. Check WhatsApp for #' + code + ', or call them. Cancel it if it’s a ghost order.'));
    var ul = mk('ul'); o.items.forEach(function (i) { ul.appendChild(mk('li', '', (i.unit === 'kg' ? i.qty + ' kg ' : i.qty + '× ') + i.name)); });
    if (o.items.length) c.appendChild(ul);
    if (o.notes) c.appendChild(mk('div', 'note', '“' + o.notes + '”'));
    // Reach the customer in one tap (the number was checked by the server, but check again before it goes into a link).
    var reach = mk('div', 'reach'), ph = /^\d{9,15}$/.test(o.phone || '') ? o.phone : '';
    function link(label, href, cls) { var a = mk('a', 'mini ' + (cls || ''), label); a.href = href; if (href.indexOf('http') === 0) { a.target = '_blank'; a.rel = 'noopener'; } reach.appendChild(a); }
    if (ph) {
      link('📞 Call ' + ph.replace(/^254/, '0'), 'tel:+' + ph);
      var hi = 'Hi' + (o.name ? ' ' + o.name : '') + ', this is Bullhead confirming your order #' + code + '. ';
      link('💬 WhatsApp', 'https://wa.me/' + ph + '?text=' + encodeURIComponent(hi), 'wa');
    }
    if (/^https:\/\/maps\.google\.com\/\?q=-?[\d.]+,-?[\d.]+$/.test(o.pin || '')) link('📍 Delivery pin', o.pin);
    if (reach.childNodes.length) c.appendChild(reach);
    var f = mk('div', 'foot'); f.appendChild(mk('b', '', o.total ? 'KES ' + o.total.toLocaleString('en-KE') : ''));
    var nx = { unconfirmed: ['Confirm order', 'new'], new: ['Start preparing', 'preparing'], preparing: ['Mark ready', 'ready'], ready: ['Done ✓', 'done'] }[o.status];
    var acts = mk('div'); acts.style.cssText = 'display:flex;gap:8px;align-items:center';
    if (unc || o.status === 'new') { var x = mk('button', 'mini', 'Cancel'); x.type = 'button'; x.onclick = function () { if (confirm('Cancel order #' + code + '?')) setStatus(o.id, 'cancelled'); }; acts.appendChild(x); }
    if (nx) { var b = mk('button', 'go ' + (o.status === 'preparing' ? 'ready' : ''), nx[0]); b.type = 'button'; b.onclick = function () { setStatus(o.id, nx[1]); }; acts.appendChild(b); }
    else { var d = mk('button', 'mini', 'Remove'); d.type = 'button'; d.onclick = function () { fetch('/api/orders?id=' + o.id, { method: 'DELETE', headers: { Authorization: auth() } }).then(loadOrders); }; acts.appendChild(d); }
    f.appendChild(acts);
    c.appendChild(f); return c;
  }
  function setStatus(id, s) { fetch('/api/orders?id=' + id + '&status=' + s, { method: 'PATCH', headers: { Authorization: auth() } }).then(function (r) { if (!r.ok) throw 0; return loadOrders(); }).catch(function () { toast('Could not update — try again', true); }); }
  function loadOrders() {
    return fetch('/api/orders', { headers: { Authorization: auth() } }).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (d) {
      orders = d.orders || [];
      var fresh = orders.filter(function (o) { return o.status === 'new' || o.status === 'unconfirmed'; });
      if (seen) { var add = fresh.filter(function (o) { return !seen[o.id]; }); if (add.length) { beep(); if (navigator.vibrate) navigator.vibrate([200, 100, 200]); toast('🔔 New order' + (add[0].name ? ' from ' + add[0].name : '') + '!'); } }
      seen = {}; orders.forEach(function (o) { seen[o.id] = 1; });
      $('newN').hidden = !fresh.length; $('newN').textContent = fresh.length; document.title = (fresh.length ? '(' + fresh.length + ') ' : '') + 'Bullhead — Owner Dashboard';
      var act = orders.filter(function (o) { return o.status !== 'done' && o.status !== 'cancelled'; }).reverse(), done = orders.filter(function (o) { return o.status === 'done' || o.status === 'cancelled'; }).slice(0, 8);
      $('ordActive').innerHTML = ''; if (!act.length) $('ordActive').appendChild(mk('p', 'empty', 'No orders waiting. You’ll hear a chime when one arrives 🔔')); act.forEach(function (o) { $('ordActive').appendChild(ordCard(o)); });
      $('ordDone').innerHTML = ''; if (!done.length) $('ordDone').appendChild(mk('p', 'empty', 'Finished orders appear here.')); done.forEach(function (o) { $('ordDone').appendChild(ordCard(o)); });
      drawInsights();
    }).catch(function () {});
  }
  function startOrders() { if (ordTimer) return; loadOrders(); ordTimer = setInterval(loadOrders, 20000); }

  // ---------- Phone alerts (Web Push): the bell in the header ----------
  var pushOK = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window, alertsOn = false;
  function b64uToU8(s) { s = s.replace(/-/g, '+').replace(/_/g, '/'); var b = atob(s + '='.repeat((4 - s.length % 4) % 4)), u = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; }
  function swReady() { return navigator.serviceWorker.register('/sw.js').then(function () { return navigator.serviceWorker.ready; }); }
  function saveSub(sub) { return fetch('/api/push', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: auth() }, body: JSON.stringify(sub) }).then(function (r) { if (r.ok) return; return r.json().catch(function () { return {}; }).then(function (d) { throw new Error('save:' + (d.error || r.status)); }); }); }
  function alertsUI(on) {
    alertsOn = on; var b = $('alertsBtn'), t = on ? 'Order alerts are on. Tap to turn off' : 'Turn on order alerts';
    b.textContent = on ? '🔔' : '🔕'; b.className = 'bell' + (on ? ' on' : ''); b.title = t; b.setAttribute('aria-label', t);
  }
  function checkAlerts() {
    if (!pushOK) return; $('alertsBtn').hidden = false;
    if (Notification.permission === 'denied') return alertsUI(false);
    swReady().then(function (reg) { return reg.pushManager.getSubscription(); }).then(function (sub) {
      if (sub && Notification.permission === 'granted') { alertsUI(true); saveSub(sub).catch(function () {}); } else alertsUI(false);
    }).catch(function () { alertsUI(false); });
  }
  function enableAlerts() {
    var reg, key;
    return Notification.requestPermission().then(function (p) { if (p !== 'granted') throw new Error('perm'); return fetch('/api/push').then(function (r) { return r.json(); }); })
      .then(function (d) {
        if (!d.publicKey) throw new Error('nokey');
        try { key = b64uToU8(d.publicKey); } catch (e) { key = []; }
        if (key.length !== 65) throw new Error('badkey');
        return swReady().then(function (r) { reg = r; return reg.pushManager.getSubscription(); })
          .then(function (old) { return old ? old.unsubscribe() : 0; })
          .then(function () { return reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key }); })
          .catch(function (e) { console.error('push subscribe failed', e); throw new Error('sub:' + ((e && e.name) || 'error')); });
      })
      .then(function (sub) { return saveSub(sub); })
      .then(function () {
        alertsUI(true); toast('🔔 Alerts are on. Sending a test…');
        fetch('/api/push?test=1', { method: 'POST', headers: { Authorization: auth() } }).catch(function () {});
      });
  }
  function disableAlerts() {
    return swReady().then(function (reg) { return reg.pushManager.getSubscription(); }).then(function (sub) {
      if (!sub) return; var ep = sub.endpoint;
      return sub.unsubscribe().then(function () { return fetch('/api/push', { method: 'DELETE', headers: { 'Content-Type': 'application/json', Authorization: auth() }, body: JSON.stringify({ endpoint: ep }) }); });
    }).then(function () { alertsUI(false); toast('Alerts are off'); });
  }
  function alertErr(e) {
    var m = (e && e.message) || '';
    if (m === 'perm') return 'Alerts were not allowed';
    if (m === 'nokey') return 'The server has no alert keys yet. Add VAPID_PUBLIC and VAPID_PRIVATE, then redeploy';
    if (m === 'badkey') return 'The VAPID_PUBLIC key on the server looks wrong. Re-copy the public key';
    if (m.indexOf('sub:') === 0) return 'This browser could not register for alerts (' + m.slice(4) + ')';
    if (m.indexOf('save:') === 0) return 'Server said: ' + m.slice(5);
    return 'Could not change alerts. Try again';
  }
  $('alertsBtn').onclick = function () {
    var b = $('alertsBtn');
    if (!alertsOn && Notification.permission === 'denied') return toast('Notifications are blocked for this site. Allow them in your browser settings, then reload.', true);
    b.disabled = true;
    (alertsOn ? disableAlerts() : enableAlerts()).catch(function (e) { console.error(e); toast(alertErr(e), true); }).then(function () { b.disabled = false; });
  };

  // ---------- Insights ----------
  function drawInsights() {
    var wk = Date.now() - 7 * 864e5, o7 = orders.filter(function (o) { return new Date(o.ts) > wk && o.status !== 'cancelled'; });
    $('iOrders').textContent = o7.length; $('iSales').textContent = o7.filter(function (o) { return o.status === 'done'; }).reduce(function (s, o) { return s + (o.total || 0); }, 0).toLocaleString('en-KE');
    $('iWay').textContent = o7.filter(function (o) { return o.type === 'on-the-way'; }).length;
    var cnt = {}; o7.forEach(function (o) { var seenN = {}; o.items.forEach(function (i) { if (!seenN[i.name]) { cnt[i.name] = (cnt[i.name] || 0) + 1; seenN[i.name] = 1; } }); });
    var top = Object.keys(cnt).sort(function (a, b) { return cnt[b] - cnt[a]; }).slice(0, 6);
    $('iTop').innerHTML = ''; if (!top.length) $('iTop').appendChild(mk('p', 'empty', 'No orders yet — this fills up as customers order.'));
    top.forEach(function (n) { var r = mk('div', 'bar-row'), t = mk('div', 't'); t.appendChild(mk('span', '', n)); t.appendChild(mk('b', '', cnt[n] + (cnt[n] === 1 ? ' order' : ' orders'))); var b = mk('div', 'b'), i = mk('i'); i.style.width = (cnt[n] / cnt[top[0]] * 100) + '%'; b.appendChild(i); r.appendChild(t); r.appendChild(b); $('iTop').appendChild(r); });
    var hrs = {}; o7.forEach(function (o) { var h = new Date(new Date(o.ts).toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })).getHours(); hrs[h] = (hrs[h] || 0) + 1; });
    var best = Object.keys(hrs).sort(function (a, b) { return hrs[b] - hrs[a]; })[0];
    $('iHours').innerHTML = ''; if (best != null) { var h12 = (best % 12) || 12, ap = best < 12 ? 'AM' : 'PM'; var p = mk('p', '', 'Busiest around ' + h12 + ' ' + ap + ' — ' + hrs[best] + ' order' + (hrs[best] === 1 ? '' : 's') + ' this week.'); p.style.cssText = 'font-size:1.05rem;font-weight:600;margin:0'; $('iHours').appendChild(p); } else $('iHours').appendChild(mk('p', 'empty', 'No orders yet.'));
  }

  // ---------- Menu board ----------
  var menuState = {}, menuLoaded = false, customState = [], customSaved = [];
  var allItems = function () { return MENU_ITEMS.concat(customState); };
  function loadMenu() { if (menuLoaded) return; fetch('/api/menu').then(function (r) { return r.json(); }).then(function (d) { menuState = d.menu || {}; menuSaved = clone(menuState); customState = (d.custom || []).map(function (c) { c.custom = true; return c; }); customSaved = clone(customState); menuLoaded = true; drawMenu(); updateBars(); }).catch(function () { toast('Could not load the menu', true); }); }
  var menuSaved = {};
  var clone = function (o) { return JSON.parse(JSON.stringify(o)); };
  var norm = function (e) { e = e || {}; return { price: typeof e.price === 'number' ? e.price : null, special: !!e.special, soldOut: !!e.soldOut, until: e.soldOut && e.until ? e.until : null }; };
  var same = function (a, b) { a = norm(a); b = norm(b); return a.price === b.price && a.special === b.special && a.soldOut === b.soldOut && a.until === b.until; };
  var clock = function (iso) { return new Date(iso).toLocaleTimeString('en-KE', { timeZone: 'Africa/Nairobi', hour: 'numeric', minute: '2-digit' }); };
  function statusText(e) { e = norm(e); return !e.soldOut ? 'Available' : e.until ? 'Back at ' + clock(e.until) : 'Sold out'; }
  function diffs() {
    var out = [], was = {}, now = {};
    customSaved.forEach(function (c) { was[c.id] = c; }); customState.forEach(function (c) { now[c.id] = c; });
    var items = MENU_ITEMS.concat(customState); customSaved.forEach(function (c) { if (!now[c.id]) items.push(c); });
    var kes = function (p) { return typeof p === 'number' ? 'KES ' + p : 'Ask staff'; };
    items.forEach(function (it) {
      var lines = [];
      if (it.custom && !now[it.id]) { out.push({ name: it.name, lines: [['Menu', 'on the menu', 'removed']] }); return; }
      var isNew = it.custom && !was[it.id], a = norm(menuSaved[it.id]), b = norm(menuState[it.id]);
      if (isNew) lines.push(['New item', '', it.category + ' · ' + kes(it.price)]);
      else if (it.custom) { if (was[it.id].price !== it.price) lines.push(['Price', kes(was[it.id].price), kes(it.price)]); }
      else if (a.price !== b.price) lines.push(['Price', a.price !== null ? 'KES ' + a.price : kes(it.price) + ' (default)', b.price !== null ? 'KES ' + b.price : kes(it.price) + ' (default)']);
      if (a.special !== b.special) lines.push(["Today's special", a.special ? '★ yes' : 'no', b.special ? '★ yes' : 'no']);
      if (statusText(a) !== statusText(b) || a.until !== b.until) lines.push(['Availability', statusText(a), statusText(b)]);
      if (lines.length) out.push({ name: it.name, lines: lines });
    });
    return out;
  }
  function updateBars() {
    var n = diffs().length, on = curTab === 'menu' && n > 0 && !$('app').hidden;
    $('menuBar').hidden = !on; $('mReview').textContent = 'Review & save (' + n + ')';
    $('postBar').hidden = curTab !== 'updates' || $('app').hidden;
    return n;
  }
  function saveMenu() { updateBars(); }   // staged only — nothing is sent until "Save & publish"
  $('mReview').onclick = function () {
    var d = diffs(); if (!d.length) return;
    $('mSub').textContent = d.length + (d.length === 1 ? ' item' : ' items') + ' will change on the live menu.';
    $('mDiff').innerHTML = '';
    d.forEach(function (x) {
      var c = mk('div', 'chg'); c.appendChild(mk('b', '', x.name));
      x.lines.forEach(function (l) { var r = mk('div'); r.appendChild(document.createTextNode(l[0] + ': ')); if (l[1] !== '') { r.appendChild(mk('span', 'a', l[1])); r.appendChild(document.createTextNode(' → ')); } r.appendChild(mk('span', 'z', l[2])); c.appendChild(r); });
      $('mDiff').appendChild(c);
    });
    $('modal').hidden = false;
  };
  $('mBack').onclick = function () { $('modal').hidden = true; };
  $('modal').addEventListener('click', function (e) { if (e.target === $('modal')) $('modal').hidden = true; });
  $('mDiscard').onclick = function () { if (!confirm('Throw away your unsaved menu changes?')) return; menuState = clone(menuSaved); customState = clone(customSaved); drawMenu(); updateBars(); toast('Changes discarded'); };
  $('mSave').onclick = function () {
    $('mSave').disabled = true; $('mSave').textContent = 'Saving…';
    fetch('/api/menu', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: auth() }, body: JSON.stringify({ menu: menuState, custom: customState }) })
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (d) { menuState = d.menu || menuState; menuSaved = clone(menuState); customSaved = clone(customState); $('modal').hidden = true; drawMenu(); updateBars(); toast('Saved — live on the menu ✓'); })
      .catch(function () { toast('Could not save — check your connection', true); })
      .finally(function () { $('mSave').disabled = false; $('mSave').textContent = 'Save & publish'; });
  };
  window.addEventListener('beforeunload', function (e) { if (diffs().length) { e.preventDefault(); e.returnValue = ''; } });
  function tomorrow6() { var d = new Date(), t = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 3); if (t <= Date.now() + 36e5) t += 864e5; return new Date(t).toISOString(); }
  function drawMenu() {
    var q = ($('mSearch').value || '').toLowerCase(), box = $('mList'); box.innerHTML = ''; var cat = '';
    var cats = []; allItems().forEach(function (i) { if (cats.indexOf(i.category) < 0) cats.push(i.category); });
    var ordered = []; cats.forEach(function (c) { allItems().forEach(function (i) { if (i.category === c) ordered.push(i); }); });
    ordered.forEach(function (it) {
      if (q && it.name.toLowerCase().indexOf(q) < 0) return;
      if (it.category !== cat) { cat = it.category; box.appendChild(mk('div', 'mcat', cat)); }
      var m = menuState[it.id] || {}, until = m.until ? new Date(m.until) : null, sold = m.soldOut && (!until || until > Date.now());
      var r = mk('div', 'mrow'), nm = mk('div', 'nm' + (sold ? ' sold' : ''));
      var st = mk('button', 'star' + (m.special ? ' on' : ''), '★'); st.type = 'button'; st.title = "Today's special";
      st.onclick = function () { var x = menuState[it.id] = menuState[it.id] || {}; if (x.special) delete x.special; else x.special = true; saveMenu(); drawMenu(); };
      nm.appendChild(st); nm.appendChild(document.createTextNode(it.name + (it.unit === 'kg' ? ' /kg' : '')));
      if (it.custom) { var nw = mk('span', 'dirty-pill', customSaved.some(function (c) { return c.id === it.id; }) ? 'ADDED' : 'NEW'); nw.style.background = 'var(--green)'; nw.style.color = '#06210f'; nm.appendChild(nw);
        var rm = mk('button', 'star', '✕'); rm.type = 'button'; rm.title = 'Remove this item'; rm.style.marginLeft = '6px'; rm.onclick = function () { if (!confirm('Remove "' + it.name + '" from the menu?')) return; customState = customState.filter(function (c) { return c.id !== it.id; }); delete menuState[it.id]; drawMenu(); saveMenu(); }; nm.appendChild(rm); }
      r.appendChild(nm);
      var pr = mk('input'); pr.type = 'number'; pr.min = 0; pr.inputMode = 'numeric'; pr.placeholder = typeof it.price === 'number' ? it.price : 'Price'; pr.value = it.custom ? (typeof it.price === 'number' ? it.price : '') : (typeof m.price === 'number' ? m.price : '');
      pr.title = 'Price in KES (leave empty to use the default' + (typeof it.price === 'number' ? ': ' + it.price : '') + ')';
      pr.onchange = function () { if (it.custom) { it.price = pr.value === '' ? null : Number(pr.value); saveMenu(); return; } var x = menuState[it.id] = menuState[it.id] || {}; if (pr.value === '') delete x.price; else x.price = Number(pr.value); saveMenu(); };
      r.appendChild(pr);
      var sel = mk('select'), opts = [['ok', 'Available'], ['sold', 'Sold out'], ['60', 'Back in 1 hour'], ['120', 'Back in 2 hours'], ['tom', 'Back tomorrow']];
      if (sold && until) opts.unshift(['keep', 'Back at ' + until.toLocaleTimeString('en-KE', { timeZone: 'Africa/Nairobi', hour: 'numeric', minute: '2-digit' })]);
      opts.forEach(function (o) { var op = mk('option', '', o[1]); op.value = o[0]; sel.appendChild(op); });
      sel.value = !sold ? 'ok' : until ? 'keep' : 'sold';
      sel.onchange = function () {
        var x = menuState[it.id] = menuState[it.id] || {}, v = sel.value;
        if (v === 'keep') return;
        if (v === 'ok') { delete x.soldOut; delete x.until; } else { x.soldOut = true; if (v === 'sold') delete x.until; else x.until = v === 'tom' ? tomorrow6() : new Date(Date.now() + Number(v) * 6e4).toISOString(); }
        saveMenu(); drawMenu();
      };
      r.appendChild(sel); box.appendChild(r);
    });
    if (!box.children.length) box.appendChild(mk('p', 'empty', 'No items match.'));
  }
  $('mSearch').addEventListener('input', drawMenu);

  // ---------- Add an item ----------
  var aUnit = '';
  function drawUnit() { chipGroup($('aUnit'), [{ v: '', label: 'Each' }, { v: 'kg', label: 'Per kg' }], function (i) { return i.v === aUnit; }, function (i) { aUnit = i.v; }); }
  function fillCats() {
    var cats = []; allItems().forEach(function (i) { if (cats.indexOf(i.category) < 0) cats.push(i.category); });
    $('aCat').innerHTML = ''; cats.concat(['＋ New category…']).forEach(function (c, k) { var o = mk('option', '', c); o.value = k < cats.length ? c : '__new'; $('aCat').appendChild(o); });
  }
  $('aCat').onchange = function () { $('aNewCat').hidden = $('aCat').value !== '__new'; if (!$('aNewCat').hidden) $('aNewCat').focus(); };
  $('addItemBtn').onclick = function () { $('aName').value = ''; $('aPrice').value = ''; $('aNewCat').value = ''; $('aNewCat').hidden = true; aUnit = ''; fillCats(); drawUnit(); $('addModal').hidden = false; $('aName').focus(); };
  $('aCancel').onclick = function () { $('addModal').hidden = true; };
  $('addModal').addEventListener('click', function (e) { if (e.target === $('addModal')) $('addModal').hidden = true; });
  $('aOk').onclick = function () {
    var name = $('aName').value.trim(), cat = $('aCat').value === '__new' ? $('aNewCat').value.trim() : $('aCat').value, pr = $('aPrice').value.replace(/[^\d.]/g, '');
    if (!name) return toast('Give the item a name', true);
    if (!cat) return toast('Pick or name a category', true);
    if (allItems().some(function (i) { return i.category === cat && i.name.toLowerCase() === name.toLowerCase(); })) return toast('That item is already in ' + cat, true);
    var id = 'c-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 22) + '-' + Math.random().toString(36).slice(2, 6);
    customState.push({ id: id, category: cat, name: name, price: pr === '' ? null : Number(pr), unit: aUnit, custom: true });
    $('addModal').hidden = true; $('mSearch').value = ''; drawMenu(); saveMenu(); toast('Added — tap Review & save to publish');
  };

  drawDurs(); refresh();
  token = localStorage.getItem(KEY) || sessionStorage.getItem(KEY) || '';
  if (token) { $('token').value = token; load().catch(function () { token = ''; $('token').value = ''; localStorage.removeItem(KEY); }); }
})();
