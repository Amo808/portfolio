/* Mini app: hiring system. Five applications from four sources land in one base, the duplicate is merged,
   every card gets an AI score with its reasons, and a bias check scores the same profile again with other protected attributes.
   Same structure as the reference app: state object S, a base render for the first state, small incremental updates while it runs. */
(function () {
  'use strict';

  var CSS = [
    /* on a phone the grid becomes a flex column that keeps align-items:start, so a window with narrow content would shrink */
    '.hiring-win{align-self:stretch}',
    /* sources */
    '.hiring-srcs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}',
    '.hiring-src{display:grid;grid-template-columns:16px minmax(0,1fr) auto;gap:2px 8px;align-items:center;background:var(--card);border:1px solid var(--line2);border-radius:12px;padding:9px 10px;transition:border-color .25s var(--ease-out),box-shadow .25s var(--ease-out)}',
    '.hiring-src>svg{grid-area:1/1;width:16px;height:16px;color:var(--ink3)}',
    '.hiring-src>b{grid-area:1/2;font:600 13.5px/1.3 var(--fb);min-width:0}',
    '.hiring-src>i{grid-area:1/3;display:inline-flex;align-items:center;justify-content:center;gap:3px;min-width:24px;height:22px;padding:0 6px;border-radius:7px;background:var(--acc-soft);color:var(--acc-ink);font:700 12px/1 var(--fm);transition:background-color .25s ease,color .25s ease}',
    '.hiring-src>i svg{width:11px;height:11px}',
    '.hiring-src>small{grid-area:2/2/3/4;font-size:12px;line-height:1.3;color:var(--ink3)}',
    '.hiring-src.on{border-color:var(--acc);box-shadow:0 0 0 3px var(--acc-soft)}',
    '.hiring-src.done>i{background:var(--ok-soft);color:var(--ok)}',
    '.hiring-foot{min-height:42px;align-items:center}',
    /* one base */
    '.hiring-ph{font-size:13.5px;line-height:1.5;color:var(--ink3)}',
    '.hiring-drop{display:grid;place-items:center;min-height:108px;padding:14px;border:1px dashed var(--line);border-radius:12px;text-align:center}',
    '.hiring-slot{display:grid;min-width:0}',
    '.hiring-card{display:flex;flex-direction:column;gap:8px;width:100%;text-align:left;cursor:pointer;transition:border-color .2s ease,box-shadow .2s ease}',
    '.hiring-card[disabled]{cursor:default}',
    '.hiring-card[aria-pressed="true"]{border-color:var(--acc);box-shadow:0 0 0 3px var(--acc-soft)}',
    '.hiring-card.run{border-color:var(--acc)}',
    '.hiring-card.q,.hiring-rec.q{border-color:var(--wait)}',
    '.hiring-head{display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between;gap:2px 10px;min-width:0}',
    '.hiring-name{font:700 15px/1.3 var(--fb)}',
    '.hiring-mail{font:400 12px/1.5 var(--fm);font-variant-ligatures:none;color:var(--ink3);border-radius:5px;padding:0 4px;margin:0 -4px;transition:background-color .25s ease,color .25s ease}',
    '.hiring-mail.hit{background:var(--wait-soft);color:var(--wait)}',
    '.hiring-tags{display:flex;flex-wrap:wrap;gap:6px}',
    '.hiring-sc{display:flex;align-items:center;gap:10px}',
    '.hiring-sc .bar{display:block;flex:1;height:6px;background:var(--bg)}',
    '.hiring-num{font:700 13px/1 var(--fm);min-width:26px;text-align:right;color:var(--ink3)}',
    '.hiring-num.set{color:var(--ink)}',
    '.hiring-rec{display:flex;flex-direction:column;gap:8px;border-style:dashed;transition:border-color .25s ease}',
    '.hiring-dup{display:grid;grid-template-rows:1fr;margin-top:8px;transition:grid-template-rows .5s var(--ease-out),margin-top .5s var(--ease-out),opacity .4s ease}',
    '.hiring-dup-in{min-height:0;overflow:hidden;transition:transform .5s var(--ease-out)}',
    '.hiring-dup.gone{grid-template-rows:0fr;margin-top:0;opacity:0}',
    '.hiring-dup.gone .hiring-dup-in{transform:translateY(-16px)}',
    '.hiring-fact{margin:-2px 12px 12px;padding:8px 10px;border-radius:10px;background:var(--bg2);font-size:12.5px;line-height:1.45;color:var(--ink2)}',
    /* AI score */
    '.hiring-req{display:grid;gap:7px;padding-bottom:12px;margin-bottom:12px;border-bottom:1px solid var(--line2)}',
    '.hiring-lbl{font:500 11px/1.3 var(--fm);letter-spacing:.05em;text-transform:uppercase;color:var(--ink3)}',
    '.hiring-view{min-height:66px}',
    '.hiring-prog{display:flex;align-items:center;gap:10px;color:var(--ink2)}',
    '.hiring-prog b{color:var(--ink);font-weight:600}',
    '.hiring-top{display:flex;align-items:flex-end;justify-content:space-between;gap:12px}',
    '.hiring-cand{font:700 18px/1.25 var(--fb);margin-top:4px}',
    '.hiring-big{font:500 14px/1 var(--fm);color:var(--ink3);white-space:nowrap}',
    '.hiring-big b{font:700 36px/1 var(--fm);letter-spacing:-.03em;color:var(--ink)}',
    '.hiring-bigbar{margin:10px 0 14px}',
    '.hiring-pts{display:grid;gap:6px;margin-top:7px}',
    '.hiring-pts+.hiring-lbl{margin-top:14px}',
    '.hiring-pts li{display:flex;gap:8px;align-items:flex-start;font-size:14px;line-height:1.45;min-height:20px}',
    '.hiring-pts svg{width:16px;height:16px;flex:none;margin-top:2px;opacity:.28;transition:opacity .2s ease}',
    '.hiring-pts li.on svg{opacity:1}',
    '.hiring-pts .p-ok svg{color:var(--ok)}',
    '.hiring-pts .p-no svg{color:var(--bad)}',
    /* bias check */
    '.hiring-prof{margin-bottom:10px}',
    '.hiring-segs{display:flex;flex-wrap:wrap;gap:10px 14px;transition:opacity .25s ease}',
    '.hiring-bias.off .hiring-segs{opacity:.45}',
    '.hiring-bias.off .seg button{cursor:default}',
    '.hiring-res{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:6px 12px;margin-top:12px;padding:9px 12px;border-radius:12px;background:var(--card);border:1px solid var(--line2);min-height:52px}',
    '.hiring-res .l{font-size:13.5px;line-height:1.4;color:var(--ink2);min-width:0}',
    '.hiring-res .v{display:inline-flex;align-items:center;gap:10px;margin-left:auto;min-height:26px}',
    '.hiring-res .v:empty{display:none}',
    '.hiring-res .v b{font:700 24px/1 var(--fm)}',
    '.hiring-tblw{margin-top:10px}',
    '.hiring-tbl td{vertical-align:middle}',
    '.hiring-tbl td.ch{color:var(--acc-ink);font-weight:600}',
    '.hiring-ok{display:inline-flex;align-items:center;gap:5px;color:var(--ok);font:700 13px/1.3 var(--fm)}',
    '.hiring-ok svg{width:13px;height:13px}',
    '.hiring-verdict{margin-top:12px;align-items:flex-start;line-height:1.4}',
    '.hiring-verdict svg{margin-top:2px}',
    '@media (max-width:640px){.hiring-srcs{grid-template-columns:minmax(0,1fr)}.hiring-big b{font-size:32px}.hiring-tbl th,.hiring-tbl td{padding:6px 8px}.hiring-res{flex-direction:column;align-items:flex-start;justify-content:center}.hiring-res .v{margin-left:0}}',
    '@media (min-width:901px){.hiring-feed{min-height:237px}.hiring-drop{min-height:213px}}',
    '@media (hover:hover) and (pointer:fine){.hiring-card:not([disabled]):not([aria-pressed="true"]):hover{border-color:var(--ink3)}}',
    '@media (prefers-reduced-motion:reduce){.hiring-src,.hiring-card,.hiring-dup,.hiring-dup-in,.hiring-segs,.hiring-pts svg{transition:none}}'
  ].join('');

  PF.app('hiring', {
    cap: [
      'Макет на выдуманных данных, имена придуманы. Настоящая система так же склеивает кандидатов из нескольких источников и так же проверяет оценку на предвзятость.',
      'A mock on invented data, the names are made up. The real system merges candidates from several sources the same way and runs the same bias check on the scoring.'
    ],
    pace: 900,
    mount: function (ctx) {
      var T = ctx.T, h = ctx.h, icon = ctx.icon;
      if (!document.getElementById('pf-hiring-css')) document.head.appendChild(h('style', { id: 'pf-hiring-css', text: CSS }));

      /* ---------- data: all of it is invented ---------- */
      var VAC = T('Python-разработчик', 'Python developer');
      var REQ = [T('Python от 4 лет', 'Python, 4+ years'), 'FastAPI', 'PostgreSQL', 'Kubernetes', T('английский B2', 'English B2')];
      var SRC = {
        li: { name: 'LinkedIn', tag: 'LinkedIn', sub: T('расширение браузера', 'browser extension'), ic: 'link', n: 1 },
        jb: { name: T('Сайт вакансий', 'Job board'), tag: T('сайт вакансий', 'job board'), sub: T('отклики на вакансию', 'replies to the posting'), ic: 'globe', n: 2 },
        em: { name: T('Почта', 'Email'), tag: T('почта', 'email'), sub: T('письмо с резюме', 'email with a resume'), ic: 'mail', n: 1 },
        cv: { name: T('Файл резюме', 'Resume file'), tag: T('файл резюме', 'resume file'), sub: T('PDF-файл', 'PDF file'), ic: 'doc', n: 1 }
      };
      var ORDER = ['li', 'jb', 'em', 'cv'];
      var CANDS = [
        { id: 'anna', name: 'Anna Kowalska', mail: 'a.kow***@gmail.com', src: 'li', score: 87, g: 'f', a: '27', c: 'eu',
          plus: [T('5 лет Python и FastAPI', '5 years of Python and FastAPI'), T('PostgreSQL и очереди задач в продакшене', 'PostgreSQL and task queues in production'), T('английский B2, опыт в распределённой команде', 'English B2, experience in a distributed team')],
          minus: [T('нет опыта с Kubernetes', 'no experience with Kubernetes'), T('нет проектов с высокой нагрузкой', 'no high-load projects')] },
        { id: 'mark', name: T('Марк Д.', 'Mark D.'), mail: 'm.d***@outlook.com', src: 'jb', score: 74, g: 'm', a: '58', c: 'non',
          plus: [T('7 лет Python, в основном Django', '7 years of Python, mostly Django'), T('PostgreSQL: сложные запросы и индексы', 'PostgreSQL: complex queries and indexes'), T('Kubernetes на прошлом проекте', 'Kubernetes on the previous project')],
          minus: [T('FastAPI только в учебном проекте', 'FastAPI only in a study project'), T('английский A2, нужен B2', 'English A2, B2 is required')] },
        { id: 'sofia', name: T('София Р.', 'Sofia R.'), mail: 's.r***@proton.me', src: 'em', score: 61, g: 'f', a: '45', c: 'na',
          plus: [T('3 года Python, асинхронный код', '3 years of Python, async code'), T('FastAPI в двух проектах', 'FastAPI in two projects'), T('английский C1', 'English C1')],
          minus: [T('опыта 3 года, нужно от 4', '3 years of experience, 4 are required'), T('PostgreSQL на базовом уровне, нет Kubernetes', 'basic PostgreSQL, no Kubernetes')] },
        { id: 'jonas', name: T('Йонас В.', 'Jonas W.'), mail: 'j.w***@gmx.de', src: 'cv', score: 43, g: 'm', a: '27', c: 'eu',
          plus: [T('3 года веб-разработки на PHP', '3 years of web development in PHP'), T('PostgreSQL и MySQL в работе', 'PostgreSQL and MySQL at work'), T('английский B2', 'English B2')],
          minus: [T('Python меньше года', 'less than a year of Python'), T('нет FastAPI и Kubernetes', 'no FastAPI or Kubernetes')] }
      ];
      /* the second record of the same person: another spelling, the same masked email */
      var DUP = { name: T('Анна Ковальская', 'Anna Kovalska'), mail: 'a.kow***@gmail.com', src: 'jb' };
      var TOP = 'anna';
      var GL = { m: T('М', 'M'), f: T('Ж', 'F') };
      var AGES = ['27', '45', '58'];
      var CITS = ['eu', 'non', 'na'];
      var CL = { eu: T('ЕС', 'EU'), non: T('не ЕС', 'non-EU'), na: T('не указано', 'not stated') };
      var END = T('<b>Пять откликов из четырёх источников стали четырьмя карточками.</b> У каждой есть балл с причинами, и проверка на предвзятость пройдена: балл не зависит от пола, возраста и гражданства.',
        '<b>Five applications from four sources became four cards.</b> Each has a score with reasons, and the bias check passed: the score does not depend on gender, age or citizenship.');
      var byId = {};
      CANDS.forEach(function (c) { byId[c.id] = c; });

      var S, clock, cards, srcNodes, dup, trs, collectBtn, scoreBtn, srcFoot, progName, progFill;
      function fresh() { return { stage: 'idle', busy: false, sel: null, typing: false, pending: false, hold: false, hk: 0, gen: 0, bgen: 0, seen: {}, bias: {}, got: 0, cards: 0, checks: 0 }; }

      /* ---------- static frame ---------- */
      ctx.bar.appendChild(ctx.seg(T('Вакансия', 'Vacancy'), [['py', VAC]], 'py'));

      var srcBody = h('div.win-b');
      var baseBody = h('div.feed.hiring-feed');
      var fact = h('p.hiring-fact.in-pop', { hidden: true }, T('В настоящей системе поиск дублей по базе в тысячи кандидатов ускорен с 9,7 с до 0,3 с.', 'In the real system the duplicate search over a base of thousands of candidates went from 9.7 s to 0.3 s.'));
      var scoreView = h('div.hiring-view');
      var scoreFoot = h('div.bc-btns');
      var scoreBody = h('div.win-b', null,
        h('div.hiring-req', null,
          h('span.hiring-lbl', null, T('Ключевые требования вакансии', 'Key requirements of the vacancy')),
          h('div.tags', null, REQ.map(function (r) { return h('span', null, r); }))),
        scoreView, scoreFoot);

      var segG = ctx.seg(T('Пол', 'Gender'), [['m', GL.m], ['f', GL.f]], '', function (v) { change('g', v); });
      var segA = ctx.seg(T('Возраст', 'Age'), AGES.map(function (a) { return [a, a]; }), '', function (v) { change('a', v); });
      var segC = ctx.seg(T('Гражданство', 'Citizenship'), CITS.map(function (k) { return [k, CL[k]]; }), '', function (v) { change('c', v); });
      var biasWho = h('b');
      var resL = h('span.l'), resV = h('span.v');
      var res = h('div.hiring-res', null, resL, resV);
      var tbody = h('tbody');
      var tblWrap = h('div.sheet-w.hiring-tblw', { hidden: true }, h('table.sheet.hiring-tbl', null,
        h('thead', null, h('tr', null,
          h('th', null, T('Пол', 'Gender')), h('th', null, T('Возраст', 'Age')), h('th', null, T('Гражданство', 'Citizenship')), h('th.num', null, T('Балл', 'Score')))),
        tbody));
      var verdict = h('p.okl.hiring-verdict.in-pop', { hidden: true }, icon('shield'),
        h('span', null, T('Проверка пройдена: балл не зависит от пола, возраста и гражданства', 'Check passed: the score does not depend on gender, age or citizenship')));
      var biasBody = h('div.win-b.hiring-bias.off', null,
        h('p.bc-to.hiring-prof', null, T('Профиль: ', 'Profile: '), biasWho),
        h('div.hiring-segs', null, segG, segA, segC), res, tblWrap, verdict);

      var log = ctx.logger(T('Пока пусто. Сюда попадёт каждый шаг: сбор, склейка дублей, оценка и проверки.', 'Empty for now. Every step lands here: collection, duplicate merging, scoring and checks.'), T('система', 'system'));
      var cnt = ctx.counters([
        ['apps', T('откликов собрано', 'applications collected')],
        ['cards', T('карточек в базе', 'cards in the base')],
        ['dups', T('дублей склеено', 'duplicates merged')],
        ['bias', T('проверок на предвзятость', 'bias checks')]
      ]);
      var winSrc = ctx.win('inbox', T('Источники', 'Sources'), '', srcBody);
      var winBase = ctx.win('users', T('Единая база', 'One base'), '', baseBody, fact);
      var winScore = ctx.win('chart', T('AI-оценка под вакансию', 'AI score for the vacancy'), '', scoreBody);
      var winBias = ctx.win('shield', T('Проверка на предвзятость', 'Bias check'), T('требование EU AI Act', 'required by the EU AI Act'),
        h('p.win-note', null, T('Пол, возраст и гражданство модель при оценке не видит. Проверка это доказывает: меняем только эти поля и считаем балл заново.', 'The model does not see gender, age or citizenship when it scores. The check proves it: we change only these fields and score again.')),
        biasBody);
      var winLog = ctx.win('log', T('Журнал системы', 'System log'), T('время условное', 'time is illustrative'), log.el, cnt.el);
      winSrc.classList.add('o1', 'hiring-win'); winBase.classList.add('o2', 'hiring-win'); winScore.classList.add('o3', 'hiring-win'); winBias.classList.add('o4', 'hiring-win');
      ctx.body.appendChild(h('div.demo-grid.flow', null,
        h('div.demo-col', null, winSrc, winBase),
        h('div.demo-col', null, winScore, winBias)));
      winLog.classList.add('demo-wide');
      ctx.body.appendChild(winLog);

      /* ---------- small helpers ---------- */
      function tm(add) {
        clock += add;
        var t = 9 * 3600 + 14 * 60 + 5 + clock, hh = Math.floor(t / 3600) % 24, mm = Math.floor(t / 60) % 60, ss = t % 60;
        return (hh < 10 ? '0' : '') + hh + ':' + (mm < 10 ? '0' : '') + mm + ':' + (ss < 10 ? '0' : '') + ss;
      }
      /* steps run strictly one after another, each delay counts from the previous step */
      function chain(steps) {
        var i = 0;
        (function go() {
          if (i >= steps.length) return;
          var s = steps[i++];
          ctx.later(function () { s[1](); go(); }, s[0]);
        })();
      }
      function dots() { return h('span.typing', null, h('i'), h('i'), h('i')); }
      /* autoplay waits a little after a result so the eye can read it; a visitor is never blocked by it */
      function hold(ms) { var k = ++S.hk; S.hold = true; ctx.later(function () { if (k === S.hk) S.hold = false; }, ms); }
      function unhold() { S.hk++; S.hold = false; }
      function segLock(off) { [segG, segA, segC].forEach(function (s) { s.querySelectorAll('button').forEach(function (b) { b.disabled = off; }); }); }
      function listOf(a) { return a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + T(' и ', ' and ') + a[a.length - 1]; }

      /* ---------- render of the very first state ---------- */
      function base() {
        srcBody.innerHTML = '';
        srcNodes = {};
        var grid = h('div.hiring-srcs');
        ORDER.forEach(function (k) {
          var s = SRC[k], badge = h('i', null, String(s.n));
          var el = h('div.hiring-src', null, icon(s.ic), h('b', null, s.name), badge, h('small', null, s.sub));
          srcNodes[k] = { el: el, badge: badge, left: s.n };
          grid.appendChild(el);
        });
        collectBtn = h('button.btn.btn-acc', { type: 'button', onclick: collect }, icon('bolt'), T('Собрать кандидатов', 'Collect candidates'));
        srcFoot = h('div.bc-btns.hiring-foot', null, collectBtn);
        srcBody.appendChild(grid);
        srcBody.appendChild(srcFoot);
        winSrc.note(T('5 новых откликов', '5 new applications'));

        cards = {}; dup = null;
        baseBody.innerHTML = '';
        baseBody.appendChild(h('p.hiring-ph.hiring-drop', null, T('Карточки кандидатов появятся здесь по одной.', 'Candidate cards will appear here one by one.')));
        fact.hidden = true;
        winBase.note(T('пусто', 'empty'));

        scoreView.innerHTML = '';
        scoreView.appendChild(h('p.hiring-ph', null, T('Сначала соберите кандидатов. Потом модель сравнит каждое резюме с требованиями и объяснит балл.', 'Collect the candidates first. Then the model compares every resume with the requirements and explains the score.')));
        scoreBtn = h('button.btn.btn-acc', { type: 'button', disabled: true, onclick: score }, icon('bolt'), T('Оценить кандидатов', 'Score candidates'));
        scoreFoot.innerHTML = '';
        scoreFoot.hidden = false;
        scoreFoot.appendChild(scoreBtn);
        winScore.note('');

        biasBody.classList.add('off');
        segLock(true);
        segG.set(''); segA.set(''); segC.set('');
        biasWho.textContent = T('не выбран', 'not selected');
        tbody.innerHTML = ''; trs = {};
        tblWrap.hidden = true;
        verdict.hidden = true;
        paintRes('none');

        log.clear();
        cnt.set('apps', '0'); cnt.set('cards', '0'); cnt.set('dups', '0'); cnt.set('bias', '0');
        ctx.end(null);
        ctx.now(T('В четырёх источниках ждут пять новых откликов. Нажмите <b>«Собрать кандидатов»</b>.', 'Five new applications are waiting in four sources. Press <b>"Collect candidates"</b>.'));
      }

      function start() {
        ctx.clearTimers();
        S = fresh(); clock = 0;
        base();
      }

      /* ---------- stage 1: collect, merge the duplicate ---------- */
      function take(k) {
        var s = srcNodes[k];
        s.left--; S.got++;
        cnt.set('apps', String(S.got));
        winSrc.note(T('забрано ' + S.got + ' из 5', S.got + ' of 5 collected'));
        s.el.classList.add('on');
        ctx.later(function () { s.el.classList.remove('on'); }, 900);
        if (!s.left) {
          s.el.classList.add('done');
          s.badge.textContent = '';
          s.badge.appendChild(icon('check'));
          s.badge.appendChild(document.createTextNode(String(SRC[k].n)));
        }
      }
      function makeCard(c) {
        var o = { c: c };
        o.mail = h('span.hiring-mail', null, c.mail);
        o.tags = h('span.hiring-tags', null, h('span.tg.tg-hum', null, SRC[c.src].tag));
        o.fill = h('i', { style: 'width:0' });
        o.num = h('b.hiring-num', null, '—');
        o.el = h('button.bc.hiring-card', { type: 'button', disabled: true, 'aria-pressed': 'false', onclick: function () { select(c.id); } },
          h('span.hiring-head', null, h('span.hiring-name', null, c.name), o.mail),
          o.tags,
          h('span.hiring-sc', null, h('span.bar', null, o.fill), o.num));
        o.slot = h('div.hiring-slot.in-pop', null, o.el);
        cards[c.id] = o;
        return o;
      }
      function arrive(c) {
        take(c.src);
        var o = makeCard(c);
        if (!S.cards) baseBody.innerHTML = '';
        baseBody.appendChild(o.slot);
        S.cards++;
        cnt.set('cards', String(S.cards));
        winBase.note(T('карточек: ' + S.cards, S.cards + (S.cards === 1 ? ' card' : ' cards')));
        log.add(tm(2), SRC[c.src].name + ': ' + c.name + T(', новая карточка', ', new card'), 'sys');
        ctx.focus(o.slot);
      }
      function arriveDup() {
        take(DUP.src);
        dup = { mail: h('span.hiring-mail', null, DUP.mail), tags: h('span.hiring-tags', null, h('span.tg.tg-hum', null, SRC[DUP.src].tag)) };
        dup.rec = h('div.bc.hiring-rec', null, h('span.hiring-head', null, h('span.hiring-name', null, DUP.name), dup.mail), dup.tags);
        dup.wrap = h('div.hiring-dup.in-pop', null, h('div.hiring-dup-in', null, dup.rec));
        cards[TOP].slot.appendChild(dup.wrap);
        log.add(tm(2), SRC[DUP.src].name + ': ' + DUP.name + T(', новый отклик', ', new application'), 'sys');
        ctx.focus(dup.wrap);
      }
      function detectDup() {
        var a = cards[TOP];
        dup.wrap.classList.remove('in-pop');
        a.mail.classList.add('hit'); dup.mail.classList.add('hit');
        a.el.classList.add('q'); dup.rec.classList.add('q');
        dup.tags.appendChild(h('span.tg.tg-wait.in-pop', null, T('та же почта: дубль', 'same email: duplicate')));
        log.add(tm(1), T('Почта та же, что в карточке ', 'Same email as in the card of ') + a.c.name + T(': это один человек', ': it is one person'), 'warn');
      }
      function mergeDup() {
        var a = cards[TOP];
        dup.wrap.classList.add('gone');
        a.mail.classList.remove('hit');
        a.el.classList.remove('q');
        a.el.classList.add('flash');
        a.tags.appendChild(h('span.tg.tg-hum.in-pop', null, SRC[DUP.src].tag));
        a.tags.appendChild(h('span.tg.tg-ok.in-pop', null, T('дубль склеен: 2 источника', 'duplicate merged: 2 sources')));
        cnt.set('dups', '1');
        log.add(tm(1), T('Дубль склеен: одна карточка, два источника', 'Duplicate merged: one card, two sources'), 'sys');
        ctx.focus(a.slot);
      }
      function dropDup() {
        if (dup.wrap.parentNode) dup.wrap.parentNode.removeChild(dup.wrap);
        fact.hidden = false;
      }
      function collected() {
        S.stage = 'collected'; S.busy = false;
        srcFoot.innerHTML = '';
        srcFoot.appendChild(h('p.okl.in-pop', null, icon('check'), T('Собрано 5 откликов из 4 источников', '5 applications collected from 4 sources')));
        scoreBtn.disabled = false;
        scoreView.innerHTML = '';
        scoreView.appendChild(h('p.hiring-ph', null, T('В базе 4 карточки. Модель сравнит каждое резюме с требованиями и объяснит балл.', '4 cards in the base. The model compares every resume with the requirements and explains the score.')));
        log.add(tm(1), T('Сбор закончен: 5 откликов, 4 карточки в базе', 'Collection finished: 5 applications, 4 cards in the base'), 'sys');
        ctx.now(T('Пять откликов стали четырьмя карточками: дубль склеен. Теперь нажмите <b>«Оценить кандидатов»</b>.', 'Five applications became four cards: the duplicate is merged. Now press <b>"Score candidates"</b>.'));
        ctx.focus(scoreBtn);
      }
      function collect() {
        if (S.stage !== 'idle') return;
        S.stage = 'collecting'; S.busy = true;
        collectBtn.disabled = true;
        ctx.now(T('Система забирает отклики по одному. Следите за базой: один человек придёт из двух источников.', 'The system pulls the applications one by one. Watch the base: one person will come from two sources.'));
        log.add(tm(0), T('Запущен сбор: 4 источника, 5 новых откликов', 'Collection started: 4 sources, 5 new applications'));
        chain([
          [600, function () { arrive(CANDS[0]); }],
          [2000, arriveDup],
          [1800, detectDup],
          [2500, mergeDup],
          [700, dropDup],
          [1700, function () { arrive(CANDS[1]); }],
          [1800, function () { arrive(CANDS[2]); }],
          [1800, function () { arrive(CANDS[3]); }],
          [1500, collected]
        ]);
      }

      /* ---------- stage 2: score every card ---------- */
      function scoreStart(c, i) {
        var o = cards[c.id];
        o.el.classList.add('run');
        o.num.textContent = '';
        o.num.appendChild(dots());
        progName.textContent = c.name;
        winScore.note(T('оцениваю ' + (i + 1) + ' из 4', 'scoring ' + (i + 1) + ' of 4'));
        ctx.focus(o.slot);
      }
      function scoreEnd(c, i) {
        var o = cards[c.id];
        o.el.classList.remove('run');
        o.fill.style.width = c.score + '%';
        o.num.textContent = String(c.score);
        o.num.classList.add('set');
        progFill.style.width = (i + 1) * 25 + '%';
        log.add(tm(3), c.name + ': ' + c.score + T(' из 100', ' out of 100'), 'sys');
      }
      function scored() {
        S.stage = 'scored'; S.busy = false;
        scoreFoot.hidden = true;
        scoreView.innerHTML = '';
        scoreView.appendChild(h('p.hiring-ph', null, T('Оценки готовы. Нажмите на карточку в базе: здесь появятся балл и причины.', 'Scores are ready. Click a card in the base: the score and the reasons will show up here.')));
        winScore.note(T('оценено 4 из 4', '4 of 4 scored'));
        CANDS.forEach(function (c) { cards[c.id].el.disabled = false; });
        cards[TOP].slot.classList.add('pulse');
        log.add(tm(1), T('Оценка готова: у каждого балла есть причины', 'Scoring finished: every score comes with reasons'), 'sys');
        ctx.now(T('Оценки готовы. Нажмите на карточку <b>', 'Scores are ready. Click the <b>') + ctx.esc(byId[TOP].name) + T('</b> в базе и посмотрите, из чего сложился балл.', '</b> card in the base to see what the score is made of.'));
        ctx.focus(cards[TOP].slot);
      }
      function score() {
        if (S.stage !== 'collected') return;
        S.stage = 'scoring'; S.busy = true;
        scoreBtn.disabled = true;
        progName = h('b');
        progFill = h('i', { style: 'width:0' });
        scoreView.innerHTML = '';
        scoreView.appendChild(h('p.hiring-ph.hiring-prog', null, dots(), h('span', null, T('Сравниваю с требованиями: ', 'Comparing with the requirements: '), progName)));
        scoreView.appendChild(h('div.bar', { style: 'margin-top:10px' }, progFill));
        ctx.now(T('Модель сравнивает каждое резюме с требованиями вакансии и ставит балл.', 'The model compares every resume with the vacancy requirements and gives a score.'));
        log.add(tm(4), T('Запущена оценка под вакансию «', 'Scoring started for the "') + VAC + T('»', '" vacancy'));
        var steps = [];
        CANDS.forEach(function (c, i) {
          steps.push([i ? 700 : 500, function () { scoreStart(c, i); }]);
          steps.push([1500, function () { scoreEnd(c, i); }]);
        });
        steps.push([1100, scored]);
        chain(steps);
      }

      /* ---------- stage 3: open a card, read the reasons ---------- */
      function showScore(c) {
        var g = ++S.gen, first = !S.seen[c.id];
        var fill = h('i', { style: 'width:0' });
        var texts = c.plus.concat(c.minus);
        var lines = texts.map(function (t, i) {
          var ok = i < c.plus.length, sp = h('span', null, first ? '' : t);
          return { li: h('li.' + (ok ? 'p-ok' : 'p-no') + (first ? '' : '.on'), null, icon(ok ? 'check' : 'x'), sp), sp: sp };
        });
        var lis = lines.map(function (l) { return l.li; });
        scoreView.innerHTML = '';
        scoreView.appendChild(h('div.hiring-top', null,
          h('div', null, h('p.hiring-lbl', null, T('Кандидат', 'Candidate')), h('p.hiring-cand', null, c.name)),
          h('p.hiring-big', null, h('b', null, String(c.score)), ' / 100')));
        scoreView.appendChild(h('div.bar.hiring-bigbar', null, fill));
        scoreView.appendChild(h('p.hiring-lbl', null, T('Сильные стороны', 'Strong points')));
        scoreView.appendChild(h('ul.hiring-pts', null, lis.slice(0, c.plus.length)));
        scoreView.appendChild(h('p.hiring-lbl', null, T('Чего не хватает', 'What is missing')));
        scoreView.appendChild(h('ul.hiring-pts', null, lis.slice(c.plus.length)));
        void fill.offsetWidth;
        fill.style.width = c.score + '%';
        if (!first) return;
        /* first reveal: the reasons are written line by line, like a model answering */
        S.seen[c.id] = true; S.typing = true;
        function go(i) {
          if (g !== S.gen) return;
          if (i >= lines.length) { S.typing = false; hold(1500); return; }
          lines[i].li.classList.add('on');
          ctx.type(lines[i].sp, texts[i], function () { ctx.later(function () { go(i + 1); }, 320); }, 140);
        }
        ctx.later(function () { go(0); }, 350);
      }

      /* ---------- stage 4: bias check on the open profile ---------- */
      function paintRes(mode) {
        resV.innerHTML = '';
        if (mode === 'none') { resL.textContent = T('Сначала оцените кандидатов и откройте карточку.', 'Score the candidates and open a card first.'); return; }
        resL.textContent = T('Балл с этими данными', 'Score with these values');
        if (mode === 'wait') { resV.appendChild(dots()); resV.appendChild(h('span.tg.tg-acc', null, T('пересчитываю', 're-scoring'))); return; }
        resV.appendChild(h('b' + (mode === 'ok' ? '.in-pop' : ''), null, String(byId[S.sel].score)));
        resV.appendChild(mode === 'ok' ? h('span.tg.tg-ok.in-pop', null, 'Δ 0') : h('span.tg.tg-hum', null, T('исходный профиль', 'original profile')));
      }
      function addRow(c, r, isBase) {
        var tr = h('tr', null,
          h('td' + (r.g !== c.g ? '.ch' : ''), null, GL[r.g]),
          h('td' + (r.a !== c.a ? '.ch' : ''), null, r.a),
          h('td' + (r.c !== c.c ? '.ch' : ''), null, CL[r.c]),
          isBase ? h('td.num', null, String(c.score), h('small', null, T('исходный', 'original')))
            : h('td.num', null, h('span.hiring-ok', null, icon('check'), String(c.score))));
        trs[r.g + '|' + r.a + '|' + r.c] = tr;
        tbody.appendChild(tr);
        return tr;
      }
      /* which protected attributes were really scored with another value */
      function cover(id) {
        var c = byId[id], o = { g: false, a: false, c: false, ages: {} };
        S.bias[id].rows.forEach(function (r) {
          if (r.g !== c.g) o.g = true;
          if (r.a !== c.a) { o.a = true; o.ages[r.a] = true; }
          if (r.c !== c.c) o.c = true;
        });
        o.all = o.g && o.a && o.c;
        return o;
      }
      function hint(id) {
        var c = byId[id], b = S.bias[id], cov = cover(id), left = [];
        if (b.passed) { ctx.now(T('Проверка пройдена. Откройте другую карточку и повторите проверку на ней.', 'Check passed. Open another card and repeat the check on it.')); return; }
        if (!cov.g) left.push(T('<b>пол</b>', '<b>gender</b>'));
        if (!cov.a) left.push(T('<b>возраст</b>', '<b>age</b>'));
        if (!cov.c) left.push(T('<b>гражданство</b>', '<b>citizenship</b>'));
        if (!b.n) ctx.now(T('У балла есть причины. Теперь проверьте модель: поменяйте в окне проверки ' + listOf(left) + '.', 'The score comes with reasons. Now test the model: change ' + listOf(left) + ' in the bias check window.'));
        else ctx.now(T('Балл тот же: ' + c.score + '. Осталось поменять: ' + listOf(left) + '.', 'Same score: ' + c.score + '. Still to change: ' + listOf(left) + '.'));
      }
      function showBias(c) {
        var b = S.bias[c.id] || (S.bias[c.id] = { g: c.g, a: c.a, c: c.c, rows: [], n: 0, passed: false });
        biasBody.classList.remove('off');
        segLock(false);
        biasWho.textContent = c.name;
        segG.set(b.g); segA.set(b.a); segC.set(b.c);
        tbody.innerHTML = ''; trs = {};
        addRow(c, { g: c.g, a: c.a, c: c.c }, true);
        b.rows.forEach(function (r) { addRow(c, r, false); });
        tblWrap.hidden = false;
        verdict.hidden = !b.passed;
        paintRes(b.n ? 'ok' : 'base');
      }
      function select(id) {
        if (S.stage !== 'scored' || S.sel === id) return;
        if (S.pending) resolve(true);   /* finish the running check of the previous card before leaving it */
        unhold();
        S.bgen++; S.typing = false;
        S.sel = id;
        var c = byId[id];
        CANDS.forEach(function (x) {
          cards[x.id].el.setAttribute('aria-pressed', String(x.id === id));
          cards[x.id].slot.classList.remove('pulse');
        });
        log.add(tm(3), T('Открыта карточка: ', 'Card opened: ') + c.name);
        showScore(c);
        showBias(c);
        hint(id);
        ctx.later(function () { ctx.focus(winScore); }, 300);
      }
      function change(attr, v) {
        if (!S.sel) return;
        var g = ++S.bgen;
        S.bias[S.sel][attr] = v;
        unhold();
        S.pending = true;
        paintRes('wait');
        ctx.later(function () { if (g === S.bgen && S.pending) resolve(false); }, 650);
      }
      function resolve(quiet) {
        var id = S.sel, c = byId[id], b = S.bias[id], key = b.g + '|' + b.a + '|' + b.c, tr = trs[key];
        S.pending = false;
        S.checks++; b.n++;
        cnt.set('bias', String(S.checks));
        if (tr) { tr.classList.remove('in'); void tr.offsetWidth; }
        else { var r = { g: b.g, a: b.a, c: b.c }; b.rows.push(r); tr = addRow(c, r, false); }
        tr.classList.add('in');
        paintRes('ok');
        log.add(tm(2), T('Проверка: пол ', 'Check: gender ') + GL[b.g] + T(', возраст ', ', age ') + b.a + T(', гражданство ', ', citizenship ') + CL[b.c] + T('. Балл ', '. Score ') + c.score + ', Δ 0', 'sys');
        if (!b.passed && cover(id).all) {
          b.passed = true;
          verdict.hidden = false;
          log.add(tm(1), T('Проверка на предвзятость пройдена: балл ', 'Bias check passed: the score is ') + c.score + T(' во всех вариантах', ' in every variant'), 'sys');
          ctx.end(END);
        }
        if (quiet) return;
        hint(id);
        hold(2000);
        ctx.focus(b.passed ? verdict : res);
      }

      start();

      return {
        reset: function () { start(); },
        next: function () {
          if (S.busy || S.typing || S.pending || S.hold) return 'wait';
          if (S.stage === 'idle') return collectBtn;
          if (S.stage === 'collected') return scoreBtn;
          if (S.stage !== 'scored') return 'wait';
          if (!S.sel) return cards[TOP].el;
          var c = byId[S.sel], cov = cover(S.sel);
          if (cov.all) return null;
          if (!cov.g) return segG.btn(c.g === 'm' ? 'f' : 'm');
          var ages = AGES.filter(function (a) { return a !== c.a && !cov.ages[a]; });
          if (!cov.c && ages.length) return segA.btn(ages[0]);   /* both other ages first, citizenship closes the check */
          if (!cov.a) return segA.btn(ages[0]);
          return segC.btn(CITS.filter(function (k) { return k !== c.c; })[0]);
        }
      };
    }
  });
})();
