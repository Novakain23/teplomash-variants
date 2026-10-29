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

  /* header: compact after the first screen, magnetic CTA */
  const hdrEl = document.querySelector('.hdr');
  if (hdrEl) { const sc = () => hdrEl.classList.toggle('scrolled', scrollY > innerHeight * .6); addEventListener('scroll', sc, { passive: true }); sc(); }
  const cta = document.querySelector('.cta-hd');
  if (cta && !reduce && matchMedia('(pointer:fine)').matches) {
    addEventListener('pointermove', e => {
      const r = cta.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const dx = e.clientX - cx, dy = e.clientY - cy, d = Math.hypot(dx, dy), R = 120;
      const k = d < R ? (1 - d / R) : 0;
      cta.style.setProperty('--mx', (dx * .18 * k).toFixed(1) + 'px'); cta.style.setProperty('--my', (dy * .25 * k).toFixed(1) + 'px');
    }, { passive: true });
  }

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
  /* catalog banner: 3D curtain with live air for curtains, product photo on a plinth for other categories */
  const cb = $('#cbanner');
  if (cb) {
    const unit = $('#cbUnit'), flowC = $('#cbFlow'), img = $('#cbImg');
    let c3b = null, afb = null;
    const geoB = () => { const W = unit.clientWidth, H = unit.clientHeight, z = Math.min(1.25, W * .8 / (1.651 * .8 * H)); const w = 1.651 * .8 * z * H * .9, h = .256 * z * H; return { x: unit.offsetLeft + W / 2 - w / 2, w, y: unit.offsetTop + H / 2 + h * .46, z }; };
    window.V2banner = (cat, n) => {
      const cur = cat.id === 'curtains';
      cb.dataset.c = cat.id;
      $('#cbN').textContent = n; $('#cbNl').textContent = (n === 1 ? 'модель' : n < 5 ? 'модели' : 'моделей') + ' в разделе';
      if (cur && !c3b && window.Curtain3D) {
        c3b = Curtain3D(unit, { yaw: -.45, pitch: .14, heat: 1, light: 'studio', zoom: geoB().z, len: .8, pointerTarget: cb });
        new ResizeObserver(() => c3b && c3b.set({ zoom: geoB().z })).observe(unit);
        afb = window.Airflow2 && Airflow2(flowC, { source: () => geoB(), floor: () => flowC.clientHeight * .9, flow: 1, heat: 1, cold: true, snow: true, density: .9 });
      }
      if (!cur) { img.src = cat.img; img.alt = cat.name; }
    };
  }

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

  /* HERO copy: rotating business type + live Almaty temperature */
  const rot = $('#rot');
  if (rot) {
    const words = ['магазина', 'кафе', 'офиса', 'склада', 'автосервиса', 'бизнеса'];
    const w = rot.querySelector('.rot-w'); let i = 0;
    if (!reduce) setInterval(() => {
      i = (i + 1) % words.length; w.classList.add('out');
      setTimeout(() => { w.textContent = words[i]; w.classList.remove('out'); w.classList.add('in'); setTimeout(() => w.classList.remove('in'), 30); }, 380);
    }, 2600);
    fetch('https://api.open-meteo.com/v1/forecast?latitude=43.24&longitude=76.89&current=temperature_2m').then(r => r.json()).then(d => {
      const t = Math.round(d.current.temperature_2m); const wo = $('#wxOut'); if (wo) wo.textContent = (t > 0 ? '+' : t < 0 ? '−' : '') + Math.abs(t) + '°';
      
    }).catch(() => {});
  }

  /* hero KPIs count up once */
  const kp = $$('.kp b span[data-to]');
  if (kp.length && !reduce) {
    kp.forEach(e => e.textContent = '0');
    new IntersectionObserver((es, o) => {
      if (!es[0].isIntersecting) return; o.disconnect();
      const t0 = performance.now();
      const f = t => { const k = Math.min(1, (t - t0) / 1400), e = 1 - Math.pow(1 - k, 3); kp.forEach(x => x.textContent = Math.round(+x.dataset.to * e)); if (k < 1) requestAnimationFrame(f); };
      requestAnimationFrame(f);
    }, { threshold: .6 }).observe($('.kpis'));
  }

  /* HERO showroom */
  const model = $('#model'), flow = $('#flow');
  if (model) {
    const len = .8;
    const zf = () => Math.min(1.05, model.clientWidth * .74 / (1.651 * len * model.clientHeight));
    let zoom = zf();
    const c3 = window.Curtain3D && Curtain3D(model, { yaw: -.42, pitch: .1, heat: 1, light: 'studio', zoom, len, pointerTarget: $('#show') });
    new ResizeObserver(() => { zoom = zf(); c3 && c3.set({ zoom }); }).observe(model);
    const geo = () => {
      const H = model.clientHeight, W = model.clientWidth;
      const w = 1.651 * len * zoom * H * .9, h = .256 * zoom * H;
      const oy = model.offsetTop;
      return { x: W / 2 - w / 2, w, y: oy + H / 2 + h * .46, top: oy + H / 2 - h * .5, depth: H / 2 - h * .4 };
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
      { k: 'a', q: 'Здравствуйте! Подберём тепловую завесу за 3 ответа. Какой вход утепляем?', o: [['door', 'Одна дверь', 'door'], ['double', 'Двойные двери', 'doors'], ['gate', 'Ворота склада', 'gate'], ['many', 'Несколько входов', 'doors']] },
      { k: 'b', q: 'Какая высота проёма?', o: [[1, 'До 2,5 м', 'h1'], [2, '2,5–3,5 м', 'h2'], [3, 'Выше 3,5 м', 'h3'], [0, 'Не знаю точно', 'h2']] },
      { k: 'c', q: 'И последнее: как завеса будет греть?', o: [['e', 'От электросети', 'bolt'], ['w', 'От отопления', 'drop'], ['n', 'Без нагрева', 'fan'], ['x', 'Посоветуйте', 'check']] }
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
      box.innerHTML = (hint ? '<p class="wa-hint"><span class="wa-tap" aria-hidden="true"></span>Выберите ответ — это займёт меньше минуты</p>' : '') + `<div class="wa-opts">${list.map(([v, t, ic]) => `<button type="button" data-v="${v}"><i><svg><use href="#i-${ic}"/></svg></i><span>${t}</span></button>`).join('')}</div>`;
      if (hint && !reduce) { const hand = document.createElement('span'); hand.className = 'wa-hand'; hand.setAttribute('aria-hidden', 'true'); hand.innerHTML = '<svg viewBox="0 0 24 24"><path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V10m0-1.5a1.5 1.5 0 0 1 3 0V11m0-1a1.5 1.5 0 0 1 3 0v4.5c0 3.6-2.5 6.5-6 6.5h-.5c-2 0-3.4-.8-4.6-2.4L4.6 15a1.5 1.5 0 0 1 2.3-1.9L9 15"/></svg>'; box.querySelector('.wa-opts button').appendChild(hand); }
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
      wa.style.setProperty('--prog', Math.min(step, 3) / 3); wa.dataset.step = step;
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
    const start = () => { if (started) return; started = true; next(); setTimeout(() => { if (step === 0 && !reduce) { const o = body.querySelector('.wa-opts'); o && o.classList.add('nudge'); } }, 7000); };
    new IntersectionObserver((e, o) => { if (e[0].isIntersecting) { start(); o.disconnect(); } }, { threshold: .3 }).observe(wa);
  }

  /* decorative unit in the final CTA */
  const m3 = $('#model3');
  if (m3 && window.Curtain3D) Curtain3D(m3, { yaw: -.5, pitch: .3, heat: 1, light: 'dusk', zoom: 1.35, interactive: false });

  /* bento */
  const bento = $('#bento');
  if (bento) bento.innerHTML = TM.scenes.map((s, i) => `<a class="bx rv d${i % 3}" href="${TM.wa('Здравствуйте! Нужна завеса: ' + s.name.toLowerCase() + '. Помогите подобрать.')}" target="_blank" rel="noopener">
      <img src="${s.img}" alt="${s.name}" loading="lazy"><div class="bx-in"><span class="pick">${s.pick}</span><h3>${s.name}</h3><p>${s.text}</p></div></a>`).join('');

  /* home catalog card: product on a warm stage, real photo on hover, spec bars, two actions */
  const homeCard = p => {
    const cat = TM.categories.find(c => c.id === p.cat);
    const kw = p.kw ? Math.min(1, p.kw / 25) : 0, hgt = p.height ? (p.hKey === 'high' ? 1 : .54) : 0;
    const title = p.series ? p.code : p.name;
    return `<article class="hc" data-id="${p.id}" tabindex="0">
      <div class="hc-stage${p.series ? ' s' + p.series : ''}">
        ${p.series ? `<span class="hc-ser"><i></i>Серия ${p.series}</span>` : `<span class="hc-ser">${cat.short}</span>`}
        <img class="hc-r" src="${p.img}" alt="${p.name}" loading="lazy"${p.len ? ` style="width:${Math.round(40 + p.len * 46)}%"` : ''}>
        ${p.photo ? `<img class="hc-p" src="${p.photo}" alt="" loading="lazy"><span class="hc-ph">Фото товара</span>` : ''}
        <span class="hc-3d">${p.series ? 'Открыть 3D' : 'Подробнее'}</span>
      </div>
      <div class="hc-b">
        <h3>${title}</h3>
        <p>${p.use}</p>
        ${p.kw || p.height ? `<div class="hc-bars">${p.kw ? `<div><span>Мощность</span><b>${p.kw} кВт</b><i style="--v:${kw}"></i></div>` : ''}${p.height ? `<div><span>Проём</span><b>${p.height}</b><i style="--v:${hgt}"></i></div>` : ''}</div>` : ''}
        <div class="hc-f"><a class="btn btn-ink" href="${TM.wa('Здравствуйте! Интересует ' + p.name + '. Подскажите цену и наличие.')}" target="_blank" rel="noopener">Узнать цену</a><span class="hc-price">Цена<br>по запросу</span></div>
      </div>
    </article>`;
  };

  /* catalog preview: the same tiles as the catalog page */
  const cats = $('#cats'), ht = $('#homeTiles');
  if (cats && ht) {
    cats.innerHTML = TM.categories.slice(0, 4).map((c, i) => `<button role="tab" aria-selected="${i === 0}" data-c="${c.id}">${c.short}</button>`).join('');
    const pick = { curtains: ['КЭВ-6П2011E', 'КЭВ-12П3041E', 'КЭВ-18П3091E', 'КЭВ-24П4042E'] };
    const fill = id => {
      const all = TM.products.filter(p => p.cat === id);
      const list = pick[id] ? all.filter(p => pick[id].includes(p.id)) : all.slice(0, 4);
      ht.innerHTML = list.map(homeCard).join('');
      $('#homeMore').href = '/v2/catalog.html?c=' + id;
      const n = all.length; $('#homeCount').textContent = n > list.length ? `ещё ${n - list.length} ${n - list.length < 5 ? 'модели' : 'моделей'} в каталоге` : '';
    };
    cats.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; $$('button', cats).forEach(x => x.setAttribute('aria-selected', x === b)); fill(b.dataset.c); });
    ht.addEventListener('click', e => { if (e.target.closest('a,button')) return; const t = e.target.closest('.hc'); if (t) location.href = '/v2/catalog.html?c=' + TM.products.find(p => p.id === t.dataset.id).cat + '&open=' + encodeURIComponent(t.dataset.id); });
    ht.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.classList.contains('hc')) e.target.click(); });
    fill('curtains');
    new IntersectionObserver((e, o) => { if (e[0].isIntersecting) { ht.classList.add('in-view'); o.disconnect(); } }, { threshold: .35 }).observe(ht);
  }

  /* PEOPLE: leaders with their area of responsibility, managers with a direct "write" button,
     reviews as a slow two-row marquee; a review that thanks someone by name shows that person */
  const passes = $('#passes');
  if (passes) {
    const T = TM.team, first = n => n.split(' ')[1] || n;
    const zone = ['Условия для дилеров и крупных объектов', 'Склад, логистика и доставка по РК', 'Подбор под объект и расчёт стоимости'];
    const praised = { 2: 1, 5: 1 };
    passes.innerHTML = T.map((t, k) => {
      const lead = k < 3;
      return `<article class="pass${lead ? ' lead' : ''} rv d${k % 4}">
        <div class="pass-top"><img class="pass-logo" src="/img/logo.png" alt=""><span>${lead ? 'Руководство' : 'Отдел продаж'}</span></div>
        <div class="pass-ph"><img src="${t.img}" alt="${t.name}" loading="lazy">${praised[k] ? '<em class="pass-star"><svg><use href="#i-star"/></svg>Хвалят в 2ГИС</em>' : ''}</div>
        <div class="pass-b">
          <h3>${lead ? t.name : first(t.name)}</h3>
          <span class="pass-role">${t.role}</span>
          ${lead ? `<p class="pass-zone"><small>Отвечает за</small>${zone[k]}</p>` : `<div class="pass-tags"><span>Подбор</span><span>Счёт</span><span>Доставка</span></div>`}
        </div>
        ${lead ? '' : `<a class="pass-wa" href="${TM.wa('Здравствуйте, ' + first(t.name) + '! Нужна консультация по тепловой завесе.')}" target="_blank" rel="noopener"><svg><use href="#i-wa"/></svg>Написать ${first(t.name)}у</a>`}
      </article>`;
    }).join('');
  }
  const pd = $('#passDots'), ps = $('#passes');
  if (pd && ps) {
    const cards = [...ps.children];
    pd.innerHTML = cards.map((_, i) => `<i data-i="${i}"></i>`).join('');
    const dots = [...pd.children];
    const upd = () => { const c = ps.scrollLeft + ps.clientWidth / 2; let k = 0, best = 1e9; cards.forEach((el, i) => { const d = Math.abs(el.offsetLeft + el.offsetWidth / 2 - ps.offsetLeft - c); if (d < best) { best = d; k = i; } }); dots.forEach((d, i) => d.classList.toggle('on', i === k)); };
    ps.addEventListener('scroll', upd, { passive: true }); upd();
  }
  if ($('#marq')) {
    const T = TM.team, first = n => n.split(' ')[1] || n;
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
    // auto-scrolling carousel on native scroll: pauses on hover/touch, arrows scroll by one card, loops seamlessly
    const mq = $('#marq');
    mq.innerHTML = `<div class="rv-track" id="rvTrack">${R.map(card).join('')}${R.map(card).join('')}</div>`;
    const tr = $('#rvTrack');
    let paused = false, resume = 0, pos = 0, lastT = 0, inView = false;
    const halfW = () => tr.scrollWidth / 2;
    const hold = (ms = 4000) => { paused = true; clearTimeout(resume); resume = setTimeout(() => { paused = false; pos = tr.scrollLeft; }, ms); };
    const loop = t => {
      const dt = Math.min(50, t - (lastT || t)); lastT = t;
      if (!paused && inView && !reduce) { pos += dt * .035; if (pos >= halfW()) pos -= halfW(); tr.scrollLeft = pos; }
      requestAnimationFrame(loop);
    };
    tr.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') { paused = true; clearTimeout(resume); } });
    tr.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') { paused = false; pos = tr.scrollLeft; } });
    tr.addEventListener('touchstart', () => hold(5000), { passive: true });
    tr.addEventListener('wheel', () => hold(4000), { passive: true });
    tr.addEventListener('scroll', () => { if (paused) { if (tr.scrollLeft >= halfW()) tr.scrollLeft -= halfW(); if (tr.scrollLeft <= 0) tr.scrollLeft += halfW(); } }, { passive: true });
    const step = d => { hold(5000); const w = tr.querySelector('.rq2').offsetWidth + 16; if (d < 0 && tr.scrollLeft < w) tr.scrollLeft += halfW(); tr.scrollBy({ left: d * w, behavior: 'smooth' }); };
    $('#rvL').onclick = () => step(-1); $('#rvR').onclick = () => step(1);
    new IntersectionObserver(e => { inView = e[0].isIntersecting; }).observe(tr);
    requestAnimationFrame(loop);
  }

  /* FOOTER: the domain under an air curtain. A warm stream sweeps across (or follows the pointer):
     letters under it heat up — lift, glow and turn cream-white — while cold air and snow drift in
     from the right and are turned back by the stream. Letters away from the stream cool to frost. */
  const fd = $('#fdomain');
  if (fd) {
    const word = 'teplomash-kazakhstan.kz';
    const tx = fd.querySelector('.fd-text'), cv = fd.querySelector('.fd-air'), ctx = cv.getContext('2d');
    tx.innerHTML = [...word].map(ch => `<span>${ch}</span>` + (ch === '-' ? '<br class="fd-br">' : '')).join('');
    const spans = [...tx.children];
    let W = 0, H = 0, dpr = 1, centers = [], heat = spans.map(() => 0), vis = false, raf = 0, px = null, sx = 0, t0 = performance.now(), last = t0;
    const spr = (rgb) => { const s = 64, c = document.createElement('canvas'); c.width = c.height = s; const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, `rgba(${rgb},1)`); g.addColorStop(.4, `rgba(${rgb},.5)`); g.addColorStop(1, `rgba(${rgb},0)`); x.fillStyle = g; x.fillRect(0, 0, s, s); return c; };
    const warmS = spr('255,236,200'), coldS = spr('205,228,250');
    const jet = [], cold = [], flakes = Array.from({ length: 46 }, () => ({ x: Math.random(), y: Math.random(), v: .2 + Math.random() * .5, r: .8 + Math.random() * 1.6, ph: Math.random() * 6 }));
    const measure = () => {
      dpr = Math.min(2, devicePixelRatio || 1); W = fd.clientWidth; H = fd.clientHeight;
      cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const fr = fd.getBoundingClientRect();
      centers = spans.map(s => { const r = s.getBoundingClientRect(); return r.left - fr.left + r.width / 2; });
      if (W < 700) { /* two lines: map the second line onto the same horizontal sweep */ }
    };
    new ResizeObserver(measure).observe(fd);
    fd.addEventListener('pointermove', e => { const r = fd.getBoundingClientRect(); px = e.clientX - r.left; });
    fd.addEventListener('pointerleave', () => { px = null; });
    const frame = now => {
      raf = 0;
      const dt = Math.min(.05, (now - last) / 1000); last = now;
      const t = (now - t0) / 1000;
      const target = px != null ? px : W * (.5 + .44 * Math.sin(t * .38));
      sx += (target - sx) * (reduce ? 1 : Math.min(1, dt * 5));
      const sw = Math.max(70, W * .085);
      // letters: heat accumulates under the stream and fades slowly (thermal inertia)
      spans.forEach((s, i) => {
        const d = (centers[i] - sx) / sw, k = Math.exp(-d * d * 1.4);
        heat[i] += (k - heat[i]) * Math.min(1, dt * (k > heat[i] ? 8 : 2.2));
        const h = heat[i];
        const wob = Math.sin(t * 9 + i) * h * .6;
        s.style.transform = `translateY(${(-h * .12).toFixed(3)}em) skewX(${(Math.max(-1, Math.min(1, d)) * k * -7 + wob).toFixed(2)}deg)`;
        s.style.setProperty('--k', h.toFixed(3));
      });
      ctx.clearRect(0, 0, W, H);
      // soft heat column: elliptical glow that fades top and bottom
      ctx.save(); ctx.translate(sx, H * .35); ctx.scale(sw, H * .9);
      const rg = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
      rg.addColorStop(0, 'rgba(255,244,222,.38)'); rg.addColorStop(.5, 'rgba(255,236,200,.14)'); rg.addColorStop(1, 'rgba(255,236,200,0)');
      ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(0, 0, 1, 0, 7); ctx.fill(); ctx.restore();
      if (!reduce) {
        for (let n = 0; n < 3; n++) jet.push({ x: sx + (Math.random() - .5) * sw * .9, y: -6, vy: 3 + Math.random() * 2.2, life: 1, r: 4 + Math.random() * 5 });
        if (Math.random() < .55) cold.push({ x: W + 10, y: H * (.25 + Math.random() * .75), vx: -(1 + Math.random() * 1.2), vy: (Math.random() - .5) * .3, life: 1, r: 7 + Math.random() * 9 });
      }
      for (let i = jet.length - 1; i >= 0; i--) { const p = jet[i]; p.y += p.vy; p.vy *= .995; p.x += Math.sin(t * 4 + p.y * .05) * .3; if (p.y > H * .82) { p.x += (p.x - sx) * .03; p.life -= .05; } p.life -= .006;
        if (p.life <= 0 || p.y > H + 10) { jet.splice(i, 1); continue; }
        ctx.globalAlpha = Math.min(1, p.life) * .3; const len = p.r * (2 + p.vy * .9); ctx.drawImage(warmS, p.x - p.r, p.y - len, p.r * 2, len); }
      for (let i = cold.length - 1; i >= 0; i--) { const p = cold[i]; const dx = p.x - sx;
        if (Math.abs(dx) < sw * 1.1 && dx > 0) { p.vx += .22; p.vy += (Math.random() - .5) * .25; p.turned = true; }
        p.x += p.vx; p.y += p.vy; p.vx *= .995; p.life -= p.turned ? .012 : .002;
        if (p.life <= 0 || p.x < -30 || p.x > W + 40) { cold.splice(i, 1); continue; }
        ctx.globalAlpha = Math.min(1, p.life) * .32; const len = p.r * (2 + Math.abs(p.vx)); ctx.drawImage(coldS, p.x - len / 2, p.y - p.r * .5, len, p.r); }
      ctx.globalAlpha = 1;
      for (const f of flakes) {
        if (!reduce) { f.y += f.v / H * 2.2; f.x -= .0006 + Math.sin(t + f.ph) * .0004; const X = f.x * W; if (Math.abs(X - sx) < sw * .8) { f.x += (X > sx ? 1 : -1) * .004; f.y += .004; } if (f.y > 1.05 || f.x < -.02) { f.y = -.05; f.x = Math.random() * .6 + .4; } }
        ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.beginPath(); ctx.arc(f.x * W, f.y * H, f.r, 0, 7); ctx.fill();
      }
      if (vis && !reduce) raf = requestAnimationFrame(frame);
    };
    new IntersectionObserver(e => { vis = e[0].isIntersecting; if (vis) { measure(); last = performance.now(); if (!raf) raf = requestAnimationFrame(frame); } }).observe(fd);
    measure(); sx = W / 2; if (reduce) frame(performance.now());
  }

  const fq = $('#faqQs');
  if (fq) {
    const ic = ['<path d="M7 4h7a4 4 0 0 1 0 8H7m0-8v16M5 12h9M5 16h8"/>', '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>', '<path d="M3 7h11v9H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="17.5" r="1.6"/><circle cx="17" cy="17.5" r="1.6"/>', '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4Z"/>', '<path d="M12 3 5 6v5c0 4.4 3 8.2 7 9.5 4-1.3 7-5.1 7-9.5V6l-7-3Z"/><path d="m9 12 2 2 4-4"/>', '<path d="M8 12.5 10.5 15l5-5M4 8l4-4 4 3 4-3 4 4-8 12Z"/>'];
    const F = TM.faq;
    fq.innerHTML = F.map((f, k) => `<button role="tab" aria-selected="${k === 0}" data-k="${k}"><i><svg viewBox="0 0 24 24">${ic[k] || ic[0]}</svg></i><span>${f.q}</span></button>`).join('');
    const ans = $('#faqAns');
    const show = k => {
      $$('button', fq).forEach((b, i) => b.setAttribute('aria-selected', i === k));
      ans.classList.remove('in');
      setTimeout(() => {
        ans.innerHTML = `<span class="fa-n">Вопрос ${k + 1} из ${F.length}</span><h3>${F[k].q}</h3><p>${F[k].a}</p>
          <div class="fa-f"><img src="/img/team/malika.jpg" alt=""><span>Остались вопросы? <b>Малика</b> ответит в WhatsApp</span><a class="btn btn-ink btn-sm" href="${TM.wa('Здравствуйте, Малика! Вопрос по завесам: ')}" target="_blank" rel="noopener"><svg><use href="#i-wa"/></svg>Спросить</a></div>`;
        ans.classList.add('in');
      }, ans.innerHTML ? 160 : 0);
      const b = fq.children[k]; if (fq.scrollWidth > fq.clientWidth + 4) fq.scrollTo({ left: b.offsetLeft - 16, behavior: 'smooth' });
    };
    fq.addEventListener('click', e => { const b = e.target.closest('button'); b && show(+b.dataset.k); });
    fq.addEventListener('keydown', e => { if (!['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return; e.preventDefault(); const cur = +fq.querySelector('[aria-selected=true]').dataset.k, n = (cur + (e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : -1) + F.length) % F.length; show(n); fq.children[n].focus(); });
    show(0);
  }

  /* final form: product shelf + segmented "what we insulate" */
  const shelf = $('#shelf2');
  if (shelf) {
    const upd = () => { const v = [...shelf.querySelectorAll('[aria-pressed=true]')].map(b => b.querySelector('b').textContent.replace(/\u00AD/g, '').toLowerCase()); $('#ffPick').textContent = v.length ? 'Интересует: ' + v.join(', ') : 'Отметьте товар слева'; };
    shelf.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true'); upd(); });
    $('#fPlSeg').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; $$('#fPlSeg button').forEach(x => x.setAttribute('aria-checked', x === b)); $('#fPl').value = b.textContent; });
    upd();
  }
  const form = $('#form');
  form && form.addEventListener('submit', e => {
    e.preventDefault();
    const d = $('#fTel').value.replace(/\D/g, '');
    if (d.length < 10) { form.classList.add('bad'); $('#fTel').focus(); return; }
    form.classList.remove('bad'); form.classList.add('done');
    window.TMlead({ source: 'Форма «Подбор и цена за 15 минут»', name: $('#fName').value.trim().slice(0, 60), phone: $('#fTel').value.trim().slice(0, 24), answers: { 'Что утепляем': $('#fPl').value, 'Интересует': [...document.querySelectorAll('#shelf2 [aria-pressed=true]')].map(b => b.dataset.v).join(', ') || 'не выбрано' }, page: location.href });
  });

  watch();
})();
