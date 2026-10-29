(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fmtT = t => (t > 0 ? '+' : t < 0 ? '−' : '') + Math.abs(t) + '°';

  /* header + menu */
  const hdr = $('#hdr');
  const onScroll = () => hdr.classList.toggle('scrolled', scrollY > 24 || document.body.classList.contains('solid'));
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  const burger = $('#burger');
  burger && burger.addEventListener('click', () => {
    const open = document.body.classList.toggle('menu-open');
    burger.setAttribute('aria-expanded', open); $('#sheet').setAttribute('aria-hidden', !open);
  });
  $$('#sheet a').forEach(a => a.addEventListener('click', () => { document.body.classList.remove('menu-open'); burger.setAttribute('aria-expanded', false); }));

  /* reveal on scroll */
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  const watch = () => $$('.rv:not(.in)').forEach(el => io.observe(el));

  /* live outdoor temperature in Almaty */
  fetch('https://api.open-meteo.com/v1/forecast?latitude=43.24&longitude=76.89&current=temperature_2m')
    .then(r => r.json()).then(d => { const t = Math.round(d.current.temperature_2m); $$('#tOut,#dOut').forEach(el => el.textContent = fmtT(t)); })
    .catch(() => {});

  /* HERO: 3D curtain mounted above the photographed door + warm stream */
  const hero = $('#hero'), img = $('#heroImg');
  if (hero && img) {
    const N = { w: 1536, h: 864, doorL: 948, doorR: 1284, doorT: 156, doorB: 742 };
    const map = () => {
      const hr = hero.getBoundingClientRect(), r = img.getBoundingClientRect();
      const mobile = innerWidth <= 860;
      const px = mobile ? .9 : .68, py = .5;
      const s = Math.max(r.width / N.w, r.height / N.h);
      const ox = r.left - hr.left + (r.width - N.w * s) * px, oy = r.top - hr.top + (r.height - N.h * s) * py;
      return { s, X: x => ox + x * s, Y: y => oy + y * s };
    };
    const unit = $('#unit'), air = $('#air');
    let geo;
    const place = () => {
      const m = map();
      const T = (N.doorR - N.doorL) * m.s * 1.02;          // curtain as wide as the door
      const W = T * 1.34, H = T * .52;
      const cx = m.X((N.doorL + N.doorR) / 2), objH = T * .2;
      const cy = m.Y(N.doorT) - objH / 2 - 4 * m.s;
      Object.assign(unit.style, { width: W + 'px', height: H + 'px', left: (cx - W / 2) + 'px', top: (cy - H / 2) + 'px' });
      geo = { x: m.X(N.doorL + 16), w: (N.doorR - N.doorL - 32) * m.s, y: cy + objH * .42, depth: m.Y(N.doorB) - (cy + objH * .42), snowX0: m.X(N.doorL - 260) };
      if (c3) c3.set({ zoom: 1 / (1.32 * .52) });
    };
    let c3 = null;
    place();
    c3 = window.Curtain3D && Curtain3D(unit, { yaw: -.1, pitch: .2, heat: .55, light: 'dusk', zoom: 1 / (1.32 * .52), pointerTarget: hero, sway: false, len: .8 });
    place();
    new ResizeObserver(place).observe(hero);
    window.Airflow && Airflow(air, { source: () => ({ x: geo.x, y: geo.y, w: geo.w }), depth: () => geo.depth, mode: 1, snow: true, wind: -1, flakes: 70, density: .9, snowRegion: () => ({ x0: geo.snowX0, x1: air.clientWidth }) });
  }

  /* HOW IT WORKS: the same curtain mounted inside a real shop doorway; switch it off and the cold creeps in */
  const demo = $('#demo');
  if (demo) {
    const dImg = $('#demoImg'), dUnit = $('#demoUnit'), dAir = $('#demoAir');
    const D = { w: 1536, h: 864, L: 604, R: 972, T: 150, B: 572 };
    let g = { x: 0, y: 0, w: 0, depth: 0 }, u3 = null;
    const placeD = () => {
      const r = demo.getBoundingClientRect(); if (!r.width) return;
      const s = Math.max(r.width / D.w, r.height / D.h);
      const ox = (r.width - D.w * s) * .5, oy = (r.height - D.h * s) * .5;
      const X = x => ox + x * s, Y = y => oy + y * s;
      const T = (D.R - D.L) * s * .96, W = T * 1.34, H = T * .52, objH = T * .2;
      const cx = X((D.L + D.R) / 2), cy = Y(D.T) - objH / 2 + 2;
      Object.assign(dUnit.style, { width: W + 'px', height: H + 'px', left: (cx - W / 2) + 'px', top: (cy - H / 2) + 'px' });
      g = { x: X(D.L + 22), w: (D.R - D.L - 44) * s, y: cy + objH * .42, depth: Y(D.B) - (cy + objH * .42) };
    };
    placeD(); new ResizeObserver(placeD).observe(demo);
    let started = false;
    const start = () => {
      if (started) return; started = true;
      u3 = window.Curtain3D && Curtain3D(dUnit, { yaw: .12, pitch: .16, heat: .6, light: 'warm', zoom: 1 / (1.32 * .52), sway: false, len: .8 });
      fl = window.Airflow && Airflow(dAir, { source: () => g, depth: () => g.depth, mode: 1, snow: false, density: 1, glow: .3, streak: .85, lw: 1.4 });
    };
    let fl = null;
    new IntersectionObserver((e, o) => { if (e[0].isIntersecting) { start(); o.disconnect(); } }, { rootMargin: '200px' }).observe(demo);
    let on = true;
    const sw = $('#sw');
    sw.addEventListener('click', () => {
      on = !on; sw.setAttribute('aria-checked', on); demo.classList.toggle('off', !on);
      $('#swLab').textContent = on ? 'Завеса работает' : 'Завеса выключена';
      $('#dNote').textContent = on ? 'Холод остаётся за порогом' : 'Холод идёт по полу к кассе';
      $('#dIn').textContent = on ? '+21°' : '+12°'; $('#dIn').style.color = on ? '' : '#CFE2F5';
      fl && fl.mode(on ? 1 : 0); u3 && u3.target({ heat: on ? .6 : 0 });
    });
  }

  /* DOORWAY CALCULATOR */
  const cW = $('#cW');
  if (cW) {
    const cH = $('#cH'), fmt = v => String(Math.round(v * 10) / 10).replace('.', ',') + ' м';
    let place = 'магазин';
    const upd = () => {
      const w = +cW.value, h = +cH.value;
      [cW, cH].forEach(i => i.style.setProperty('--v', ((i.value - i.min) / (i.max - i.min) * 100) + '%'));
      $('#oW').textContent = $('#dimW').textContent = fmt(w);
      $('#oH').textContent = $('#dimH').textContent = fmt(h);
      const store = place === 'склад или цех';
      const ser = h > 3.5 || (store && h > 3) ? 400 : (w <= 1 && h <= 2.5 && (place === 'магазин' || place === 'офис или ТЦ')) ? 200 : 300;
      const high = ser === 400, n = Math.max(1, Math.ceil(w / (ser === 200 ? 1 : 2))), uw = w / n;
      const code = ser === 200 ? 'КЭВ-6П2011E' : ser === 300 ? (place === 'кафе' ? (uw <= 1.2 ? 'КЭВ-12П3091E' : 'КЭВ-18П3091E') : (uw <= 1.2 ? 'КЭВ-12П3041E' : 'КЭВ-18П3041E')) : (h <= 4.5 && uw <= 1.2 ? 'КЭВ-12П4050E' : 'КЭВ-24П4042E');
      const prod = TM.products.find(p => p.id === code);
      $('#rS').textContent = ser;
      $('#rSn').textContent = high ? 'проёмы до 6,5 м' : ser === 200 ? 'одна стандартная дверь' : 'проёмы до 3,5 м';
      $('#rM').innerHTML = `Ориентир: <b>${code}</b> · ${prod.kw} кВт${n > 1 ? ' × ' + n : ''}. Точную модель инженер подтвердит после расчёта.`;
      $('#rN').textContent = n;
      $('#rNn').textContent = n === 1 ? 'перекрывает ' + fmt(w) : 'в ряд на ' + fmt(w);
      // door drawing: scale so that 4 m x 6.5 m fills the box
      const box = $('#doorVis').getBoundingClientRect(), maxW = box.width - 120, maxH = box.height - (box.height < 260 ? 66 : 96);
      const k = Math.min(maxW / (w + .4), maxH / Math.max(h + .3, 3));
      const op = $('#dOpen'); op.style.width = (w * k) + 'px'; op.style.height = (h * k) + 'px';
      const dh = $('#dimH'); dh.style.left = Math.max(8, box.width / 2 + 8 - w * k / 2 - 62) + 'px'; dh.style.top = (box.height - 22 - h * k / 2 - 12) + 'px';
      $('.door-man').style.height = (1.75 * k) + 'px';
      const imgs = '/img/c' + ser + '.png';
      const un = $('#dUnits'); if (un.children.length !== n || un.dataset.s !== imgs) { un.dataset.s = imgs; un.innerHTML = Array.from({ length: n }, () => `<img src="${imgs}" alt="">`).join(''); }
      $('#cSend').href = TM.wa(`Здравствуйте! Нужна завеса: ${place}, проём ${fmt(w)} × ${fmt(h)}. Ориентир с сайта: ${code}, ${n} шт. Посчитайте, пожалуйста, модель и цену.`);
    };
    [cW, cH].forEach(i => i.addEventListener('input', upd));
    $('#cP').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; $$('#cP button').forEach(x => x.setAttribute('aria-checked', x === b)); place = b.dataset.v; upd(); });
    new ResizeObserver(upd).observe($('#doorVis'));
    upd();
  }

  /* SOLUTIONS accordion */
  const sol = $('#sol');
  if (sol) {
    const scenes = TM.scenes.map(x => x.id === 'shop' ? Object.assign({}, x, { img: '/img/shop-front.jpg' }) : x);
    sol.innerHTML = scenes.map((s, i) => `
      <article class="sol-card${i === 0 ? ' on' : ''}" tabindex="0" aria-label="${s.name}">
        <img src="${s.img}" alt="${s.name}" loading="lazy">
        <div class="sol-body"><h3>${s.name}</h3>
          <div class="sol-more"><div><p>${s.text}</p><span class="sol-pick">Обычно ставим: ${s.pick}</span><br>
          <a class="btn btn-gold btn-sm" href="${TM.wa('Здравствуйте! Нужна тепловая завеса: ' + s.name.toLowerCase() + '. Помогите подобрать.')}" target="_blank" rel="noopener">Подобрать для этого входа</a></div></div>
        </div>
      </article>`).join('');
    const cards = $$('.sol-card', sol);
    const act = c => cards.forEach(x => x.classList.toggle('on', x === c));
    cards.forEach(c => { c.addEventListener('mouseenter', () => innerWidth > 860 && act(c)); c.addEventListener('focus', () => act(c)); c.addEventListener('click', () => act(c)); });
  }

  /* CATALOG preview */
  const card = p => {
    const chips = [p.kw && p.kw + ' кВт', p.heat && p.heat.toLowerCase()].filter(Boolean).map(c => `<span class="chip">${c}</span>`).join('');
    return `<article class="pc rv">
      <div class="pc-img${p.series ? ' s' + p.series : ''}">${p.series ? `<span class="pc-tag">Серия ${p.series}<i>${p.height}</i></span>` : ''}<img src="${p.img}" alt="${p.name}" loading="lazy"${p.len ? ` style="width:${Math.round(30 + p.len * 55)}%"` : ''}>${p.photo ? `<img class="pc-ph" src="${p.photo}" alt="" loading="lazy">` : ''}</div>
      <div class="pc-body"><h3>${p.name}</h3><div class="chips">${chips}</div><p class="pc-use">${p.use}</p>
      <div class="pc-foot"><span class="pc-price">Цена по запросу</span><a class="btn btn-ink" href="${TM.wa('Здравствуйте! Интересует ' + p.name + '. Подскажите цену и наличие.')}" target="_blank" rel="noopener">Узнать цену</a></div></div>
    </article>`;
  };
  window.V1card = card;
  const tabs = $('#catTabs'), grid = $('#catGrid');
  if (tabs && grid) {
    tabs.innerHTML = TM.categories.map((c, i) => `<button class="tab" role="tab" aria-selected="${i === 0}" data-c="${c.id}">${c.short}</button>`).join('');
    const show = id => { grid.innerHTML = TM.products.filter(p => p.cat === id).slice(0, 4).map(card).join(''); watch(); };
    tabs.addEventListener('click', e => { const b = e.target.closest('.tab'); if (!b) return; $$('.tab', tabs).forEach(t => t.setAttribute('aria-selected', t === b)); show(b.dataset.c); });
    show('curtains');
  }

  /* steps progress line */
  const steps = $('#steps');
  if (steps) new IntersectionObserver((e, o) => { if (e[0].isIntersecting) { steps.style.setProperty('--p', 1); steps.classList.add('in'); o.disconnect(); } }, { threshold: .4 }).observe(steps);

  /* team, reviews, faq */
  const team = $('#team');
  if (team) team.innerHTML = TM.team.map((m, i) => `<div class="tm rv d${i % 4}"><div class="tm-ph"><img src="${m.img}" alt="${m.name}" loading="lazy"></div><div><b>${m.name}</b><span>${m.role}</span></div></div>`).join('');
  const star = '<svg><use href="#i-star"/></svg>';
  const track = $('#revTrack');
  if (track) {
    track.innerHTML = TM.reviews.map(r => `<figure class="rv-card"><span class="stars">${star.repeat(5)}</span><p>${r.text}</p><figcaption class="rv-who"><i>${r.name[0]}</i><div><b>${r.name}</b><span>${r.date}, 2ГИС</span></div></figcaption></figure>`).join('');
    const step = () => track.querySelector('.rv-card').offsetWidth + 20;
    $('#rNext').onclick = () => track.scrollBy({ left: step(), behavior: 'smooth' });
    $('#rPrev').onclick = () => track.scrollBy({ left: -step(), behavior: 'smooth' });
    let down = false, sx = 0, sl = 0;
    track.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') return; down = true; sx = e.clientX; sl = track.scrollLeft; track.style.scrollSnapType = 'none'; });
    addEventListener('pointerup', () => { if (down) { down = false; track.style.scrollSnapType = ''; } });
    track.addEventListener('pointermove', e => { if (down) track.scrollLeft = sl - (e.clientX - sx); });
  }
  const faq = $('#faq');
  if (faq) {
    faq.innerHTML = TM.faq.map((f, i) => `<div class="qa${i === 0 ? ' open' : ''}"><button aria-expanded="${i === 0}" aria-controls="qa${i}">${f.q}<span class="pm" aria-hidden="true"></span></button><div class="ans" id="qa${i}" role="region"><div><p>${f.a}</p></div></div></div>`).join('');
    faq.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; const q = b.parentElement, open = !q.classList.contains('open'); q.classList.toggle('open', open); b.setAttribute('aria-expanded', open); });
  }

  /* lead form */
  const form = $('#form');
  if (form) form.addEventListener('submit', e => {
    e.preventDefault();
    const tel = $('#fTel'); const digits = tel.value.replace(/\D/g, '');
    if (digits.length < 10) { tel.focus(); tel.style.borderColor = '#E7843A'; tel.nextElementSibling.textContent = 'Укажите телефон, например +7 701 123 45 67'; return; }
    form.classList.add('done');
  });

  watch();
})();
