/* Mini app: creative dashboard for a user-acquisition team. Statuses follow a KPI threshold, manual edits are protected,
   the team's Google Sheet mirrors the dashboard both ways.
   The model (rows, threshold, role) changes at once. The view catches up through a queue of timed steps,
   and settle() finishes a running queue instantly, so a click at any moment is safe. */
(function () {
  'use strict';
  var CSS = [
    '.creatives-under{margin-top:14px}',
    '@media (min-width:901px){',
    '.creatives-under{grid-template-columns:minmax(0,7fr) minmax(0,5fr);align-items:stretch}',
    '.creatives-under>.demo-col{align-content:stretch}',
    '.creatives-bars{display:flex;flex-direction:column}',
    '.creatives-bars .creatives-ds{flex:1;align-content:space-around}',
    '}',
    '@media (min-width:641px){.creatives-t{min-width:760px}}',
    '.creatives-t td,.creatives-g td{vertical-align:middle}',
    '.creatives-t th:first-child,.creatives-t td:first-child{position:sticky;left:0;z-index:1;box-shadow:inset -1px 0 0 var(--line2)}',
    '.creatives-t td:first-child{background:var(--card);font-weight:600;white-space:nowrap}',
    '.creatives-t tr.creatives-scan td{background:color-mix(in srgb,var(--info) 13%,var(--card))}',
    '.creatives-stb{border:1px solid var(--line);background:var(--bg2);color:var(--ink);font:600 13px/1.2 var(--fb);padding:6px 11px;border-radius:9px;min-height:38px;cursor:pointer;transition:border-color .2s ease,transform .14s var(--ease-out)}',
    '.creatives-stb:active{transform:scale(.97)}',
    '.creatives-auto{color:var(--ink3)}',
    '.creatives-src{display:flex;flex-wrap:wrap;gap:5px 8px;align-items:center}',
    '.creatives-lock{display:inline-flex;align-items:center;gap:5px;font:500 11.5px/1.3 var(--fb);color:var(--wait);background:var(--wait-soft);padding:4px 8px;border-radius:7px;white-space:nowrap}',
    '.creatives-lock svg{width:12px;height:12px;flex:none}',
    '.creatives-kept{animation:creatives-kept 1.3s var(--ease-out)}',
    '@keyframes creatives-kept{from{box-shadow:0 0 0 6px color-mix(in srgb,var(--wait) 55%,transparent)}}',
    '.creatives-cok{color:var(--ok)}.creatives-cbad{color:var(--bad)}',
    '.creatives-g .creatives-rn{width:30px;text-align:center;color:var(--ink3);background:var(--bg2);font:500 11.5px/1.3 var(--fm)}',
    '.creatives-g th,.creatives-g th.num{white-space:normal}',
    '.creatives-g td:nth-child(3){white-space:nowrap}',
    '.creatives-ed{width:12px;height:12px;color:var(--wait);margin-left:7px;vertical-align:-1px}',
    '.creatives-syncing .win-h small{color:var(--acc-ink);font-weight:600}',
    '.creatives-foot{display:flex;flex-wrap:wrap;gap:10px 14px;align-items:center;padding:12px 14px}',
    '.creatives-foot p{flex:1;min-width:190px;font-size:12.5px;line-height:1.4;color:var(--ink3)}',
    '.creatives-ds{display:grid;gap:16px;padding:14px}',
    '.creatives-dh{display:flex;justify-content:space-between;gap:10px;align-items:baseline;font-size:14px;font-weight:600;margin-bottom:7px}',
    '.creatives-dh span:last-child{font:500 12.5px/1.2 var(--fm);color:var(--ink2);padding:2px 6px;border-radius:6px;white-space:nowrap}',
    '.creatives-chips{display:flex;flex-wrap:wrap;gap:4px 12px;margin-top:8px;font-size:12.5px;color:var(--ink2)}',
    '.creatives-dn{padding:0 14px 14px;font-size:12.5px;line-height:1.4;color:var(--ink3)}',
    '@media (hover:hover) and (pointer:fine){.creatives-stb:hover{border-color:var(--ink3)}}',
    '@media (max-width:640px){',
    '.creatives-w{scroll-padding-left:104px}',
    '.creatives-t th,.creatives-t td{padding:7px 6px}',
    '.creatives-t th,.creatives-t th.num{white-space:normal;font-size:10.5px}',
    '.creatives-t td:first-child{white-space:normal;min-width:100px;max-width:100px;font-size:12.5px}',
    '.creatives-t td:nth-child(2),.creatives-t td:nth-child(3){white-space:nowrap}',
    '.creatives-t .mono{font-size:12.5px}',
    '.creatives-t th:last-child{min-width:140px}',
    '.creatives-stb{padding:6px 8px;font-size:12.5px}',
    '.creatives-lock{white-space:normal;background:none;padding:0;font-size:11px;align-items:flex-start}',
    '.creatives-lock svg{margin-top:1px}',
    '.creatives-g th,.creatives-g td{padding:7px 6px}',
    '.creatives-g .creatives-rn{width:22px}',
    '.creatives-g th.num{width:92px}',
    '.creatives-fp{display:none}',
    '.creatives-ed{margin-left:5px}',
    '}',
    '@media (prefers-reduced-motion:reduce){.creatives-kept{animation:none}}'
  ].join('');

  PF.app('creatives', {
    cap: [
      'Макет на выдуманных данных. Настоящий дашборд так же ставит статусы по данным BI, не затирает ручные правки и оставляет таблицу команды рабочей.',
      "A mock on invented data. The real dashboard sets statuses from BI data the same way, never overwrites manual edits and keeps the team's sheet working."
    ],
    pace: 900,
    mount: function (ctx) {
      var T = ctx.T, h = ctx.h, icon = ctx.icon;
      if (!document.getElementById('pf-creatives-css')) document.head.appendChild(h('style', { id: 'pf-creatives-css', text: CSS }));

      /* ---------- invented data ---------- */
      var MIN_SPEND = 2000, STEP = 300;
      var APP = { p: T('Фото-приложение', 'Photo app'), m: T('Музыка', 'Music') };
      var DES = { A: T('Дизайнер A', 'Designer A'), B: T('Дизайнер B', 'Designer B'), C: T('Дизайнер C', 'Designer C') };
      var ST = { won: ['ok', T('победил', 'won')], lost: ['bad', T('проиграл', 'lost')], pending: ['wait', T('ожидает', 'pending')] };
      /* name, app, designer, spend, cost per install, manual status set before the demo, quarter still running */
      var DATA = [
        [T('Поющий кот · 9:16', 'Singing cat · 9:16'), 'p', 'A', 8400, 1.08],
        [T('Ковбой · UGC', 'Cowboy · UGC'), 'm', 'B', 6150, 1.34],
        [T('До и после · 1:1', 'Before and after · 1:1'), 'p', 'A', 5300, 1.46],
        [T('Танец робота · 9:16', 'Robot dance · 9:16'), 'm', 'C', 4720, 1.67],
        [T('Бабушка-диджей · UGC', 'DJ grandma · UGC'), 'm', 'B', 3900, 2.05],
        [T('Ретро-фильтр · 4:5', 'Retro filter · 4:5'), 'p', 'C', 7010, 1.58, 'won'],
        [T('Караоке в машине · 9:16', 'Car karaoke · 9:16'), 'm', 'A', 1240, 1.12, null, true]
      ];
      var SHEET_PICK = [4, 3, 2, 0, 1, 6, 5], TOUR_ROW = 1;
      var rows, S, C, did, queue = [], clock, scanAt;

      function auto(r) { return r.fresh && r.sp < MIN_SPEND ? 'pending' : r.cpi <= +S.thr ? 'won' : 'lost'; }
      function stOf(r) { return r.man || auto(r); }
      function q(s) { return T('«' + s + '»', '"' + s + '"'); }
      function money(n) { return '$' + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ctx.lang === 'ru' ? ' ' : ','); }
      function tm(add) {
        clock += add;
        var t = 14 * 3600 + 5 * 60 + clock, p = function (n) { return (n < 10 ? '0' : '') + n; };
        return p(Math.floor(t / 3600) % 24) + ':' + p(Math.floor(t / 60) % 60) + ':' + p(t % 60);
      }
      function flash(el, cls) { cls = cls || 'flash'; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }

      /* ---------- static frame ---------- */
      var segThr = ctx.seg(T('Порог KPI: цена установки', 'KPI threshold: cost per install'), [['1.20', '≤ $1.20'], ['1.50', '≤ $1.50'], ['1.80', '≤ $1.80']], '1.50', setThr);
      var segRole = ctx.seg(T('Роль', 'Role'), [['money', T('С деньгами', 'With money')], ['nomoney', T('Без денег', 'Without money')]], 'money', setRole);
      ctx.bar.appendChild(segThr); ctx.bar.appendChild(segRole);

      var ths = [T('Креатив', 'Creative'), T('Приложение', 'App'), T('Дизайнер', 'Designer'), T('Расход', 'Spend'), T('Цена установки', 'Cost per install'), T('Статус', 'Status'), T('Источник статуса', 'Status source')]
        .map(function (t, i) { return h(i === 3 || i === 4 ? 'th.num' : 'th', null, t); });
      var tb = h('tbody'), wrap = h('div.sheet-w.creatives-w', null, h('table.sheet.creatives-t', null, h('thead', null, h('tr', null, ths)), tb));
      var dashNote = h('div.win-note');
      var winDash = ctx.win('chart', T('Дашборд креативов', 'Creative dashboard'), '', dashNote, wrap);

      var gb = h('tbody');
      var sheetBtn = h('button.btn', { type: 'button', onclick: sheetEdit }, icon('edit'), T('Поправить в таблице', 'Edit in the sheet'));
      var winSheet = ctx.win('sheet', T('Google-таблица команды', "The team's Google Sheet"), '',
        h('div.sheet-w', null, h('table.sheet.creatives-g', null, h('thead', null, h('tr', null,
          h('th.creatives-rn', null, '1'), h('th', null, T('A: креатив', 'A: creative')), h('th', null, T('J: статус', 'J: status')), h('th.num', null, T('K: победителей в папке', 'K: winners in the folder')))), gb)),
        h('div.creatives-foot', null, sheetBtn, h('p', null, T('Как раньше: человек ставит статус руками прямо в таблице. Дашборд примет правку.', 'Like before: a person sets a status by hand right in the sheet. The dashboard picks it up.'))));

      var bars = {}, dsEl = h('div.creatives-ds');
      Object.keys(DES).forEach(function (d) {
        var b = bars[d] = { val: h('span'), fill: h('i', { style: 'width:0%' }), chips: h('div.creatives-chips'), last: null };
        dsEl.appendChild(h('div', null, h('div.creatives-dh', null, h('span', null, DES[d]), b.val), h('div.bar.ok', null, b.fill), b.chips));
      });
      var winBars = ctx.win('users', T('Победы по дизайнерам', 'Wins by designer'), T('доля побед', 'win rate'), dsEl,
        h('p.creatives-dn', null, T('Победил из тех, по кому уже есть решение. «Ожидает» в расчёт не идёт.', 'Won out of the ones already decided. "Pending" is not counted.')));

      var log = ctx.logger(T('Пока пусто. Сюда попадёт каждый пересчёт, каждая ручная правка и каждая синхронизация.', 'Empty for now. Every recompute, manual edit and sync lands here.'), T('дашборд', 'dashboard'));
      var cnt = ctx.counters([
        ['auto', T('статусов поставлено автоматически', 'statuses set automatically')],
        ['man', T('ручных правок сохранено', 'manual edits kept')],
        ['sync', T('синхронизаций с таблицей', 'sheet syncs')],
        ['win', T('победителей', 'winners')]
      ]);
      var winLog = ctx.win('log', T('Журнал', 'Log'), T('время условное', 'time is illustrative'), log.el, cnt.el);
      winSheet.classList.add('o1'); winBars.classList.add('o2', 'creatives-bars'); winLog.classList.add('demo-wide');
      ctx.body.appendChild(winDash);
      ctx.body.appendChild(h('div.demo-grid.flow.creatives-under', null, h('div.demo-col', null, winSheet), h('div.demo-col', null, winBars)));
      ctx.body.appendChild(winLog);

      /* ---------- painting: every function draws from the model and flashes only what changed ---------- */
      function buildRows() {
        tb.innerHTML = ''; gb.innerHTML = ''; scanAt = -1;
        rows.forEach(function (r, i) {
          r.btn = h('button.creatives-stb.st', { type: 'button', title: T('Нажмите, чтобы поставить статус вручную', 'Click to set the status by hand'), onclick: function () { cycle(i); } });
          r.why = h('small', { hidden: true }, T('до конца квартала', 'until the quarter ends'));
          r.tdSt = h('td', null, r.btn, r.why);
          r.tdSrc = h('td');
          r.spEl = h('span.mono', null, money(r.sp));
          r.cpiEl = h('span.mono', null, '$' + r.cpi.toFixed(2));
          r.tr = h('tr', null, h('td', null, r.n), h('td', null, APP[r.app]), h('td', null, DES[r.d]), h('td.num', null, r.spEl), h('td.num', null, r.cpiEl), r.tdSt, r.tdSrc);
          tb.appendChild(r.tr);
          r.gJ = h('td'); r.gK = h('td.num.mono');
          gb.appendChild(h('tr', null, h('td.creatives-rn', null, String(i + 2)), h('td', null, r.n, h('small', null, h('span.creatives-fp', null, T('папка: ', 'folder: ')), APP[r.app])), r.gJ, r.gK));
          r.vSt = r.vMan = r.jKey = r.kN = null;
        });
      }
      function paintRow(i, fl) {
        var r = rows[i], st = stOf(r), man = !!r.man, a = auto(r);
        r.btn.className = 'creatives-stb st ' + ST[st][0];
        r.btn.textContent = ST[st][1];
        r.why.hidden = man || st !== 'pending';
        r.cpiEl.classList.toggle('creatives-cok', a === 'won');
        r.cpiEl.classList.toggle('creatives-cbad', a === 'lost');
        if (r.vMan !== man) {
          r.tdSrc.innerHTML = ''; r.lock = null;
          if (man) {
            r.lock = h('span.creatives-lock', null, icon('lock'), h('span', null, T('ручная правка: не трогаем', 'manual edit: left alone')));
            r.tdSrc.appendChild(h('div.creatives-src', null, h('b', null, T('вручную', 'manual')), r.lock));
          } else r.tdSrc.appendChild(h('span.creatives-auto', null, T('авто', 'auto')));
        }
        if (fl && r.vSt != null && r.vSt !== st) flash(r.tdSt);
        if (fl && r.vMan != null && r.vMan !== man) flash(r.tdSrc);
        r.vSt = st; r.vMan = man;
      }
      function paintJ(i, fl) {
        var r = rows[i], st = stOf(r), key = st + (r.man ? '*' : ''), was = r.jKey;
        if (was === key) return 0;
        r.gJ.innerHTML = '';
        r.gJ.appendChild(h('span.st.' + ST[st][0], null, ST[st][1]));
        if (r.man) { var e = icon('edit'); e.setAttribute('class', 'creatives-ed'); r.gJ.appendChild(e); }
        r.jKey = key;
        if (was == null) return 0;
        if (fl) flash(r.gJ);
        return 1;
      }
      function paintK(fl) {
        var w = {}, n = 0;
        rows.forEach(function (r) { if (stOf(r) === 'won') w[r.app] = (w[r.app] || 0) + 1; });
        rows.forEach(function (r) {
          var k = String(w[r.app] || 0), was = r.kN;
          if (was === k) return;
          r.gK.textContent = k; r.kN = k;
          if (was != null) { n++; if (fl) flash(r.gK); }
        });
        return n;
      }
      function paintBars(fl) {
        Object.keys(bars).forEach(function (d) {
          var b = bars[d], won = 0, dec = 0;
          b.chips.innerHTML = '';
          rows.forEach(function (r) {
            if (r.d !== d) return;
            var s = stOf(r);
            if (s === 'won') won++;
            if (s !== 'pending') dec++;
            b.chips.appendChild(h('span.st.' + ST[s][0], null, r.n));
          });
          var pct = dec ? Math.round(won / dec * 100) : 0, txt = dec ? won + T(' из ', ' of ') + dec + ' · ' + pct + '%' : '—';
          b.fill.style.width = pct + '%';
          if (b.last === txt) return;
          b.val.textContent = txt;
          if (fl && b.last != null) flash(b.val);
          b.last = txt;
        });
      }
      function paintCnt() {
        var man = 0, win = 0;
        rows.forEach(function (r) { if (r.man) man++; if (stOf(r) === 'won') win++; });
        cnt.set('auto', String(C.auto)); cnt.set('man', String(man)); cnt.set('sync', String(C.sync)); cnt.set('win', String(win));
      }
      function paintRole() {
        var hide = S.role === 'nomoney';
        rows.forEach(function (r) { r.spEl.classList.toggle('blur', hide); r.cpiEl.classList.toggle('blur', hide); });
        winDash.note(T('вход через SSO · роль: ', 'SSO login · role: ') + (hide ? T('без денег', 'without money') : T('с деньгами', 'with money')));
      }
      function paintNote() {
        dashNote.textContent = T('Победил: цена установки не выше $' + S.thr + '. Свежий креатив ждёт конца квартала. Чтобы поставить статус вручную, нажмите на него.',
          'Won: cost per install at or below $' + S.thr + '. A fresh creative waits until its quarter ends. Click a status to set it by hand.');
      }
      function sheetNote(on) {
        winSheet.classList.toggle('creatives-syncing', on);
        winSheet.note(on ? T('синхронизация…', 'syncing…') : T('синхронизировано', 'in sync'));
      }
      function scan(i) {
        if (scanAt >= 0) rows[scanAt].tr.classList.remove('creatives-scan');
        scanAt = i;
        if (i >= 0) rows[i].tr.classList.add('creatives-scan');
      }
      /* on a narrow screen the table scrolls inside its window: bring columns a..b next to the pinned name column */
      function showCols(a, b) {
        if (wrap.scrollWidth <= wrap.clientWidth + 2) return;
        var pin = ths[0].offsetWidth, l = ths[a].offsetLeft, r = ths[b].offsetLeft + ths[b].offsetWidth;
        if (l >= wrap.scrollLeft + pin - 10 && r <= wrap.scrollLeft + wrap.clientWidth + 2) return;
        try { wrap.scrollTo({ left: Math.max(0, l - pin), behavior: ctx.RM ? 'auto' : 'smooth' }); } catch (e) { wrap.scrollLeft = Math.max(0, l - pin); }
      }

      /* ---------- queue of timed view steps ---------- */
      function plan(ms, fn) {
        var it = { fn: fn, ran: false };
        queue.push(it);
        ctx.later(function () { if (it.ran) return; it.ran = true; fn(false); }, ms);
      }
      function settle() {
        ctx.clearTimers();
        var old = queue; queue = [];
        old.forEach(function (it) { if (!it.ran) { it.ran = true; it.fn(true); } });
      }
      function begin() { settle(); S.busy = true; }
      function idle(ms, lead) {
        plan(ms, function () {
          S.busy = false;
          ctx.now(lead + ' ' + tip());
          if (did.thr && did.hand && did.sheet) ctx.end(T('<b>Статусы ставятся сами по порогу KPI.</b> Ручные правки пересчёт не трогает, а таблица команды и дашборд показывают одно и то же.',
            "<b>Statuses follow the KPI threshold on their own.</b> A recompute never touches manual edits, and the team's sheet and the dashboard always show the same thing."));
        });
      }
      function tip() {
        if (!did.thr) return T('Переключите <b>порог KPI</b> наверху: статусы пересчитаются сами.', 'Switch the <b>KPI threshold</b> above: the statuses recompute on their own.');
        if (!did.hand) return T('Теперь нажмите на <b>статус в любой строке</b> и поставьте его вручную.', 'Now click the <b>status in any row</b> and set it by hand.');
        if (!did.sheet) return T('Теперь нажмите <b>«Поправить в таблице»</b>: правка придёт в дашборд.', 'Now press <b>"Edit in the sheet"</b>: the edit will reach the dashboard.');
        if (!did.role) return T('Осталась роль <b>«Без денег»</b>: она видит статусы, но не видит расход.', 'One more to try, the <b>"Without money"</b> role: it sees statuses but not the spend.');
        return T('Меняйте порог и статусы дальше: ручные правки останутся на месте.', 'Keep changing the threshold and the statuses: manual edits stay where they are.');
      }
      /* dashboard → sheet: the note shows for 700 ms, then the changed cells flash */
      function sync(t0) {
        plan(t0, function (inst) { sheetNote(true); if (!inst) ctx.focus(winSheet); });
        plan(t0 + 700, function () {
          var n = paintK(true);
          rows.forEach(function (r, i) { n += paintJ(i, true); });
          C.sync++; sheetNote(false); paintCnt();
          log.add(tm(1), n ? T('Таблица команды обновлена, ячеек: ', "The team's sheet is updated, cells: ") + n : T('Таблица команды уже совпадает с дашбордом', "The team's sheet already matches the dashboard"), 'sys');
        });
      }
      function barsAt(ms) { plan(ms, function (inst) { paintBars(true); if (!inst) ctx.focus(winBars); }); }

      /* ---------- actions ---------- */
      function setThr(v) {
        begin();
        S.thr = v; did.thr = true;
        if (v === '1.20') did.t120 = true; else if (v === '1.80') did.t180 = true; else if (did.t120 && did.t180) did.back = true;
        var changed = rows.filter(function (r) { return !r.man && auto(r) !== r.vSt; }).length;
        var kept = rows.filter(function (r) { return r.man; }).length;
        paintNote();
        log.add(tm(6), T('Порог KPI: цена установки ≤ $', 'KPI threshold: cost per install ≤ $') + v + T('. Пересчёт по данным BI', '. Recomputing from BI data'), 'sys');
        ctx.now(T('Дашборд идёт по строкам и пересчитывает статусы по данным BI. Строки с ручной правкой он пропускает.', 'The dashboard goes row by row and recomputes statuses from BI data. It skips rows with a manual edit.'));
        ctx.focus(winDash); showCols(5, 6);
        rows.forEach(function (r, i) {
          plan(350 + i * STEP, function (inst) { scan(inst ? -1 : i); paintRow(i, true); if (r.man && r.lock && !inst) flash(r.lock, 'creatives-kept'); });
        });
        var t = 350 + rows.length * STEP + 100;
        plan(t, function () {
          scan(-1); C.auto += changed; paintCnt();
          log.add(tm(2), T('Изменилось статусов: ', 'Statuses changed: ') + changed + T('. Ручных правок не тронуто: ', '. Manual edits left alone: ') + kept, 'sys');
        });
        sync(t + 600); barsAt(t + 2350);
        idle(t + 4350, T('Порог ≤ $' + v + '. Изменилось статусов: ' + changed + ', ручные правки на месте.', 'Threshold ≤ $' + v + '. Statuses changed: ' + changed + ', manual edits stayed put.'));
      }

      /* a click on a status: the other value, then the remaining one, then back to auto */
      function cycle(i) {
        begin();
        var r = rows[i];
        did.hand = true;
        if (!r.man) { r.man = auto(r) === 'won' ? 'lost' : 'won'; r.turn = 1; }
        else if (r.turn === 1) { r.man = r.man === 'won' ? 'lost' : 'won'; r.turn = 2; }
        else { r.man = null; r.turn = 0; C.auto++; }
        var st = stOf(r);
        paintRow(i, true); paintCnt(); showCols(5, 6);
        if (r.man) {
          log.add(tm(5), T('Вручную в дашборде: ', 'By hand in the dashboard: ') + q(r.n) + ' → ' + ST[st][1]);
          ctx.now(T('Статус поставлен вручную. Дашборд помечает строку и отправляет правку в таблицу.', 'The status is set by hand. The dashboard marks the row and sends the edit to the sheet.'));
        } else {
          log.add(tm(5), T('В дашборде снята ручная правка: ', 'Manual edit removed in the dashboard: ') + q(r.n));
          log.add(tm(0), T('Статус снова по KPI: ', 'The status follows the KPI again: ') + ST[st][1], 'sys');
          ctx.now(T('Ручная правка снята. Статус снова считает дашборд.', 'The manual edit is removed. The dashboard computes the status again.'));
        }
        sync(900); barsAt(2700);
        idle(5100, r.man ? T('Строка ' + q(r.n) + ' теперь с ручным статусом: пересчёт её не тронет.', 'The row ' + q(r.n) + ' now has a manual status: a recompute will not touch it.')
          : T('Статус строки ' + q(r.n) + ' снова считается по KPI.', 'The status of ' + q(r.n) + ' follows the KPI again.'));
      }

      /* sheet → dashboard: a person changes one status in the sheet, the dashboard takes it as a manual edit */
      function sheetEdit() {
        begin();
        var i = SHEET_PICK.filter(function (k) { return !rows[k].man; })[0];
        if (i == null) i = SHEET_PICK[0];
        var r = rows[i], v = stOf(r) === 'won' ? 'lost' : 'won';
        r.man = v; r.turn = 1; did.sheet = true;
        paintJ(i, true); sheetNote(true);
        log.add(tm(5), T('Вручную в таблице, ячейка J', 'By hand in the sheet, cell J') + (i + 2) + ': ' + q(r.n) + ' → ' + ST[v][1]);
        ctx.now(T('В таблице статус поменяли руками. Дашборд забирает правку.', 'A status was changed by hand in the sheet. The dashboard is picking it up.'));
        ctx.focus(r.gJ);
        plan(700, function (inst) {
          paintRow(i, true); paintK(true); C.sync++; sheetNote(false); paintCnt();
          log.add(tm(1), T('Дашборд принял правку из таблицы и защитил её от пересчёта', 'The dashboard took the sheet edit and protected it from recomputation'), 'sys');
          if (!inst) { ctx.focus(winDash); showCols(5, 6); }
        });
        barsAt(2500);
        idle(4800, T('Правка из таблицы дошла до дашборда и защищена от пересчёта.', 'The sheet edit reached the dashboard and is protected from recomputation.'));
      }

      function setRole(v) {
        begin();
        S.role = v; did.role = true;
        if (v === 'nomoney') did.nomoney = true; else if (did.nomoney) did.money = true;
        paintRole();
        var txt = v === 'nomoney' ? T('Роль «Без денег»: расход и цена установки скрыты, статусы и доля побед видны.', 'The "Without money" role: spend and cost per install are hidden, statuses and win rates stay visible.')
          : T('Роль «С деньгами»: расход и цена установки снова видны.', 'The "With money" role: spend and cost per install are visible again.');
        log.add(tm(7), txt.replace(/\.$/, ''), 'sys');
        ctx.now(txt);
        ctx.focus(winDash); showCols(3, 5);
        idle(v === 'nomoney' ? 3600 : 3000, txt);
      }

      function start() {
        rows = DATA.map(function (a) { return { n: a[0].replace(' · ', ' · '), app: a[1], d: a[2], sp: a[3], cpi: a[4], man: a[5] || null, turn: a[5] ? 1 : 0, fresh: !!a[6] }; });
        S = { thr: '1.50', role: 'money', busy: false };
        C = { auto: rows.filter(function (r) { return !r.man; }).length, sync: 0 };
        did = {}; queue = []; clock = 0;
        segThr.set('1.50'); segRole.set('money');
        Object.keys(bars).forEach(function (d) { bars[d].last = null; });
        buildRows();
        rows.forEach(function (r, i) { paintRow(i, false); paintJ(i, false); });
        paintK(false); paintBars(false); paintRole(); paintNote(); sheetNote(false); paintCnt();
        wrap.scrollLeft = 0;
        log.clear(); ctx.end(null);
        ctx.now(T('Раньше команда отмечала победителей руками, теперь статусы ставит дашборд. ', 'The team used to mark winners by hand, now the dashboard sets the statuses. ') + tip());
      }
      start();

      return {
        reset: start,
        next: function () {
          if (S.busy) return 'wait';
          if (!did.t120) return segThr.btn('1.20');
          if (!did.t180) return segThr.btn('1.80');
          if (!did.back) return segThr.btn('1.50');
          if (!did.hand) {
            var free = rows.filter(function (r) { return !r.man && auto(r) !== 'pending'; });
            return (rows[TOUR_ROW].man ? free[0] || rows[0] : rows[TOUR_ROW]).btn;
          }
          if (!did.sheet) return sheetBtn;
          if (!did.nomoney) return segRole.btn('nomoney');
          if (!did.money) return segRole.btn('money');
          return null;
        }
      };
    }
  });
})();
