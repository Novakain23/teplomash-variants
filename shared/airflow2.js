/* Airflow2 — a light particle simulation of an air curtain.
   Warm (or cool, in ventilation mode) air is blown down from the outlet as a jet that slows and spreads
   near the floor; cold outdoor air drifts in from one side, hugs the floor and is turned back by the jet.
   With the curtain off, the cold air flows straight through.

   const a = Airflow2(canvas, {
     source: () => ({ x, y, w }),   // outlet in canvas px
     floor:  () => px,              // floor line (defaults to the canvas bottom)
     flow: 1, heat: 1,              // 0..1 jet strength, 0..1 jet temperature
     cold: true, side: 'left',      // where outdoor air comes from
     snow: false                    // a few snowflakes in the outdoor air
   });
   a.set({ flow, heat });           // eased */
(function (global) {
  function sprite(rgb) {
    const s = 64, c = document.createElement('canvas'); c.width = c.height = s;
    const x = c.getContext('2d'), g = x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, `rgba(${rgb},1)`); g.addColorStop(.35, `rgba(${rgb},.55)`); g.addColorStop(1, `rgba(${rgb},0)`);
    x.fillStyle = g; x.fillRect(0, 0, s, s); return c;
  }
  const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));

  function Airflow2(canvas, o) {
    o = Object.assign({ flow: 1, heat: 1, cold: true, side: 'left', snow: false, density: 1, scale: 1, alpha: 1 }, o);
    const ctx = canvas.getContext('2d');
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const S = { cool: [120, 176, 228], warm: [236, 128, 40], hot: [214, 84, 22], cold: [74, 134, 204] };
    // jet sprites are re-tinted when the temperature changes noticeably
    let jetSprite = null, jetHeat = -1, coldSprite = sprite(S.cold.join(','));
    let W = 0, H = 0, dpr = 1, raf = 0, vis = true, last = 0;
    const st = { flow: o.flow, heat: o.heat }, tg = { flow: o.flow, heat: o.heat };
    const jet = [], cold = [], flakes = [];

    function size() {
      dpr = Math.min(2, devicePixelRatio || 1); W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = Math.max(1, W * dpr); canvas.height = Math.max(1, H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    size();
    new ResizeObserver(() => { size(); }).observe(canvas);
    new IntersectionObserver(e => { vis = e[0].isIntersecting; if (vis) kick(); }).observe(canvas);

    const rnd = (a, b) => a + Math.random() * (b - a);
    const floorY = () => (o.floor ? o.floor() : H);

    function spawnJet(src, k) {
      const sc = H / 320 * o.scale;
      jet.push({ x: src.x + Math.random() * src.w, y: src.y + rnd(0, 4), vx: rnd(-.15, .15), vy: rnd(2.2, 3.4) * sc * (.55 + .45 * st.flow), life: 1, age: 0, decay: rnd(.008, .014), r: rnd(4, 8) * sc, ph: Math.random() * 6.28 });
    }
    function spawnCold(src, fl) {
      const sc = H / 320 * o.scale;
      const top = Math.max(src.y - 10, 0);
      const y = fl - Math.pow(Math.random(), 1.6) * (fl - top);                       // denser near the floor: cold air sinks
      const left = o.side === 'left';
      cold.push({ x: left ? rnd(-30, -5) : W + rnd(5, 30), y, vx: (left ? 1 : -1) * rnd(.6, 1.25) * sc, vy: rnd(-.05, .1), life: 1, r: rnd(6, 12) * sc, ph: Math.random() * 6.28, turned: false });
    }
    function newFlake() { return { x: rnd(-20, W * .45), y: rnd(-20, H), vy: rnd(.35, .9), vx: rnd(.2, .6), r: rnd(.8, 2), a: rnd(.5, .9) }; }
    if (o.snow) for (let i = 0; i < 40; i++) flakes.push(newFlake());

    function step(dt) {
      for (const k of ['flow', 'heat']) st[k] += (tg[k] - st[k]) * Math.min(1, dt * 2.2);
      const src = o.source(), fl = floorY();
      const cx = src.x + src.w / 2;
      // emit
      const jetRate = jet.length > 240 * o.density ? 0 : st.flow * 2.4 * o.density * Math.min(1.4, src.w / 260 + .5);
      for (let i = 0; i < jetRate; i++) if (Math.random() < jetRate / Math.ceil(jetRate)) spawnJet(src);
      if (o.cold && cold.length < 150 * o.density) { const cr = .68 * o.density; for (let i = 0; i < cr; i++) if (Math.random() < cr / Math.ceil(cr) * .9) spawnCold(src, fl); }
      const t = performance.now() / 1000;
      // jet: slows down, wobbles, spreads along the floor
      for (let i = jet.length - 1; i >= 0; i--) {
        const p = jet[i];
        p.vy *= .993; p.vx += Math.sin(t * 3 + p.ph + p.y * .03) * .03;
        if (p.y > fl - 26) { p.vx += Math.sign(p.x - cx || 1) * .18; p.vy *= .86; }
        p.x += p.vx; p.y += p.vy; p.age++; p.life -= p.decay * (p.y > fl - 26 ? 2.2 : 1);
        if (p.life <= 0 || p.y > fl + 6) jet.splice(i, 1);
      }
      // cold air: drifts in, sinks, and is turned back by the jet
      const x0 = src.x - 14, x1 = src.x + src.w + 14, left = o.side === 'left';
      for (let i = cold.length - 1; i >= 0; i--) {
        const p = cold[i];
        p.vy += .004; p.vy += Math.sin(t * 1.7 + p.ph) * .01;
        if (p.y > fl - 6) { p.y = fl - 6; p.vy *= -.2; }
        const front = left ? p.x > x0 - 30 && p.x < x1 : p.x < x1 + 30 && p.x > x0;
        if (front && p.y > src.y && st.flow > .05) {
          const d = left ? (p.x - (x0 - 30)) / 40 : ((x1 + 30) - p.x) / 40;
          const f = Math.min(1, Math.max(0, d)) * st.flow;
          p.vx += (left ? -1 : 1) * .32 * f; p.vy += .08 * f; p.turned = true;
        }
        p.vx *= .995; if (Math.abs(p.vx) < .05 && p.turned) p.life -= .02;
        p.x += p.vx; p.y += p.vy;
        p.life -= p.turned ? .006 : .0012;
        if (p.life <= 0 || p.x < -60 || p.x > W + 60) cold.splice(i, 1);
      }
      for (const f of flakes) {
        f.y += f.vy; f.x += f.vx + Math.sin(t + f.y * .02) * .2;
        if (st.flow > .05 && f.x > x0 - 12 && f.x < x1 && f.y > src.y) { f.vx = -Math.abs(f.vx) - .4 * st.flow; f.vy += .25; }
        if (f.y > fl || f.x < -20 || f.x > W * .6) Object.assign(f, newFlake(), { y: -10 });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);      // full clear: 8-bit alpha fading leaves a grey residue on real GPUs
      const src = o.source(), fl = floorY();
      // faint column of moving air under the outlet
      if (st.flow > .02) {
        const c = st.heat > .02 ? mix(S.warm, S.hot, st.heat * .5) : S.cool;
        const g = ctx.createLinearGradient(0, src.y, 0, fl);
        g.addColorStop(0, `rgba(${c},${.14 * st.flow * (.5 + st.heat * .5)})`); g.addColorStop(1, `rgba(${c},0)`);
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.moveTo(src.x + 4, src.y); ctx.lineTo(src.x + src.w - 4, src.y); ctx.lineTo(src.x + src.w + 18, fl); ctx.lineTo(src.x - 18, fl); ctx.fill();
      }
      // jet sprites (re-tint when temperature changes)
      const hq = Math.round(st.heat * 10) / 10;
      if (hq !== jetHeat) { jetHeat = hq; jetSprite = sprite((hq > .05 ? mix(S.warm, S.hot, hq * .6) : S.cool).join(',')); }
      for (const p of jet) {
        const sp = Math.hypot(p.vx, p.vy), a = Math.min(1, p.life * 1.4) * (.13 + .1 * st.heat) * Math.min(1, st.flow * 1.6) * o.alpha;
        if (a < .01) continue;
        ctx.globalAlpha = a;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(Math.atan2(p.vy, p.vx) - Math.PI / 2);
        const len = Math.min(p.age * sp + p.r, p.r * (1.8 + sp * 1.8));      // tail grows behind the head, never above the outlet
        ctx.globalAlpha = a * Math.min(1, p.age / 8);
        ctx.drawImage(jetSprite, -p.r, -len + p.r * .5, p.r * 2, len); ctx.restore();
      }
      for (const p of cold) {
        const a = Math.min(1, p.life * 1.3) * .22 * o.alpha;
        ctx.globalAlpha = a;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(Math.atan2(p.vy, p.vx));
        const len = p.r * (2 + Math.abs(p.vx) * 1.4);
        ctx.drawImage(coldSprite, -len / 2, -p.r * .6, len, p.r * 1.2); ctx.restore();
      }
      ctx.globalAlpha = 1;
      for (const f of flakes) { ctx.fillStyle = `rgba(130,170,215,${f.a})`; ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 7); ctx.fill(); }
    }

    function frame(ts) {
      raf = 0;
      const dt = Math.min(.05, (ts - last) / 1000 || .016); last = ts;
      if (!reduce) step(dt);
      draw();
      if (vis && !reduce) raf = requestAnimationFrame(frame);
    }
    const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };
    if (reduce) { for (let i = 0; i < 140; i++) step(.016); }
    kick();
    return { set(v) { Object.assign(tg, v); kick(); }, mode(m) { tg.flow = m; kick(); }, get state() { return st; } };
  }
  global.Airflow2 = Airflow2;
})(window);
