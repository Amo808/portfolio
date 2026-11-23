/* Mini app: first-line support bot. One email goes through 4 agents, a payment-system action and a promise check.
   Reference implementation for the other mini apps: state object S, a base render per scenario, small incremental updates while it runs. */
(function () {
  'use strict';
  PF.app('support', {
    cap: [
      'Макет на выдуманных данных. В настоящей системе шаги те же: четыре агента, действия через API платёжной системы и проверка каждого обещания перед отправкой.',
      'A mock on invented data. The real system runs the same steps: four agents, actions through the payment API and a check of every promise before sending.'
    ],
    pace: 900,
    mount: function (ctx) {
      var T = ctx.T, h = ctx.h, icon = ctx.icon;

      /* ---------- scenarios ---------- */
      var SC = {
        cancel: {
          brand: T('Фото-приложение', 'Photo app'), from: 'k***@gmail.com', lang: 'EN', subj: 'Cancel my subscription',
          body: "Hi, please cancel my subscription. I don't use the app anymore. Thanks, Kate",
          cust: 'cus_…4821', plan: 'Weekly · $6.99', last: '$6.99 · 21.11', sub0: ['ok', T('активна, продление 28.11', 'active, renews 28 Nov')],
          a1: 'cancel_subscription', conf: '0.97',
          a2find: T('подписка <b>Weekly $6.99</b>, следующее списание 28.11', 'subscription <b>Weekly $6.99</b>, next charge 28 Nov'),
          a2act: T('<span class="hl-ok">отменил подписку через API</span>, списание 28.11 снято', '<span class="hl-ok">cancelled the subscription via API</span>, the 28 Nov charge is removed'),
          kb: ['cancel-confirmed · en', 'access-until-period-end'],
          reply: "Hi Kate, your subscription is cancelled. You won't be charged again, and your access stays active until 28 November. If you change your mind, you can resubscribe in the app at any time.",
          checks: [["your subscription is cancelled", T('в платёжке подписка отменена', 'payment system: subscription cancelled')], ["You won't be charged again", T('будущих списаний нет', 'no upcoming charges')]],
          secs: 38, acts: 1
        },
        refund: {
          brand: T('Музыкальное приложение', 'Music app'), from: 'd***@outlook.com', lang: 'EN', subj: 'Charged after cancelling',
          body: 'I cancelled my trial on 19 Nov but you still charged me $9.99 on 21 Nov. I want my money back.',
          cust: 'cus_…7310', plan: 'Monthly · $9.99', last: '$9.99 · 21.11', sub0: ['wait', T('отменена 19.11', 'cancelled 19 Nov')],
          a1: 'refund_request', conf: '0.94',
          a2find: T('отмена 19.11, списание <b>$9.99</b> 21.11 уже после отмены. По правилу это возврат без человека', 'cancelled 19 Nov, charged <b>$9.99</b> on 21 Nov after the cancellation. The rule allows a refund without a human'),
          a2actOk: T('<span class="hl-ok">возврат $9.99 создан и подтверждён платёжкой</span>', '<span class="hl-ok">refund of $9.99 created and confirmed by the payment system</span>'),
          a2actStuck: T('возврат $9.99 создан, <span class="hl-wait">платёжка его ещё не подтвердила</span>', 'refund of $9.99 created, <span class="hl-wait">the payment system has not confirmed it yet</span>'),
          kb: ['refund-after-cancel · en', 'refund-timing-5-10-days'],
          reply: "Hi Daniel, you're right: the charge of $9.99 came after your cancellation. We've refunded it in full. The money usually arrives within 5–10 business days.",
          checks: [["We've refunded it in full", T('в платёжке возврат подтверждён', 'payment system: refund confirmed')]],
          checksStuck: [["We've refunded it in full", T('в платёжке возврат не подтверждён', 'payment system: refund not confirmed')]],
          secs: 41, secsStuck: 29, acts: 1
        },
        dispute: {
          brand: T('Фото-приложение', 'Photo app'), from: 'h***@web.de', lang: 'DE', subj: 'Unberechtigte Abbuchung',
          body: 'Ich habe nie etwas bestellt! Wenn ich mein Geld nicht sofort zurückbekomme, melde ich das meiner Bank.',
          cust: 'cus_…1957', plan: 'Weekly · €7.99', last: '€7.99 · 19.11', sub0: ['ok', T('активна, 2 списания', 'active, 2 charges')],
          a1: 'chargeback_threat', conf: '0.91',
          a2find: T('2 списания по <b>€7.99</b> (12.11 и 19.11), подписка активна', '2 charges of <b>€7.99</b> (12 and 19 Nov), subscription is active'),
          a2act: T('<span class="hl-wait">денег не трогаю:</span> клиент грозит банком, решает человек', '<span class="hl-wait">no money action:</span> the customer threatens a bank dispute, a human decides'),
          kb: ['chargeback-threat-playbook', 'refund-policy · de'],
          reply: 'Guten Tag, wir haben Ihre Zahlungen geprüft: zwei Abbuchungen über je 7,99 € am 12. und 19. November. Wir klären das gern direkt mit Ihnen …',
          secs: 21, acts: 0
        }
      };
      var TOUR = [['cancel', 'ok'], ['refund', 'ok'], ['refund', 'stuck'], ['dispute', 'ok']];
      var S, seen = {};
      function fresh(sc, pay) { return { sc: sc || 'cancel', pay: pay || 'ok', running: false, done: false }; }

      /* ---------- static frame ---------- */
      var segSc = ctx.seg(T('Письмо клиента', 'Customer email'), [
        ['cancel', T('Отмена подписки', 'Cancel subscription')],
        ['refund', T('Возврат денег', 'Refund')],
        ['dispute', T('Грозит банком', 'Threatens a dispute')]
      ], 'cancel', function (v) { start(v, 'ok'); });
      ctx.bar.appendChild(segSc);

      var mailBody = h('div.feed');
      var replyBody = h('div.win-b');
      var stepsEl = h('ol.steps');
      var payBody = h('div.win-b');
      var log = ctx.logger(T('Пока пусто. Каждый шаг бота попадёт сюда со временем.', 'Empty for now. Every step of the bot lands here with a timestamp.'), T('бот', 'bot'));
      var cnt = ctx.counters([
        ['secs', T('секунд от письма до решения', 'seconds from email to outcome'), '—'],
        ['acts', T('действий в платёжке', 'payment-system actions')],
        ['chk', T('обещаний проверено', 'promises checked')],
        ['hum', T('нужен человек', 'human needed'), '—']
      ]);
      var winMail = ctx.win('mail', T('Входящее · почта поддержки', 'Inbox · support mail'), '', mailBody);
      var winReply = ctx.win('send', T('Ответ клиенту', 'Reply to the customer'), '', replyBody);
      var winAgents = ctx.win('bot', T('Четыре агента', 'Four agents'), T('каждый делает одно дело', 'each does one job'), stepsEl);
      var winPay = ctx.win('card', T('Платёжная система', 'Payment system'), T('данные из API', 'data from the API'), payBody);
      var winLog = ctx.win('log', T('Журнал письма', 'Email log'), T('время условное', 'time is illustrative'), log.el, cnt.el);
      winMail.classList.add('o1'); winAgents.classList.add('o2'); winPay.classList.add('o3'); winReply.classList.add('o4');
      ctx.body.appendChild(h('div.demo-grid.flow', null,
        h('div.demo-col', null, winMail, winPay),
        h('div.demo-col', null, winAgents, winReply)));
      winLog.classList.add('demo-wide');
      ctx.body.appendChild(winLog);

      var AG = [
        [T('Намерение', 'Intent'), T('понимает, чего хочет клиент и на каком языке пишет', 'works out what the customer wants and in which language')],
        [T('Подписки и платежи', 'Subscriptions and payments'), T('находит клиента в платёжной системе и делает действие', 'finds the customer in the payment system and acts')],
        [T('База знаний', 'Knowledge base'), T('достаёт правила и шаблоны бренда из RAG', 'pulls brand rules and templates from RAG')],
        [T('Ответ', 'Reply'), T('пишет письмо на языке клиента', "writes the email in the customer's language")]
      ];
      var runBtn, stepNodes, payNodes, segPay;

      /* ---------- render of a fresh scenario ---------- */
      function base() {
        var c = SC[S.sc];
        segSc.set(S.sc);
        winMail.note(c.brand);
        mailBody.innerHTML = '';
        runBtn = h('button.btn.btn-acc', { type: 'button', onclick: run }, icon('bolt'), T('Обработать письмо', 'Process the email'));
        mailBody.appendChild(h('div.bc.mine', null,
          h('p.bc-to', null, T('От: ', 'From: '), h('b', null, c.from), ' · ', c.lang),
          h('h5', null, c.subj),
          h('p.meta', { style: 'margin-top:6px;color:var(--ink);font-size:14.5px' }, c.body),
          h('div.bc-btns', null, runBtn)));

        replyBody.innerHTML = '';
        replyBody.appendChild(h('p', { style: 'color:var(--ink3);font-size:13.5px' }, T('Ответ появится после четвёртого агента и проверки обещаний.', 'The reply appears after the fourth agent and the promise check.')));
        winReply.note('');

        stepsEl.innerHTML = '';
        stepNodes = AG.map(function (a, i) {
          var o = h('div.o');
          var st = h('span.tg.tg-hum', null, T('ждёт', 'waiting'));
          var li = h('li.stp.idle', null, h('span.n', null, String(i + 1)), h('div', null, h('div.t', null, a[0]), h('div.d', null, a[1])), st, o);
          stepsEl.appendChild(li);
          return { li: li, o: o, st: st };
        });

        payBody.innerHTML = '';
        payNodes = { sub: h('span.st.' + c.sub0[0], null, c.sub0[1]), ref: h('span', null, '—') };
        payBody.appendChild(h('dl.kv', null,
          h('div', null, h('dt', null, T('Клиент', 'Customer')), h('dd.mono', null, c.cust)),
          h('div', null, h('dt', null, T('План', 'Plan')), h('dd', null, c.plan)),
          h('div', null, h('dt', null, T('Подписка', 'Subscription')), h('dd', null, payNodes.sub)),
          h('div', null, h('dt', null, T('Последний платёж', 'Last payment')), h('dd.mono', null, c.last)),
          h('div', null, h('dt', null, T('Возврат', 'Refund')), h('dd', null, payNodes.ref))));
        segPay = null;
        if (S.sc === 'refund') {
          segPay = ctx.seg(T('Что ответит платёжка на возврат', 'How the payment system answers the refund'), [
            ['ok', T('Возврат подтверждён', 'Refund confirmed')],
            ['stuck', T('Возврат завис', 'Refund is stuck')]
          ], S.pay, function (v) { start('refund', v); });
          segPay.style.marginTop = '12px';
          payBody.appendChild(segPay);
          payBody.appendChild(h('p', { style: 'margin-top:8px;font-size:12.5px;color:var(--ink3)' }, T('Переключите и запустите ещё раз: бот не напишет «вернули», пока платёжка этого не подтвердила.', 'Switch it and run again: the bot will not write "refunded" until the payment system confirms it.')));
        }
        log.clear();
        cnt.set('secs', '—'); cnt.set('acts', '0'); cnt.set('chk', '0'); cnt.set('hum', '—');
        ctx.end(null);
        ctx.now(T('Письмо пришло в поддержку. Нажмите <b>«Обработать письмо»</b> и смотрите, что делает каждый агент.', 'An email has arrived. Press <b>"Process the email"</b> and watch what each agent does.'));
      }

      function start(sc, pay) {
        ctx.clearTimers();
        S = fresh(sc, pay);
        base();
      }

      /* ---------- the run ---------- */
      var clock;
      function tm(add) { clock += add; var m = 42 + Math.floor(clock / 60), s = clock % 60; return '10:' + m + ':' + (s < 10 ? '0' : '') + s; }
      function agent(i, state, html) {
        var n = stepNodes[i];
        n.li.className = 'stp ' + state;
        n.st.className = 'tg ' + (state === 'run' ? 'tg-acc' : state === 'done' ? 'tg-ok' : state === 'stop' ? 'tg-bad' : 'tg-hum');
        n.st.textContent = state === 'run' ? T('работает', 'working') : state === 'done' ? T('готово', 'done') : state === 'stop' ? T('стоп', 'stop') : T('ждёт', 'waiting');
        if (html != null) { n.o.innerHTML = html; n.o.classList.add('in-pop'); }
      }
      function mark(text, checks, cls) {
        var out = ctx.esc(text);
        checks.forEach(function (c) { out = out.replace(ctx.esc(c[0]), '<mark class="' + cls + '">' + ctx.esc(c[0]) + '</mark>'); });
        return out;
      }

      function run() {
        if (S.running) return;
        if (S.done) start(S.sc, S.pay);
        var c = SC[S.sc], stuck = S.sc === 'refund' && S.pay === 'stuck', human = S.sc === 'dispute' || stuck;
        S.running = true; clock = 7;
        runBtn.disabled = true;
        if (segPay) segPay.querySelectorAll('button').forEach(function (b) { b.disabled = true; });
        ctx.now(T('Бот работает. Следите за агентами и за платёжной системой.', 'The bot is working. Watch the agents and the payment system.'));
        log.add(tm(0), T('Письмо получено, бренд и язык определены: ', 'Email received, brand and language detected: ') + c.brand + ', ' + c.lang, 'sys');

        agent(0, 'run'); ctx.focus(stepNodes[0].li);
        ctx.later(function () {
          agent(0, 'done', '<b>' + c.a1 + '</b> · ' + T('уверенность ', 'confidence ') + c.conf + ' · ' + T('язык ', 'language ') + c.lang);
          log.add(tm(3), T('Намерение: ', 'Intent: ') + c.a1, 'sys');
          agent(1, 'run', T('ищу клиента по почте…', 'looking the customer up by email…'));
        }, 900);
        ctx.later(function () {
          agent(1, 'run', c.a2find); ctx.focus(stepNodes[1].li);
          log.add(tm(5), T('Клиент найден в платёжной системе', 'Customer found in the payment system'), 'sys');
        }, 2000);
        ctx.later(function () {
          var act = S.sc === 'refund' ? (stuck ? c.a2actStuck : c.a2actOk) : c.a2act;
          agent(1, 'done', c.a2find + '<br>' + act);
          if (S.sc === 'cancel') {
            payNodes.sub.className = 'st bad flash'; payNodes.sub.textContent = T('отменена, списаний больше нет', 'cancelled, no more charges');
            log.add(tm(4), T('Подписка отменена через API платёжной системы', 'Subscription cancelled through the payment API'), 'sys');
          } else if (S.sc === 'refund') {
            payNodes.ref.className = 'st flash ' + (stuck ? 'wait' : 'ok');
            payNodes.ref.textContent = stuck ? T('$9.99 · в обработке', '$9.99 · pending') : T('$9.99 · подтверждён', '$9.99 · confirmed');
            log.add(tm(4), stuck ? T('Возврат создан, подтверждения от платёжки нет', 'Refund created, no confirmation from the payment system') : T('Возврат $9.99 подтверждён платёжной системой', 'Refund of $9.99 confirmed by the payment system'), stuck ? 'warn' : 'sys');
          } else {
            log.add(tm(4), T('Угроза спора: бот не делает действий с деньгами', 'Dispute threat: the bot takes no money action'), 'warn');
          }
          cnt.set('acts', String(c.acts));
          ctx.focus(winPay);
          ctx.later(function () { agent(2, 'run'); ctx.focus(stepNodes[2].li); }, 700);
        }, 3300);
        ctx.later(function () {
          agent(2, 'done', T('найдено записей: ', 'records found: ') + c.kb.length + ' · <b>' + c.kb.join('</b>, <b>') + '</b>');
          log.add(tm(4), T('Из базы знаний взяты правила бренда и шаблон', 'Brand rules and a template pulled from the knowledge base'), 'sys');
          agent(3, 'run', T('пишу ответ…', 'writing the reply…'));
          replyBody.innerHTML = '';
          var p = h('p', { style: 'font-size:14.5px;line-height:1.5' });
          replyBody.appendChild(h('p.bc-to', null, human && S.sc === 'dispute' ? T('Черновик для менеджера', 'Draft for the manager') : T('Черновик', 'Draft')));
          replyBody.appendChild(p);
          winReply.note(T('пишется…', 'writing…'));
          ctx.later(function () { ctx.focus(winReply); }, 500);
          ctx.type(p, c.reply, function () { ctx.later(function () { guard(p); }, 500); });
        }, 5000);
      }

      function guard(p) {
        var c = SC[S.sc], stuck = S.sc === 'refund' && S.pay === 'stuck';
        agent(3, 'done', T('черновик на ', 'draft in ') + c.lang + ' · ' + c.reply.length + T(' знаков', ' chars'));
        if (S.sc === 'dispute') {
          winReply.note(T('не отправлено', 'not sent'));
          replyBody.appendChild(h('p.wtl', { style: 'margin-top:12px' }, icon('user'), T('Передано менеджеру вместе с фактами о платежах', 'Handed to a manager together with the payment facts')));
          replyBody.appendChild(h('p.thr', null, T('Менеджер видит: клиент грозит банком · 2 списания по €7.99 · подписка активна · черновик на немецком.', 'The manager sees: dispute threat · 2 charges of €7.99 · active subscription · a draft in German.')));
          log.add(tm(5), T('Письмо у менеджера: тег «угроза спора», факты и черновик приложены', 'Email is with a manager: "dispute threat" tag, facts and a draft attached'), 'sys');
          finish(c.secs, 0, true);
          return;
        }
        var checks = stuck ? c.checksStuck : c.checks;
        log.add(tm(12), T('Черновик готов, проверяю обещания по данным платёжки', 'Draft is ready, checking its promises against the payment system'), 'sys');
        p.innerHTML = mark(c.reply, checks, stuck ? 'risk' : 'good');
        var ul = h('ul', { style: 'margin-top:12px;display:grid;gap:6px;font-size:13.5px' });
        checks.forEach(function (k) {
          ul.appendChild(h('li.' + (stuck ? 'nol' : 'okl'), { style: 'font-weight:500;align-items:flex-start' }, icon(stuck ? 'x' : 'check'), h('span', null, '«' + k[0] + '»: ' + k[1])));
        });
        replyBody.appendChild(ul);
        cnt.set('chk', String(checks.length));
        ctx.later(function () {
          if (stuck) {
            stepNodes[3].li.className = 'stp stop';
            winReply.note(T('остановлено', 'blocked'));
            replyBody.appendChild(h('p.nol', { style: 'margin-top:12px' }, icon('shield'), T('Письмо не отправлено: обещание не подтверждено', 'Not sent: the promise is not confirmed')));
            replyBody.appendChild(h('p.thr', null, T('Письмо ушло менеджеру с пометкой «возврат завис». Клиент не получил ложное «мы вернули деньги».', 'The email went to a manager marked "refund stuck". The customer never received a false "we refunded you".')));
            log.add(tm(2), T('Обещание «refunded» не подтверждено платёжкой: отправка остановлена', 'Promise "refunded" is not confirmed by the payment system: sending blocked'), 'bad');
            log.add(tm(1), T('Письмо передано менеджеру с причиной', 'Email handed to a manager with the reason'), 'sys');
            finish(c.secsStuck, checks.length, true);
          } else {
            winReply.note(T('отправлено', 'sent'));
            replyBody.appendChild(h('p.okl', { style: 'margin-top:12px' }, icon('check'), T('Отправлено клиенту, тикет закрыт', 'Sent to the customer, ticket closed')));
            log.add(tm(2), T('Все обещания подтверждены, письмо отправлено', 'All promises confirmed, email sent'), 'sys');
            finish(c.secs, checks.length, false);
          }
        }, 900);
      }

      function finish(secs, chk, human) {
        S.running = false; S.done = true; seen[S.sc + '/' + S.pay] = true;
        if (segPay) segPay.querySelectorAll('button').forEach(function (b) { b.disabled = false; });
        runBtn.disabled = false; runBtn.lastChild.textContent = T('Запустить ещё раз', 'Run again');
        cnt.set('secs', String(secs)); cnt.set('chk', String(chk)); cnt.set('hum', human ? T('да', 'yes') : T('нет', 'no'));
        ctx.later(function () { ctx.focus(winReply); }, 300);
        var stuck = S.sc === 'refund' && S.pay === 'stuck';
        ctx.now(S.sc === 'cancel' ? T('Готово. Попробуйте письмо <b>«Возврат денег»</b>: там видно, как бот проверяет свои обещания.', 'Done. Try the <b>"Refund"</b> email next: it shows how the bot checks its own promises.')
          : S.sc === 'refund' && !stuck ? T('Готово. Теперь переключите платёжку на <b>«Возврат завис»</b> и запустите ещё раз.', 'Done. Now switch the payment system to <b>"Refund is stuck"</b> and run it again.')
          : stuck ? T('Бот остановил собственное письмо. Осталось письмо <b>«Грозит банком»</b>.', 'The bot blocked its own email. One more to try: <b>"Threatens a dispute"</b>.')
          : T('Бот не отвечает сам там, где ошибка стоит денег.', 'The bot does not answer on its own where a mistake costs money.'));
        ctx.end(S.sc === 'cancel' ? T('<b>Закрыто без человека за 38 секунд.</b> Бот сам нашёл подписку, отменил её и написал клиенту только то, что подтвердила платёжная система.', '<b>Closed without a human in 38 seconds.</b> The bot found the subscription, cancelled it and told the customer only what the payment system confirmed.')
          : S.sc === 'refund' && !stuck ? T('<b>Деньги вернулись за 41 секунду.</b> Фраза «мы вернули» ушла клиенту только после подтверждения платёжной системы.', '<b>Money back in 41 seconds.</b> The phrase "we refunded" reached the customer only after the payment system confirmed it.')
          : stuck ? T('<b>Ложное обещание не ушло клиенту.</b> Возврат завис, поэтому бот остановил письмо и передал его человеку с причиной.', '<b>A false promise never reached the customer.</b> The refund was stuck, so the bot blocked the email and handed it to a human with the reason.')
          : T('<b>Через 21 секунду письмо у менеджера</b> с фактами о платежах и черновиком на немецком. Денег бот не трогал.', '<b>In 21 seconds the email is with a manager</b>, with payment facts and a draft in German. The bot touched no money.'));
      }

      start('cancel', 'ok');

      return {
        reset: function () { seen = {}; start('cancel', 'ok'); },
        next: function () {
          if (S.running) return 'wait';
          if (!S.done) return runBtn;
          for (var i = 0; i < TOUR.length; i++) {
            var t = TOUR[i];
            if (seen[t[0] + '/' + t[1]]) continue;
            if (t[0] !== S.sc) return segSc.btn(t[0]);
            if (segPay && t[1] !== S.pay) return segPay.btn(t[1]);
            return runBtn;
          }
          return null;
        }
      };
    }
  });
})();
