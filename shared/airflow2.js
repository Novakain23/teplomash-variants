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
    // cold air = wind streamlines: thin wisps that keep a short trail of positions
    function spawnCold(src, fl) {
      const sc = H / 320 * o.scale, left = o.side === 'left';
      // the whole height is windy, but cold air is denser near the floor
      const y = fl - Math.pow(Math.random(), 1.35) * fl * .92;
      cold.push({ x: left ? rnd(-40, -5) : W + rnd(5, 40), y, vx: (left ? 1 : -1) * rnd(.9, 1.7) * sc * (.75 + .5 * (y / fl)), vy: rnd(-.05, .05), life: 1, ph: Math.random() * 6.28, amp: rnd(.15, .45), w: rnd(.8, 1.8), tr: [], turned: false });
    }
    function newFlake(any) { return { x: any ? rnd(-20, W * .9) : rnd(-60, -5), y: any ? rnd(-10, H) : rnd(-40, H * .85), vy: rnd(.25, .7), vx: rnd(.9, 1.8), r: rnd(.9, 2.2), a: rnd(.55, .95), ph: Math.random() * 6.28 }; }
    if (o.snow) for (let i = 0; i < 48; i++) flakes.push(newFlake(true));

    function step(dt) {
      for (const k of ['flow', 'heat']) st[k] += (tg[k] - st[k]) * Math.min(1, dt * 2.2);
      const src = o.source(), fl = floorY();
      const cx = src.x + src.w / 2;
      // emit
      const jetRate = jet.length > 240 * o.density ? 0 : st.flow * 2.4 * o.density * Math.min(1.4, src.w / 260 + .5);
      for (let i = 0; i < jetRate; i++) if (Math.random() < jetRate / Math.ceil(jetRate)) spawnJet(src);
      if (o.cold && cold.length < 70 * o.density) { const cr = .5 * o.density; for (let i = 0; i < cr; i++) if (Math.random() < cr / Math.ceil(cr) * .9) spawnCold(src, fl); }
      const t = performance.now() / 1000;
      // jet: slows down, wobbles, spreads along the floor
      for (let i = jet.length - 1; i >= 0; i--) {
        const p = jet[i];
        p.vy *= .993; p.vx += Math.sin(t * 3 + p.ph + p.y * .03) * .03;
        if (p.y > fl - 26) { p.vx += Math.sign(p.x - cx || 1) * .18; p.vy *= .86; }
        p.x += p.vx; p.y += p.vy; p.age++; p.life -= p.decay * (p.y > fl - 26 ? 2.2 : 1);
        if (p.life <= 0 || p.y > fl + 6) jet.splice(i, 1);
      }
      // cold air: wind from outside. Below the outlet it meets the jet, is stopped, curls back and down;
      // at the height of the unit it slides over the housing; above it simply passes.
      const x0 = src.x - 10, x1 = src.x + src.w + 10, left = o.side === 'left', dir = left ? 1 : -1;
      const top = src.top != null ? src.top : src.y - 40;
      for (let i = cold.length - 1; i >= 0; i--) {
        const p = cold[i];
        p.tr.push(p.x, p.y); if (p.tr.length > 56) p.tr.splice(0, 2);
        const turb = Math.sin(t * 1.3 + p.ph + p.x * .012) * p.amp;
        p.vy += (turb - p.vy) * .06 + .003;                       // gentle gusts, cold air slowly sinks
        if (p.y > fl - 4) { p.y = fl - 4; p.vy = -Math.abs(p.vy) * .3; }
        const ahead = left ? (x0 - p.x) : (p.x - x1);           // distance to the barrier
        if (st.flow > .05 && p.y > src.y - 2 && ahead < 46 && ahead > -src.w) {
          const f = Math.max(0, 1 - ahead / 46) * st.flow;      // pressure of the jet grows close to it
          p.vx -= dir * .22 * f; p.vy += .06 * f; p.turned = true;
        } else if (p.y > top - 6 && p.y < src.y + 2 && ahead < 30 && ahead > -src.w) {
          p.vy -= .12;                                          // housing in the way: flow over it
        }
        p.vx += (dir * 1.2 * (H / 320) - p.vx) * (p.turned ? 0 : .01);
        p.x += p.vx; p.y += p.vy;
        p.life -= p.turned ? .009 : .0016;
        if (p.life <= 0 || p.x < -80 || p.x > W + 80) cold.splice(i, 1);
      }
      for (const f of flakes) {
        f.x += f.vx + Math.sin(t * 1.5 + f.ph) * .25; f.y += f.vy + Math.cos(t + f.ph) * .12;
        const ahead = left ? (x0 - f.x) : (f.x - x1);
        if (st.flow > .05 && f.y > src.y && ahead < 18 && ahead > -src.w) { f.vx = -dir * (.6 + Math.random() * .8) * st.flow; f.vy += .35; }
        else if (f.y > top - 4 && f.y < src.y && ahead < 10 && ahead > -src.w) { f.vy -= .5; }
        else f.vx += (dir * 1.3 - f.vx) * .02;
        f.vy += (.45 - f.vy) * .03;
        if (f.y > fl || f.x < -70 || f.x > W + 20) Object.assign(f, newFlake(false));
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
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      for (const p of cold) {
        const n = p.tr.length; if (n < 6) continue;
        const a = Math.min(1, p.life * 1.4) * .8 * o.alpha;
        for (let k = 2; k < n; k += 2) {                          // fading tail: older points are fainter and thinner
          const q = k / n;
          ctx.strokeStyle = `rgba(${S.cold},${(a * q * q).toFixed(3)})`; ctx.lineWidth = p.w * (.5 + q * 1.1);
          ctx.beginPath(); ctx.moveTo(p.tr[k - 2], p.tr[k - 1]); ctx.lineTo(p.tr[k], p.tr[k + 1] ?? p.y); ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
      for (const f of flakes) { ctx.fillStyle = `rgba(118,160,210,${f.a})`; ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 7); ctx.fill(); }
    }

    function frame(ts) {
      raf = 0;
      const dt = Math.min(.05, (ts - last) / 1000 || .016); last = ts;
      if (!reduce) { const n = Math.max(1, Math.min(3, Math.round(dt * 60))); for (let i = 0; i < n; i++) step(dt / n); }   // keep speed stable on slow devices
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
