/* Mini app: a bot that answers store reviews. Four reviews in four languages. The bot drafts a reply in the language of the review,
   a person decides in Slack (approve / edit / regenerate / skip), the bot publishes the reply and keeps it as an example.
   A copilot answers all negative reviews in one go, but only after a confirmation.
   Same structure as apps/support.js: state object S, paint functions that render from S, small incremental updates while the bot writes. */
(function () {
  'use strict';

  var CSS = [
    /* reviews list and the copilot block above it */
    '.reviews-feed{gap:10px}',
    '.reviews-cop{border:1px dashed var(--line);border-radius:14px;background:var(--card);padding:10px 12px;display:grid;gap:8px;min-width:0;transition:border-color .2s ease,box-shadow .2s ease}',
    '.reviews-cop.ask{border-style:solid;border-color:var(--acc);box-shadow:0 0 0 3px var(--acc-soft)}',
    '.reviews-cop-l{display:flex;gap:8px;align-items:flex-start;font-size:13px;line-height:1.4;color:var(--ink2);min-height:20px}',
    '.reviews-cop-l svg{width:16px;height:16px;flex:none;margin-top:1px;color:var(--acc-ink)}',
    '.reviews-cop-l b{color:var(--ink);font-weight:600}',
    '.reviews-cop.ask .reviews-cop-l{font-size:14px;color:var(--ink)}',
    '.reviews-cop-r{display:flex;flex-wrap:wrap;gap:8px;align-items:center;min-height:42px}',
    '.reviews-cop-r .bar{flex:1}',
    '.reviews-list{display:grid;gap:10px}',
    '.reviews-row{display:block;width:100%;text-align:left;cursor:pointer;transition:border-color .2s ease,box-shadow .2s ease}',
    '.reviews-row[aria-pressed="true"]{border-color:var(--acc);box-shadow:0 0 0 3px var(--acc-soft)}',
    '.reviews-top{display:flex;flex-wrap:wrap;align-items:center;gap:6px}',
    '.reviews-top .reviews-chip{margin-left:auto}',
    '.reviews-stars{display:inline-flex;gap:1px;flex:none;margin-right:2px}',
    '.reviews-stars svg{width:14px;height:14px;display:block;fill:var(--line);stroke:var(--line);stroke-width:1.4;stroke-linejoin:round}',
    '.reviews-stars svg.on{fill:var(--wait);stroke:var(--wait)}',
    '.reviews-q{display:block;margin-top:8px;line-height:1.45}',
    /* draft window */
    '.reviews-draft{padding:12px 14px;display:grid;gap:10px;align-content:start}',
    '.reviews-tags{display:flex;flex-wrap:wrap;gap:6px;min-height:22px}',
    '.reviews-text{font-size:14.5px;line-height:1.55;min-height:1.55em}',
    '.reviews-lim{display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px;font-size:12.5px;line-height:1.3;color:var(--ink3)}',
    '.reviews-lim .mono{font-size:12.5px;color:var(--ink2);min-width:74px}',
    '.reviews-lim .mono b{color:var(--ink);font-weight:700}',
    '.reviews-lim .bar{flex:1 1 90px;max-width:180px}',
    '.reviews-res{font-size:13.5px}',
    '.reviews-run{display:flex;align-items:center;gap:8px;font-size:13.5px;line-height:1.4;color:var(--ink3)}',
    '.okl.reviews-skip{color:var(--info)}',
    '.reviews-empty{display:grid;gap:12px;justify-items:start;font-size:13.5px;line-height:1.45;color:var(--ink3)}',
    '.reviews-empty>svg{width:22px;height:22px;color:var(--line)}',
    '.reviews-draft.reviews-mid,.reviews-slack.reviews-mid{align-content:center}',
    '.reviews-mid .reviews-empty{justify-items:center;text-align:center}',
    /* Slack card */
    '.reviews-sh{display:flex;align-items:center;gap:8px;font-size:14px;line-height:1.2}',
    '.reviews-sh i{width:28px;height:28px;border-radius:8px;background:var(--acc-soft);color:var(--acc-ink);display:grid;place-items:center;flex:none}',
    '.reviews-sh i svg{width:16px;height:16px}',
    '.reviews-sh b{font-weight:700}',
    '.reviews-sh time{font:500 11.5px/1 var(--fm);color:var(--ink3)}',
    '.reviews-meta{margin-top:8px;font-size:12.5px;line-height:1.35;color:var(--ink3)}',
    '.reviews-quote{margin-top:6px;border-left:3px solid var(--line);padding:1px 0 1px 10px;display:grid;gap:5px;justify-items:start;font-size:14px;line-height:1.4;color:var(--ink2)}',
    '.reviews-lbl{margin-top:10px;font:500 11px/1.3 var(--fm);letter-spacing:.05em;text-transform:uppercase;color:var(--ink3)}',
    '.reviews-prev{margin-top:4px;font-size:14px;line-height:1.5}',
    '.reviews-wr{display:flex;align-items:center;gap:8px;margin-top:4px;font-size:14px;line-height:1.5;color:var(--ink3)}',
    '.reviews-acts{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}',
    '.reviews-acts .btn{min-height:40px;padding:9px 12px;font-size:14px}',
    '.reviews-card .reviews-res{margin-top:12px}',
    '.reviews-card .reviews-run{margin-top:12px;min-height:40px}',
    /* on a desktop the right column keeps its height, so nothing jumps while drafts come and go */
    '@media (min-width:901px){.reviews-draft{min-height:212px}.reviews-slack{min-height:332px}.reviews-wr{min-height:4.5em;align-items:flex-start}',
    '.reviews-prev{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;overflow:hidden}}',
    '@media (max-width:640px){.feed.reviews-feed{padding:8px}.reviews-row{padding:11px 12px}.reviews-row .tg{font-size:11px;padding:5px 6px}',
    '.reviews-row .reviews-stars svg{width:12px;height:12px}.reviews-acts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}.reviews-acts .btn{font-size:13.5px;padding:9px 8px}}',
    '@media (hover:hover) and (pointer:fine){.reviews-row:hover{border-color:var(--ink3)}.reviews-row[aria-pressed="true"]:hover{border-color:var(--acc)}}'
  ].join('');

  PF.app('reviews', {
    cap: [
      'Макет на выдуманных данных. Настоящий бот так же пишет черновики ответов, а человек одобряет их в Slack.',
      'A mock on invented data. The real bot drafts replies the same way and a person approves them in Slack.'
    ],
    pace: 1500,
    mount: function (ctx) {
      var T = ctx.T, h = ctx.h, icon = ctx.icon, esc = ctx.esc;
      if (!document.getElementById('pf-reviews-css')) document.head.appendChild(h('style', { id: 'pf-reviews-css', text: CSS }));

      /* ---------- invented data: four reviews, two canned drafts and one canned human edit for each ---------- */
      var LIMIT = 350;
      var AS = { name: 'App Store', at: T('в App Store', 'in the App Store') };
      var GP = { name: 'Google Play', at: T('в Google Play', 'on Google Play'), lim: true };
      var REV = [
        {
          stars: 1, store: AS, loc: 'US', lang: 'EN', app: T('Фото-приложение', 'Photo app'), topic: 'billing',
          src: T('шаблон: списание после отмены', 'template: charged after cancelling'),
          srcLog: T('шаблон «списание после отмены»', 'the "charged after cancelling" template'),
          text: 'Cancelled my subscription last week and got charged again today. Give me my money back!',
          v: [
            'Hi! Sorry about the charge after you cancelled. App Store subscriptions are billed by Apple, so the refund is requested there: reportaproblem.apple.com. If the charge came after your cancellation date, write to us from the app (Settings → Help) and we will check it with you.',
            'Hello, and sorry for the trouble: a charge after cancelling should not happen. Apple handles App Store payments, so please request the refund at reportaproblem.apple.com. If Apple declines, message us from the app (Settings → Help) and we will look into it together.'
          ],
          fx: [
            ['Hi! Sorry about the charge after you cancelled.', 'Hi! We are sorry you were charged after cancelling, we know how annoying that is.'],
            ['Hello, and sorry for the trouble: a charge after cancelling should not happen.', 'Hello, we are sorry: a charge after cancelling should not happen, and we know how annoying that is.']
          ]
        },
        {
          stars: 2, store: GP, loc: 'US', lang: 'ES', app: T('Музыкальное приложение', 'Music app'), topic: 'ads',
          src: T('шаблон: слишком много рекламы', 'template: too many ads'),
          srcLog: T('шаблон «слишком много рекламы»', 'the "too many ads" template'),
          mis: T('Регион магазина US, а отзыв на испанском. Язык ответа бот берёт из текста отзыва, а не из локали магазина.', 'The store region is US, but the review is in Spanish. The bot takes the reply language from the review text, not from the store locale.'),
          text: 'Demasiados anuncios. Cada dos canciones sale un vídeo de 30 segundos.',
          v: [
            '¡Hola! Gracias por tu opinión. Sentimos que los anuncios te molesten: gracias a ellos la versión básica es gratis. Hemos pasado tu comentario al equipo. Si prefieres escuchar sin pausas, puedes probar la versión Premium.',
            'Hola, gracias por contárnoslo. Entendemos que tantos vídeos seguidos cansan. Los anuncios nos permiten mantener la app gratis. Estamos revisando su frecuencia. Mientras tanto, la versión Premium funciona sin anuncios.'
          ],
          fx: [
            ['Hemos pasado tu comentario al equipo.', 'En la próxima actualización habrá menos vídeos entre canciones.'],
            ['Estamos revisando su frecuencia.', 'En la próxima actualización habrá menos vídeos entre canciones.']
          ]
        },
        {
          stars: 5, store: AS, loc: 'DE', lang: 'RU', app: T('Фото-приложение', 'Photo app'), topic: 'praise',
          src: T('похожий одобренный ответ', 'a similar approved answer'),
          srcLog: T('похожий одобренный ответ', 'a similar approved answer'),
          mis: T('Регион магазина DE, а отзыв на русском. Язык ответа снова взят из текста отзыва.', 'The store region is DE, but the review is in Russian. Again the reply language comes from the review text.'),
          text: 'Лучший редактор фото, пользуюсь каждый день. Спасибо!',
          v: [
            'Спасибо за тёплые слова! Рады, что редактор пригодился и вы открываете его каждый день. Если захочется новую функцию, напишите нам через «Помощь» в приложении.',
            'Спасибо, что нашли минуту на отзыв! Нам важно знать, что редактором удобно пользоваться каждый день. Появятся идеи, что добавить, пишите через «Помощь» в приложении.'
          ],
          fx: [
            ['Спасибо за тёплые слова!', 'Спасибо за пять звёзд и тёплые слова!'],
            ['Спасибо, что нашли минуту на отзыв!', 'Спасибо за пять звёзд и за минуту на отзыв!']
          ]
        },
        {
          stars: 1, store: GP, loc: 'DE', lang: 'DE', app: T('Музыкальное приложение', 'Music app'), topic: 'bug',
          src: T('шаблон: сбой при запуске', 'template: crash on start'),
          srcLog: T('шаблон «сбой при запуске»', 'the "crash on start" template'),
          text: 'Seit dem Update stürzt die App beim Start ab. Nichts geht mehr!',
          v: [
            'Hallo! Es tut uns leid, dass die App seit dem Update beim Start abstürzt. Wir haben den Fehler an unsere Entwickler weitergegeben. Bitte installieren Sie das nächste Update, sobald es verfügbar ist. Bleibt das Problem, schreiben Sie uns über den Kontakt auf der Store-Seite.',
            'Guten Tag, danke für Ihre Meldung und entschuldigen Sie den Ärger. Der Absturz beim Start ist uns bekannt, wir arbeiten an einer Korrektur. Bitte aktualisieren Sie die App, sobald die neue Version da ist. Hilft das nicht, erreichen Sie uns über den Kontakt auf der Store-Seite.'
          ],
          fx: [
            ['Bitte installieren Sie das nächste Update, sobald es verfügbar ist.', 'Die Korrektur kommt diese Woche mit dem nächsten Update.'],
            ['Bitte aktualisieren Sie die App, sobald die neue Version da ist.', 'Die neue Version mit der Korrektur kommt diese Woche.']
          ]
        }
      ];
      var CHIP = {
        wait: ['tg-hum', T('ждёт', 'waiting')],
        typing: ['tg-acc', T('бот пишет', 'writing')],
        draft: ['tg-wait', T('черновик', 'draft')],
        pub: ['tg-ok', T('опубликован', 'published')],
        skip: ['tg-info', T('пропущен', 'skipped')]
      };
      /* how long autoplay lets the viewer read a fresh draft or a result before the next press */
      var HOLD_DRAFT = 2400, HOLD_PUB = 1000;

      /* ---------- state ---------- */
      var S, B = {}, copMode = '', runTxt = null, runBar = null;
      function fresh() {
        return {
          sel: 0, first: true, busy: false, hold: 0, bulk: null, done: 0, total: 0, clicks: 0, learned: 0, clock: 0,
          r: REV.map(function () { return { st: 'wait', v: 0, n: 0, ed: false, typing: false, sending: false, how: '', ex: false, at: '' }; })
        };
      }
      function two(n) { return (n < 10 ? '0' : '') + n; }
      function tm(add) {
        S.clock += add;
        var t = 10 * 3600 + 42 * 60 + 7 + S.clock;
        return two(Math.floor(t / 3600) % 24) + ':' + two(Math.floor(t / 60) % 60) + ':' + two(t % 60);
      }
      function ruN(n, one, few, many) { var a = n % 10, b = n % 100; return a === 1 && b !== 11 ? one : a >= 2 && a <= 4 && (b < 12 || b > 14) ? few : many; }
      function isOpen(i) { return S.r[i].st === 'wait' || S.r[i].st === 'draft'; }
      function neg() { var a = []; REV.forEach(function (d, i) { if (d.stars <= 2 && isOpen(i)) a.push(i); }); return a; }
      function left() { var n = 0; REV.forEach(function (d, i) { if (isOpen(i)) n++; }); return n; }
      function published() { return S.r.filter(function (r) { return r.st === 'pub'; }).length; }
      function txt(i) { var d = REV[i], r = S.r[i], f = d.fx[r.v]; return r.ed ? d.v[r.v].replace(f[0], function () { return f[1]; }) : d.v[r.v]; }
      function txtHtml(i, flash) {
        var d = REV[i], r = S.r[i], f = d.fx[r.v], t = esc(d.v[r.v]);
        return r.ed ? t.replace(esc(f[0]), function () { return '<mark class="good' + (flash ? ' flash' : '') + '">' + esc(f[1]) + '</mark>'; }) : t;
      }
      /* autoplay waits while S.hold is set; the visitor's own buttons stay live */
      function rest(ms) { var s = S; s.hold++; ctx.later(function () { s.hold--; }, ms); }

      /* ---------- small builders ---------- */
      function stars(n) {
        var s = '';
        for (var k = 1; k <= 5; k++) s += '<svg viewBox="0 0 24 24"' + (k <= n ? ' class="on"' : '') + '><path d="M12 2.5l2.47 6.6 7.04.31-5.52 4.39 1.89 6.79L12 16.7l-5.88 3.89 1.89-6.79-5.52-4.39 7.04-.31z"/></svg>';
        return h('span.reviews-stars', { role: 'img', 'aria-label': T(n + ' из 5', n + ' out of 5'), html: s });
      }
      function dots() { return h('span.typing', null, h('i'), h('i'), h('i')); }
      function tagLang(d) { return h('span.tg.tg-info', null, T('язык: ', 'language: ') + d.lang + T(' · по тексту отзыва', ' · from the review text')); }
      function tagTopic(d) { return h('span.tg.tg-hum', null, T('тема: ', 'topic: ') + d.topic); }
      function tagSrc(d) { return h('span.tg.tg-hum', null, d.src); }
      function tagVar(r) { return h('span.tg.tg-hum', null, T('вариант ', 'variant ') + (r.v + 1)); }
      function limRow(n, fin) {
        var num = h('b', null, String(n)), fill = h('i'), bar = h('div.bar' + (fin ? '.ok' : ''), null, fill);
        fill.style.width = Math.min(100, n / LIMIT * 100) + '%';
        return {
          el: h('div.reviews-lim', null, h('span.mono', null, num, ' / ' + LIMIT), bar, h('span', null, T('лимит Google Play, бот за ним следит', 'Google Play limit, enforced by the bot'))),
          set: function (v, done) { num.textContent = String(v); fill.style.width = Math.min(100, v / LIMIT * 100) + '%'; if (done) bar.classList.add('ok'); }
        };
      }
      function resLine(i, pop) {
        var d = REV[i], r = S.r[i];
        if (r.sending) return h('p.reviews-run', null, dots(), h('span', null, T('бот публикует ответ ', 'the bot is publishing the reply ') + d.store.at + '…'));
        if (r.st === 'draft') return h('p.wtl.reviews-res', null, icon('clock'), h('span', null, T('Ждёт решения человека в Slack', 'Waiting for a person to decide in Slack')));
        if (r.st === 'pub') return h('p.okl.reviews-res' + (pop ? '.in-pop' : ''), null, icon('check'), h('span', null, T('Опубликован ', 'Published ') + d.store.at));
        return h('p.okl.reviews-skip.reviews-res', null, icon('x'), h('span', null, T('Пропущен: ответ не опубликован', 'Skipped: no reply was published')));
      }

      /* ---------- static frame ---------- */
      var copEl = h('div.reviews-cop');
      var listEl = h('div.reviews-list');
      var rows = REV.map(function (d, i) {
        var chip = h('span.tg.reviews-chip');
        var el = h('button.bc.reviews-row', { type: 'button', 'aria-pressed': 'false', onclick: function () { select(i); } },
          h('span.reviews-top', null, stars(d.stars), h('span.tg.tg-hum', null, d.store.name), h('span.tg.tg-info', null, d.lang), chip),
          h('span.reviews-q', null, d.text));
        listEl.appendChild(el);
        return { el: el, chip: chip, key: null };
      });
      var draftBody = h('div.reviews-draft');
      var slackBody = h('div.feed.reviews-slack');
      var log = ctx.logger(T('Пока пусто. Сюда попадёт каждый шаг бота и каждое решение человека.', 'Empty for now. Every step of the bot and every human decision lands here.'), T('бот', 'bot'));
      var cnt = ctx.counters([
        ['pub', T('опубликовано', 'published')],
        ['ex', T('примеров выучено', 'examples learned')],
        ['wait', T('ждут ответа', 'waiting for a reply'), String(REV.length)],
        ['clk', T('кликов человека', 'human clicks')]
      ]);
      var winRev = ctx.win('star', T('Отзывы', 'Reviews'), T('2 приложения · 2 магазина', '2 apps · 2 stores'), h('div.feed.reviews-feed', null, copEl, listEl));
      var winDraft = ctx.win('edit', T('Черновик ответа', 'Draft reply'), '', draftBody);
      var winSlack = ctx.win('hash', 'Slack · #reviews', T('или в веб-панели', 'or in a web panel'), slackBody);
      var winLog = ctx.win('log', T('Журнал', 'Log'), T('время условное', 'time is illustrative'), log.el, cnt.el);
      winRev.classList.add('o1'); winDraft.classList.add('o2'); winSlack.classList.add('o3'); winLog.classList.add('o4'); winLog.classList.add('demo-wide');
      ctx.body.appendChild(h('div.demo-grid.flow', null,
        h('div.demo-col', null, winRev),
        h('div.demo-col', null, winDraft, winSlack)));
      ctx.body.appendChild(winLog);

      /* ---------- paint from state ---------- */
      function paintRows() {
        rows.forEach(function (w, i) {
          var r = S.r[i], key = r.typing ? 'typing' : r.st;
          w.el.setAttribute('aria-pressed', String(S.sel === i));
          if (w.key === key) return;
          var first = w.key == null;
          w.key = key;
          w.chip.className = 'tg reviews-chip ' + CHIP[key][0];
          w.chip.textContent = CHIP[key][1];
          if (!first) { void w.chip.offsetWidth; w.chip.classList.add('in-pop'); }
        });
      }

      function copLine(html) { return h('p.reviews-cop-l', null, icon('bot'), h('span', { html: html })); }
      function runHtml() { return '<b>Copilot</b>' + T(' отвечает: готово ', ' is answering: ') + S.done + T(' из ', ' of ') + S.total + T('', ' done'); }
      function paintCop() {
        var q = neg(), k = q.length;
        if (S.bulk === 'ask' && !k) S.bulk = null;
        var mode = S.bulk || 'idle';
        if (mode === 'run' && copMode === 'run') {
          runTxt.innerHTML = runHtml();
          runBar.style.width = Math.round(S.done / S.total * 100) + '%';
          return;
        }
        copMode = mode;
        copEl.innerHTML = ''; B.cop = B.yes = B.no = null;
        copEl.className = 'reviews-cop' + (mode === 'ask' ? ' ask' : '');
        if (mode === 'ask') {
          B.yes = h('button.btn.btn-acc', { type: 'button', onclick: confirmBulk, disabled: S.busy }, icon('check'), T('Подтвердить', 'Confirm'));
          B.no = h('button.btn', { type: 'button', onclick: cancelBulk, disabled: S.busy }, T('Отмена', 'Cancel'));
          copEl.appendChild(copLine('<b>Copilot:</b> ' + T(k + ' ' + ruN(k, 'негативный отзыв', 'негативных отзыва', 'негативных отзывов'), k + (k === 1 ? ' negative review' : ' negative reviews')) +
            ' (' + q.map(function (i) { return REV[i].lang; }).join(', ') + '). ' + T('Подтвердить?', 'Confirm?')));
          copEl.appendChild(h('div.reviews-cop-r', null, B.yes, B.no));
        } else if (mode === 'run') {
          var line = copLine(runHtml());
          runTxt = line.lastChild;
          runBar = h('i'); runBar.style.width = '0%';
          copEl.appendChild(line);
          copEl.appendChild(h('div.reviews-cop-r', null, h('div.bar', null, runBar)));
        } else {
          B.cop = h('button.btn', { type: 'button', onclick: askBulk, disabled: S.busy || !k }, icon('bolt'), T('Ответить на все негативные', 'Answer all negative ones'));
          copEl.appendChild(copLine('<b>Copilot</b> · ' + (k ? T('сначала спросит подтверждение', 'asks for a confirmation first') : T('негативных отзывов без ответа нет', 'no negative reviews left unanswered'))));
          copEl.appendChild(h('div.reviews-cop-r', null, B.cop));
        }
      }

      function paintDraft(anim) {
        var i = S.sel, d = REV[i], r = S.r[i];
        if (r.typing) return; /* compose() owns the window while the bot is writing */
        winDraft.note(d.store.name + T(' · регион ', ' · region ') + d.loc);
        draftBody.innerHTML = ''; B.write = null;
        draftBody.classList.toggle('reviews-mid', r.st === 'wait');
        if (r.st === 'wait') {
          B.write = h('button.btn.btn-acc', { type: 'button', onclick: write, disabled: S.busy }, icon('bot'), T('Написать черновик', 'Write a draft'));
          draftBody.appendChild(h('div.reviews-empty', null, h('p', null, T('Бот ещё не отвечал на этот отзыв.', 'The bot has not replied to this review yet.')), B.write));
          return;
        }
        var tags = h('div.reviews-tags', null, tagLang(d), tagTopic(d), tagSrc(d));
        if (r.n) tags.appendChild(tagVar(r));
        if (r.ed) tags.appendChild(h('span.tg.tg-ok' + (anim === 'edit' ? '.in-pop' : ''), null, T('поправил человек', 'edited by a person')));
        draftBody.appendChild(tags);
        draftBody.appendChild(h('p.reviews-text', { html: txtHtml(i, anim === 'edit') }));
        if (d.store.lim) draftBody.appendChild(limRow(txt(i).length, true).el);
        draftBody.appendChild(resLine(i, anim === 'pub'));
      }

      function paintSlack(anim) {
        var i = S.sel, d = REV[i], r = S.r[i];
        slackBody.innerHTML = ''; B.ok = B.ed = B.re = B.sk = null;
        slackBody.classList.toggle('reviews-mid', r.st === 'wait');
        if (r.st === 'wait') {
          slackBody.appendChild(h('div.reviews-empty', null, icon('hash'), h('p', null, r.typing
            ? T('Бот пишет черновик. Карточка с кнопками сейчас появится здесь.', 'The bot is writing a draft. A card with buttons is about to appear here.')
            : T('Карточка с кнопками появится здесь, когда бот напишет черновик.', 'A card with buttons appears here once the bot has written a draft.'))));
          return;
        }
        var card = h('div.bc.reviews-card' + (r.st === 'draft' ? '.mine' : '') + (anim === 'card' ? '.in-pop' : ''), null,
          h('div.reviews-sh', null, h('i', null, icon('bot')), h('b', null, T('Бот отзывов', 'Review bot')), h('span.tg.tg-hum', null, 'APP'), h('time', null, r.at)),
          h('p.reviews-meta', null, d.app + ' · ' + d.store.name + ' · ' + d.loc),
          h('div.reviews-quote', null, stars(d.stars), h('span', null, d.text)),
          h('p.reviews-lbl', null, T('Черновик ответа · ', 'Draft reply · ') + d.lang + (r.n ? T(' · вариант ', ' · variant ') + (r.v + 1) : '') + (r.ed ? T(' · поправил человек', ' · edited by a person') : '')),
          r.typing
            ? h('p.reviews-wr', null, dots(), h('span', null, T('бот пишет другой вариант…', 'the bot is writing another variant…')))
            : h('p.reviews-prev' + (anim === 'prev' ? '.in-pop' : ''), { html: txtHtml(i, anim === 'edit') }));
        if (r.sending) {
          card.appendChild(resLine(i));
        } else if (r.st === 'draft') {
          B.ok = h('button.btn.btn-acc', { type: 'button', onclick: approve, disabled: S.busy }, icon('check'), T('Одобрить', 'Approve'));
          B.ed = h('button.btn', { type: 'button', onclick: edit, disabled: S.busy || r.ed }, r.ed ? T('Поправлено', 'Edited') : T('Поправить', 'Edit'));
          B.re = h('button.btn', { type: 'button', onclick: regen, disabled: S.busy }, T('Другой вариант', 'Regenerate'));
          B.sk = h('button.btn', { type: 'button', onclick: skip, disabled: S.busy }, T('Пропустить', 'Skip'));
          card.appendChild(h('div.reviews-acts', null, B.ok, B.ed, B.re, B.sk));
        } else if (r.st === 'pub') {
          card.appendChild(h('p.okl.reviews-res' + (anim === 'pub' ? '.in-pop' : ''), null, icon('check'),
            h('span', null, T('Опубликован ', 'Published ') + d.store.at + (r.how === 'bulk' ? T(' · подтверждено в copilot', ' · confirmed in the copilot') : ''))));
          if (r.ex) card.appendChild(h('p.thr' + (anim === 'ex' ? '.in-pop' : ''), null, r.ed
            ? T('Правка человека стала примером для бота: +1 пример', "The person's edit became an example for the bot: +1 example")
            : T('Бот запомнил ответ: +1 пример', 'The bot remembered the answer: +1 example')));
        } else {
          card.appendChild(resLine(i));
          card.appendChild(h('p.thr', null, T('В примеры он не попал: бот учится на одобренных ответах.', 'It did not become an example: the bot learns from approved answers.')));
        }
        slackBody.appendChild(card);
      }

      function paintCnt() {
        cnt.set('pub', String(published())); cnt.set('ex', String(S.learned)); cnt.set('wait', String(left())); cnt.set('clk', String(S.clicks));
      }
      function paint(anim) { paintRows(); paintCop(); paintDraft(anim); paintSlack(anim); paintCnt(); }

      /* ---------- hint line and outcome ---------- */
      function hint() {
        var r = S.r[S.sel], k = neg().length;
        if (!left()) {
          ctx.now(T('Все четыре отзыва разобраны. Нажмите «Сначала» и попробуйте другие кнопки: «Другой вариант», «Пропустить» или «Отмена» у copilot.', 'All four reviews are handled. Press "Reset" and try the other buttons: "Regenerate", "Skip" or "Cancel" in the copilot.'));
        } else if (S.bulk === 'ask') {
          ctx.now(T('Copilot ничего не делает без подтверждения. Нажмите <b>«Подтвердить»</b> или «Отмена».', 'The copilot does nothing without a confirmation. Press <b>"Confirm"</b> or "Cancel".'));
        } else if (r.st === 'wait') {
          ctx.now(S.first
            ? T('Пришли четыре отзыва на четырёх языках. Первый уже выбран: нажмите <b>«Написать черновик»</b>.', 'Four reviews in four languages have arrived. The first one is selected: press <b>"Write a draft"</b>.')
            : T('Нажмите <b>«Написать черновик»</b>: бот ответит на языке отзыва.', 'Press <b>"Write a draft"</b>: the bot will reply in the language of the review.'));
        } else if (r.st === 'draft') {
          ctx.now(r.ed
            ? T('Правка внесена. Нажмите <b>«Одобрить»</b>: бот опубликует ваш вариант и запомнит его.', 'The edit is in. Press <b>"Approve"</b>: the bot will publish your version and remember it.')
            : T('Черновик пришёл в Slack. Решает человек: <b>«Одобрить»</b>, поправить, попросить другой вариант или пропустить.', 'The draft is in Slack. A person decides: <b>"Approve"</b>, edit, ask for another variant or skip.'));
        } else {
          ctx.now((r.st === 'pub'
            ? T('Ответ опубликован, бот запомнил его как пример. ', 'The reply is published and the bot remembered it as an example. ')
            : T('Отзыв пропущен, ответ не опубликован. ', 'The review is skipped, no reply was published. ')) +
            (k ? T('Выберите следующий отзыв или дайте команду copilot: <b>«Ответить на все негативные»</b>.', 'Pick the next review or give the copilot a command: <b>"Answer all negative ones"</b>.')
               : T('Выберите следующий отзыв в списке.', 'Pick the next review in the list.')));
        }
      }
      function outcome() {
        if (left()) return;
        var p = published(), n = S.clicks;
        var clicks = T(n + ' ' + ruN(n, 'клик', 'клика', 'кликов'), n + (n === 1 ? ' click' : ' clicks'));
        ctx.end(p === REV.length
          ? T('<b>Все четыре отзыва получили ответ на своём языке.</b> Тексты писал бот, человек только нажимал кнопки: ' + clicks + '. Каждый одобренный ответ стал примером для следующих.',
              '<b>All four reviews got a reply in their own language.</b> The bot wrote the texts, a person only pressed buttons: ' + clicks + '. Every approved answer became an example for the next ones.')
          : p
            ? T('<b>Опубликовано ответов: ' + p + ' из 4, пропущено: ' + (REV.length - p) + '.</b> Без решения человека бот не опубликовал ни одного ответа. Каждый одобренный ответ стал примером для следующих.',
                '<b>Replies published: ' + p + ' of 4, skipped: ' + (REV.length - p) + ".</b> The bot published nothing without a person's decision. Every approved answer became an example for the next ones.")
            : T('<b>Ни один ответ не опубликован.</b> Человек пропустил все четыре отзыва, и бот ничего не отправил сам.',
                '<b>No reply was published.</b> A person skipped all four reviews, and the bot sent nothing on its own.'));
      }
      /* on a phone: back to the list while reviews are left, down to the counters when everything is handled */
      function settle(ms) { ctx.later(function () { ctx.focus(left() ? winRev : winLog); }, ms); }

      /* ---------- the bot writes a draft: mode 'new' (first draft), 'redo' (another variant), 'bulk' (copilot) ---------- */
      function compose(i, mode, done) {
        var d = REV[i], r = S.r[i], redo = mode === 'redo', k = mode === 'bulk' ? 0.7 : 1;
        S.busy = true; r.typing = true;
        paintRows(); paintCop(); paintSlack();
        winDraft.note(d.store.name + T(' · регион ', ' · region ') + d.loc);
        draftBody.classList.remove('reviews-mid');
        draftBody.innerHTML = ''; B.write = null;
        var tags = h('div.reviews-tags'), p = h('p.reviews-text'), lim = d.store.lim ? limRow(0) : null;
        var say = h('span', null, redo ? T('бот пишет другой вариант…', 'the bot is writing another variant…') : T('бот читает отзыв…', 'the bot is reading the review…'));
        draftBody.appendChild(tags); draftBody.appendChild(p);
        if (lim) draftBody.appendChild(lim.el);
        draftBody.appendChild(h('p.reviews-run', null, dots(), say));
        function add(el) { el.classList.add('in-pop'); tags.appendChild(el); }
        function go() {
          var text = txt(i), fin = false;
          if (!redo) say.textContent = T('бот пишет ответ на языке отзыва: ', "the bot is writing in the review's language: ") + d.lang;
          if (lim) (function poll() { if (fin) return; lim.set(p.textContent.length); ctx.later(poll, 90); })();
          ctx.type(p, text, function () {
            fin = true;
            if (lim) lim.set(text.length, true);
            ctx.later(function () {
              var t = tm(7), len = d.store.lim ? T(', ' + text.length + ' из ' + LIMIT + ' знаков', ', ' + text.length + ' of ' + LIMIT + ' characters') : '';
              r.typing = false; r.st = 'draft'; r.at = t.slice(0, 5);
              if (redo) log.add(t, T('Написан вариант ' + (r.v + 1) + ' (' + d.lang + len + ')', 'Variant ' + (r.v + 1) + ' written (' + d.lang + len + ')'), 'sys');
              else if (done) log.add(t, T('Черновик (' + d.lang + len + ') готов', 'Draft (' + d.lang + len + ') is ready'), 'sys');
              else log.add(t, T('Черновик (' + d.lang + len + ') отправлен в Slack #reviews', 'Draft (' + d.lang + len + ') sent to Slack #reviews'), 'sys');
              if (done) { done(); return; }
              S.busy = false;
              paint(redo ? 'prev' : 'card'); hint(); rest(HOLD_DRAFT);
              ctx.focus(winSlack);
            }, 450 * k);
          }, mode === 'bulk' ? 45 : 65);
        }
        if (redo) {
          tags.appendChild(tagLang(d)); tags.appendChild(tagTopic(d)); tags.appendChild(tagSrc(d)); add(tagVar(r));
          ctx.later(go, 800);
          return;
        }
        ctx.later(function () {
          add(tagLang(d));
          log.add(tm(2), T('Отзыв ' + d.stars + '★, ' + d.store.name + ', регион ' + d.loc + '. Язык по тексту отзыва: ' + d.lang, d.stars + '★ review, ' + d.store.name + ', ' + d.loc + ' region. Language from the review text: ' + d.lang), 'sys');
        }, 700 * k);
        ctx.later(function () { add(tagTopic(d)); }, 1500 * k);
        ctx.later(function () {
          add(tagSrc(d));
          log.add(tm(3), T('Тема: ' + d.topic + '. Взят ' + d.srcLog, 'Topic: ' + d.topic + '. Source: ' + d.srcLog), 'sys');
        }, 2300 * k);
        ctx.later(go, 3100 * k);
      }

      /* ---------- the bot publishes an approved reply and keeps it as an example ---------- */
      function publish(i, how, done) {
        var d = REV[i], r = S.r[i];
        S.busy = true; r.sending = true; r.how = how;
        paint();
        ctx.later(function () {
          r.sending = false; r.st = 'pub';
          log.add(tm(3), T('Ответ опубликован ', 'Reply published ') + d.store.at, 'sys');
          paint('pub');
          ctx.later(function () {
            r.ex = true; S.learned++;
            log.add(tm(1), r.ed ? T('Правка человека сохранена как пример: +1', "The person's edit is saved as an example: +1") : T('Ответ сохранён как пример: +1', 'The answer is saved as an example: +1'), 'sys');
            if (done) { paintSlack('ex'); paintCnt(); done(); return; }
            S.busy = false;
            paint('ex'); hint(); outcome(); rest(HOLD_PUB); settle(1000);
          }, 800);
        }, 1000);
      }

      /* ---------- what the visitor presses ---------- */
      function select(i) {
        if (S.busy) return;
        if (S.sel !== i) { S.sel = i; S.first = false; paintRows(); paintDraft(); paintSlack(); hint(); }
        ctx.focus(winDraft);
      }
      function write() {
        var i = S.sel;
        if (S.busy || S.r[i].st !== 'wait') return;
        S.first = false;
        ctx.now(REV[i].mis || T('Бот определяет язык и тему отзыва, берёт шаблон или похожий одобренный ответ и пишет черновик.', 'The bot detects the language and the topic of the review, takes a template or a similar approved answer and writes a draft.'));
        compose(i, 'new');
      }
      function approve() {
        var i = S.sel;
        if (S.busy || S.r[i].st !== 'draft') return;
        S.clicks++;
        log.add(tm(34), T('Человек нажал «Одобрить» в Slack', 'A person pressed "Approve" in Slack'));
        ctx.now(T('Бот публикует ответ и запоминает его как пример.', 'The bot publishes the reply and remembers it as an example.'));
        publish(i, 'slack');
      }
      function edit() {
        var i = S.sel, r = S.r[i];
        if (S.busy || r.st !== 'draft' || r.ed) return;
        S.clicks++; r.ed = true;
        log.add(tm(41), T('Человек поправил черновик в Slack', 'A person edited the draft in Slack'));
        paint('edit'); hint(); rest(900);
      }
      function regen() {
        var i = S.sel, r = S.r[i];
        if (S.busy || r.st !== 'draft') return;
        S.clicks++; r.v = 1 - r.v; r.n++; r.ed = false;
        log.add(tm(18), T('Человек попросил другой вариант', 'A person asked for another variant'));
        ctx.now(T('Бот пишет другой вариант ответа. Решение всё равно останется за человеком.', 'The bot is writing another variant. The decision still stays with a person.'));
        paintCnt();
        compose(i, 'redo');
      }
      function skip() {
        var i = S.sel, r = S.r[i];
        if (S.busy || r.st !== 'draft') return;
        S.clicks++; r.st = 'skip';
        log.add(tm(12), T('Человек нажал «Пропустить»: ответ не опубликован', 'A person pressed "Skip": no reply was published'), 'warn');
        paint(); hint(); outcome(); rest(900); settle(900);
      }
      function askBulk() {
        var k = neg().length;
        if (S.busy || S.bulk || !k) return;
        S.clicks++; S.bulk = 'ask'; S.first = false;
        log.add(tm(20), T('Команда copilot: ответить на все негативные', 'Copilot command: answer all negative ones'));
        log.add(tm(1), T('Copilot нашёл негативные отзывы без ответа: ' + k + '. Ждёт подтверждения', 'The copilot found unanswered negative reviews: ' + k + '. Waiting for a confirmation'), 'sys');
        paintCop(); paintCnt(); hint(); rest(700);
      }
      function cancelBulk() {
        if (S.busy || S.bulk !== 'ask') return;
        S.clicks++; S.bulk = null;
        log.add(tm(6), T('Человек нажал «Отмена»: copilot ничего не сделал', 'A person pressed "Cancel": the copilot did nothing'));
        paintCop(); paintCnt(); hint();
      }
      function confirmBulk() {
        var q = neg();
        if (S.busy || S.bulk !== 'ask' || !q.length) return;
        S.clicks++; S.bulk = 'run'; S.busy = true; S.done = 0; S.total = q.length;
        log.add(tm(5), T('Человек подтвердил команду copilot', 'A person confirmed the copilot command'));
        ctx.now(T('Copilot отвечает на негативные отзывы по одному: пишет черновик на языке отзыва и публикует.', "The copilot answers the negative reviews one by one: it writes a draft in the review's language and publishes it."));
        paint();
        (function next() {
          if (!q.length) {
            S.bulk = null; S.busy = false;
            log.add(tm(1), T('Copilot закончил. Опубликовано ответов: ' + S.total, 'The copilot is done. Replies published: ' + S.total), 'sys');
            paint(); hint(); outcome(); rest(1200); settle(900);
            if (left()) ctx.now(T('Copilot закончил, ответы опубликованы. Выберите оставшийся отзыв в списке.', 'The copilot is done and the replies are published. Pick the remaining review in the list.'));
            return;
          }
          var i = q.shift();
          S.sel = i; paint(); ctx.focus(rows[i].el);
          ctx.later(function () {
            var send = function () { publish(i, 'bulk', function () { S.done++; paintCop(); ctx.later(next, 700); }); };
            if (S.r[i].st === 'wait') compose(i, 'bulk', send); else send();
          }, 500);
        })();
      }

      /* ---------- start, reset, autoplay ---------- */
      function start() {
        S = fresh(); copMode = '';
        rows.forEach(function (w) { w.key = null; });
        log.clear(); ctx.end(null);
        paint(); hint();
      }
      /* one review of the tour: select it, let the bot write, optionally edit, approve */
      function step(i, withEdit) {
        var r = S.r[i];
        if (!isOpen(i)) return null;
        if (S.sel !== i) return rows[i].el;
        if (r.st === 'wait') return B.write;
        return withEdit && !r.ed ? B.ed : B.ok;
      }

      start();

      return {
        reset: start,
        /* tour: review 1 approve, review 2 edit and approve, copilot for the negative ones that are left, then the 5-star review */
        next: function () {
          if (S.busy || S.hold) return 'wait';
          if (S.bulk === 'ask') return B.yes;
          var n = step(0, false) || step(1, true);
          if (n) return n;
          if (neg().length) return B.cop;
          return step(2, false) || step(3, false);
        }
      };
    }
  });
})();
