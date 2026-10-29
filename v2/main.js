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
    const af = window.Airflow && Airflow(flow, { source: () => geo(), depth: () => geo().depth, mode: 1, density: 1.15, streak: .8, lw: 1.5, glow: .26, cool: [90, 150, 215], warm: [232, 140, 40], snow: true, flakes: 46, wind: 1, flakeRGB: '86,140,200', snowRegion: () => ({ x0: 0, x1: flow.clientWidth * .55 }) });
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
      c3 && c3.target({ heat: c.heat }); af && af.mode(c.flow);
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

  /* INSIDE: one screen, four tabs turn the unit */
  const m2 = $('#model2');
  if (m2) {
    const views = [
      { yaw: -.5, pitch: -.12, heat: 0, tag: 'Перфорированная панель' },
      { yaw: -.2, pitch: .38, heat: 1, tag: 'Нагреватель за соплом' },
      { yaw: .35, pitch: .3, heat: .45, tag: 'Сопло и направляющие' },
      { yaw: -1.05, pitch: -.05, heat: .15, tag: 'Торец: подключение и монтаж' }
    ];
    const z2 = () => Math.min(1.15, m2.clientWidth * .78 / (1.651 * .8 * Math.max(1, m2.clientHeight)));
    const c = window.Curtain3D && Curtain3D(m2, Object.assign({ light: 'dusk', zoom: z2(), sway: false, interactive: false }, views[0]));
    new ResizeObserver(() => c && c.set({ zoom: z2() })).observe(m2);
    const feats = $$('.feat');
    let cur = 0, auto = null;
    const pick = i => {
      cur = i; feats.forEach((f, k) => { f.classList.toggle('on', k === i); f.setAttribute('aria-selected', k === i); });
      const v = views[i]; c && c.target({ yaw: v.yaw, pitch: v.pitch, heat: v.heat }); $('#tag').textContent = v.tag;
    };
    feats.forEach((f, k) => f.addEventListener('click', () => { clearInterval(auto); auto = 'stop'; pick(k); }));
    if (!reduce) new IntersectionObserver(es => { if (es[0].isIntersecting && auto === null) auto = setInterval(() => pick((cur + 1) % 4), 4200); }, { threshold: .5 }).observe(m2);
  }

  /* QUIZ: three answers assemble the curtain on the right */
  const qz = $('#quiz');
  if (qz) {
    const Q = [
      { q: 'Какой вход утепляем?', k: 'a', o: [
        { v: 'door', i: 'door', t: 'Одна дверь', s: 'Магазин, офис, кафе' },
        { v: 'double', i: 'doors', t: 'Двойные двери', s: 'Тамбур, ТЦ, банк' },
        { v: 'gate', i: 'gate', t: 'Ворота', s: 'Склад, цех, автосервис' } ] },
      { q: 'Какая высота проёма?', k: 'b', o: [
        { v: 1, i: 'h1', t: 'До 2,5 м', s: 'Обычная дверь' },
        { v: 2, i: 'h2', t: '2,5–3,5 м', s: 'Высокий вход, витрина' },
        { v: 3, i: 'h3', t: 'Выше 3,5 м', s: 'Ворота, ангар' } ] },
      { q: 'Как завеса будет греть?', k: 'c', o: [
        { v: 'e', i: 'bolt', t: 'От электросети', s: 'Проще всего подключить' },
        { v: 'w', i: 'drop', t: 'От отопления здания', s: 'Водяная, экономит электричество' },
        { v: 'n', i: 'fan', t: 'Без нагрева', s: 'Барьер от пыли и жары летом' } ] }
    ];
    const L = { door: 'Одна дверь', double: 'Двойные двери', gate: 'Ворота', 1: 'до 2,5 м', 2: '2,5–3,5 м', 3: 'выше 3,5 м', e: 'электрический', w: 'водяной', n: 'без нагрева' };
    const ans = {}; let step = 0;
    const qm = $('#qzModel');
    const c3q = window.Curtain3D && Curtain3D(qm, { yaw: -.45, pitch: .14, heat: 0, light: 'studio', zoom: .9, len: .62, sway: false });
    const zq = len => Math.min(1.3, qm.clientWidth * .8 / (1.651 * len * Math.max(1, qm.clientHeight)));
    const live = () => {
      const len = ans.a === 'gate' ? 1.05 : ans.a === 'double' ? .8 : .62;
      c3q && c3q.target({ len, zoom: zq(len), heat: ans.c === 'e' ? 1 : ans.c === 'w' ? .65 : 0 });
      $('#sA').textContent = ans.a ? L[ans.a] : '—'; $('#sB').textContent = ans.b ? L[ans.b] : '—'; $('#sC').textContent = ans.c ? L[ans.c] : '—';
      const door = $('#qzDoor'); door.style.setProperty('--h', ans.b ? (ans.b * 28 + 18) + '%' : '30%'); door.style.setProperty('--w', len * 62 + '%'); $('#qzH').textContent = ans.b ? 'проём ' + L[ans.b] : 'высота?';
      qz.dataset.heat = ans.c || '';
    };
    const result = () => {
      const ser = ans.b === 3 || ans.a === 'gate' ? 400 : (ans.a === 'door' && ans.b === 1) ? 200 : 300;
      const code = ser === 200 ? 'КЭВ-6П2011E' : ser === 300 ? (ans.a === 'double' ? 'КЭВ-18П3041E' : 'КЭВ-12П3041E') : (ans.b === 3 ? 'КЭВ-24П4042E' : 'КЭВ-12П4050E');
      const p = TM.products.find(x => x.id === code);
      const water = ans.c === 'w';
      const msg = `Здравствуйте! Подбор за 3 ответа: ${L[ans.a].toLowerCase()}, высота ${L[ans.b]}, нагрев ${L[ans.c]}. Ориентир с сайта: серия ${ser}${water ? ' (водяная)' : ', ' + code}. Посчитайте, пожалуйста, цену.`;
      return { ser, code, p, water, msg };
    };
    const render = () => {
      const body = $('#qzBody');
      $('#qzBack').hidden = step === 0;
      $('#qzBar').style.width = (Math.min(step, 3) / 3 * 100) + '%';
      if (step < 3) {
        const q = Q[step];
        $('#qzStep').textContent = `Вопрос ${step + 1} из 3`;
        body.innerHTML = `<h3>${q.q}</h3><div class="qz-opts" role="radiogroup" aria-label="${q.q}">${q.o.map(o => `<button role="radio" aria-checked="${ans[q.k] === o.v}" data-v="${o.v}"><i><svg><use href="#i-${o.i}"/></svg></i><b>${o.t}</b><span>${o.s}</span></button>`).join('')}</div>`;
      } else {
        const r = result();
        $('#qzStep').textContent = 'Готово';
        body.innerHTML = `<div class="qz-res"><small>Подходит серия</small><h3>Серия ${r.ser}${r.water ? ' · водяная' : ''}</h3>
          <p>${r.water ? 'Водяную модель подберём под параметры вашего отопления.' : `Ориентир: <b>${r.code}</b> · ${r.p.kw} кВт.`} Точную модель и цену инженер пришлёт после короткого звонка.</p>
          <form class="qz-form" id="qzForm" novalidate><input type="tel" inputmode="tel" autocomplete="tel" placeholder="+7 ___ ___ __ __" aria-label="Телефон" id="qzTel"><button class="btn btn-heat" type="submit">Получить расчёт</button></form>
          <p class="qz-err" id="qzErr">Укажите телефон, например +7 701 123 45 67</p>
          <a class="qz-wa" href="${TM.wa(r.msg)}" target="_blank" rel="noopener"><svg><use href="#i-wa"/></svg>Или отправить ответы в WhatsApp</a>
          <div class="qz-ok" role="status"><b>Заявка принята.</b> Инженер перезвонит в течение 15 минут в рабочее время.</div></div>`;
        $('#qzForm').addEventListener('submit', e => { e.preventDefault(); const ok = $('#qzTel').value.replace(/\D/g, '').length >= 10; qz.classList.toggle('bad', !ok); if (ok) qz.classList.add('done'); else $('#qzTel').focus(); });
      }
      body.classList.remove('in'); requestAnimationFrame(() => body.classList.add('in'));
      live();
    };
    $('#qzBody').addEventListener('click', e => {
      const b = e.target.closest('.qz-opts button'); if (!b) return;
      const q = Q[step]; const v = isNaN(+b.dataset.v) ? b.dataset.v : +b.dataset.v;
      ans[q.k] = v; $$('.qz-opts button').forEach(x => x.setAttribute('aria-checked', x === b)); live();
      setTimeout(() => { step++; render(); }, 260);
    });
    $('#qzBack').addEventListener('click', () => { step = Math.max(0, step - 1); qz.classList.remove('done', 'bad'); render(); });
    new ResizeObserver(live).observe(qm);
    render();
  }

  /* decorative unit in the final CTA */
  const m3 = $('#model3');
  if (m3 && window.Curtain3D) Curtain3D(m3, { yaw: -.5, pitch: .3, heat: 1, light: 'dusk', zoom: 1.35, interactive: false });

  /* bento */
  const bento = $('#bento');
  if (bento) bento.innerHTML = TM.scenes.map((s, i) => `<a class="bx rv d${i % 3}" href="${TM.wa('Здравствуйте! Нужна завеса: ' + s.name.toLowerCase() + '. Помогите подобрать.')}" target="_blank" rel="noopener">
      <img src="${s.img}" alt="${s.name}" loading="lazy"><div class="bx-in"><span class="pick">${s.pick}</span><h3>${s.name}</h3><p>${s.text}</p></div></a>`).join('');

  /* rail */
  const cats = $('#cats'), rail = $('#rail');
  if (cats && rail) {
    cats.innerHTML = TM.categories.map((c, i) => `<button role="tab" aria-selected="${i === 0}" data-c="${c.id}">${c.short}</button>`).join('');
    const fill = id => { rail.innerHTML = TM.products.filter(p => p.cat === id).map(card).join(''); rail.scrollTo({ left: 0 }); watch(); };
    cats.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; $$('button', cats).forEach(x => x.setAttribute('aria-selected', x === b)); fill(b.dataset.c); });
    fill('curtains');
    const step = () => (rail.querySelector('.pd')?.offsetWidth || 300) + 18;
    $('#nx').onclick = () => rail.scrollBy({ left: step(), behavior: 'smooth' });
    $('#pv').onclick = () => rail.scrollBy({ left: -step(), behavior: 'smooth' });
    rail.addEventListener('click', e => { if (e.target.closest('a')) return; const c = e.target.closest('.pd'); if (c) location.href = '/v2/catalog.html?c=' + TM.products.find(p => p.id === c.dataset.id).cat + '&open=' + encodeURIComponent(c.dataset.id); });
  }

  /* PEOPLE: review carousel linked to the team */
  const crew = $('#crew');
  if (crew) {
    const keys = ['Марлен', 'Бекжан', 'Малик', 'Сұлтан|Султан', 'Елжас', 'Дамир', 'Мадияр'];
    crew.innerHTML = TM.team.map((t, k) => `<figure class="mate rv d${k % 4}" data-k="${k}"><div class="mate-ph"><img src="${t.img}" alt="${t.name}" loading="lazy"></div><figcaption><b>${t.name.split(' ')[1] || t.name}</b><span>${t.role}</span></figcaption><em class="mate-flag">В этом отзыве</em></figure>`).join('');
    const R = TM.reviews.filter(r => r.text.length < 300);
    let i = 0, t;
    const mates = $$('.mate', crew);
    const show = (k, first) => {
      i = (k + R.length) % R.length; const r = R[i];
      const put = () => {
        $('#rvText').textContent = r.text; $('#rvName').textContent = r.name; $('#rvDate').textContent = r.date;
        $('#rvIni').textContent = r.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
        $('#rvCount').textContent = (i + 1) + ' / ' + R.length;
        const hit = keys.findIndex(kk => new RegExp(kk).test(r.text));
        mates.forEach((mm, n) => mm.classList.toggle('hit', n === hit));
        if (hit >= 0 && crew.scrollWidth > crew.clientWidth + 4) crew.scrollTo({ left: mates[hit].offsetLeft - crew.offsetLeft - 18, behavior: first ? 'auto' : 'smooth' });
        const th = $('#rvThanks'); th.hidden = hit < 0;
        if (hit >= 0) { $('#rvThImg').src = TM.team[hit].img; $('#rvThName').textContent = TM.team[hit].name.split(' ')[1] + ', ' + TM.team[hit].role.toLowerCase(); }
        $('.rv-stage').classList.remove('out');
      };
      if (first) put(); else { $('.rv-stage').classList.add('out'); setTimeout(put, 260); }
      clearTimeout(t); if (!reduce) t = setTimeout(() => show(i + 1), 8000);
    };
    $('#rvNext').onclick = () => show(i + 1); $('#rvPrev').onclick = () => show(i - 1);
    show(0, true);
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
  });

  watch();
})();
