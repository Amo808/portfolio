/* Mini app: AI concierge for hotels and residences. Three sides of one product, switched in the bar:
   the guest (QR in the room -> Telegram Mini App catalogue of partner services, voice / photo / PDF, an invoice in chat),
   the manager (dashboard with sections and statuses, three AI reply variants, a tone guard, ticket cards in Telegram)
   and the partner onboarding wizard (account -> channel -> categories -> managers -> launch, White Label is one small block).
   Structure follows apps/support.js: state object S, a base render per side, small incremental updates while it runs. */
(function () {
  'use strict';

  var CSS = [
    '.concierge-phone .phone-in{height:560px;min-height:0}',
    '.concierge-phone .phone-h i svg{width:16px;height:16px}',
    '.concierge-phone .phone-h>div{min-width:0;line-height:1.3}',
    '.concierge-phone .chat{min-height:0;overflow-y:auto;scrollbar-width:thin}',
    '.concierge-phone .chat>:first-child{margin-top:auto}',
    '.concierge-phone .msg{max-width:90%}',
    '.concierge-phone .qr{padding-top:10px;border-top:1px solid var(--line2)}',
    '.concierge-phone .qr:empty{display:none}',
    '.concierge-phone .qr button{display:inline-flex;align-items:center;gap:6px}',
    '.concierge-phone .qr button svg{width:15px;height:15px;flex:none}',
    '.concierge-scan{margin:auto;display:grid;justify-items:center;gap:14px;padding:12px;text-align:center}',
    '.concierge-scan p{max-width:24ch;font-size:13.5px;line-height:1.4;color:var(--ink2)}',
    '.concierge-qrc{width:116px;height:116px;padding:10px;border-radius:14px;background:var(--ink);color:var(--bg)}',
    '.concierge-qrc svg{display:block;width:100%;height:100%}',
    '.concierge-cat{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;width:100%}',
    '.concierge-tile{display:grid;gap:3px;text-align:left;padding:9px 10px;border-radius:12px;border:1px solid var(--line);background:var(--card);color:var(--ink);font:600 13.5px/1.25 var(--fb);cursor:pointer;min-height:58px;min-width:0}',
    '.concierge-tile small{font:400 11.5px/1.3 var(--fb);color:var(--ink3)}',
    '.concierge-tile b{font:500 11.5px/1 var(--fm);color:var(--acc-ink)}',
    '.concierge-tile:disabled{cursor:default;opacity:.55}',
    '.concierge-tile[aria-pressed="true"]{opacity:1;border-color:var(--acc);box-shadow:0 0 0 2px var(--acc-soft)}',
    '.concierge-att{display:flex;align-items:center;gap:8px;font-size:13px}',
    '.concierge-att svg{width:16px;height:16px;flex:none}',
    '.concierge-wave{display:inline-flex;align-items:center;gap:2px;height:18px}',
    '.concierge-wave i{display:block;width:3px;border-radius:2px;background:currentColor;opacity:.8}',
    '.concierge-gl{display:block;margin-top:5px;padding-top:4px;border-top:1px dashed var(--line);font-size:12px;line-height:1.35;color:var(--ink3)}',
    '.concierge-inv{display:grid;gap:6px;width:100%;max-width:92%;padding:10px 12px;border-radius:14px;border:1px solid var(--line);background:var(--card);font-size:13px}',
    '.concierge-inv .r{display:flex;justify-content:space-between;gap:8px}',
    '.concierge-inv .r span{color:var(--ink3)}',
    '.concierge-inv .sum{font:700 16px/1.2 var(--fm)}',
    '.concierge-inv .btn{justify-content:center}',
    '.concierge-empty{font-size:13.5px;line-height:1.45;color:var(--ink3)}',
    /* manager */
    '.concierge-stat{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0}',
    '.concierge-list{display:grid;gap:6px}',
    '.concierge-tk{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:2px 10px;align-items:center;padding:9px 11px;border-radius:12px;border:1px solid var(--line2);background:var(--card);font-size:13.5px}',
    '.concierge-tk small{grid-column:1;font:500 11px/1.3 var(--fm);color:var(--ink3)}',
    '.concierge-tk .tg{grid-row:1/3;grid-column:2}',
    '.concierge-tk.on{border-color:var(--acc);box-shadow:0 0 0 2px var(--acc-soft)}',
    '.concierge-var{display:grid;gap:6px;margin-top:10px}',
    '.concierge-var button{text-align:left;padding:8px 10px;border-radius:10px;border:1px solid var(--line);background:var(--bg2);color:var(--ink);font:400 13px/1.4 var(--fb);cursor:pointer;min-height:38px}',
    '.concierge-var button b{display:block;font:500 10.5px/1.3 var(--fm);letter-spacing:.04em;text-transform:uppercase;color:var(--acc-ink)}',
    '.concierge-acts{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}',
    '.concierge-guard{margin-top:10px;padding:10px 12px;border-radius:12px;border:1px solid var(--bad);background:var(--bad-soft);font-size:13.5px;line-height:1.4}',
    '.concierge-guard .btn{margin-top:8px}',
    '.concierge-tgc{padding:10px 12px;border-radius:12px;background:var(--bg2);border:1px solid var(--line2);font-size:13.5px;line-height:1.4}',
    '.concierge-tgc .btn{margin-top:8px}',
    '.concierge-tgc+.concierge-tgc{margin-top:8px}',
    /* partner */
    '.concierge-steps .stp{cursor:default}',
    '.concierge-form{display:grid;gap:10px}',
    '.concierge-form h5{font-size:15px}',
    '.concierge-wl{padding:10px 12px;border-radius:12px;border:1px dashed var(--line);display:grid;gap:8px}',
    '.concierge-tog{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}',
    '.concierge-mg{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:8px 10px;border-radius:10px;background:var(--bg2);font-size:13.5px}',
    '.concierge-mg small{color:var(--ink3);text-align:right}',
    '.concierge-qrs{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}',
    '.concierge-qrs span{display:grid;justify-items:center;gap:3px;padding:6px 4px;border-radius:9px;background:var(--bg2);font:500 11px/1 var(--fm);color:var(--ink2)}',
    '.concierge-qrs .concierge-qrc{width:40px;height:40px;padding:3px;border-radius:5px}',
    '.concierge-phone.concierge-pv .phone-in{height:auto;min-height:0}',
    '.concierge-pv .phone-h i{transition:background-color .3s ease,color .3s ease}',
    '.concierge-pv .chat{gap:8px}',
    '@media (max-width:900px){.concierge-phone .phone-in{height:500px}}'
  ].join('\n');

  function css() {
    if (document.getElementById('pf-concierge-css')) return;
    var s = document.createElement('style');
    s.id = 'pf-concierge-css';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  PF.app('concierge', {
    cap: [
      'Макет на выдуманных данных: номера, цены, люди и партнёры придуманы. В настоящем продукте те же три стороны: гость в Telegram Mini App, панель менеджера с карточками в Telegram и мастер подключения объекта.',
      'A mock on invented data: rooms, prices, people and partners are made up. The real product has the same three sides: the guest in a Telegram Mini App, the manager panel with cards in Telegram and the onboarding wizard for a property.'
    ],
    pace: 900,
    mount: function (ctx) {
      var T = ctx.T, h = ctx.h, icon = ctx.icon;
      css();

      /* ---------- data ---------- */
      var SV = {
        taxi: { n: T('Такси', 'Taxi'), p: T('партнёр-перевозчик', 'transport partner'), from: '900 ₽', price: '1 400 ₽',
          req: T('Такси в аэропорт завтра в 7:00, нас двое, два чемодана', 'A taxi to the airport tomorrow at 7:00, two people, two suitcases') },
        clean: { n: T('Уборка', 'Cleaning'), p: T('клининг-партнёр', 'cleaning partner'), from: '800 ₽', price: '1 200 ₽',
          req: T('Уборка сегодня после 15:00 и свежие полотенца', 'Cleaning today after 15:00 and fresh towels') },
        food: { n: T('Еда', 'Food'), p: T('ресторан-партнёр', 'restaurant partner'), from: '600 ₽', price: '2 300 ₽',
          req: T('Ужин в номер к 20:00: два салата и паста', 'Dinner to the room by 20:00: two salads and a pasta') },
        tour: { n: T('Экскурсии', 'Tours'), p: T('турагент-партнёр', 'tour partner'), from: '2 500 ₽', price: '3 500 ₽',
          req: T('Экскурсия в субботу утром на двоих', 'A tour on Saturday morning for two') }
      };
      var KEYS = ['taxi', 'clean', 'food', 'tour'];
      var AT = {
        voice: { ic: 'chat', n: T('Голосовое', 'Voice'), how: T('расшифровал голосовое', 'transcribed the voice message') },
        photo: { ic: 'image', n: T('Фото', 'Photo'), how: T('прочитал текст с фото', 'read the text in the photo') },
        pdf: { ic: 'doc', n: 'PDF', how: T('прочитал PDF', 'read the PDF') }
      };
      var ST = {
        new: ['tg-acc', T('Новый', 'New')], work: ['tg-wait', T('В работе', 'In progress')],
        wait: ['tg-info', T('Ждёт гостя', 'Waiting for guest')], done: ['tg-ok', T('Закрыт', 'Closed')]
      };
      var RUDE = /сколько можно|когда будет|не мои проблемы|отстаньте|how many times|whenever|not my problem|stop writing/i;
      var STEPS = [
        [T('Аккаунт', 'Account'), T('объект и номера', 'property and rooms')],
        [T('Канал', 'Channel'), T('бот в Telegram', 'a Telegram bot')],
        [T('Категории', 'Categories'), T('услуги партнёров', 'partner services')],
        [T('Менеджеры', 'Managers'), T('кто отвечает гостям', 'who answers guests')],
        [T('Запуск', 'Launch'), T('QR в каждый номер', 'a QR in every room')]
      ];
      var COLS = [['acc', 'var(--acc)'], ['ok', 'var(--ok)'], ['wait', 'var(--wait)'], ['bad', 'var(--bad)']];

      var S, seen = {}, clock = 0;
      function fresh(side) {
        return { side: side, busy: false, hold: 0,
          g: { step: 'idle', svc: null, at: null },
          m: { step: 'arrive', sec: 'all', open: false, draft: '', guard: false },
          p: { step: 0, col: 'acc', cats: { taxi: true, clean: true, food: true, tour: false }, live: false } };
      }

      /* ---------- static frame: the side switch and the shared log ---------- */
      var segSide = ctx.seg(T('Сторона продукта', 'Side of the product'), [
        ['g', T('Гость', 'Guest')], ['m', T('Менеджер', 'Manager')], ['p', T('Подключение', 'Onboarding')]
      ], 'g', function (v) { start(v); });
      ctx.bar.appendChild(segSide);
      var stage = h('div');
      var log = ctx.logger(T('Пока пусто. Шаги гостя, менеджера и партнёра попадут сюда.', 'Empty for now. Steps of the guest, the manager and the partner land here.'), T('система', 'system'));
      var winLog = ctx.win('log', T('Журнал', 'Log'), T('время условное', 'time is illustrative'), log.el);
      winLog.classList.add('demo-wide');
      ctx.body.appendChild(stage);
      ctx.body.appendChild(winLog);

      /* ---------- helpers ---------- */
      function tm(add) {
        clock += add;
        var t = 10 * 3600 + 14 * 60 + clock, p = function (n) { return (n < 10 ? '0' : '') + n; };
        return p(Math.floor(t / 3600) % 24) + ':' + p(Math.floor(t / 60) % 60) + ':' + p(t % 60);
      }
      function settle(ms) { S.busy = false; S.hold = Date.now() + ms; }
      function kvRow(dt, dd) { return h('div', null, h('dt', null, dt), h('dd', null, dd)); }
      function tag(st) { return h('span.tg.' + ST[st][0], null, ST[st][1]); }
      /* a QR-like picture from a fixed pattern: three corner squares and pseudo-random cells, it encodes nothing */
      function qrPic(seed) {
        var n = 21, s = seed || 5, d = '';
        for (var y = 0; y < n; y++) {
          for (var x = 0; x < n; x++) {
            var fx = x < 8 ? x : x >= n - 8 ? n - 1 - x : -1, fy = y < 8 ? y : y >= n - 8 ? n - 1 - y : -1, on;
            if (fx >= 0 && fy >= 0 && !(x >= n - 8 && y >= n - 8)) {
              var m = Math.max(Math.abs(fx - 3), Math.abs(fy - 3));
              on = fx < 7 && fy < 7 && (m === 3 || m < 2);
            } else { s = (s * 73 + 41) % 251; on = s % 9 < 4; }
            if (on) d += 'M' + x + ' ' + y + 'h1v1h-1z';
          }
        }
        return h('div.concierge-qrc', { 'aria-hidden': 'true', html: '<svg viewBox="0 0 ' + n + ' ' + n + '" shape-rendering="crispEdges"><path fill="currentColor" d="' + d + '"/></svg>' });
      }
      function dots() { return h('div.msg.bot.in-pop', null, h('span.typing', { 'aria-label': T('бот печатает', 'the bot is typing') }, h('i'), h('i'), h('i'))); }

      /* =====================================================================
         1. GUEST
         ===================================================================== */
      var G = {};
      function renderGuest() {
        G.chat = h('div.chat', { role: 'log', 'aria-label': T('Чат гостя', 'Guest chat') });
        G.qr = h('div.qr', { role: 'group', 'aria-label': T('Ответы гостя', 'Guest replies') });
        var phone = h('div.phone.concierge-phone', null, h('div.phone-in', null,
          h('div.phone-h', null, h('i', null, icon('tg')), h('div', null, T('Консьерж · номер 214', 'Concierge · room 214'), h('small', null, 'Telegram Mini App'))),
          G.chat, G.qr));
        G.kv = {
          room: h('span', null, '—'), svc: h('span', null, '—'), partner: h('span', null, '—'),
          det: h('span', null, '—'), inv: h('span', null, '—')
        };
        var winPhone = ctx.win('phone', T('Гость · Telegram', 'Guest · Telegram'), T('без установки приложения', 'nothing to install'), h('div.win-b', null, phone));
        var winReq = ctx.win('inbox', T('Заявка в системе', 'Request in the system'), T('собирается из чата', 'built from the chat'),
          h('div.win-b', null, h('dl.kv', null,
            kvRow(T('Номер', 'Room'), G.kv.room), kvRow(T('Услуга', 'Service'), G.kv.svc), kvRow(T('Кто выполняет', 'Done by'), G.kv.partner),
            kvRow(T('Что нужно', 'What is needed'), G.kv.det), kvRow(T('Счёт', 'Invoice'), G.kv.inv)),
            h('p.win-note', { style: 'margin-top:10px' }, T('Гость пишет как удобно: текстом, голосом, фото или PDF. Бот превращает это в заявку, партнёр и менеджер видят одно и то же.', 'The guest writes any way they like: text, voice, photo or PDF. The bot turns it into a request, the partner and the manager see the same thing.'))));
        winPhone.classList.add('o1'); winReq.classList.add('o2');
        G.winReq = winReq;
        stage.appendChild(h('div.demo-grid.flow', null, h('div.demo-col', null, winPhone), h('div.demo-col', null, winReq)));

        G.scan = h('button.btn.btn-acc', { type: 'button', onclick: gScan }, icon('phone'), T('Сканировать QR в номере', 'Scan the QR in the room'));
        G.chat.appendChild(h('div.concierge-scan', null, qrPic(5), h('p', null, T('У каждого номера свой QR. Этот лежит в номере 214.', 'Every room has its own QR. This one is in room 214.')), G.scan));
        ctx.now(T('Вы гость. Нажмите <b>«Сканировать QR в номере»</b>: так гость попадает к консьержу.', 'You are the guest. Press <b>"Scan the QR in the room"</b>: this is how a guest reaches the concierge.'));
      }
      function say(node) { G.chat.appendChild(node); G.chat.scrollTop = G.chat.scrollHeight; return node; }
      function gBot(text, done, wait) {
        var m = say(dots());
        ctx.later(function () { m.innerHTML = ''; m.appendChild(document.createTextNode(text)); G.chat.scrollTop = G.chat.scrollHeight; if (done) done(); }, wait || 850);
      }
      function gNote(text) { return say(h('div.sysline.in-pop', null, text)); }
      function gQuick(btns) { G.qr.innerHTML = ''; (btns || []).forEach(function (b) { G.qr.appendChild(b); }); }
      function gScan() {
        if (S.g.step !== 'idle' || S.busy) return;
        S.busy = true; G.chat.innerHTML = '';
        gNote(T('QR номера 214 открыл Mini App прямо в Telegram', 'The room 214 QR opened the Mini App right in Telegram'));
        log.add(tm(2), T('Гость отсканировал QR номера 214', 'The guest scanned the QR of room 214'));
        G.kv.room.textContent = '214'; G.kv.room.className = 'flash';
        ctx.now(T('Бот уже знает номер: его зашили в QR.', 'The bot already knows the room: it is built into the QR.'));
        gBot(T('Здравствуйте! Я консьерж. Вижу, вы в номере 214. Что заказать?', 'Hello! I am the concierge. I see you are in room 214. What can I order for you?'), function () {
          ctx.later(function () {
            var cat = h('div.concierge-cat.in-pop');
            G.tiles = {};
            KEYS.forEach(function (k) {
              var b = h('button.concierge-tile', { type: 'button', onclick: function () { gPick(k); } }, SV[k].n, h('small', null, SV[k].p), h('b', null, T('от ', 'from ') + SV[k].from));
              G.tiles[k] = b; cat.appendChild(b);
            });
            say(cat);
            log.add(tm(1), T('Каталог собран из услуг партнёров объекта', 'The catalogue is built from the property partner services'), 'sys');
            ctx.later(function () {
              gNote(T('Цены и партнёров задаёт управляющая компания', 'The managing company sets the prices and the partners'));
              S.g.step = 'cat'; settle(1800);
              ctx.now(T('Каталог услуг партнёров. <b>Выберите услугу</b>, например «Такси».', 'A catalogue of partner services. <b>Pick a service</b>, for example "Taxi".'));
            }, 1200);
          }, 900);
        }, 1000);
      }
      function gPick(k) {
        if (S.g.step !== 'cat' || S.busy) return;
        S.busy = true; S.g.svc = k;
        KEYS.forEach(function (x) { G.tiles[x].disabled = true; G.tiles[x].setAttribute('aria-pressed', String(x === k)); });
        G.kv.svc.textContent = SV[k].n; G.kv.partner.textContent = SV[k].p; G.kv.svc.className = G.kv.partner.className = 'flash';
        log.add(tm(9), T('Гость выбрал: ', 'The guest picked: ') + SV[k].n);
        ctx.now(T('Бот спрашивает детали.', 'The bot asks for the details.'));
        gBot(T('Опишите, что нужно. Можно голосом, фото или PDF.', 'Tell me what you need. Voice, photo or PDF is fine.'), function () {
          gQuick(['voice', 'photo', 'pdf'].map(function (a) {
            return h('button', { type: 'button', 'data-k': a, onclick: function () { gAttach(a); } }, icon(AT[a].ic), AT[a].n);
          }));
          S.g.step = 'att'; settle(1600);
          ctx.now(T('Гость отвечает. <b>Отправьте голосовое</b>, фото или PDF.', 'The guest answers. <b>Send a voice message</b>, a photo or a PDF.'));
        });
      }
      function gAttach(a) {
        if (S.g.step !== 'att' || S.busy) return;
        S.busy = true; S.g.at = a; gQuick(null);
        var c = SV[S.g.svc], body;
        if (a === 'voice') {
          var w = h('span.concierge-wave'); [6, 12, 16, 9, 14, 7, 11, 15, 8, 12, 5].forEach(function (v) { w.appendChild(h('i', { style: 'height:' + v + 'px' })); });
          body = h('span.concierge-att', null, icon('play'), w, '0:06');
        } else if (a === 'photo') body = h('span.concierge-att', null, icon('image'), T('фото записки', 'photo of a note'));
        else body = h('span.concierge-att', null, icon('doc'), T('заявка.pdf · 1 стр.', 'request.pdf · 1 page'));
        say(h('div.msg.r.in-pop', null, body));
        log.add(tm(14), T('Гость отправил: ', 'The guest sent: ') + AT[a].n.toLowerCase());
        ctx.now(T('Бот разбирает вложение.', 'The bot reads the attachment.'));
        ctx.later(function () {
          gNote(T('Бот ', 'The bot ') + AT[a].how);
          G.kv.det.textContent = c.req; G.kv.det.className = 'flash';
          ctx.focus(G.winReq);
          log.add(tm(2), T('Бот ', 'The bot ') + AT[a].how + ': ' + c.req, 'sys');
          gBot(T('Понял: ', 'Got it: ') + c.req.charAt(0).toLowerCase() + c.req.slice(1) + T('. Вот счёт.', '. Here is the invoice.'), function () {
            ctx.later(function () {
              G.pay = h('button.btn.btn-acc', { type: 'button', onclick: gPay }, icon('card'), T('Оплатить ', 'Pay ') + c.price);
              G.invSt = h('span', null, T('ждёт оплаты', 'awaiting payment'));
              say(h('div.concierge-inv.in-pop', null,
                h('div.r', null, h('b', null, T('Счёт № 214-3', 'Invoice no. 214-3')), G.invSt),
                h('div.r', null, h('span', null, c.n), h('span.sum', null, c.price)),
                h('div.r', null, h('span', null, T('исполнитель', 'provider')), c.p),
                G.pay));
              G.kv.inv.innerHTML = ''; G.kv.inv.appendChild(h('span.st.wait.flash', null, T('выставлен в чате', 'sent in the chat')));
              log.add(tm(1), T('Счёт выставлен гостю прямо в чате', 'Invoice sent to the guest right in the chat'), 'sys');
              ctx.focus(G.pay);
              S.g.step = 'inv'; settle(1800);
              ctx.now(T('Счёт пришёл в чат. <b>Нажмите «Оплатить»</b>.', 'The invoice is in the chat. <b>Press "Pay"</b>.'));
            }, 500);
          });
        }, 1200);
      }
      function gPay() {
        if (S.g.step !== 'inv' || S.busy) return;
        S.busy = true; G.pay.disabled = true;
        log.add(tm(11), T('Гость нажал «Оплатить»', 'The guest pressed "Pay"'));
        ctx.later(function () {
          G.invSt.className = 'st ok flash'; G.invSt.textContent = T('оплачен', 'paid');
          G.kv.inv.innerHTML = ''; G.kv.inv.appendChild(h('span.st.ok.flash', null, T('оплачен', 'paid')));
          log.add(tm(3), T('Оплата прошла, заявка ушла партнёру и менеджеру', 'Paid, the request went to the partner and the manager'), 'sys');
          gBot(T('Оплачено, спасибо! Заявку передал исполнителю, менеджер на связи.', 'Paid, thank you! I passed the request on, the manager is in touch.'), function () {
            S.g.step = 'done'; seen.g = true; settle(2200);
            ctx.end(T('<b>Гость заказал и оплатил услугу, не выходя из Telegram.</b> Номер взят из QR, детали из голосового, счёт пришёл прямо в чат.', '<b>The guest ordered and paid for a service without leaving Telegram.</b> The room came from the QR, the details from a voice message, the invoice right in the chat.'));
            ctx.now(T('Теперь посмотрите, что видит менеджер: вкладка <b>«Менеджер»</b> вверху.', 'Now see what the manager sees: the <b>"Manager"</b> tab at the top.'));
          }, 900);
        }, 900);
      }

      /* =====================================================================
         2. MANAGER
         ===================================================================== */
      var M = {};
      var TICKETS;
      function renderMgr() {
        TICKETS = [
          { id: 'a', room: '108', sec: 'clean', t: T('Уборка, сменить бельё', 'Cleaning, change the bed linen'), st: 'work', min: 12 },
          { id: 'b', room: '305', sec: 'food', t: T('Ужин в номер к 19:30', 'Dinner to the room by 19:30'), st: 'wait', min: 25 },
          { id: 'c', room: '117', sec: 'tour', t: T('Экскурсия на воскресенье', 'A tour on Sunday'), st: 'done', min: 40 },
          { id: 'd', room: '402', sec: 'taxi', t: T('Такси в центр в 18:00', 'A taxi to the centre at 18:00'), st: 'done', min: 55 }
        ];
        M.segSec = ctx.seg(T('Раздел', 'Section'), [['all', T('Все', 'All')]].concat(KEYS.map(function (k) { return [k, SV[k].n]; })), 'all', mSec);
        M.stat = h('div.concierge-stat');
        M.list = h('div.concierge-list');
        M.tkBody = h('div.win-b');
        M.tgBody = h('div.win-b');
        var winDash = ctx.win('chart', T('Панель менеджера', 'Manager dashboard'), T('разделы и статусы', 'sections and statuses'), h('div.win-b', null, M.segSec, M.stat, M.list));
        M.winTk = ctx.win('chat', T('Тикет', 'Ticket'), T('не выбран', 'none selected'), M.tkBody);
        M.winTg = ctx.win('tg', T('Telegram менеджера', "The manager's Telegram"), T('карточки тикетов', 'ticket cards'), M.tgBody);
        winDash.classList.add('o2'); M.winTk.classList.add('o3'); M.winTg.classList.add('o1');
        stage.appendChild(h('div.demo-grid.flow', null, h('div.demo-col', null, M.winTg, winDash), h('div.demo-col', null, M.winTk)));
        M.tkBody.appendChild(h('p.concierge-empty', null, T('Возьмите тикет в работу, и здесь появится переписка с гостем и варианты ответа от AI.', 'Take a ticket and the chat with the guest appears here with AI reply variants.')));
        M.tgBody.appendChild(h('p.concierge-empty', null, T('Сюда приходят новые тикеты, даже когда панель закрыта.', 'New tickets land here even when the dashboard is closed.')));
        mList();
        ctx.now(T('Вы менеджер. Новый тикет сейчас придёт в Telegram.', 'You are the manager. A new ticket is about to arrive in Telegram.'));
        S.busy = true;
        ctx.later(function () {
          TICKETS.unshift({ id: 'n', room: '214', sec: 'taxi', t: T('Такси в аэропорт, завтра 7:00', 'Taxi to the airport, tomorrow 7:00'), st: 'new', min: 0, fresh: true });
          mList();
          M.tgBody.innerHTML = '';
          M.take = h('button.btn.btn-acc.btn-sm', { type: 'button', onclick: mTake }, icon('check'), T('Взять в работу', 'Take it'));
          M.tgCard = h('div.concierge-tgc.in-pop', null, h('b', null, T('Новый тикет · номер 214', 'New ticket · room 214')), h('br'),
            T('Такси в аэропорт завтра в 7:00, двое, два чемодана. Оплачено 1 400 ₽.', 'Taxi to the airport tomorrow at 7:00, two people, two suitcases. Paid 1 400 ₽.'), h('br'), M.take);
          M.tgBody.appendChild(M.tgCard);
          M.tgBody.appendChild(h('div.concierge-tgc', null, h('span.meta', null, T('Вчера · номер 117 · Экскурсия · закрыт', 'Yesterday · room 117 · Tour · closed'))));
          log.add(tm(3), T('Новый тикет из номера 214: карточка ушла менеджеру в Telegram', 'New ticket from room 214: a card went to the manager in Telegram'), 'sys');
          ctx.focus(M.winTg);
          S.m.step = 'sec'; settle(1600);
          ctx.now(T('Тикет пришёл. Отфильтруйте панель по разделу <b>«Такси»</b> или сразу нажмите <b>«Взять в работу»</b> в Telegram.', 'The ticket is in. Filter the dashboard by the <b>"Taxi"</b> section or press <b>"Take it"</b> in Telegram right away.'));
        }, 1100);
      }
      function mList() {
        var cnt = { new: 0, work: 0, wait: 0, done: 0 };
        TICKETS.forEach(function (t) { cnt[t.st]++; });
        M.stat.innerHTML = '';
        ['new', 'work', 'wait', 'done'].forEach(function (k) { M.stat.appendChild(h('span.tg.' + ST[k][0], null, ST[k][1] + ' · ' + cnt[k])); });
        M.list.innerHTML = '';
        var rows = TICKETS.filter(function (t) { return S.m.sec === 'all' || t.sec === S.m.sec; });
        rows.forEach(function (t) {
          M.list.appendChild(h('div.concierge-tk' + (t.id === 'n' && S.m.open ? '.on' : '') + (t.fresh ? '.in-pop' : ''), null,
            h('span', null, t.t), tag(t.st),
            h('small', null, T('номер ', 'room ') + t.room + ' · ' + SV[t.sec].n + ' · ' + (t.min ? t.min + T(' мин назад', ' min ago') : T('только что', 'just now')))));
          t.fresh = false;
        });
        if (!rows.length) M.list.appendChild(h('p.concierge-empty', null, T('В этом разделе тикетов нет.', 'No tickets in this section.')));
      }
      function mSec(v) {
        S.m.sec = v; M.segSec.set(v); mList();
        if (v !== 'all') seen.sec = true;
        log.add(tm(4), T('Панель отфильтрована: ', 'Dashboard filtered: ') + (v === 'all' ? T('все разделы', 'all sections') : SV[v].n));
        if (!S.m.open && S.m.step !== 'arrive') ctx.now(T('Видны только тикеты раздела. Теперь нажмите <b>«Взять в работу»</b> в Telegram.', 'Only tickets of the section are shown. Now press <b>"Take it"</b> in Telegram.'));
      }
      function setSt(st) { TICKETS[0].st = st; mList(); }
      function mTake() {
        if (S.m.step !== 'sec' || S.busy) return;
        S.busy = true; S.m.open = true; M.take.disabled = true;
        M.take.lastChild.textContent = T('Взят вами', 'Taken by you');
        setSt('work');
        log.add(tm(18), T('Менеджер взял тикет 214 из Telegram', 'The manager took ticket 214 from Telegram'));
        M.winTk.note(T('номер 214 · Такси', 'room 214 · Taxi'));
        M.tkBody.innerHTML = '';
        M.tkBody.appendChild(h('div.chat', { style: 'padding:0' },
          h('div.msg.r', null, h('span.concierge-att', null, icon('play'), T('голосовое 0:06', 'voice 0:06'))),
          h('div.msg.bot', null, T('Расшифровка: такси в аэропорт завтра в 7:00, нас двое, два чемодана. Оплачено.', 'Transcript: a taxi to the airport tomorrow at 7:00, two people, two suitcases. Paid.'))));
        M.vars = h('div.concierge-var');
        M.tkBody.appendChild(M.vars);
        M.vars.appendChild(h('p.wtl', null, icon('bot'), T('AI готовит три варианта ответа…', 'AI is drafting three reply variants…')));
        ctx.focus(M.winTk);
        ctx.now(T('AI предлагает варианты ответа.', 'AI suggests reply variants.'));
        ctx.later(function () {
          M.vars.innerHTML = '';
          [[T('коротко', 'short'), T('Такси на 7:00 заказано. Водитель напишет за 15 минут.', 'The taxi for 7:00 is booked. The driver will text you 15 minutes before.')],
           [T('подробно', 'detailed'), T('Готово: такси в аэропорт завтра в 7:00, машина с большим багажником. Водитель напишет за 15 минут до подачи.', 'Done: a taxi to the airport tomorrow at 7:00, a car with a large boot. The driver will text you 15 minutes before.')],
           [T('с вопросом', 'with a question'), T('Такси на 7:00 заказано. Подсказать, во сколько лучше выехать к вашему рейсу?', 'The taxi for 7:00 is booked. Shall I check what time is best for your flight?')]]
            .forEach(function (v) { M.vars.appendChild(h('button.in-pop', { type: 'button', onclick: function () { mUse(v[1]); } }, h('b', null, v[0]), v[1])); });
          M.draft = h('textarea.inp', { rows: 3, 'aria-label': T('Ответ гостю', 'Reply to the guest'), placeholder: T('Выберите вариант или напишите свой ответ', 'Pick a variant or write your own reply') });
          M.send = h('button.btn.btn-acc', { type: 'button', onclick: mSend }, icon('send'), T('Отправить', 'Send'));
          M.rude = h('button.btn', { type: 'button', onclick: mRude }, icon('edit'), T('Написать на эмоциях', 'Write in a temper'));
          M.guardBox = h('div');
          M.tkBody.appendChild(h('div', { style: 'margin-top:10px' }, h('label.lbl', null, T('Ответ гостю', 'Reply to the guest')), M.draft));
          M.tkBody.appendChild(h('div.concierge-acts', null, M.send, M.rude));
          M.tkBody.appendChild(M.guardBox);
          log.add(tm(2), T('AI предложил три варианта ответа', 'AI suggested three reply variants'), 'sys');
          S.m.step = 'reply'; settle(2000);
          ctx.now(T('Можно взять вариант AI. А проверьте плохой путь: нажмите <b>«Написать на эмоциях»</b>.', 'You can take an AI variant. But try the bad path: press <b>"Write in a temper"</b>.'));
        }, 1500);
      }
      function mUse(text) {
        if (S.m.step !== 'reply' || S.busy) return;
        M.draft.value = text; M.guardBox.innerHTML = '';
        ctx.now(T('Вариант в поле ответа. Нажмите <b>«Отправить»</b>.', 'The variant is in the reply box. Press <b>"Send"</b>.'));
      }
      function mRude() {
        if (S.m.step !== 'reply' || S.busy) return;
        M.draft.value = T('Сколько можно писать? Такси будет, когда будет.', 'How many times do I need to say it? The taxi comes whenever it comes.');
        M.draft.classList.add('flash');
        seen.rude = true;
        ctx.now(T('Резкий черновик в поле. Нажмите <b>«Отправить»</b> и посмотрите, что будет.', 'A rude draft is in the box. Press <b>"Send"</b> and see what happens.'));
      }
      function mSend() {
        if (S.m.step !== 'reply' || S.busy) return;
        var text = (M.draft.value || '').trim();
        if (!text) { ctx.now(T('Поле пустое. Выберите вариант AI или напишите ответ.', 'The box is empty. Pick an AI variant or write a reply.')); return; }
        M.guardBox.innerHTML = '';
        if (RUDE.test(text)) {
          S.m.guard = true;
          M.polite = h('button.btn.btn-ok', { type: 'button', onclick: mPolite }, icon('shield'), T('Вежливая версия', 'Polite version'));
          M.guardBox.appendChild(h('div.concierge-guard.in-pop', null, h('p.nol', null, icon('shield'), h('span', null, T('Не отправлено: тон резкий, гость может обидеться.', 'Not sent: the tone is rude, the guest may take offence.'))), M.polite));
          log.add(tm(6), T('Проверка тона остановила резкий ответ', 'The tone guard stopped a rude reply'), 'bad');
          ctx.focus(M.guardBox);
          ctx.now(T('Проверка тона остановила ответ. Нажмите <b>«Вежливая версия»</b>.', 'The tone guard stopped the reply. Press <b>"Polite version"</b>.'));
          return;
        }
        S.busy = true; M.send.disabled = true; M.rude.disabled = true;
        M.vars.querySelectorAll('button').forEach(function (b) { b.disabled = true; });
        M.tkBody.querySelector('.chat').appendChild(h('div.msg.in-pop', null, h('span.who', null, T('менеджер', 'manager')), text));
        log.add(tm(5), T('Ответ ушёл гостю в Telegram', 'The reply went to the guest in Telegram'));
        ctx.later(function () {
          setSt('done');
          M.tgCard.appendChild(h('p.okl', { style: 'margin-top:8px' }, icon('check'), T('Ответ отправлен, тикет закрыт', 'Reply sent, ticket closed')));
          log.add(tm(1), T('Тикет 214 закрыт', 'Ticket 214 closed'), 'sys');
          S.m.step = 'done'; seen.m = true; settle(2200);
          ctx.end(T('<b>Тикет закрыт за пару нажатий.</b> AI дал варианты ответа, проверка тона не выпустила грубость, карточка пришла менеджеру в Telegram.', '<b>The ticket was closed in a few taps.</b> AI gave reply variants, the tone guard stopped the rude one, and the card reached the manager in Telegram.'));
          ctx.now(T('Последняя сторона: как объект подключается. Вкладка <b>«Подключение»</b>.', 'Last side: how a property gets connected. The <b>"Onboarding"</b> tab.'));
        }, 1000);
      }
      function mPolite() {
        if (S.m.step !== 'reply' || S.busy) return;
        M.draft.value = T('Понимаю, что вы ждёте ответа. Такси на 7:00 заказано, водитель напишет за 15 минут до подачи.', 'I understand you are waiting for an answer. The taxi for 7:00 is booked, the driver will text you 15 minutes before.');
        M.draft.classList.remove('flash'); void M.draft.offsetWidth; M.draft.classList.add('flash');
        M.guardBox.innerHTML = '';
        seen.polite = true;
        log.add(tm(3), T('Менеджер взял вежливую версию', 'The manager took the polite version'));
        ctx.now(T('Тон в порядке. Нажмите <b>«Отправить»</b>.', 'The tone is fine. Press <b>"Send"</b>.'));
      }

      /* =====================================================================
         3. PARTNER ONBOARDING
         ===================================================================== */
      var P = {};
      function renderPartner() {
        P.steps = h('ol.steps.concierge-steps');
        P.nodes = STEPS.map(function (s, i) {
          var st = h('span.tg.tg-hum', null, T('ждёт', 'waiting'));
          var li = h('li.stp.idle', null, h('span.n', null, String(i + 1)), h('div', null, h('div.t', null, s[0]), h('div.d', null, s[1])), st);
          P.steps.appendChild(li);
          return { li: li, st: st };
        });
        P.form = h('div.win-b');
        P.pvHead = h('i', null, icon('bot'));
        P.pvName = h('span', null, T('Консьерж', 'Concierge'));
        P.pvChat = h('div.chat');
        var pv = h('div.phone.concierge-phone.concierge-pv', null, h('div.phone-in', null,
          h('div.phone-h', null, P.pvHead, h('div', null, P.pvName, h('small', null, 'Telegram Mini App'))), P.pvChat));
        P.winForm = ctx.win('edit', T('Мастер подключения', 'Onboarding wizard'), '', P.form);
        var winSteps = ctx.win('check', T('Шаги', 'Steps'), T('управляющая компания', 'managing company'), h('div.win-b', null, P.steps));
        var winPv = ctx.win('eye', T('Как увидит гость', 'What the guest sees'), T('живой предпросмотр', 'live preview'), h('div.win-b', null, pv));
        winSteps.classList.add('o1'); P.winForm.classList.add('o2'); winPv.classList.add('o3');
        stage.appendChild(h('div.demo-grid.flow', null, h('div.demo-col', null, winSteps, winPv), h('div.demo-col', null, P.winForm)));
        pStep();
        pPreview();
      }
      function pPreview() {
        var col = COLS.filter(function (c) { return c[0] === S.p.col; })[0][1];
        P.pvHead.style.background = col; P.pvHead.style.color = 'var(--on-acc)';
        P.pvChat.innerHTML = '';
        P.pvChat.appendChild(h('div.msg.bot', null, T('Здравствуйте! Что заказать в номер?', 'Hello! What can I order for your room?')));
        var cat = h('div.concierge-cat');
        KEYS.forEach(function (k) { if (S.p.cats[k]) cat.appendChild(h('div.concierge-tile', { style: 'border-color:' + col }, SV[k].n, h('small', null, SV[k].p))); });
        if (!cat.children.length) cat.appendChild(h('p.concierge-empty', null, T('Нет категорий', 'No categories')));
        P.pvChat.appendChild(cat);
      }
      function pNext() {
        if (S.busy || S.p.live) return;
        log.add(tm(20), T('Шаг готов: ', 'Step done: ') + STEPS[S.p.step][0]);
        S.p.step++; pStep();
        settle(900);
      }
      function pStep() {
        var i = S.p.step;
        P.nodes.forEach(function (n, j) {
          var st = j < i ? 'done' : j === i ? 'run' : 'idle';
          if (S.p.live && j === 4) st = 'done';
          n.li.className = 'stp ' + st;
          n.st.className = 'tg ' + (st === 'run' ? 'tg-acc' : st === 'done' ? 'tg-ok' : 'tg-hum');
          n.st.textContent = st === 'run' ? T('сейчас', 'now') : st === 'done' ? T('готово', 'done') : T('ждёт', 'waiting');
        });
        P.form.innerHTML = '';
        P.winForm.note(T('шаг ', 'step ') + (i + 1) + T(' из 5', ' of 5'));
        P.next = h('button.btn.btn-acc', { type: 'button', onclick: pNext }, icon('arrow'), T('Далее', 'Next'));
        var f = h('div.concierge-form.in-pop');
        f.appendChild(h('h5', null, STEPS[i][0]));
        if (i === 0) {
          f.appendChild(h('label', null, h('span.lbl', null, T('Название объекта', 'Property name')), h('input.inp', { value: T('Апарт-отель «Лагуна»', 'Laguna Apart-hotel'), 'aria-label': T('Название объекта', 'Property name') })));
          f.appendChild(h('dl.kv', null, kvRow(T('Тип', 'Type'), T('апарт-отель', 'apart-hotel')), kvRow(T('Номеров', 'Rooms'), '48'), kvRow(T('Роль', 'Role'), T('управляющая компания', 'managing company'))));
          ctx.now(T('Вы управляющая компания и подключаете объект. Нажмите <b>«Далее»</b>.', 'You are the managing company connecting a property. Press <b>"Next"</b>.'));
        } else if (i === 1) {
          f.appendChild(h('dl.kv', null, kvRow(T('Канал', 'Channel'), 'Telegram · Mini App'), kvRow(T('Карточки менеджерам', 'Cards to managers'), 'Telegram')));
          P.name = h('input.inp', { value: T('Консьерж Лагуны', 'Laguna Concierge'), 'aria-label': T('Имя бота', 'Bot name'),
            oninput: function () { P.pvName.textContent = P.name.value || T('Консьерж', 'Concierge'); } });
          P.sw = h('div.swatches', { role: 'group', 'aria-label': T('Цвет бренда', 'Brand colour') });
          COLS.forEach(function (c) {
            P.sw.appendChild(h('button', { type: 'button', 'data-k': c[0], 'aria-pressed': String(c[0] === S.p.col), 'aria-label': c[0], style: 'background:' + c[1],
              onclick: function () { pCol(c[0]); } }));
          });
          f.appendChild(h('div.concierge-wl', null, h('span.lbl', null, T('White Label, по желанию: своё имя бота и цвета', 'White Label, optional: own bot name and colours')), P.name, P.sw));
          P.pvName.textContent = P.name.value;
          ctx.now(T('Канал: Telegram. В блоке White Label <b>выберите цвет бренда</b>, потом «Далее».', 'Channel: Telegram. In the White Label block <b>pick a brand colour</b>, then "Next".'));
        } else if (i === 2) {
          var tog = h('div.concierge-tog');
          KEYS.forEach(function (k) {
            tog.appendChild(h('button.concierge-tile', { type: 'button', 'data-k': k, 'aria-pressed': String(!!S.p.cats[k]),
              onclick: function (e) { S.p.cats[k] = !S.p.cats[k]; e.currentTarget.setAttribute('aria-pressed', String(S.p.cats[k])); seen.cat = true; pPreview(); } },
              SV[k].n, h('small', null, SV[k].p)));
          });
          f.appendChild(tog);
          f.appendChild(h('p.win-note', null, T('У каждой категории свой партнёр и свои цены.', 'Every category has its own partner and prices.')));
          ctx.now(T('Какие услуги увидит гость. Включите <b>«Экскурсии»</b> и смотрите предпросмотр.', 'Which services the guest sees. Turn on <b>"Tours"</b> and watch the preview.'));
        } else if (i === 3) {
          f.appendChild(h('div.concierge-mg', null, h('span', null, h('b', null, T('Анна К.', 'Anna K.')), ' · @an***'), h('small', null, SV.taxi.n + ', ' + SV.tour.n)));
          f.appendChild(h('div.concierge-mg', null, h('span', null, h('b', null, T('Игорь П.', 'Igor P.')), ' · @ig***'), h('small', null, SV.clean.n + ', ' + SV.food.n)));
          f.appendChild(h('p.win-note', null, T('Каждый получает тикеты своих разделов карточками в Telegram.', 'Each gets tickets of their own sections as cards in Telegram.')));
          ctx.now(T('Менеджеры и их разделы. Нажмите <b>«Далее»</b>.', 'Managers and their sections. Press <b>"Next"</b>.'));
        } else {
          P.go = h('button.btn.btn-acc', { type: 'button', onclick: pLaunch }, icon('bolt'), T('Запустить', 'Launch'));
          P.out = h('div');
          f.appendChild(h('dl.kv', null, kvRow(T('Объект', 'Property'), T('Апарт-отель «Лагуна» · 48 номеров', 'Laguna Apart-hotel · 48 rooms')),
            kvRow(T('Бот', 'Bot'), P.pvName.textContent), kvRow(T('Категории', 'Categories'), KEYS.filter(function (k) { return S.p.cats[k]; }).map(function (k) { return SV[k].n; }).join(', ')),
            kvRow(T('Менеджеры', 'Managers'), '2')));
          f.appendChild(h('div.bc-btns', null, P.go));
          f.appendChild(P.out);
          ctx.now(T('Всё готово. Нажмите <b>«Запустить»</b>.', 'All set. Press <b>"Launch"</b>.'));
        }
        if (i < 4) f.appendChild(h('div.bc-btns', null, P.next));
        P.form.appendChild(f);
      }
      function pCol(c) {
        S.p.col = c; seen.col = true;
        P.sw.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-k') === c)); });
        pPreview();
        ctx.now(T('Цвет применился в предпросмотре. Нажмите <b>«Далее»</b>.', 'The colour shows in the preview. Press <b>"Next"</b>.'));
      }
      function pLaunch() {
        if (S.busy || S.p.live) return;
        S.busy = true; P.go.disabled = true;
        ctx.now(T('Система генерирует QR для каждого номера.', 'The system generates a QR for every room.'));
        log.add(tm(15), T('Запуск: бот подключён, QR генерируются', 'Launch: the bot is connected, QRs are being generated'), 'sys');
        var grid = h('div.concierge-qrs.in-pop');
        P.out.appendChild(h('p.lbl', { style: 'margin-top:12px' }, T('QR по номерам', 'QR per room')));
        P.out.appendChild(grid);
        ctx.focus(P.out);
        var rooms = ['101', '102', '103', '104', '105', '106', '107'];
        rooms.forEach(function (r, j) { ctx.later(function () { grid.appendChild(h('span.in-pop', null, qrPic(11 + j * 7), r)); }, 250 + j * 220); });
        ctx.later(function () {
          grid.appendChild(h('span.in-pop', null, h('b', { style: 'font-size:14px;margin:auto' }, '+41')));
          S.p.live = true; pStepState();
          P.out.appendChild(h('p.okl', { style: 'margin-top:10px' }, icon('check'), T('Работает. 48 QR готовы к печати.', 'Live. 48 QRs ready to print.')));
          log.add(tm(4), T('Объект запущен: 48 QR готовы', 'Property is live: 48 QRs ready'), 'sys');
          seen.p = true; settle(1500);
          ctx.end(T('<b>Объект подключён за пять шагов.</b> Свой бренд занял один блок на шаге «Канал», остальное: категории, менеджеры и QR в каждый номер.', '<b>The property is connected in five steps.</b> Own branding was one block in the "Channel" step, the rest is categories, managers and a QR for every room.'));
          ctx.now(T('Все три стороны пройдены. Переключайтесь вверху, чтобы пройти любую ещё раз.', 'All three sides are done. Switch at the top to walk any of them again.'));
        }, 250 + rooms.length * 220 + 400);
      }
      function pStepState() {
        var n = P.nodes[4]; n.li.className = 'stp done'; n.st.className = 'tg tg-ok'; n.st.textContent = T('готово', 'done');
      }

      /* ---------- side switch ---------- */
      function start(side) {
        ctx.clearTimers();
        S = fresh(side);
        segSide.set(side);
        stage.innerHTML = '';
        ctx.end(null);
        if (side === 'g') renderGuest(); else if (side === 'm') renderMgr(); else renderPartner();
      }

      start('g');

      return {
        reset: function () { seen = {}; clock = 0; log.clear(); start('g'); },
        next: function () {
          if (S.busy || Date.now() < S.hold) return 'wait';
          if (S.side === 'g') {
            if (seen.g) return seen.m ? (seen.p ? null : segSide.btn('p')) : segSide.btn('m');
            if (S.g.step === 'idle') return G.scan;
            if (S.g.step === 'cat') return G.tiles.taxi;
            if (S.g.step === 'att') return G.qr.querySelector('[data-k="voice"]');
            if (S.g.step === 'inv') return G.pay;
            return null;
          }
          if (S.side === 'm') {
            if (seen.m) return seen.p ? (seen.g ? null : segSide.btn('g')) : segSide.btn('p');
            if (S.m.step === 'sec') return !seen.sec ? M.segSec.btn('taxi') : M.take;
            if (S.m.step === 'reply') {
              if (!seen.rude) return M.rude;
              if (S.m.guard && !seen.polite) return M.polite;
              return M.send;
            }
            return null;
          }
          if (seen.p) return seen.g ? (seen.m ? null : segSide.btn('m')) : segSide.btn('g');
          if (S.p.step === 1 && !seen.col) return P.sw.querySelector('[data-k="ok"]');
          if (S.p.step === 2 && !S.p.cats.tour) return P.form.querySelector('[data-k="tour"]');
          if (S.p.step < 4) return P.next;
          return P.go;
        }
      };
    }
  });
})();
