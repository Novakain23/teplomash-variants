(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const burger = $('#burger');
  burger && burger.addEventListener('click', () => {
    const o = document.body.classList.toggle('menu-open');
    burger.setAttribute('aria-expanded', o); $('#sheet').setAttribute('aria-hidden', !o);
    burger.innerHTML = `<svg><use href="#i-${o ? 'x' : 'menu'}"/></svg>`;
  });
  $$('#sheet a').forEach(a => a.addEventListener('click', () => { document.body.classList.remove('menu-open'); burger.innerHTML = '<svg><use href="#i-menu"/></svg>'; }));

  /* one place where every form sends its lead: /api/lead forwards it to the manager (Telegram / e-mail) */
  window.TMlead = async lead => {
    try {
      const r = await fetch('/api/lead', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(lead) });
      const j = await r.json().catch(() => ({}));
      return !!(r.ok && j.ok);
    } catch (e) { return false; }
  };

  /* header: a white "key" slides under the hovered menu item */
  const nav = document.querySelector('.pill nav');
  if (nav) {
    const at = a => { nav.style.setProperty('--hx', a.offsetLeft + 'px'); nav.style.setProperty('--hw', a.offsetWidth + 'px'); nav.style.setProperty('--ho', 1); };
    nav.querySelectorAll('a').forEach(a => { a.addEventListener('mouseenter', () => !a.hasAttribute('aria-current') && at(a)); a.addEventListener('focus', () => at(a)); });
    nav.addEventListener('mouseleave', () => nav.style.setProperty('--ho', 0));
  }

  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  const watch = () => $$('.rv:not(.in)').forEach(el => io.observe(el));

  /* product card used on the home rail and the catalog */
  const card = p => `<article class="pd rv" data-id="${p.id}" tabindex="0">
      <div class="pd-img"><img src="${p.img}" alt="${p.name}" loading="lazy"${p.len ? ` style="width:${Math.round(30 + p.len * 55)}%"` : ''}></div>
      <div class="pd-b"><h3>${p.name}</h3>
        <div class="specs">${p.kw ? `<div><b>${p.kw} кВт</b>мощность</div>` : ''}${p.height ? `<div><b>${p.height}</b>высота</div>` : ''}${!p.kw && !p.height ? `<div><b>${p.code}</b>${p.use}</div>` : ''}</div>
        <div class="pd-f"><span>Цена по запросу</span><a class="btn btn-ink" href="${TM.wa('Здравствуйте! Интересует ' + p.name + '. Подскажите цену и наличие.')}" target="_blank" rel="noopener">Узнать цену</a></div>
      </div></article>`;
  window.V2card = card;
  /* catalog tile: square card for the catalog grid */
  window.V2tile = p => {
    const title = p.series ? p.code : p.name;
    const type = p.series ? 'Тепловая завеса' : TM.categories.find(c => c.id === p.cat).name.replace(/ы$/, '');
    return `<article class="tile" data-id="${p.id}" tabindex="0">
      <div class="tile-img${p.series ? ' s' + p.series : ''}">
        ${p.series ? `<span class="tile-tag"><i></i>Серия ${p.series}</span>` : ''}${p.kw ? `<span class="tile-kw">${p.kw} кВт</span>` : ''}
        <img src="${p.img}" alt="${p.name}" loading="lazy"${p.len ? ` style="width:${Math.round(34 + p.len * 50)}%"` : ''}>
      </div>
      <div class="tile-b">
        <small>${type}${p.heat ? ' · ' + p.heat.toLowerCase() : ''}</small>
        <h3>${title}</h3>
        <p>${p.use}${p.height ? ` · проём ${p.height}` : ''}</p>
        <div class="tile-f"><a class="btn btn-ink btn-sm" href="${TM.wa('Здравствуйте! Интересует ' + p.name + '. Подскажите цену и наличие.')}" target="_blank" rel="noopener">Узнать цену</a><button class="add" data-id="${p.id}" aria-pressed="false" aria-label="Добавить в список запроса"><svg class="pl"><use href="#i-plus"/></svg><svg class="ck"><use href="#i-check"/></svg></button></div>
      </div>
    </article>`;
  };

  /* HERO showroom */
  const model = $('#model'), flow = $('#flow');
  if (model) {
    const len = .8;
    const zf = () => Math.min(1.12, model.clientWidth * .84 / (1.651 * len * model.clientHeight));
    let zoom = zf();
    const c3 = window.Curtain3D && Curtain3D(model, { yaw: -.42, pitch: .1, heat: 1, light: 'studio', zoom, len, pointerTarget: $('#show') });
    new ResizeObserver(() => { zoom = zf(); c3 && c3.set({ zoom }); }).observe(model);
    const geo = () => {
      const H = model.clientHeight, W = model.clientWidth;
      const w = 1.651 * len * zoom * H * .9, h = .256 * zoom * H;
      return { x: W / 2 - w / 2, w, y: H / 2 + h * .46, depth: H / 2 - h * .4 };
    };
    const af = window.Airflow2 && Airflow2(flow, { source: () => geo(), floor: () => flow.clientHeight * .97, flow: 1, heat: 1, cold: true, snow: true, density: 1.1 });
    const door = $('#door');
    const placeDoor = () => { const g = geo(); Object.assign(door.style, { left: (g.x - 8) + 'px', width: (g.w + 16) + 'px', top: (g.y - 6) + 'px' }); };
    placeDoor(); new ResizeObserver(placeDoor).observe(model);
    const caps = [
      'Холод свободно проходит в открытую дверь.',
      'Летом держит прохладу, пыль и насекомых снаружи.',
      'Экономичный режим для межсезонья.',
      'Тёплый барьер на всю высоту проёма.'
    ];
    const conf = [{ heat: 0, flow: 0, tint: 0, t: 'Холод проходит' }, { heat: 0, flow: .5, tint: -.9, t: 'Прохладный барьер' }, { heat: .45, flow: .78, tint: .55, t: 'Тёплый барьер' }, { heat: 1, flow: 1, tint: 1, t: 'Горячий барьер' }];
    const seg = $('#seg'), knob = $('#knob'), show = $('#show');
    const setMode = (m, first) => {
      $$('button', seg).forEach(b => b.setAttribute('aria-checked', +b.dataset.m === m));
      const b = seg.querySelector(`[data-m="${m}"]`);
      knob.style.left = b.offsetLeft + 'px'; knob.style.width = b.offsetWidth + 'px';
      knob.style.backgroundColor = m === 0 ? '#3A2614' : m === 1 ? '#3D6F9C' : '#A85A08';
      const c = conf[m];
      c3 && c3.target({ heat: c.heat }); af && af.set({ flow: c.flow, heat: c.heat });
      show.style.setProperty('--tint', c.tint); show.dataset.m = m; $('#doorT').textContent = c.t;
      const cap = $('#cap');
      if (first) cap.innerHTML = caps[m];
      else { cap.style.opacity = 0; setTimeout(() => { cap.innerHTML = caps[m]; cap.style.opacity = 1; }, 180); }
    };
    seg.addEventListener('click', e => { const b = e.target.closest('button'); b && setMode(+b.dataset.m); });
    seg.addEventListener('keydown', e => {
      if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
      const cur = +seg.querySelector('[aria-checked=true]').dataset.m, n = Math.max(0, Math.min(3, cur + (e.key === 'ArrowRight' ? 1 : -1)));
      setMode(n); seg.querySelector(`[data-m="${n}"]`).focus();
    });
    requestAnimationFrame(() => { setMode(3, true); placeDoor(); });
    addEventListener('resize', () => { setMode(+seg.querySelector('[aria-checked=true]').dataset.m, true); placeDoor(); });
    // drag to turn the unit
    let drag = false, sx = 0, sy = 0, by = -.42, bp = .1;
    model.addEventListener('pointerdown', e => { drag = true; sx = e.clientX; sy = e.clientY; model.setPointerCapture(e.pointerId); model.style.cursor = 'grabbing'; });
    model.addEventListener('pointermove', e => { if (!drag || !c3) return; c3.target({ yaw: by + (e.clientX - sx) / 260, pitch: Math.max(-.5, Math.min(.6, bp + (e.clientY - sy) / 400)) }); });
    model.addEventListener('pointerup', e => { if (!drag) return; drag = false; model.style.cursor = ''; by += (e.clientX - sx) / 260; bp = Math.max(-.5, Math.min(.6, bp + (e.clientY - sy) / 400)); });
  }

  /* HOW IT WORKS: side view of a doorway — switch the curtain off and the cold walks in */
  const d2 = $('#demo2');
  if (d2) {
    const unit = $('#d2Unit'), flowC = $('#d2Flow');
    // the unit hangs on the inner side of the wall, right above the doorway
    const geo2 = () => { const W = d2.clientWidth, H = d2.clientHeight; const wx = W * .47; return { x: wx + 8, w: Math.max(26, W * .06), y: H * .2 + H * .07, W, H, wx }; };
    const placeU = () => { const g = geo2(); const uw = g.W * .3, uh = uw * .62; Object.assign(unit.style, { width: uw + 'px', height: uh + 'px', left: (g.x + g.w / 2 - uw / 2) + 'px', top: (g.H * .2 + g.H * .035 - uh / 2) + 'px' }); };
    placeU(); new ResizeObserver(placeU).observe(d2);
    let c3d = null, af2 = null, started = false;
    new IntersectionObserver((e, o) => {
      if (!e[0].isIntersecting || started) return; started = true; o.disconnect();
      c3d = window.Curtain3D && Curtain3D(unit, { yaw: -1.28, pitch: .22, heat: 1, light: 'warm', zoom: 1.25, len: .8, sway: false, interactive: false });
      af2 = window.Airflow2 && Airflow2(flowC, { source: () => { const g = geo2(); return { x: g.x, y: g.y, w: g.w }; }, floor: () => d2.clientHeight * .86, flow: 1, heat: 1, cold: true, snow: true, density: 1.4, scale: 1.1 });
    }, { rootMargin: '150px' }).observe(d2);
    fetch('https://api.open-meteo.com/v1/forecast?latitude=43.24&longitude=76.89&current=temperature_2m').then(r => r.json()).then(d => { const t = Math.round(d.current.temperature_2m); if (t < 15) $('#d2Out').textContent = (t > 0 ? '+' : t < 0 ? '−' : '') + Math.abs(t) + '°'; }).catch(() => {});
    let on = true, tIn = 21, anim = 0;
    const tempTo = target => { cancelAnimationFrame(anim); const step = () => { tIn += (target - tIn) * .04; $('#d2In').textContent = '+' + Math.round(tIn) + '°'; if (Math.abs(target - tIn) > .3) anim = requestAnimationFrame(step); else $('#d2In').textContent = '+' + target + '°'; }; anim = requestAnimationFrame(step); };
    $('#d2Sw').addEventListener('click', () => {
      on = !on; $('#d2Sw').setAttribute('aria-checked', on); d2.classList.toggle('off', !on);
      $('#d2Lab').textContent = on ? 'Завеса работает' : 'Завеса выключена';
      $('#d2Note').textContent = on ? 'Холод разворачивается у порога' : 'Холод идёт по полу к кассе';
      af2 && af2.set({ flow: on ? 1 : 0 }); c3d && c3d.target({ heat: on ? 1 : 0 }); tempTo(on ? 21 : 12);
    });
  }

  /* QUIZ as a compact WhatsApp-style chat with big answer buttons */
  const wa = $('#wa');
  if (wa) {
    const body = $('#waBody'), form = $('#waForm'), input = $('#waInput'), stepEl = $('#waStep');
    const L = { door: 'Одна дверь', double: 'Двойные двери', gate: 'Ворота', 1: 'до 2,5 м', 2: '2,5–3,5 м', 3: 'выше 3,5 м', e: 'электрический', w: 'водяной', n: 'без нагрева' };
    const Q = [
      { k: 'a', q: 'Здравствуйте! Подберём тепловую завесу за 3 ответа. Какой вход утепляем?', o: [['door', 'Одна дверь'], ['double', 'Двойные двери'], ['gate', 'Ворота склада'], ['many', 'Несколько входов']] },
      { k: 'b', q: 'Какая высота проёма?', o: [[1, 'До 2,5 м'], [2, '2,5–3,5 м'], [3, 'Выше 3,5 м'], [0, 'Не знаю точно']] },
      { k: 'c', q: 'И последнее: как завеса будет греть?', o: [['e', 'От электросети'], ['w', 'От отопления'], ['n', 'Без нагрева'], ['x', 'Посоветуйте']] }
    ];
    Object.assign(L, { many: 'Несколько входов', 0: 'не знаю точно', x: 'нужна консультация' });
    let ans = {}, step = 0, busy = false, started = false;
    const time = () => new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const scroll = () => body.scrollTo({ top: body.scrollHeight, behavior: reduce ? 'auto' : 'smooth' });
    const tick = '<svg viewBox="0 0 18 12"><path d="M1 6.5 4.5 10 11 2M7 10l1 0L16 2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
    const bubble = (html, me) => { const d = document.createElement('div'); d.className = 'wb ' + (me ? 'me' : 'them'); d.innerHTML = `<p>${html}</p><span class="wt">${time()}${me ? tick : ''}</span>`; body.appendChild(d); scroll(); };
    const say = async lines => {
      busy = true;
      for (const l of lines) {
        $('#waStatus').textContent = 'печатает…';
        const t = document.createElement('div'); t.className = 'wb them typing'; t.innerHTML = '<i></i><i></i><i></i>'; body.appendChild(t); scroll();
        await new Promise(r => setTimeout(r, reduce ? 50 : Math.min(1100, 420 + l.length * 9)));
        t.remove(); bubble(l);
      }
      $('#waStatus').textContent = 'онлайн · отвечает сразу';
      busy = false;
    };
    const choices = (list, hint) => {
      const box = document.createElement('div'); box.className = 'wa-choices';
      box.innerHTML = (hint ? '<p class="wa-hint"><span aria-hidden="true">👇</span>Нажмите на ответ — чат работает по-настоящему</p>' : '') + `<div class="wa-opts">${list.map(([v, t]) => `<button type="button" data-v="${v}">${t}</button>`).join('')}</div>`;
      body.appendChild(box); scroll();
    };
    const ask = (ph, type) => { form.hidden = false; input.value = ''; input.placeholder = ph; input.type = type; input.inputMode = type === 'tel' ? 'tel' : 'text'; input.autocomplete = type === 'tel' ? 'tel' : 'name'; setTimeout(() => input.focus({ preventScroll: true }), 50); };
    const result = () => {
      const high = ans.b === 3 || ans.a === 'gate';
      const ser = high ? 400 : (ans.a === 'door' && ans.b === 1) ? 200 : 300;
      const code = ser === 200 ? 'КЭВ-6П2011E' : ser === 300 ? (ans.a === 'double' ? 'КЭВ-18П3041E' : 'КЭВ-12П3041E') : (ans.b === 3 ? 'КЭВ-24П4042E' : 'КЭВ-12П4050E');
      return { ser, code, p: TM.products.find(x => x.id === code), water: ans.c === 'w' };
    };
    const next = async () => {
      if (step < 3) { stepEl.textContent = `Вопрос ${step + 1} из 3`; await say([Q[step].q]); choices(Q[step].o, step === 0); return; }
      if (step === 3) {
        const r = result(); stepEl.textContent = 'Почти готово';
        const vague = ans.a === 'many' || ans.b === 0;
        await say([vague ? 'Понял! Тут лучше посчитать вместе с инженером — он уточнит размеры и подберёт комплект. Как к вам обращаться?' : `Вам подойдёт <b>серия ${r.ser}</b>${r.water ? ' в водяном исполнении' : ` — например, <b>${r.code}</b>, ${r.p.kw} кВт`}. Куда прислать точный подбор и цену? Напишите ваше имя.`]);
        ask('Ваше имя', 'text'); return;
      }
      if (step === 4) { await say([`Спасибо, ${esc(ans.name)}! И номер телефона — менеджер свяжется в WhatsApp или позвонит.`]); ask('+7 ___ ___ __ __', 'tel'); return; }
      if (step === 5) {
        form.hidden = true;
        const r = result();
        const lead = { source: 'Подбор за 3 ответа (главная)', name: ans.name, phone: ans.phone, answers: { 'Вход': L[ans.a], 'Высота проёма': L[ans.b], 'Нагрев': L[ans.c] }, result: (ans.a === 'many' || ans.b === 0) ? 'нужен расчёт инженера' : `Серия ${r.ser}${r.water ? ' (водяная)' : ', ' + r.code}`, page: location.href };
        const ok = await window.TMlead(lead);
        const text = `Здравствуйте! Я ${ans.name}, ${ans.phone}. Подбор на сайте: ${L[ans.a].toLowerCase()}, высота ${L[ans.b]}, нагрев ${L[ans.c]}. Ориентир: ${lead.result}. Посчитайте, пожалуйста, цену.`;
        stepEl.textContent = 'Готово';
        await say([ok ? 'Готово! Ответы уже у менеджера — свяжемся в течение 15 минут в рабочее время.' : 'Готово! Отправьте ответы менеджеру в WhatsApp — текст уже собран, останется нажать «Отправить».']);
        const box = document.createElement('div'); box.className = 'wa-choices';
        box.innerHTML = `<div class="wa-opts one"><a class="wa-go" href="${TM.wa(text)}" target="_blank" rel="noopener"><svg><use href="#i-wa"/></svg>${ok ? 'Написать менеджеру в WhatsApp' : 'Отправить в WhatsApp'}</a><button type="button" class="wa-again">Пройти заново</button></div>`;
        body.appendChild(box); scroll();
      }
    };
    body.addEventListener('click', e => {
      if (e.target.closest('.wa-again')) { ans = {}; step = 0; body.innerHTML = ''; next(); return; }
      const b = e.target.closest('.wa-opts button'); if (!b || busy || step > 2) return;
      const q = Q[step]; const v = isNaN(+b.dataset.v) ? b.dataset.v : +b.dataset.v;
      ans[q.k] = v; b.closest('.wa-choices').remove(); bubble(esc(b.textContent), true); step++; next();
    });
    form.addEventListener('submit', e => {
      e.preventDefault(); if (busy || form.querySelector('.hp').value) return;
      const v = input.value.trim();
      if (step === 3) { if (v.length < 2) { input.focus(); return; } ans.name = v.slice(0, 60); }
      if (step === 4) {
        if (v.replace(/\D/g, '').length < 10) { input.classList.add('bad'); input.value = ''; input.placeholder = 'Например, +7 701 123 45 67'; input.focus(); return; }
        input.classList.remove('bad'); ans.phone = v.slice(0, 24);
      }
      form.hidden = true; bubble(esc(v), true); step++; next();
    });
    const start = () => { if (started) return; started = true; next(); };
    new IntersectionObserver((e, o) => { if (e[0].isIntersecting) { start(); o.disconnect(); } }, { threshold: .3 }).observe(wa);
  }

  /* decorative unit in the final CTA */
  const m3 = $('#model3');
  if (m3 && window.Curtain3D) Curtain3D(m3, { yaw: -.5, pitch: .3, heat: 1, light: 'dusk', zoom: 1.35, interactive: false });

  /* bento */
  const bento = $('#bento');
  if (bento) bento.innerHTML = TM.scenes.map((s, i) => `<a class="bx rv d${i % 3}" href="${TM.wa('Здравствуйте! Нужна завеса: ' + s.name.toLowerCase() + '. Помогите подобрать.')}" target="_blank" rel="noopener">
      <img src="${s.img}" alt="${s.name}" loading="lazy"><div class="bx-in"><span class="pick">${s.pick}</span><h3>${s.name}</h3><p>${s.text}</p></div></a>`).join('');

  /* catalog preview: the same tiles as the catalog page */
  const cats = $('#cats'), ht = $('#homeTiles');
  if (cats && ht) {
    cats.innerHTML = TM.categories.slice(0, 4).map((c, i) => `<button role="tab" aria-selected="${i === 0}" data-c="${c.id}">${c.short}</button>`).join('');
    const pick = { curtains: ['КЭВ-6П2011E', 'КЭВ-12П3041E', 'КЭВ-18П3091E', 'КЭВ-24П4042E'] };
    const fill = id => {
      const all = TM.products.filter(p => p.cat === id);
      const list = pick[id] ? all.filter(p => pick[id].includes(p.id)) : all.slice(0, 4);
      ht.innerHTML = list.map(window.V2tile).join('');
      $('#homeMore').href = '/v2/catalog.html?c=' + id;
      const n = all.length; $('#homeCount').textContent = n > list.length ? `ещё ${n - list.length} ${n - list.length < 5 ? 'модели' : 'моделей'} в каталоге` : '';
    };
    cats.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; $$('button', cats).forEach(x => x.setAttribute('aria-selected', x === b)); fill(b.dataset.c); });
    ht.addEventListener('click', e => { if (e.target.closest('a,button')) return; const t = e.target.closest('.tile'); if (t) location.href = '/v2/catalog.html?c=' + TM.products.find(p => p.id === t.dataset.id).cat + '&open=' + encodeURIComponent(t.dataset.id); });
    ht.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.classList.contains('tile')) e.target.click(); });
    fill('curtains');
  }

  /* PEOPLE: leaders with their area of responsibility, managers with a direct "write" button,
     reviews as a slow two-row marquee; a review that thanks someone by name shows that person */
  const leads = $('#leads');
  if (leads) {
    const T = TM.team, first = n => n.split(' ')[1] || n;
    const focus = { 0: 'Условия для дилеров и крупных объектов', 1: 'Склад, логистика и доставка по РК', 2: 'Подбор под объект и расчёт стоимости' };
    const praised = { 2: 'Малика', 5: 'Дамир' };
    leads.innerHTML = T.slice(0, 3).map((t, k) => `<article class="ld rv d${k}">
        <div class="ld-ph"><img src="${t.img}" alt="${t.name}" loading="lazy"></div>
        <div class="ld-b"><span class="ld-role">${t.role}</span><h3>${t.name}</h3><p>${focus[k]}</p>${praised[k] ? '<span class="ld-pr"><svg><use href="#i-star"/></svg>Благодарят в отзывах</span>' : ''}</div>
      </article>`).join('');
    $('#mgrs').innerHTML = T.slice(3).map((t, k) => `<article class="mg rv d${k}">
        <img src="${t.img}" alt="${t.name}" loading="lazy">
        <div><b>${first(t.name)}</b><span>Подбор · счёт · доставка</span>${praised[k + 3] ? '<em><svg><use href="#i-star"/></svg>в отзывах</em>' : ''}</div>
        <a class="mg-wa" href="${TM.wa('Здравствуйте, ' + first(t.name) + '! Нужна консультация по тепловой завесе.')}" target="_blank" rel="noopener" aria-label="Написать ${first(t.name)} в WhatsApp"><svg><use href="#i-wa"/></svg><span>Написать</span></a>
      </article>`).join('');
    const keys = [['Малик', 2], ['Дамир', 5]];
    const star = '<svg><use href="#i-star"/></svg>';
    const card = r => {
      const hit = keys.find(([k]) => r.text.includes(k));
      const nick = /\d|^[a-z]/.test(r.name);
      const nm = nick ? 'Клиент Jamal Group' : r.name;
      const ini = nick ? 'JG' : r.name.split(' ').map(w => w[0]).join('').slice(0, 2);
      return `<figure class="rq2${hit ? ' hit' : ''}"><div class="rq2-top"><span class="stars">${star.repeat(5)}</span><span class="rq2-src">2ГИС · ${r.date}</span></div>
        <blockquote>${r.text}</blockquote>
        <figcaption><i>${ini}</i><b>${nm}</b>${hit ? `<span class="rq2-thx"><img src="${T[hit[1]].img}" alt="">${first(T[hit[1]].name)}</span>` : ''}</figcaption></figure>`;
    };
    const R = TM.reviews, half = Math.ceil(R.length / 2);
    const row = (list, dir) => `<div class="marq-row ${dir}"><div class="marq-track">${list.map(card).join('')}${list.map(card).join('')}</div></div>`;
    $('#marq').innerHTML = row(R.slice(0, half), 'l') + row(R.slice(half), 'r');
  }

  /* FOOTER: the domain under an air curtain — a warm vertical stream sweeps across the letters
     (or follows the pointer), lifts them, warms their colour and pushes cold particles aside */
  const fd = $('#fdomain');
  if (fd) {
    const word = 'teplomash-kazakhstan.kz';
    const tx = fd.querySelector('.fd-text'), cv = fd.querySelector('.fd-air'), ctx = cv.getContext('2d');
    tx.innerHTML = [...word].map(ch => `<span>${ch}</span>`).join('');
    const spans = [...tx.children];
    let W = 0, H = 0, dpr = 1, centers = [], vis = false, raf = 0, px = null, sx = 0, t0 = performance.now();
    const parts = Array.from({ length: 70 }, () => ({ x: Math.random(), y: Math.random(), v: .4 + Math.random() * .8, r: .8 + Math.random() * 1.6 }));
    const streaks = Array.from({ length: 46 }, () => ({ u: Math.random(), t: Math.random(), v: .6 + Math.random() * .8, l: 14 + Math.random() * 26 }));
    const measure = () => {
      dpr = Math.min(2, devicePixelRatio || 1); W = fd.clientWidth; H = fd.clientHeight;
      cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const fr = fd.getBoundingClientRect();
      centers = spans.map(s => { const r = s.getBoundingClientRect(); return r.left - fr.left + r.width / 2; });
    };
    new ResizeObserver(measure).observe(fd);
    fd.addEventListener('pointermove', e => { const r = fd.getBoundingClientRect(); px = e.clientX - r.left; });
    fd.addEventListener('pointerleave', () => { px = null; });
    const frame = now => {
      raf = 0;
      const t = (now - t0) / 1000;
      const target = px != null ? px : W * (.5 + .46 * Math.sin(t * .45));
      sx += (target - sx) * (reduce ? 1 : .08);
      const sig = Math.max(60, W * .07);
      spans.forEach((s, i) => {
        const d = (centers[i] - sx) / sig, k = Math.exp(-d * d);
        const lift = k * 0.16, skew = Math.max(-1, Math.min(1, d)) * k * -8;
        s.style.transform = `translateY(${-lift}em) skewX(${skew}deg)`;
        s.style.setProperty('--k', k.toFixed(3));
      });
      ctx.clearRect(0, 0, W, H);
      // warm stream falling from the top edge at sx
      const sw = sig * 1.6;
      ctx.save(); ctx.translate(sx, 0); ctx.scale(sw / 2, H * 1.1);
      const rg = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
      rg.addColorStop(0, 'rgba(233,169,63,.34)'); rg.addColorStop(.55, 'rgba(233,169,63,.12)'); rg.addColorStop(1, 'rgba(233,169,63,0)');
      ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(0, 0, 1, 0, Math.PI); ctx.fill(); ctx.restore();
      ctx.lineCap = 'round';
      for (const p of streaks) {
        if (!reduce) { p.t += .012 * p.v; if (p.t > 1) { p.t = 0; p.u = Math.random(); } }
        const x = sx + (p.u - .5) * sw * .8, y = p.t * H;
        ctx.strokeStyle = `rgba(255,190,110,${.55 * Math.sin(Math.PI * p.t)})`; ctx.lineWidth = 1.3;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + p.l); ctx.stroke();
      }
      // cold air drifting in from the right, turned back by the stream
      for (const p of parts) {
        if (!reduce) {
          let X = p.x * W; const dx = X - sx;
          const push = Math.abs(dx) < sw * .7 ? Math.sign(dx || 1) * 2.4 : 0;
          X += -p.v * .6 + push; p.y += Math.sin(t * 2 + p.v * 10) * .0015;
          p.x = X / W; if (p.x < -.02) { p.x = 1.02; p.y = Math.random(); }
          if (p.x > 1.04) p.x = 1.02;
        }
        ctx.fillStyle = 'rgba(150,195,240,.45)'; ctx.beginPath(); ctx.arc(p.x * W, p.y * H, p.r, 0, 7); ctx.fill();
      }
      if (vis && !reduce) raf = requestAnimationFrame(frame);
    };
    new IntersectionObserver(e => { vis = e[0].isIntersecting; if (vis) { measure(); if (!raf) raf = requestAnimationFrame(frame); } }).observe(fd);
    measure(); sx = W / 2; if (reduce) frame(performance.now());
  }

  const faq = $('#faq');
  if (faq) {
    faq.innerHTML = TM.faq.map((f, k) => `<div class="qa rv d${k % 2}"><button aria-expanded="false" aria-controls="a${k}">${f.q}<span class="ic" aria-hidden="true"><svg><use href="#i-plus"/></svg></span></button><div class="ans" id="a${k}" role="region"><div><p>${f.a}</p></div></div></div>`).join('');
    faq.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; const it = b.parentElement, o = !it.classList.contains('open'); it.classList.toggle('open', o); b.setAttribute('aria-expanded', o); });
  }

  const form = $('#form');
  form && form.addEventListener('submit', e => {
    e.preventDefault();
    const d = $('#fTel').value.replace(/\D/g, '');
    if (d.length < 10) { form.classList.add('bad'); $('#fTel').focus(); return; }
    form.classList.remove('bad'); form.classList.add('done');
    window.TMlead({ source: 'Форма «Подбор и цена за 15 минут»', name: $('#fName').value.trim().slice(0, 60), phone: $('#fTel').value.trim().slice(0, 24), answers: { 'Что утепляем': $('#fPl').value }, page: location.href });
  });

  watch();
})();
