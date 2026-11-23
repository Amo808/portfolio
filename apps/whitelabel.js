/* Mini app: White Label storefront on a rental marketplace. A partner sets the brand, connects its own domain and publishes;
   then a guest's request goes through the queue with the bot check and lands where the partner chose.
   Same structure as apps/support.js: state object S, one base render, small incremental updates while it runs. */
(function () {
  'use strict';

  /* Own styles. Colours come from site.css variables, with two exceptions the brief asks for:
     the swatches (inline) and the storefront inside the preview, which has its own light palette. */
  var CSS = [
    /* settings form */
    '.whitelabel-form{display:grid;gap:14px;padding:14px}',
    '.whitelabel-f{display:grid;gap:7px;min-width:0}',
    '.whitelabel-f>.lbl{margin:0;font:500 11.5px/1 var(--fm);letter-spacing:.05em;text-transform:uppercase}',
    '.whitelabel-inp{min-height:42px}',
    '.whitelabel-inp:disabled{opacity:.6}',
    '.whitelabel-dom{font-family:var(--fm);font-size:13px}',
    '.whitelabel-row{display:flex;flex-wrap:wrap;align-items:center;gap:8px 10px;min-width:0}',
    '.whitelabel-row>.inp{flex:1 1 190px;width:auto;min-width:0}',
    '.whitelabel-row>.btn{flex:0 0 auto}',
    '.whitelabel-row>p{flex:1 1 110px;min-width:0;font-size:13px;line-height:1.35;color:var(--ink3)}',
    '.whitelabel-form .btn-sm{min-height:38px}',
    '.whitelabel-sw button{width:38px;height:38px;transition:transform .14s var(--ease-out)}',
    '.whitelabel-sw button:active{transform:scale(.92)}',
    '.whitelabel-sw button[aria-pressed="true"]{box-shadow:inset 0 0 0 3px var(--bg)}',
    '.whitelabel-dns{display:grid;gap:5px;align-content:start;min-height:45px}',
    '.whitelabel-dns p{font-size:13.5px}',
    '.whitelabel-dns .typing{margin-left:2px}',
    '.whitelabel-hint{font-size:13px;line-height:1.4;color:var(--ink3)}',
    '.whitelabel-pub{width:100%}',
    '.whitelabel-f>.okl{align-items:flex-start;font-size:13.5px;line-height:1.4}',
    '.whitelabel-f>.okl svg{margin-top:2px}',
    '.whitelabel-logo{width:40px;height:40px;flex:none;display:grid;place-items:center;border-radius:50%;background:var(--whitelabel-acc);color:var(--ink);font:700 19px/1 Georgia,"Times New Roman",serif;transition:border-radius .3s var(--ease-out),background-color .3s ease}',
    '.whitelabel-logo.sq{border-radius:28%}',

    /* browser frame around the storefront */
    '.whitelabel-chrome{display:flex;align-items:center;gap:8px;padding:8px 10px;background:var(--bg2);border-bottom:1px solid var(--line)}',
    '.whitelabel-dots{display:flex;gap:5px;flex:none;margin-right:2px}',
    '.whitelabel-dots i{width:9px;height:9px;border-radius:50%;background:var(--line)}',
    '.whitelabel-addr{flex:1;min-width:0;display:flex;align-items:center;gap:7px;min-height:32px;padding:6px 10px;border-radius:9px;background:var(--bg);border:1px solid var(--line2);font:500 12.5px/1.2 var(--fm);color:var(--ink3)}',
    '.whitelabel-addr svg{width:14px;height:14px;flex:none}',
    '.whitelabel-addr span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.whitelabel-addr.tls{color:var(--ink)}',
    '.whitelabel-addr.tls svg{color:var(--ok)}',
    '.whitelabel-chrome .tg{flex:none}',
    '.whitelabel-note{border-bottom:0;border-top:1px solid var(--line2)}',

    /* the storefront itself: a different website, so its light palette is hard-coded on purpose */
    '.whitelabel-site{container:whitelabel / inline-size;color-scheme:light;background:#F5F1E8;color:#1A2330;font:400 14px/1.45 var(--fb);padding-bottom:14px}',
    '.whitelabel-top{display:flex;align-items:center;gap:10px;padding:11px 16px;background:#FFFFFF;border-bottom:1px solid #E6DFD2}',
    '.whitelabel-site .whitelabel-logo{width:34px;height:34px;font-size:17px;color:#FFFFFF}',
    '.whitelabel-name{font:700 17px/1.2 Georgia,"Times New Roman",serif;min-width:0;overflow-wrap:anywhere}',
    '.whitelabel-nav{margin-left:auto;display:flex;gap:16px;font-size:13px;color:#5E6978;white-space:nowrap}',
    '.whitelabel-nav b{font-weight:600;color:var(--whitelabel-acc);box-shadow:0 2px 0 var(--whitelabel-acc);padding-bottom:2px;transition:color .3s ease,box-shadow .3s ease}',
    '.whitelabel-hero{padding:16px 16px 15px;margin-bottom:12px;background-color:color-mix(in srgb,var(--whitelabel-acc) 11%,#FFFFFF);transition:background-color .3s ease}',
    '.whitelabel-hero h4{font:700 22px/1.2 Georgia,"Times New Roman",serif;letter-spacing:-.01em}',
    '.whitelabel-hero p{margin-top:5px;font-size:13.5px;color:#4E5968}',
    '.whitelabel-cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;padding:0 16px}',
    '.whitelabel-card{display:flex;flex-direction:column;min-width:0;background:#FFFFFF;border:1px solid #E6DFD2;border-radius:12px;overflow:hidden}',
    '.whitelabel-ph{height:76px;flex:none}',
    '.whitelabel-p1{background:radial-gradient(circle at 80% 30%,#FFF4B8 0 9%,transparent 10%),linear-gradient(180deg,#9AD8F4 0 55%,#2BB5C4 55% 100%)}',
    '.whitelabel-p2{background:linear-gradient(180deg,transparent 0 62%,#3D55B0 62% 100%),radial-gradient(circle at 50% 62%,#FFE9A6 0 13%,transparent 14%),linear-gradient(180deg,#FFB27A,#FF8C93)}',
    '.whitelabel-p3{background:radial-gradient(90% 80% at 18% 118%,#2E9C69 0 60%,transparent 61%),radial-gradient(90% 80% at 88% 128%,#58BA8A 0 60%,transparent 61%),linear-gradient(180deg,#BEE7F3,#EAF6DE)}',
    '.whitelabel-cb{display:flex;flex-direction:column;gap:3px;flex:1;min-width:0;padding:10px 12px 12px}',
    '.whitelabel-card h5{font:700 13.5px/1.3 var(--fb);min-height:2.6em}',
    '.whitelabel-card h5 i{display:none;font-style:normal}',
    '.whitelabel-card h5 span{display:block;font-weight:500;color:#5E6978}',
    '.whitelabel-meta{font-size:12px;line-height:1.35;color:#5E6978}',
    '.whitelabel-price{font-size:12.5px;color:#5E6978;margin-bottom:8px}',
    '.whitelabel-price b{font:700 15px/1.3 var(--fb);color:#1A2330}',
    '.whitelabel-go{display:flex;align-items:center;justify-content:center;gap:6px;width:100%;min-height:38px;padding:8px 10px;border:0;border-radius:9px;background-color:var(--whitelabel-acc);box-shadow:inset 0 0 0 1.5px var(--whitelabel-acc);color:#FFFFFF;font:600 13px/1.2 var(--fb);text-align:center;cursor:pointer;transition:background-color .3s ease,color .3s ease,box-shadow .3s ease,opacity .2s ease,transform .14s var(--ease-out)}',
    '.whitelabel-go svg{width:14px;height:14px;flex:none}',
    '.whitelabel-go:active{transform:scale(.97)}',
    '.whitelabel-go[disabled]{opacity:.5;cursor:default;transform:none}',
    '.whitelabel-site.draft .whitelabel-go{background-color:#FFFFFF;color:var(--whitelabel-acc);opacity:1}',
    '.whitelabel-rf{display:grid;gap:6px}',
    '.whitelabel-in{display:block;width:100%;min-width:0;height:34px;padding:6px 9px;border:1px solid #D8D1C4;border-radius:8px;background:#FFFFFF;color:#1A2330;font:400 13px/1.3 var(--fb)}',
    '.whitelabel-in:focus-visible{outline:2px solid var(--whitelabel-acc);outline-offset:1px}',
    '.whitelabel-sent{display:flex;align-items:center;gap:6px;min-height:38px;font:600 13px/1.2 var(--fb);color:#1B7A46}',
    '.whitelabel-sent svg{width:15px;height:15px;flex:none}',
    '@container whitelabel (max-width:520px){',
    '.whitelabel-nav{display:none}',
    '.whitelabel-hero h4{font-size:20px}',
    '.whitelabel-cards{grid-template-columns:minmax(0,1fr)}',
    '.whitelabel-card{flex-direction:row}',
    '.whitelabel-ph{width:86px;height:auto}',
    '.whitelabel-card h5{min-height:0;font-size:14px}',
    '.whitelabel-card h5 i,.whitelabel-card h5 span{display:inline;font-weight:inherit;color:inherit}',
    '}',

    /* where the request went: route through the queue and two destinations */
    '.whitelabel-way{display:grid;gap:12px;padding:12px;border-bottom:1px solid var(--line)}',
    '.whitelabel-route{display:flex;flex-wrap:wrap;align-items:center;gap:8px}',
    '.whitelabel-hop{display:flex;align-items:center;gap:8px;min-width:0;padding:6px 12px 6px 6px;border:1px solid var(--line2);border-radius:999px;background:var(--card);font:500 13px/1.25 var(--fb);color:var(--ink2);transition:border-color .25s var(--ease-out),box-shadow .25s var(--ease-out),opacity .25s ease,color .25s ease}',
    '.whitelabel-n{width:24px;height:24px;flex:none;display:grid;place-items:center;border-radius:50%;border:1.5px solid var(--line);background:var(--bg);color:var(--ink3);font:700 11.5px/1 var(--fm);transition:background-color .25s ease,border-color .25s ease,color .25s ease}',
    '.whitelabel-n svg{width:13px;height:13px}',
    '.whitelabel-hop.idle{opacity:.62}',
    '.whitelabel-hop.run{border-color:var(--acc);box-shadow:0 0 0 3px var(--acc-soft);color:var(--ink)}',
    '.whitelabel-hop.run .whitelabel-n{border-color:var(--acc);background:var(--acc-soft);color:var(--acc-ink)}',
    '.whitelabel-hop.done{color:var(--ink)}',
    '.whitelabel-hop.done .whitelabel-n{border-color:var(--ok);background:var(--ok);color:var(--bg)}',
    '.whitelabel-sep{display:flex;color:var(--ink3)}',
    '.whitelabel-sep svg{width:16px;height:16px}',
    '.whitelabel-lanes{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;align-items:start}',
    '.whitelabel-lane{min-width:0;border:1px solid var(--line2);border-radius:14px;background:var(--bg2);transition:border-color .25s var(--ease-out),box-shadow .25s var(--ease-out)}',
    '.whitelabel-lane.on{border-color:var(--acc);box-shadow:0 0 0 3px var(--acc-soft)}',
    '.whitelabel-lane-h{display:flex;flex-wrap:wrap;align-items:center;gap:6px 8px;min-height:44px;padding:8px 12px;border-bottom:1px solid var(--line2);font:600 13.5px/1.2 var(--fb)}',
    '.whitelabel-lane-h svg{width:16px;height:16px;flex:none;color:var(--ink3)}',
    '.whitelabel-lane-h .tg{margin-left:auto}',
    '.whitelabel-lane-b{display:grid;gap:10px;padding:10px}',
    '.whitelabel-empty{font-size:13px;line-height:1.4;color:var(--ink3);padding:4px 2px}',
    '.whitelabel-rq-h{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:6px 10px;margin-bottom:8px}',
    '.whitelabel-rq-h .bc-to{margin:0}',
    '.whitelabel-way .tg svg{width:12px;height:12px;margin-right:5px;flex:none}',

    '@media (max-width:640px){',
    '.whitelabel-inp,.whitelabel-in{font-size:16px}',
    '.whitelabel-chk{flex:1 1 auto!important}',
    '.whitelabel-dots{display:none}',
    '.whitelabel-chrome{padding:8px;gap:6px}',
    '.whitelabel-addr{font-size:11.5px;padding:6px 8px;gap:6px}',
    '.whitelabel-route{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}',
    '.whitelabel-hop{border-radius:14px}',
    '.whitelabel-sep{display:none}',
    '.whitelabel-lanes{grid-template-columns:minmax(0,1fr)}',
    '}',
    '@media (prefers-reduced-motion:reduce){.whitelabel-logo,.whitelabel-go,.whitelabel-hop,.whitelabel-n,.whitelabel-lane,.whitelabel-hero,.whitelabel-nav b,.whitelabel-sw button{transition:none}}'
  ].join('\n');
  var uid = 0;

  PF.app('whitelabel', {
    cap: [
      'Макет на выдуманных данных. В настоящем продукте партнёр настраивает витрину так же и сразу видит превью.',
      'A mock on invented data. In the real product a partner sets up the storefront the same way and sees the preview at once.'
    ],
    pace: 2000,
    mount: function (ctx) {
      var T = ctx.T, h = ctx.h, icon = ctx.icon;
      if (!document.getElementById('pf-whitelabel-css')) document.head.appendChild(h('style', { id: 'pf-whitelabel-css', text: CSS }));
      var id = 'pf-whitelabel-' + (++uid);

      /* ---------- invented data ---------- */
      var DEF_NAME = 'Sunrise Villas', DEF_DOMAIN = 'stay.sunrise-villas.com';
      var COLORS = [
        ['#C2410C', T('оранжевый', 'orange')],
        ['#0E7490', T('бирюзовый', 'teal')],
        ['#1D4ED8', T('синий', 'blue')],
        ['#6D28D9', T('фиолетовый', 'violet')],
        ['#15803D', T('зелёный', 'green')]
      ];
      var TOUR_SW = [3, 1];
      var PROPS = [
        { a: T('Вилла с бассейном', 'Pool villa'), b: T('Раваи', 'Rawai'), m: T('3 спальни · до 6 гостей', '3 bedrooms · 6 guests'), p: '$210' },
        { a: T('Вилла у моря', 'Seaside villa'), b: T('Ката', 'Kata'), m: T('2 спальни · до 4 гостей', '2 bedrooms · 4 guests'), p: '$165' },
        { a: T('Дом с садом', 'Garden house'), b: T('Най Харн', 'Nai Harn'), m: T('4 спальни · до 8 гостей', '4 bedrooms · 8 guests'), p: '$240' }
      ];
      PROPS.forEach(function (p) { p.t = p.a + ' · ' + p.b; });
      var GUESTS = [
        [T('Анна К.', 'Anna K.'), T('12–19 декабря', '12–19 December')],
        [T('Марк Л.', 'Mark L.'), T('3–10 января', '3–10 January')],
        [T('Ольга Т.', 'Olga T.'), T('21–28 января', '21–28 January')]
      ];
      var DEST = { crm: T('CRM партнёра', "Partner's CRM"), owner: T('Владелец объекта', 'Property owner') };
      var TO = { crm: T('в CRM партнёра', "to the partner's CRM"), owner: T('владельцу объекта', 'to the property owner') };
      var YES = T('да', 'yes'), NO = T('нет', 'no');
      var S, clock = 0, holdTok = 0, lastName = DEF_NAME;
      function fresh() {
        return { name: DEF_NAME, shape: 'circle', color: 0, tints: 0, domain: DEF_DOMAIN, dns: 'idle', changed: false, dest: 'crm',
          pub: false, going: false, busy: false, hold: false, form: -1, sent: -1, reqs: 0, bots: 0, mins: 0, got: { crm: [], owner: [] } };
      }

      /* ---------- static frame: settings ---------- */
      var nameInp = h('input.inp.whitelabel-inp', { id: id + '-n', type: 'text', maxlength: '24', autocomplete: 'off', spellcheck: 'false', oninput: onName, onchange: onNameDone });
      var logoS = h('span.whitelabel-logo', { 'aria-hidden': 'true' });
      var shapeBtn = h('button.btn.btn-sm', { type: 'button', onclick: onShape }, T('Сменить форму', 'Change shape'));
      var swBtns = COLORS.map(function (c, i) {
        return h('button', { type: 'button', style: 'background:' + c[0], title: c[1], 'aria-label': c[1], 'aria-pressed': 'false', onclick: function () { setColor(i); } });
      });
      var domInp = h('input.inp.whitelabel-inp.whitelabel-dom', { id: id + '-d', type: 'text', inputmode: 'url', maxlength: '40', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false',
        oninput: onDomain, onkeydown: function (e) { if (e.key === 'Enter') checkDns(); } });
      var dnsBtn = h('button.btn.whitelabel-chk', { type: 'button', onclick: checkDns }, icon('search'), T('Проверить DNS', 'Check DNS'));
      var dnsBox = h('div.whitelabel-dns', { 'aria-live': 'polite' });
      var segDest = ctx.seg(T('Куда идут заявки', 'Where requests go'), [
        ['crm', T('CRM партнёра', "Partner's CRM")],
        ['owner', T('Владельцу объекта', 'Property owner')]
      ], 'crm', onDest);
      var pubL = h('span');
      var pubBtn = h('button.btn.btn-acc.whitelabel-pub', { type: 'button', onclick: publish }, icon('globe'), pubL);
      var pubNote = h('p');
      var winSet = ctx.win('store', T('Настройки витрины', 'Storefront settings'), T('кабинет партнёра', "partner's account"),
        h('div.whitelabel-form', null,
          h('div.whitelabel-f', null, h('label.lbl', { 'for': id + '-n' }, T('Название · до 24 знаков', 'Name · up to 24 characters')), nameInp),
          h('div.whitelabel-f', null, h('span.lbl', null, T('Логотип', 'Logo')),
            h('div.whitelabel-row', null, logoS, h('p', null, T('Первая буква названия в акцентном цвете', 'First letter of the name in the accent colour')), shapeBtn)),
          h('div.whitelabel-f', null, h('span.lbl', null, T('Акцентный цвет', 'Accent colour')),
            h('div.swatches.whitelabel-sw', { role: 'group', 'aria-label': T('Акцентный цвет', 'Accent colour') }, swBtns)),
          h('div.whitelabel-f', null, h('label.lbl', { 'for': id + '-d' }, T('Домен', 'Domain')), h('div.whitelabel-row', null, domInp, dnsBtn), dnsBox),
          segDest,
          h('div.whitelabel-f', null, pubBtn, pubNote)));

      /* ---------- static frame: preview ---------- */
      var addrI = icon('globe'), addrT = h('span');
      var addr = h('div.whitelabel-addr', null, addrI, addrT);
      var pubTag = h('span.tg');
      var logoP = h('span.whitelabel-logo', { 'aria-hidden': 'true' }), nameP = h('b.whitelabel-name');
      var cards = PROPS.map(function (p, i) {
        var act = h('div');
        return { act: act, btn: null, send: null, who: null, dates: null,
          el: h('article.whitelabel-card', null, h('div.whitelabel-ph.whitelabel-p' + (i + 1), { 'aria-hidden': 'true' }),
            h('div.whitelabel-cb', null, h('h5', null, p.a, h('i', null, ' · '), h('span', null, p.b)), h('p.whitelabel-meta', null, p.m), h('p.whitelabel-price', null, h('b', null, p.p), T(' / ночь', ' / night')), act)) };
      });
      var site = h('div.whitelabel-site', null,
        h('div.whitelabel-top', null, logoP, nameP,
          h('span.whitelabel-nav', { 'aria-hidden': 'true' }, h('b', null, T('Виллы', 'Villas')), h('span', null, T('Районы', 'Areas')), h('span', null, T('Контакты', 'Contacts')))),
        h('div.whitelabel-hero', null, h('h4', null, T('Виллы у моря на Пхукете', 'Villas by the sea in Phuket')),
          h('p', null, T('Аренда от управляющей компании. Выберите виллу и оставьте заявку.', 'Rentals from a management company. Pick a villa and send a request.'))),
        h('div.whitelabel-cards', null, cards.map(function (c) { return c.el; })));
      var noteP = h('p.win-note.whitelabel-note');
      var frame = h('div', null,
        h('div.whitelabel-chrome', null, h('span.whitelabel-dots', { 'aria-hidden': 'true' }, h('i'), h('i'), h('i')), addr, pubTag), site, noteP);
      var winPrev = ctx.win('globe', T('Превью витрины', 'Storefront preview'), T('обновляется сразу', 'updates at once'), frame);

      /* ---------- static frame: where the request went ---------- */
      var hops = [T('Заявка с витрины', 'Request from the storefront'), T('Очередь', 'Queue'), T('Проверка от ботов', 'Bot check'), ''].map(function (t) {
        var n = h('span.whitelabel-n'), l = h('span', null, t);
        return { n: n, l: l, el: h('li.whitelabel-hop.idle', null, n, l) };
      });
      var routeEl = h('ol.whitelabel-route');
      hops.forEach(function (x, i) {
        if (i) routeEl.appendChild(h('li.whitelabel-sep', { 'aria-hidden': 'true' }, icon('arrow')));
        routeEl.appendChild(x.el);
      });
      function lane(d, ic) {
        var tag = h('span.tg.tg-acc', null, T('заявки идут сюда', 'requests go here')), body = h('div.whitelabel-lane-b');
        return { tag: tag, body: body, el: h('div.whitelabel-lane', null, h('div.whitelabel-lane-h', null, icon(ic), h('span', null, DEST[d]), tag), body) };
      }
      var lanes = { crm: lane('crm', 'users'), owner: lane('owner', 'user') };
      var log = ctx.logger(T('Пока пусто. Сюда попадёт каждый шаг: настройка, домен, публикация и заявки.', 'Empty for now. Every step lands here: setup, domain, publishing and requests.'), T('система', 'system'));
      var cnt = ctx.counters([
        ['mins', T('минут до запуска', 'minutes to launch'), '—'],
        ['reqs', T('заявок', 'requests')],
        ['bot', T('прошло проверку от ботов', 'passed the bot check')],
        ['tls', T('домен с TLS', 'domain with TLS'), NO]
      ]);
      var winWay = ctx.win('inbox', T('Куда ушла заявка', 'Where the request went'), T('время условное', 'time is illustrative'),
        h('div.whitelabel-way', null, routeEl, h('div.whitelabel-lanes', null, lanes.crm.el, lanes.owner.el)), log.el, cnt.el);

      winSet.classList.add('o1'); winPrev.classList.add('o2');
      ctx.body.appendChild(h('div.demo-grid.flow', null, h('div.demo-col', null, winSet), h('div.demo-col', null, winPrev)));
      winWay.classList.add('demo-wide');
      ctx.body.appendChild(winWay);

      /* ---------- helpers ---------- */
      function two(n) { return (n < 10 ? '0' : '') + n; }
      /* illustrative clock: the partner opens the settings at 11:02:00 */
      function tm(add) { clock += add; var t = 39720 + clock; return two(Math.floor(t / 3600) % 24) + ':' + two(Math.floor(t / 60) % 60) + ':' + two(t % 60); }
      /* autoplay waits while a hold is on, so the eye has time to read what just changed */
      function hold(ms) { var k = ++holdTok; S.hold = true; ctx.later(function () { if (k === holdTok) S.hold = false; }, ms); }
      function again(node, cls) { node.classList.remove(cls); void node.offsetWidth; node.classList.add(cls); }
      function shown() { return S.name.replace(/\s+/g, ' ').trim() || T('Ваша витрина', 'Your storefront'); }
      function normDomain(v) { return String(v).trim().toLowerCase().replace(/^[a-z]+:\/\//, '').replace(/\/.*$/, ''); }
      function okDomain(d) { return /^([a-z0-9а-яё]([a-z0-9а-яё-]{0,30}[a-z0-9а-яё])?\.)+[a-zа-яё]{2,12}$/.test(d); }
      function mins(n) {
        var a = n % 10, b = n % 100;
        return n + ' ' + T(a === 1 && b !== 11 ? 'минуту' : a >= 2 && a <= 4 && (b < 12 || b > 14) ? 'минуты' : 'минут', n === 1 ? 'minute' : 'minutes');
      }
      function ln(cls, ic, text, dots) {
        return h('p.' + cls, null, icon(ic), h('span', null, text), dots ? h('span.typing', { 'aria-hidden': 'true' }, h('i'), h('i'), h('i')) : null);
      }
      function lockSeg(on) { segDest.querySelectorAll('button').forEach(function (b) { b.disabled = on; }); }

      /* ---------- paint: each one syncs a part of the DOM with S ---------- */
      function paintBrand() {
        var nm = shown(), ch = Array.from(nm)[0].toUpperCase(), c = COLORS[S.color][0];
        [logoS, logoP].forEach(function (l) { l.textContent = ch; l.classList.toggle('sq', S.shape === 'square'); });
        nameP.textContent = nm;
        logoS.style.setProperty('--whitelabel-acc', c);
        frame.style.setProperty('--whitelabel-acc', c);
        swBtns.forEach(function (b, i) { b.setAttribute('aria-pressed', String(i === S.color)); });
      }
      function paintDns() {
        var d = S.dns, tls = d === 'ok', work = d === 'checking' || d === 'found';
        dnsBox.innerHTML = '';
        if (d === 'idle') dnsBox.appendChild(h('p.whitelabel-hint', null, S.changed ? T('Домен изменён. Проверьте DNS ещё раз.', 'The domain has changed. Check DNS again.') : T('Домен ещё не проверен.', 'The domain is not checked yet.')));
        if (d === 'checking') dnsBox.appendChild(ln('wtl', 'clock', T('Ищу DNS-запись домена', 'Looking up the DNS record'), true));
        if (d === 'bad') dnsBox.appendChild(ln('nol', 'x', T('DNS-запись не найдена. Проверьте адрес.', 'No DNS record found. Check the address.')));
        if (d === 'found' || tls) dnsBox.appendChild(ln('okl', 'check', T('DNS найден', 'DNS found')));
        if (d === 'found') dnsBox.appendChild(ln('wtl', 'clock', T('Выпускаю TLS-сертификат', 'Issuing the TLS certificate'), true));
        if (tls) dnsBox.appendChild(ln('okl', 'lock', T('TLS-сертификат выпущен', 'TLS certificate issued')));
        domInp.disabled = dnsBtn.disabled = work || S.going || S.pub;
        addr.classList.toggle('tls', tls);
        addrI.firstChild.setAttribute('href', tls ? '#i-lock' : '#i-globe');
        addrT.textContent = tls ? S.domain : T('предпросмотр без домена', 'preview, no domain yet');
      }
      function paintPub() {
        var ready = S.dns === 'ok';
        pubBtn.hidden = S.pub;
        pubBtn.disabled = !ready || S.busy;
        pubL.textContent = S.going ? T('Публикую…', 'Publishing…') : T('Опубликовать', 'Publish');
        pubNote.innerHTML = '';
        pubNote.className = S.pub ? 'okl' : 'whitelabel-hint';
        if (S.pub) {
          pubNote.appendChild(icon('check'));
          pubNote.appendChild(h('span', null, T('Витрина опубликована. Название и цвет можно менять и дальше.', 'The storefront is published. The name and colour can still be changed.')));
        } else {
          pubNote.textContent = ready ? T('Домен готов, можно публиковать.', 'The domain is ready, you can publish.') : T('Кнопка включится после проверки DNS.', 'The button turns on after the DNS check.');
        }
        pubTag.className = 'tg ' + (S.pub ? 'tg-ok' : 'tg-hum');
        pubTag.textContent = S.pub ? T('Опубликовано', 'Published') : T('Черновик', 'Draft');
        site.classList.toggle('draft', !S.pub);
        noteP.textContent = S.pub ? T('Витрина открыта гостям: кнопки заявок работают.', 'The storefront is open to guests: request buttons work.')
          : T('Черновик: кнопки заявок включатся после публикации.', 'Draft: request buttons turn on after publishing.');
      }
      function paintDest() {
        ['crm', 'owner'].forEach(function (d) { lanes[d].el.classList.toggle('on', d === S.dest); lanes[d].tag.hidden = d !== S.dest; });
        hops[3].l.textContent = DEST[S.dest];
      }
      function paintCards() {
        cards.forEach(function (c, i) {
          c.act.innerHTML = ''; c.btn = c.send = c.who = c.dates = null;
          if (S.form === i) {
            var g = GUESTS[S.reqs % GUESTS.length], go = function (e) { if (e.key === 'Enter') send(i); };
            c.who = h('input.whitelabel-in', { type: 'text', maxlength: '20', value: g[0], autocomplete: 'off', 'aria-label': T('Имя гостя', 'Guest name'), onkeydown: go });
            c.dates = h('input.whitelabel-in', { type: 'text', maxlength: '20', value: g[1], autocomplete: 'off', 'aria-label': T('Даты', 'Dates'), onkeydown: go });
            c.send = h('button.whitelabel-go', { type: 'button', onclick: function () { send(i); } }, icon('send'), T('Отправить заявку', 'Send'));
            c.act.appendChild(h('div.whitelabel-rf.in-pop', null, c.who, c.dates, c.send));
          } else if (S.sent === i) {
            c.act.appendChild(h('p.whitelabel-sent.in-pop', null, icon('check'), T('Заявка отправлена', 'Request sent')));
          } else {
            c.btn = h('button.whitelabel-go', { type: 'button', disabled: !S.pub || S.busy, onclick: function () { openForm(i); } }, T('Оставить заявку', 'Send a request'));
            c.act.appendChild(c.btn);
          }
        });
      }
      function paintLane(d, pop) {
        var body = lanes[d].body, list = S.got[d];
        body.innerHTML = '';
        if (!list.length) {
          body.appendChild(h('p.whitelabel-empty', null, d === 'crm' ? T('В CRM партнёра заявок пока нет.', "No requests in the partner's CRM yet.") : T('Владельцу объекта заявок пока не приходило.', 'No requests have reached the property owner yet.')));
          return;
        }
        list.slice(0, 2).forEach(function (r, k) {
          body.appendChild(h('div.bc' + (pop && !k ? '.in-pop' : ''), null,
            h('div.whitelabel-rq-h', null, h('p.bc-to', null, T('Заявка ', 'Request ') + r.n + ' · ' + r.time),
              h('span.tg.tg-ok', null, icon('shield'), T('прошла проверку от ботов', 'passed the bot check'))),
            h('h5', null, r.who),
            h('p.meta', null, r.dates),
            h('div.thr', null, h('p.bc-to', null, T('Атрибуция брони', 'Booking attribution')),
              h('dl.fields', null,
                h('dt', null, T('Витрина', 'Storefront')), h('dd', null, r.brand),
                h('dt', null, T('Объект', 'Property')), h('dd', null, r.prop),
                h('dt', null, T('Источник', 'Source')), h('dd', null, T('витрина партнёра', 'partner storefront'))))));
        });
        if (list.length > 2) body.appendChild(h('p.whitelabel-empty', null, T('Раньше пришло ещё: ', 'Earlier requests: ') + (list.length - 2)));
      }
      function hop(i, st) {
        var x = hops[i];
        x.el.className = 'whitelabel-hop ' + st;
        x.n.innerHTML = '';
        x.n.appendChild(st === 'done' ? icon('check') : document.createTextNode(String(i + 1)));
      }

      /* ---------- render of the very first state ---------- */
      function base() {
        nameInp.value = S.name; domInp.value = S.domain; lastName = S.name;
        segDest.set(S.dest); lockSeg(false);
        paintBrand(); paintDns(); paintPub(); paintDest(); paintCards(); paintLane('crm'); paintLane('owner');
        hops.forEach(function (x, i) { hop(i, 'idle'); });
        log.clear();
        cnt.set('mins', '—'); cnt.set('reqs', '0'); cnt.set('bot', '0'); cnt.set('tls', NO);
        ctx.end(null);
        ctx.now(T('Вы партнёр, управляющая компания. Поменяйте название или <b>акцентный цвет</b>: превью обновится сразу. Потом нажмите <b>«Проверить DNS»</b>.',
          'You are the partner, a management company. Change the name or the <b>accent colour</b>: the preview updates at once. Then press <b>"Check DNS"</b>.'));
      }
      function start() {
        ctx.clearTimers();
        S = fresh(); clock = 0; holdTok = 0;
        base();
      }

      /* ---------- the partner: brand ---------- */
      function onName() { S.name = nameInp.value.slice(0, 24); paintBrand(); }
      function onNameDone() {
        var n = shown();
        if (n === lastName) return;
        lastName = n;
        log.add(tm(10), T('Партнёр изменил название витрины: ', 'The partner renamed the storefront: ') + n);
      }
      function onShape() {
        S.shape = S.shape === 'circle' ? 'square' : 'circle';
        paintBrand();
        log.add(tm(10), T('Партнёр сменил форму логотипа: ', 'The partner changed the logo shape: ') + (S.shape === 'circle' ? T('круг', 'circle') : T('скруглённый квадрат', 'rounded square')));
      }
      function setColor(i) {
        if (i === S.color) return;
        S.color = i; S.tints++;
        paintBrand();
        log.add(tm(S.tints === 1 ? 20 : 15), T('Партнёр выбрал акцентный цвет: ', 'The partner picked the accent colour: ') + COLORS[i][1]);
      }

      /* ---------- the partner: domain, destination, publishing ---------- */
      function onDomain() {
        if (S.dns === 'idle' || S.busy || S.pub) return;
        if (S.dns === 'ok') {
          S.changed = true;
          cnt.set('tls', NO);
          log.add(tm(5), T('Домен изменён после проверки: нужна новая проверка DNS', 'The domain changed after the check: DNS has to be checked again'), 'warn');
          ctx.now(T('Домен изменился. Нажмите <b>«Проверить DNS»</b> ещё раз: без проверки публикация закрыта.', 'The domain has changed. Press <b>"Check DNS"</b> again: publishing is locked until the check passes.'));
        }
        S.dns = 'idle';
        paintDns(); paintPub();
      }
      function checkDns() {
        if (S.busy || S.pub) return;
        var d = normDomain(domInp.value);
        domInp.value = d; S.domain = d; S.changed = false;
        S.busy = true; S.dns = 'checking';
        paintDns(); paintPub();
        log.add(tm(40), T('Партнёр указал домен и запросил проверку: ', 'The partner entered the domain and asked for a check: ') + (d || '…'));
        ctx.now(T('Система ищет DNS-запись домена, потом выпустит TLS-сертификат.', 'The system looks up the DNS record of the domain, then issues a TLS certificate.'));
        ctx.later(function () {
          if (!okDomain(d)) {
            S.dns = 'bad'; S.busy = false;
            paintDns(); paintPub();
            log.add(tm(5), T('DNS-запись не найдена, публикация закрыта', 'No DNS record found, publishing stays locked'), 'bad');
            ctx.now(T('Для такого адреса нет DNS-записи. Исправьте домен и нажмите <b>«Проверить DNS»</b> ещё раз.', 'There is no DNS record for this address. Fix the domain and press <b>"Check DNS"</b> again.'));
            return;
          }
          S.dns = 'found';
          paintDns();
          log.add(tm(50), T('DNS-запись домена найдена', 'DNS record of the domain found'), 'sys');
          ctx.later(function () {
            S.dns = 'ok'; S.busy = false;
            paintDns(); paintPub(); again(addr, 'flash');
            cnt.set('tls', YES);
            log.add(tm(65), T('TLS-сертификат выпущен, витрина откроется по https', 'TLS certificate issued, the storefront will open over https'), 'sys');
            ctx.now(T('Домен подключён: в адресной строке превью появился замок. Нажмите <b>«Опубликовать»</b>.', 'The domain is connected: the preview address bar now shows a lock. Press <b>"Publish"</b>.'));
            hold(2800);
          }, 1300);
        }, 1100);
      }
      function onDest(v) {
        S.dest = v;
        paintDest();
        log.add(tm(20), T('Партнёр переключил заявки: теперь они идут ', 'The partner switched requests: they now go ') + TO[v]);
        if (S.pub) ctx.now(T('Теперь заявки идут ', 'Requests now go ') + TO[v] + T('. Оставьте заявку на любой вилле в превью.', '. Send a request from any villa in the preview.'));
        hold(2800);
      }
      function publish() {
        if (S.busy || S.pub || S.dns !== 'ok') return;
        S.busy = true; S.going = true;
        paintDns(); paintPub();
        log.add(tm(40), T('Партнёр нажал «Опубликовать»', 'The partner pressed "Publish"'));
        ctx.now(T('Система открывает витрину на домене партнёра.', "The system opens the storefront on the partner's domain."));
        ctx.later(function () {
          var t = tm(10);
          S.busy = false; S.going = false; S.pub = true;
          S.mins = Math.max(1, Math.ceil(clock / 60));
          paintDns(); paintPub(); paintCards(); again(pubTag, 'in-pop');
          cnt.set('mins', String(S.mins));
          log.add(t, T('Витрина открыта по адресу https://', 'The storefront is live at https://') + S.domain, 'sys');
          ctx.now(T('Витрина открыта. Теперь вы гость: нажмите <b>«Оставить заявку»</b> на любой вилле в превью.', 'The storefront is live. Now you are a guest: press <b>"Send a request"</b> on any villa in the preview.'));
          ctx.focus(frame);
          hold(3400);
        }, 1100);
      }

      /* ---------- the guest: a request from the storefront ---------- */
      function openForm(i) {
        if (!S.pub || S.busy) return;
        S.form = i;
        paintCards();
        ctx.now(T('Форма уже заполнена выдуманным гостем. Нажмите <b>«Отправить заявку»</b>.', 'The form is already filled with an invented guest. Press <b>"Send"</b>.'));
        hold(2400);
      }
      function send(i) {
        if (!S.pub || S.busy || S.form !== i) return;
        var c = cards[i], g = GUESTS[S.reqs % GUESTS.length], dest = S.dest;
        var rq = { n: S.reqs + 1, time: '', who: c.who.value.trim().slice(0, 20) || g[0], dates: c.dates.value.trim().slice(0, 20) || g[1], brand: shown(), prop: PROPS[i].t };
        S.busy = true; S.form = -1; S.sent = i; S.reqs++;
        paintCards(); lockSeg(true);
        cnt.set('reqs', String(S.reqs));
        hops.forEach(function (x, k) { hop(k, k ? 'idle' : 'run'); });
        log.add(tm(S.reqs === 1 ? 185 : 140), T('Гость отправил заявку с витрины: ', 'A guest sent a request from the storefront: ') + rq.prop);
        ctx.now(T('Заявка идёт через очередь и проверку от ботов. Смотрите окно <b>«Куда ушла заявка»</b>.', 'The request goes through the queue and the bot check. Watch the <b>"Where the request went"</b> window.'));
        ctx.later(function () { ctx.focus(routeEl); }, 350);
        ctx.later(function () {
          hop(0, 'done'); hop(1, 'run');
          log.add(tm(1), T('Заявка встала в очередь', 'The request is in the queue'), 'sys');
        }, 900);
        ctx.later(function () { hop(1, 'done'); hop(2, 'run'); }, 2000);
        ctx.later(function () {
          hop(2, 'done'); hop(3, 'run');
          S.bots++;
          cnt.set('bot', String(S.bots));
          log.add(tm(1), T('Проверка от ботов пройдена', 'Bot check passed'), 'sys');
        }, 3400);
        ctx.later(function () {
          rq.time = tm(1);
          hop(3, 'done');
          S.got[dest].unshift(rq);
          paintLane(dest, true);
          log.add(rq.time, T('Заявка доставлена ', 'Request delivered ') + TO[dest] + T('. Источник: витрина партнёра «', '. Source: partner storefront "') + rq.brand + T('»', '"'), 'sys');
          S.busy = false; S.sent = -1;
          paintCards(); lockSeg(false);
          ctx.focus(lanes[dest].el);
          finish(dest);
        }, 4400);
      }
      function finish(dest) {
        var both = S.got.crm.length && S.got.owner.length;
        hold(both ? 3000 : 4600);
        ctx.now(both ? T('Заявки дошли туда, куда выбрал партнёр. Название и цвет можно менять и после публикации.', 'The requests landed where the partner chose. The name and colour can still be changed after publishing.')
          : dest === 'crm' ? T('Заявка в CRM партнёра. Переключите <b>«Куда идут заявки»</b> на владельца объекта и отправьте ещё одну.', 'The request is in the partner\'s CRM. Switch <b>"Where requests go"</b> to the property owner and send one more.')
          : T('Заявка у владельца объекта. Переключите <b>«Куда идут заявки»</b> на CRM партнёра и отправьте ещё одну.', 'The request is with the property owner. Switch <b>"Where requests go"</b> to the partner\'s CRM and send one more.'));
        ctx.end(T('<b>Партнёр получил витрину под своим брендом и на своём домене за ', '<b>The partner got a storefront under its own brand and domain in ') + mins(S.mins) + '.</b> '
          + (both ? T('Заявки гостей прошли проверку от ботов и попали туда, куда он выбрал: и в CRM партнёра, и владельцу объекта.', "Guest requests passed the bot check and landed where the partner chose: both in the partner's CRM and with the property owner.")
            : dest === 'crm' ? T('Заявка гостя прошла проверку от ботов и попала туда, куда он выбрал: в CRM партнёра.', "The guest's request passed the bot check and landed where the partner chose: in the partner's CRM.")
            : T('Заявка гостя прошла проверку от ботов и попала туда, куда он выбрал: владельцу объекта.', "The guest's request passed the bot check and landed where the partner chose: with the property owner.")));
      }

      start();

      return {
        reset: start,
        /* tour: two swatches, DNS, publish, a request, switch the destination, one more request. Derived from S, so it continues from wherever the visitor stopped. */
        next: function () {
          if (S.busy || S.hold) return 'wait';
          if (S.dns !== 'ok') {
            if (S.dns === 'idle' && S.tints < 2) {
              var w = TOUR_SW[S.tints];
              return swBtns[w === S.color ? (w + 1) % COLORS.length : w];
            }
            if (!okDomain(normDomain(domInp.value))) { domInp.value = DEF_DOMAIN; onDomain(); }
            return dnsBtn;
          }
          if (!S.pub) return pubBtn;
          var need = !S.got[S.dest].length ? S.dest : !S.got.crm.length ? 'crm' : !S.got.owner.length ? 'owner' : null;
          if (!need) return null;
          if (need !== S.dest) return segDest.btn(need);
          if (S.form >= 0) return cards[S.form].send;
          return cards[S.reqs % cards.length].btn;
        }
      };
    }
  });
})();
