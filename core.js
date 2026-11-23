/* Portfolio v2 core: language switch, lazy mounting of mini apps, shared UI helpers, autoplay.
   A mini app registers itself with PF.app(id, { cap:[ru,en], pace:ms, mount(ctx){ ...; return { reset(), next() } } }).
   next() tells autoplay what to press: an HTMLElement, the string 'wait' while the app is busy, or null when the tour is over. */
(function () {
  'use strict';
  var PF = (window.PF = window.PF || {});
  PF.apps = PF.apps || {};
  var RM = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var HAS_IO = 'IntersectionObserver' in window;
  var SVGNS = 'http://www.w3.org/2000/svg';
  PF.RM = RM;

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  /* ---------- DOM builder: h('div.a.b', {attrs}, ...children) ---------- */
  function add(el, c) {
    if (c == null || c === false) return;
    if (Array.isArray(c)) { c.forEach(function (x) { add(el, x); }); return; }
    el.appendChild(c.nodeType ? c : document.createTextNode(String(c)));
  }
  function h(tag, attrs) {
    var parts = String(tag).split('.');
    var el = document.createElement(parts[0] || 'div');
    if (parts.length > 1) el.className = parts.slice(1).join(' ');
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v == null || v === false) return;
        if (k === 'class') el.className = (el.className ? el.className + ' ' : '') + v;
        else if (k === 'html') el.innerHTML = v;
        else if (k === 'text') el.textContent = v;
        else if (k === 'hidden') el.hidden = !!v;
        else if (k.slice(0, 2) === 'on' && typeof v === 'function') el.addEventListener(k.slice(2), v);
        else el.setAttribute(k, v === true ? '' : v);
      });
    }
    for (var i = 2; i < arguments.length; i++) add(el, arguments[i]);
    return el;
  }
  function icon(name) {
    var s = document.createElementNS(SVGNS, 'svg');
    s.setAttribute('aria-hidden', 'true');
    var u = document.createElementNS(SVGNS, 'use');
    u.setAttribute('href', '#i-' + name);
    s.appendChild(u);
    return s;
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  PF.h = h; PF.icon = icon; PF.esc = esc; PF.$ = $; PF.$$ = $$;

  /* ---------- icon sprite ---------- */
  var ST = 'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';
  var ICONS = {
    check: '<path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
    x: '<path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
    play: '<path d="M8 5.5v13l11-6.5z" fill="currentColor"/>',
    stop: '<rect x="7" y="7" width="10" height="10" rx="2" fill="currentColor"/>',
    reset: '<g ' + ST + '><path d="M4.5 12a7.5 7.5 0 1 0 2.4-5.5"/><path d="M4.5 4.5v4.5H9"/></g>',
    clock: '<g ' + ST + '><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></g>',
    lock: '<g ' + ST + '><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></g>',
    eye: '<g ' + ST + '><path d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12s-3.5 6.5-9.5 6.5S2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/></g>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6" ' + ST + '/>',
    doc: '<g ' + ST + '><path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4M9.5 12h6M9.5 16h6"/></g>',
    chat: '<path d="M4 5h16v11H9l-5 4z" ' + ST + '/>',
    mail: '<g ' + ST + '><rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="M4 7l8 6 8-6"/></g>',
    sheet: '<g ' + ST + '><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 10h16M4 15h16M10 4v16"/></g>',
    bank: '<path d="M3 9.5L12 4l9 5.5M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18" ' + ST + '/>',
    card: '<g ' + ST + '><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18M7 15h4"/></g>',
    shield: '<path d="M12 3l7.5 3v6c0 4.5-3.2 7.8-7.5 9-4.3-1.2-7.5-4.5-7.5-9V6z" ' + ST + '/>',
    users: '<g ' + ST + '><circle cx="9" cy="8.5" r="3"/><path d="M3.5 19c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5"/><circle cx="17" cy="9.5" r="2.3"/><path d="M16.2 14.2c2.1.3 3.7 1.8 4.3 4.3"/></g>',
    user: '<g ' + ST + '><circle cx="12" cy="8.5" r="3.5"/><path d="M5 20c.8-3.8 3.5-6 7-6s6.2 2.2 7 6"/></g>',
    bot: '<g ' + ST + '><rect x="5" y="8" width="14" height="11" rx="3"/><path d="M12 8V4.5M9.5 13.5h.01M14.5 13.5h.01M3 13v3M21 13v3"/></g>',
    chart: '<path d="M5 20V11M11 20V5M17 20v-7M3 20h18" ' + ST + '/>',
    log: '<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>',
    bolt: '<path d="M13 3L5 13.5h6L10.5 21 19 10h-6z" ' + ST + '/>',
    search: '<g ' + ST + '><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></g>',
    star: '<path d="M12 4l2.4 5 5.4.7-4 3.8 1 5.4L12 16.3 7.2 18.9l1-5.4-4-3.8 5.4-.7z" ' + ST + '/>',
    globe: '<g ' + ST + '><circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.6 2.4 3.9 5.2 3.9 8.5s-1.3 6.1-3.9 8.5c-2.6-2.4-3.9-5.2-3.9-8.5s1.3-6.1 3.9-8.5z"/></g>',
    code: '<path d="M8.5 7L4 12l4.5 5M15.5 7L20 12l-4.5 5M13.5 5l-3 14" ' + ST + '/>',
    git: '<g ' + ST + '><circle cx="7" cy="6" r="2.2"/><circle cx="7" cy="18" r="2.2"/><circle cx="17" cy="9" r="2.2"/><path d="M7 8.2v7.6M17 11.2c0 3-3.5 3.3-10 4.6"/></g>',
    warn: '<g ' + ST + '><path d="M12 4l9 15.5H3z"/><path d="M12 10v4.5M12 17h.01"/></g>',
    phone: '<g ' + ST + '><rect x="7" y="3" width="10" height="18" rx="2.5"/><path d="M11 18h2"/></g>',
    db: '<g ' + ST + '><ellipse cx="12" cy="6.5" rx="7" ry="2.8"/><path d="M5 6.5v11c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8v-11M5 12c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8"/></g>',
    key: '<g ' + ST + '><circle cx="8" cy="15" r="3.5"/><path d="M10.5 12.5L19 4M15.5 7.5l2.5 2.5"/></g>',
    send: '<path d="M4 12l16-7-6 15-2.5-6.5z" ' + ST + '/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4" ' + ST + '/>',
    book: '<g ' + ST + '><path d="M5 4.5h10a3 3 0 0 1 3 3V20H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h10"/></g>',
    flask: '<path d="M9.5 3.5h5M10.5 3.5v6L5 19a1.5 1.5 0 0 0 1.3 2.2h11.4A1.5 1.5 0 0 0 19 19l-5.500-9.500v-6M8 15h8" ' + ST + '/>',
    image: '<g ' + ST + '><rect x="3.500" y="5" width="17" height="14" rx="2"/><path d="M4 16l4.500-4.500 4 4 2.500-2.500 5 5"/><circle cx="9" cy="9.500" r="1.300"/></g>',
    moon: '<path d="M19 14.500A7.500 7.500 0 0 1 9.500 5a7.500 7.500 0 1 0 9.500 9.500z" ' + ST + '/>',
    store: '<g ' + ST + '><path d="M4 9.500l1.500-5h13l1.500 5M5 10v9.500h14V10"/><path d="M4 9.500a2.700 2.700 0 0 0 5.300 0 2.700 2.700 0 0 0 5.400 0 2.700 2.700 0 0 0 5.300 0M10 19.500v-5h4v5"/></g>',
    link: '<g ' + ST + '><path d="M10 14a4 4 0 0 0 5.700 0l3-3a4 4 0 0 0-5.700-5.700l-1 1"/><path d="M14 10a4 4 0 0 0-5.700 0l-3 3a4 4 0 0 0 5.700 5.700l1-1"/></g>',
    hash: '<path d="M9 4L7 20M17 4l-2 16M4.500 9h16M3.500 15h16" ' + ST + '/>',
    inbox: '<g ' + ST + '><path d="M4 13l2.500-8h11L20 13v6H4z"/><path d="M4 13h4.500l1 2.500h5l1-2.500H20"/></g>',
    filter: '<path d="M4 5.500h16l-6 7.500v5.500l-4 1.500v-7z" ' + ST + '/>',
    video: '<g ' + ST + '><rect x="3.500" y="6" width="12.500" height="12" rx="2"/><path d="M16 10.500l4.500-2.500v8L16 13.500"/></g>',
    tg: '<path d="M20.500 4.500L3.500 11l5 1.800M20.500 4.500l-3 14.500-9-5.700M20.500 4.500L8.500 12.800v5.200l3-3.200" ' + ST + '/>'
  };
  function sprite() {
    if ($('#pf-sprite')) return;
    var html = '<svg id="pf-sprite" xmlns="' + SVGNS + '" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true">';
    Object.keys(ICONS).forEach(function (k) { html += '<symbol id="i-' + k + '" viewBox="0 0 24 24">' + ICONS[k] + '</symbol>'; });
    html += '</svg>';
    var d = document.createElement('div');
    d.innerHTML = html;
    document.body.insertBefore(d.firstChild, document.body.firstChild);
  }

  /* ---------- language ---------- */
  PF.lang = function () { return document.documentElement.getAttribute('data-lang') === 'en' ? 'en' : 'ru'; };
  PF.setLang = function (l) {
    l = l === 'en' ? 'en' : 'ru';
    var root = document.documentElement;
    root.setAttribute('data-lang', l);
    root.setAttribute('lang', l);
    try { localStorage.setItem('pf-lang', l); } catch (e) {}
    $$('[data-setlang]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-setlang') === l)); });
    var tr = $('title[data-' + l + ']');
    if (tr) document.title = tr.getAttribute('data-' + l);
    $$('.app[data-app]').forEach(function (el) { if (el.__pf) mount(el); });
  };

  /* ---------- shared UI pieces handed to every app through ctx ---------- */
  function seg(label, options, value, onChange) {
    var btns = options.map(function (o) {
      return h('button', { type: 'button', 'data-v': o[0], 'aria-pressed': String(o[0] === value), onclick: function () { if (w.value === o[0]) return; w.set(o[0]); onChange && onChange(o[0]); } }, o[1]);
    });
    var w = h('div.segw', null, label ? h('span.seg-l', null, label) : null, h('div.seg', { role: 'group', 'aria-label': label || '' }, btns));
    w.value = value;
    w.set = function (v) { w.value = v; btns.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-v') === v)); }); };
    w.btn = function (v) { return btns.filter(function (b) { return b.getAttribute('data-v') === v; })[0] || null; };
    return w;
  }
  function win(ic, title, note) {
    var head = h('div.win-h', null, ic ? icon(ic) : null, h('span', null, title), note ? h('small', null, note) : null);
    var w = h('div.win', null, head);
    for (var i = 3; i < arguments.length; i++) add(w, arguments[i]);
    w.note = function (t) { var s = $('small', head); if (!s) { s = h('small'); head.appendChild(s); } s.textContent = t; };
    w.title = function (t) { $('span', head).textContent = t; };
    return w;
  }
  function logger(emptyText, sysLabel) {
    var el = h('ol.log');
    var api = {
      el: el,
      clear: function () { el.innerHTML = ''; el.appendChild(h('li.empty', null, emptyText)); },
      add: function (time, text, kind) {
        var e = $('.empty', el); if (e) e.remove();
        var sp = h('span', kind === 'sys' ? { 'data-sys': sysLabel } : null, text);
        var li = h('li.in-pop' + (kind ? '.' + kind : ''), null, h('time', null, time), sp);
        el.appendChild(li);
        el.scrollTop = el.scrollHeight;
        return li;
      }
    };
    api.clear();
    return api;
  }
  function counters(defs, cls) {
    var map = {};
    var el = h('div.cnts' + (cls ? '.' + cls : ''), null, defs.map(function (d) {
      var b = h('b', null, d[2] == null ? '0' : d[2]);
      map[d[0]] = b;
      return h('div', null, b, h('span', null, d[1]));
    }));
    return { el: el, set: function (k, v) { if (map[k] && map[k].textContent !== String(v)) { map[k].textContent = v; map[k].classList.remove('in-pop'); void map[k].offsetWidth; map[k].classList.add('in-pop'); } } };
  }

  /* ---------- mounting ---------- */
  function mount(el) {
    var id = el.getAttribute('data-app'), def = PF.apps[id];
    if (!def) return;
    if (el.__pf) el.__pf.destroy();
    var lang = PF.lang();
    var T = function (ru, en) { return lang === 'ru' ? ru : en; };
    var timers = [];
    var inst = { auto: false, t: null };
    el.innerHTML = '';

    var bar = h('div.demo-bar-app');
    var autoL = h('span', null, T('Показать автоматически', 'Play automatically'));
    var autoI = icon('play');
    var autoBtn = h('button.btn.btn-acc', { type: 'button', 'data-act': 'auto' }, autoI, autoL);
    var resetBtn = h('button.btn', { type: 'button', 'data-act': 'reset' }, icon('reset'), T('Сначала', 'Reset'));
    var now = h('p.demo-now', { 'aria-live': 'polite', hidden: true });
    var body = h('div.demo-body');
    var end = h('div.demo-end', { hidden: true });
    var box = h('div.demo', null, h('div.demo-bar', null, bar, h('span.sp'), autoBtn, resetBtn), now, body, end);
    el.appendChild(box);
    if (def.cap) el.appendChild(h('p.demo-cap', null, T(def.cap[0], def.cap[1])));

    // On a phone eleven stacked demos make the page endless: show a preview and open the demo on tap.
    if (window.innerWidth <= 700 && !el.hasAttribute('data-open') && !el.__open) {
      el.classList.add('fold');
      var more = h('button.btn.btn-acc', { type: 'button' }, icon('arrow'), T('Открыть демо', 'Open the demo'));
      var veil = h('div.fold-veil', null, more);
      box.appendChild(veil);
      var unfold = function () { if (!el.classList.contains('fold')) return; el.classList.remove('fold'); el.__open = true; veil.remove(); };
      more.addEventListener('click', function (e) { e.stopPropagation(); unfold(); });
      box.addEventListener('click', unfold, true);
    }

    function paintAuto() {
      autoL.textContent = inst.auto ? T('Остановить', 'Stop') : T('Показать автоматически', 'Play automatically');
      autoI.firstChild.setAttribute('href', inst.auto ? '#i-stop' : '#i-play');
      autoBtn.classList.toggle('btn-acc', !inst.auto);
    }
    function stopAuto() {
      if (!inst.auto) return;
      inst.auto = false; clearTimeout(inst.t);
      $$('.auto-press', box).forEach(function (n) { n.classList.remove('auto-press'); });
      paintAuto();
    }
    function tick() {
      if (!inst.auto) return;
      var n = api.next ? api.next() : null;
      if (n === 'wait') { inst.t = setTimeout(tick, 300); return; }
      if (!n) { stopAuto(); return; }
      n.classList.add('auto-press');
      try { n.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: RM ? 'auto' : 'smooth' }); } catch (e) {}
      inst.t = setTimeout(function () {
        n.classList.remove('auto-press');
        if (!inst.auto) return;
        n.click();
        inst.t = setTimeout(tick, def.pace || 1100);
      }, RM ? 250 : 850);
    }
    function doReset() {
      ctx.clearTimers(); ctx.end(null);
      if (api.reset) api.reset();
    }
    var ctx = {
      el: el, body: body, bar: bar, lang: lang, T: T, h: h, icon: icon, esc: esc, RM: RM,
      seg: seg, win: win, logger: logger, counters: counters,
      now: function (html) { now.innerHTML = html || ''; now.hidden = !html; },
      end: function (html) { end.innerHTML = html || ''; end.hidden = !html; },
      later: function (fn, ms) { var t = setTimeout(fn, RM ? Math.min(ms, 80) : ms); timers.push(t); return t; },
      clearTimers: function () { timers.forEach(clearTimeout); timers.length = 0; },
      /* reveal text gradually, like a model writing; calls done() at the end */
      type: function (node, text, done, step) {
        if (RM) { node.textContent = text; done && done(); return; }
        var words = text.split(/(\s+)/), i = 0;
        node.textContent = '';
        (function go() {
          i = Math.min(words.length, i + 3);
          node.textContent = words.slice(0, i).join('');
          if (i < words.length) ctx.later(go, step || 55); else done && done();
        })();
      },
      /* on a phone the windows are stacked, so bring the part that just changed into view */
      focus: function (node) {
        if (!node || window.innerWidth > 900) return;
        var r = box.getBoundingClientRect();
        if (r.bottom < 0 || r.top > window.innerHeight) return;
        try { node.scrollIntoView({ block: 'center', inline: 'nearest', behavior: RM ? 'auto' : 'smooth' }); } catch (e) {}
      },
      stopAuto: stopAuto
    };
    var api = def.mount(ctx) || {};

    autoBtn.addEventListener('click', function () {
      if (inst.auto) { stopAuto(); return; }
      inst.auto = true; paintAuto();
      var n = api.next ? api.next() : null;
      if (!n) doReset();
      tick();
    });
    resetBtn.addEventListener('click', function () { stopAuto(); doReset(); });
    /* a real click inside the demo hands control back to the visitor */
    box.addEventListener('click', function (e) { if (e.isTrusted && inst.auto && !autoBtn.contains(e.target)) stopAuto(); }, true);
    var vis = null;
    if (HAS_IO) { vis = new IntersectionObserver(function (es) { if (!es[0].isIntersecting) stopAuto(); }, { threshold: 0 }); vis.observe(box); }

    el.__pf = { destroy: function () { stopAuto(); ctx.clearTimers(); if (vis) vis.disconnect(); if (api.destroy) api.destroy(); el.__pf = null; } };
  }

  var lazy = HAS_IO ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { lazy.unobserve(e.target); mount(e.target); } });
  }, { rootMargin: '500px 0px' }) : null;
  function scan() {
    $$('.app[data-app]').forEach(function (el) {
      if (el.__pf || el.__seen || !PF.apps[el.getAttribute('data-app')]) return;
      el.__seen = true;
      if (lazy && !el.hasAttribute('data-eager')) lazy.observe(el); else mount(el);
    });
  }
  PF.app = function (id, def) { PF.apps[id] = def; if (document.body) scan(); };

  /* ---------- page chrome ---------- */
  function init() {
    sprite();
    var saved = null;
    try { saved = localStorage.getItem('pf-lang'); } catch (e) {}
    var q = /[?&]lang=(ru|en)/.exec(location.search);
    var l = q ? q[1] : saved || ((navigator.language || 'ru').slice(0, 2).toLowerCase() === 'ru' ? 'ru' : 'en');
    document.documentElement.setAttribute('data-lang', l);
    PF.setLang(l);
    $$('[data-setlang]').forEach(function (b) { b.addEventListener('click', function () { PF.setLang(b.getAttribute('data-setlang')); }); });
    scan();
    // A demo whose script did not load must not leave an empty box on the page.
    addEventListener('load', function () {
      $$('.app[data-app]').forEach(function (el) { if (!PF.apps[el.getAttribute('data-app')]) el.classList.add('app-missing'); });
    });

    var prog = $('.prog'), busy = false;
    if (prog) {
      var onScroll = function () {
        if (busy) return; busy = true;
        requestAnimationFrame(function () {
          var d = document.documentElement, max = d.scrollHeight - d.clientHeight;
          prog.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, (d.scrollTop || document.body.scrollTop || 0) / max) : 0) + ')';
          busy = false;
        });
      };
      addEventListener('scroll', onScroll, { passive: true });
      addEventListener('resize', onScroll, { passive: true });
      onScroll();
    }
    if (HAS_IO) {
      var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { threshold: 0 });
      $$('.rv').forEach(function (n) { io.observe(n); });
      var vio = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          var v = e.target;
          if (e.isIntersecting && !RM) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } else if (!e.isIntersecting) v.pause();
        });
      }, { threshold: 0.5 });
      $$('video[data-auto]').forEach(function (v) { vio.observe(v); });
    } else {
      $$('.rv').forEach(function (n) { n.classList.add('in'); });
    }
    $$('[data-copy]').forEach(function (b) {
      b.addEventListener('click', function () {
        var text = b.getAttribute('data-copy'), note = $('small', b), old = note ? note.textContent : '';
        var ok = function () { if (note) { note.textContent = PF.lang() === 'ru' ? 'скопировано' : 'copied'; setTimeout(function () { note.textContent = old; }, 1400); } };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(ok, function () {});
        else { var ta = h('textarea', { style: 'position:fixed;opacity:0' }, text); document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); ok(); } catch (e) {} ta.remove(); }
      });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
