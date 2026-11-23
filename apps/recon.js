/* Mini app: invoice reconciliation for a finance team. A model reads PDF invoices from email into a strict schema,
   then plain code matches bank payments to them. Same structure as apps/support.js: state object S, a base render,
   small incremental updates while it runs. The role switch lives outside S, so it never resets the run. */
(function () {
  'use strict';
  var CSS = [
    '@media (min-width:901px){.demo-grid.recon-grid{grid-template-columns:minmax(0,7fr) minmax(0,5fr)}}',
    '.recon-note{display:flex;gap:9px;align-items:flex-start;margin-bottom:14px;padding:10px 14px;border:1px dashed var(--line);border-radius:12px;background:var(--bg2);font-size:13.5px;line-height:1.45;color:var(--ink2)}',
    '.recon-note svg{width:16px;height:16px;flex:none;margin-top:2px;color:var(--info)}',
    '.recon-note b{color:var(--ink);font-weight:600}',
    '.recon-tools{display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center;padding:10px 12px;border-bottom:1px solid var(--line2);background:var(--card)}',
    '.recon-tools p{flex:1 1 180px;min-width:0;font-size:12.5px;line-height:1.4;color:var(--ink3)}',
    '.recon-list{display:grid;gap:8px;padding:12px;align-content:start}',
    '.recon-row{display:flex;gap:10px;align-items:flex-start;min-width:0;padding:10px 12px;border:1px solid var(--line2);border-radius:13px;background:var(--card);transition:border-color .25s var(--ease-out),box-shadow .25s var(--ease-out)}',
    '.recon-row.peer{border-color:var(--info)}',
    '.recon-row.risk{border-color:var(--bad)}',
    '.recon-row.hot{border-color:var(--acc);box-shadow:0 0 0 3px var(--acc-soft)}',
    '.recon-b{flex:1;min-width:0}',
    /* the slot on the left: a type icon first, the pair letter once the row is matched */
    '.recon-pair{flex:none;width:28px;height:28px;display:grid;place-items:center;border:1px solid var(--line2);border-radius:9px;background:var(--bg);color:var(--ink3);font:700 14px/1 var(--fm)}',
    '.recon-pair svg{width:15px;height:15px}',
    '.recon-pair.on{border-color:var(--info);background:var(--info);color:var(--bg)}',
    '.recon-pair.risk{border-color:var(--bad);background:var(--bad);color:var(--bg)}',
    '.recon-head{display:grid;grid-template-columns:minmax(0,1fr) auto auto;grid-template-areas:"name meta sum";gap:3px 12px;align-items:baseline}',
    '.recon-head.two{grid-template-columns:minmax(0,1fr) auto;grid-template-areas:"name sum" "meta meta"}',
    '.recon-name{grid-area:name;min-width:0;font:600 14.5px/1.35 var(--fb);overflow-wrap:anywhere}',
    '.recon-name.raw{font:500 13px/1.5 var(--fm)}',
    '.recon-sum{grid-area:sum;font:700 15px/1.3 var(--fm);white-space:nowrap;text-align:right}',
    '.recon-meta{grid-area:meta;display:flex;flex-wrap:wrap;gap:4px 8px;align-items:center;min-width:0;font-size:12.5px;line-height:1.4;color:var(--ink3)}',
    '.recon-amt{display:inline-block;transition:filter .25s ease}',
    '.recon-x{display:flex;flex-wrap:wrap;gap:3px 10px;align-items:center;margin-top:7px;font:400 12px/1.5 var(--fm);color:var(--ink3)}',
    '.recon-x b{font-weight:500;color:var(--ink)}',
    '.recon-x .tg{font-size:10.5px;padding:4px 6px}',
    '.recon-g{display:flex;gap:6px;align-items:flex-start;margin-top:7px;font-size:12.5px;line-height:1.4;font-weight:500;color:var(--wait)}',
    '.recon-g svg{width:14px;height:14px;flex:none;margin-top:2px}',
    '.recon-g.ok{color:var(--ok)}',
    '.recon-g.bad{color:var(--bad)}',
    '.recon-g.hum{color:var(--ink2)}',
    '.recon-foot{display:flex;flex-wrap:wrap;gap:5px 10px;align-items:center;margin-top:8px}',
    '.recon-foot small{font-size:12.5px;line-height:1.4;color:var(--ink3)}',
    '.recon-foot small:empty{display:none}',
    '.recon-tg{white-space:normal;line-height:1.3;text-align:left}',
    '.recon-btns{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}',
    '.recon-btns .btn{min-height:40px}',
    '@media (max-width:640px){.recon-list{padding:10px}.recon-head,.recon-head.two{grid-template-columns:minmax(0,1fr) auto;grid-template-areas:"name name" "meta sum";align-items:center}}',
    '@media (prefers-reduced-motion:reduce){.recon-row,.recon-amt{transition:none}}'
  ].join('\n');

  PF.app('recon', {
    cap: [
      'Макет на выдуманных данных. Настоящий сервис так же читает счета из почты и сопоставляет их с платежами из нескольких банков.',
      'A mock on invented data. The real service reads invoices from email the same way and matches them with payments from several banks.'
    ],
    pace: 900,
    mount: function (ctx) {
      var T = ctx.T, h = ctx.h, icon = ctx.icon;
      if (!document.getElementById('pf-recon-css')) document.head.appendChild(h('style', { id: 'pf-recon-css', text: CSS }));

      /* ---------- data: five invoices and five bank payments, all invented ---------- */
      var MON = {
        aug: { name: T('август', 'August'), short: T('авг', 'Aug'), of: T('за август', 'for August') },
        sep: { name: T('сентябрь', 'September'), short: T('сен', 'Sep'), of: T('за сентябрь', 'for September') }
      };
      /* raw: the vendor as written in the PDF, norm: after normalisation. Two Apple invoices share one amount: the trap. */
      var INV = [
        { id: 'figma', raw: 'Figma Inc', norm: 'Figma', no: 'FG-7731', per: 'sep', amt: '$75.00', num: '75.00', pay: 'pfig', pair: 'A' },
        { id: 'cloud', raw: 'Cloud hosting LLC', norm: 'Cloud hosting', no: 'CH-2291', per: 'sep', amt: '$412.60', num: '412.60', pay: 'pcld', pair: 'B' },
        { id: 'apl8', raw: 'Apple Distribution Intl.', norm: 'Apple', no: 'MX48210', per: 'aug', amt: '$99.00', num: '99.00', pay: 'pap8', pair: 'C' },
        { id: 'apl9', raw: 'APPLE DISTRIBUTION INTERNATIONAL LTD', norm: 'Apple', no: 'MX51907', per: 'sep', amt: '$99.00', num: '99.00', pay: 'pap9', pair: 'D' },
        { id: 'design', raw: 'Design contractor', norm: 'Design contractor', no: 'DC-0917', per: 'sep', amt: '$1,800.00', num: '1800.00', pay: 'ppay' }
      ];
      var PAY = [
        { id: 'pap8', bank: 'Mercury', raw: 'APPLE.COM/BILL', date: T('04.08', '4 Aug'), amt: '$99.00' },
        { id: 'pap9', bank: 'Mercury', raw: 'APPLE.COM/BILL', date: T('04.09', '4 Sep'), amt: '$99.00' },
        { id: 'pfig', bank: 'Wise', raw: 'FIGMA MONTHLY RENEWAL', date: T('09.09', '9 Sep'), amt: '$75.00' },
        { id: 'pcld', bank: 'Wise', raw: 'CLOUD HOSTING LLC WIRE', date: T('11.09', '11 Sep'), amt: '$412.60' },
        { id: 'ppay', bank: 'Payoneer', raw: 'PAYROLL SEP', date: T('30.09', '30 Sep'), amt: '$1,800.00' }
      ];

      var S, role = 'fin', seen = {}, inv = {}, pay = {};
      var clock = 0, holdN = 0, holding = false;
      var linkBtn = null, leaveBtn = null, btnRow = null, refusal = null;
      function fresh() { return { phase: 'new', busy: false, tried: false, calls: 0, closed: 0 }; }

      /* ---------- static frame ---------- */
      var segRole = ctx.seg(T('Роль', 'Role'), [
        ['fin', T('Финансы', 'Finance')],
        ['nofin', T('Без роли финансов', 'No finance role')]
      ], 'fin', setRole);
      ctx.bar.appendChild(segRole);

      var note = h('p.recon-note', { hidden: true }, icon('lock'), h('span', {
        html: T('<b>Роли «Финансы» нет.</b> Суммы на экране размыты, а строки компании закрыты и в самой базе: row-level security.',
          "<b>No finance role.</b> Amounts on screen are blurred, and the company's rows are also closed in the database itself: row-level security.")
      }));
      var readBtn = h('button.btn.btn-acc', { type: 'button', onclick: read }, icon('bolt'), T('Прочитать счета', 'Read the invoices'));
      var matchBtn = h('button.btn', { type: 'button', onclick: match }, icon('link'), T('Сопоставить', 'Match'));
      var toolsInv = h('div.recon-tools', null, readBtn, h('p', null, T('Модель читает каждый PDF в строгую схему: поставщик, номер, период, сумма, валюта.', 'A model reads each PDF into a strict schema: vendor, number, period, amount, currency.')));
      var toolsPay = h('div.recon-tools', null, matchBtn, h('p', null, T('Обычный код без модели: сверяет поставщика, сумму и период.', 'Plain code, no model: it compares vendor, amount and period.')));
      var invList = h('div.recon-list'), payList = h('div.recon-list');
      var log = ctx.logger(T('Пока пусто. Каждый шаг сверки попадёт сюда со временем.', 'Empty for now. Every reconciliation step lands here with a timestamp.'), T('система', 'system'));
      var cnt = ctx.counters([
        ['closed', T('закрыто правилами', 'closed by rules')],
        ['calls', T('вызовов модели, на сопоставление 0', 'model calls, 0 for matching')],
        ['human', T('ушло человеку', 'sent to a human')],
        ['period', T('ошибок периода поймано', 'period mistakes caught')]
      ]);
      var winInv = ctx.win('doc', T('Счета из почты', 'Invoices from email'), '', toolsInv, invList);
      var winPay = ctx.win('bank', T('Платежи из банков', 'Bank payments'), 'Mercury · Wise · Payoneer', toolsPay, payList);
      var winLog = ctx.win('log', T('Журнал сверки', 'Reconciliation log'), T('время условное', 'time is illustrative'), log.el, cnt.el);
      winInv.classList.add('o1'); winPay.classList.add('o2');
      ctx.body.appendChild(note);
      ctx.body.appendChild(h('div.demo-grid.recon-grid.flow', null, h('div.demo-col', null, winInv), h('div.demo-col', null, winPay)));
      winLog.classList.add('demo-wide');
      ctx.body.appendChild(winLog);

      /* ---------- small helpers ---------- */
      function tm(add) { clock += add; var m = 14 + Math.floor(clock / 60), s = clock % 60; return '09:' + m + ':' + (s < 10 ? '0' : '') + s; }
      /* every amount goes through amt(): without the finance role it is blurred */
      function amt(text) { return h('span.recon-amt' + (role === 'nofin' ? '.blur' : ''), null, text); }
      function chip(n, cls, text) { n.className = 'tg ' + cls + ' recon-tg'; n.textContent = text; }
      /* pair badge: the same letter on an invoice and on its payment; without a letter the slot shows the type icon again */
      function badge(r, cls, text, title) {
        var n = r.pair;
        n.className = 'recon-pair' + (cls ? ' ' + cls + ' in-pop' : '');
        n.textContent = text || '';
        if (!text) n.appendChild(icon(r.ic));
        n.title = title || '';
      }
      function line(n, cls, ic, text) {
        n.className = 'recon-g in-pop' + (cls ? ' ' + cls : '');
        n.textContent = '';
        n.appendChild(icon(ic)); n.appendChild(h('span', null, text));
        n.hidden = false;
      }
      function chain(steps) {
        var i = 0;
        (function go() {
          if (i >= steps.length) return;
          var s = steps[i++];
          ctx.later(function () { s[1](); go(); }, s[0]);
        })();
      }
      /* autoplay waits while the visitor reads what just happened; manual clicks are never blocked */
      function hold(ms) { var n = ++holdN; holding = true; ctx.later(function () { if (n === holdN) holding = false; }, ms); }
      function hover(r) {
        r.el.addEventListener('mouseenter', function () { if (r.mate) { r.el.classList.add('peer'); r.mate.el.classList.add('peer'); } });
        r.el.addEventListener('mouseleave', unpeer);
      }
      function unpeer() { Array.prototype.forEach.call(ctx.body.querySelectorAll('.recon-row.peer'), function (n) { n.classList.remove('peer'); }); }

      function invRow(d) {
        var r = { d: d, mate: null, ic: 'doc' };
        r.pair = h('span.recon-pair', null, icon('doc'));
        r.chip = h('span.tg.tg-hum.recon-tg', null, T('PDF не прочитан', 'PDF not read yet'));
        r.peer = h('small');
        r.x = h('div.recon-x', { hidden: true });
        r.g = h('p.recon-g', { hidden: true });
        r.more = h('div');
        r.el = h('div.recon-row', null, r.pair, h('div.recon-b', null,
          h('div.recon-head', null,
            h('div.recon-name', null, d.raw),
            h('div.recon-meta', null, MON[d.per].of),
            h('div.recon-sum', null, amt(d.amt))),
          r.x, r.g, h('div.recon-foot', null, r.chip, r.peer), r.more));
        hover(r);
        return r;
      }
      function payRow(d) {
        var r = { d: d, mate: null, ic: 'card' };
        r.pair = h('span.recon-pair', null, icon('card'));
        r.g = h('p.recon-g', { hidden: true });
        r.el = h('div.recon-row', null, r.pair, h('div.recon-b', null,
          h('div.recon-head.two', null,
            h('div.recon-name.raw', null, d.raw),
            h('div.recon-meta', null, h('span.tg.tg-hum', null, d.bank), d.date),
            h('div.recon-sum', null, amt(d.amt))),
          r.g));
        hover(r);
        return r;
      }

      /* ---------- role: blur every amount, the run itself is untouched ---------- */
      function paintRole() {
        var off = role === 'nofin';
        note.hidden = !off;
        Array.prototype.forEach.call(ctx.body.querySelectorAll('.recon-amt'), function (n) { n.classList.toggle('blur', off); });
      }
      function setRole(v) {
        role = v;
        if (v === 'nofin') seen.nofin = true;
        paintRole();
        hint();
        hold(v === 'nofin' ? 4600 : 1600);
      }

      function hint() {
        var p = S.phase, m;
        if (p === 'new') m = T('В почту пришли 5 счетов в PDF. Нажмите <b>«Прочитать счета»</b>: модель разберёт каждый в строгую схему.', 'Five PDF invoices have arrived by email. Press <b>"Read the invoices"</b>: a model reads each one into a strict schema.');
        else if (p === 'reading') m = T('Модель читает PDF. Смотрите, как два разных написания Apple становятся одним поставщиком.', 'The model is reading the PDFs. Watch two different spellings of Apple become one vendor.');
        else if (p === 'read') m = T('Счета прочитаны. Теперь нажмите <b>«Сопоставить»</b>: платежи со счетами сводит обычный код, без модели.', 'The invoices are read. Now press <b>"Match"</b>: plain code pairs payments with invoices, no model involved.');
        else if (p === 'matching') m = T('Идёт сопоставление. У пары одна буква в обоих списках.', 'Matching is running. A pair gets the same letter in both lists.');
        else if (p === 'human') m = S.tried
          ? T('Система не дала связать зарплату со счётом подрядчика. Нажмите <b>«Оставить без пары»</b>.', 'The system refused to link payroll to a contractor invoice. Press <b>"Leave unmatched"</b>.')
          : T('Ваш ход, вы финансист. Попробуйте <b>«Связать вручную»</b> или сразу нажмите <b>«Оставить без пары»</b>.', 'Your turn, you are the finance person. Try <b>"Link manually"</b> or go straight to <b>"Leave unmatched"</b>.');
        else m = role === 'nofin'
          ? T('Суммы размыты, сама сверка на месте. Верните роль <b>«Финансы»</b>.', 'The amounts are blurred, the reconciliation itself is intact. Switch back to <b>"Finance"</b>.')
          : seen.nofin
            ? T('Это весь сценарий. Кнопка <b>«Сначала»</b> запускает сверку заново.', 'That is the whole scenario. <b>"Reset"</b> starts the reconciliation again.')
            : T('Сверка закончена. Переключите роль на <b>«Без роли финансов»</b> и посмотрите на суммы.', 'The reconciliation is finished. Switch the role to <b>"No finance role"</b> and look at the amounts.');
        ctx.now(m);
      }

      /* ---------- render of a fresh run ---------- */
      function base() {
        invList.innerHTML = ''; payList.innerHTML = '';
        inv = {}; pay = {};
        INV.forEach(function (d) { inv[d.id] = invRow(d); invList.appendChild(inv[d.id].el); });
        PAY.forEach(function (d) { pay[d.id] = payRow(d); payList.appendChild(pay[d.id].el); });
        readBtn.disabled = false; readBtn.className = 'btn btn-acc';
        matchBtn.disabled = true; matchBtn.className = 'btn';
        linkBtn = leaveBtn = btnRow = refusal = null;
        winInv.note(T('5 PDF во вложениях', '5 PDF attachments'));
        log.clear();
        cnt.set('closed', '0'); cnt.set('calls', '0'); cnt.set('human', '0'); cnt.set('period', '0');
        ctx.end(null);
        paintRole();
        hint();
      }
      function start() {
        ctx.clearTimers();
        S = fresh(); clock = 5; holdN++; holding = false;
        base();
      }

      /* ---------- step 1: the model reads each PDF into a strict schema ---------- */
      function read() {
        if (S.phase !== 'new') return;
        S.phase = 'reading'; S.busy = true;
        readBtn.disabled = true; readBtn.classList.remove('btn-acc');
        log.add(tm(0), T('В почте 5 счетов в PDF. Модель читает каждый в строгую схему', '5 PDF invoices in the mailbox. A model reads each one into a strict schema'), 'sys');
        hint();
        readOne(0);
      }
      function readOne(i) {
        if (i >= INV.length) { readDone(); return; }
        var r = inv[INV[i].id], d = r.d;
        var again = INV.slice(0, i).some(function (x) { return x.norm === d.norm; });
        r.el.classList.add('hot');
        chip(r.chip, 'tg-acc', T('модель читает', 'the model is reading'));
        r.x.appendChild(h('span.tg.tg-info.in-pop', null, T('строгая схема', 'strict schema')));
        r.x.hidden = false;
        ctx.focus(r.el);
        /* fields are built at the moment they appear, so a role switch in between cannot leave a stale amount */
        var fields = [
          function () { return [T('поставщик', 'vendor') + ' → ', h('b', null, d.norm)]; },
          function () { return [T('№ ', 'no. '), h('b', null, d.no)]; },
          function () { return [T('период ', 'period '), h('b', null, MON[d.per].short)]; },
          function () { return [T('сумма ', 'amount '), h('b', null, amt(d.num + ' USD'))]; }
        ];
        var steps = fields.map(function (f, k) {
          return [k ? 320 : 520, function () { r.x.appendChild(h('span.in-pop', null, f())); }];
        });
        steps.push([340, function () {
          r.el.classList.remove('hot');
          chip(r.chip, 'tg-wait', T('ждёт платёж', 'waiting for a payment'));
          S.calls++; cnt.set('calls', String(S.calls));
          winInv.note(T('прочитано ', 'read ') + S.calls + T(' из ', ' of ') + INV.length);
          log.add(tm(3), T('Прочитан «' + d.raw + '»: ' + (again ? 'тот же поставщик ' : 'поставщик ') + d.norm + ', ' + MON[d.per].name,
            'Read "' + d.raw + '": ' + (again ? 'the same vendor ' : 'vendor ') + d.norm + ', ' + MON[d.per].name), 'sys');
        }]);
        steps.push([380, function () { readOne(i + 1); }]);
        chain(steps);
      }
      function readDone() {
        S.phase = 'read'; S.busy = false;
        matchBtn.disabled = false; matchBtn.classList.add('btn-acc');
        log.add(tm(1), T('Счета прочитаны: 5 вызовов модели. Дальше работает обычный код', 'Invoices are read: 5 model calls. Plain code takes over from here'), 'sys');
        hint();
        ctx.focus(toolsPay);
      }

      /* ---------- step 2: plain code matches payments to invoices ---------- */
      function match() {
        if (S.phase !== 'read') return;
        S.phase = 'matching'; S.busy = true;
        matchBtn.disabled = true; matchBtn.classList.remove('btn-acc');
        log.add(tm(14), T('Сопоставление запущено: платежи Mercury, Wise и Payoneer против счетов. Модель не вызывается', 'Matching started: payments from Mercury, Wise and Payoneer against the invoices. No model call'), 'sys');
        hint();
        chain([
          [700, function () { seek('figma'); }],
          [1500, function () { close('figma'); }],
          [1000, function () { seek('cloud'); }],
          [1500, function () { close('cloud'); }],
          [1100, guardOn],
          [3200, function () { close('apl8'); }],
          [1700, function () { close('apl9'); }],
          [600, caught],
          [1300, candidate],
          [2400, ask]
        ]);
      }
      function seek(id) {
        var r = inv[id], p = pay[r.d.pay];
        r.el.classList.add('hot'); p.el.classList.add('hot');
        chip(r.chip, 'tg-acc', T('ищу платёж', 'looking for a payment'));
        ctx.focus(r.el);
      }
      function close(id) {
        var r = inv[id], p = pay[r.d.pay], d = r.d, L = d.pair, apple = d.norm === 'Apple';
        r.el.classList.remove('hot'); p.el.classList.remove('hot');
        r.mate = p; p.mate = r;
        badge(r, 'on', L, T('пара ', 'pair ') + L); badge(p, 'on', L, T('пара ', 'pair ') + L);
        chip(r.chip, 'tg-ok', T('закрыто правилом, без модели', 'closed by a rule, no model call'));
        r.peer.textContent = T('платёж: ', 'payment: ') + p.d.bank + ' · ' + p.d.date;
        line(p.g, 'ok', 'link', T('счёт ' + d.norm + ' ' + MON[d.per].of, d.norm + ' invoice ' + MON[d.per].of));
        if (apple) line(r.g, 'ok', 'shield', T('та же сумма в двух месяцах: период сверен, это ' + MON[d.per].name, 'same amount in two months: period checked, it is ' + MON[d.per].name));
        S.closed++; cnt.set('closed', String(S.closed));
        winInv.note(T('закрыто ', 'closed ') + S.closed + T(' из ', ' of ') + INV.length);
        log.add(tm(1), apple
          ? T('Пара ' + L + ': счёт Apple ' + MON[d.per].of + ' и платёж ' + p.d.bank + ' ' + p.d.date + '. Период совпал, закрыто правилом',
            'Pair ' + L + ': the Apple invoice ' + MON[d.per].of + ' and the ' + p.d.bank + ' payment of ' + p.d.date + '. The period matches, closed by a rule')
          : T('Пара ' + L + ': ' + d.norm + ' и платёж ' + p.d.bank + ' ' + p.d.date + '. Поставщик, сумма и период совпали, закрыто правилом',
            'Pair ' + L + ': ' + d.norm + ' and the ' + p.d.bank + ' payment of ' + p.d.date + '. Vendor, amount and period agree, closed by a rule'), 'sys');
      }
      /* guard from a real incident: the same amount in two months, so the period decides */
      function guardOn() {
        ['apl8', 'apl9'].forEach(function (id) {
          var r = inv[id];
          r.el.classList.add('hot'); pay[r.d.pay].el.classList.add('hot');
          chip(r.chip, 'tg-acc', T('сверяю период', 'checking the period'));
          line(r.g, '', 'shield', T('та же сумма в двух месяцах: сверяю период', 'same amount in two months: checking the period'));
        });
        log.add(tm(0), T('Apple: одна сумма в августе и в сентябре. По сумме подходят оба платежа, сверяю период', 'Apple: the same amount in August and in September. Both payments fit by amount, checking the period'), 'warn');
        ctx.focus(inv.apl8.el);
      }
      function caught() {
        cnt.set('period', '1');
        log.add(tm(0), T('Ошибка периода поймана: по одной сумме сентябрьский платёж лёг бы на августовский счёт', 'Period mistake caught: by amount alone the September payment would have landed on the August invoice'), 'sys');
      }
      function candidate() {
        var r = inv.design, p = pay.ppay;
        r.el.classList.add('hot'); p.el.classList.add('hot');
        chip(r.chip, 'tg-acc', T('ищу платёж', 'looking for a payment'));
        log.add(tm(1), T('Design contractor: по сумме подходит только PAYROLL SEP, а это зарплатный платёж', 'Design contractor: only PAYROLL SEP fits by amount, and that is a payroll payment'), 'warn');
        ctx.focus(r.el);
      }
      /* the risky pair is not closed by code: a human decides */
      function ask() {
        var r = inv.design, p = pay.ppay;
        r.el.classList.remove('hot'); p.el.classList.remove('hot');
        r.el.classList.add('risk'); p.el.classList.add('risk');
        r.mate = p; p.mate = r;
        badge(r, 'risk', '!', T('рискованная пара', 'risky pair')); badge(p, 'risk', '!', T('рискованная пара', 'risky pair'));
        chip(r.chip, 'tg-bad', T('рискованная пара: зарплата против счёта подрядчика → человеку', 'risky pair: payroll against a contractor invoice → to a human'));
        line(p.g, 'bad', 'warn', T('та же сумма, что в счёте Design contractor, но это зарплата', 'same amount as the Design contractor invoice, but this is payroll'));
        linkBtn = h('button.btn', { type: 'button', onclick: tryLink }, icon('link'), T('Связать вручную', 'Link manually'));
        leaveBtn = h('button.btn', { type: 'button', onclick: leave }, icon('x'), T('Оставить без пары', 'Leave unmatched'));
        btnRow = h('div.recon-btns.in-pop', null, linkBtn, leaveBtn);
        refusal = h('p.recon-g', { hidden: true });
        r.more.appendChild(btnRow); r.more.appendChild(refusal);
        cnt.set('human', '1');
        log.add(tm(0), T('Рискованная пара не закрыта. Счёт передан финансисту с причиной', 'The risky pair is not closed. The invoice goes to a finance person with the reason'), 'sys');
        S.phase = 'human'; S.busy = false;
        hint();
        ctx.focus(r.el);
      }

      /* ---------- the visitor is the finance person ---------- */
      function tryLink() {
        if (S.phase !== 'human' || S.tried) return;
        S.tried = true;
        linkBtn.disabled = true; leaveBtn.classList.add('btn-acc');
        line(refusal, 'bad', 'shield', T('Отказано. Пара «зарплатный платёж и счёт подрядчика» заблокирована: связать её вручную нельзя.', 'Refused. The pair "payroll payment and contractor invoice" is blocked: it cannot be linked by hand.'));
        log.add(tm(38), T('Ручная связь отклонена: зарплатный платёж нельзя привязать к счёту подрядчика, этот тип пары заблокирован', 'Manual link refused: a payroll payment cannot be linked to a contractor invoice, this pair type is blocked'), 'bad');
        hint();
        hold(3800);
      }
      function leave() {
        if (S.phase !== 'human') return;
        var r = inv.design, p = pay.ppay;
        S.phase = 'done';
        r.mate = p.mate = null; unpeer();
        r.el.classList.remove('risk'); p.el.classList.remove('risk');
        badge(r, '', ''); badge(p, '', '');
        chip(r.chip, 'tg-wait', T('без пары: решение человека', 'unmatched: a human decision'));
        btnRow.remove();
        line(p.g, 'hum', 'user', T('зарплата: счёт подрядчика к ней не привязан', 'payroll: the contractor invoice is not linked to it'));
        log.add(tm(17), T('Финансист оставил счёт Design contractor без пары', 'The finance person left the Design contractor invoice unmatched'));
        ctx.end(T('<b>' + S.closed + ' из ' + INV.length + ' счетов закрыты без человека и без вызова модели на сопоставлении.</b> Рискованную пару система не закрыла сама: она ушла финансисту вместе с причиной.',
          '<b>' + S.closed + ' of ' + INV.length + ' invoices were closed without a person and with no model call for matching.</b> The system did not close the risky pair on its own: it went to a finance person with the reason.'));
        hint();
        hold(4600);
        ctx.later(function () { ctx.focus(winLog); }, 900);
      }

      start();

      return {
        reset: function () { seen = {}; role = 'fin'; segRole.set('fin'); start(); },
        next: function () {
          if (S.busy) return 'wait';
          if (S.phase === 'done' && seen.nofin && role === 'fin') return null;
          if (holding) return 'wait';
          if (S.phase === 'new') return readBtn;
          if (S.phase === 'read') return matchBtn;
          if (S.phase === 'human') return S.tried ? leaveBtn : linkBtn;
          if (!seen.nofin) return segRole.btn('nofin');
          return segRole.btn('fin');
        }
      };
    }
  });
})();
