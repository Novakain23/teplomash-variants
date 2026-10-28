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
      <div class="pd-img"><img src="${p.img}" alt="${p.name}" loading="lazy"></div>
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
    const af = window.Airflow && Airflow(flow, { source: () => geo(), depth: () => geo().depth, mode: 1, snow: false, density: .8, streak: .38, lw: 1, glow: .1 });
    const caps = [
      'Завеса выключена: при открытой двери холод свободно заходит внутрь.',
      '<b>Вентиляция.</b> Летом держит прохладу кондиционера, пыль и насекомых снаружи.',
      '<b>Обогрев 50%.</b> Экономичный режим для межсезонья и лёгкого мороза.',
      '<b>Обогрев 100%.</b> Для зимы: тёплый барьер на всю высоту проёма.'
    ];
    const conf = [{ heat: 0, flow: 0, tint: 0 }, { heat: 0, flow: .5, tint: -.8 }, { heat: .45, flow: .78, tint: .5 }, { heat: 1, flow: 1, tint: 1 }];
    const seg = $('#seg'), knob = $('#knob'), show = $('#show');
    const setMode = (m, first) => {
      $$('button', seg).forEach(b => b.setAttribute('aria-checked', +b.dataset.m === m));
      const b = seg.querySelector(`[data-m="${m}"]`);
      knob.style.left = b.offsetLeft + 'px'; knob.style.width = b.offsetWidth + 'px';
      knob.style.backgroundColor = m === 0 ? '#121417' : m === 1 ? '#3D6F9C' : '#C94F0C';
      const c = conf[m];
      c3 && c3.target({ heat: c.heat }); af && af.mode(c.flow);
      show.style.setProperty('--tint', c.tint);
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
    requestAnimationFrame(() => setMode(3, true));
    addEventListener('resize', () => setMode(+seg.querySelector('[aria-checked=true]').dataset.m, true));
    // drag to turn the unit
    let drag = false, sx = 0, sy = 0, by = -.42, bp = .1;
    model.addEventListener('pointerdown', e => { drag = true; sx = e.clientX; sy = e.clientY; model.setPointerCapture(e.pointerId); model.style.cursor = 'grabbing'; });
    model.addEventListener('pointermove', e => { if (!drag || !c3) return; c3.target({ yaw: by + (e.clientX - sx) / 260, pitch: Math.max(-.5, Math.min(.6, bp + (e.clientY - sy) / 400)) }); });
    model.addEventListener('pointerup', e => { if (!drag) return; drag = false; model.style.cursor = ''; by += (e.clientX - sx) / 260; bp = Math.max(-.5, Math.min(.6, bp + (e.clientY - sy) / 400)); });
  }

  /* INSIDE: sticky model turns as features scroll by */
  const m2 = $('#model2');
  if (m2) {
    const views = [
      { yaw: -.5, pitch: -.16, heat: 0, tag: 'Перфорированная панель' },
      { yaw: .3, pitch: .32, heat: 1, tag: 'Нагреватель внутри корпуса' },
      { yaw: 0, pitch: .62, heat: .55, tag: 'Сопло и направляющие' },
      { yaw: -1.05, pitch: -.05, heat: .15, tag: 'Управление и монтаж' }
    ];
    const c = window.Curtain3D && Curtain3D(m2, Object.assign({ light: 'studio', zoom: innerWidth < 860 ? 1.5 : 1.25, sway: false, interactive: false }, views[0]));
    const feats = $$('.feat');
    const fo = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      const i = +e.target.dataset.i; feats.forEach(f => f.classList.toggle('on', f === e.target));
      const v = views[i]; c && c.target({ yaw: v.yaw, pitch: v.pitch, heat: v.heat }); $('#tag').textContent = v.tag;
    }), { rootMargin: '-45% 0px -45% 0px' });
    feats.forEach(f => fo.observe(f));
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
  const q = $('#q');
  if (q) {
    const R = TM.reviews.filter(r => r.text.length < 190 && r.name !== 'Алмат Акжигитов');
    let i = 0, t;
    const dots = $('#dots');
    dots.innerHTML = R.map((_, k) => `<button aria-label="Отзыв ${k + 1}" aria-current="${k === 0}"></button>`).join('');
    const go = (k, first) => {
      i = (k + R.length) % R.length;
      const put = () => { q.textContent = '«' + R[i].text + '»'; $('#qn').textContent = R[i].name; $('#qd').textContent = R[i].date + ', отзыв в 2ГИС'; q.classList.remove('out'); };
      if (first) put(); else { q.classList.add('out'); setTimeout(put, 320); }
      $$('button', dots).forEach((d, k2) => d.setAttribute('aria-current', k2 === i));
      clearTimeout(t); if (!reduce) t = setTimeout(() => go(i + 1), 6500);
    };
    dots.addEventListener('click', e => { const b = e.target.closest('button'); b && go([...dots.children].indexOf(b)); });
    go(0, true);
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
