/* Mini app: overnight AI development team. A task gets the label "night", at 02:00 an executor agent does it on its own stand
   and opens a PR, a separate verifier re-checks the result on a clean copy, in the morning a person merges.
   Same structure as apps/support.js: state object S, a base render per scenario, small incremental updates while the night runs. */
(function () {
  'use strict';
  var CSS = [
    '.nightagent-tasks{display:grid;gap:8px}',
    '.nightagent-task{display:flex;gap:10px;align-items:flex-start;width:100%;text-align:left;background:var(--card);border:1px solid var(--line);border-radius:13px;padding:10px 12px;min-height:44px;font:500 14.5px/1.35 var(--fb);color:var(--ink);transition:border-color .2s ease,box-shadow .2s ease,opacity .25s ease}',
    'button.nightagent-task{cursor:pointer}',
    'button.nightagent-task[disabled]{cursor:default}',
    '.nightagent-task>i{width:16px;height:16px;flex:none;margin-top:2px;border-radius:50%;border:1.5px solid var(--ink3);background:var(--bg)}',
    '.nightagent-task>span{display:grid;gap:7px;min-width:0}',
    '.nightagent-task b{font:500 12.5px/1 var(--fm);color:var(--ink3);margin-right:8px}',
    '.nightagent-task[aria-pressed="true"]{border-color:var(--acc);box-shadow:0 0 0 3px var(--acc-soft)}',
    '.nightagent-task[aria-pressed="true"]>i{border-color:var(--acc);background:var(--acc);box-shadow:inset 0 0 0 3px var(--bg)}',
    '.nightagent-off{opacity:.5}',
    '.nightagent-lb{display:flex;flex-wrap:wrap;gap:6px}',
    '.nightagent-hint{margin-top:10px;font-size:12.5px;line-height:1.45;color:var(--ink3)}',
    '.nightagent-steps .o:empty{display:none}',
    '.nightagent-diff{display:block;width:fit-content;max-width:100%;margin-top:5px;padding:2px 8px;border-radius:7px;background:var(--bad-soft);color:var(--bad);overflow-wrap:anywhere}',
    '.nightagent-chk{display:grid;margin-top:10px}',
    '.nightagent-chk li{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:7px 0;border-top:1px solid var(--line2);font-size:13.5px;line-height:1.35}',
    '.nightagent-chk li>span{display:flex;align-items:center;gap:8px;font-weight:600;min-width:0}',
    '.nightagent-chk li>span svg{width:16px;height:16px;flex:none;color:var(--ok)}',
    '.nightagent-chk li>span i{width:14px;height:14px;margin:1px;flex:none;border-radius:50%;border:1.5px dashed var(--ink3)}',
    '.nightagent-chk li>em{font:500 12.5px/1.3 var(--fm);color:var(--ink2);text-align:right}',
    '.nightagent-chk li.nightagent-pend>span{color:var(--ink3);font-weight:500}',
    '.nightagent-chk li.nightagent-pend>em{color:var(--ink3)}',
    '.nightagent-nb{white-space:nowrap}',
    /* phone: the rule of the window goes under its title instead of squeezing next to it */
    '@media (max-width:640px){.nightagent-sub .win-h{flex-wrap:wrap;row-gap:3px}.nightagent-sub .win-h small{flex-basis:100%;margin-left:24px;text-align:left}}',
    '@media (hover:hover) and (pointer:fine){button.nightagent-task:hover:not([disabled]):not([aria-pressed="true"]){border-color:var(--ink3)}}'
  ].join('');

  PF.app('nightagent', {
    cap: [
      'Макет на выдуманных данных. Настоящая система устроена так же: агент-исполнитель, отдельный проверяющий, свой стенд на каждую задачу и артефакты как доказательство.',
      'A mock on invented data. The real setup runs the same way: an executor agent, a separate verifier, a stand per task and artefacts as proof.'
    ],
    pace: 1000,
    mount: function (ctx) {
      var T = ctx.T, h = ctx.h, icon = ctx.icon;
      if (!document.getElementById('pf-nightagent-css')) document.head.appendChild(h('style', { id: 'pf-nightagent-css' }, CSS));
      var DBG = (/[?&]dbg=(\w+)/.exec(location.search) || [])[1]; /* TEMP: remove before finishing */

      /* ---------- invented data ---------- */
      var TASKS = [
        { n: 412, pr: 431, t: T('Кнопка «Повторить оплату» в карточке брони', 'A "Retry payment" button on the booking card'), slug: 'retry-payment', plan: T('4 шага · затронет 3 файла', '4 steps · touches 3 files'), diff: '+86 −12', tests: 14, vid: '0:42', vid2: '0:44', as: "expect(payment.status).toBe('paid')" },
        { n: 415, pr: 432, t: T('Фильтр броней по дате заезда', 'Filter bookings by check-in date'), slug: 'checkin-filter', plan: T('3 шага · затронет 2 файла', '3 steps · touches 2 files'), diff: '+64 −9', tests: 11, vid: '0:35', vid2: '0:36', as: 'expect(rows).toHaveLength(3)' },
        { n: 419, pr: 433, t: T('Подсказка в пустом списке гостей', 'A hint in the empty guest list'), slug: 'guests-empty-hint', plan: T('3 шага · затронет 2 файла', '3 steps · touches 2 files'), diff: '+41 −5', tests: 9, vid: '0:28', vid2: '0:29', as: 'expect(hint).toBeVisible()' }
      ];
      var EX = [T('План', 'Plan'), T('Код', 'Code'), T('Свой стенд с копией базы', 'Own stand with a database copy'), T('Тесты', 'Tests'), T('Видео Playwright', 'Playwright video'), 'PR'];
      var VR = [T('Чистая копия кода', 'Clean copy of the code'), T('Запускает тесты сам', 'Runs the tests itself'), T('Смотрит артефакты', 'Checks the artefacts'), T('Вердикт', 'Verdict')];
      var CHK = [T('тесты', 'tests'), T('видео Playwright', 'Playwright video'), T('вердикт проверяющего', 'verifier verdict'), T('тесты не ослаблены', 'tests not weakened')];
      /* clock per step, [round 1, round 2] */
      var EX_T = [['02:03', '02:14', '02:17', '02:26', '02:29', '02:31'], ['02:46', '02:58', '03:01', '03:07', '03:10', '03:12']];
      var VR_T = [['02:32', '02:40', '02:42', '02:43'], ['03:13', '03:21', '03:23', '03:24']];
      /* cents per step: one clean night adds up to $1.80 */
      var EX_C = [[10, 55, 5, 30, 20, 15], [5, 35, 5, 20, 20, 5]], VR_C = [5, 25, 10, 5];
      var TAG = {
        idle: [T('ждёт', 'waiting'), 'tg-hum'], run: [T('работает', 'working'), 'tg-acc'], done: [T('готово', 'done'), 'tg-ok'],
        stop: [T('стоп', 'stop'), 'tg-bad'], skip: [T('не начат', 'not started'), 'tg-hum']
      };
      var WHO = { sys: T('расписание', 'schedule'), ex: T('исполнитель', 'executor'), vr: T('проверяющий', 'verifier') };
      var DOTS = '<span class="typing"><i></i><i></i><i></i></span>';
      var TOUR = ['ok', 'cheat', 'none'];
      var S, seen = {};
      function fresh(sc, sel) { return { sc: sc || 'ok', sel: sel || 0, phase: 'idle', running: false, hold: false, cents: 0, art: 0 }; }

      /* ---------- static frame ---------- */
      var segSc = ctx.seg(T('Ночь', 'Night'), [
        ['ok', T('Обычная задача', 'A normal task')],
        ['cheat', T('Агент схитрил', 'The agent cut a corner')],
        ['none', T('Задач нет', 'No tasks')]
      ], 'ok', function (v) { start(v, S.sel); });
      ctx.bar.appendChild(segSc);

      var taskBody = h('div.win-b');
      var mornBody = h('div.feed');
      var exOl = h('ol.steps.nightagent-steps'), vrOl = h('ol.steps.nightagent-steps');
      var log = ctx.logger(T('Пока пусто. Каждый шаг ночи попадёт сюда со временем.', 'Empty for now. Every step of the night lands here with a timestamp.'), WHO.ex);
      var cnt = ctx.counters([
        ['hum', T('часов человека ночью', 'human hours at night')],
        ['art', T('доказательств приложено', 'artefacts attached')],
        ['rnd', T('кругов проверки', 'verification rounds')],
        ['usd', T('потрачено', 'spent'), '$0']
      ]);
      var winTasks = ctx.win('git', T('Задачи', 'Tasks'), 'GitHub Issues', taskBody);
      var winMorn = ctx.win('user', T('Утро', 'Morning'), '',
        h('div.win-note', { html: T('Отчёт исполнителя не доказательство: нужны артефакты. <span class="nightagent-nb">UI-задача</span> без видео прогона считается непроверенной.', "The executor's report is not evidence: artefacts are required. A UI task without a video of the passing run counts as unverified.") }),
        mornBody);
      var winEx = ctx.win('bot', T('02:00 · исполнитель', '02:00 · executor'), '', exOl);
      var winVr = ctx.win('shield', T('Проверяющий агент', 'Verifier agent'), T('не видит рассуждений исполнителя', "does not see the executor's reasoning"), vrOl);
      var winLog = ctx.win('log', T('Журнал ночи', 'Night log'), T('время условное', 'time is illustrative'), log.el, cnt.el);
      winTasks.classList.add('o1'); winEx.classList.add('o2', 'nightagent-sub'); winVr.classList.add('o3', 'nightagent-sub'); winMorn.classList.add('o4');
      /* core's win.title() cannot work: "title" is a built-in HTMLElement property, so the assignment in core.js turns the function
         into a tooltip with its source text. Drop that tooltip and set the header text directly. */
      [winTasks, winMorn, winEx, winVr, winLog].forEach(function (w) { w.removeAttribute('title'); });
      function retitle(w, text) { w.querySelector('.win-h span').textContent = text; }
      ctx.body.appendChild(h('div.demo-grid.flow', null,
        h('div.demo-col', null, winTasks, winMorn),
        h('div.demo-col', null, winEx, winVr)));
      winLog.classList.add('demo-wide');
      ctx.body.appendChild(winLog);

      var taskN, exN, vrN, actBtn, M;

      /* ---------- small helpers ---------- */
      function step(n, state, html, tag) {
        n.li.className = 'stp ' + state;
        n.st.className = 'tg ' + TAG[state][1];
        n.st.textContent = tag || TAG[state][0];
        if (html != null) { n.o.innerHTML = html; n.o.classList.remove('in-pop'); void n.o.offsetWidth; n.o.classList.add('in-pop'); }
      }
      function steps(ol, titles) {
        ol.innerHTML = '';
        return titles.map(function (t, i) {
          var n = { o: h('div.o'), st: h('span.tg') };
          n.li = h('li.stp', null, h('span.n', null, String(i + 1)), h('div', null, h('div.t', null, t)), n.st, n.o);
          ol.appendChild(n.li);
          step(n, 'idle');
          return n;
        });
      }
      function say(time, who, text) { log.add(time, text, 'sys').lastChild.setAttribute('data-sys', who); }
      function spend(c) { S.cents += c; cnt.set('usd', '$' + (S.cents / 100).toFixed(2)); }
      function art(n) { S.art = n; cnt.set('art', String(n)); }
      /* runs [delay, fn] pairs one after another; every delay goes through ctx.later, so reset cancels the rest */
      function play(list, i) {
        i = i || 0;
        if (i >= list.length) return;
        ctx.later(function () { list[i][1](); play(list, i + 1); }, list[i][0]);
      }
      /* autoplay waits a moment on the outcome banner before it moves to the next night */
      function rest() {
        if (TOUR.every(function (k) { return seen[k]; })) return;
        S.hold = true;
        ctx.later(function () { S.hold = false; }, 2200);
      }

      /* ---------- render of a fresh scenario ---------- */
      function base() {
        var none = S.sc === 'none';
        segSc.set(S.sc);

        taskBody.innerHTML = '';
        var list = h('div.nightagent-tasks');
        taskN = TASKS.map(function (t, i) {
          var lb = h('span.nightagent-lb', null, h('span.tg.tg-hum', null, 'ui'));
          var text = h('span', null, h('span', null, h('b', null, '#' + t.n), t.t), lb);
          var row = none ? h('div.nightagent-task', null, text)
            : h('button.nightagent-task', { type: 'button', 'aria-pressed': String(i === S.sel), onclick: function () { pick(i); } }, h('i'), text);
          list.appendChild(row);
          return { row: row, lb: lb };
        });
        actBtn = h('button.btn.btn-acc', { type: 'button', onclick: act }, icon(none ? 'clock' : 'moon'), none ? T('Наступила ночь', 'Night comes') : T('Отдать на ночь', 'Hand over for the night'));
        taskBody.appendChild(list);
        taskBody.appendChild(h('div.bc-btns', null, actBtn));
        taskBody.appendChild(h('p.nightagent-hint', null, none
          ? T('Сегодня метку night никто не поставил.', 'Nobody put the night label today.')
          : T('Метку ставят в GitHub или командой в Telegram с одноразовым кодом подтверждения.', 'The label is set in GitHub or by a Telegram command with a one-time confirmation code.')));

        exN = steps(exOl, EX); vrN = steps(vrOl, VR);
        retitle(winEx, T('02:00 · исполнитель', '02:00 · executor'));
        winEx.note(none ? T('нет задачи или сервер не готов: не запускается', 'no task or server not ready: does not start') : T('тесты ослаблять и удалять нельзя', 'tests may not be weakened or deleted'));
        retitle(winVr, T('Проверяющий агент', 'Verifier agent'));

        M = {
          to: h('p.bc-to', null, T('PR · ждём утра', 'PR · waiting for the morning')),
          title: h('h5', { style: 'color:var(--ink3)' }, T('Человек спит. Утром здесь будет готовый PR.', 'The person is asleep. The ready PR shows up here in the morning.')),
          meta: h('p.meta.mono', { hidden: true }),
          btn: h('button.btn.btn-acc', { type: 'button', disabled: true, onclick: merge }, icon('git'), T('Смержить', 'Merge'))
        };
        M.rows = CHK.map(function (c) {
          var r = { val: h('em', null, '—') };
          r.lab = h('span', null, h('i'), c);
          r.li = h('li.nightagent-pend', null, r.lab, r.val);
          return r;
        });
        M.btns = h('div.bc-btns', null, M.btn);
        M.card = h('div.bc', null, M.to, M.title, M.meta, h('ul.nightagent-chk', null, M.rows.map(function (r) { return r.li; })), M.btns);
        mornBody.innerHTML = '';
        mornBody.appendChild(M.card);
        winMorn.note(T('человек спит', 'the person is asleep'));

        log.clear();
        cnt.set('hum', '0'); cnt.set('art', '0'); cnt.set('rnd', '0'); cnt.set('usd', '$0');
        ctx.end(null);
        ctx.now(none ? T('Сегодня метку night никто не поставил. Нажмите <b>«Наступила ночь»</b> и посмотрите, что сделает агент.', 'Nobody put the night label today. Press <b>"Night comes"</b> and see what the agent does.')
          : S.sc === 'cheat' ? T('В эту ночь исполнитель схитрит с тестом. Нажмите <b>«Отдать на ночь»</b> и следите за проверяющим агентом.', 'Tonight the executor will cut a corner on a test. Press <b>"Hand over for the night"</b> and watch the verifier agent.')
          : T('Вечер. Выберите задачу и нажмите <b>«Отдать на ночь»</b>: на ней появится метка night.', 'It is evening. Pick a task and press <b>"Hand over for the night"</b>: it gets the night label.'));
      }

      function start(sc, sel) {
        ctx.clearTimers();
        S = fresh(sc, sel);
        base();
      }
      function pick(i) {
        if (S.phase !== 'idle') return;
        S.sel = i;
        taskN.forEach(function (n, k) { n.row.setAttribute('aria-pressed', String(k === i)); });
      }

      /* ---------- the night ---------- */
      function act() {
        if (S.running) return;
        if (S.phase !== 'idle') { start(S.sc, S.sel); return; }
        S.phase = 'night'; S.running = true;
        actBtn.disabled = true;
        if (S.sc === 'none') emptyNight(); else handOver();
      }

      function handOver() {
        var t = TASKS[S.sel], cheat = S.sc === 'cheat';
        taskN.forEach(function (n, i) { n.row.disabled = true; if (i !== S.sel) n.row.classList.add('nightagent-off'); });
        taskN[S.sel].lb.appendChild(h('span.tg.tg-acc.in-pop', null, 'night'));
        log.add('19:40', T('Человек поставил метку night на задачу #', 'A person put the night label on task #') + t.n);
        ctx.now(T('Метка <b>night</b> стоит, человек ушёл спать. В 02:00 агент сам возьмёт задачу.', 'The <b>night</b> label is on and the person has gone to sleep. At 02:00 the agent picks the task up on its own.'));
        var seq = [[900, function () {
          say('02:00', WHO.sys, T('Задача #' + t.n + ' в очереди, сервер готов: запуск', 'Task #' + t.n + ' is queued, the server is ready: starting'));
          ctx.now(T('<b>02:00.</b> Задача есть, сервер готов. Исполнитель работает, человек спит.', '<b>02:00.</b> There is a task and the server is ready. The executor is working, the person is asleep.'));
        }]].concat(exSeq(1, 300), [[600, function () { verify(1); }]], vrSeq(1, cheat));
        if (DBG === 'reject') { seq.push([300, function () { S.running = false; S.phase = 'done'; }]); play(seq); return; } /* TEMP */
        if (cheat) seq = seq.concat([[2000, redo]], exSeq(2, 600), [[600, function () { verify(2); }]], vrSeq(2, false));
        seq.push([800, morning]);
        play(seq);
      }

      function exSeq(r, d0) {
        var fast = r === 2, a = [];
        EX.forEach(function (_, i) {
          a.push([i ? (fast ? 180 : 450) : d0, function () { step(exN[i], 'run', DOTS); ctx.focus(exN[i].li); }]);
          a.push([fast ? 320 : 650, function () { exDone(i, r); }]);
        });
        return a;
      }
      function exDone(i, r) {
        var t = TASKS[S.sel], cheat = S.sc === 'cheat' && r === 1, tm = EX_T[r - 1][i];
        var br = 'night/' + t.n + '-' + t.slug, pr = 'PR #' + t.pr, stand = T('стенд ', 'stand ') + '<b>task-' + t.n + '</b>';
        var green = '<span class="hl-ok">' + t.tests + T(' тестов зелёные', ' tests green') + '</span>';
        var out = r === 1 ? [
          t.plan,
          T('ветка ', 'branch ') + '<b>' + br + '</b> · ' + t.diff,
          stand + T(' поднят · база скопирована', ' is up · database copied'),
          cheat ? T('1 тест падал · ', '1 test was failing · ') + '<span class="hl-wait">' + T('убрал проверку, стало ' + t.tests + ' зелёных', 'removed an assertion, now ' + t.tests + ' green') + '</span><span class="nightagent-diff">− ' + ctx.esc(t.as) + '</span>'
            : green + T(' · 2 новых', ' · 2 new'),
          T('видео ', 'video ') + '<b>' + t.vid + '</b>' + T(' · прогон прошёл', ' · the run passed'),
          '<b>' + pr + '</b>' + (cheat ? T(' открыт · в отчёте: ', ' opened · the report says ') + '<span class="hl-wait">' + T('«всё проверено»', '"all checked"') + '</span>' : T(' открыт · отчёт тестов и видео приложены', ' opened · test report and video attached'))
        ] : [
          T('вернуть проверку, чинить код, а не тест', 'restore the assertion, fix the code, not the test'),
          T('та же ветка · +19 −4 · проверка на месте', 'same branch · +19 −4 · the assertion is back'),
          stand + T(' · база скопирована заново', ' · fresh database copy'),
          green + T(' · тесты не тронуты', ' · tests untouched'),
          T('видео ', 'video ') + '<b>' + t.vid2 + '</b>' + T(' · новый прогон прошёл', ' · the new run passed'),
          '<b>' + pr + '</b>' + T(' обновлён · новые артефакты приложены', ' updated · new artefacts attached')
        ];
        var lg = r === 1 ? [
          null,
          T('Код в ветке ', 'Code is in branch ') + br,
          T('Стенд task-' + t.n + ' поднят, база скопирована', 'Stand task-' + t.n + ' is up, database copied'),
          t.tests + T(' тестов зелёные', ' tests green'),
          T('Видео Playwright записано: ', 'Playwright video recorded: ') + t.vid,
          pr + T(' открыт, отчёт тестов и видео приложены', ' opened, test report and video attached')
        ] : [
          null,
          T('Круг 2: проверка возвращена, исправлен код, а не тест', 'Round 2: the assertion is back, the code is fixed, not the test'),
          null,
          t.tests + T(' тестов зелёные, сами тесты не тронуты', ' tests green, the tests themselves untouched'),
          null,
          pr + T(' обновлён, новые отчёт и видео приложены', ' updated, a new report and video attached')
        ];
        step(exN[i], 'done', out[i]);
        spend(EX_C[r - 1][i]);
        if (i === 3 || i === 4) art(S.art + 1);
        if (cheat && i === 3) {
          log.add(tm, T('Исполнитель: тест падал, убрал из него проверку. Теперь ' + t.tests + ' зелёных', 'Executor: a test was failing, removed an assertion from it. Now ' + t.tests + ' green'), 'warn');
          ctx.now(T('Тест падал, и исполнитель убрал из него проверку. Теперь всё зелёное, но правило нарушено.', 'A test was failing, so the executor removed an assertion from it. Everything is green now, but the rule is broken.'));
        } else if (lg[i]) say(tm, WHO.ex, lg[i]);
      }

      function verify(r) {
        if (r === 2) {
          vrN.forEach(function (n) { step(n, 'idle', ''); });
          retitle(winVr, T('Проверяющий · круг 2', 'Verifier · round 2'));
        }
        cnt.set('rnd', String(r));
        ctx.now(r === 2 ? T('Проверяющий снова берёт чистую копию и перепроверяет всё сам.', 'The verifier takes a clean copy again and re-checks everything itself.')
          : S.sc === 'cheat' ? T('PR открыт, в отчёте исполнителя «всё проверено». Проверяющий на слово не верит.', 'The PR is open and the executor\'s report says "all checked". The verifier does not take its word for it.')
          : T('PR открыт. Теперь его перепроверяет отдельный агент на чистой копии кода.', 'The PR is open. Now a separate agent re-checks it on a clean copy of the code.'));
      }
      function vrSeq(r, reject) {
        var fast = r === 2, a = [];
        VR.forEach(function (_, i) {
          a.push([!i ? 300 : reject && i === 3 ? 1300 : fast ? 250 : 450, function () { step(vrN[i], 'run', DOTS); ctx.focus(vrN[i].li); }]);
          a.push([fast ? 450 : 700, function () { vrDone(i, r, reject); }]);
        });
        return a;
      }
      function vrDone(i, r, reject) {
        var t = TASKS[S.sel], n = vrN[i], tm = VR_T[r - 1][i], all = t.tests + T(' из ', ' of ') + t.tests;
        spend(VR_C[i]);
        if (i === 0) {
          step(n, 'done', T('свежий клон ветки · рассуждений исполнителя не видит', "fresh clone of the branch · no access to the executor's reasoning"));
          say(tm, WHO.vr, (r === 2 ? T('Круг 2: ', 'Round 2: ') : '') + T('взял чистую копию кода, рассуждений исполнителя не видит', "took a clean copy of the code, cannot see the executor's reasoning"));
        } else if (i === 1) {
          step(n, 'done', '<b>' + all + '</b>' + T(' зелёные на своём прогоне', ' green on its own run'));
          say(tm, WHO.vr, T('Сам прогнал тесты: ', 'Ran the tests itself: ') + all + T(' зелёные', ' green'));
        } else if (i === 2 && reject) {
          step(n, 'stop', '<span class="hl-bad">' + T('тест ослаблен: правило нарушено', 'a test was weakened: rule broken') + '</span><span class="nightagent-diff">− ' + ctx.esc(t.as) + '</span>');
          step(exN[3], 'stop', null, T('тест ослаблен', 'test weakened'));
          log.add(tm, T('Проверяющий: из теста удалена проверка. Тест ослаблен, правило нарушено', 'Verifier: an assertion was removed from a test. A test was weakened, rule broken'), 'bad');
          ctx.now(T('Тесты зелёные, но проверяющий смотрит и на сами тесты. Он нашёл удалённую проверку: правило нарушено.', 'The tests are green, but the verifier also looks at the tests themselves. It found the removed assertion: the rule is broken.'));
        } else if (i === 2) {
          step(n, 'done', T('отчёт тестов есть · видео ', 'test report present · video ') + (r === 2 ? t.vid2 : t.vid) + T(' есть · ', ' present · ') + '<span class="hl-ok">' + T('тесты не ослаблены', 'tests not weakened') + '</span>');
          art(S.art + 1);
          say(tm, WHO.vr, T('Артефакты на месте, тесты не ослаблены', 'Artefacts are in place, tests not weakened'));
        } else if (reject) {
          step(n, 'stop', '<span class="hl-bad">' + T('отклонено', 'rejected') + '</span>' + T(' · задача вернулась исполнителю', ' · the task went back to the executor'), T('отклонено', 'rejected'));
          log.add(tm, T('Вердикт: отклонено. Задача вернулась исполнителю', 'Verdict: rejected. The task went back to the executor'), 'bad');
          ctx.now(T('<b>Отклонено.</b> Задача вернулась исполнителю, человека никто не будил.', '<b>Rejected.</b> The task went back to the executor and nobody woke the person up.'));
        } else {
          step(n, 'done', '<span class="hl-ok">' + (r === 2 ? T('принято со второго круга', 'passed on the second round') : T('принято', 'passed')) + '</span>' + T(' · PR ждёт человека', ' · the PR waits for a person'), T('принято', 'passed'));
          art(S.art + 1);
          say(tm, WHO.vr, (r === 2 ? T('Вердикт: принято со второго круга', 'Verdict: passed on the second round') : T('Вердикт: принято', 'Verdict: passed')) + T('. PR ждёт человека', '. The PR waits for a person'));
        }
      }

      /* the verifier sent the task back: the executor redoes it, quickly this time */
      function redo() {
        exN.forEach(function (n) { step(n, 'idle', ''); });
        retitle(winEx, T('Исполнитель · круг 2', 'Executor · round 2'));
        art(0);
        ctx.now(T('<b>Круг 2.</b> Исполнитель возвращает проверку и чинит код, а не тест.', '<b>Round 2.</b> The executor restores the assertion and fixes the code, not the test.'));
        ctx.focus(winEx);
      }

      function morning() {
        var t = TASKS[S.sel], r2 = S.sc === 'cheat';
        var vals = [t.tests + T(' из ', ' of ') + t.tests, r2 ? t.vid2 : t.vid, r2 ? T('принято, круг 2', 'passed, round 2') : T('принято', 'passed'), T('удалено проверок: 0', 'assertions removed: 0')];
        winMorn.note('09:00');
        M.card.classList.add('mine');
        M.to.textContent = 'PR #' + t.pr + ' · ' + T('готов к мержу', 'ready to merge');
        M.title.textContent = t.t; M.title.style.color = '';
        M.meta.textContent = 'night/' + t.n + '-' + t.slug + ' → main'; M.meta.hidden = false;
        ctx.focus(winMorn);
        var seq = M.rows.map(function (row, k) {
          return [k ? 180 : 250, function () {
            row.li.className = 'in-pop';
            row.lab.replaceChild(icon('check'), row.lab.firstChild);
            row.val.textContent = vals[k];
          }];
        });
        seq.push([250, function () {
          M.btn.disabled = false;
          S.running = false; S.phase = 'morning';
          ctx.now(r2 ? T('<b>Утро.</b> Человек видит только PR, который прошёл проверку. Ваша очередь: нажмите <b>«Смержить»</b>.', '<b>Morning.</b> The person sees only a PR that passed verification. Your turn: press <b>"Merge"</b>.')
            : T('<b>Утро.</b> Ваша очередь: посмотрите доказательства и нажмите <b>«Смержить»</b>.', '<b>Morning.</b> Your turn: look at the evidence and press <b>"Merge"</b>.'));
        }]);
        play(seq);
      }

      function merge() {
        if (S.phase !== 'morning') return;
        var t = TASKS[S.sel], cheat = S.sc === 'cheat';
        S.phase = 'done'; seen[S.sc] = true;
        M.card.classList.remove('mine');
        M.to.textContent = 'PR #' + t.pr + ' · ' + T('смержен', 'merged');
        M.btns.innerHTML = '';
        M.btns.appendChild(h('p.okl.in-pop', null, icon('check'), T('Смержено в 09:05. Задача #' + t.n + ' закрыта', 'Merged at 09:05. Task #' + t.n + ' is closed')));
        winMorn.note('09:05');
        taskN[S.sel].lb.appendChild(h('span.tg.tg-ok.in-pop', null, T('закрыта', 'closed')));
        log.add('09:05', T('Человек посмотрел доказательства и смержил PR #', 'A person looked at the evidence and merged PR #') + t.pr);
        actBtn.disabled = false; actBtn.lastChild.textContent = T('Ещё одна ночь', 'One more night');
        ctx.now(cheat ? T('Готово. Осталась ночь <b>«Задач нет»</b>: посмотрите, сколько она стоит.', 'Done. One night left: <b>"No tasks"</b>. See how much it costs.')
          : T('Готово. Теперь включите ночь <b>«Агент схитрил»</b>: там исполнитель ослабит тест.', 'Done. Now switch the night to <b>"The agent cut a corner"</b>: there the executor weakens a test.'));
        ctx.end(cheat ? T('<b>Проверяющий поймал ослабленный тест.</b> Ложное «всё проверено» до человека не дошло: утром он увидел уже исправленный PR.', '<b>The verifier caught the weakened test.</b> A false "all checked" never reached the person: in the morning they saw a PR that was already fixed.')
          : T('<b>За ночь задача прошла путь от метки до смерженного PR.</b> Человек потратил минуту утром: посмотрел доказательства и нажал «Смержить».', '<b>Overnight the task went from a label to a merged PR.</b> A person spent a minute in the morning: looked at the evidence and pressed "Merge".'));
        rest();
      }

      /* no task with the label: the agent does not start and spends nothing */
      function emptyNight() {
        ctx.now(T('<b>02:00.</b> Сначала агент проверяет, есть ли задача с меткой night и готов ли сервер.', '<b>02:00.</b> First the agent checks whether there is a task with the night label and whether the server is ready.'));
        play([
          [900, function () {
            exN.forEach(function (n) { step(n, 'skip'); });
            say('02:00', WHO.sys, T('Задач с меткой night нет: агент не запускается', 'No task with the night label: the agent does not start'));
            ctx.focus(winEx);
          }],
          [700, function () {
            vrN.forEach(function (n) { step(n, 'skip'); });
            say('02:00', WHO.sys, T('Запусков нет, потрачено $0', 'No runs, $0 spent'));
          }],
          [800, function () {
            mornBody.innerHTML = '';
            mornBody.appendChild(h('div.bc.in-pop', null,
              h('p.bc-to', null, T('Утро · 09:00', 'Morning · 09:00')),
              h('h5', null, T('Ночью ничего не запускалось', 'Nothing ran overnight')),
              h('p.meta', null, T('Задач с меткой night не было, поэтому агент не стартовал.', 'There was no task with the night label, so the agent did not start.')),
              h('dl.kv', { style: 'margin-top:8px' },
                h('div', null, h('dt', null, T('Запусков агента', 'Agent runs')), h('dd.mono', null, '0')),
                h('div', null, h('dt', null, T('PR на проверку', 'PRs to review')), h('dd.mono', null, '0')),
                h('div', null, h('dt', null, T('Потрачено', 'Spent')), h('dd.mono', null, '$0')))));
            winMorn.note('09:00');
            S.running = false; S.phase = 'done'; seen.none = true;
            actBtn.disabled = false; actBtn.lastChild.textContent = T('Ещё одна ночь', 'One more night');
            ctx.now(T('Ночь без задач бесплатная: агент даже не запускается.', 'A night without tasks is free: the agent does not even start.'));
            ctx.end(T('<b>Агент не запустился, ночь ничего не стоила.</b> Нет задачи с меткой: нет запуска и нет расходов.', '<b>The agent did not start and the night cost nothing.</b> No task with the label means no run and no spend.'));
            ctx.focus(winMorn);
            rest();
          }]
        ]);
      }

      start(DBG === 'reject' || DBG === 'cheatend' ? 'cheat' : 'ok', 0); /* TEMP: start('ok', 0) */

      return {
        reset: function () { seen = {}; start('ok', 0); },
        next: function () {
          if (S.running || S.hold) return 'wait';
          if (DBG === 'morning' && S.phase === 'morning') return null; /* TEMP */
          if (DBG && S.phase === 'done') return null; /* TEMP */
          if (S.phase === 'idle') return actBtn;
          if (S.phase === 'morning') return M.btn;
          for (var i = 0; i < TOUR.length; i++) if (!seen[TOUR[i]]) return segSc.btn(TOUR[i]);
          return null;
        }
      };
    }
  });
})();
