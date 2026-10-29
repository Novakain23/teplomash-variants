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
    const c = window.Curtain3D && Curtain3D(m2, Object.assign({ light: 'studio', zoom: z2(), sway: false, interactive: false }, views[0]));
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

  /* SERIES picker by type of entrance */
  const ps = $('#pickSeg');
  if (ps) {
    const n = s => TM.products.filter(p => p.series === s).length;
    const S = [
      { s: 200, img: '/img/c200.png', for: 'Бутики, офисные двери', kw: '6–9 кВт', h: 'до 3,5 м', hk: 'low', txt: 'Компактная завеса для одной стандартной двери: небольшой бутик, офис, служебный вход.' },
      { s: 300, img: '/img/c300.png', for: 'Магазины, кафе, банки', kw: '9–24 кВт', h: 'до 3,5 м', hk: 'low', txt: 'Самая ходовая серия для торговых входов: ставится над стандартной дверью и держит тепло у кассы.' },
      { s: 400, img: '/img/c400.png', for: 'Склады, ворота, цеха', kw: '12–27 кВт', h: 'до 6,5 м', hk: 'high', txt: 'Для ворот и высоких проёмов. На широкие ворота ставят несколько завес в ряд.' }
    ];
    const img = $('#pkImg');
    const set = i => {
      const d = S[i];
      $$('button', ps).forEach((b, k) => b.setAttribute('aria-checked', k === i));
      img.classList.add('out');
      setTimeout(() => { img.src = d.img; img.alt = 'Тепловая завеса серии ' + d.s; img.classList.remove('out'); }, 220);
      $('#pkFor').textContent = d.for; $('#pkName').textContent = 'Серия ' + d.s; $('#pkKw').textContent = d.kw;
      $('#pkHt').textContent = $('#pkH').textContent = d.h; $('#pkN').textContent = n(d.s); $('#pkTxt').textContent = d.txt;
      $('#pkWa').href = TM.wa('Здравствуйте! Смотрю завесы серии ' + d.s + ' (' + d.for.toLowerCase() + '). Помогите подобрать мощность под мой вход.');
      $('#pkCat').href = '/v2/catalog.html?c=curtains&h=' + d.hk;
      $('.picker').dataset.s = i;
    };
    ps.addEventListener('click', e => { const b = e.target.closest('button'); b && set(+b.dataset.s); });
    set(1);
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

  /* people + quotes */
  const faces = $('#faces');
  if (faces) faces.innerHTML = TM.team.map((m, i) => `<div class="face rv d${i % 4}"><img src="${m.img}" alt="${m.name}" loading="lazy"><b>${m.name.split(' ')[1] || m.name}</b><span>${m.role}</span></div>`).join('');
  const revs = $('#revs');
  if (revs) {
    const R = TM.reviews.filter(r => r.text.length < 260).slice(0, 3);
    const star = '<svg><use href="#i-star"/></svg>';
    revs.innerHTML = R.map((r, k) => `<figure class="rc rv d${k}"><span class="stars">${star.repeat(5)}</span><blockquote>«${r.text}»</blockquote><figcaption><b>${r.name}</b><span>${r.date}, отзыв в 2ГИС</span></figcaption></figure>`).join('');
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
