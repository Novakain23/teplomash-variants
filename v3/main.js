(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fmtT = t => (t > 0 ? '+' : t < 0 ? '−' : '') + Math.abs(t) + '°';

  const hdr = $('#hdr');
  const sc = () => hdr && hdr.classList.toggle('scrolled', scrollY > 8);
  addEventListener('scroll', sc, { passive: true }); sc();
  const burger = $('#burger');
  burger && burger.addEventListener('click', () => {
    const o = document.body.classList.toggle('menu-open');
    burger.setAttribute('aria-expanded', o); $('#sheet').setAttribute('aria-hidden', !o);
    burger.innerHTML = `<svg><use href="#i-${o ? 'x' : 'menu'}"/></svg>`;
  });
  $$('#sheet a').forEach(a => a.addEventListener('click', () => { document.body.classList.remove('menu-open'); burger.innerHTML = '<svg><use href="#i-menu"/></svg>'; }));

  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  const watch = () => $$('.rv:not(.in)').forEach(el => io.observe(el));

  fetch('https://api.open-meteo.com/v1/forecast?latitude=43.24&longitude=76.89&current=temperature_2m')
    .then(r => r.json()).then(d => { const el = $('#camOut'); if (el) el.textContent = fmtT(Math.round(d.current.temperature_2m)); }).catch(() => {});

  /* thermal palette (iron) */
  const STOPS = [[0, [11, 10, 42]], [.15, [42, 27, 120]], [.3, [106, 30, 140]], [.45, [181, 36, 111]], [.6, [224, 74, 46]], [.74, [245, 138, 27]], [.88, [252, 196, 58]], [1, [255, 243, 191]]];
  const pal = t => {
    t = Math.max(0, Math.min(1, t));
    for (let i = 1; i < STOPS.length; i++) if (t <= STOPS[i][0]) {
      const [a, ca] = STOPS[i - 1], [b, cb] = STOPS[i], k = (t - a) / (b - a);
      return [ca[0] + (cb[0] - ca[0]) * k, ca[1] + (cb[1] - ca[1]) * k, ca[2] + (cb[2] - ca[2]) * k];
    }
    return STOPS[STOPS.length - 1][1];
  };
  window.V3pal = pal;

  /* HERO thermal camera: animated haze + 3D unit + warm stream vs cold air */
  const haze = $('#haze');
  if (haze) {
    const N = 72, ctx = haze.getContext('2d'); haze.width = N; haze.height = N;
    const img = ctx.createImageData(N, N);
    const blobs = [
      { x: .5, y: .38, r: .34, t: .95, sx: .03, sy: .02, p: 0 },
      { x: .5, y: .72, r: .3, t: .72, sx: .04, sy: .03, p: 1.3 },
      { x: .12, y: .7, r: .32, t: -.6, sx: .05, sy: .04, p: 2.1 },
      { x: .9, y: .2, r: .26, t: -.35, sx: .03, sy: .05, p: 3.4 },
      { x: .82, y: .85, r: .25, t: .4, sx: .04, sy: .02, p: 4.2 }
    ];
    let last = 0;
    const draw = ts => {
      if (ts - last > 50 || reduce) {
        last = ts; const tt = ts / 1000;
        for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
          const u = x / N, v = y / N; let T = .3;
          for (const b of blobs) { const bx = b.x + Math.sin(tt * .35 + b.p) * b.sx, by = b.y + Math.cos(tt * .3 + b.p) * b.sy; const d2 = ((u - bx) ** 2 + (v - by) ** 2) / (b.r * b.r); T += b.t * Math.exp(-d2 * 1.6) * .55; }
          const c = pal(T); const i = (y * N + x) * 4; img.data[i] = c[0]; img.data[i + 1] = c[1]; img.data[i + 2] = c[2]; img.data[i + 3] = 255;
        }
        ctx.putImageData(img, 0, 0);
      }
      if (!reduce) requestAnimationFrame(draw);
    };
    requestAnimationFrame(draw);
    const unit = $('#camUnit'), flow = $('#camFlow'), cam = $('#cam');
    const len = .8;
    const zf = () => Math.min(1.25, unit.clientWidth * .74 / (1.651 * len * Math.max(1, unit.clientHeight)));
    let c3 = window.Curtain3D && Curtain3D(unit, { yaw: -.3, pitch: .24, heat: 1, light: 'dusk', zoom: zf(), len, pointerTarget: cam });
    new ResizeObserver(() => c3 && c3.set({ zoom: zf() })).observe(unit);
    const geo = () => {
      const top = unit.offsetTop, H = unit.clientHeight, W = unit.clientWidth, z = zf();
      const w = 1.651 * len * z * H * .92, h = .256 * z * H;
      return { x: W / 2 - w / 2, w, y: top + H / 2 + h * .5 };
    };
    window.Airflow && Airflow(flow, { source: geo, depth: () => flow.clientHeight - geo().y, mode: 1, snow: true, wind: 1, flakes: 60, flakeRGB: '150,190,255', warm: [255, 214, 120], density: 1, glow: .2, snowRegion: () => ({ x0: 0, x1: flow.clientWidth }) });
  }

  /* THERMAL COMPARE: two procedural thermal renders of the same photo */
  const cmp = $('#cmp');
  if (cmp) {
    const photo = new Image(); photo.src = '/img/store-inside.jpg';
    const W = 960, H = 540;
    const sm = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
    const field = (u, v, on) => {
      let T = .63 + .1 * (1 - v);
      const g = (a, b, w) => Math.exp(-(((a - b) / w) ** 2));
      T += .1 * g(u, .07, .1) * g(v, .3, .17);        // lit shelves left
      T += .07 * g(u, .9, .09) * g(v, .33, .16);       // lit shelves right
      T -= .05 * sm(.66, .9, v);                       // floor a little cooler
      const inGlass = u > .303 && u < .72 && v > .064 && v < .66;
      const inDoor = u > .39 && u < .635 && v > .18 && v < .672;
      const edge = Math.min(sm(.303, .32, u), sm(.72, .703, u), sm(.064, .08, v), sm(.66, .645, v));
      if (inGlass) T = T * (1 - edge) + (.13 + .05 * (1 - v)) * edge;
      const cu = .512;
      if (!on) {
        if (inDoor) { const e = Math.min(sm(.39, .41, u), sm(.635, .615, u)); T = T * (1 - e) + (.26 + .34 * (1 - sm(.18, .34, v))) * e; }
        if (v > .6) { const w = .1 + (v - .6) * 1.05, d = Math.abs(u - cu) / w; T -= .46 * Math.exp(-d * d * 2.2) * (1 - Math.min(1, (v - .6) / .55)) * sm(.6, .67, v); }
      } else {
        if (inDoor) { const e = Math.min(sm(.39, .41, u), sm(.635, .615, u)); const sheet = .84 - (v - .18) * .5; T = T * (1 - e * .8) + sheet * e * .8; }
        if (v > .64) { const d = Math.abs(u - cu) / .16; T -= .08 * Math.exp(-d * d * 3) * (1 - sm(.66, .8, v)); }
      }
      return T;
    };
    const render = (cv, on) => {
      const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
      x.drawImage(photo, 0, 0, W, H); const d = x.getImageData(0, 0, W, H), p = d.data;
      for (let y = 0; y < H; y++) for (let xx = 0; xx < W; xx++) {
        const i = (y * W + xx) * 4, L = (p[i] * .299 + p[i + 1] * .587 + p[i + 2] * .114) / 255;
        const T = field(xx / W, y / H, on) + (L - .5) * .16 + (Math.random() - .5) * .02;
        const col = pal(T), k = .64 + .52 * L;
        p[i] = Math.min(255, col[0] * k); p[i + 1] = Math.min(255, col[1] * k); p[i + 2] = Math.min(255, col[2] * k);
      }
      x.putImageData(d, 0, 0);
      cv.width = W; cv.height = H; cv.getContext('2d').drawImage(c, 0, 0);
    };
    photo.onload = () => { render($('#thA'), false); render($('#thB'), true); placeUnit(); };
    // curtain above the doorway in the "after" view (thermal tint on the unit)
    const unit = $('#cmpUnit');
    let c3 = null;
    const placeUnit = () => {
      const r = cmp.getBoundingClientRect(), s = Math.max(r.width / 1536, r.height / 864);
      const ox = (r.width - 1536 * s) / 2, oy = (r.height - 864 * s) / 2;
      const T = (975 - 600) * s * 1.06, Wc = T * 1.34, Hc = T * .52;
      const cx = ox + 787 * s, cy = oy + 150 * s;
      Object.assign(unit.style, { left: (cx - Wc / 2) + 'px', top: (cy - Hc / 2) + 'px', width: Wc + 'px', height: Hc + 'px', filter: 'sepia(1) saturate(5) hue-rotate(-12deg) brightness(1.02)' });
      if (!c3 && window.Curtain3D) c3 = Curtain3D(unit, { yaw: 0, pitch: .14, heat: 1, light: 'warm', zoom: 1 / (1.32 * .52), sway: false, interactive: false });
    };
    new ResizeObserver(() => photo.complete && placeUnit()).observe(cmp);
    // slider
    const knob = $('#knob');
    const set = pct => { pct = Math.max(2, Math.min(98, pct)); cmp.style.setProperty('--x', pct + '%'); knob.setAttribute('aria-valuenow', Math.round(pct)); };
    let drag = false;
    const pos = e => { const r = cmp.getBoundingClientRect(); set((e.clientX - r.left) / r.width * 100); };
    cmp.addEventListener('pointerdown', e => { drag = true; cmp.setPointerCapture(e.pointerId); pos(e); });
    cmp.addEventListener('pointermove', e => drag && pos(e));
    cmp.addEventListener('pointerup', () => drag = false);
    knob.addEventListener('keydown', e => { const v = +knob.getAttribute('aria-valuenow'); if (e.key === 'ArrowLeft') set(v - 5); if (e.key === 'ArrowRight') set(v + 5); });
    // a gentle hint the first time the slider comes into view
    const hint = new IntersectionObserver(es => {
      if (!es[0].isIntersecting || reduce) return; hint.disconnect();
      let t0 = null; const run = ts => { t0 = t0 || ts; const k = (ts - t0) / 1600; if (k < 1 && !drag) { set(50 + Math.sin(k * Math.PI * 2) * 14); requestAnimationFrame(run); } else if (!drag) set(50); };
      requestAnimationFrame(run);
    }, { threshold: .6 });
    hint.observe(cmp);
  }

  /* scenarios */
  const scn = $('#scn');
  if (scn) scn.innerHTML = TM.scenes.map((s, i) => `<a class="sc rv d${i % 3}" href="${TM.wa('Здравствуйте! Нужна завеса: ' + s.name.toLowerCase() + '. Помогите подобрать.')}" target="_blank" rel="noopener"><img src="${s.img}" alt="${s.name}" loading="lazy"><div class="sc-in"><span class="pick">${s.pick}</span><h3>${s.name}</h3><p>${s.text}</p></div></a>`).join('');

  /* request list shared by home and catalog */
  const list = new Map();
  const rq = $('#rq');
  const plural = n => n % 10 === 1 && n % 100 !== 11 ? 'модель' : (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) ? 'модели' : 'моделей';
  const sync = () => {
    if (!rq) return;
    const n = list.size; rq.classList.toggle('show', n > 0);
    $('#rqN').textContent = n + ' ' + plural(n);
    $('#rqSend').href = TM.wa('Здравствуйте! Прошу цену и наличие:\n' + [...list.values()].map(p => '• ' + p.name + ' — 1 шт').join('\n'));
    $$('.add').forEach(b => { const on = list.has(b.dataset.id); if (b.getAttribute('aria-pressed') !== String(on) || !b.dataset.r) { b.setAttribute('aria-pressed', on); b.dataset.r = 1; b.innerHTML = `<svg><use href="#i-${on ? 'check' : 'plus'}"/></svg>`; b.setAttribute('aria-label', on ? 'Убрать из листа запроса' : 'Добавить в лист запроса'); } });
  };
  document.addEventListener('click', e => {
    const b = e.target.closest('.add'); if (!b) return;
    const p = TM.products.find(x => x.id === b.dataset.id);
    list.has(p.id) ? list.delete(p.id) : list.set(p.id, p); sync();
  });
  window.V3sync = sync;

  const card = p => `<article class="pc rv">
      <div class="pc-img">${p.kw ? `<span class="kw">${p.kw} кВт</span>` : ''}<img src="${p.img}" alt="${p.name}" loading="lazy"></div>
      <h3>${p.name}</h3>
      <ul>${p.series ? `<li>Серия<b>${p.series}</b></li>` : ''}${p.height ? `<li>Высота проёма<b>${p.height}</b></li>` : ''}${p.heat ? `<li>Нагрев<b>${p.heat}</b></li>` : ''}<li>Подходит<b>${p.use}</b></li></ul>
      <div class="pc-f"><a class="btn btn-ink" href="${TM.wa('Здравствуйте! Интересует ' + p.name + '. Подскажите цену и наличие.')}" target="_blank" rel="noopener">Узнать цену</a><button class="add" data-id="${p.id}" aria-pressed="false" aria-label="Добавить в лист запроса"><svg><use href="#i-plus"/></svg></button></div>
    </article>`;
  window.V3card = card;

  const chips = $('#chips'), pg = $('#pgrid');
  if (chips && pg) {
    chips.innerHTML = TM.categories.slice(0, 4).map((c, i) => `<button class="chipb" role="tab" aria-selected="${i === 0}" data-c="${c.id}">${c.short}</button>`).join('');
    const pop = { curtains: ['КЭВ-12П3041E', 'КЭВ-18П3041E', 'КЭВ-24П4042E'] };
    const fill = id => { const arr = TM.products.filter(p => p.cat === id); pg.innerHTML = (pop[id] ? arr.filter(p => pop[id].includes(p.id)) : arr.slice(0, 3)).map(card).join(''); sync(); watch(); };
    chips.addEventListener('click', e => { const b = e.target.closest('.chipb'); if (!b) return; $$('.chipb', chips).forEach(x => x.setAttribute('aria-selected', x === b)); fill(b.dataset.c); });
    fill('curtains');
  }

  const star = '<svg><use href="#i-star"/></svg>';
  const revs = $('#revs');
  if (revs) revs.innerHTML = TM.reviews.slice(0, 7).map((r, i) => `<figure class="rcard rv d${i % 3}"><div class="top"><span class="stars">${star.repeat(5)}</span><span class="src">2ГИС</span></div><p>${r.text}</p><figcaption class="who"><b>${r.name}</b>, ${r.date}</figcaption></figure>`).join('');
  const team = $('#team');
  if (team) team.innerHTML = TM.team.map(m => `<div class="tm"><img src="${m.img}" alt="${m.name}" loading="lazy"><b>${m.name}</b><span>${m.role}</span></div>`).join('');

  const faq = $('#faq');
  if (faq) {
    faq.innerHTML = TM.faq.map((f, k) => `<div class="qa${k === 0 ? ' open' : ''}"><button aria-expanded="${k === 0}" aria-controls="f${k}">${f.q}<span class="ar" aria-hidden="true"><svg><use href="#i-down"/></svg></span></button><div class="ans" id="f${k}" role="region"><div><p>${f.a}</p></div></div></div>`).join('');
    faq.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; const it = b.parentElement, o = !it.classList.contains('open'); it.classList.toggle('open', o); b.setAttribute('aria-expanded', o); });
  }

  const form = $('#form');
  form && form.addEventListener('submit', e => {
    e.preventDefault();
    if ($('#fT').value.replace(/\D/g, '').length < 10) { form.classList.add('bad'); $('#fT').focus(); return; }
    form.classList.remove('bad'); form.classList.add('done');
  });

  watch();
})();
