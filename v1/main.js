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
      const px = mobile ? .72 : .68, py = .5;
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

  /* HOW IT WORKS: side view of a doorway with and without the curtain */
  const cv = $('#demoCv');
  if (cv) {
    const ctx = cv.getContext('2d');
    let W, H, on = true, k = 1, parts = [], vis = true;
    const size = () => { const d = Math.min(2, devicePixelRatio || 1); W = cv.clientWidth; H = cv.clientHeight; cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0); };
    size(); new ResizeObserver(size).observe(cv);
    const spawn = (cold) => cold
      ? { c: 1, x: Math.random() * W * .45, y: H * (.3 + Math.random() * .52), vx: .5 + Math.random() * .7, vy: 0, a: 0 }
      : { c: 0, x: W * (.55 + Math.random() * .45), y: H * (.2 + Math.random() * .6), vx: -(.2 + Math.random() * .5), vy: (Math.random() - .5) * .2, a: 0 };
    for (let i = 0; i < 90; i++) parts.push(spawn(i % 2 === 0));
    const jet = Array.from({ length: 40 }, () => ({ t: Math.random(), u: Math.random() }));
    function draw() {
      k += ((on ? 1 : 0) - k) * .06;
      ctx.clearRect(0, 0, W, H);
      const dx = W * .5, top = H * .17, floor = H * .84;
      // wall with doorway
      ctx.fillStyle = '#CDBFAE'; ctx.fillRect(dx - 12, 0, 24, top);
      ctx.fillStyle = '#B9A994'; ctx.fillRect(0, floor, W, H - floor);
      // curtain unit
      ctx.fillStyle = '#fff'; ctx.strokeStyle = 'rgba(29,24,20,.15)';
      ctx.beginPath(); ctx.roundRect(dx + 12, top - 4, 46, 26, 8); ctx.fill(); ctx.stroke();
      // jet
      if (k > .02) {
        const g = ctx.createLinearGradient(0, top + 22, 0, floor);
        g.addColorStop(0, `rgba(231,132,58,${.32 * k})`); g.addColorStop(1, `rgba(231,132,58,0)`);
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(dx + 14, top + 22); ctx.lineTo(dx + 56, top + 22); ctx.lineTo(dx + 40, floor); ctx.lineTo(dx - 4, floor); ctx.fill();
        ctx.strokeStyle = `rgba(231,132,58,${.55 * k})`; ctx.lineWidth = 1.4; ctx.lineCap = 'round';
        for (const j of jet) { if (!reduce) j.t = (j.t + .012) % 1; const x = dx + 16 + j.u * 36 - j.t * 14, y = top + 24 + j.t * (floor - top - 24); ctx.globalAlpha = Math.sin(Math.PI * j.t); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 2, y + 16); ctx.stroke(); }
        ctx.globalAlpha = 1;
      }
      // air particles
      for (const p of parts) {
        if (!reduce) {
          p.a = Math.min(1, p.a + .02);
          if (p.c) { // cold air drifts in along the floor
            const band = p.x > dx - 6 && p.x < dx + 50 && p.y > top;
            if (band && k > .5) { p.vx = -Math.abs(p.vx) * .8; p.vy = .35; }
            p.x += p.vx; p.y += p.vy; p.vy *= .98;
            if (!on && p.x > dx) p.y += (floor - 24 - p.y) * .01;
          } else {   // warm air leaks out at the top when the curtain is off
            if (!on && p.x < dx + 60) { p.y += (top + 30 - p.y) * .03; p.vx = -1.1; }
            if (on && p.x < dx + 66) { p.vx = Math.abs(p.vx); }
            p.x += p.vx; p.y += p.vy;
          }
          if (p.x < -8 || p.x > W + 8 || p.y > floor - 4 || p.y < 0) Object.assign(p, spawn(p.c));
        }
        ctx.fillStyle = p.c ? `rgba(91,125,153,${.55 * p.a})` : `rgba(214,128,60,${.5 * p.a})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.c ? 2.4 : 2, 0, 7); ctx.fill();
      }
      if (!reduce && vis) requestAnimationFrame(draw);
    }
    new IntersectionObserver(e => { const was = vis; vis = e[0].isIntersecting; if (vis && !was) requestAnimationFrame(draw); }).observe(cv);
    requestAnimationFrame(draw);
    const sw = $('#sw');
    sw.addEventListener('click', () => {
      on = !on; sw.setAttribute('aria-checked', on);
      $('#swLab').textContent = on ? 'Завеса работает' : 'Завеса выключена';
      $('#dNote').textContent = on ? 'Холод остаётся за порогом' : 'Тепло уходит, холод идёт по полу';
      const di = $('#dIn'); di.textContent = on ? '+21°' : 'Холодает'; di.style.color = on ? '' : '#456680';
      if (reduce) requestAnimationFrame(draw);
    });
  }

  /* SOLUTIONS accordion */
  const sol = $('#sol');
  if (sol) {
    sol.innerHTML = TM.scenes.map((s, i) => `
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
    const chips = [p.kw && p.kw + ' кВт', p.series && 'серия ' + p.series, p.height].filter(Boolean).map(c => `<span class="chip">${c}</span>`).join('');
    return `<article class="pc rv">
      <div class="pc-img"><img src="${p.img}" alt="${p.name}" loading="lazy"></div>
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
