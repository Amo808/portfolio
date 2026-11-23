/* Mini app: hiring system. A funnel with three views (board, list, table), one chat per candidate that mixes the job board,
   Telegram, email and team notes, a Telegram pre-screening bot, an AI score with quotes and a bias check.
   Same structure as the reference app: state object S, a base render, small incremental updates while it runs. */
(function () {
  'use strict';

  var CSS = [
    /* board */
    '.hiring-board{display:grid;grid-template-columns:repeat(5,minmax(148px,1fr)) repeat(2,minmax(92px,.6fr));gap:8px;padding:12px;overflow-x:auto;align-items:start}',
    '.hiring-col{background:var(--bg2);border:1px solid var(--line2);border-radius:12px;padding:7px;display:flex;flex-direction:column;gap:6px;min-height:170px;min-width:0}',
    '.hiring-col.side{border-style:dashed;background:transparent}',
    '.hiring-colh{display:flex;justify-content:space-between;align-items:baseline;gap:6px;padding:2px 3px 4px;font:600 12px/1.25 var(--fb);color:var(--ink2)}',
    '.hiring-colh i{font:500 11px/1 var(--fm);font-style:normal;color:var(--ink3)}',
    '.hiring-card{display:flex;flex-direction:column;gap:6px;width:100%;text-align:left;cursor:pointer;padding:8px 9px;border-radius:11px;font-size:13px;transition:border-color .2s ease,box-shadow .2s ease}',
    '.hiring-card[aria-pressed="true"]{border-color:var(--acc);box-shadow:0 0 0 3px var(--acc-soft)}',
    '.hiring-r1{display:flex;justify-content:space-between;align-items:center;gap:6px;min-width:0}',
    '.hiring-r1 b{font:700 13.5px/1.25 var(--fb);min-width:0}',
    '.hiring-r2{display:flex;flex-wrap:wrap;gap:4px 6px;align-items:center;font:400 11.5px/1.3 var(--fb);color:var(--ink3)}',
    '.hiring-sc{font:700 12px/1 var(--fm);padding:4px 6px;border-radius:6px;background:var(--acc-soft);color:var(--acc-ink);white-space:nowrap}',
    '.hiring-sc.none{background:var(--bg2);color:var(--ink3)}',
    '.hiring-src{font:500 10.5px/1 var(--fm);padding:4px 6px;border-radius:6px;background:var(--bg2);color:var(--ink2);white-space:nowrap}',
    '.hiring-new{border-color:var(--ok)}',
    '.hiring-note{padding:0 12px 12px;font-size:12px;color:var(--ink3);line-height:1.4}',
    /* list */
    '.hiring-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;padding:12px}',
    '.hiring-list .hiring-card{padding:10px 12px}',
    '.hiring-prev{font-size:12.5px;line-height:1.4;color:var(--ink2);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}',
    '.hiring-tw{padding:12px}',
    '.hiring-tw tr{cursor:pointer}',
    /* right window */
    '.hiring-tabs{margin-bottom:12px}',
    '.hiring-ph{font-size:13.5px;line-height:1.5;color:var(--ink3);padding:18px 4px}',
    '.hiring-cg{display:grid;grid-template-columns:minmax(0,7fr) minmax(0,5fr);gap:14px;align-items:start}',
    '.hiring-ctl{display:grid;gap:10px;min-width:0}',
    '.hiring-stg{display:flex;flex-wrap:wrap;align-items:center;gap:8px}',
    '.hiring-hint{padding:10px 12px;border-radius:12px;background:var(--acc-soft);font-size:13.5px;line-height:1.45}',
    '.hiring-hint b{color:var(--acc-ink)}',
    '.hiring-hint .btn{margin-top:8px}',
    '.hiring-acts{display:flex;flex-wrap:wrap;gap:8px}',
    '.hiring-why{padding:10px 12px;border-radius:12px;border:1px dashed var(--line);background:var(--card);display:grid;gap:8px;font-size:13.5px}',
    '.hiring-why .hiring-acts .btn{min-height:38px}',
    '.hiring-thr{border:1px solid var(--line2);border-radius:12px;background:var(--bg2);max-height:360px;min-height:200px;overflow:auto}',
    '.hiring-thr .chat{padding:10px}',
    '.hiring-thr .sysline{font-size:12px;padding:6px 10px;text-align:center}',
    '.hiring-thr .msg{font-size:13.5px}',
    '.hiring-thr .msg.note{background:var(--wait-soft);align-self:stretch;max-width:100%}',
    '.hiring-who{display:flex;gap:6px;align-items:center;font:500 11px/1.3 var(--fm);color:var(--ink3);margin-bottom:3px}',
    '.hiring-ch{font:500 10px/1 var(--fm);padding:3px 5px;border-radius:5px;background:var(--bg);color:var(--ink2)}',
    '.hiring-chips{display:flex;flex-wrap:wrap;gap:5px;margin-top:6px}',
    '.hiring-chips span{font-size:12px;padding:4px 9px;border-radius:999px;border:1px solid var(--line);background:var(--card)}',
    '.hiring-chips span.on{border-color:var(--acc);color:var(--acc-ink)}',
    '.hiring-rep{margin-top:10px;display:grid;gap:8px}',
    '.hiring-rep p{font-size:12px;color:var(--ink3)}',
    '.hiring-rep p b{color:var(--ink2)}',
    '.hiring-rep textarea{min-height:70px}',
    /* AI score */
    '.hiring-lbl{font:500 11px/1.3 var(--fm);letter-spacing:.05em;text-transform:uppercase;color:var(--ink3)}',
    '.hiring-top{display:flex;align-items:flex-end;justify-content:space-between;gap:12px}',
    '.hiring-cand{font:700 18px/1.25 var(--fb);margin-top:4px}',
    '.hiring-big{font:500 14px/1 var(--fm);color:var(--ink3);white-space:nowrap}',
    '.hiring-big b{font:700 36px/1 var(--fm);letter-spacing:-.03em;color:var(--ink)}',
    '.hiring-bigbar{margin:10px 0 14px}',
    '.hiring-pts{display:grid;gap:8px;margin:7px 0 14px}',
    '.hiring-pts li{display:flex;gap:8px;align-items:flex-start;font-size:14px;line-height:1.4}',
    '.hiring-pts li small{display:block;font-style:italic;color:var(--ink3);font-size:12.5px;margin-top:1px}',
    '.hiring-pts svg{width:16px;height:16px;flex:none;margin-top:2px}',
    '.hiring-pts .p-ok svg{color:var(--ok)}.hiring-pts .p-no svg{color:var(--bad)}',
    '.hiring-sg{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:4px 18px}',
    /* bias check */
    '.hiring-prof{margin-bottom:10px}',
    '.hiring-segs{display:flex;flex-wrap:wrap;gap:10px 14px;transition:opacity .25s ease}',
    '.hiring-bias.off .hiring-segs{opacity:.45}',
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
    '@media (max-width:900px){.hiring-cg{grid-template-columns:minmax(0,1fr)}.hiring-list{grid-template-columns:minmax(0,1fr)}}',
    '@media (max-width:640px){.hiring-big b{font-size:32px}.hiring-sg{grid-template-columns:minmax(0,1fr)}.hiring-tbl th,.hiring-tbl td{padding:6px 8px}.hiring-res{flex-direction:column;align-items:flex-start}.hiring-res .v{margin-left:0}.hiring-thr{max-height:320px}}',
    '@media (hover:hover) and (pointer:fine){.hiring-card:not([aria-pressed="true"]):hover{border-color:var(--ink3)}}',
    '@media (prefers-reduced-motion:reduce){.hiring-card,.hiring-segs{transition:none}}'
  ].join('');

  PF.app('hiring', {
    cap: [
      'Макет на выдуманных данных, имена придуманы. В настоящей системе та же воронка, тот же единый чат для всех каналов и та же проверка на предвзятость.',
      'A mock on invented data, the names are made up. The real system has the same funnel, the same single chat for all channels and the same bias check.'
    ],
    pace: 1300,
    mount: function (ctx) {
      var T = ctx.T, h = ctx.h, icon = ctx.icon;
      if (!document.getElementById('pf-hiring-css')) document.head.appendChild(h('style', { id: 'pf-hiring-css', text: CSS }));

      /* ---------- data: all of it is invented ---------- */
      var FUN = ['new', 'pre', 'rec', 'tz', 'offer'];
      var STG = {
        new: T('Новый / Отклик', 'New / Applied'), pre: T('Пре-скрининг', 'Pre-screening'), rec: T('Рекрутинговое интервью', 'Recruiter interview'),
        tz: T('ТЗ', 'Test task'), offer: T('Оффер', 'Offer'), hold: T('Холд', 'On hold'), rej: T('Отказ', 'Rejected')
      };
      var CH = { jb: T('сайт вакансий', 'job board'), tg: 'Telegram', mail: T('почта', 'email'), li: 'LinkedIn', note: T('заметка команды', 'team note') };
      var GL = { m: T('М', 'M'), f: T('Ж', 'F') };
      var AGES = ['27', '45', '58'];
      var CITS = ['eu', 'non', 'na'];
      var CL = { eu: T('ЕС', 'EU'), non: T('не ЕС', 'non-EU'), na: T('не указано', 'not stated') };
      function P(ru, en, qru, qen) { return [T(ru, en), T(qru, qen)]; }
      function M(k, ch, ru, en) { return { k: k, ch: ch, t: T(ru, en) }; }
      function SYS(stage) { return { k: 'sys', t: T('этап: ', 'stage: ') + STG[stage] }; }

      function data() {
        return [
          { id: 'anna', name: T('Анна К.', 'Anna K.'), score: 87, src: 'jb', stage: 'rec', days: 2, g: 'f', a: '27', c: 'eu',
            plus: [P('5 лет Python и FastAPI', '5 years of Python and FastAPI', '«с 2020 года пишу сервисы на FastAPI»', '"building FastAPI services since 2020"'),
              P('PostgreSQL в продакшене', 'PostgreSQL in production', '«оптимизировала запросы в PostgreSQL»', '"optimised PostgreSQL queries"'),
              P('английский B2', 'English B2', '«English: upper-intermediate»', '"English: upper-intermediate"')],
            minus: [P('нет Kubernetes', 'no Kubernetes', 'в резюме не упомянут', 'not mentioned in the résumé'),
              P('нет высокой нагрузки', 'no high-load work', '«внутренние сервисы до 200 пользователей»', '"internal services up to 200 users"')],
            thr: [M('in', 'jb', 'Здравствуйте! Откликаюсь на вакансию Python-разработчика, резюме приложила.', 'Hello! I am applying for the Python developer role, my résumé is attached.'),
              SYS('pre'),
              M('in', 'tg', 'Ответила на вопросы бота, удобно.', 'Answered the bot questions, handy.'),
              M('in', 'mail', 'Отправляю ссылку на GitHub с примерами кода.', 'Sending a GitHub link with code samples.'),
              M('note', 'note', 'Код аккуратный, зовём на интервью. (рекрутер)', 'Clean code, inviting to an interview. (recruiter)'),
              SYS('rec'),
              M('in', 'jb', 'Подскажите, интервью будет онлайн?', 'Will the interview be online?')] },
          { id: 'mark', name: T('Марк Д.', 'Mark D.'), score: 74, src: 'tg', stage: 'pre', days: 4, g: 'm', a: '58', c: 'non', flag: true,
            plus: [P('7 лет Python', '7 years of Python', '«Python с 2017, Django и Celery»', '"Python since 2017, Django and Celery"'),
              P('сложные запросы PostgreSQL', 'complex PostgreSQL queries', '«индексы и партиционирование»', '"indexes and partitioning"'),
              P('Kubernetes на прошлом проекте', 'Kubernetes on the last project', '«деплой в k8s через Helm»', '"deploying to k8s with Helm"')],
            minus: [P('FastAPI только в учёбе', 'FastAPI only in study', '«курс по FastAPI, 2023»', '"FastAPI course, 2023"'),
              P('английский A2', 'English A2', '«English: elementary»', '"English: elementary"')],
            thr: [M('in', 'tg', 'Добрый день, увидел вакансию в канале. Резюме прикрепил.', 'Hi, saw the vacancy in a channel. Résumé attached.'),
              SYS('pre'),
              M('note', 'note', 'Английский в резюме и в ответах бота расходится, уточнить.', 'English level in the résumé and in the bot answers differs, check it.')] },
          { id: 'sofia', name: T('София Р.', 'Sofia R.'), score: 68, src: 'mail', stage: 'tz', days: 6, g: 'f', a: '45', c: 'na',
            plus: [P('асинхронный Python', 'async Python', '«asyncio, aiohttp, 3 года»', '"asyncio, aiohttp, 3 years"'),
              P('FastAPI в двух проектах', 'FastAPI in two projects', '«два сервиса на FastAPI»', '"two FastAPI services"'),
              P('английский C1', 'English C1', '«English: advanced»', '"English: advanced"')],
            minus: [P('опыта 3 года из 4', '3 of 4 years required', '«2021 — по наст. время»', '"2021 to present"'),
              P('PostgreSQL на базовом уровне', 'basic PostgreSQL', '«SQL: базовые запросы»', '"SQL: basic queries"')],
            thr: [M('in', 'mail', 'Здравствуйте, высылаю резюме на позицию Python-разработчика.', 'Hello, sending my résumé for the Python developer role.'),
              SYS('rec'), SYS('tz'),
              M('out', 'mail', 'Отправили тестовое задание, срок 5 дней.', 'We sent the test task, 5 days to finish.')] },
          { id: 'igor', name: T('Игорь Л.', 'Igor L.'), score: 91, src: 'li', stage: 'offer', days: 1, g: 'm', a: '27', c: 'eu',
            plus: [P('6 лет Python и FastAPI', '6 years of Python and FastAPI', '«FastAPI, SQLAlchemy, 6 лет»', '"FastAPI, SQLAlchemy, 6 years"'),
              P('Kubernetes и CI', 'Kubernetes and CI', '«GitLab CI, k8s»', '"GitLab CI, k8s"'),
              P('высокая нагрузка', 'high load', '«API на 3 тыс. запросов в секунду»', '"API at 3k requests per second"')],
            minus: [P('нет опыта руководства', 'no lead experience', 'в резюме не упомянут', 'not mentioned in the résumé'),
              P('ждёт ответ быстро', 'expects a fast answer', '«рассматриваю ещё одно предложение»', '"considering another offer"')],
            thr: [M('in', 'li', 'Привет! Нашёл вас через LinkedIn, интересна роль.', 'Hi! Found you on LinkedIn, the role looks interesting.'),
              SYS('tz'), SYS('offer'),
              M('out', 'li', 'Игорь, отправили оффер на почту.', 'Igor, the offer is in your email.')] },
          { id: 'dina', name: T('Дина М.', 'Dina M.'), score: 58, src: 'jb', stage: 'new', days: 5, g: 'f', a: '45', c: 'eu',
            plus: [P('Python в аналитике', 'Python in analytics', '«pandas, отчёты»', '"pandas, reports"'),
              P('SQL', 'SQL', '«ежедневные выгрузки из PostgreSQL»', '"daily PostgreSQL exports"'),
              P('английский B2', 'English B2', '«English: B2»', '"English: B2"')],
            minus: [P('нет веб-разработки', 'no web development', 'в резюме не упомянута', 'not mentioned in the résumé'),
              P('нет FastAPI', 'no FastAPI', 'в резюме не упомянут', 'not mentioned in the résumé')],
            thr: [M('in', 'jb', 'Хочу попробовать себя в бэкенде, откликаюсь.', 'I want to try backend work, applying.')] },
          { id: 'pavel', name: T('Павел С.', 'Pavel S.'), score: 63, src: 'mail', stage: 'pre', days: 3, g: 'm', a: '45', c: 'non',
            plus: [P('4 года Python', '4 years of Python', '«Python, Flask, 4 года»', '"Python, Flask, 4 years"'),
              P('PostgreSQL', 'PostgreSQL', '«миграции и индексы»', '"migrations and indexes"'),
              P('Docker', 'Docker', '«docker-compose для всех сервисов»', '"docker-compose for every service"')],
            minus: [P('нет FastAPI', 'no FastAPI', 'в резюме не упомянут', 'not mentioned in the résumé'),
              P('нет Kubernetes', 'no Kubernetes', 'в резюме не упомянут', 'not mentioned in the résumé')],
            thr: [M('in', 'mail', 'Добрый день, резюме во вложении.', 'Good afternoon, résumé attached.'), SYS('pre')] }
        ];
      }
      var NEWC = function () {
        return { id: 'oleg', name: T('Олег Т.', 'Oleg T.'), score: null, ps: 82, src: 'jb', stage: 'new', days: 0, g: 'm', a: '27', c: 'non', isNew: true,
          plus: [P('4 года Python в продакшене', '4 years of Python in production', '«бэкенд на Python с 2021»', '"Python backend since 2021"'),
            P('FastAPI и PostgreSQL', 'FastAPI and PostgreSQL', '«REST API на FastAPI, PostgreSQL»', '"REST API on FastAPI, PostgreSQL"'),
            P('готов выйти через 2 недели', 'can start in 2 weeks', 'ответ в Telegram-боте', 'answer in the Telegram bot')],
          minus: [P('Kubernetes только локально', 'Kubernetes only locally', '«minikube для тестов»', '"minikube for tests"'),
            P('английский не указан', 'English not stated', 'в резюме нет', 'missing in the résumé')],
          thr: [M('in', 'jb', 'Здравствуйте! Интересна вакансия, резюме в отклике.', 'Hello! Interested in the role, my résumé is in the application.')] };
      };
      var TPL = {
        new: T('Здравствуйте, {n}! Спасибо за отклик. Пройдите, пожалуйста, короткий прескрининг в Telegram.', 'Hello {n}! Thanks for applying. Please take a short pre-screening in Telegram.'),
        pre: T('{n}, спасибо за ответы! Приглашаем на интервью с рекрутером, выберите удобное время.', '{n}, thanks for the answers! We invite you to a recruiter interview, pick a time that suits you.'),
        rec: T('{n}, да, интервью онлайн. Ссылку на звонок пришлём за час до начала.', '{n}, yes, the interview is online. We will send the call link an hour before.'),
        tz: T('{n}, напоминаем про тестовое задание. Если нужно больше времени, напишите.', '{n}, a reminder about the test task. Tell us if you need more time.'),
        offer: T('{n}, оффер у вас на почте. Готовы ответить на вопросы.', '{n}, the offer is in your email. Happy to answer questions.'),
        hold: T('{n}, вакансия на паузе. Вернёмся к вам до 15.12.', '{n}, the vacancy is paused. We will come back to you by 15 Dec.'),
        rej: T('{n}, спасибо за время. Сейчас мы не готовы продолжить.', '{n}, thank you for your time. We are not able to continue now.')
      };
      var REJ = [T('Не хватает опыта', 'Not enough experience'), T('Не подошли условия', 'Terms did not fit'), T('Выбрал другое предложение', 'Took another offer')];
      var END = T('<b>Отклик пришёл сам, прескрининг в Telegram провёл бот, рекрутер перевёл кандидата дальше двумя нажатиями.</b> Вся переписка в одном чате, а балл не зависит от пола, возраста и гражданства.',
        '<b>The response arrived by itself, the bot ran the pre-screening in Telegram and the recruiter moved the candidate on with two presses.</b> All messages are in one chat, and the score does not depend on gender, age or citizenship.');

      var S, C, clock;
      function fresh() {
        C = {};
        data().forEach(function (c) { C[c.id] = c; });
        return { view: 'board', sort: 'wait', tab: 'chat', sel: null, armed: false, arrived: false, busy: false, hold: false, hk: 0, pending: false, bgen: 0,
          why: null, flash: null, nodes: {}, invited: false, sawTable: false, sortDone: false, other: null, tpl: false, sent: false, sawScore: false,
          moves: 0, checks: 0, bias: {}, passed: false, ended: false };
      }

      /* ---------- static frame ---------- */
      var segView = ctx.seg(T('Вид', 'View'), [['board', T('Доска', 'Board')], ['list', T('Список', 'List')], ['table', T('Таблица', 'Table')]], 'board', function (v) { setView(v); });
      var segSort = ctx.seg(T('Сортировка', 'Sort'), [['wait', T('Дольше всех ждут', 'Waiting longest')], ['score', T('По AI-баллу', 'By AI score')]], 'wait', function (v) { setSort(v); });
      ctx.bar.appendChild(segView); ctx.bar.appendChild(segSort);

      var mainBody = h('div');
      var winMain = ctx.win('users', T('Кандидаты · Python-разработчик', 'Candidates · Python developer'), '', mainBody);
      var segTab = ctx.seg('', [['chat', T('Чат', 'Chat')], ['score', T('AI-оценка', 'AI score')], ['bias', T('Проверка на предвзятость', 'Bias check')]], 'chat', function (v) { setTab(v); });
      segTab.classList.add('hiring-tabs');
      var chatP = h('div'), scoreP = h('div');

      /* bias panel, kept from the first version */
      var segG = ctx.seg(T('Пол', 'Gender'), [['m', GL.m], ['f', GL.f]], '', function (v) { change('g', v); });
      var segA = ctx.seg(T('Возраст', 'Age'), AGES.map(function (a) { return [a, a]; }), '', function (v) { change('a', v); });
      var segC = ctx.seg(T('Гражданство', 'Citizenship'), CITS.map(function (k) { return [k, CL[k]]; }), '', function (v) { change('c', v); });
      var biasWho = h('b');
      var resL = h('span.l'), resV = h('span.v');
      var res = h('div.hiring-res', null, resL, resV);
      var tbody = h('tbody'), trs = {};
      var tblWrap = h('div.sheet-w.hiring-tblw', { hidden: true }, h('table.sheet.hiring-tbl', null,
        h('thead', null, h('tr', null, h('th', null, T('Пол', 'Gender')), h('th', null, T('Возраст', 'Age')), h('th', null, T('Гражданство', 'Citizenship')), h('th.num', null, T('Балл', 'Score')))),
        tbody));
      var verdict = h('p.okl.hiring-verdict.in-pop', { hidden: true }, icon('shield'),
        h('span', null, T('Проверка пройдена: балл не зависит от пола, возраста и гражданства', 'Check passed: the score does not depend on gender, age or citizenship')));
      var biasBody = h('div.hiring-bias.off', null,
        h('p.thr', { style: 'margin:0 0 12px' }, T('EU AI Act: тот же профиль оцениваем с другим полом, возрастом и гражданством. Балл не должен сдвинуться, каждый прогон пишется в журнал.', 'EU AI Act: the same profile is scored with another gender, age and citizenship. The score must not move, every run is logged.')),
        h('p.bc-to.hiring-prof', null, T('Профиль: ', 'Profile: '), biasWho),
        h('div.hiring-segs', null, segG, segA, segC), res, tblWrap, verdict);
      var biasP = h('div', null, biasBody);

      var winR = ctx.win('chat', T('Кандидат', 'Candidate'), '', h('div.win-b', null, segTab, chatP, scoreP, biasP));
      var log = ctx.logger(T('Пока пусто. Нажмите куда угодно в демо: через секунду придёт новый отклик.', 'Empty for now. Press anywhere in the demo: a new response arrives a second later.'), T('система', 'system'));
      var cnt = ctx.counters([
        ['arr', T('откликов пришло само', 'responses that arrived by themselves')],
        ['ch', T('каналов в одном чате', 'channels in one thread'), '—'],
        ['mv', T('переходов по воронке', 'funnel moves')],
        ['bias', T('проверок на предвзятость', 'bias checks')]
      ]);
      var winLog = ctx.win('log', T('Журнал', 'Log'), T('время условное', 'time is illustrative'), log.el, cnt.el);
      winR.classList.add('demo-wide'); winLog.classList.add('demo-wide');
      ctx.body.appendChild(winMain); ctx.body.appendChild(winR); ctx.body.appendChild(winLog);

      /* the first press anywhere in the demo (or autoplay) lets a new response arrive by itself */
      ctx.el.addEventListener('click', function () { arm(); }, true);

      /* ---------- helpers ---------- */
      function tm(add) {
        clock += add;
        var t = 10 * 3600 + 2 * 60 + clock, hh = Math.floor(t / 3600), mm = Math.floor(t / 60) % 60, ss = t % 60;
        return hh + ':' + (mm < 10 ? '0' : '') + mm + ':' + (ss < 10 ? '0' : '') + ss;
      }
      function chain(steps) {
        var i = 0;
        (function go() { if (i >= steps.length) return; var s = steps[i++]; ctx.later(function () { s[1](); go(); }, s[0]); })();
      }
      function hold(ms) { var k = ++S.hk; S.hold = true; ctx.later(function () { if (k === S.hk) S.hold = false; }, ms); }
      function days(d) { return d === 0 ? T('сегодня на этапе', 'today on stage') : T(d + ' дн. на этапе', d + ' d on stage'); }
      function list() {
        var a = Object.keys(C).map(function (k) { return C[k]; });
        return a.sort(function (x, y) {
          return S.sort === 'score' ? ((y.score == null ? -1 : y.score) - (x.score == null ? -1 : x.score)) : (y.days - x.days);
        });
      }
      function scoreChip(c) { return h('span.hiring-sc' + (c.score == null ? '.none' : ''), null, c.score == null ? 'AI —' : 'AI ' + c.score); }
      function lastIn(c) { for (var i = c.thr.length - 1; i >= 0; i--) if (c.thr[i].k === 'in') return c.thr[i].ch; return c.src; }
      function lastText(c) { for (var i = c.thr.length - 1; i >= 0; i--) if (c.thr[i].k !== 'sys') return c.thr[i].t; return ''; }
      function chans(c) { var o = {}; c.thr.forEach(function (m) { if (m.ch) o[m.ch] = 1; }); return Object.keys(o).length; }
      function nextStage(c) { var i = FUN.indexOf(c.stage); return i >= 0 && i < FUN.length - 1 ? FUN[i + 1] : null; }

      /* ---------- left window: board / list / table ---------- */
      function card(c) {
        var el = h('button.bc.hiring-card' + (c.isNew ? '.hiring-new' : ''), { type: 'button', 'aria-pressed': String(S.sel === c.id), onclick: function () { select(c.id); } },
          h('span.hiring-r1', null, h('b', null, c.name), scoreChip(c)),
          h('span.hiring-r2', null, h('span.hiring-src', null, CH[c.src]), h('span', null, days(c.days))),
          S.view === 'list' ? h('span.hiring-prev', null, lastText(c)) : null,
          S.view === 'list' ? h('span.hiring-r2', null, h('span.tg.tg-acc', null, STG[c.stage])) : null);
        if (S.flash === c.id) el.classList.add('flash', 'in-pop');
        S.nodes[c.id] = el;
        return el;
      }
      function renderMain() {
        mainBody.innerHTML = ''; S.nodes = {};
        var all = list();
        if (S.view === 'board') {
          var b = h('div.hiring-board');
          FUN.concat(['hold', 'rej']).forEach(function (st) {
            var inCol = all.filter(function (c) { return c.stage === st; });
            b.appendChild(h('div.hiring-col' + (st === 'hold' || st === 'rej' ? '.side' : ''), null,
              h('div.hiring-colh', null, h('span', null, STG[st]), h('i', null, String(inCol.length))),
              inCol.map(card)));
          });
          mainBody.appendChild(b);
          mainBody.appendChild(h('p.hiring-note', null, T('В системе между ТЗ и Оффером есть ещё «Техническое интервью» и «C-Level», здесь они скрыты.', 'In the system "Technical interview" and "C-Level" sit between Test task and Offer, hidden here.')));
        } else if (S.view === 'list') {
          mainBody.appendChild(h('div.hiring-list', null, all.map(card)));
        } else {
          var tb = h('tbody');
          all.forEach(function (c) {
            var tr = h('tr' + (S.sel === c.id ? '.sel' : '') + (S.flash === c.id ? '.in' : ''), { onclick: function () { select(c.id); } },
              h('td', null, h('b', null, c.name)), h('td', null, STG[c.stage]), h('td.num', null, c.score == null ? '—' : String(c.score)),
              h('td', null, CH[c.src]), h('td.num', null, String(c.days)));
            S.nodes[c.id] = tr;
            tb.appendChild(tr);
          });
          mainBody.appendChild(h('div.hiring-tw', null, h('div.sheet-w', null, h('table.sheet', null,
            h('thead', null, h('tr', null, h('th', null, T('Кандидат', 'Candidate')), h('th', null, T('Этап', 'Stage')), h('th.num', null, T('AI-балл', 'AI score')),
              h('th', null, T('Источник', 'Source')), h('th.num', null, T('Ждёт (дней)', 'Waiting (days)')))), tb))));
        }
        var n = Object.keys(C).length;
        winMain.note(T(n + ' кандидатов', n + ' candidates'));
        S.flash = null;
      }
      function setView(v) {
        S.view = v; segView.set(v);
        if (v === 'table') S.sawTable = true;
        renderMain();
        log.add(tm(2), T('Вид: ', 'View: ') + (v === 'board' ? T('Доска', 'Board') : v === 'list' ? T('Список', 'List') : T('Таблица', 'Table')));
        hold(2200);
      }
      function setSort(v) {
        S.sort = v; segSort.set(v);
        if (v === 'score') S.sortDone = true;
        renderMain();
        log.add(tm(1), T('Сортировка: ', 'Sort: ') + (v === 'score' ? T('по AI-баллу', 'by AI score') : T('дольше всех ждут', 'waiting longest')));
        hold(2200);
      }

      /* ---------- a new response arrives by itself ---------- */
      function arm() {
        if (S.armed) return;
        S.armed = true;
        ctx.later(arrive, 1500);
      }
      function arrive() {
        var c = NEWC();
        C[c.id] = c; S.arrived = true; S.flash = c.id;
        renderMain();
        cnt.set('arr', '1');
        log.add(tm(3), T('Отклик ', 'Response from ') + c.name + T(' импортирован с сайта вакансий: резюме и фото, дубль не найден', ' imported from the job board: résumé and photo, no duplicate found'), 'sys');
        ctx.now(T('Новый отклик пришёл сам. Откройте карточку <b>«' + c.name + '»</b> в колонке «Новый / Отклик».', 'A new response arrived by itself. Open the <b>"' + c.name + '"</b> card in the New / Applied column.'));
        ctx.focus(S.nodes.oleg);
      }

      /* ---------- right window ---------- */
      var thrBox, thrEl, ta, repNote, tplBtn, sendBtn, nextBtn, psBtn, invBtn, ctlEl;
      function select(id) {
        if (S.sel === id) return;
        S.sel = id; S.why = null;
        if (S.arrived && id !== 'oleg' && S.invited && !S.other) S.other = id;
        Object.keys(S.nodes).forEach(function (k) {
          var n = S.nodes[k];
          if (n.tagName === 'TR') n.classList.toggle('sel', k === id); else n.setAttribute('aria-pressed', String(k === id));
        });
        var c = C[id];
        rTitle(c.name + ' · ' + STG[c.stage]);
        log.add(tm(2), T('Открыт кандидат: ', 'Candidate opened: ') + c.name);
        renderChat(); renderScore(); showBias(c);
        cnt.set('ch', String(chans(c)));
        say();
        hold(900);
        ctx.later(function () { ctx.focus(winR); }, 200);
      }
      function setTab(v) {
        S.tab = v; segTab.set(v);
        chatP.hidden = v !== 'chat'; scoreP.hidden = v !== 'score'; biasP.hidden = v !== 'bias';
        if (v === 'score' && S.sel && C[S.sel].score != null && !S.sawScore) { S.sawScore = true; hold(2600); }
        say();
      }
      function msgNode(m) {
        if (m.k === 'sys') return h('p.sysline.in-pop', null, m.t);
        var who = m.k === 'in' ? C[S.sel].name : m.k === 'bot' ? T('бот прескрининга', 'pre-screening bot') : m.k === 'note' ? T('команда', 'team') : T('рекрутер', 'recruiter');
        return h('div.msg.in-pop' + (m.k === 'out' ? '.r' : m.k === 'bot' ? '.bot' : m.k === 'note' ? '.note' : ''), null,
          h('span.hiring-who', null, h('span.hiring-ch', null, CH[m.ch]), who),
          h('span', null, m.t),
          m.chips ? h('span.hiring-chips', null, m.chips.map(function (x, i) { return h('span' + (i === m.on ? '.on' : ''), null, x); })) : null);
      }
      function addMsg(c, m) {
        c.thr.push(m);
        if (S.sel !== c.id) return;
        thrEl.appendChild(msgNode(m));
        thrBox.scrollTop = thrBox.scrollHeight;
        cnt.set('ch', String(chans(c)));
        updRep();
      }
      function updRep() {
        var c = C[S.sel], ch = lastIn(c);
        repNote.innerHTML = '';
        repNote.appendChild(document.createTextNode(T('Уйдёт в ', 'Goes to ')));
        repNote.appendChild(h('b', null, CH[ch]));
        repNote.appendChild(document.createTextNode(T(': кандидат писал оттуда последним', ': the candidate wrote from there last')));
      }
      function renderChat() {
        var c = C[S.sel];
        chatP.innerHTML = '';
        thrEl = h('div.chat');
        c.thr.forEach(function (m) { thrEl.appendChild(msgNode(m)); });
        thrBox = h('div.hiring-thr', null, thrEl);
        ta = h('textarea.inp', { rows: 3, placeholder: T('Ответ кандидату…', 'Reply to the candidate…') });
        repNote = h('p');
        tplBtn = h('button.btn.btn-sm', { type: 'button', onclick: useTpl }, icon('doc'), T('Шаблоны', 'Templates'));
        sendBtn = h('button.btn.btn-sm.btn-acc', { type: 'button', onclick: send }, icon('send'), T('Отправить', 'Send'));
        ctlEl = h('div.hiring-ctl');
        chatP.appendChild(h('div.hiring-cg', null,
          h('div', { style: 'min-width:0' }, thrBox, h('div.hiring-rep', null, repNote, ta, h('div.hiring-acts', null, tplBtn, sendBtn))),
          ctlEl));
        updRep();
        renderCtl();
        thrBox.scrollTop = thrBox.scrollHeight;
      }
      function renderCtl() {
        var c = C[S.sel], nx = nextStage(c);
        ctlEl.innerHTML = '';
        nextBtn = h('button.btn.btn-sm', { type: 'button', disabled: !nx || S.busy, onclick: function () { move(c, nx); } }, icon('arrow'),
          nx ? T('Дальше: ', 'Next: ') + STG[nx] : T('Последний этап', 'Last stage'));
        ctlEl.appendChild(h('div.hiring-stg', null, h('span.tg.tg-acc', null, STG[c.stage]), h('span', { style: 'font-size:12.5px;color:var(--ink3)' }, days(c.days))));
        ctlEl.appendChild(nextBtn);
        psBtn = invBtn = null;
        var hint = h('div.hiring-hint');
        if (c.isNew && c.stage === 'new' && !S.busy) {
          hint.appendChild(h('span', null, T('Новый отклик. Бот задаст вопросы вакансии в Telegram и покажет ответы здесь.', 'A new response. The bot asks the vacancy questions in Telegram and shows the answers here.')));
          psBtn = h('button.btn.btn-acc.btn-sm', { type: 'button', onclick: prescreen }, icon('tg'), T('Отправить на прескрининг в Telegram', 'Send to pre-screening in Telegram'));
          hint.appendChild(h('div', null, psBtn));
        } else if (c.isNew && S.busy) {
          hint.appendChild(h('span', null, T('Бот ведёт прескрининг в Telegram…', 'The bot is running the pre-screening in Telegram…')));
        } else if (c.isNew && c.stage === 'pre') {
          hint.appendChild(h('span', null, T('Что дальше. ', 'Next step. '), h('b', null, T('Прескрининг пройден: ', 'Pre-screening passed: ')), T('проверьте анализ и пригласите на интервью', 'check the analysis and invite to an interview')));
          invBtn = h('button.btn.btn-acc.btn-sm', { type: 'button', onclick: function () { invite(c); } }, icon('check'), T('Пригласить', 'Invite'));
          hint.appendChild(h('div', null, invBtn));
        } else {
          var tx = { new: T('Ждёт первого ответа рекрутера.', 'Waiting for the first recruiter reply.'), pre: T('Ждём ответы прескрининга.', 'Waiting for pre-screening answers.'),
            rec: T('Интервью назначено. После него переведите дальше или откажите.', 'Interview is booked. Move on or reject after it.'),
            tz: T('Ждём решение ТЗ.', 'Waiting for the test task.'), offer: T('Оффер отправлен, ждём ответ.', 'Offer sent, waiting for the answer.'),
            hold: T('В холде до 15.12, система напомнит.', 'On hold until 15 Dec, the system will remind you.'), rej: T('Отказ отправлен, в том числе на сайт вакансий.', 'Rejection sent, also to the job board.') };
          hint.appendChild(h('span', null, T('Что дальше. ', 'Next step. '), tx[c.stage]));
        }
        ctlEl.appendChild(hint);
        var off = S.busy || c.stage === 'hold' || c.stage === 'rej';
        ctlEl.appendChild(h('div.hiring-acts', null,
          h('button.btn.btn-sm', { type: 'button', disabled: off, onclick: function () { S.why = S.why === 'rej' ? null : 'rej'; renderCtl(); } }, icon('x'), T('Отказать…', 'Reject…')),
          h('button.btn.btn-sm', { type: 'button', disabled: off, onclick: function () { S.why = S.why === 'hold' ? null : 'hold'; renderCtl(); } }, icon('clock'), T('В холд', 'On hold'))));
        if (S.why === 'rej') {
          ctlEl.appendChild(h('div.hiring-why.in-pop', null, h('b', null, T('Почему отказ?', 'Why reject?')),
            h('div.hiring-acts', null, REJ.map(function (r) { return h('button.btn.btn-sm', { type: 'button', onclick: function () { park(c, 'rej', r); } }, r); }))));
        } else if (S.why === 'hold') {
          ctlEl.appendChild(h('div.hiring-why.in-pop', null, h('b', null, T('Почему в холд?', 'Why on hold?')),
            h('span', { style: 'color:var(--ink2)' }, T('Вернуться: 15.12', 'Return on: 15 Dec')),
            h('div.hiring-acts', null, h('button.btn.btn-sm', { type: 'button', onclick: function () { park(c, 'hold', T('Вакансия на паузе', 'Vacancy paused')); } }, T('Вакансия на паузе', 'Vacancy paused')))));
        }
      }
      function move(c, st, quiet) {
        c.stage = st; c.days = 0; S.moves++; S.why = null;
        cnt.set('mv', String(S.moves));
        addMsg(c, SYS(st));
        S.flash = c.id; renderMain();
        if (S.sel === c.id) { rTitle(c.name + ' · ' + STG[st]); renderCtl(); }
        if (!quiet) log.add(tm(2), c.name + T(': этап ', ': stage ') + STG[st]);
        say();
      }
      function park(c, st, why) {
        move(c, st, true);
        log.add(tm(2), c.name + ': ' + STG[st] + T(', причина: ', ', reason: ') + why + (st === 'hold' ? T(', вернуться 15.12', ', return on 15 Dec') : T('. Отказ отправлен и на сайт вакансий', '. Rejection also sent to the job board')), st === 'rej' ? 'warn' : null);
      }
      function useTpl() {
        var c = C[S.sel];
        ta.value = TPL[c.stage].replace('{n}', c.name.split(' ')[0]);
        ta.classList.remove('flash'); void ta.offsetWidth; ta.classList.add('flash');
        if (S.other === c.id) S.tpl = true;
        log.add(tm(1), T('Шаблон для этапа «', 'Template for the "') + STG[c.stage] + T('» в черновике, сам не отправляется', '" stage put in the draft, it is never sent by itself'));
        say(); hold(1000);
      }
      function send() {
        var c = C[S.sel], t = ta.value.trim();
        if (!t) { ta.focus(); return; }
        var ch = lastIn(c);
        addMsg(c, { k: 'out', ch: ch, t: t });
        ta.value = '';
        if (S.other === c.id && S.tpl) S.sent = true;
        log.add(tm(3), (ch === 'jb' ? T('Ответ ушёл в чат отклика на сайте вакансий', 'Reply sent into the response chat on the job board') : T('Ответ ушёл в ', 'Reply sent to ') + CH[ch]), 'sys');
        say(); hold(2600);
      }

      /* ---------- Telegram pre-screening ---------- */
      function prescreen() {
        var c = C.oleg;
        if (S.busy || c.stage !== 'new') return;
        S.busy = true; renderCtl();
        log.add(tm(2), c.name + T(': отправлен на прескрининг в Telegram', ': sent to pre-screening in Telegram'));
        ctx.now(T('Бот ведёт прескрининг сам. Смотрите в чат: ответы кандидата падают в ту же ленту.', 'The bot runs the pre-screening on its own. Watch the chat: the answers land in the same thread.'));
        var o = [T('1-3 года', '1-3 years'), T('4 года и больше', '4 years or more'), T('Пропустить', 'Skip'), T('Связаться с рекрутером', 'Contact a recruiter')];
        function m(k, ru, en, x) { var r = { k: k, ch: 'tg', t: T(ru, en) }; if (x) { r.chips = x.chips; r.on = x.on; } return function () { addMsg(c, r); }; }
        chain([
          [500, function () { addMsg(c, { k: 'sys', t: T('Приглашение в Telegram-бот отправлено', 'Telegram bot invitation sent') }); }],
          [1600, m('bot', 'Здравствуйте, Олег! Я AI-ассистент. Задам 2 вопроса по вакансии. Любой можно пропустить.', 'Hello Oleg! I am an AI assistant. I will ask 2 questions about the vacancy. You can skip any of them.')],
          [1800, m('bot', 'Сколько лет вы пишете на Python в продакшене?', 'How many years have you written Python in production?', { chips: o })],
          [2000, function () { var last = c.thr[c.thr.length - 1]; last.on = 1; if (S.sel === 'oleg') renderChatKeep(); addMsg(c, { k: 'in', ch: 'tg', t: o[1] }); }],
          [1700, m('bot', 'Когда сможете выйти и какой формат удобен?', 'When can you start and which format suits you?')],
          [2000, m('in', 'Через 2 недели, удалённо или гибрид.', 'In 2 weeks, remote or hybrid.')],
          [1700, m('bot', 'Спасибо! Сводка: Python 4+ года, выход через 2 недели, удалённо или гибрид. Рекрутер скоро ответит.', 'Thank you! Summary: Python 4+ years, can start in 2 weeks, remote or hybrid. A recruiter will answer soon.')],
          [1100, function () {
            c.score = c.ps;
            addMsg(c, { k: 'sys', t: T('Прескрининг завершён · AI-оценка 82/100', 'Pre-screening finished · AI score 82/100') });
            log.add(tm(40), T('Прескрининг завершён, ответы проанализированы: AI-оценка 82/100. Бот никому не отказывает', 'Pre-screening finished, answers analysed: AI score 82/100. The bot never rejects anyone'), 'sys');
            S.busy = false;
            move(c, 'pre', true);
            renderScore(); showBias(c);
            ctx.focus(S.nodes.oleg);
            hold(2200);
          }]
        ]);
      }
      /* re-render the thread when a message changed (a chip got chosen) */
      function renderChatKeep() {
        thrEl.innerHTML = '';
        C[S.sel].thr.forEach(function (m) { thrEl.appendChild(msgNode(m)); });
        thrBox.scrollTop = thrBox.scrollHeight;
      }
      function invite(c) {
        if (c.stage !== 'pre') return;
        move(c, 'rec', true);
        var ch = lastIn(c);
        addMsg(c, { k: 'out', ch: ch, t: T('Олег, приглашаем на интервью с рекрутером в четверг в 15:00. Подходит?', 'Oleg, we invite you to a recruiter interview on Thursday at 15:00. Does it work for you?') });
        S.invited = true;
        log.add(tm(5), T('Приглашение ушло в Telegram и на сайт вакансий: этап «Рекрутинговое интервью»', 'Invitation sent to Telegram and to the job board: stage "Recruiter interview"'), 'sys');
        tryEnd(); hold(3000); say();
      }

      /* ---------- AI score tab ---------- */
      function renderScore() {
        scoreP.innerHTML = '';
        var c = S.sel && C[S.sel];
        if (!c) return;
        if (c.score == null) {
          scoreP.appendChild(h('p.hiring-ph', null, T('Оценка появится после прескрининга.', 'The score appears after pre-screening.')));
          return;
        }
        var fill = h('i', { style: 'width:0' });
        function pts(a, ok) {
          return h('ul.hiring-pts', null, a.map(function (p) { return h('li.' + (ok ? 'p-ok' : 'p-no'), null, icon(ok ? 'check' : 'x'), h('span', null, p[0], h('small', null, p[1]))); }));
        }
        scoreP.appendChild(h('div.hiring-top', null,
          h('div', null, h('p.hiring-lbl', null, T('Кандидат', 'Candidate')), h('p.hiring-cand', null, c.name)),
          h('p.hiring-big', null, h('b', null, String(c.score)), ' / 100')));
        scoreP.appendChild(h('div.bar.hiring-bigbar', null, fill));
        if (c.flag) scoreP.appendChild(h('p.wtl', { style: 'margin-bottom:10px' }, icon('warn'), T('Проверить: возможна ошибка AI', 'Check: possible AI mistake')));
        scoreP.appendChild(h('div.hiring-sg', null,
          h('div', null, h('p.hiring-lbl', null, T('Сильные стороны', 'Strengths')), pts(c.plus, true)),
          h('div', null, h('p.hiring-lbl', null, T('Чего не хватает', 'Gaps')), pts(c.minus, false))));
        scoreP.appendChild(h('p.thr', null, icon('lock'), ' ', T('Имя и контакты заменены до отправки текста модели. Каждый пункт с цитатой из резюме.', 'Name and contacts are replaced before the text goes to the model. Every point carries a quote from the résumé.')));
        var sv = scoreP.querySelector('.thr svg'); if (sv) { sv.style.width = '14px'; sv.style.height = '14px'; sv.style.verticalAlign = '-2px'; }
        void fill.offsetWidth; fill.style.width = c.score + '%';
      }

      /* ---------- bias check (from the first version) ---------- */
      function segLock(off) { [segG, segA, segC].forEach(function (s) { s.querySelectorAll('button').forEach(function (b) { b.disabled = off; }); }); }
      function paintRes(mode) {
        resV.innerHTML = '';
        if (mode === 'none') { resL.textContent = T('Откройте кандидата с AI-оценкой.', 'Open a candidate with an AI score.'); return; }
        resL.textContent = T('Балл с этими данными', 'Score with these values');
        if (mode === 'wait') { resV.appendChild(h('span.typing', null, h('i'), h('i'), h('i'))); resV.appendChild(h('span.tg.tg-acc', null, T('пересчитываю', 're-scoring'))); return; }
        resV.appendChild(h('b' + (mode === 'ok' ? '.in-pop' : ''), null, String(C[S.sel].score)));
        resV.appendChild(mode === 'ok' ? h('span.tg.tg-ok.in-pop', null, 'Δ 0') : h('span.tg.tg-hum', null, T('исходный профиль', 'original profile')));
      }
      function addRow(c, r, isBase) {
        var tr = h('tr', null,
          h('td' + (r.g !== c.g ? '.ch' : ''), null, GL[r.g]), h('td' + (r.a !== c.a ? '.ch' : ''), null, r.a), h('td' + (r.c !== c.c ? '.ch' : ''), null, CL[r.c]),
          isBase ? h('td.num', null, String(c.score), h('small', null, T('исходный', 'original'))) : h('td.num', null, h('span.hiring-ok', null, icon('check'), String(c.score))));
        trs[r.g + '|' + r.a + '|' + r.c] = tr;
        tbody.appendChild(tr);
        return tr;
      }
      function cover(id) {
        var c = C[id], o = { g: false, a: false, c: false, ages: {} };
        S.bias[id].rows.forEach(function (r) {
          if (r.g !== c.g) o.g = true;
          if (r.a !== c.a) { o.a = true; o.ages[r.a] = true; }
          if (r.c !== c.c) o.c = true;
        });
        o.all = o.g && o.a && o.c;
        return o;
      }
      function showBias(c) {
        tbody.innerHTML = ''; trs = {};
        biasWho.textContent = c.name;
        if (c.score == null) { biasBody.classList.add('off'); segLock(true); segG.set(''); segA.set(''); segC.set(''); tblWrap.hidden = true; verdict.hidden = true; paintRes('none'); return; }
        var b = S.bias[c.id] || (S.bias[c.id] = { g: c.g, a: c.a, c: c.c, rows: [], n: 0, passed: false });
        biasBody.classList.remove('off'); segLock(false);
        segG.set(b.g); segA.set(b.a); segC.set(b.c);
        addRow(c, { g: c.g, a: c.a, c: c.c }, true);
        b.rows.forEach(function (r) { addRow(c, r, false); });
        tblWrap.hidden = false; verdict.hidden = !b.passed;
        paintRes(b.n ? 'ok' : 'base');
      }
      function change(attr, v) {
        if (!S.sel || C[S.sel].score == null) return;
        var g = ++S.bgen;
        S.bias[S.sel][attr] = v;
        S.pending = true;
        paintRes('wait');
        ctx.later(function () { if (g === S.bgen && S.pending) resolve(); }, 650);
      }
      function resolve() {
        var id = S.sel, c = C[id], b = S.bias[id], key = b.g + '|' + b.a + '|' + b.c, tr = trs[key];
        S.pending = false; S.checks++; b.n++;
        cnt.set('bias', String(S.checks));
        if (tr) { tr.classList.remove('in'); void tr.offsetWidth; }
        else { var r = { g: b.g, a: b.a, c: b.c }; b.rows.push(r); tr = addRow(c, r, false); }
        tr.classList.add('in');
        paintRes('ok');
        log.add(tm(2), T('Проверка ', 'Check ') + c.name + T(': пол ', ': gender ') + GL[b.g] + T(', возраст ', ', age ') + b.a + T(', гражданство ', ', citizenship ') + CL[b.c] + T('. Балл ', '. Score ') + c.score + ', Δ 0', 'sys');
        if (!b.passed && cover(id).all) {
          b.passed = true; S.passed = true; verdict.hidden = false;
          log.add(tm(1), T('Проверка на предвзятость пройдена, прогон записан в журнал', 'Bias check passed, the run is logged'), 'sys');
          tryEnd();
        }
        say(); hold(2400);
        ctx.focus(b.passed ? verdict : res);
      }

      function tryEnd() {
        if (S.ended || !S.invited || !S.passed) return;
        S.ended = true;
        ctx.end(END);
      }

      /* ---------- the hint line ---------- */
      function say() {
        var o = C.oleg;
        if (!S.arrived) return;
        if (!S.invited) {
          if (S.sel !== 'oleg') { ctx.now(T('Откройте новый отклик <b>«' + o.name + '»</b>.', 'Open the new response <b>"' + o.name + '"</b>.')); return; }
          if (S.busy) return;
          if (o.stage === 'new') { ctx.now(T('Нажмите <b>«Отправить на прескрининг в Telegram»</b>: дальше всё сделает бот.', 'Press <b>"Send to pre-screening in Telegram"</b>: the bot does the rest.')); return; }
          ctx.now(T('Бот прескрининг провёл. Нажмите <b>«Пригласить»</b>.', 'The bot finished the pre-screening. Press <b>"Invite"</b>.')); return;
        }
        if (!S.sawTable) { ctx.now(T('Кандидат на интервью. Посмотрите воронку другим видом: <b>«Таблица»</b> или <b>«Список»</b>.', 'The candidate is on to the interview. View the funnel another way: <b>"Table"</b> or <b>"List"</b>.')); return; }
        if (!S.other) { ctx.now(T('Откройте другого кандидата, например <b>«' + C.anna.name + '»</b>: у неё в чате сайт вакансий, Telegram, почта и заметки.', 'Open another candidate, for example <b>"' + C.anna.name + '"</b>: her chat mixes the job board, Telegram, email and notes.')); return; }
        if (!S.sent) { ctx.now(T('Нажмите <b>«Шаблоны»</b>, затем <b>«Отправить»</b>: ответ уйдёт в канал, откуда кандидат писал последним.', 'Press <b>"Templates"</b>, then <b>"Send"</b>: the reply goes to the channel the candidate last wrote from.')); return; }
        if (!S.sawScore) { ctx.now(T('Откройте вкладку <b>«AI-оценка»</b>: у каждого пункта цитата из резюме.', 'Open the <b>"AI score"</b> tab: every point has a quote from the résumé.')); return; }
        if (!S.passed) { ctx.now(T('Откройте <b>«Проверка на предвзятость»</b> и поменяйте пол, возраст и гражданство: балл не должен сдвинуться.', 'Open <b>"Bias check"</b> and change gender, age and citizenship: the score must not move.')); return; }
        ctx.now(T('Готово. Попробуйте <b>«Отказать…»</b> или <b>«В холд»</b>: система спросит причину.', 'Done. Try <b>"Reject…"</b> or <b>"On hold"</b>: the system asks for the reason.'));
      }

      /* ---------- base ---------- */
      function start() {
        ctx.clearTimers();
        S = fresh(); clock = 0;
        segView.set('board'); segSort.set('wait');
        renderMain();
        rTitle(T('Кандидат', 'Candidate'));
        chatP.innerHTML = ''; chatP.appendChild(h('p.hiring-ph', null, T('Выберите карточку слева или сверху: здесь откроется общий чат со всеми каналами.', 'Pick a card: the single chat with all channels opens here.')));
        scoreP.innerHTML = ''; scoreP.appendChild(h('p.hiring-ph', null, T('Выберите кандидата.', 'Pick a candidate.')));
        S.sel = null;
        tbody.innerHTML = ''; tblWrap.hidden = true; verdict.hidden = true; biasBody.classList.add('off'); segLock(true); biasWho.textContent = '—'; paintRes('none');
        setTabQuiet('chat');
        log.clear();
        cnt.set('arr', '0'); cnt.set('ch', '—'); cnt.set('mv', '0'); cnt.set('bias', '0');
        ctx.end(null);
        ctx.now(T('Воронка вакансии. Нажмите что угодно, например карточку: через секунду придёт новый отклик с сайта вакансий.', 'The vacancy funnel. Press anything, a card for example: a new response from the job board arrives a second later.'));
      }
      function rTitle(t) { winR.querySelector('.win-h span').textContent = t; }
      function setTabQuiet(v) { S.tab = v; segTab.set(v); chatP.hidden = v !== 'chat'; scoreP.hidden = v !== 'score'; biasP.hidden = v !== 'bias'; }

      start();

      return {
        reset: function () { start(); },
        next: function () {
          if (!S.arrived || S.busy || S.hold || S.pending) return 'wait';
          var o = C.oleg;
          if (!S.invited) {
            if (S.sel !== 'oleg') return S.nodes.oleg || null;
            if (S.tab !== 'chat') return segTab.btn('chat');
            if (o.stage === 'new') return psBtn;
            return invBtn;
          }
          if (!S.sawTable) return segView.btn('table');
          if (!S.sortDone) return segSort.btn('score');
          if (S.view !== 'board') return segView.btn('board');
          if (!S.other) return S.nodes.anna;
          var id = S.other;
          if (S.sel !== id) return S.nodes[id];
          if (!S.sent) {
            if (S.tab !== 'chat') return segTab.btn('chat');
            return S.tpl ? sendBtn : tplBtn;
          }
          if (!S.sawScore) return segTab.btn('score');
          if (S.tab !== 'bias') return segTab.btn('bias');
          var c = C[id], cov = cover(id);
          if (cov.all) return null;
          if (!cov.g) return segG.btn(c.g === 'm' ? 'f' : 'm');
          var ages = AGES.filter(function (a) { return a !== c.a && !cov.ages[a]; });
          if (!cov.a) return segA.btn(ages[0]);
          return segC.btn(CITS.filter(function (k) { return k !== c.c; })[0]);
        }
      };
    }
  });
})();
