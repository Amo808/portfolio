/* Mini app: automatic chargeback defence. A dispute arrives by webhook, the system assembles the evidence package
   and writes the response, a person only decides in Slack.
   Built after apps/support.js: state object S, a base render per scenario, small incremental updates while it runs. */
(function () {
  'use strict';

  var CSS = [
    '.disputes-case button[disabled]{opacity:.38;cursor:default}',
    '.disputes-case button[disabled]:hover{color:var(--ink2)}',
    '.disputes-fire{display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center}',
    '.disputes-hook{display:grid;gap:3px;min-width:0;padding:4px 8px;border-radius:8px;font:500 11px/1.3 var(--fm);letter-spacing:.05em;text-transform:uppercase;color:var(--ink3)}',
    '.disputes-hook b{font:500 12.5px/1.3 var(--fm);letter-spacing:0;text-transform:none;color:var(--ink2);overflow-wrap:anywhere}',
    '.disputes-empty{display:grid;justify-items:center;align-content:center;gap:8px;min-height:120px;padding:16px;border:1px dashed var(--line);border-radius:12px;text-align:center;font-size:13.5px;line-height:1.45;color:var(--ink3)}',
    '.disputes-empty.tall{min-height:200px}',
    '.disputes-empty svg{width:20px;height:20px}',
    '.disputes-empty p{max-width:36ch}',
    '.disputes-id{font:500 12px/1.3 var(--fm);color:var(--ink3);margin-bottom:8px;overflow-wrap:anywhere}',
    '.disputes-top{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px 10px;margin-bottom:8px}',
    '.disputes-sum{font:700 24px/1.1 var(--fm);letter-spacing:-.02em}',
    '.disputes-rows{display:grid;gap:5px;margin-bottom:8px}',
    '.disputes-row{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:10px;align-items:center;padding:7px 10px;border-radius:9px;background:var(--bg2);font:500 12.5px/1.3 var(--fm);color:var(--ink2)}',
    '.disputes-row b{font-weight:700;color:var(--ink)}',
    '.disputes-merge{display:flex;gap:8px;align-items:center;margin-bottom:8px;padding:8px 10px;border-radius:10px;background:var(--acc-soft);color:var(--acc-ink);font-size:13.5px;font-weight:600;line-height:1.35}',
    '.disputes-merge svg{width:16px;height:16px;flex:none}',
    '.disputes-resp{padding:12px 14px;border-top:1px solid var(--line)}',
    '.disputes-resp-t{font-size:13.5px;line-height:1.5;color:var(--ink3)}',
    '.disputes-resp-t.on{font-size:14.5px;color:var(--ink)}',
    '.disputes-mh{display:flex;align-items:center;gap:8px;margin-bottom:8px;font-size:14px;line-height:1.2}',
    '.disputes-av{width:28px;height:28px;border-radius:8px;background:var(--acc-soft);color:var(--acc-ink);display:grid;place-items:center;flex:none}',
    '.disputes-av svg{width:16px;height:16px}',
    '.disputes-app{font:500 10px/1 var(--fm);letter-spacing:.06em;padding:3px 5px;border-radius:4px;background:var(--bg2);color:var(--ink3)}',
    '.disputes-mh time{margin-left:auto;font:500 12px/1 var(--fm);color:var(--ink3)}',
    '.disputes-msg .kv{margin-top:6px}',
    '.disputes-msg .kv>div{padding:6px 0}',
    '.disputes-quote{margin-top:6px;padding-left:10px;border-left:3px solid var(--line);font-size:13.5px;line-height:1.45;color:var(--ink2);display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;line-clamp:2;overflow:hidden}',
    '.disputes-pack{margin-top:8px;padding:10px 12px;border-radius:10px;background:var(--bg2);font-size:13.5px;line-height:1.5;color:var(--ink2)}',
    '.disputes-files{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px}',
    '.disputes-files .tag{font-size:11px;padding:5px 7px}',
    '.disputes-btns .btn{flex:1 1 auto;font-size:13.5px;padding:8px 12px;min-height:40px}',
    '.disputes-out{margin-top:12px}',
    '.disputes-modal{min-width:0;padding:12px 14px;border:1px solid var(--acc);border-radius:14px;background:var(--card);box-shadow:0 0 0 3px var(--acc-soft)}',
    '.disputes-modal-h{display:flex;align-items:center;gap:8px;font-size:14.5px;line-height:1.3}',
    '.disputes-modal-h svg{width:16px;height:16px;color:var(--acc-ink);flex:none}',
    '.disputes-modal-h small{margin-left:auto;font:500 11px/1.3 var(--fm);letter-spacing:.05em;text-transform:uppercase;color:var(--ink3);text-align:right}',
    '.disputes-modal-p{margin-top:6px;font-size:13px;line-height:1.4;color:var(--ink3)}',
    '.disputes-opts{display:grid;gap:6px;margin-top:10px}',
    '.disputes-opt{display:flex;align-items:center;gap:10px;width:100%;min-height:42px;padding:9px 12px;border:1px solid var(--line);border-radius:10px;background:var(--bg);color:var(--ink2);font:500 14px/1.3 var(--fb);text-align:left;cursor:pointer;transition:border-color .2s ease,background-color .2s ease,color .2s ease}',
    '.disputes-opt i{width:16px;height:16px;border-radius:50%;border:1.5px solid var(--ink3);flex:none;display:grid;place-items:center}',
    '.disputes-opt[aria-checked="true"]{border-color:var(--ink3);background:var(--bg2);color:var(--ink)}',
    '.disputes-opt[aria-checked="true"] i{border-color:var(--acc)}',
    '.disputes-opt[aria-checked="true"] i::after{content:"";width:8px;height:8px;border-radius:50%;background:var(--acc)}',
    '@media (hover:hover) and (pointer:fine){.disputes-opt:hover{border-color:var(--ink3)}}',
    '@media (max-width:900px){.disputes-empty,.disputes-empty.tall{min-height:0}}',
    '@media (max-width:640px){.disputes-fire .btn{flex:1 1 100%}}'
  ].join('');

  PF.app('disputes', {
    cap: [
      'Макет на выдуманных данных. В настоящей системе такой же пакет собирается из Stripe или PayPal, почтового ящика и хелпдеска, а человек только подтверждает в Slack.',
      'A mock on invented data. In the real system the same package is assembled from Stripe or PayPal, the mailbox and the helpdesk, and a person only confirms in Slack.'
    ],
    pace: 900,
    mount: function (ctx) {
      var T = ctx.T, h = ctx.h, icon = ctx.icon;
      if (!document.getElementById('pf-disputes-css')) document.head.appendChild(h('style', { id: 'pf-disputes-css', text: CSS }));

      /* ---------- scenarios: every amount, date and address here is invented ---------- */
      var REASON = T('не узнаю платёж', 'unrecognised charge');
      var PLAN = T('Фото-приложение · Monthly', 'Photo app · Monthly');
      var PDF_LOG = T('Переписка из хелпдеска сохранена в PDF', 'Helpdesk conversation saved as a PDF');
      var SC = {
        'stripe/one': {
          sys: 'Stripe', hook: 'charge.dispute.created', cust: 'k***@gmail.com',
          rows: [['dp_…4f2K', T('14.11', '14 Nov')]],
          due: T('ответить до 02.12', 'respond by 2 Dec'),
          docs: [1, 1, 1, 1], add: [2, 2, 3, 1], addText: 1,
          ex: [
            T('приняты <b>14.07 в 21:07</b> · Monthly $29.99 · автопродление', 'accepted on <b>14 Jul at 21:07</b> · Monthly $29.99 · auto-renewal'),
            T('чек на <b>$29.99</b> отправлен 14.11 на k***@gmail.com', 'receipt for <b>$29.99</b> emailed on 14 Nov to k***@gmail.com'),
            T('<b>support-thread.pdf</b> · 2 стр. · клиент писал 02.10, об отмене не просил', '<b>support-thread.pdf</b> · 2 pages · the customer wrote on 2 Oct and did not ask to cancel'),
            T('<b>4 успешных списания</b> до спора: 14.07, 14.08, 14.09, 14.10', '<b>4 successful charges</b> before the dispute: 14 Jul, 14 Aug, 14 Sep, 14 Oct')
          ],
          lg: [
            T('Условия подписки найдены: клиент принял их 14.07', 'Subscription terms found: the customer accepted them on 14 Jul'),
            T('Чек найден в почтовом ящике: отправлен 14.11', 'Receipt found in the mailbox: emailed on 14 Nov'),
            PDF_LOG,
            T('История продлений из Stripe: 4 успешных списания до спора', 'Renewal history from Stripe: 4 successful charges before the dispute')
          ],
          files: ['terms.pdf', 'receipt-14-11.pdf', 'support-thread.pdf', 'renewals.pdf'],
          text: 'We are contesting this dispute. The customer subscribed on 14 July and accepted the subscription terms at checkout, including monthly auto-renewal at $29.99. A receipt for the disputed charge was emailed on 14 November. Four earlier charges were paid without complaints. On 2 October the customer wrote to our support and did not ask to cancel.'
        },
        'stripe/wave': {
          sys: 'Stripe', hook: 'charge.dispute.created', cust: 'r***@icloud.com',
          rows: [['dp_…4f2K', T('14.08', '14 Aug')], ['dp_…9aQ1', T('14.09', '14 Sep')], ['dp_…c7Wd', T('14.10', '14 Oct')], ['dp_…e0Zt', T('14.11', '14 Nov')]],
          due: T('ответить до 02.12', 'respond by 2 Dec'),
          docs: [1, 4, 1, 1], add: [2, 3, 3, 1], addText: 2,
          ex: [
            T('приняты <b>14.06 в 09:32</b> · Monthly $29.99 · автопродление', 'accepted on <b>14 Jun at 09:32</b> · Monthly $29.99 · auto-renewal'),
            T('<b>4 чека по $29.99</b>: 14.08, 14.09, 14.10, 14.11 · на r***@icloud.com', '<b>4 receipts of $29.99</b>: 14 Aug, 14 Sep, 14 Oct, 14 Nov · to r***@icloud.com'),
            T('<b>support-thread.pdf</b> · 3 стр. · клиент писал 20.09, об отмене не просил', '<b>support-thread.pdf</b> · 3 pages · the customer wrote on 20 Sep and did not ask to cancel'),
            T('<b>6 списаний</b> с 14.06 · оспорены 4 последних, первые 2 прошли без жалоб', '<b>6 charges</b> since 14 Jun · the last 4 are disputed, the first 2 had no complaints')
          ],
          lg: [
            T('Условия подписки найдены: клиент принял их 14.06', 'Subscription terms found: the customer accepted them on 14 Jun'),
            T('В почтовом ящике найдены 4 чека, по одному на каждое списание', '4 receipts found in the mailbox, one per charge'),
            PDF_LOG,
            T('История продлений из Stripe: 6 списаний, оспорены 4 последних', 'Renewal history from Stripe: 6 charges, the last 4 are disputed')
          ],
          files: ['terms.pdf', 'receipt-14-08.pdf', 'receipt-14-09.pdf', 'receipt-14-10.pdf', 'receipt-14-11.pdf', 'support-thread.pdf', 'renewals.pdf'],
          text: 'We are contesting these four disputes together. The customer subscribed on 14 June and accepted the subscription terms at checkout, including monthly auto-renewal at $29.99. A receipt was emailed after each of the four disputed charges. Two earlier charges were paid without complaints. On 20 September the customer wrote to our support and did not ask to cancel.'
        },
        'paypal/one': {
          sys: 'PayPal', hook: 'CUSTOMER.DISPUTE.CREATED', cust: 'm***@yahoo.com',
          rows: [['PP-D-…7803', T('12.11', '12 Nov')]],
          due: T('ответить до 01.12', 'respond by 1 Dec'),
          docs: [1, 1, 1, 1], add: [2, 3, 3, 1], addText: 2,
          ex: [
            T('приняты <b>12.08 в 18:44</b> · Monthly $29.99 · автопродление', 'accepted on <b>12 Aug at 18:44</b> · Monthly $29.99 · auto-renewal'),
            T('чек на <b>$29.99</b> отправлен 12.11 на m***@yahoo.com', 'receipt for <b>$29.99</b> emailed on 12 Nov to m***@yahoo.com'),
            T('<b>support-thread.pdf</b> · 1 стр. · клиент писал 30.10, об отмене не просил', '<b>support-thread.pdf</b> · 1 page · the customer wrote on 30 Oct and did not ask to cancel'),
            T('<b>3 успешных списания</b> до спора: 12.08, 12.09, 12.10', '<b>3 successful payments</b> before the dispute: 12 Aug, 12 Sep, 12 Oct')
          ],
          lg: [
            T('Условия подписки найдены: клиент принял их 12.08', 'Subscription terms found: the customer accepted them on 12 Aug'),
            T('Чек найден в почтовом ящике: отправлен 12.11', 'Receipt found in the mailbox: emailed on 12 Nov'),
            PDF_LOG,
            T('История продлений из PayPal: 3 успешных списания до спора', 'Renewal history from PayPal: 3 successful payments before the dispute')
          ],
          files: ['terms.pdf', 'receipt-12-11.pdf', 'support-thread.pdf', 'renewals.pdf'],
          text: 'We are contesting this case. The buyer subscribed on 12 August and accepted the subscription terms at checkout, including monthly auto-renewal at $29.99. A receipt for the disputed payment was emailed on 12 November. Three earlier payments went through without complaints. On 30 October the buyer wrote to our support and did not ask to cancel.'
        }
      };
      /* prepared scenarios the person picks from in the PayPal modal */
      var SCN = [
        T('Подписка активна и использовалась', 'Subscription active and used'),
        T('Услуга оказана', 'Service delivered'),
        T('Возврат уже сделан', 'Already refunded')
      ];
      var EV = [
        [T('Условия подписки', 'Subscription terms'), T('принятые при покупке: цена и автопродление', 'accepted at purchase: the price and auto-renewal')],
        [T('Чек', 'Receipt'), T('отправленный клиенту на почту', 'emailed to the customer')],
        [T('Переписка с поддержкой', 'Support conversation'), T('весь диалог из хелпдеска одним PDF', 'the whole helpdesk thread as one PDF')],
        [T('История продлений', 'Renewal history'), T('все списания по этой подписке', 'every charge of this subscription')]
      ];
      var TOUR = [['stripe', 'one', 'submit'], ['stripe', 'wave', 'submit'], ['paypal', 'one', 'submit'], ['paypal', 'one', 'skip']];
      var HOLD = 2600; /* autoplay leaves the outcome on screen this long before the next scenario */
      var S, seen = {}, ui = {}, stepNodes = [], clock = 0;
      function fresh(sys, kase) { return { sys: sys || 'stripe', kase: kase || 'one', phase: 'idle', secs: 0, docs: 0, clicks: 0, scen: 0, open: false, hold: false }; }
      function cur() { return SC[S.sys + '/' + S.kase]; }
      function usd(n) { return '$' + (29.99 * n).toFixed(2); }
      function kv(k, v) { return h('div', null, h('dt', null, k), h('dd', null, v)); }
      function empty(ic, text, tall) { return h('div.disputes-empty' + (tall ? '.tall' : ''), null, icon(ic), h('p', null, text)); }

      /* ---------- static frame ---------- */
      var segSys = ctx.seg(T('Платёжная система', 'Payment system'), [['stripe', 'Stripe'], ['paypal', 'PayPal']], 'stripe', function (v) { start(v, v === 'paypal' ? 'one' : S.kase); });
      var segCase = ctx.seg(T('Случай', 'Case'), [
        ['one', T('Один спор', 'One dispute')],
        ['wave', T('Волна: 4 спора одного клиента', 'A wave: 4 disputes from one customer')]
      ], 'one', function (v) { start(S.sys, v); });
      segCase.classList.add('disputes-case');
      var waveBtn = segCase.btn('wave');
      ctx.bar.appendChild(segSys);
      ctx.bar.appendChild(segCase);

      var arriveBtn = h('button.btn.btn-acc', { type: 'button', onclick: arrive }, icon('bolt'), T('Пришёл спор', 'Dispute arrives'));
      var hookSys = h('span'), hookEv = h('b');
      var hookEl = h('span.disputes-hook', null, hookSys, hookEv);
      var dispSlot = h('div');
      var dispBody = h('div.feed', null, h('div.disputes-fire', null, arriveBtn, hookEl), dispSlot);
      var slackBody = h('div.feed');
      var stepsEl = h('ol.steps');
      var respLbl = h('p.bc-to'), respP = h('p.disputes-resp-t');
      var respBox = h('div.disputes-resp', null, respLbl, respP);
      var log = ctx.logger(T('Пока пусто. Сюда попадёт каждый шаг системы и каждое решение человека.', 'Empty for now. Every step of the system and every human decision lands here.'), T('система', 'system'));
      var cnt = ctx.counters([
        ['secs', T('секунд на сбор', 'seconds to assemble'), '—'],
        ['docs', T('документов в пакете', 'documents in the package')],
        ['clicks', T('кликов человека', 'human clicks')],
        ['disp', T('споров в пакете', 'disputes in the package')]
      ]);
      var winDisp = ctx.win('warn', T('Споры', 'Disputes'), T('в настоящей системе 100+ в день', '100+ a day in the real system'), dispBody);
      var winSlack = ctx.win('hash', 'Slack · #disputes', '', slackBody);
      var winEv = ctx.win('doc', T('Пакет доказательств', 'Evidence package'), '', stepsEl, respBox);
      var winLog = ctx.win('log', T('Журнал спора', 'Dispute log'), T('время условное', 'time is illustrative'), log.el, cnt.el);
      winDisp.classList.add('o1'); winEv.classList.add('o2'); winSlack.classList.add('o3'); winLog.classList.add('o4');
      ctx.body.appendChild(h('div.demo-grid.flow', null,
        h('div.demo-col', null, winDisp, winSlack),
        h('div.demo-col', null, winEv, winLog)));

      /* ---------- render of a fresh scenario ---------- */
      function base() {
        var c = cur(), pp = S.sys === 'paypal', wave = S.kase === 'wave';
        segSys.set(S.sys); segCase.set(S.kase);
        waveBtn.disabled = pp;
        if (pp) waveBtn.setAttribute('title', T('Волна показана для Stripe', 'The wave is shown for Stripe')); else waveBtn.removeAttribute('title');
        ui = {};

        arriveBtn.disabled = false; arriveBtn.lastChild.textContent = T('Пришёл спор', 'Dispute arrives');
        hookSys.textContent = T('вебхук ', 'webhook ') + c.sys + (wave ? ' × 4' : '');
        hookEv.textContent = c.hook;
        hookEl.classList.remove('flash');
        dispSlot.innerHTML = '';
        dispSlot.appendChild(empty('inbox', T('Новых споров нет. Спор появится здесь, как только ' + c.sys + ' пришлёт вебхук.', 'No new disputes. A dispute shows up here as soon as ' + c.sys + ' sends the webhook.')));

        slackBody.innerHTML = '';
        slackBody.appendChild(empty('chat', T('В канале тихо. Бот напишет сюда, когда пакет будет готов.', 'The channel is quiet. The bot posts here once the package is ready.'), true));
        winSlack.note('');

        stepsEl.innerHTML = '';
        stepNodes = EV.map(function (a, i) {
          var o = h('div.o');
          var st = h('span.tg.tg-hum', null, T('ждёт', 'waiting'));
          var li = h('li.stp.idle', null, h('span.n', null, String(i + 1)), h('div', null, h('div.t', null, a[0]), h('div.d', null, a[1])), st, o);
          stepsEl.appendChild(li);
          return { li: li, o: o, st: st };
        });
        winEv.note(T('0 из 4', '0 of 4'));
        respLbl.textContent = pp ? T('Текст ответа в PayPal', 'Response to PayPal') : T('Текст ответа банку', 'Response to the bank');
        respP.className = 'disputes-resp-t';
        respP.textContent = T('Система напишет его сама, когда соберёт все четыре доказательства.', 'The system writes it by itself once all four pieces of evidence are collected.');

        log.clear();
        cnt.set('secs', '—'); cnt.set('docs', '0'); cnt.set('clicks', '0'); cnt.set('disp', '0');
        ctx.end(null);
        ctx.now(pp ? T('Спор придёт из PayPal. Нажмите <b>«Пришёл спор»</b>. Волна показана для Stripe, здесь спор один.', 'The dispute will come from PayPal. Press <b>"Dispute arrives"</b>. The wave is shown for Stripe, here it is a single dispute.')
          : wave ? T('Один клиент оспорил четыре списания подряд. Нажмите <b>«Пришёл спор»</b> и смотрите, что система сделает с волной.', 'One customer has disputed four charges in a row. Press <b>"Dispute arrives"</b> and watch what the system does with the wave.')
          : T('Клиент пожаловался в банк на списание. Нажмите <b>«Пришёл спор»</b>: дальше система работает сама.', 'A customer has disputed a charge with the bank. Press <b>"Dispute arrives"</b>: after that the system works by itself.'));
      }

      function start(sys, kase) {
        ctx.clearTimers();
        S = fresh(sys, kase);
        base();
      }

      /* ---------- small helpers for the run ---------- */
      function tm(add) { clock += add; var m = 20 + Math.floor(clock / 60), s = clock % 60; return '14:' + m + ':' + (s < 10 ? '0' : '') + s; }
      /* the same step forward on the assembly stopwatch and on the log clock */
      function tick(add) { S.secs += add; cnt.set('secs', String(S.secs)); return tm(add); }
      /* runs [[delay, fn], ...] one after another, so the order survives reduced motion */
      function seq(list) {
        var i = 0;
        (function go() {
          if (i >= list.length) return;
          var s = list[i++];
          ctx.later(function () { s[1](); go(); }, s[0]);
        })();
      }
      function step(i, state, html) {
        var n = stepNodes[i];
        n.li.className = 'stp ' + state;
        n.st.className = 'tg ' + (state === 'run' ? 'tg-acc' : state === 'done' ? 'tg-ok' : 'tg-hum');
        n.st.textContent = state === 'run' ? T('собираю', 'collecting') : state === 'done' ? T('готово', 'done') : T('ждёт', 'waiting');
        if (html != null) { n.o.innerHTML = html; n.o.classList.add('in-pop'); }
      }
      function setTag(cls, text) { ui.tag.className = 'tg tg-' + cls; ui.tag.textContent = text; }
      function docsWord(n) { return T(n < 5 ? ' документа' : ' документов', ' documents'); }
      function click() { S.clicks++; cnt.set('clicks', String(S.clicks)); }
      function humanTime() { return tm(S.clicks === 1 ? 41 : 7); }

      /* ---------- the dispute card ---------- */
      function card(c) {
        var wave = S.kase === 'wave', pp = S.sys === 'paypal';
        ui.tag = h('span.tg.tg-bad', null, T('новый спор', 'new dispute'));
        ui.sum = h('span.disputes-sum', null, usd(1));
        ui.rows = wave ? h('div.disputes-rows') : null;
        ui.merge = wave ? h('p.disputes-merge', { hidden: true }, icon('link'), T('Один клиент: 4 спора объединены в один пакет', 'One customer: 4 disputes merged into one package')) : null;
        ui.card = h('div.bc.mine.in-pop', null,
          h('p.disputes-id', null, c.sys + ' · ' + (wave ? T('споры одного клиента', 'disputes from one customer') : c.rows[0][0])),
          h('div.disputes-top', null, ui.sum, ui.tag),
          ui.rows, ui.merge,
          h('dl.kv', null,
            kv(T('Причина от ', 'Reason from ') + (pp ? 'PayPal' : T('банка', 'the bank')), REASON),
            kv(T('Клиент', 'Customer'), c.cust),
            kv(T('Подписка', 'Subscription'), PLAN),
            wave ? null : kv(T('Списание', 'Charge'), c.rows[0][1]),
            kv(T('Срок', 'Deadline'), h('span.st.wait', null, c.due))));
        dispSlot.innerHTML = '';
        dispSlot.appendChild(ui.card);
        if (wave) addRow(0); else cnt.set('disp', '1');
      }
      function addRow(i) {
        var r = cur().rows[i];
        ui.rows.appendChild(h('div.disputes-row.in-pop', null, h('span', null, r[0]), h('span', null, T('списание ', 'charge of ') + r[1]), h('b', null, usd(1))));
        ui.sum.textContent = usd(i + 1);
        cnt.set('disp', String(i + 1));
      }

      /* ---------- the run: webhook, four pieces of evidence, the response text ---------- */
      function arrive() {
        if (S.phase === 'run' || S.phase === 'send') return;
        if (S.phase !== 'idle') start(S.sys, S.kase);
        run();
      }

      function run() {
        var c = cur(), wave = S.kase === 'wave', list = [];
        S.phase = 'run'; clock = 3;
        arriveBtn.disabled = true;
        hookEl.classList.remove('flash'); void hookEl.offsetWidth; hookEl.classList.add('flash');
        ctx.now(T('Система собирает пакет сама: четыре доказательства и текст ответа. Человек пока не нужен.', 'The system is assembling the package by itself: four pieces of evidence and the response text. No human is needed yet.'));
        card(c);
        cnt.set('secs', '0');
        log.add(tm(0), wave
          ? T('Вебхук от Stripe: спор на $29.99, клиент ', 'Webhook from Stripe: a dispute for $29.99, customer ') + c.cust
          : T('Вебхук от ' + c.sys + ': спор на $29.99, причина «' + REASON + '»', 'Webhook from ' + c.sys + ': a dispute for $29.99, reason "' + REASON + '"'), 'sys');

        if (wave) {
          [1, 2, 3].forEach(function (i) {
            list.push([450, function () {
              addRow(i);
              if (i === 3) log.add(tick(1), T('Ещё 3 спора от того же клиента, всего 4 на ', '3 more disputes from the same customer, 4 in total for ') + usd(4), 'sys');
            }]);
          });
          list.push([600, function () {
            ui.merge.hidden = false; ui.merge.classList.add('in-pop');
            log.add(tick(2), T('Один клиент: четыре спора объединены в один пакет', 'One customer: four disputes merged into one package'), 'sys');
          }]);
        }
        list.push([1000, function () {
          setTag('acc', T('собираю пакет', 'assembling'));
          step(0, 'run'); ctx.focus(stepNodes[0].li);
        }]);
        [0, 1, 2, 3].forEach(function (i) {
          list.push([i === 2 ? 1100 : 900, function () {
            S.docs += c.docs[i];
            step(i, 'done', c.ex[i]);
            cnt.set('docs', String(S.docs));
            winEv.note((i + 1) + T(' из 4', ' of 4'));
            log.add(tick(c.add[i]), c.lg[i], 'sys');
            if (i < 3) { step(i + 1, 'run'); ctx.focus(stepNodes[i + 1].li); } else write();
          }]);
        });
        seq(list);
      }

      function write() {
        var c = cur();
        respP.className = 'disputes-resp-t on';
        winEv.note(T('4 из 4 · пишу ответ', '4 of 4 · writing the response'));
        ctx.focus(respBox);
        ctx.type(respP, c.text, function () {
          ctx.later(function () {
            var t = tick(c.addText);
            winEv.note(T('4 из 4 · пакет готов', '4 of 4 · package ready'));
            log.add(t, T('Текст ответа написан, пакет собран за ', 'Response written, package assembled in ') + S.secs + T(' секунд', ' seconds'), 'sys');
            ctx.later(post, 600);
          }, 400);
        });
      }

      /* ---------- Slack: the bot posts the package, the person decides ---------- */
      function readyNow() {
        ctx.now(S.sys === 'paypal'
          ? T('Ваш ход: вы менеджер в Slack. Нажмите <b>«Отправить»</b>, для PayPal откроется окно со сценариями. Или решите <b>«Не оспаривать»</b>.', 'Your turn: you are the manager in Slack. Press <b>"Submit"</b>, for PayPal a modal with scenarios opens. Or decide <b>"Do not contest"</b>.')
          : T('Ваш ход: вы менеджер в Slack. Нажмите <b>«Отправить»</b> или решите <b>«Не оспаривать»</b>.', 'Your turn: you are the manager in Slack. Press <b>"Submit"</b> or decide <b>"Do not contest"</b>.'));
      }

      function post() {
        var c = cur(), wave = S.kase === 'wave';
        ui.submit = h('button.btn.btn-ok', { type: 'button', onclick: submit }, icon('send'), T('Отправить', 'Submit'));
        ui.open = h('button.btn', { type: 'button', 'aria-expanded': 'false', onclick: toggle }, T('Открыть пакет', 'Open package'));
        ui.skip = h('button.btn', { type: 'button', onclick: skip }, T('Не оспаривать', 'Do not contest'));
        ui.btns = h('div.bc-btns.disputes-btns', null, ui.submit, ui.open, ui.skip);
        ui.quote = h('p.disputes-quote', null, c.text);
        ui.pack = h('div.disputes-pack', { hidden: true },
          h('p.bc-to', null, T('В пакете: ', 'In the package: ') + c.files.length + docsWord(c.files.length) + T(' и текст ответа', ' and the response text')),
          h('div.disputes-files', null, c.files.map(function (f) { return h('span.tag', null, f); })),
          h('p', null, c.text));
        ui.out = h('div.disputes-out', { hidden: true });
        ui.msg = h('div.bc.mine.in-pop.disputes-msg', null,
          h('div.disputes-mh', null, h('span.disputes-av', null, icon('bot')), h('b', null, T('Бот споров', 'Disputes bot')), h('span.disputes-app', null, 'APP'), h('time', null, tm(0).slice(0, 5))),
          h('h5', null, wave ? T('Один пакет по 4 спорам готов', 'One package for 4 disputes is ready') : T('Пакет по спору готов', 'The dispute package is ready')),
          h('dl.kv', null,
            kv(T('Сумма', 'Amount'), usd(c.rows.length) + (wave ? T(' · 4 спора', ' · 4 disputes') : '')),
            kv(T('Причина', 'Reason'), REASON),
            kv(T('Доказательства', 'Evidence'), h('span.st.ok', null, T('4 из 4', '4 of 4') + (S.docs > 4 ? ' · ' + S.docs + docsWord(S.docs) : '')))),
          ui.quote, ui.pack, ui.btns, ui.out);
        slackBody.innerHTML = '';
        slackBody.appendChild(ui.msg);
        winSlack.note(T('ждёт человека', 'waiting for a person'));
        setTag('wait', T('ждёт человека', 'waiting for a person'));
        log.add(tm(0), T('Сообщение с кнопками отправлено в Slack, канал #disputes', 'A message with buttons posted to Slack, channel #disputes'), 'sys');
        S.phase = 'ready';
        readyNow();
        ctx.focus(winSlack);
      }

      function toggle() {
        S.open = !S.open;
        ui.pack.hidden = !S.open; ui.quote.hidden = S.open;
        ui.open.setAttribute('aria-expanded', String(S.open));
        ui.open.textContent = S.open ? T('Свернуть пакет', 'Hide package') : T('Открыть пакет', 'Open package');
        if (S.open) ui.pack.classList.add('in-pop');
      }

      function submit() {
        if (S.phase !== 'ready') return;
        click();
        log.add(humanTime(), T('Менеджер нажал «Отправить» в Slack', 'The manager pressed "Submit" in Slack'));
        if (S.sys === 'paypal') modal(); else send();
      }

      /* PayPal only: the person confirms one of the prepared scenarios before anything is sent */
      function modal() {
        S.phase = 'modal';
        ui.submit.disabled = true; ui.skip.disabled = true;
        ui.msg.classList.remove('mine');
        ui.opts = SCN.map(function (s, i) {
          return h('button.disputes-opt', { type: 'button', role: 'radio', 'aria-checked': String(i === S.scen), onclick: function () { pick(i); } }, h('i'), h('span', null, s));
        });
        ui.confirm = h('button.btn.btn-ok', { type: 'button', onclick: confirmScn }, icon('check'), T('Подтвердить и отправить', 'Confirm and submit'));
        ui.cancel = h('button.btn', { type: 'button', onclick: cancel }, T('Отмена', 'Cancel'));
        ui.modal = h('div.disputes-modal.in-pop', null,
          h('div.disputes-modal-h', null, icon('shield'), h('b', null, T('Подтвердите сценарий', 'Confirm the scenario')), h('small', null, T('окно Slack · PayPal', 'Slack modal · PayPal'))),
          h('p.disputes-modal-p', null, T('Выберите один из подготовленных сценариев. Без этого шага пакет в PayPal не уйдёт.', 'Pick one of the prepared scenarios. Without this step the package does not go to PayPal.')),
          h('div.disputes-opts', { role: 'radiogroup', 'aria-label': T('Сценарий ответа', 'Response scenario') }, ui.opts),
          h('div.bc-btns.disputes-btns', null, ui.confirm, ui.cancel));
        slackBody.appendChild(ui.modal);
        log.add(tm(1), T('Для PayPal открыто окно со сценариями', 'A modal with scenarios opened for PayPal'), 'sys');
        ctx.now(T('PayPal ждёт сценарий. Выберите его и нажмите <b>«Подтвердить и отправить»</b>.', 'PayPal needs a scenario. Pick one and press <b>"Confirm and submit"</b>.'));
        ctx.focus(ui.modal);
      }
      function pick(i) {
        if (S.phase !== 'modal') return;
        S.scen = i;
        ui.opts.forEach(function (b, k) { b.setAttribute('aria-checked', String(k === i)); });
      }
      function cancel() {
        if (S.phase !== 'modal') return;
        S.phase = 'ready';
        ui.modal.remove(); ui.modal = null;
        ui.submit.disabled = false; ui.skip.disabled = false;
        ui.msg.classList.add('mine');
        /* nothing was sent, so the count of clicks towards a decision starts over */
        S.clicks = 0; cnt.set('clicks', '0');
        log.add(tm(5), T('Менеджер закрыл окно, пакет не отправлен', 'The manager closed the modal, nothing was sent'));
        readyNow();
      }
      function confirmScn() {
        if (S.phase !== 'modal') return;
        click();
        log.add(humanTime(), T('Менеджер подтвердил сценарий «' + SCN[S.scen] + '»', 'The manager confirmed the scenario "' + SCN[S.scen] + '"'));
        send();
      }

      function send() {
        var c = cur(), pp = S.sys === 'paypal', wave = S.kase === 'wave';
        var busy = ui.modal ? ui.confirm : ui.submit;
        S.phase = 'send';
        [ui.submit, ui.open, ui.skip, ui.confirm, ui.cancel].forEach(function (b) { if (b) b.disabled = true; });
        if (ui.opts) ui.opts.forEach(function (b) { b.disabled = true; });
        busy.lastChild.textContent = T('Отправляю…', 'Submitting…');
        ctx.later(function () {
          if (ui.modal) { ui.modal.remove(); ui.modal = null; }
          ui.btns.remove();
          ui.msg.classList.remove('mine');
          ui.out.hidden = false;
          ui.out.appendChild(h('p.okl.in-pop', null, icon('check'), wave ? T('Один пакет отправлен в Stripe по 4 спорам', 'One package submitted to Stripe for 4 disputes') : T('Пакет отправлен в ', 'Package submitted to ') + c.sys));
          if (pp) ui.out.appendChild(h('p.thr', null, T('Сценарий: ', 'Scenario: ') + SCN[S.scen]));
          winSlack.note(T('отправлено', 'submitted'));
          winEv.note(T('4 из 4 · отправлен', '4 of 4 · submitted'));
          setTag('ok', T('ответ отправлен', 'response submitted'));
          log.add(tm(1), wave ? T('Один пакет отправлен в Stripe по всем 4 спорам', 'One package submitted to Stripe for all 4 disputes')
            : pp ? T('Пакет отправлен в PayPal с подтверждённым сценарием', 'Package submitted to PayPal with the confirmed scenario')
            : T('Пакет отправлен в Stripe, дальше решает банк', 'Package submitted to Stripe, the bank decides next'), 'sys');
          finish('submit');
        }, 700);
      }

      /* the human branch: the package is ready, but the person decides not to fight */
      function skip() {
        if (S.phase !== 'ready') return;
        click();
        log.add(humanTime(), T('Решение человека: менеджер нажал «Не оспаривать»', 'Human decision: the manager pressed "Do not contest"'));
        ui.btns.remove();
        ui.msg.classList.remove('mine');
        ui.out.hidden = false;
        ui.out.appendChild(h('p.wtl.in-pop', null, icon('user'), T('Не оспариваем: так решил менеджер', 'Not contested: the manager decided so')));
        ui.out.appendChild(h('p.thr', null, T('Спор закрыт как принятый. Собранный пакет никуда не отправлен.', 'The dispute is closed as accepted. The assembled package was not sent anywhere.')));
        winSlack.note(T('не оспариваем', 'not contested'));
        winEv.note(T('собран, не отправлен', 'assembled, not sent'));
        setTag('hum', T('принят, не оспариваем', 'accepted, not contested'));
        log.add(tm(1), T('Спор закрыт как принятый, пакет не отправлен', 'Dispute closed as accepted, the package was not sent'), 'sys');
        finish('skip');
      }

      function finish(act) {
        var s = S, key = act === 'skip' ? 'skip' : S.sys === 'paypal' ? 'pp' : S.kase === 'wave' ? 'wave' : 'one';
        S.phase = 'done'; seen[S.sys + '/' + S.kase + '/' + act] = true;
        ui.card.classList.remove('mine');
        arriveBtn.disabled = false; arriveBtn.lastChild.textContent = T('Ещё один спор', 'One more dispute');
        S.hold = true;
        ctx.later(function () { s.hold = false; }, HOLD);
        ctx.later(function () { ctx.focus(winLog); }, 300);
        ctx.now(key === 'one' ? T('Готово. Теперь переключите случай на <b>«Волна: 4 спора одного клиента»</b>.', 'Done. Now switch the case to <b>"A wave: 4 disputes from one customer"</b>.')
          : key === 'wave' ? T('Готово. Переключите платёжную систему на <b>PayPal</b>: там человек подтверждает сценарий.', 'Done. Switch the payment system to <b>PayPal</b>: there the person confirms a scenario.')
          : key === 'pp' ? T('Готово. Нажмите <b>«Ещё один спор»</b> и в Slack выберите <b>«Не оспаривать»</b>.', 'Done. Press <b>"One more dispute"</b> and choose <b>"Do not contest"</b> in Slack.')
          : T('Система собрала пакет, а отправлять его или нет, решил человек.', 'The system assembled the package, and a person decided whether to send it.'));
        ctx.end(key === 'one' ? T('<b>Доказательства собраны за ' + S.secs + ' секунд, человек нажал одну кнопку.</b> Условия подписки, чек, переписка и история продлений ушли в Stripe вместе с текстом ответа.', '<b>The evidence was assembled in ' + S.secs + ' seconds and the person pressed one button.</b> The subscription terms, the receipt, the support conversation and the renewal history went to Stripe together with the response text.')
          : key === 'wave' ? T('<b>Четыре спора ушли одним пакетом и одним кликом.</b> Система заметила, что все они от одного клиента, и собрала общий пакет за ' + S.secs + ' секунд.', '<b>Four disputes went out as one package with one click.</b> The system noticed they all came from one customer and assembled a shared package in ' + S.secs + ' seconds.')
          : key === 'pp' ? T('<b>Доказательства собраны за ' + S.secs + ' секунд, человек нажал две кнопки.</b> Для PayPal он подтвердил сценарий в окне Slack, и только после этого пакет ушёл.', '<b>The evidence was assembled in ' + S.secs + ' seconds and the person pressed two buttons.</b> For PayPal they confirmed the scenario in a Slack modal, and only then the package went out.')
          : T('<b>Решение осталось за человеком.</b> Пакет был готов за ' + S.secs + ' секунд, но менеджер решил не оспаривать: спор закрыт как принятый, доказательства никуда не ушли.', '<b>The decision stays with the person.</b> The package was ready in ' + S.secs + ' seconds, but the manager chose not to contest: the dispute is closed as accepted and no evidence was sent.'));
      }

      start('stripe', 'one');

      return {
        reset: function () { seen = {}; start('stripe', 'one'); },
        next: function () {
          var t = null, i;
          if (S.phase === 'run' || S.phase === 'send') return 'wait';
          for (i = 0; i < TOUR.length; i++) { if (!seen[TOUR[i].join('/')]) { t = TOUR[i]; break; } }
          if (!t) return null;
          if (S.hold) return 'wait';
          if (S.sys !== t[0]) return segSys.btn(t[0]);
          if (S.kase !== t[1]) return segCase.btn(t[1]);
          if (S.phase === 'modal') return t[2] === 'skip' ? ui.cancel : ui.confirm;
          if (S.phase === 'ready') return t[2] === 'skip' ? (S.open ? ui.skip : ui.open) : ui.submit;
          return arriveBtn;
        }
      };
    }
  });
})();
