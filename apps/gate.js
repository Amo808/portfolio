/* Mini app: release gate for an AI support bot. Before a release the bot is replayed on a corpus of cases, a judge model
   scores every answer, and the gate compares the median of three runs with a fixed threshold.
   Same structure as apps/support.js: state object S, a base render per scenario, small incremental updates while a check runs. */
(function () {
  'use strict';

  var CSS = [
    '@media (min-width:901px){.demo-grid.gate-g{grid-template-columns:minmax(0,3fr) minmax(0,2fr)}}',
    /* corpus table: fixed layout, so nothing moves while the marks fill in */
    '.gate-corp{container-type:inline-size}',
    'table.gate-t{table-layout:fixed;min-width:560px}',
    '.gate-t th,.gate-t td{padding:7px 8px;vertical-align:middle}',
    '.gate-t thead tr:first-child th{border-top:0}',
    '.gate-t tbody td:first-child,.gate-t tfoot td:first-child,.gate-t thead tr:first-child th:first-child{border-left:0}',
    '.gate-t tbody td:last-child,.gate-t tfoot td:last-child,.gate-t thead th:last-child{border-right:0}',
    '.gate-t tfoot td{border-bottom:0;background:var(--bg2)}',
    '.gate-t th.gate-n{width:46px}',
    '.gate-t th.gate-x{width:128px}',
    '.gate-t th.gate-rg{width:270px;text-align:center}',
    '.gate-t th.gate-rh{text-align:center;transition:color .2s ease,background-color .2s ease,opacity .2s ease}',
    '.gate-t th.gate-rh.on{color:var(--acc-ink);background:var(--acc-soft)}',
    '.gate-t th.gate-rh.dim{opacity:.4}',
    '.gate-t td.gate-n{font:500 12px/1.3 var(--fm);color:var(--ink3);white-space:nowrap}',
    '.gate-t td.gate-q b{display:block;font-weight:500}',
    '.gate-t td.gate-x{color:var(--ink2)}',
    '.gate-t td.gate-r{text-align:center;padding:6px 4px;color:var(--ink3)}',
    '.gate-t .gate-e{display:none}',
    '.gate-t .gate-new{color:var(--acc-ink)}',
    '.gate-t tr.gate-hit td{background:color-mix(in srgb,var(--bad) 9%,var(--card))}',
    '.gate-t tr.gate-hit td.gate-n{color:var(--bad);box-shadow:inset 3px 0 0 var(--bad)}',
    '.gate-t tfoot td.gate-q{font:500 11.5px/1.3 var(--fm);letter-spacing:.03em;color:var(--ink3)}',
    '.gate-p{display:inline-block;font:700 13px/1 var(--fm)}',
    '.gate-p.ok{color:var(--ok)}.gate-p.bad{color:var(--bad)}',
    '.gate-c{display:inline-flex;align-items:center;justify-content:center;gap:4px;font:500 11px/1 var(--fm);padding:5px 6px;border-radius:7px;white-space:nowrap;vertical-align:middle}',
    '.gate-c svg{display:none;width:13px;height:13px;flex:none}',
    '.gate-c.is-s{background:var(--ok-soft);color:var(--ok)}',
    '.gate-c.is-a{background:var(--info-soft);color:var(--info)}',
    '.gate-c.is-d{background:var(--bad-soft);color:var(--bad)}',
    '.gate-leg{display:none;flex-wrap:wrap;gap:6px 14px;align-items:center;padding:9px 12px;border-top:1px solid var(--line2);background:var(--card);font-size:12px;color:var(--ink2)}',
    '.gate-leg>div{display:inline-flex;align-items:center;gap:6px}',
    '.gate-foot{display:flex;flex-wrap:wrap;gap:10px 14px;align-items:center;padding:12px 14px;border-top:1px solid var(--line)}',
    '.gate-foot p{flex:1 1 220px;min-width:0;font-size:12.5px;line-height:1.4;color:var(--ink3)}',
    /* runs: bars with the threshold tick, the result line, the verdict */
    '.gate-bars{display:grid;gap:12px;margin-top:14px}',
    '.gate-br{display:grid;grid-template-columns:72px minmax(0,1fr) 44px;gap:10px;align-items:center;transition:opacity .2s ease}',
    '.gate-br.stale{opacity:.45}',
    '.gate-bl{font:500 12px/1.2 var(--fm);color:var(--ink2);white-space:nowrap}',
    '.gate-tr{position:relative}',
    '.gate-tr .bar{height:12px}',
    '.gate-th{position:absolute;top:-4px;bottom:-4px;width:2px;margin-left:-1px;border-radius:2px;background:var(--ink)}',
    '.gate-bv{font:700 15px/1 var(--fm);text-align:right}',
    '.gate-bv.ok{color:var(--ok)}.gate-bv.bad{color:var(--bad)}',
    '.gate-ax{margin-top:-4px}',
    '.gate-ax .gate-tr{height:13px}',
    '.gate-tl{position:absolute;top:0;transform:translateX(-50%);font:500 11px/13px var(--fm);color:var(--ink3);white-space:nowrap}',
    '.gate-res{display:flex;flex-wrap:wrap;gap:10px 14px;align-items:center;justify-content:space-between;margin-top:14px;padding-top:14px;border-top:1px solid var(--line2)}',
    '.gate-rl{display:block;font:500 11.5px/1.2 var(--fm);letter-spacing:.04em;text-transform:uppercase;color:var(--ink3)}',
    '.gate-rv{display:inline-block;margin-top:6px;font:700 28px/1.1 var(--fm)}',
    '.gate-rs{display:block;margin-top:4px;font:400 12px/1.3 var(--fm);color:var(--ink3)}',
    '.gate-rs:empty{display:none}',
    '.gate-rs b{color:var(--ink);font-weight:700}',
    '.gate-v{display:inline-flex;align-items:center;gap:8px;padding:11px 14px;border-radius:12px;background:var(--bg2);color:var(--ink3);font:700 15px/1.2 var(--fb)}',
    '.gate-v svg{width:17px;height:17px;flex:none}',
    '.gate-v.ok{background:var(--ok-soft);color:var(--ok)}',
    '.gate-v.bad{background:var(--bad-soft);color:var(--bad)}',
    '.gate-ex{display:grid;gap:10px;margin-top:12px}',
    '.gate-ex:empty{display:none}',
    '.gate-trail{display:flex;flex-wrap:wrap;gap:6px;align-items:center;font-size:13px;color:var(--ink2)}',
    '.gate-trail svg{width:12px;height:12px;flex:none;color:var(--ink3)}',
    '.gate-dv{display:grid;gap:8px}',
    '.gate-dh{font:500 11.5px/1.3 var(--fm);letter-spacing:.04em;text-transform:uppercase;color:var(--bad)}',
    '.gate-di{padding:9px 11px;border-radius:10px;border-left:3px solid var(--bad);background:var(--bg2);font-size:13.5px;line-height:1.4}',
    '.gate-di b{display:block;font-weight:600}',
    '.gate-di span{display:block;margin-top:2px;color:var(--ink2)}',
    '.gate-dm{font-size:12.5px;color:var(--ink3)}',
    /* narrow window: the expected outcome moves under the request, then the marks shrink to icons with a legend */
    '@container (max-width:559px){table.gate-t{min-width:0}.gate-t .gate-x{display:none}.gate-t .gate-e{display:inline}}',
    '@container (max-width:479px){.gate-t th.gate-n{width:36px}.gate-t th.gate-rg{width:114px}.gate-t th,.gate-t td{padding:7px 6px}.gate-t td.gate-r{padding:6px 2px}.gate-c{padding:6px}.gate-c svg{display:block}.gate-c span{display:none}.gate-leg{display:flex}}'
  ].join('');

  PF.app('gate', {
    cap: [
      'Макет на выдуманных данных. Настоящий гейт так же прогоняет бота по реальным кейсам перед каждым релизом, и судья-модель оценивает каждый ответ.',
      'A mock on invented data. The real gate replays the bot on real cases before each release the same way, and a judge model scores every answer.'
    ],
    pace: 1500,
    mount: function (ctx) {
      var T = ctx.T, h = ctx.h, icon = ctx.icon;
      if (!document.getElementById('pf-gate-css')) document.head.appendChild(h('style', { id: 'pf-gate-css' }, CSS));

      /* ---------- invented data ---------- */
      var THR = 85, CORPUS = 120, CELL = 320, NUM = T('№', '#');
      var PHOTO = T('Фото-приложение', 'Photo app'), MUSIC = T('Музыка', 'Music'), SCAN = T('Сканер', 'Scanner');
      /* the table shows a slice of the corpus, the percentages are counted over the whole corpus */
      var CASES = [
        { n: 3, brand: PHOTO, ask: T('Отменить подписку', 'Cancel the subscription'), exp: T('отмена + письмо', 'cancel + email') },
        { n: 17, brand: MUSIC, ask: T('Списали после отмены', 'Charged after cancelling'), exp: T('возврат', 'refund') },
        { n: 24, brand: SCAN, ask: T('Грозит спором через банк', 'Threatens a bank dispute'), exp: T('человеку', 'to a human') },
        { n: 38, brand: PHOTO, ask: T('Как сменить тариф', 'How to change the plan'), exp: T('инструкция', 'how-to steps') },
        { n: 52, brand: SCAN, ask: T('Возврат через 40 дней', 'A refund after 40 days'), exp: T('отказ + правила', 'decline + rules') },
        { n: 71, brand: MUSIC, ask: T('Когда следующее списание', 'When the next charge is'), exp: T('дата списания', 'charge date') },
        { n: 96, brand: SCAN, ask: T('Отмена, пишет на немецком', 'Cancellation, writes in German'), exp: T('отмена + письмо', 'cancel + email') },
        { n: 118, brand: PHOTO, ask: T('Не может войти в аккаунт', 'Cannot sign in to the account'), exp: T('ссылка для входа', 'sign-in link') }
      ];
      var EXTRA = [
        { n: 121, extra: true, brand: MUSIC, ask: T('Пауза вместо отмены', 'A pause instead of cancelling'), exp: T('пауза + письмо', 'pause + email') },
        { n: 122, extra: true, brand: SCAN, ask: T('Чек для бухгалтерии', 'A receipt for accounting'), exp: T('чек + письмо', 'receipt + email') }
      ];
      /* fixed per change, mode and run: [percent, the judge's marks for the ten rows above: s same, a acceptable, d diverged] */
      var RES = {
        safe: {
          med: [[88, 'asssssasss'], [91, 'asssssssss'], [86, 'assssdasas']],
          one: [[88, 'asssssasss'], [82, 'assdsdasss'], [91, 'asssssssss']]
        },
        broken: {
          med: [[75, 'sdssdsssss'], [71, 'sdasdssass'], [78, 'sdssdasssa']],
          one: [[75, 'sdssdsssss'], [71, 'sdasdssass'], [78, 'sdssdasssa']]
        }
      };
      var WHY = [
        { n: 17, ask: CASES[1].ask, why: T('Судья: ждали возврат, а бот отказал. Из правил пропал пункт про списание после отмены.', 'Judge: a refund was expected, the bot declined. The clause on charges after cancellation is gone from the rules.') },
        { n: 52, ask: CASES[4].ask, why: T('Судья: бот пообещал возврат, которого правила не разрешают. Срок 14 дней выпал из текста.', 'Judge: the bot promised a refund the rules do not allow. The 14-day limit fell out of the text.') }
      ];
      var SVGNS = 'http://www.w3.org/2000/svg';
      function wave() {
        var s = document.createElementNS(SVGNS, 'svg'), p = document.createElementNS(SVGNS, 'path');
        s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('aria-hidden', 'true');
        p.setAttribute('d', 'M4 14c2-4 5-4 8-2s6 2 8-2');
        p.setAttribute('fill', 'none'); p.setAttribute('stroke', 'currentColor'); p.setAttribute('stroke-width', '2.4'); p.setAttribute('stroke-linecap', 'round');
        s.appendChild(p);
        return s;
      }
      var VERD = {
        s: [T('совпал', 'same'), function () { return icon('check'); }],
        a: [T('допустимо', 'acceptable'), wave],
        d: [T('разошёлся', 'diverged'), function () { return icon('x'); }]
      };
      function chip(code, pop) {
        var v = VERD[code];
        return h('span.gate-c.is-' + code + (pop ? '.in-pop' : ''), { role: 'img', 'aria-label': v[0], title: v[0] }, v[1](), h('span', null, v[0]));
      }

      var S, seen = {}, added = 0, clock = 0, rows = [];

      /* ---------- static frame ---------- */
      var segChange = ctx.seg(T('Правка в релизе', 'Change in the release'), [
        ['safe', T('Новый шаблон отмены', 'New cancellation template')],
        ['broken', T('Укоротили правила возврата', 'Shortened refund rules')]
      ], 'safe', function (v) { start(v, S.mode); });
      var segMode = ctx.seg(T('Как считать', 'How to count'), [
        ['one', T('Один прогон', 'Single run')],
        ['med', T('Медиана трёх', 'Median of three')]
      ], 'med', function (v) { start(S.change, v); });
      ctx.bar.appendChild(segChange);
      ctx.bar.appendChild(segMode);

      var thRuns = [1, 2, 3].map(function (n) { return h('th.gate-rh', null, String(n)); });
      var footCells = [0, 1, 2].map(function () { return h('td.gate-r', null, '—'); });
      var tbody = h('tbody');
      var table = h('table.sheet.gate-t', null,
        h('thead', null,
          h('tr', null,
            h('th.gate-n', { rowspan: '2' }, NUM),
            h('th.gate-q', { rowspan: '2' }, T('Что просит клиент', 'What the customer asks')),
            h('th.gate-x', { rowspan: '2' }, T('Ожидаем', 'Expected')),
            h('th.gate-rg', { colspan: '3' }, T('Прогоны', 'Runs'))),
          h('tr', null, thRuns)),
        tbody,
        h('tfoot', null, h('tr', null,
          h('td.gate-n'),
          h('td.gate-q', null, T('Итог по всему корпусу', 'Score over the whole corpus')),
          h('td.gate-x'),
          footCells)));
      var sheetW = h('div.sheet-w', null, table);
      var legend = h('div.gate-leg', null, ['s', 'a', 'd'].map(function (k) { return h('div', null, chip(k), VERD[k][0]); }));
      var addBtn = h('button.btn', { type: 'button', onclick: addCase }, icon('edit'), T('Добавить кейс', 'Add a case'));
      var winCorp = ctx.win('flask', T('Корпус кейсов', 'Case corpus'), '',
        h('p.win-note', null, T('Бот заново отвечает на кейсы, судья-модель сверяет каждый ответ с ожидаемым итогом.', 'The bot answers the cases again, and a judge model compares each answer with the expected outcome.')),
        h('div.gate-corp', null, sheetW, legend,
          h('div.gate-foot', null, addBtn, h('p', null, T('Менеджеры правят и добавляют кейсы сами в своём интерфейсе: без разработчика и выкладки.', 'Managers edit and add cases themselves in their own interface: no developer, no redeploy.')))));

      var runBtn = h('button.btn.btn-acc', { type: 'button', onclick: run }, icon('bolt'), T('Запустить проверку', 'Run the check'));
      var bars = [0, 1, 2].map(function () {
        var fill = h('i', { style: 'width:0%' }), bar = h('div.bar', null, fill), val = h('b.gate-bv', null, '—'), lab = h('span.gate-bl');
        return { row: h('div.gate-br', null, lab, h('div.gate-tr', null, bar, h('span.gate-th', { style: 'left:' + THR + '%' })), val), bar: bar, fill: fill, val: val, lab: lab };
      });
      var resLab = h('span.gate-rl'), resVal = h('b.gate-rv', null, '—'), resSub = h('span.gate-rs'), verdict = h('span.gate-v');
      var extraEl = h('div.gate-ex'), modeNote = h('p.win-note');
      var winRuns = ctx.win('chart', T('Прогоны', 'Runs'), T('порог ', 'threshold ') + THR + '%', modeNote,
        h('div.win-b', null, runBtn,
          h('div.gate-bars', null, bars.map(function (b) { return b.row; }),
            h('div.gate-br.gate-ax', null, h('span'), h('div.gate-tr', null, h('span.gate-tl', { style: 'left:' + THR + '%' }, T('порог', 'threshold'))), h('span'))),
          h('div.gate-res', null, h('div', null, resLab, resVal, resSub), verdict),
          extraEl));

      var log = ctx.logger(T('Пока пусто. Сюда попадёт каждый прогон и каждое решение гейта.', 'Empty for now. Every run and every gate decision lands here.'), T('гейт', 'gate'));
      var cnt = ctx.counters([
        ['cases', T('кейсов в корпусе', 'cases in the corpus'), String(CORPUS)],
        ['runs', T('прогонов', 'runs')],
        ['mins', T('минут на проверку', 'minutes to check'), '—'],
        ['med', T('медиана', 'median'), '—']
      ]);
      var winLog = ctx.win('log', T('Журнал гейта', 'Gate log'), T('время условное', 'time is illustrative'), log.el, cnt.el);

      winCorp.classList.add('o1'); winRuns.classList.add('o2');
      ctx.body.appendChild(h('div.demo-grid.flow.gate-g', null,
        h('div.demo-col', null, winCorp),
        h('div.demo-col', null, winRuns)));
      winLog.classList.add('demo-wide');
      ctx.body.appendChild(winLog);

      /* ---------- small helpers ---------- */
      function tm(add) { clock += add; var hh = Math.floor(clock / 60) % 24, mm = clock % 60; return (hh < 10 ? '0' : '') + hh + ':' + (mm < 10 ? '0' : '') + mm; }
      function blank(td) { td.textContent = '—'; }
      function put(td, node) { td.textContent = ''; td.appendChild(node); }
      function pop(el) { el.classList.remove('in-pop'); void el.offsetWidth; el.classList.add('in-pop'); }
      function vals(a) { var p = a.map(function (v) { return v + '%'; }); return p.length > 1 ? p.slice(0, -1).join(', ') + T(' и ', ' and ') + p[p.length - 1] : p[0]; }
      function play(steps) {
        var i = 0;
        (function go() {
          if (i >= steps.length) return;
          var s = steps[i++];
          ctx.later(function () { s[1](); go(); }, s[0]);
        })();
      }
      function setVerdict(kind, text) {
        verdict.className = 'gate-v' + (kind ? ' ' + kind : '');
        verdict.textContent = '';
        if (kind) verdict.appendChild(icon(kind === 'ok' ? 'check' : 'x'));
        verdict.appendChild(document.createTextNode(text));
        if (kind) pop(verdict);
      }
      function addRow(c, flash) {
        var cells = [0, 1, 2].map(function () { return h('td.gate-r', null, '—'); });
        var tr = h('tr' + (flash ? '.in' : ''), null,
          h('td.gate-n', null, String(c.n)),
          h('td.gate-q', null, h('b', null, c.ask),
            h('small', null, c.brand, c.extra ? [' · ', h('span.gate-new', null, T('добавил менеджер', 'added by a manager'))] : null,
              h('span.gate-e', null, ' · ' + T('ждём: ', 'expected: ') + c.exp))),
          h('td.gate-x', null, c.exp),
          cells);
        tbody.appendChild(tr);
        rows.push({ c: c, tr: tr, cells: cells });
      }
      function paintCorpus() {
        winCorp.note(T('показаны ', 'showing ') + rows.length + T(' из ', ' of ') + (CORPUS + added));
        cnt.set('cases', String(CORPUS + added));
        addBtn.disabled = S.running || added >= EXTRA.length;
      }
      function clearResults() {
        rows.forEach(function (r) { r.tr.classList.remove('gate-hit'); r.cells.forEach(blank); });
        footCells.forEach(blank);
        bars.forEach(function (b) { b.fill.style.width = '0%'; b.bar.className = 'bar'; b.val.className = 'gate-bv'; b.val.textContent = '—'; b.row.classList.remove('stale'); });
        resVal.textContent = '—'; resSub.textContent = '';
        setVerdict('', T('ещё не проверяли', 'not checked yet'));
        extraEl.textContent = '';
      }
      function idleHint() {
        var press = T('Нажмите <b>«Запустить проверку»</b>', 'Press <b>"Run the check"</b>');
        if (S.mode === 'med') {
          return S.change === 'safe'
            ? T('В релизе новый шаблон отмены. ' + press + ': бот трижды ответит на кейсы, судья оценит каждый ответ.', 'The release carries a new cancellation template. ' + press + ': the bot answers the cases three times and a judge scores every answer.')
            : T('В этом релизе укоротили правила возврата. ' + press + ' и посмотрите, что найдёт гейт.', 'This release has shortened refund rules. ' + press + ' and see what the gate finds.');
        }
        return S.change === 'safe'
          ? T('Теперь гейт решает по одному прогону. ' + press + ', а потом ещё раз: релиз тот же, а число будет другим.', 'Now the gate decides on a single run. ' + press + ', then once more: same release, different number.')
          : T('Гейт решает по одному прогону, а в релизе укороченные правила возврата. ' + press + '.', 'The gate decides on a single run, and the release has shortened refund rules. ' + press + '.');
      }

      /* ---------- render of a fresh scenario ---------- */
      function base() {
        var one = S.mode === 'one';
        segChange.set(S.change); segMode.set(S.mode);
        tbody.textContent = ''; rows = [];
        CASES.forEach(function (c) { addRow(c); });
        EXTRA.slice(0, added).forEach(function (c) { addRow(c); });
        paintCorpus();
        modeNote.textContent = one
          ? T('Один прогон на релиз: быстрее, но всё решает одно число.', 'One run per release: faster, but one number decides everything.')
          : T('Три прогона одного релиза. В зачёт идёт медиана, порог не меняется.', 'Three runs of the same release. The median counts, the threshold stays fixed.');
        bars.forEach(function (b, r) { b.row.hidden = one && r > 0; b.lab.textContent = one ? T('Прогон', 'Run') : T('Прогон ', 'Run ') + (r + 1); });
        thRuns.forEach(function (th, r) { th.className = 'gate-rh' + (one && r > 0 ? ' dim' : ''); });
        resLab.textContent = one ? T('Один прогон', 'Single run') : T('Медиана трёх прогонов', 'Median of three runs');
        clearResults();
        runBtn.disabled = false; runBtn.lastChild.textContent = T('Запустить проверку', 'Run the check');
        cnt.set('runs', '0'); cnt.set('mins', '—'); cnt.set('med', '—');
        ctx.end(null);
        ctx.now(idleHint());
      }

      function start(change, mode, hard) {
        var was = S;
        ctx.clearTimers();
        if (hard) { seen = {}; added = 0; clock = 14 * 60; log.clear(); }
        else if (was) {
          if (was.running) log.add(tm(1), T('Проверка прервана', 'Check interrupted'), 'warn');
          if (was.change !== change) log.add(tm(2), T('В релизе другая правка: ', 'A different change in the release: ') + (change === 'safe' ? T('новый шаблон отмены', 'new cancellation template') : T('укоротили правила возврата', 'shortened refund rules')));
          if (was.mode !== mode) log.add(tm(2), mode === 'one' ? T('Гейт считает по одному прогону', 'The gate now counts a single run') : T('Гейт считает медиану трёх прогонов', 'The gate now counts the median of three runs'));
        }
        S = { change: change, mode: mode, running: false, done: false, k: 0, hist: [], last: null };
        base();
      }

      /* ---------- a manager adds a case ---------- */
      function addCase() {
        if (S.running || added >= EXTRA.length) return;
        var c = EXTRA[added], said;
        added++; seen.add = true;
        addRow(c, true);
        paintCorpus();
        log.add(tm(3), T('Менеджер добавил кейс №', 'A manager added case #') + c.n + T(' сам: без разработчика и выкладки', ' on their own: no developer, no redeploy'));
        said = T('Кейс №' + c.n + ' в корпусе: менеджер добавил его сам, без разработчика и выкладки. ', 'Case #' + c.n + ' is in the corpus: a manager added it, no developer and no redeploy. ');
        ctx.now(said + (!S.done ? T('Нажмите <b>«Запустить проверку»</b>: кейс войдёт в прогон.', 'Press <b>"Run the check"</b>: the case joins the run.')
          : S.change === 'safe' && S.mode === 'med' ? T('Теперь переключите правку на <b>«Укоротили правила возврата»</b> и запустите проверку.', 'Now switch the change to <b>"Shortened refund rules"</b> and run the check.')
          : T('Он войдёт в следующую проверку.', 'It joins the next check.')));
      }

      /* ---------- the check ---------- */
      function run() {
        if (S.running) return;
        var one = S.mode === 'one', set = RES[S.change][S.mode], list = one ? [0] : [0, 1, 2], got = [], steps = [], old;
        if (S.done && !one) clearResults();
        S.running = true; S.done = false;
        runBtn.disabled = true; addBtn.disabled = true;
        ctx.end(null);
        if (one) {
          /* the previous number stays on the bar, dimmed, so the jump to the new one is visible */
          rows.forEach(function (r) { r.tr.classList.remove('gate-hit'); blank(r.cells[0]); });
          blank(footCells[0]);
          bars[0].row.classList.add('stale');
          resVal.textContent = '…';
          old = extraEl.querySelector('.gate-dv'); if (old) old.remove();
        }
        setVerdict('', T('идёт проверка…', 'checking…'));
        cnt.set('runs', '0'); cnt.set('mins', '—'); cnt.set('med', '—');
        log.add(tm(1), (one ? T('Проверка запущена: один прогон', 'Check started: a single run') : T('Проверка запущена: три прогона', 'Check started: three runs')) + T(', кейсов в корпусе: ', ', cases in the corpus: ') + (CORPUS + added), 'sys');
        if (!one) ctx.focus(sheetW);

        list.forEach(function (r, idx) {
          var data = one ? set[S.k % set.length] : set[r];
          steps.push([idx ? 800 : 450, function () {
            thRuns[r].classList.add('on');
            bars[r].val.className = 'gate-bv'; bars[r].val.textContent = '…';
            ctx.now((one ? T('Идёт прогон. ', 'The run is in progress. ') : T('Идёт прогон ' + (r + 1) + ' из 3. ', 'Run ' + (r + 1) + ' of 3 is in progress. '))
              + T('Каждая отметка в таблице: оценка судьи за один ответ бота.', "Each mark in the table is the judge's verdict on one bot answer."));
          }]);
          rows.forEach(function (row, i) {
            steps.push([CELL, function () { put(row.cells[r], chip(data[1].charAt(i), true)); }]);
          });
          steps.push([500, function () { got.push(data[0]); endRun(r, data[0]); }]);
        });
        steps.push([900, function () { if (one) verdictOne(got[0]); else verdictMed(got); }]);
        if (S.change === 'broken') steps.push([700, showDiverged]);
        steps.push([350, finish]);
        play(steps);
      }

      function endRun(r, pct) {
        var ok = pct >= THR, b = bars[r];
        thRuns[r].classList.remove('on');
        b.row.classList.remove('stale');
        b.fill.style.width = pct + '%';
        b.bar.className = 'bar ' + (ok ? 'ok' : 'bad');
        b.val.className = 'gate-bv ' + (ok ? 'ok' : 'bad'); b.val.textContent = pct + '%'; pop(b.val);
        put(footCells[r], h('b.gate-p.in-pop.' + (ok ? 'ok' : 'bad'), null, pct + '%'));
        cnt.set('runs', String(r + 1));
        if (S.mode === 'one') log.add(tm(1), T('Прогон готов: бот ответил на кейсы, судья оценил каждый ответ', 'Run finished: the bot answered the cases, the judge scored every answer'), 'sys');
        else log.add(tm(1), r ? T('Прогон ', 'Run ') + (r + 1) + ': ' + pct + '%' : T('Прогон 1: бот ответил на кейсы, судья оценил каждый ответ. Итог ', 'Run 1: the bot answered the cases, the judge scored every answer. Score ') + pct + '%', ok ? 'sys' : 'warn');
      }

      function conclude(ok, val) {
        S.last = { ok: ok, val: val };
        resVal.textContent = val + '%'; pop(resVal);
        setVerdict(ok ? 'ok' : 'bad', ok ? T('Релиз разрешён', 'Release allowed') : T('Релиз остановлен', 'Release blocked'));
      }

      function verdictMed(got) {
        var s = got.slice().sort(function (a, b) { return a - b; }), m = s[1], ok = m >= THR;
        resSub.innerHTML = T('по возрастанию: ', 'sorted: ') + s[0] + ' · <b>' + s[1] + '</b> · ' + s[2];
        conclude(ok, m);
        log.add(tm(1), T('Медиана трёх прогонов: ', 'Median of three runs: ') + m + T('% при пороге ', '% against the threshold of ') + THR + '%', 'sys');
        log.add(tm(0), ok ? T('Релиз разрешён', 'Release allowed') : T('Релиз остановлен: кейсы про возврат разошлись во всех трёх прогонах', 'Release blocked: the refund cases diverged in all three runs'), ok ? 'sys' : 'bad');
        cnt.set('mins', '4'); cnt.set('med', m + '%');
      }

      function verdictOne(val) {
        var ok = val >= THR, prev = S.hist[S.hist.length - 1], box;
        S.hist.push(val); S.k++;
        conclude(ok, val);
        log.add(tm(1), T('Один прогон: ', 'Single run: ') + val + '%, ' + (ok ? T('релиз разрешён', 'release allowed') : T('релиз остановлен', 'release blocked')), ok ? 'sys' : 'bad');
        if (prev != null && prev !== val) log.add(tm(0), T('Релиз тот же, прошлый прогон дал ' + prev + '%. Разница от шума модели', 'Same release, the previous run gave ' + prev + '%. The difference is model noise'), 'warn');
        cnt.set('mins', '2'); cnt.set('med', '—');
        box = h('div.gate-trail', null, h('span', null, T('Запуски одного и того же релиза:', 'Runs of the very same release:')));
        S.hist.slice(-6).forEach(function (v, i) {
          if (i) box.appendChild(icon('arrow'));
          box.appendChild(h('span.tg.' + (v >= THR ? 'tg-ok' : 'tg-bad'), null, v + '%'));
        });
        extraEl.textContent = '';
        extraEl.appendChild(box);
        if (S.hist.length > 1) extraEl.appendChild(h('p.wtl.in-pop', null, icon('warn'), T('Один прогон врёт из-за шума модели.', 'A single run lies because of model noise.')));
      }

      function showDiverged() {
        var one = S.mode === 'one';
        var box = h('div.gate-dv.in-pop', null, h('p.gate-dh', null, one ? T('Что разошлось', 'What diverged') : T('Что разошлось во всех трёх прогонах', 'What diverged in all three runs')));
        WHY.forEach(function (w) {
          rows.forEach(function (r) { if (r.c.n === w.n) r.tr.classList.add('gate-hit'); });
          box.appendChild(h('div.gate-di', null, h('b', null, NUM + w.n + ' · ' + w.ask), h('span', null, w.why)));
        });
        box.appendChild(h('p.gate-dm', null, T('Остальные кейсы про возврат разошлись так же.', 'The other refund cases diverged the same way.')));
        extraEl.appendChild(box);
      }

      function finish() {
        var one = S.mode === 'one', safe = S.change === 'safe', val = S.last.val, n = S.hist.length, prev = S.hist[n - 2];
        S.running = false; S.done = true;
        runBtn.disabled = false; runBtn.lastChild.textContent = T('Запустить ещё раз', 'Run again');
        addBtn.disabled = added >= EXTRA.length;
        if (!one) seen[S.change] = true; else if (safe && S.k >= 2) seen.swing = true;
        ctx.later(function () { ctx.focus(winRuns); }, 300);

        if (!one && safe) {
          ctx.now(added
            ? T('Релиз прошёл. Теперь переключите правку на <b>«Укоротили правила возврата»</b> и запустите проверку.', 'The release passed. Now switch the change to <b>"Shortened refund rules"</b> and run the check.')
            : T('Релиз прошёл. Попробуйте роль менеджера: кнопка <b>«Добавить кейс»</b> под таблицей.', "The release passed. Try the manager's part: the <b>\"Add a case\"</b> button under the table."));
          ctx.end(T('<b>Релиз проверен за минуты вместо дней ручного чтения.</b> Медиана трёх прогонов ' + val + '%, это выше порога ' + THR + '%: релиз разрешён.',
            '<b>The release was checked in minutes instead of days of manual reading.</b> The median of three runs is ' + val + '%, above the ' + THR + '% threshold: the release is allowed.'));
        } else if (!one) {
          ctx.now(T('Гейт остановил релиз. Теперь посмотрите, зачем нужны три прогона: верните правку <b>«Новый шаблон отмены»</b> и включите <b>«Один прогон»</b>.', 'The gate blocked the release. Now see why it takes three runs: go back to <b>"New cancellation template"</b> and switch to <b>"Single run"</b>.'));
          ctx.end(T('<b>Гейт остановил релиз до клиентов.</b> Медиана ' + val + '% при пороге ' + THR + '%. Гейт назвал кейсы про возврат, где бот ошибся, и причину по каждому.',
            '<b>The gate stopped the release before any customer saw it.</b> The median is ' + val + '% against the ' + THR + '% threshold. The gate named the refund cases where the bot went wrong, with a reason for each.'));
        } else if (!safe) {
          ctx.now(T('Здесь хватило и одного прогона: ' + val + '% далеко от порога. Шум мешает рядом с порогом: верните правку <b>«Новый шаблон отмены»</b> и запустите дважды.', 'One run was enough here: ' + val + '% is far below the threshold. Noise matters close to the threshold: go back to <b>"New cancellation template"</b> and run it twice.'));
          ctx.end(T('<b>Гейт остановил релиз до клиентов.</b> Правила возврата сломаны так, что это видно и в одном прогоне: ' + val + '% при пороге ' + THR + '%.',
            '<b>The gate stopped the release before any customer saw it.</b> The refund rules are broken badly enough to show in a single run: ' + val + '% against the ' + THR + '% threshold.'));
        } else if (n < 2) {
          ctx.now(T(val + '%: релиз ' + (S.last.ok ? 'разрешён' : 'остановлен') + '. Нажмите <b>«Запустить ещё раз»</b>: релиз и кейсы те же.', val + '%: the release is ' + (S.last.ok ? 'allowed' : 'blocked') + '. Press <b>"Run again"</b>: same release, same cases.'));
        } else {
          ctx.now(T('Тот же релиз, те же кейсы: было ' + prev + '%, стало ' + val + '%. Нажмите ещё раз или верните <b>«Медиану трёх»</b>.', 'Same release, same cases: it was ' + prev + '%, now it is ' + val + '%. Press again or go back to <b>"Median of three"</b>.'));
          ctx.end(T('<b>Один и тот же релиз получил ' + vals(S.hist.slice(-3)) + '.</b> Один прогон то пропускает его, то останавливает: это шум модели. Поэтому гейт берёт медиану трёх прогонов.',
            '<b>The very same release scored ' + vals(S.hist.slice(-3)) + '.</b> A single run lets it through, then blocks it: that is model noise. So the gate takes the median of three runs.'));
        }
      }

      start('safe', 'med', true);

      /* tour: median on the safe change, a manager adds a case, the broken change is blocked, then a single run shows the swing */
      function go(change, mode) {
        if (S.change !== change) return segChange.btn(change);
        if (S.mode !== mode) return segMode.btn(mode);
        return runBtn;
      }
      return {
        reset: function () { start('safe', 'med', true); },
        next: function () {
          if (S.running) return 'wait';
          if (!seen.safe) return go('safe', 'med');
          if (!seen.add && added < EXTRA.length) return addBtn;
          if (!seen.broken) return go('broken', 'med');
          if (!seen.swing) return go('safe', 'one');
          return null;
        }
      };
    }
  });
})();
