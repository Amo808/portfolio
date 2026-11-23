/* Mini app: month closing for a finance team. Bank statements come in, plain rules and the matcher close what they can,
   the dashboard explains every open payment and offers one button for it. Employees fill their monthly invoice
   (salary from the base pay, receipts, NBP rate, payout by bank or USDT), finance confirms the payout against it.
   Reading a vendor PDF is one small automatic step. Same structure as apps/hiring.js: state S, render(), next() only reads. */
(function () {
  'use strict';

  var CSS = [
    '.recon-tabs{margin:12px 12px 0}',
    '.recon-col,.recon-col>.win,.recon-main{min-width:0;max-width:100%}',
    '.recon-main .okl{align-items:flex-start;line-height:1.4}.recon-main .okl span{min-width:0}',
    '.recon-list{display:grid;gap:8px;padding:12px;align-content:start}',
    '.recon-row{display:grid;gap:6px;min-width:0;padding:10px 12px;border:1px solid var(--line2);border-radius:13px;background:var(--card);transition:border-color .25s ease,box-shadow .25s ease}',
    '.recon-row.open{border-color:var(--wait)}',
    '.recon-row.hot{border-color:var(--acc);box-shadow:0 0 0 3px var(--acc-soft)}',
    '.recon-r1{display:flex;justify-content:space-between;align-items:baseline;gap:10px;min-width:0}',
    '.recon-r1 b{font:500 13px/1.4 var(--fm);min-width:0;overflow-wrap:anywhere}',
    '.recon-sum{font:700 14px/1.3 var(--fm);white-space:nowrap}',
    '.recon-r2{display:flex;flex-wrap:wrap;gap:4px 8px;align-items:center;font-size:12.5px;line-height:1.4;color:var(--ink3)}',
    '.recon-r2 .tg{font-size:10.5px;padding:4px 6px}',
    '.recon-why{display:flex;gap:6px;align-items:flex-start;font-size:13px;line-height:1.4;color:var(--ink2)}',
    '.recon-why svg{width:14px;height:14px;flex:none;margin-top:2px;color:var(--wait)}',
    '.recon-why.ok svg{color:var(--ok)}',
    '.recon-acts{display:flex;flex-wrap:wrap;gap:6px}',
    '.recon-acts .btn{min-height:38px}',
    '.recon-auto{display:flex;gap:6px;align-items:center;font:500 11.5px/1.4 var(--fm);color:var(--info)}',
    '.recon-auto svg{width:13px;height:13px;flex:none}',
    '.recon-empty{padding:18px 12px;font-size:13.5px;color:var(--ink3);line-height:1.45}',
    '.recon-filt{display:flex;flex-wrap:wrap;gap:6px;padding:10px 12px 0}',
    '.recon-filt span{font-size:12px;padding:5px 9px;border-radius:999px;border:1px solid var(--line);background:var(--card);color:var(--ink2)}',
    '.recon-filt span.on{border-color:var(--acc);color:var(--acc-ink)}',
    '.recon-tw{padding:12px}',
    '.recon-tw .btn{min-height:38px}',
    '.recon-me{display:grid;gap:10px}',
    '.recon-line{display:flex;justify-content:space-between;gap:10px;align-items:baseline;padding:8px 0;border-bottom:1px dashed var(--line2);font-size:13.5px;line-height:1.4}',
    '.recon-line small{display:block;font-size:12px;color:var(--ink3)}',
    '.recon-line b{font:600 14px/1.3 var(--fm);white-space:nowrap}',
    '.recon-tot{display:flex;justify-content:space-between;align-items:baseline;gap:10px;padding-top:4px}',
    '.recon-tot b{font:700 26px/1 var(--fm);letter-spacing:-.02em}',
    '.recon-pdf{display:flex;gap:10px;align-items:center;padding:10px 12px;border:1px solid var(--line2);border-radius:12px;background:var(--bg2);font-size:13px;line-height:1.4}',
    '.recon-pdf svg{width:18px;height:18px;flex:none;color:var(--acc-ink)}',
    '.recon-pdf.locked svg{color:var(--ink3)}',
    '.recon-who{font:500 11px/1.3 var(--fm);letter-spacing:.05em;text-transform:uppercase;color:var(--ink3)}',
    '@media (max-width:640px){.recon-tot b{font-size:22px}.recon-tw .sheet th,.recon-tw .sheet td{padding:6px 7px}}',
    '@media (prefers-reduced-motion:reduce){.recon-row{transition:none}}'
  ].join('');

  PF.app('recon', {
    cap: [
      'Макет на выдуманных данных: вендоры, люди и суммы придуманы. В настоящем сервисе те же причины у открытых платежей, тот же «Мой инвойс» сотрудника и то же подтверждение выплаты финансами.',
      'A mock on invented data: vendors, people and amounts are made up. The real service has the same reasons on open payments, the same employee invoice page and the same payout confirmation by finance.'
    ],
    pace: 1100,
    mount: function (ctx) {
      var T = ctx.T, h = ctx.h, icon = ctx.icon;
      if (!document.getElementById('pf-recon-css')) document.head.appendChild(h('style', { id: 'pf-recon-css', text: CSS }));

      /* ---------- data: all invented ---------- */
      function rows() {
        return [
          { id: 'adobe', src: 'Mercury', raw: 'ADOBE *CREATIVE CLOUD', sum: 59.99, st: 'auto', vendor: 'Adobe',
            why: T('Инвойс ADB-1093 на ту же сумму, дата +1 день', 'Invoice ADB-1093, same amount, date +1 day') },
          { id: 'nord', src: 'Wise', raw: 'Transfer to Studio Nord', sum: 1201.13, st: 'auto', vendor: 'Studio Nord',
            why: T('Инвойс SN-0412 на 1 200.00 + комиссия Wise 1.13', 'Invoice SN-0412 for 1,200.00 + Wise fee 1.13') },
          { id: 'oai', src: 'Mercury', raw: 'OPENAI *CHATGPT', sum: 120.40, st: 'auto', vendor: 'OpenAI',
            why: T('Инвойс в PLN: 438 PLN по курсу ЕЦБ на день списания', 'Invoice in PLN: 438 PLN at the ECB rate on the charge day') },
          { id: 'pay', src: 'Mercury', raw: 'GUSTO PAYROLL OCT', sum: 18400, st: 'rule', vendor: '—',
            why: T('Зарплата: инвойс не нужен, закрыто правилом', 'Payroll: no invoice needed, closed by a rule') },
          { id: 'tax', src: 'Mercury', raw: 'IRS USATAXPYMT', sum: 2310, st: 'rule', vendor: '—',
            why: T('Налог: инвойс не нужен, закрыто правилом', 'Tax: no invoice needed, closed by a rule') },
          { id: 'fig1', src: 'Payoneer', raw: 'PAYPAL *FIGMA', sum: 45, st: 'open', k: 'weak' },
          { id: 'fig2', src: 'Payoneer', raw: 'PAYPAL *FIGMA', sum: 15, st: 'open', k: 'weak' },
          { id: 'luma', src: 'Mercury', raw: 'LUMA AI INC', sum: 300, st: 'open', k: 'noinv', vendor: 'LumaAI' },
          { id: 'not1', src: 'Mercury', raw: 'NOTION LABS', sum: 96, st: 'auto', vendor: 'Notion',
            why: T('Инвойс NT-7781 на ту же сумму', 'Invoice NT-7781, same amount') },
          { id: 'not2', src: 'Mercury', raw: 'NOTION LABS', sum: 96, st: 'open', k: 'dup', vendor: 'Notion' }
        ];
      }
      var ME = { name: T('Анна П.', 'Anna P.'), file: 'Petrova_A inv October\'26.pdf' };
      function staff() {
        return [
          { id: 'me', name: ME.name, total: null, via: null, st: 'draft' },
          { id: 'igor', name: T('Игорь С.', 'Igor S.'), total: 2950, via: 'USDT', st: 'paid' },
          { id: 'maria', name: T('Мария Л.', 'Maria L.'), total: 3400, via: T('счёт', 'bank'), st: 'sent' },
          { id: 'oleg', name: T('Олег В.', 'Oleg V.'), total: null, via: null, st: 'draft' }
        ];
      }
      var SAL = 3177, SPORT = 45.22, TOTAL = 3222.22;

      var S, clock = 0, N = {};
      function fresh() {
        return { role: 'fin', tab: 'todo', loaded: false, busy: false, hold: false, hk: 0, P: [], E: staff(), flash: null,
          figma: false, drive: false, dupSeen: false, dup: false, rcpt: false, method: 'bank', blocked: false, sent: false,
          kraken: false, payout: false, blurSeen: false, ended: false, mine: 0 };
      }

      /* ---------- frame ---------- */
      var segRole = ctx.seg(T('Роль', 'Role'), [['fin', T('Финансы', 'Finance')], ['none', T('Без роли «финансы»', 'No finance role')]], 'fin', function (v) { setRole(v); });
      ctx.bar.appendChild(segRole);

      var segTab = ctx.seg('', [['todo', T('Дела за месяц', 'To do this month')], ['done', T('Сверено', 'Matched')], ['attn', T('Обратите внимание', 'Heads up')], ['staff', T('Выплаты сотрудникам', 'Staff payouts')]], 'todo', function (v) { setTab(v); });
      segTab.classList.add('recon-tabs');
      var mainP = h('div.recon-main');
      var winMain = ctx.win('bank', T('Сверка · октябрь 2026', 'Reconciliation · October 2026'), '', segTab, mainP);

      var meP = h('div.win-b');
      var winMe = ctx.win('user', T('Мой инвойс · октябрь', 'My invoice · October'), T('видит только свой', 'sees only their own'), meP);

      var log = ctx.logger(T('Пока пусто. Загрузите выписки за октябрь.', 'Empty for now. Load the October statements.'), T('сервис', 'service'));
      var cnt = ctx.counters([
        ['open', T('платежей открыто', 'payments open'), '—'],
        ['auto', T('закрыто само', 'closed by itself'), '—'],
        ['you', T('решено одной кнопкой', 'solved with one button'), '0'],
        ['paid', T('выплат сотрудникам сверено', 'staff payouts matched'), '1']
      ]);
      var winLog = ctx.win('log', T('Журнал', 'Log'), T('время условное', 'time is illustrative'), log.el, cnt.el);

      winMain.classList.add('o1'); winMe.classList.add('o2'); winLog.classList.add('o3', 'demo-wide');
      ctx.body.appendChild(h('div.demo-grid.flow', null, h('div.demo-col.recon-col', null, winMain), h('div.demo-col.recon-col', null, winMe)));
      ctx.body.appendChild(winLog);

      /* ---------- helpers ---------- */
      function tm(add) {
        clock += add;
        var t = 9 * 60 + 30 + clock, hh = Math.floor(t / 60), mm = t % 60;
        return hh + ':' + (mm < 10 ? '0' : '') + mm;
      }
      function hold(ms) { var k = ++S.hk; S.hold = true; ctx.later(function () { if (k === S.hk) S.hold = false; }, ms); }
      function money(n) {
        var s = n.toFixed(2).split('.'), w = s[0].replace(/\B(?=(\d{3})+(?!\d))/g, ctx.lang === 'ru' ? ' ' : ',');
        return w + (ctx.lang === 'ru' ? ',' : '.') + s[1];
      }
      function amt(n, cur) { return h('span' + (S.role === 'none' ? '.blur' : ''), null, money(n) + ' ' + (cur || 'USD')); }
      function P(id) { for (var i = 0; i < S.P.length; i++) if (S.P[i].id === id) return S.P[i]; return null; }
      function E(id) { for (var i = 0; i < S.E.length; i++) if (S.E[i].id === id) return S.E[i]; return null; }
      function openN() { return S.P.filter(function (p) { return p.st === 'open'; }).length; }
      function autoN() { return S.P.filter(function (p) { return p.st === 'auto' || p.st === 'rule'; }).length; }
      function counts() {
        if (!S.loaded) return;
        cnt.set('open', String(openN())); cnt.set('auto', String(autoN())); cnt.set('you', String(S.mine));
        cnt.set('paid', String(S.E.filter(function (e) { return e.st === 'paid'; }).length));
      }
      function close(p, vendor, why) { p.st = 'you'; if (vendor) p.vendor = vendor; p.why = why; S.mine++; S.flash = p.id; }

      /* ---------- main window ---------- */
      function row(p) {
        var el = h('div.recon-row' + (p.st === 'open' ? '.open' : '') + (S.flash === p.id ? '.hot.in-pop' : ''));
        var tag = p.st === 'rule' ? h('span.tg.tg-hum', null, T('правило', 'rule'))
          : p.st === 'auto' ? h('span.tg.tg-ok', null, T('сверено само', 'auto-matched'))
          : p.st === 'you' ? h('span.tg.tg-acc', null, T('решено', 'solved'))
          : h('span.tg.tg-wait', null, T('открыт', 'open'));
        el.appendChild(h('div.recon-r1', null, h('b', null, p.raw), h('span.recon-sum', null, amt(p.sum))));
        el.appendChild(h('div.recon-r2', null, h('span', null, p.src), p.vendor && p.vendor !== '—' ? h('span', null, '· ' + p.vendor) : null, tag));
        if (p.st !== 'open') { el.appendChild(h('div.recon-why.ok', null, icon('check'), h('span', null, p.why))); return el; }
        var fin = S.role === 'fin', acts = h('div.recon-acts');
        if (p.k === 'weak') {
          el.appendChild(h('div.recon-why', null, icon('search'), h('span', null, fin ? T('Похоже на «Figma» из справочника. Это он?', 'Looks like "Figma" from the vendor list. Is it?') : T('Похоже на вендора из справочника', 'Looks like a vendor from the list'))));
          if (fin) { var b = h('button.btn.btn-acc.btn-sm', { type: 'button', onclick: acceptFigma }, icon('check'), T('Да, это Figma', 'Yes, it is Figma')); acts.appendChild(b); N['fig_' + p.id] = b; }
        } else if (p.k === 'noinv') {
          el.appendChild(h('div.recon-why', null, icon('doc'), h('span', null, T('Инвойса за этот период нет в папке вендора', 'No invoice for this period in the vendor folder'))));
          if (fin) {
            N.drive = h('button.btn.btn-acc.btn-sm', { type: 'button', onclick: fromDrive }, icon('reset'), T('Обновить из Drive', 'Refresh from Drive'));
            acts.appendChild(N.drive);
            acts.appendChild(h('button.btn.btn-sm', { type: 'button', onclick: function () { noInvoice(p); } }, T('Инвойс не нужен', 'No invoice needed')));
          }
        } else if (p.k === 'dup') {
          el.appendChild(h('div.recon-why', null, icon('warn'), h('span', null, T('Второй платёж Notion на ту же сумму в тот же день. Смотрите «Обратите внимание».', 'A second Notion charge, same amount, same day. See "Heads up".'))));
        } else if (p.k === 'kraken') {
          el.appendChild(h('div.recon-why', null, icon('users'), h('span', null, T('Похоже на выплату сотруднику. Подбор во вкладке «Выплаты сотрудникам».', 'Looks like a staff payout. The match is on the "Staff payouts" tab.'))));
        }
        if (acts.childNodes.length) el.appendChild(acts);
        return el;
      }

      function filters(on) {
        var f = [[T('Все', 'All'), 'all'], ['Mercury', 'm'], ['Wise', 'w'], ['Payoneer', 'p'], ['Kraken', 'k']];
        return h('div.recon-filt', null, f.map(function (x) { return h('span' + (x[1] === on ? '.on' : ''), null, x[0]); }));
      }

      function renderMain() {
        mainP.innerHTML = '';
        ['fig_fig1', 'fig_fig2', 'drive', 'dupBtn', 'payBtn', 'krBtn'].forEach(function (k) { N[k] = null; });
        if (!S.loaded) {
          N.load = h('button.btn.btn-acc', { type: 'button', onclick: load, disabled: S.busy ? '' : null }, icon('bank'), T('Загрузить выписки за октябрь', 'Load the October statements'));
          mainP.appendChild(h('div.recon-list', null,
            h('p.recon-empty', null, T('Выписки Mercury, Wise и Payoneer за месяц. Сервис разложит платежи сам, вам останутся только открытые.', 'Mercury, Wise and Payoneer statements for the month. The service sorts the payments itself, only the open ones are left for you.')),
            h('div', null, N.load),
            S.P.length ? S.P.map(row) : null));
          winMain.note('');
          S.flash = null;
          return;
        }
        if (S.tab === 'todo') {
          var open = S.P.filter(function (p) { return p.st === 'open'; });
          mainP.appendChild(filters('all'));
          mainP.appendChild(h('div.recon-list', null, open.length ? open.map(row) : h('p.recon-empty', null, T('Открытых платежей нет. Месяц можно закрывать.', 'No open payments. The month can be closed.'))));
        } else if (S.tab === 'done') {
          mainP.appendChild(h('div.recon-list', null, S.P.filter(function (p) { return p.st !== 'open'; }).map(row)));
        } else if (S.tab === 'attn') {
          mainP.appendChild(renderAttn());
        } else {
          mainP.appendChild(renderStaff());
        }
        winMain.note(T(openN() + ' открыто из ' + S.P.length, openN() + ' open of ' + S.P.length));
        S.flash = null;
      }

      function renderAttn() {
        var box = h('div.recon-list');
        if (!S.dup) {
          N.dupBtn = h('button.btn.btn-acc.btn-sm', { type: 'button', onclick: function () { solveDup(true); } }, icon('x'), T('Списали дважды: ждём возврат', 'Charged twice: refund expected'));
          box.appendChild(h('div.recon-row.open' + (S.flash === 'dup' ? '.hot' : ''), null,
            h('div.recon-r1', null, h('b', null, T('Два одинаковых платежа', 'Two identical payments')), h('span.recon-sum', null, amt(96))),
            h('div.recon-r2', null, h('span', null, 'Notion · Mercury · 07.10'), h('span.tg.tg-wait', null, T('двойное списание', 'double charge'))),
            h('div.recon-why', null, icon('warn'), h('span', null, T('Инвойс один, платежей два. Что это?', 'One invoice, two payments. What is it?'))),
            S.role === 'fin' ? h('div.recon-acts', null, N.dupBtn,
              h('button.btn.btn-sm', { type: 'button', onclick: function () { solveDup(false); } }, T('Оба верны, два места', 'Both are right, two seats'))) : null));
        }
        box.appendChild(h('div.recon-row', null,
          h('div.recon-r1', null, h('b', null, T('Цена подписки выросла', 'Subscription price went up')), h('span.recon-sum', null, '+20%')),
          h('div.recon-r2', null, h('span', null, 'Adobe · ' + T('3 месяца подряд 49,99, теперь 59,99', '3 months at 49.99, now 59.99'))),
          h('div.recon-why', null, icon('chart'), h('span', null, T('Сигнал из истории платежей, решает человек', 'A signal from payment history, a person decides')))));
        box.appendChild(h('div.recon-row', null,
          h('div.recon-r1', null, h('b', null, T('Ожидаемый платёж не пришёл', 'An expected payment did not arrive')), h('span.recon-sum', null, '—')),
          h('div.recon-r2', null, h('span', null, 'GitHub · ' + T('платили каждый месяц', 'paid every month')))));
        if (S.dup) box.appendChild(h('p.okl.in-pop', null, icon('check'), h('span', null, T('Двойное списание разобрано, причина записана у платежа', 'The double charge is handled, the reason is saved on the payment'))));
        return box;
      }

      function stLabel(e) {
        if (e.st === 'paid') return h('span.st.ok', null, T('выплачен, сверен', 'paid, matched'));
        if (e.st === 'sent') return h('span.st.info', null, T('отправлен, ждёт выплаты', 'submitted, awaiting payout'));
        return h('span.st.wait', null, T('черновик', 'draft'));
      }
      function renderStaff() {
        var box = h('div');
        var tb = h('tbody');
        S.E.forEach(function (e) {
          tb.appendChild(h('tr' + (S.flash === e.id ? '.in' : '') + (e.id === 'me' ? '.sel' : ''), null,
            h('td', null, h('b', null, e.name)),
            h('td.num', null, e.total == null ? '—' : amt(e.total)),
            h('td', null, e.via || '—'),
            h('td', null, stLabel(e)),
            h('td', null, e.st === 'draft' ? '—' : (S.role === 'fin' ? h('span.tg.tg-acc', null, 'PDF') : h('span.tg.tg-hum', null, T('нет доступа', 'no access'))))));
        });
        box.appendChild(h('div.recon-tw', null, h('div.sheet-w', null, h('table.sheet', null,
          h('thead', null, h('tr', null, h('th', null, T('Сотрудник', 'Employee')), h('th.num', null, T('Итог', 'Total')), h('th', null, T('Выплата', 'Payout')), h('th', null, T('Статус', 'Status')), h('th', null, 'PDF'))), tb))));
        var list = h('div.recon-list');
        var me = E('me');
        if (me.st === 'sent' && !S.kraken) {
          N.krBtn = h('button.btn.btn-acc', { type: 'button', onclick: loadKraken, disabled: S.busy || S.role !== 'fin' ? '' : null }, icon('bank'), T('Загрузить журнал Kraken', 'Load the Kraken log'));
          list.appendChild(h('div', null, N.krBtn));
        } else if (me.st === 'draft') {
          list.appendChild(h('p.recon-empty', null, T('Инвойс Анны ещё черновик. Выплату сверять не с чем.', 'Anna\'s invoice is still a draft. There is nothing to match a payout to.')));
        }
        if (S.kraken && !S.payout) {
          N.payBtn = h('button.btn.btn-ok.btn-sm', { type: 'button', onclick: function () { payout(true); } }, icon('check'), T('Это он', 'That is it'));
          list.appendChild(h('div.recon-row.open.hot', null,
            h('div.recon-r1', null, h('b', null, 'Kraken · Withdrawal USDT TRC-20'), h('span.recon-sum', null, amt(3222, 'USDT'))),
            h('div.recon-r2', null, h('span', null, '31.10'), h('span.tg.tg-acc', null, T('подбор', 'match'))),
            h('div.recon-why', null, icon('search'), h('span', null, T('Инвойс ' + ME.name + ' за октябрь на криптовыплату, сумма сходится ±1', ME.name + '\'s October invoice for a crypto payout, the amount matches ±1'))),
            S.role === 'fin' ? h('div.recon-acts', null, N.payBtn, h('button.btn.btn-sm', { type: 'button', onclick: function () { payout(false); } }, T('Не он', 'Not this one'))) : null));
        }
        if (S.payout) list.appendChild(h('p.okl.in-pop', null, icon('check'), h('span', null, T('Выплата закрыта: «зарплата, выплата сотруднику через Kraken». В тратах на подписки не считается.', 'Payout closed as "salary, staff payout via Kraken". It does not count as subscription spend.'))));
        if (list.childNodes.length) box.appendChild(list);
        return box;
      }

      /* ---------- employee window ---------- */
      function renderMe() {
        meP.innerHTML = '';
        N.rcpt = N.submit = N.usdt = null;
        var me = E('me'), sent = me.st !== 'draft';
        meP.appendChild(h('p.recon-who', null, T('Роль: сотрудник · ', 'Role: employee · ') + ME.name));
        var segM = ctx.seg(T('Выплата', 'Payout'), [['bank', T('Банковский счёт', 'Bank account')], ['usdt', 'USDT TRC-20']], S.method, function (v) { if (!sent) setMethod(v); });
        N.usdt = sent ? null : segM.btn('usdt');
        var lines = h('div', null,
          h('div.recon-line', null, h('span', null, 'Salary', h('small', null, T('оклад 3 000, с 15.10 3 300: 9 + 13 рабочих дней из 22', 'base 3,000, from 15.10 3,300: 9 + 13 of 22 working days'))), h('b', null, money(SAL))),
          h('div.recon-line', null, h('span', null, 'Vacation', h('small', null, T('остаток отпуска из HR-системы: 12 дней', 'vacation balance from the HR system: 12 days'))), h('b', null, '0,00')),
          S.rcpt
            ? h('div.recon-line' + (S.flash === 'rcpt' ? '.in-pop' : ''), null, h('span', null, 'Sport', h('small', null, T('чек: 180,00 PLN, 12.10 · курс NBP 0,2512', 'receipt: 180.00 PLN, 12.10 · NBP rate 0.2512'))), h('b', null, money(SPORT)))
            : h('div.recon-line', null, h('span', null, 'Sport', h('small', null, S.busyR ? T('читаю фото чека…', 'reading the receipt photo…') : T('нет чека', 'no receipt'))), h('b', null, '—')));
        meP.appendChild(h('div.recon-me', null, lines,
          h('div.recon-tot', null, h('span.recon-who', null, T('Итог', 'Total')), h('b', null, money(S.rcpt ? TOTAL : SAL) + ' USD')),
          segM));
        if (!sent) {
          N.rcpt = S.rcpt ? null : h('button.btn.btn-sm', { type: 'button', onclick: addReceipt, disabled: S.busyR ? '' : null }, icon('image'), T('Фото чека', 'Receipt photo'));
          N.submit = h('button.btn.btn-acc', { type: 'button', onclick: submit }, icon('send'), T('Отправить бухгалтеру', 'Send to the accountant'));
          meP.appendChild(h('div.recon-acts', { style: 'margin-top:10px' }, N.rcpt, N.submit));
          if (S.blocked && !S.rcpt) meP.appendChild(h('p.nol.in-pop', { style: 'margin-top:10px' }, icon('x'), h('span', null, T('Отправить нельзя: у расхода Sport нет чека', 'Cannot send: the Sport expense has no receipt'))));
        } else {
          meP.appendChild(h('div.recon-pdf' + (S.flash === 'pdf' ? '.in-pop' : ''), { style: 'margin-top:10px' }, icon('doc'),
            h('span', null, h('b', null, ME.file), h('br'), T('№ 14 · подпись · реквизиты ', 'No. 14 · signature · payout details ') + (S.method === 'usdt' ? 'USDT TRC-20' : T('счёта', 'bank account')))));
          meP.appendChild(h('p.okl', { style: 'margin-top:8px' }, icon('sheet'), h('span', null, T('Строка записана в сводную бухгалтерии', 'Row written to the accounting summary sheet'))));
          if (me.st === 'paid') meP.appendChild(h('p.okl.in-pop', { style: 'margin-top:6px' }, icon('check'), h('span', null, T('Выплата пришла и сверена финансами', 'The payout arrived and finance matched it'))));
        }
      }

      function render() { renderMain(); renderMe(); counts(); say(); }

      /* ---------- actions ---------- */
      function load() {
        if (S.loaded || S.busy) return;
        S.busy = true; S.tab = 'todo'; segTab.set('todo');
        var all = rows(), i = 0;
        log.add(tm(1), T('Выписки загружены: Mercury, Wise, Payoneer', 'Statements loaded: Mercury, Wise, Payoneer'));
        render();
        (function step() {
          if (i >= all.length) {
            S.busy = false; S.loaded = true;
            log.add(tm(1), T(autoN() + ' платежей закрыто само, ' + openN() + ' открыто, у каждого причина', autoN() + ' payments closed by themselves, ' + openN() + ' open, each with a reason'), 'sys');
            render(); hold(1500); ctx.focus(winMain);
            return;
          }
          var p = all[i++]; S.P.push(p); S.flash = p.id;
          if (p.st === 'auto') log.add(tm(1), p.raw + ': ' + p.why, 'sys');
          if (p.st === 'rule') log.add(tm(1), p.raw + ': ' + p.why, 'sys');
          render();
          ctx.later(step, 520);
        })();
      }
      function acceptFigma() {
        if (S.figma) return;
        S.figma = true;
        var a = P('fig1'), b = P('fig2');
        close(a, 'Figma', T('Вендор указан вами, инвойс FG-2210 на ту же сумму', 'Vendor set by you, invoice FG-2210 for the same amount'));
        log.add(tm(2), T('PAYPAL *FIGMA → Figma, написание запомнено', 'PAYPAL *FIGMA → Figma, spelling remembered'));
        render(); hold(1200);
        ctx.later(function () {
          b.st = 'auto'; b.vendor = 'Figma'; b.why = T('Вендор узнан по запомненному написанию, инвойс FG-2211', 'Vendor recognised by the remembered spelling, invoice FG-2211');
          S.flash = 'fig2';
          log.add(tm(1), T('Второй платёж PAYPAL *FIGMA узнан сам и сверен', 'The second PAYPAL *FIGMA payment was recognised and matched by itself'), 'sys');
          render(); hold(1400);
        }, 900);
      }
      function fromDrive() {
        if (S.drive || S.busy) return;
        S.busy = true;
        log.add(tm(2), T('Обновить из Drive: папка LumaAI', 'Refresh from Drive: LumaAI folder'));
        ctx.now(T('Сервис ищет новый PDF в папке вендора…', 'The service looks for a new PDF in the vendor folder…'));
        ctx.later(function () {
          log.add(tm(1), T('Найден LUMA-0931.pdf, прочитан автоматически: 300,00 USD, 14.10', 'Found LUMA-0931.pdf, read automatically: 300.00 USD, 14.10'), 'sys');
          ctx.later(function () {
            S.busy = false; S.drive = true;
            close(P('luma'), 'LumaAI', T('Инвойс LUMA-0931 из Drive, PDF прочитан сам, сумма сходится', 'Invoice LUMA-0931 from Drive, the PDF was read by itself, the amount matches'));
            S.mine--; render(); hold(1300);
          }, 800);
        }, 900);
      }
      function noInvoice(p) {
        close(p, null, T('Инвойс не нужен: закрыто вами, причина записана', 'No invoice needed: closed by you, reason saved'));
        log.add(tm(2), p.raw + T(': инвойс не нужен', ': no invoice needed'));
        render();
      }
      function solveDup(twice) {
        if (S.dup) return;
        S.dup = true;
        close(P('not2'), 'Notion', twice ? T('Двойное списание, ждём возврат', 'Double charge, refund expected') : T('Второе место, инвойс тот же', 'Second seat, same invoice'));
        log.add(tm(2), 'NOTION LABS: ' + (twice ? T('двойное списание, ждём возврат', 'double charge, refund expected') : T('оба платежа верны', 'both payments are right')));
        render(); hold(1500);
      }
      function setMethod(v) {
        S.method = v; log.add(tm(1), T('Сотрудник: выплата ', 'Employee: payout ') + (v === 'usdt' ? 'USDT TRC-20' : T('на банковский счёт', 'to a bank account')));
        render(); hold(900);
      }
      function addReceipt() {
        if (S.rcpt || S.busyR) return;
        S.busyR = true; render();
        ctx.later(function () {
          S.busyR = false; S.rcpt = true; S.flash = 'rcpt';
          log.add(tm(2), T('Чек прочитан: сумма 180,00 PLN и дата 12.10 вписаны сами, курс NBP на дату чека', 'Receipt read: 180.00 PLN and 12.10 filled in by themselves, NBP rate on the receipt date'), 'sys');
          render(); hold(1200); ctx.focus(winMe);
        }, 1300);
      }
      function submit() {
        var me = E('me');
        if (me.st !== 'draft') return;
        if (!S.rcpt) {
          S.blocked = true;
          log.add(tm(1), T('Отправка остановлена: у расхода нет чека', 'Sending stopped: an expense has no receipt'), 'warn');
          render(); hold(1500); return;
        }
        me.st = 'sent'; me.total = TOTAL; me.via = S.method === 'usdt' ? 'USDT' : T('счёт', 'bank');
        S.flash = 'pdf';
        log.add(tm(2), T('Инвойс отправлен бухгалтеру: № 14, PDF с подписью', 'Invoice sent to the accountant: No. 14, signed PDF'));
        log.add(tm(1), T('Строка Анны записана в сводную за октябрь', 'Anna\'s row written to the October summary sheet'), 'sys');
        render(); hold(1500); ctx.focus(winMe);
      }
      function loadKraken() {
        if (S.kraken || S.busy) return;
        S.busy = true; render();
        ctx.later(function () {
          S.busy = false; S.kraken = true;
          S.P.push({ id: 'kr', src: 'Kraken', raw: 'Withdrawal USDT TRC-20', sum: 3222, st: 'open', k: 'kraken' });
          log.add(tm(2), T('Журнал Kraken: вывод 3 222 USDT, подобран инвойс сотрудника', 'Kraken log: 3,222 USDT withdrawal, an employee invoice matched'), 'sys');
          render(); hold(1300); ctx.focus(winMain);
        }, 1100);
      }
      function payout(yes) {
        if (S.payout) return;
        if (!yes) { log.add(tm(1), T('«Не он»: подбор снят, платёж остался открытым', '"Not this one": the match is dropped, the payment stays open'), 'warn'); hold(800); return; }
        S.payout = true;
        var p = P('kr'); p.st = 'you'; p.vendor = ME.name; p.why = T('Выплата сотруднику через Kraken, инвойс за 10.2026', 'Staff payout via Kraken, invoice for 10.2026'); S.mine++;
        E('me').st = 'paid'; S.flash = 'me';
        log.add(tm(2), T('Финансы: «Это он». Выплата Анне сверена', 'Finance: "That is it". Anna\'s payout matched'));
        render(); hold(1500);
      }
      function setTab(v) {
        if (!S.loaded) { segTab.set(S.tab); return; }
        S.tab = v; segTab.set(v);
        if (v === 'attn') S.dupSeen = true;
        render(); hold(900);
      }
      function setRole(v) {
        S.role = v; segRole.set(v);
        if (v === 'none') S.blurSeen = true;
        log.add(tm(1), v === 'none' ? T('Вход без роли «финансы»: суммы скрыты, PDF не показывается', 'Signed in without the finance role: amounts hidden, PDFs not shown') : T('Вход с ролью «финансы»', 'Signed in with the finance role'), v === 'none' ? 'warn' : null);
        render(); hold(1500);
        if (v === 'none' && S.payout && !S.ended) {
          S.ended = true;
          ctx.end(T('<b>Месяц закрыт: каждый платёж сверен или закрыт с причиной.</b> Сотрудник сам заполнил инвойс, финансы подтвердили выплату одной кнопкой.', '<b>The month is closed: every payment is matched or closed with a reason.</b> The employee filled in the invoice, finance confirmed the payout with one button.'));
        }
      }

      /* ---------- hint line ---------- */
      function say() {
        if (S.busy) return;
        if (!S.loaded) { ctx.now(T('Финансы. Нажмите <b>«Загрузить выписки за октябрь»</b>.', 'Finance. Press <b>"Load the October statements"</b>.')); return; }
        if (!S.figma) { ctx.now(T('Открыто ' + openN() + '. У Figma подсказка: нажмите <b>«Да, это Figma»</b>, второй её платёж узнается сам.', openN() + ' open. Figma has a suggestion: press <b>"Yes, it is Figma"</b>, its second payment gets recognised by itself.')); return; }
        if (!S.drive) { ctx.now(T('У LumaAI нет инвойса в папке. Нажмите <b>«Обновить из Drive»</b>.', 'LumaAI has no invoice in its folder. Press <b>"Refresh from Drive"</b>.')); return; }
        if (!S.dup) { ctx.now(T('Откройте <b>«Обратите внимание»</b> и решите, что с двумя платежами Notion.', 'Open <b>"Heads up"</b> and decide on the two Notion payments.')); return; }
        if (E('me').st === 'draft') {
          if (!S.blocked) { ctx.now(T('Теперь сотрудник справа. Попробуйте <b>«Отправить бухгалтеру»</b> без чека.', 'Now the employee on the right. Try <b>"Send to the accountant"</b> without a receipt.')); return; }
          if (!S.rcpt) { ctx.now(T('Нажмите <b>«Фото чека»</b>: сумма и дата впишутся сами.', 'Press <b>"Receipt photo"</b>: the amount and date fill in by themselves.')); return; }
          if (S.method !== 'usdt') { ctx.now(T('Выберите выплату <b>USDT TRC-20</b> и отправьте инвойс.', 'Pick the <b>USDT TRC-20</b> payout and send the invoice.')); return; }
          ctx.now(T('Нажмите <b>«Отправить бухгалтеру»</b>.', 'Press <b>"Send to the accountant"</b>.')); return;
        }
        if (!S.payout) {
          if (S.tab !== 'staff') { ctx.now(T('Финансы: откройте <b>«Выплаты сотрудникам»</b>.', 'Finance: open <b>"Staff payouts"</b>.')); return; }
          if (!S.kraken) { ctx.now(T('Нажмите <b>«Загрузить журнал Kraken»</b>: выплата найдёт инвойс сама.', 'Press <b>"Load the Kraken log"</b>: the payout finds the invoice itself.')); return; }
          ctx.now(T('Сумма сходится. Нажмите <b>«Это он»</b>.', 'The amount matches. Press <b>"That is it"</b>.')); return;
        }
        if (S.role === 'fin') { ctx.now(T('Посмотрите, что видит коллега <b>без роли «финансы»</b>.', 'See what a colleague <b>without the finance role</b> sees.')); return; }
        ctx.now(T('Без роли «финансы» суммы скрыты, PDF не открывается. Верните роль переключателем.', 'Without the finance role amounts are hidden and PDFs do not open. Switch the role back.'));
      }

      function start() {
        ctx.clearTimers();
        S = fresh(); clock = 0; N = {};
        segRole.set('fin'); segTab.set('todo');
        log.clear();
        cnt.set('open', '—'); cnt.set('auto', '—'); cnt.set('you', '0'); cnt.set('paid', '1');
        ctx.end(null);
        render();
      }
      start();

      return {
        reset: function () { start(); },
        next: function () {
          if (S.busy || S.busyR || S.hold) return 'wait';
          if (!S.loaded) return N.load;
          if (!S.figma) { if (S.tab !== 'todo') return segTab.btn('todo'); return N.fig_fig1; }
          if (!S.drive) { if (S.tab !== 'todo') return segTab.btn('todo'); return N.drive; }
          if (!S.dup) { if (S.tab !== 'attn') return segTab.btn('attn'); return N.dupBtn; }
          var me = E('me');
          if (me.st === 'draft') {
            if (!S.blocked) return N.submit;
            if (!S.rcpt) return N.rcpt;
            if (S.method !== 'usdt') return N.usdt;
            return N.submit;
          }
          if (!S.payout) {
            if (S.tab !== 'staff') return segTab.btn('staff');
            if (!S.kraken) return N.krBtn;
            return N.payBtn;
          }
          if (S.role === 'fin') return segRole.btn('none');
          return null;
        }
      };
    }
  });
})();
