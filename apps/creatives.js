/* Mini app: analytics dashboard for ad creatives and the designers who make them.
   Five views (overview, designers, creatives, KPI, access), filters, a period breakdown, a creative drawer,
   a KPI dry-run, the winner latch and per-person money rights. Same structure as the reference app:
   state object S, a render from the model, timed steps only through ctx.later. */
(function () {
  'use strict';
  var CSS = [
    '.creatives-fl{display:flex;flex-wrap:wrap;gap:10px 14px;align-items:flex-end;padding:12px 14px;border-bottom:1px solid var(--line2)}',
    '.creatives-fl .btn{margin-left:auto}',
    '.creatives-v{padding:14px;display:grid;gap:14px;min-width:0}',
    '.creatives-ph{font-size:13.5px;line-height:1.5;color:var(--ink3);padding:22px 4px;text-align:center}',
    '.creatives-apps{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}',
    '.creatives-money{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}',
    '.creatives-card{border:1px solid var(--line2);background:var(--bg2);border-radius:12px;padding:10px 12px;min-width:0}',
    '.creatives-card h5{font:600 13.5px/1.3 var(--fb);margin:0 0 8px;display:flex;justify-content:space-between;gap:8px;align-items:center}',
    '.creatives-card .kv>div{padding:5px 0;font-size:13px}',
    '.creatives-mc small{display:block;font:500 11px/1.3 var(--fm);color:var(--ink3);text-transform:uppercase;letter-spacing:.04em}',
    '.creatives-mc b{display:block;font:700 20px/1.2 var(--fm);margin-top:4px;white-space:nowrap}',
    '.creatives-hid{color:var(--ink3);font:500 12.5px/1.3 var(--fb);display:inline-flex;gap:5px;align-items:center}',
    '.creatives-hid svg{width:13px;height:13px}',
    '.creatives-src{display:flex;flex-wrap:wrap;gap:8px 12px;align-items:flex-end;justify-content:space-between}',
    '.creatives-src p{font-size:12.5px;color:var(--ink3);line-height:1.4;flex:1;min-width:200px}',
    '.creatives-ch{display:grid;gap:7px}',
    '.creatives-cr{display:grid;grid-template-columns:88px minmax(0,1fr) 86px 44px;gap:8px;align-items:center;font-size:12.5px}',
    '.creatives-cr .bar{height:10px}',
    '.creatives-cr span{font-family:var(--fm);color:var(--ink2);white-space:nowrap}',
    '.creatives-cr .r{text-align:right}',
    '.creatives-hd{display:flex;flex-wrap:wrap;gap:8px 12px;align-items:flex-end;justify-content:space-between}',
    '.creatives-hd h4{font:600 14px/1.3 var(--fb);margin:0}',
    '.creatives-t tr.creatives-row{cursor:pointer}',
    '.creatives-t td{vertical-align:middle}',
    '.creatives-dr{border:1px solid var(--acc);border-radius:12px;padding:12px 14px;background:var(--card);display:grid;gap:8px}',
    '.creatives-dr h5{font:700 15px/1.3 var(--fb);margin:0}',
    '.creatives-ck{display:grid;gap:6px}',
    '.creatives-ck li{display:flex;gap:8px;align-items:flex-start;font-size:13.5px;line-height:1.4}',
    '.creatives-ck svg{width:15px;height:15px;flex:none;margin-top:2px}',
    '.creatives-ck .y svg{color:var(--ok)}.creatives-ck .n svg{color:var(--bad)}.creatives-ck .l svg{color:var(--wait)}',
    '.creatives-latch{font-size:12.5px;color:var(--wait);background:var(--wait-soft);border-radius:9px;padding:7px 10px;line-height:1.4}',
    '.creatives-kpi{display:flex;flex-wrap:wrap;gap:10px 16px;align-items:flex-end}',
    '.creatives-pv{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}',
    '.creatives-ppl{display:grid;gap:8px}',
    '.creatives-pp{display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center;justify-content:space-between;border:1px solid var(--line2);border-radius:12px;padding:9px 12px;background:var(--bg2)}',
    '.creatives-pp b{font-size:14px}.creatives-pp small{display:block;color:var(--ink3);font-size:12px}',
    '.creatives-tgl{display:inline-flex;align-items:center;gap:8px;min-height:38px;border:1px solid var(--line);border-radius:10px;background:var(--card);color:var(--ink);font:500 13px/1.2 var(--fb);padding:6px 11px;cursor:pointer}',
    '.creatives-tgl i{width:30px;height:18px;border-radius:99px;background:var(--line);position:relative;flex:none;transition:background-color .2s ease}',
    '.creatives-tgl i:after{content:"";position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;background:var(--ink);transition:transform .2s var(--ease-out)}',
    '.creatives-tgl[aria-pressed="true"] i{background:var(--ok)}',
    '.creatives-tgl[aria-pressed="true"] i:after{transform:translateX(12px)}',
    '.creatives-tgl:disabled{opacity:.6;cursor:default}',
    '.creatives-cok{color:var(--ok)}.creatives-cbad{color:var(--bad)}',
    '@media (max-width:900px){.creatives-apps{grid-template-columns:minmax(0,1fr)}.creatives-money{grid-template-columns:repeat(2,minmax(0,1fr))}}',
    '@media (max-width:640px){.creatives-fl{padding:10px 12px}.creatives-fl .btn{margin-left:0;width:100%;justify-content:center}.creatives-v{padding:12px}',
    '.creatives-cr{grid-template-columns:64px minmax(0,1fr) 74px 34px;gap:6px;font-size:11.5px}.creatives-mc b{font-size:17px}',
    '.creatives-pv{grid-template-columns:minmax(0,1fr)}.creatives-t th,.creatives-t td{padding:6px 7px}}',
    '@media (prefers-reduced-motion:reduce){.creatives-tgl i,.creatives-tgl i:after{transition:none}}'
  ].join('');

  PF.app('creatives', {
    cap: [
      'Макет на выдуманных данных: приложения, дизайнеры и все суммы придуманы. В настоящем дашборде те же экраны: карточки приложений, разбивка по периодам, таблица дизайнеров, пробный пересчёт KPI и права на деньги.',
      'A mock on invented data: the apps, designers and every amount are made up. The real dashboard has the same screens: app cards, a period breakdown, a designer table, a KPI dry-run and money rights.'
    ],
    pace: 1600,
    mount: function (ctx) {
      var T = ctx.T, h = ctx.h, icon = ctx.icon;
      if (!document.getElementById('pf-creatives-css')) document.head.appendChild(h('style', { id: 'pf-creatives-css', text: CSS }));

      /* ---------- invented data ---------- */
      var MIN = 500;
      var APPS = { p: T('Фото-приложение', 'Photo app'), m: T('Музыкальное приложение', 'Music app'), v: T('Видеоредактор', 'Video editor') };
      var AK = ['p', 'm', 'v'];
      var DES = { A: T('Ольга Н.', 'Olga N.'), B: T('Тимур Б.', 'Timur B.'), C: T('Вера С.', 'Vera S.') };
      var DK = ['A', 'B', 'C'];
      var TH = [T('Поющий кот', 'Singing cat'), T('До и после', 'Before and after'), T('Танец робота', 'Robot dance'), T('Бабушка-диджей', 'DJ grandma'),
        T('Ретро-фильтр', 'Retro filter'), T('Караоке в машине', 'Car karaoke'), T('Ковбой', 'Cowboy'), T('Кот-повар', 'Chef cat'),
        T('Старое фото', 'Old photo'), T('Гитара за 5 секунд', 'Guitar in 5 seconds'), T('Свадебный клип', 'Wedding clip'), T('Летний лагерь', 'Summer camp')];
      var FMT = ['9:16', 'UGC', '1:1', '4:5'];
      function gen() {
        var seed = 7, rnd = function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }, out = [];
        for (var i = 0; i < 24; i++) {
          var sp = Math.round((250 + rnd() * 8800) / 10) * 10, cpa = Math.round((0.95 + rnd() * 1.05) * 100) / 100;
          out.push({ id: i, n: TH[i % 12] + ' · ' + FMT[(i + (i / 12 | 0)) % 4], app: AK[i % 3], d: DK[(i * 5 + (i / 3 | 0)) % 3],
            sp: sp, cpa: cpa, roas: Math.round((0.7 + rnd() * 1.3) * 100) / 100, age: i < 9 ? 4 + Math.round(rnd() * 25) : 31 + Math.round(rnd() * 148) });
        }
        /* two creatives that won earlier and drifted above the threshold later: the latch keeps them */
        out[4].cpa = 1.62; out[4].sp = 6400; out[4].wc = 1.38; out[4].wd = T('8 недель назад', '8 weeks ago');
        out[13].cpa = 1.71; out[13].sp = 5200; out[13].wc = 1.44; out[13].wd = T('5 недель назад', '5 weeks ago');
        out.forEach(function (r) {
          if (r.wc) { r.won = true; return; }
          r.won = r.sp >= MIN && r.cpa <= 1.5;
          if (r.won) { r.wc = r.cpa; r.wd = T(Math.max(1, Math.round(r.age / 7)) + ' нед. назад', Math.max(1, Math.round(r.age / 7)) + ' weeks ago'); }
        });
        return out;
      }
      var SRC = { bi: [1, 1], ads: [1.04, 0.93] };   /* spend factor, revenue factor per data source */
      var PER = { '30': T('30 дней', '30 days'), '90': T('Квартал', 'Quarter'), '180': T('Полгода', 'Half a year') };
      var BRK = { day: [7, 1, T('по дням, 7 дней', 'by day, 7 days')], week: [8, 7, T('по неделям, 8 недель', 'by week, 8 weeks')],
        month: [6, 30, T('по месяцам, 6 месяцев', 'by month, 6 months')], quarter: [2, 90, T('по кварталам, 2 квартала', 'by quarter, 2 quarters')] };

      var S, R, clock;
      function fresh() {
        R = gen();
        return { tab: 'ov', src: 'bi', app: 'all', des: 'all', per: '180', brk: 'day', thr: 1.5, dry: null, dryBusy: false, sel: null,
          as: 'lead', money: { A: false, B: false, C: false }, busy: false, loaded: 0, did: {}, ended: false, n: { sync: 0, dry: 0 } };
      }

      /* ---------- helpers ---------- */
      function money(n) { return '$' + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ctx.lang === 'ru' ? ' ' : ','); }
      function usd(n) { return '$' + n.toFixed(2); }
      function tm(add) { clock += add; var t = 9 * 3600 + 12 * 60 + clock, p = function (n) { return (n < 10 ? '0' : '') + n; }; return p(Math.floor(t / 3600)) + ':' + p(Math.floor(t / 60) % 60) + ':' + p(t % 60); }
      function canMoney() { return S.as === 'lead' || S.money[S.as]; }
      function q(s) { return T('«' + s + '»', '"' + s + '"'); }
      function rows(ignorePer) {
        return R.filter(function (r) {
          return (S.app === 'all' || r.app === S.app) && (S.des === 'all' || r.d === S.des) && (ignorePer || r.age <= +S.per);
        });
      }
      /* spend runs evenly from launch to today: the part that falls into [a, b) days ago */
      function part(r, a, b) { var life = r.age + 1, o = Math.max(0, Math.min(b, life) - Math.min(a, life)); return o / life; }
      function sum(list, a, b) {
        var f = SRC[S.src], o = { sp: 0, rev: 0, inst: 0, won: 0, dec: 0, wsp: 0 };
        list.forEach(function (r) {
          var k = part(r, a, b), sp = r.sp * k * f[0];
          o.sp += sp; o.rev += r.sp * k * r.roas * f[1]; o.inst += sp / r.cpa;
          if (r.sp >= MIN) { o.dec++; if (r.won) { o.won++; o.wsp += sp; } }
        });
        o.cpa = o.inst ? o.sp / o.inst : 0; o.wr = o.dec ? Math.round(o.won / o.dec * 100) : 0;
        return o;
      }
      function hid() { return h('span.creatives-hid', null, icon('lock'), T('скрыто', 'hidden')); }
      function mon(v) { return canMoney() ? v : hid(); }
      function status(r) {
        if (r.won) return h('span.st.ok', null, T('победитель', 'winner'));
        if (r.sp < MIN) return h('span.st.wait', null, T('мало данных', 'too little data'));
        return h('span.st.bad', null, T('не прошёл', 'did not pass'));
      }

      /* ---------- static frame ---------- */
      var segTab = ctx.seg(T('Экран', 'Screen'), [['ov', T('Обзор', 'Overview')], ['des', T('Дизайнеры', 'Designers')], ['cr', T('Креативы', 'Creatives')], ['kpi', 'KPI'], ['acc', T('Доступы', 'Access')]], 'ov', function (v) { setTab(v); });
      var segAs = ctx.seg(T('Смотреть как', 'View as'), [['lead', T('Руководитель', 'Team lead')], ['A', DES.A]], 'lead', function (v) { setAs(v); });
      ctx.bar.appendChild(segTab); ctx.bar.appendChild(segAs);

      var segApp = ctx.seg(T('Приложение', 'App'), [['all', T('Все', 'All')], ['p', T('Фото', 'Photo')], ['m', T('Музыка', 'Music')], ['v', T('Видео', 'Video')]], 'all', function (v) { filt('app', v); });
      var segDes = ctx.seg(T('Дизайнер', 'Designer'), [['all', T('Все', 'All')]].concat(DK.map(function (d) { return [d, DES[d]]; })), 'all', function (v) { filt('des', v); });
      var segPer = ctx.seg(T('Период', 'Period'), [['30', PER['30']], ['90', PER['90']], ['180', PER['180']]], '180', function (v) { filt('per', v); });
      var refBtn = h('button.btn.btn-acc', { type: 'button', onclick: function () { refresh(false); } }, icon('reset'), T('Обновить данные', 'Refresh data'));
      var view = h('div.creatives-v');
      var winMain = ctx.win('chart', T('Креативы и дизайнеры', 'Creatives and designers'), '', h('div.creatives-fl', null, segApp, segDes, segPer, refBtn), view);
      var log = ctx.logger(T('Пока пусто. Сюда попадёт каждое обновление, пересчёт и смена прав.', 'Empty for now. Every refresh, recompute and rights change lands here.'), T('дашборд', 'dashboard'));
      var cnt = ctx.counters([
        ['win', T('победителей', 'winners'), '—'],
        ['sync', T('обновлений данных', 'data refreshes')],
        ['dry', T('пробных пересчётов', 'dry-runs')],
        ['lat', T('закреплено защёлкой', 'kept by the latch'), '—']
      ]);
      var winLog = ctx.win('log', T('Журнал', 'Log'), T('время условное', 'time is illustrative'), log.el, cnt.el);
      winMain.classList.add('demo-wide'); winLog.classList.add('demo-wide');
      ctx.body.appendChild(winMain); ctx.body.appendChild(winLog);

      /* ---------- views ---------- */
      function render(pop) {
        view.innerHTML = '';
        winMain.note((S.as === 'lead' ? T('руководитель', 'team lead') : DES[S.as]) + ' · ' + (canMoney() ? T('видит деньги', 'sees money') : T('без денег', 'no money')));
        var lockDes = S.as !== 'lead';
        segDes.querySelectorAll('button').forEach(function (b) { b.disabled = lockDes; });
        if (!S.loaded && S.tab !== 'acc') {
          view.appendChild(h('p.creatives-ph', null, S.busy ? T('Загружаю данные из BI…', 'Loading data from BI…') : T('Данных ещё нет. Нажмите «Обновить данные».', 'No data yet. Press "Refresh data".')));
          if (S.busy) paintOv(true);
          return;
        }
        ({ ov: paintOv, des: paintDes, cr: paintCr, kpi: paintKpi, acc: paintAcc })[S.tab](false, pop);
        paintCnt();
      }
      function pop(el, on) { if (on) el.classList.add('in-pop'); return el; }

      var segSrc, segBrk;
      function paintOv(loading, popKey) {
        if (loading) view.innerHTML = '';
        segSrc = ctx.seg(T('Источник данных', 'Data source'), [['bi', 'BI'], ['ads', T('Рекламные кабинеты', 'Ad accounts')]], S.src, function (v) { setSrc(v); });
        view.appendChild(h('div.creatives-src', null, segSrc, h('p', null, S.src === 'bi'
          ? T('BI: установки и доход после атрибуции.', 'BI: installs and revenue after attribution.')
          : T('Кабинеты: расход свежее, доход по их оценке.', 'Ad accounts: fresher spend, revenue by their estimate.'))));
        var per = +S.per, apps = h('div.creatives-apps');
        AK.forEach(function (k, i) {
          if (S.app !== 'all' && S.app !== k) return;
          var ready = S.loaded || S.loaded === 0 && S.step > i;
          var o = sum(rows().filter(function (r) { return r.app === k; }), 0, per);
          apps.appendChild(pop(h('div.creatives-card', null, h('h5', null, APPS[k], ready ? h('span.tg.tg-ok', null, o.wr + '%') : h('span.tg.tg-hum', null, '…')),
            h('dl.kv', null,
              h('div', null, h('dt', null, T('Доля побед', 'Win rate')), h('dd', null, ready ? o.won + T(' из ', ' of ') + o.dec : '…')),
              h('div', null, h('dt', null, T('Расход', 'Spend')), h('dd.mono', null, ready ? mon(money(o.sp)) : '…')),
              h('div', null, h('dt', null, 'CPA'), h('dd.mono', null, ready ? mon(usd(o.cpa)) : '…')))), popKey === 'apps' || (loading && S.step === i + 1)));
        });
        view.appendChild(apps);
        if (loading && S.step <= 3) return;
        var all = sum(rows(), 0, per);
        var mc = function (l, v) { return h('div.creatives-card.creatives-mc', null, h('small', null, l), h('b', null, v)); };
        view.appendChild(pop(h('div.creatives-money', null,
          mc(T('Расход', 'Spend'), mon(money(all.sp))), mc(T('Доход', 'Revenue'), mon(money(all.rev))),
          mc('ROAS', mon(all.sp ? Math.round(all.rev / all.sp * 100) + '%' : '—')), mc(T('Расход на победителях', 'Spend on winners'), mon(money(all.wsp)))), popKey === 'money' || (loading && S.step === 4)));
        if (loading && S.step <= 4) return;
        segBrk = ctx.seg(T('Разбивка', 'Breakdown'), [['day', T('День', 'Day')], ['week', T('Неделя', 'Week')], ['month', T('Месяц', 'Month')], ['quarter', T('Квартал', 'Quarter')]], S.brk, function (v) { setBrk(v); });
        var b = BRK[S.brk], list = rows(true), bs = [], max = 1;
        for (var i = b[0] - 1; i >= 0; i--) {
          var o = sum(list, i * b[1], (i + 1) * b[1]), won = list.filter(function (r) { return r.won && r.age >= i * b[1] && r.age < (i + 1) * b[1]; }).length;
          bs.push([i, o.sp, won]); if (o.sp > max) max = o.sp;
        }
        var lab = function (i) {
          if (i === 0) return S.brk === 'day' ? T('сегодня', 'today') : T('текущий', 'current');
          if (S.brk === 'day') return T(i + ' дн. назад', i + 'd ago');
          return (S.brk === 'week' ? T('нед. −', 'wk −') : S.brk === 'month' ? T('мес. −', 'mo −') : T('кв. −', 'qtr −')) + i;
        };
        var ch = h('div.creatives-ch', null, bs.map(function (x) {
          return h('div.creatives-cr', null, h('span', null, lab(x[0])), h('div.bar', null, h('i', { style: 'width:' + Math.round(x[1] / max * 100) + '%' + (canMoney() ? '' : ';opacity:.35') })),
            h('span.r', null, canMoney() ? money(x[1]) : '···'), h('span.r', { title: T('новых победителей', 'new winners') }, '★' + x[2]));
        }));
        view.appendChild(pop(h('div.creatives-card', null, h('div.creatives-hd', null, h('h4', null, T('Расход и новые победители, ', 'Spend and new winners, ') + b[2]), segBrk), h('div', { style: 'height:10px' }), ch),
          popKey === 'brk' || (loading && S.step === 5)));
      }

      function paintDes(x, popKey) {
        var per = +S.per, tb = h('tbody'), m = canMoney();
        DK.forEach(function (d) {
          if (S.des !== 'all' && S.des !== d) return;
          var list = rows().filter(function (r) { return r.d === d; }), o = sum(list, 0, per);
          tb.appendChild(h('tr', null, h('td', null, h('b', null, DES[d])), h('td.num', null, String(list.length)), h('td.num', null, String(o.won)),
            h('td', null, h('div', { style: 'display:flex;gap:8px;align-items:center;min-width:110px' }, h('div.bar.ok', { style: 'flex:1' }, h('i', { style: 'width:' + o.wr + '%' })), h('span.mono', null, o.wr + '%'))),
            m ? h('td.num.mono', null, money(o.sp)) : null, m ? h('td.num.mono', null, money(o.wsp)) : null, m ? h('td.num.mono', null, money(o.rev)) : null));
        });
        view.appendChild(h('div.creatives-hd', null, h('h4', null, T('Победы и деньги по дизайнерам · ', 'Wins and money by designer · ') + PER[S.per])));
        view.appendChild(pop(h('div.sheet-w', null, h('table.sheet.creatives-t', null, h('thead', null, h('tr', null,
          h('th', null, T('Дизайнер', 'Designer')), h('th.num', null, T('Креативов', 'Creatives')), h('th.num', null, T('Побед', 'Wins')), h('th', null, T('Доля побед', 'Win rate')),
          m ? h('th.num', null, T('Расход', 'Spend')) : null, m ? h('th.num', null, T('На победителях', 'On winners')) : null, m ? h('th.num', null, T('Доход', 'Revenue')) : null)), tb)), popKey === 'tbl'));
        if (!m) view.appendChild(h('p.thr', { style: 'margin:0' }, T('Колонки с деньгами скрыты: у этого человека нет права видеть деньги.', 'Money columns are hidden: this person has no right to see money.')));
      }

      var rowEls;
      function paintCr(x, popKey) {
        var m = canMoney(), tb = h('tbody'), list = rows().slice().sort(function (a, b) { return b.sp - a.sp; });
        rowEls = {};
        list.forEach(function (r) {
          var tr = h('tr.creatives-row' + (S.sel === r.id ? '.sel' : ''), { onclick: function () { pick(r.id); } },
            h('td', null, h('b', null, r.n), h('small', null, APPS[r.app] + ' · ' + DES[r.d])),
            m ? h('td.num.mono', null, money(r.sp)) : null,
            m ? h('td.num.mono' + (r.cpa <= S.thr ? '.creatives-cok' : '.creatives-cbad'), null, usd(r.cpa)) : null,
            h('td', null, status(r)));
          rowEls[r.id] = tr; tb.appendChild(tr);
        });
        view.appendChild(h('div.creatives-hd', null, h('h4', null, T('Креативы · ', 'Creatives · ') + list.length + ' · ' + PER[S.per]), h('span.tg.tg-acc', null, 'CPA ≤ ' + usd(S.thr))));
        var sel = S.sel != null && list.filter(function (r) { return r.id === S.sel; })[0];
        if (sel) view.appendChild(drawer(sel, popKey === 'dr'));
        view.appendChild(h('div.sheet-w', { style: 'max-height:340px;overflow:auto' }, h('table.sheet.creatives-t', null, h('thead', null, h('tr', null,
          h('th', null, T('Креатив', 'Creative')), m ? h('th.num', null, T('Расход', 'Spend')) : null, m ? h('th.num', null, 'CPA') : null, h('th', null, T('Статус', 'Status')))), tb)));
        if (!sel) view.appendChild(h('p.thr', { style: 'margin:0' }, T('Нажмите на креатив: откроется карточка, почему он победил или нет.', 'Click a creative: a card opens with why it won or not.')));
      }
      function drawer(r, popOn) {
        var m = canMoney(), li = function (cls, ic, t) { return h('li.' + cls, null, icon(ic), h('span', null, t)); };
        var ck = h('ul.creatives-ck');
        ck.appendChild(li(r.sp >= MIN ? 'y' : 'n', r.sp >= MIN ? 'check' : 'x', m ? T('Расход ' + money(r.sp) + ', нужно от ' + money(MIN), 'Spend ' + money(r.sp) + ', needs ' + money(MIN) + ' or more')
          : T('Расход выше минимума: ' + (r.sp >= MIN ? 'да' : 'нет'), 'Spend above the minimum: ' + (r.sp >= MIN ? 'yes' : 'no'))));
        var okNow = r.cpa <= S.thr;
        ck.appendChild(li(okNow ? 'y' : r.won ? 'l' : 'n', okNow ? 'check' : r.won ? 'lock' : 'x', m ? T('CPA сейчас ' + usd(r.cpa) + ', порог ' + usd(S.thr), 'CPA now ' + usd(r.cpa) + ', threshold ' + usd(S.thr))
          : T('CPA сейчас в пороге: ' + (okNow ? 'да' : 'нет'), 'CPA within the threshold now: ' + (okNow ? 'yes' : 'no'))));
        if (r.won) ck.appendChild(li('y', 'star', m ? T('Победил ' + r.wd + ' при CPA ' + usd(r.wc), 'Won ' + r.wd + ' at CPA ' + usd(r.wc)) : T('Победил ' + r.wd, 'Won ' + r.wd)));
        return pop(h('div.creatives-dr', null,
          h('div.creatives-hd', null, h('h5', null, r.n), status(r)),
          h('p.meta', { style: 'margin:0;color:var(--ink3);font-size:12.5px' }, APPS[r.app] + ' · ' + DES[r.d] + ' · ' + T('запущен ' + r.age + ' дн. назад', 'launched ' + r.age + ' days ago')),
          ck,
          r.won && !okNow ? h('p.creatives-latch', null, T('Защёлка: креатив стал победителем и остаётся им, даже если CPA потом вырос.', 'Latch: once a creative wins it stays a winner, even if its CPA rises later.')) : null), popOn);
      }

      var segThr, applyBtn;
      function dryCalc(thr) {
        var add = [], keep = [];
        R.forEach(function (r) {
          var ok = r.sp >= MIN && r.cpa <= thr;
          if (!r.won && ok) add.push(r);
          if (r.won && !ok) keep.push(r);
        });
        return { add: add, keep: keep };
      }
      function paintKpi(x, popKey) {
        var vals = ['1.20', '1.50', '1.80'];
        segThr = ctx.seg(T('Новый порог CPA', 'New CPA threshold'), vals.map(function (v) { return [v, '≤ $' + v]; }), S.dry ? S.dry.toFixed(2) : '', function (v) { dryRun(+v); });
        applyBtn = h('button.btn.btn-ok', { type: 'button', onclick: apply, disabled: !S.dry || S.dryBusy || S.dry === S.thr }, icon('check'), T('Применить', 'Apply'));
        view.appendChild(h('div.creatives-hd', null, h('h4', null, T('Победитель: расход от ', 'Winner: spend from ') + money(MIN) + T(' и CPA не выше ', ' and CPA at or below ') + usd(S.thr))));
        view.appendChild(h('div.creatives-kpi', null, segThr, applyBtn));
        var won = R.filter(function (r) { return r.won; }).length;
        if (S.dryBusy) { view.appendChild(h('p.creatives-ph', null, T('Пробный пересчёт по всем креативам…', 'Dry-run over every creative…'))); return; }
        if (!S.dry) { view.appendChild(h('p.thr', { style: 'margin:0' }, T('Выберите порог: дашборд покажет, что изменится, и ничего не тронет до «Применить».', 'Pick a threshold: the dashboard shows what would change and touches nothing until "Apply".'))); return; }
        var c = dryCalc(S.dry), card = function (l, v, cls) { return h('div.creatives-card.creatives-mc', null, h('small', null, l), h('b' + (cls || ''), null, v)); };
        var tb = h('tbody');
        c.add.forEach(function (r) { tb.appendChild(h('tr', null, h('td', null, r.n), h('td.num.mono', null, canMoney() ? usd(r.cpa) : '···'), h('td', null, h('span.st.ok', null, T('станет победителем', 'becomes a winner'))))); });
        c.keep.forEach(function (r) { tb.appendChild(h('tr', null, h('td', null, r.n), h('td.num.mono', null, canMoney() ? usd(r.cpa) : '···'), h('td', null, h('span.st.wait', null, T('останется: защёлка', 'stays: latch'))))); });
        view.appendChild(pop(h('div', { style: 'display:grid;gap:10px' },
          h('div.creatives-pv', null, card(T('Победителей сейчас', 'Winners now'), String(won)), card(T('Станет', 'Would be'), String(won + c.add.length), '.creatives-cok'),
            card(T('Удержит защёлка', 'Kept by the latch'), String(c.keep.length))),
          tb.children.length ? h('div.sheet-w', null, h('table.sheet.creatives-t', null, h('thead', null, h('tr', null, h('th', null, T('Креатив', 'Creative')), h('th.num', null, 'CPA'), h('th', null, T('Что будет', 'What happens')))), tb))
            : h('p.thr', { style: 'margin:0' }, T('Ничего не изменится.', 'Nothing would change.')),
          c.keep.length ? h('p.creatives-latch', null, T('Защёлка: кто уже стал победителем, им и останется. Порог влияет только на новых.', 'Latch: a creative that already won stays a winner. The threshold only affects new ones.')) : null), popKey === 'dry'));
      }

      function paintAcc(x, popKey) {
        var ppl = h('div.creatives-ppl');
        ppl.appendChild(h('div.creatives-pp', null, h('div', null, h('b', null, T('Руководитель команды', 'Team lead')), h('small', null, T('все приложения и дизайнеры', 'all apps and designers'))),
          h('button.creatives-tgl', { type: 'button', 'aria-pressed': 'true', disabled: true }, h('i'), T('может видеть деньги', 'can see money'))));
        DK.forEach(function (d) {
          var b = h('button.creatives-tgl', { type: 'button', 'aria-pressed': String(S.money[d]), onclick: function () { toggle(d); } }, h('i'), T('может видеть деньги', 'can see money'));
          if (d === 'B') tglB = b;
          ppl.appendChild(pop(h('div.creatives-pp', null, h('div', null, h('b', null, DES[d]), h('small', null, T('дизайнер, видит только свои креативы', 'designer, sees only own creatives'))), b), popKey === 'p' + d));
        });
        view.appendChild(h('div.creatives-hd', null, h('h4', null, T('Права на человека', 'Rights per person'))));
        view.appendChild(ppl);
        view.appendChild(h('p.thr', { style: 'margin:0' }, T('Переключите наверху «Смотреть как» на дизайнера: колонки с деньгами пропадут, если права нет.', 'Switch "View as" above to a designer: money columns disappear if the right is off.')));
      }
      var tglB;

      function paintCnt() {
        var won = R.filter(function (r) { return r.won; }), lat = won.filter(function (r) { return r.cpa > S.thr; });
        cnt.set('win', S.loaded ? String(won.length) : '—'); cnt.set('sync', String(S.n.sync)); cnt.set('dry', String(S.n.dry)); cnt.set('lat', S.loaded ? String(lat.length) : '—');
      }

      /* ---------- actions ---------- */
      function tip() {
        var d = S.did;
        if (!S.loaded) return T('Нажмите <b>«Обновить данные»</b>.', 'Press <b>"Refresh data"</b>.');
        if (!d.src) return T('Переключите <b>источник данных</b>: цифры придут из рекламных кабинетов.', 'Switch the <b>data source</b>: the numbers come from the ad accounts.');
        if (!d.app) return T('Отфильтруйте по <b>приложению</b>, дизайнеру или периоду.', 'Filter by <b>app</b>, designer or period.');
        if (!d.brk) return T('Смените <b>разбивку</b>: день, неделя, месяц, квартал.', 'Change the <b>breakdown</b>: day, week, month, quarter.');
        if (!d.des) return T('Откройте экран <b>«Дизайнеры»</b>: победы и деньги по каждому.', 'Open <b>"Designers"</b>: wins and money for each one.');
        if (!d.dr) return T('Откройте <b>«Креативы»</b> и нажмите на любой креатив.', 'Open <b>"Creatives"</b> and click any creative.');
        if (!d.apply) return T('Откройте <b>«KPI»</b>, выберите новый порог, посмотрите прогноз и нажмите <b>«Применить»</b>.', 'Open <b>"KPI"</b>, pick a new threshold, check the preview and press <b>"Apply"</b>.');
        if (!d.as) return T('Откройте <b>«Доступы»</b> и переключите <b>«Смотреть как»</b> на дизайнера.', 'Open <b>"Access"</b> and switch <b>"View as"</b> to a designer.');
        return T('Смотрите экраны глазами дизайнера: деньги скрыты везде.', "Look at the screens as the designer: money is hidden everywhere.");
      }
      function lead(t) { ctx.now(t + ' ' + tip()); checkEnd(); }
      function checkEnd() {
        var d = S.did;
        if (S.ended || !(d.src && d.app && d.brk && d.des && d.dr && d.apply && d.as && d.asOv)) return;
        S.ended = true;
        ctx.end(T('<b>Команда видит победы и деньги по каждому приложению и дизайнеру в одном месте.</b> Порог меняют после пробного пересчёта, победители не пропадают, а дизайнер без права на деньги видит только свои креативы и статусы.',
          '<b>The team sees wins and money for every app and designer in one place.</b> The threshold changes after a dry-run, winners never disappear, and a designer without the money right sees only own creatives and statuses.'));
      }

      function refresh(fast) {
        if (S.busy) return;
        S.busy = true; S.loaded = 0; S.step = 0; refBtn.disabled = true;
        var src = S.src === 'bi' ? 'BI' : T('рекламных кабинетов', 'the ad accounts');
        log.add(tm(4), T('Запрос данных из ', 'Requesting data from ') + src, 'sys');
        ctx.now(T('Дашборд забирает данные по каждому приложению.', 'The dashboard pulls data for each app.'));
        if (S.tab !== 'ov') { S.tab = 'ov'; segTab.set('ov'); }
        render(); ctx.focus(winMain);
        var st = fast ? 550 : 1300;
        [1, 2, 3, 4, 5].forEach(function (k) {
          ctx.later(function () {
            S.step = k; render();
            if (k <= 3) log.add(tm(2), APPS[AK[k - 1]] + T(': данные получены', ': data received'), 'sys');
            if (k === 4) log.add(tm(1), T('Посчитаны расход, доход и ROAS', 'Spend, revenue and ROAS computed'), 'sys');
          }, st * k);
        });
        ctx.later(function () {
          S.busy = false; S.loaded = 1; S.n.sync++; refBtn.disabled = false;
          if (fast) S.did.src = true;
          render(); paintCnt();
          log.add(tm(1), T('Готово. Победителей: ', 'Done. Winners: ') + R.filter(function (r) { return r.won; }).length, 'sys');
          lead(T('Данные обновлены.', 'The data is up to date.'));
        }, st * 5 + 500);
      }
      function setSrc(v) {
        if (S.busy) return;
        S.src = v; refresh(true);
      }
      function filt(k, v) {
        S[k] = v; ({ app: segApp, des: segDes, per: segPer })[k].set(v);
        if (k === 'app' || k === 'des' || k === 'per') S.did[k + 'X'] = (S.did[k + 'X'] || 0) + 1;
        if (S.did.appX && S.did.perX) S.did.app = true;
        if (S.sel != null && !rows().some(function (r) { return r.id === S.sel; })) S.sel = null;
        render(S.tab === 'ov' ? 'apps' : 'tbl');
        var lab = k === 'app' ? (v === 'all' ? T('все приложения', 'all apps') : APPS[v]) : k === 'des' ? (v === 'all' ? T('все дизайнеры', 'all designers') : DES[v]) : PER[v];
        log.add(tm(3), T('Фильтр: ', 'Filter: ') + lab);
        lead(T('Фильтр: ' + lab + '.', 'Filter: ' + lab + '.'));
      }
      function setBrk(v) {
        S.brk = v; S.did['b' + v] = true;
        if (S.did.bweek && S.did.bmonth && S.did.bquarter) S.did.brk = true;
        render('brk');
        log.add(tm(2), T('Разбивка: ', 'Breakdown: ') + BRK[v][2]);
        lead(T('Разбивка ' + BRK[v][2] + '.', 'Breakdown ' + BRK[v][2] + '.'));
      }
      function setTab(v) {
        S.tab = v; segTab.set(v);
        if (v === 'des' && S.loaded) S.did.des = true;
        if (v === 'ov' && S.as !== 'lead' && S.loaded) S.did.asOv = true;
        render(v === 'des' ? 'tbl' : null);
        var t = { ov: T('Обзор.', 'Overview.'), des: T('Дизайнеры: победы и деньги по каждому.', 'Designers: wins and money for each.'), cr: T('Креативы.', 'Creatives.'), kpi: T('KPI: правило победителя.', 'KPI: the winner rule.'), acc: T('Доступы: права на человека.', 'Access: rights per person.') }[v];
        lead(t);
      }
      function pick(id) {
        S.sel = id; S.did.dr = true;
        var r = R[id];
        render('dr');
        log.add(tm(4), T('Открыта карточка ', 'Opened ') + q(r.n));
        lead(r.won ? T('Карточка показывает, почему креатив победил.', 'The card shows why the creative won.') : T('Карточка показывает, какое условие не выполнено.', 'The card shows which condition failed.'));
      }
      function dryRun(v) {
        if (S.dryBusy) return;
        S.dry = v; S.dryBusy = true; S.busy = true; S.did['d' + v] = true;
        render();
        ctx.now(T('Пробный пересчёт: статусы пока не меняются.', 'Dry-run: no status changes yet.'));
        ctx.later(function () {
          S.dryBusy = false; S.busy = false; S.n.dry++;
          var c = dryCalc(v);
          render('dry'); paintCnt();
          log.add(tm(5), T('Пробный пересчёт ≤ ', 'Dry-run ≤ ') + usd(v) + T(': новых ', ': new ') + c.add.length + T(', удержит защёлка ', ', kept by the latch ') + c.keep.length, 'sys');
          ctx.focus(view);
          lead(T('Прогноз готов, ничего не применено.', 'The preview is ready, nothing applied.'));
        }, 1300);
      }
      function apply() {
        if (!S.dry || S.dry === S.thr || S.busy) return;
        var c = dryCalc(S.dry);
        S.busy = true; applyBtn.disabled = true;
        ctx.now(T('Применяю новый порог…', 'Applying the new threshold…'));
        ctx.later(function () {
          S.thr = S.dry;
          c.add.forEach(function (r) { r.won = true; r.wc = r.cpa; r.wd = T('сегодня', 'today'); });
          S.dry = null; S.busy = false; S.did.apply = true;
          render(); paintCnt();
          log.add(tm(3), T('Порог CPA ≤ ', 'CPA threshold ≤ ') + usd(S.thr) + T(' применён. Новых победителей: ', ' applied. New winners: ') + c.add.length, 'sys');
          lead(T('Порог применён, новые победители закреплены.', 'The threshold is applied, new winners are latched.'));
        }, 900);
      }
      function toggle(d) {
        S.money[d] = !S.money[d]; S.did.tgl = true;
        render('p' + d);
        log.add(tm(6), DES[d] + (S.money[d] ? T(': может видеть деньги', ': can see money') : T(': деньги скрыты', ': money hidden')));
        lead(DES[d] + (S.money[d] ? T(' теперь видит деньги.', ' now sees money.') : T(' больше не видит деньги.', ' no longer sees money.')));
      }
      function setAs(v) {
        S.as = v; segAs.set(v);
        if (v !== 'lead') { S.did.as = true; S.des = v; segDes.set(v); }
        else { S.des = 'all'; segDes.set('all'); }
        render();
        log.add(tm(4), T('Вид глазами: ', 'Viewing as: ') + (v === 'lead' ? T('руководитель', 'team lead') : DES[v]), 'sys');
        lead(v === 'lead' ? T('Снова вид руководителя.', 'Back to the team lead view.')
          : canMoney() ? T(DES[v] + ' видит только свои креативы, деньги видны.', DES[v] + ' sees only own creatives, money is visible.')
            : T(DES[v] + ' видит только свои креативы, колонки с деньгами скрыты.', DES[v] + ' sees only own creatives, money columns are hidden.'));
      }

      function start() {
        S = fresh(); clock = 0;
        segTab.set('ov'); segAs.set('lead'); segApp.set('all'); segDes.set('all'); segPer.set('180');
        refBtn.disabled = false;
        log.clear(); ctx.end(null);
        render(); paintCnt();
        ctx.now(T('Дашборд креативов для команды закупки. Нажмите <b>«Обновить данные»</b>.', 'A creative dashboard for the ad team. Press <b>"Refresh data"</b>.'));
      }
      start();

      return {
        reset: start,
        next: function () {
          var d = S.did;
          if (S.busy) return 'wait';
          if (!S.loaded) return refBtn;
          if (!d.src) { if (S.tab !== 'ov') return segTab.btn('ov'); return segSrc.btn('ads'); }
          if (!d.appX) return segApp.btn('p');
          if (!d.perX) return segPer.btn('90');
          if (!d.brk) {
            if (S.tab !== 'ov') return segTab.btn('ov');
            return segBrk.btn(!d.bweek ? 'week' : !d.bmonth ? 'month' : 'quarter');
          }
          if (S.app !== 'all') return segApp.btn('all');
          if (!d.desX) return segDes.btn('B');
          if (!d.des) return segTab.btn('des');
          if (S.des !== 'all' && S.as === 'lead') return segDes.btn('all');
          if (!d.dr) {
            if (S.tab !== 'cr') return segTab.btn('cr');
            var w = R.filter(function (r) { return r.won && r.cpa > S.thr && rows().indexOf(r) >= 0; })[0] || rows()[0];
            return rowEls[w.id] || null;
          }
          if (!d.apply) {
            if (S.tab !== 'kpi') return segTab.btn('kpi');
            if (!d['d1.2']) return segThr.btn('1.20');
            if (!d['d1.8']) return segThr.btn('1.80');
            return applyBtn;
          }
          if (!d.as) {
            if (S.tab !== 'acc') return segTab.btn('acc');
            if (!d.tgl) return tglB;
            return segAs.btn('A');
          }
          if (!d.asOv) return segTab.btn('ov');
          return null;
        }
      };
    }
  });
})();
