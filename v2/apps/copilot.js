/* Mini app: workspace for support managers. One ticket on one screen: the email, answer variants with sources,
   payment facts, a cancellation behind a preview step, a promise check before sending and "teach the bot".
   State object S and one paint() that syncs the whole DOM from S, so any click order stays consistent. */
(function () {
  'use strict';
  var CSS = [
    '.copilot-grid{align-items:stretch}',
    '.copilot-grid>.demo-col{grid-template-rows:1fr}',
    '.copilot-grid>.demo-col>.win{display:flex;flex-direction:column}',
    '.copilot-grid>.copilot-rw{grid-column:1/-1}',
    '.copilot-fill{flex:1;display:flex;flex-direction:column;gap:10px}',
    '.copilot-s{min-height:38px}',
    '.copilot-mail{margin-top:6px;font-size:14.5px;line-height:1.5;min-height:10.5em}',
    '.copilot-hist{margin-top:auto;padding:4px 2px 0}',
    '.copilot-rows li{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:10px;align-items:center;padding:7px 0;border-top:1px solid var(--line2);font-size:13.5px;line-height:1.35;color:var(--ink2)}',
    '.copilot-rows li:first-child{border-top:0}',
    '.copilot-rows time{font:500 12px/1.4 var(--fm);color:var(--ink3)}',
    '.copilot-rows .a{font:600 13px/1.4 var(--fm);color:var(--ink)}',
    '.copilot-lbl{margin:4px 0 2px}',
    '.copilot-vars{padding:12px;display:grid;gap:8px;align-content:start}',
    '.copilot-var{display:block;width:100%;text-align:left;cursor:pointer;transition:border-color .2s ease,box-shadow .2s ease,opacity .2s ease}',
    '.copilot-var[disabled]{cursor:default}',
    '.copilot-var[disabled]:not(.mine){opacity:.6}',
    '.copilot-var-h{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:baseline;gap:2px 10px}',
    '.copilot-var-h b{font:700 14.5px/1.3 var(--fb)}',
    '.copilot-var-h span{font:500 12px/1.3 var(--fm);color:var(--ink3);white-space:nowrap}',
    '.copilot-var-p{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden;margin:5px 0 8px;font-size:13.5px;line-height:1.4;color:var(--ink2)}',
    '.copilot-rep{display:grid;grid-template-columns:minmax(0,6fr) minmax(0,5fr);grid-template-areas:"ed chk" "tools send";gap:12px 16px}',
    '.copilot-ed{grid-area:ed;min-width:0}',
    '.copilot-tools{grid-area:tools;min-width:0}',
    '.copilot-send{grid-area:send;min-width:0}',
    '.copilot-chk{grid-area:chk;min-width:0;padding:10px 12px;border:1px solid var(--line2);border-radius:12px;background:var(--card);transition:border-color .25s ease}',
    '.copilot-chk.risk{border-color:color-mix(in srgb,var(--bad) 60%,var(--line))}',
    '.copilot-chk.good{border-color:color-mix(in srgb,var(--ok) 55%,var(--line))}',
    'textarea.copilot-ta{resize:none;overflow:hidden}',
    '.copilot-ta[disabled]{opacity:.75}',
    '.copilot-dim{font-size:13px;line-height:1.45;color:var(--ink3)}',
    '.copilot-dim svg{width:14px;height:14px;vertical-align:-2px;margin-right:6px}',
    '.copilot-dim .typing{margin-right:8px}',
    '.copilot-q{font-size:13.5px;line-height:1.6;color:var(--ink2);margin-bottom:8px}',
    '.copilot-v{align-items:flex-start;font-weight:500;font-size:13.5px;line-height:1.45}',
    '.copilot-v svg{margin-top:2px}',
    '.copilot-v+.copilot-q{margin-top:10px}',
    '.copilot-row{display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center}',
    '.copilot-why{flex:1 1 150px;min-width:0;font-size:13px;line-height:1.4;color:var(--ink3)}',
    '.copilot-why.bad{color:var(--bad)}',
    '.copilot-why.ok{color:var(--ok)}',
    '.copilot-kb{margin-top:10px;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:4px 10px;align-items:center;padding:9px 12px;border:1px solid var(--line2);border-radius:12px;background:var(--card);font-size:13.5px}',
    '.copilot-kb b{display:flex;align-items:center;gap:8px;font-weight:600}',
    '.copilot-kb b svg{width:15px;height:15px;color:var(--ink3);flex:none}',
    '.copilot-kb .t{grid-column:1/-1;font-size:13px;line-height:1.4;color:var(--ink2)}',
    '.copilot-prev{margin-top:4px;padding:10px 12px;border:1px solid color-mix(in srgb,var(--wait) 55%,var(--line));border-radius:12px;background:var(--wait-soft)}',
    '.copilot-prev .t{margin-top:6px;font-size:13.5px;line-height:1.45}',
    '.copilot-prev small{display:block;margin-top:4px;font-size:12.5px;color:var(--ink2)}',
    '@media (hover:hover) and (pointer:fine){.copilot-var:hover:not([disabled]):not(.mine){border-color:var(--ink3)}}',
    '@media (max-width:980px){',
    '.copilot-grid{display:flex;flex-direction:column}',
    '.copilot-grid>.demo-col{display:contents}',
    '.copilot-grid .o1{order:1}.copilot-grid .o2{order:2}.copilot-grid .o3{order:3}.copilot-grid .o4{order:4}',
    '.copilot-rep{grid-template-columns:minmax(0,1fr);grid-template-areas:"ed" "tools" "chk" "send"}',
    '.copilot-hist{margin-top:0}',
    '.copilot-mail{min-height:0}',
    '}'
  ].join('');

  PF.app('copilot', {
    cap: [
      'Макет на выдуманных данных. Настоящее рабочее место показывает то же самое по живому тикету: варианты ответа с источниками, факты о платежах и проверку обещаний.',
      'A mock on invented data. The real workspace shows the same things for a live ticket: answer variants with their sources, payment facts and the promise check.'
    ],
    pace: 900,
    mount: function (ctx) {
      var T = ctx.T, h = ctx.h, icon = ctx.icon, esc = ctx.esc;
      if (!document.getElementById('pf-copilot-css')) document.head.appendChild(h('style', { id: 'pf-copilot-css', text: CSS }));

      /* ---------- data (all invented) ---------- */
      var MAIL = {
        from: 's***@gmail.com',
        subj: 'Abonnement stopzetten',
        body: 'Hallo, ik wil mijn abonnement stopzetten. Op 21 november is er opnieuw geld van mijn rekening afgeschreven, terwijl ik de app niet meer gebruik. Kunt u dit zo snel mogelijk regelen? Groet, Sanne',
        subjT: T('Остановить подписку', 'Stop the subscription'),
        bodyT: T('Здравствуйте, я хочу остановить подписку. 21 ноября с моего счёта снова списали деньги, хотя приложением я уже не пользуюсь. Можете решить это как можно скорее? С уважением, Санне',
          'Hello, I want to stop my subscription. On 21 November money was taken from my account again, although I no longer use the app. Could you sort this out as soon as possible? Regards, Sanne')
      };
      var HIST = [
        [T('14.11', '14 Nov'), T('Автопродление', 'Turn off auto-renewal'), T('закрыт', 'closed')],
        [T('02.11', '2 Nov'), T('Код для входа не пришёл', 'Login code did not arrive'), T('закрыт', 'closed')]
      ];
      var PAYS = [T('21.11', '21 Nov'), T('14.11', '14 Nov'), T('07.11', '7 Nov')];
      var HELLO = 'Hello Sanne, thank you for your message. ';
      var V = [
        { title: T('Подписка отменена', 'Subscription cancelled'), src: T('шаблон: отмена подтверждена', 'template: cancellation confirmed'), score: '0.93',
          body: 'Your cancellation is confirmed: there will be no further charges.' },
        { title: T('Объяснить списание', 'Explain the charge'), src: T('прошлый ответ менеджера', 'past manager reply'), score: '0.86',
          body: 'I checked your account: the charge on 21 November was the regular weekly renewal. I am handling your request to stop the subscription and will confirm it by email.' },
        { title: T('Отмена в приложении', 'Cancel in the app'), src: T('шаблон: как отменить самому', 'template: how to cancel yourself'), score: '0.79',
          body: 'You can stop the subscription yourself: open the app, go to Settings, then Subscription, and press Cancel. Write to us if anything is unclear.' }
      ];
      V.forEach(function (v) { v.text = HELLO + v.body; });
      var ADD = 'Your access stays active until the end of the paid period, 28 November.';
      /* phrases that promise "no charges from now on": true only when the subscription is cancelled */
      var PROM = [/no further charges/i, /no more charges/i, /(?:won['’]t|will not) be charged/i];

      var S, P = {}, holdUntil = 0, clock = 0, chkSig = null, lastNow, lastEnd;
      function fresh() {
        return { tr: false, trSeen: false, variant: null, base: '', adjusted: false, edited: false, typedLog: false,
          taught: 'none', kbText: '', sub: 'active', preview: false, cancelling: false, checking: false,
          gen: 0, tgen: 0, lastV: '', caught: false, sent: false, clicks: 0, seen: {}, nseen: 0 };
      }

      /* ---------- static frame ---------- */
      function btn(cls, ic, label, fn) { return h('button.btn' + cls, { type: 'button', onclick: fn }, ic ? icon(ic) : null, h('span', null, label)); }

      var mailSubj = h('h5'), mailText = h('p.copilot-mail');
      var trBtn = btn('.btn-sm.copilot-s', 'globe', '', toggleTr);
      var winTicket = ctx.win('mail', T('Тикет', 'Ticket'), T('Фото-приложение', 'Photo app'),
        h('div.feed.copilot-fill', null,
          h('div.bc', null,
            h('p.bc-to', null, T('От: ', 'From: '), h('b', null, MAIL.from), ' · NL'),
            mailSubj, mailText, h('div.bc-btns', null, trBtn)),
          h('div.copilot-hist', null,
            h('p.bc-to', null, T('История · 2 тикета', 'History · 2 tickets')),
            h('ul.copilot-rows', null, HIST.map(function (r) { return h('li', null, h('time', null, r[0]), h('span', null, r[1]), h('span.tg.tg-hum', null, r[2])); })))));

      var varBtns = V.map(function (v, i) {
        return h('button.bc.copilot-var', { type: 'button', 'aria-pressed': 'false', onclick: function () { pick(i); } },
          h('span.copilot-var-h', null, h('b', null, v.title), h('span', null, T('совпадение ', 'match ') + v.score)),
          h('span.copilot-var-p', null, v.body),
          h('span.tg.tg-hum', null, v.src));
      });
      var winVar = ctx.win('book', T('Варианты ответа', 'Answer variants'), T('топ-3 по совпадению', 'top 3 by match'),
        h('p.win-note', null, T('Поиск по смыслу и по точным словам: находит ответ и для письма на нидерландском.', 'Search by meaning and by exact words: it finds the answer for a Dutch email too.')),
        h('div.copilot-vars', null, varBtns));

      var ta = h('textarea.inp.copilot-ta', { id: 'copilot-ta', rows: '5', spellcheck: 'false', oninput: typed,
        placeholder: T('Выберите вариант ответа выше или напишите свой', 'Pick an answer variant above or write your own') });
      var chkBody = h('div');
      var chkBox = h('div.copilot-chk', null, h('p.bc-to', null, T('Проверка обещаний', 'Promise check')), chkBody);
      var adjBtn = btn('.btn-sm.copilot-s', 'edit', '', adjust);
      var teachBtn = btn('.btn-sm.copilot-s', 'bot', T('Научить бота', 'Teach the bot'), teach);
      var kbEl = h('div.copilot-kb', { hidden: true });
      var sendBtn = btn('.btn-acc', 'send', T('Отправить', 'Send'), send);
      var why = h('span.copilot-why');
      var sendRow = h('div.copilot-row', null, sendBtn, why);
      var sentEl = h('p.okl', { hidden: true }, icon('check'), h('span', null, T('Отправлено на языке клиента, тикет закрыт', "Sent in the customer's language, ticket closed")));
      var winReply = ctx.win('edit', T('Ответ клиенту', 'Reply to the customer'), '',
        h('div.win-b.copilot-rep', null,
          h('div.copilot-ed', null,
            h('label.lbl', { for: 'copilot-ta' }, T('Текст ответа, его можно править', 'Reply text, you can edit it')),
            ta,
            h('p.copilot-dim', { style: 'margin-top:6px' }, icon('globe'), T('Ответ уйдёт на языке клиента', "The reply is sent in the customer's language"))),
          chkBox,
          h('div.copilot-tools', null, h('div.copilot-row', null, adjBtn, teachBtn), kbEl),
          h('div.copilot-send', null, sendRow, sentEl)));

      var subChip = h('span.tg'), nextEl = h('dd.mono');
      var cancelBtn = btn('', 'x', T('Отменить подписку', 'Cancel subscription'), openPrev);
      var confBtn = btn('.btn-sm.btn-acc.copilot-s', null, '', confirmCancel);
      var backBtn = btn('.btn-sm.copilot-s', null, T('Назад', 'Back'), back);
      var paysEl = h('div', null,
        h('p.bc-to.copilot-lbl', null, T('Последние платежи', 'Last payments')),
        h('ul.copilot-rows', null, PAYS.map(function (d) { return h('li', null, h('time', null, d), h('span.a', null, '$6.99'), h('span.st.ok', null, T('прошёл', 'paid'))); })));
      var cancelRow = h('div.bc-btns', null, cancelBtn);
      var doneEl = h('p.okl.copilot-v', { hidden: true, style: 'margin-top:12px' }, icon('check'),
        h('span', null, T('Подписка отменена, списание 28.11 снято', 'Subscription cancelled, the 28 Nov charge is removed')));
      var prevEl = h('div.copilot-prev', { hidden: true },
        h('p.wtl', null, icon('eye'), T('Предпросмотр отмены', 'Cancellation preview')),
        h('p.t', null, T('Будет отменена подписка Weekly $6.99, списание 28.11 не пройдёт.', 'This cancels Weekly $6.99, the 28 Nov charge will not happen.')),
        h('small', null, T('Пока ничего не изменилось.', 'Nothing has changed yet.')),
        h('div.bc-btns', null, confBtn, backBtn));
      var winPay = ctx.win('card', T('Клиент и платежи', 'Customer and payments'), T('платёжная система', 'from billing'),
        h('div.win-b.copilot-fill', null,
          h('dl.kv', null,
            h('div', null, h('dt', null, T('Клиент', 'Customer')), h('dd.mono', null, 'cus_…2874')),
            h('div', null, h('dt', null, T('План', 'Plan')), h('dd', null, 'Weekly · $6.99')),
            h('div', null, h('dt', null, T('Подписка', 'Subscription')), h('dd', null, subChip)),
            h('div', null, h('dt', null, T('Следующее списание', 'Next charge')), nextEl)),
          h('div', null, paysEl, prevEl, cancelRow, doneEl)));

      var log = ctx.logger(T('Пока пусто. Сюда попадёт каждый клик менеджера и каждая проверка.', 'Empty for now. Every manager click and every check lands here.'), T('система', 'system'));
      var cnt = ctx.counters([
        ['clicks', T('кликов менеджера', 'manager clicks')],
        ['sys', T('систем открыто', 'systems opened'), '1'],
        ['chk', T('обещаний проверено', 'promises checked')],
        ['kb', T('знаний добавлено', 'knowledge added')]
      ]);
      var winLog = ctx.win('log', T('Журнал тикета', 'Ticket log'), T('время условное', 'time is illustrative'), log.el, cnt.el);
      winTicket.classList.add('o1'); winVar.classList.add('o2'); winReply.classList.add('o3', 'copilot-rw'); winPay.classList.add('o4');
      ctx.body.appendChild(h('div.demo-grid.g3c.flow.copilot-grid', null,
        h('div.demo-col', null, winTicket), h('div.demo-col', null, winVar), h('div.demo-col', null, winPay), winReply));
      winLog.classList.add('demo-wide');
      ctx.body.appendChild(winLog);

      /* ---------- promise check: pure functions of the reply text and the subscription state ---------- */
      function promises(txt) {
        var out = [];
        PROM.forEach(function (re, i) { var m = re.exec(txt); if (m) out.push({ id: i, phrase: m[0], at: m.index }); });
        return out.sort(function (a, b) { return a.at - b.at; });
      }
      function verdict() {
        var txt = ta.value;
        if (!txt.trim()) return { kind: 'empty', list: [] };
        var list = promises(txt);
        return { kind: !list.length ? 'none' : S.sub === 'active' ? 'risk' : 'good', list: list };
      }
      /* the sentence around a promise, with the phrase marked */
      function quote(txt, p, cls) {
        var s = p.at, e = p.at + p.phrase.length;
        while (s > 0 && !/[.!?\n]/.test(txt.charAt(s - 1))) s--;
        while (e < txt.length && !/[.!?\n]/.test(txt.charAt(e))) e++;
        if (e < txt.length) e++;
        return (s > 0 ? '… ' : '') + esc(txt.slice(s, p.at).replace(/^\s+/, '')) + '<mark class="' + cls + '">' + esc(p.phrase) + '</mark>' + esc(txt.slice(p.at + p.phrase.length, e));
      }
      function sendBlock(v, txt) {
        if (!txt) return T('Сначала выберите вариант ответа', 'Pick an answer variant first');
        if (S.cancelling) return T('Ждём ответ платёжной системы', 'Waiting for the payment system');
        if (S.checking) return T('Идёт проверка обещаний', 'The promise check is running');
        if (v.kind === 'risk') return T('Отправка закрыта: обещание не подтверждено', 'Sending is blocked: the promise is not confirmed');
        return '';
      }

      /* ---------- paint: the whole DOM from S ---------- */
      function paintCheck(v) {
        var busy = S.checking && v.kind !== 'empty', cls = v.kind === 'risk' ? 'risk' : 'good';
        var sig = busy ? 'busy' : v.kind + '|' + v.list.map(function (p) { return quote(ta.value, p, cls); }).join('|');
        if (sig === chkSig) return;
        var pop = !chkSig || chkSig.split('|')[0] !== sig.split('|')[0] ? '.in-pop' : '';
        chkSig = sig;
        chkBody.innerHTML = '';
        chkBox.className = 'copilot-chk' + (!busy && v.list.length ? ' ' + cls : '');
        if (busy) { chkBody.appendChild(h('p.copilot-dim', null, h('span.typing', null, h('i'), h('i'), h('i')), T('сверяю с платёжной системой', 'matching against the payment system'))); return; }
        if (v.kind === 'empty') { chkBody.appendChild(h('p.copilot-dim', null, T('Проверка сработает, когда в ответе появится текст.', 'The check runs once the reply has text.'))); return; }
        if (v.kind === 'none') { chkBody.appendChild(h('p.okl.copilot-v' + pop, null, icon('check'), h('span', null, T('Обещаний про деньги в ответе нет, проверять нечего', 'No money promises in the reply, nothing to check')))); return; }
        v.list.forEach(function (p) {
          chkBody.appendChild(h('p.copilot-q' + pop, { html: quote(ta.value, p, cls) }));
          chkBody.appendChild(h('p.' + (v.kind === 'risk' ? 'nol' : 'okl') + '.copilot-v' + pop, null, icon(v.kind === 'risk' ? 'x' : 'check'),
            h('span', null, '«' + p.phrase + '»: ' + (v.kind === 'risk'
              ? T('платёжная система этого не подтверждает: подписка ещё активна', 'the payment system does not confirm this: the subscription is still active')
              : T('платёжная система это подтверждает: подписка отменена, списаний больше не будет', 'the payment system confirms this: the subscription is cancelled, no charges ahead')))));
        });
      }
      function hint(v, txt) {
        if (S.sent) return T('Тикет закрыт. Нажмите <b>«Сначала»</b> и пройдите другим путём: например, выберите вариант без обещаний.', 'The ticket is closed. Press <b>"Reset"</b> and take another path: pick a variant with no promises, for example.');
        if (S.cancelling) return T('Платёжная система отменяет подписку. Секунду.', 'The payment system is cancelling the subscription. One second.');
        if (S.preview) return T('Это предпросмотр, пока ничего не изменилось. Нажмите <b>«Подтвердить отмену»</b> или <b>«Назад»</b>.', 'This is a preview, nothing has changed yet. Press <b>"Confirm"</b> or <b>"Back"</b>.');
        if (!txt) return T('Вы менеджер поддержки. Прочитайте письмо, там есть <b>перевод</b>, и выберите <b>вариант ответа</b>.', 'You are the support manager. Read the email, there is a <b>translation</b>, then pick an <b>answer variant</b>.');
        if (S.checking) return T('Идёт проверка: обещания в ответе сверяются с платёжной системой.', 'Checking: the promises in the reply are matched against the payment system.');
        if (v.kind === 'risk') return T('В ответе обещание, которое пока неправда: подписка ещё активна. Нажмите <b>«Отменить подписку»</b> или уберите фразу из текста.', 'The reply holds a promise that is not true yet: the subscription is still active. Press <b>"Cancel subscription"</b> or remove the phrase from the text.');
        if (S.taught === 'review') return T('Запись базы знаний на проверке. Секунду.', 'The knowledge record is in review. One second.');
        if (S.taught === 'verified') return T('Правка стала знанием бота. Осталось нажать <b>«Отправить»</b>.', 'The correction is bot knowledge now. All that is left is <b>"Send"</b>.');
        if (S.edited) return T('Вы поправили ответ. Нажмите <b>«Научить бота»</b>, и правка станет записью базы знаний. Или сразу <b>«Отправить»</b>.', 'You edited the reply. Press <b>"Teach the bot"</b> and the correction becomes a knowledge record. Or go straight to <b>"Send"</b>.');
        if (v.kind === 'good') return T('Обещание подтверждено, отправка открыта. Нажмите <b>«Поправить формулировку»</b> или сразу <b>«Отправить»</b>.', 'The promise is confirmed, sending is open. Press <b>"Adjust the wording"</b> or go straight to <b>"Send"</b>.');
        if (S.variant === 0) return T('В ответе больше нет обещаний про деньги, его можно <b>«Отправить»</b>.', 'The reply has no money promises any more, you can <b>"Send"</b> it.');
        return T('В этом ответе нет обещаний про деньги, его можно <b>«Отправить»</b> сразу. Вариант <b>«Подписка отменена»</b> покажет проверку обещаний.', 'This reply has no money promises, you can <b>"Send"</b> it right away. The variant <b>"Subscription cancelled"</b> shows the promise check.');
      }
      function endHtml() {
        var parts = [];
        if (S.caught) parts.push(T('рискованное обещание поймано до отправки', 'the risky promise was caught before sending'));
        if (S.taught === 'verified') parts.push(T('правка менеджера стала знанием бота', "the manager's correction became bot knowledge"));
        var tail = parts.join(T(', а ', ', and '));
        return T('<b>Менеджер закрыл тикет на одном экране, три системы открывать не пришлось.</b>', '<b>The manager closed the ticket on one screen, without opening three systems.</b>') +
          (tail ? ' ' + tail.charAt(0).toUpperCase() + tail.slice(1) + '.' : '');
      }
      function fit() { ta.style.height = 'auto'; ta.style.height = (ta.scrollHeight + 2) + 'px'; }
      function paint() {
        var txt = ta.value.trim(), v = verdict(), live = !S.checking;
        if (live && v.kind === 'risk') S.caught = true;
        if (live) v.list.forEach(function (p) { if (!S.seen[p.id]) { S.seen[p.id] = true; S.nseen++; } });

        if (P.tr !== S.tr) {
          P.tr = S.tr;
          mailSubj.textContent = S.tr ? MAIL.subjT : MAIL.subj;
          mailText.textContent = S.tr ? MAIL.bodyT : MAIL.body;
          trBtn.lastChild.textContent = S.tr ? T('Показать оригинал', 'Show original') : T('Показать перевод', 'Show translation');
        }
        varBtns.forEach(function (b, i) {
          var on = S.variant === i;
          b.classList.toggle('mine', on); b.setAttribute('aria-pressed', String(on)); b.disabled = S.sent;
        });

        ta.disabled = S.sent; fit();
        paintCheck(v);
        adjBtn.disabled = S.sent || S.adjusted || !txt;
        adjBtn.lastChild.textContent = S.adjusted ? T('Формулировка поправлена', 'Wording adjusted') : T('Поправить формулировку', 'Adjust the wording');
        teachBtn.hidden = !(S.edited && S.taught === 'none' && !S.sent && txt);
        if (P.taught !== S.taught) {
          P.taught = S.taught;
          kbEl.hidden = S.taught === 'none';
          kbEl.innerHTML = '';
          if (S.taught !== 'none') {
            kbEl.appendChild(h('b', null, icon('book'), T('Запись базы знаний', 'Knowledge record')));
            kbEl.appendChild(S.taught === 'review' ? h('span.tg.tg-wait', null, T('на проверке', 'in review')) : h('span.tg.tg-ok.flash', null, T('проверена', 'verified')));
            kbEl.appendChild(h('span.t', null, S.kbText));
          }
        }
        var block = sendBlock(v, txt);
        sendBtn.disabled = S.sent || !!block;
        why.textContent = block || T('Можно отправлять', 'Ready to send');
        why.className = 'copilot-why' + (!block ? ' ok' : v.kind === 'risk' && live && !S.cancelling ? ' bad' : '');
        sendRow.hidden = S.sent; sentEl.hidden = !S.sent;
        winReply.note(S.sent ? T('отправлено', 'sent') : txt ? T('черновик', 'draft') : '');

        if (P.sub !== S.sub) {
          var fl = P.sub ? ' flash' : '';
          P.sub = S.sub;
          subChip.className = 'tg ' + (S.sub === 'active' ? 'tg-ok' : 'tg-info') + fl;
          subChip.textContent = S.sub === 'active' ? T('активна', 'active') : T('отменена', 'cancelled');
          nextEl.className = 'mono' + fl;
          nextEl.textContent = S.sub === 'active' ? T('28.11', '28 Nov') : T('не будет', 'none');
        }
        paysEl.hidden = S.preview;
        prevEl.hidden = !S.preview;
        cancelRow.hidden = S.preview || S.sub !== 'active';
        cancelBtn.disabled = S.sent || S.cancelling;
        confBtn.disabled = backBtn.disabled = S.cancelling;
        confBtn.lastChild.textContent = S.cancelling ? T('Отменяю…', 'Cancelling…') : T('Подтвердить отмену', 'Confirm');
        doneEl.hidden = S.sub !== 'cancelled';

        cnt.set('clicks', String(S.clicks)); cnt.set('chk', String(S.nseen)); cnt.set('kb', S.taught === 'verified' ? '1' : '0');
        var n = hint(v, txt); if (n !== lastNow) { lastNow = n; ctx.now(n); }
        var e = S.sent ? endHtml() : null; if (e !== lastEnd) { lastEnd = e; ctx.end(e); }
      }

      /* ---------- actions ---------- */
      function two(n) { return (n < 10 ? '0' : '') + n; }
      function tm(add) { clock += add; var t = 14 * 3600 + 7 * 60 + 12 + clock; return Math.floor(t / 3600) + ':' + two(Math.floor(t % 3600 / 60)) + ':' + two(t % 60); }
      function hold(ms) { holdUntil = Date.now() + ms; } /* reading time for autoplay only, manual clicks never wait */
      /* log the verdict once per change */
      function settle() {
        var v = verdict(), key = v.kind + ':' + v.list.map(function (p) { return p.phrase.toLowerCase(); }).join(',');
        if (key === S.lastV) return;
        S.lastV = key;
        var ph = v.list.map(function (p) { return '«' + p.phrase + '»'; }).join(', ');
        if (v.kind === 'risk') log.add(tm(1), T('Обещание ' + ph + ' не подтверждено: подписка активна. Отправка закрыта', 'Promise ' + ph + ' is not confirmed: the subscription is active. Sending is blocked'), 'bad');
        else if (v.kind === 'good') log.add(tm(1), T('Обещание ' + ph + ' подтверждено платёжной системой, отправка открыта', 'Promise ' + ph + ' is confirmed by the payment system, sending is open'), 'sys');
        else if (v.kind === 'none') log.add(tm(1), T('Обещаний про деньги в ответе нет, отправка открыта', 'No money promises in the reply, sending is open'), 'sys');
      }
      function runCheck(ms) {
        var g = ++S.gen;
        S.checking = true; S.lastV = '';
        ctx.later(function () {
          if (g !== S.gen) return;
          S.checking = false; settle(); paint(); ctx.focus(chkBox);
        }, ms);
      }
      function toggleTr() {
        S.tr = !S.tr; S.trSeen = true;
        if (!S.sent) {
          S.clicks++;
          log.add(tm(6), S.tr ? T('Менеджер открыл перевод письма', 'Manager opened the translation') : T('Менеджер вернул оригинал письма', 'Manager switched back to the original'));
        }
        hold(3200); paint();
      }
      function pick(i) {
        if (S.sent) return;
        S.clicks++;
        S.variant = i; S.base = V[i].text; S.adjusted = false; S.edited = false; S.typedLog = false;
        ta.value = V[i].text;
        log.add(tm(9), T('Менеджер выбрал вариант «' + V[i].title + '»', 'Manager picked the variant "' + V[i].title + '"'));
        runCheck(700);
        hold(S.sub === 'active' && promises(ta.value).length ? 9000 : 5000);
        paint();
      }
      function typed() {
        if (S.sent) return;
        S.edited = S.adjusted || ta.value !== S.base;
        var g = ++S.tgen;
        ctx.later(function () {
          if (g !== S.tgen || S.sent) return;
          if (!S.typedLog) { S.typedLog = true; log.add(tm(15), T('Менеджер правит текст вручную', 'Manager is editing the text by hand')); }
          if (!S.checking) settle();
          paint();
        }, 800);
        paint();
      }
      function adjust() {
        if (S.sent || S.adjusted || !ta.value.trim()) return;
        S.clicks++;
        ta.value = ta.value.replace(/\s+$/, '') + ' ' + ADD;
        S.adjusted = true; S.edited = true;
        log.add(tm(12), T('Менеджер поправил формулировку: добавил, до какого дня остаётся доступ', 'Manager adjusted the wording: added until when access stays'));
        ta.classList.remove('flash'); void ta.offsetWidth; ta.classList.add('flash');
        hold(6000); paint(); ctx.focus(ta);
      }
      function teach() {
        if (S.sent || S.taught !== 'none' || !S.edited) return;
        S.clicks++;
        S.taught = 'review';
        S.kbText = S.adjusted ? T('После отмены доступ остаётся до конца оплаченного периода', 'After cancellation access stays until the end of the paid period') : T('Правка менеджера из этого тикета', "The manager's correction from this ticket");
        log.add(tm(5), T('Менеджер нажал «Научить бота»: правка стала записью базы знаний, она на проверке', 'Manager pressed "Teach the bot": the correction became a knowledge record, now in review'));
        hold(7000); paint(); ctx.focus(kbEl);
        ctx.later(function () {
          S.taught = 'verified';
          log.add(tm(3), T('Запись базы знаний проверена', 'Knowledge record verified'), 'sys');
          paint();
        }, 1100);
      }
      function send() {
        if (S.sent || sendBlock(verdict(), ta.value.trim())) return;
        S.clicks++;
        S.sent = true; S.preview = false;
        log.add(tm(7), T('Ответ отправлен на языке клиента, тикет закрыт', "Reply sent in the customer's language, ticket closed"));
        paint(); ctx.focus(sentEl);
      }
      function openPrev() {
        if (S.sent || S.sub !== 'active' || S.preview || S.cancelling) return;
        S.clicks++;
        S.preview = true;
        log.add(tm(11), T('Менеджер открыл предпросмотр отмены', 'Manager opened the cancellation preview'));
        hold(6000); paint(); ctx.focus(prevEl);
      }
      function back() {
        if (!S.preview || S.cancelling) return;
        S.clicks++;
        S.preview = false;
        log.add(tm(3), T('Менеджер нажал «Назад», подписка не изменилась', 'Manager pressed "Back", the subscription is unchanged'));
        paint();
      }
      function confirmCancel() {
        if (S.sent || !S.preview || S.cancelling) return;
        S.clicks++;
        S.cancelling = true;
        log.add(tm(4), T('Менеджер подтвердил отмену', 'Manager confirmed the cancellation'));
        hold(9500); paint();
        ctx.later(function () {
          S.cancelling = false; S.preview = false; S.sub = 'cancelled';
          log.add(tm(2), T('Подписка Weekly $6.99 отменена, списание 28.11 снято', 'Weekly $6.99 is cancelled, the 28 Nov charge is removed'), 'sys');
          if (verdict().list.length) runCheck(700); else settle();
          paint(); ctx.focus(subChip);
        }, 900);
      }

      function start() {
        ctx.clearTimers();
        S = fresh(); P = {}; holdUntil = 0; clock = 0; chkSig = null; lastNow = lastEnd = undefined;
        ta.value = ''; ta.classList.remove('flash');
        log.clear();
        paint();
      }
      start();

      return {
        reset: start,
        /* the natural path: translation, variant 1, risk, cancel through the preview, adjust, teach, send */
        next: function () {
          if (S.sent) return null;
          if (S.checking || S.cancelling || S.taught === 'review' || Date.now() < holdUntil) return 'wait';
          if (!S.trSeen) return trBtn;
          if (S.variant !== 0 || !ta.value.trim()) return varBtns[0];
          if (S.sub === 'active') return S.preview ? confBtn : cancelBtn;
          if (!S.adjusted) return adjBtn;
          if (S.taught === 'none') return teachBtn;
          return sendBtn;
        }
      };
    }
  });
})();
