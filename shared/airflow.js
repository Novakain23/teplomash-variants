/* Airflow — a soft air stream falling from a curtain outlet, with optional snow
   that drifts toward the doorway and is turned back by the stream.
   Airflow(canvas, { source: () => ({x, y, w}), depth: () => px, mode: 0|.5|1, snow: true, wind: -1|1 }) */
(function (global) {
  function Airflow(canvas, o) {
    o = Object.assign({ mode: 1, snow: true, wind: 1, density: 1, warm: [255, 176, 102], cool: [214, 232, 255], flakes: 110 }, o);
    const ctx = canvas.getContext('2d');
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let W = 0, H = 0, dpr = 1, raf = 0, vis = true, mode = o.mode, modeT = o.mode;
    const streaks = [], flakes = [];
    function size() {
      dpr = Math.min(2, devicePixelRatio || 1);
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function seed() {
      streaks.length = 0; flakes.length = 0;
      const n = Math.round(120 * o.density);
      for (let i = 0; i < n; i++) streaks.push({ u: Math.random(), t: Math.random(), v: .55 + Math.random() * .7, l: 10 + Math.random() * 18, a: .4 + Math.random() * .6 });
      if (o.snow) for (let i = 0; i < o.flakes; i++) flakes.push(newFlake(true));
    }
    function newFlake(any) {
      const rg = o.snowRegion ? o.snowRegion() : { x0: 0, x1: W };
      return { x: rg.x0 + Math.random() * (rg.x1 - rg.x0), y: any ? Math.random() * H : -10, vy: .25 + Math.random() * .6, vx: (.15 + Math.random() * .35) * o.wind, r: .8 + Math.random() * 1.8, a: .35 + Math.random() * .5, ph: Math.random() * 6 };
    }
    size(); seed();
    new ResizeObserver(() => { size(); seed(); draw(performance.now(), true); }).observe(canvas);
    new IntersectionObserver(e => { vis = e[0].isIntersecting; if (vis) kick(); }).observe(canvas);
    function draw(ts, once) {
      raf = 0;
      mode += (modeT - mode) * .05;
      ctx.clearRect(0, 0, W, H);
      const s = o.source(); const depth = o.depth ? o.depth() : H - s.y;
      if (mode > .02 && s.w > 0) {
        const heat = Math.max(0, mode * 2 - 1);            // 0 at fan, 1 at full heat
        const c = o.cool.map((v, i) => Math.round(v + (o.warm[i] - v) * heat));
        // soft glow under the outlet
        ctx.save();
        ctx.translate(s.x + s.w / 2, s.y);
        ctx.scale(s.w / 2, depth);
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
        g.addColorStop(0, `rgba(${c},${(o.glow ?? .12) * mode})`); g.addColorStop(.6, `rgba(${c},${(o.glow ?? .12) * .35 * mode})`); g.addColorStop(1, `rgba(${c},0)`);
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 1, 0, Math.PI); ctx.fill();
        ctx.restore();
        ctx.lineCap = 'round';
        for (const p of streaks) {
          if (!once && !reduce) { p.t += .006 * p.v * (.6 + mode * .6); if (p.t > 1) { p.t = 0; p.u = Math.random(); } }
          const spread = (p.u - .5) * (1 + p.t * .12);
          const x = s.x + s.w * (.5 + spread), y = s.y + 4 + p.t * depth;
          const a = p.a * mode * Math.sin(Math.PI * Math.min(1, p.t * 1.15)) * (o.streak ?? .55);
          ctx.strokeStyle = `rgba(${c},${a})`; ctx.lineWidth = o.lw ?? 1.2;
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + p.l * (.6 + mode * .5)); ctx.stroke();
        }
      }
      if (o.snow) {
        const left = s.x - 18, right = s.x + s.w + 18, bottom = s.y + depth;
        for (const f of flakes) {
          if (!once && !reduce) {
            f.ph += .02; f.y += f.vy; f.x += f.vx + Math.sin(f.ph) * .2;
            const inBand = f.x > left && f.x < right && f.y > s.y && f.y < bottom;
            if (inBand && mode > .2) {                    // the stream pushes snow back out and down
              const fromLeft = f.vx > 0; f.vx = (fromLeft ? -1 : 1) * (.6 + Math.random() * .6) * mode; f.vy += .6;
              f.x = fromLeft ? left : right;
            }
            const rg = o.snowRegion ? o.snowRegion() : { x0: -10, x1: W + 10 };
            if (f.y > H + 6 || f.x < rg.x0 - 30 || f.x > rg.x1 + 30) Object.assign(f, newFlake(false));
            f.vy = Math.min(f.vy, 1.6);
          }
          ctx.fillStyle = `rgba(${o.flakeRGB || '255,255,255'},${f.a})`;
          ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 7); ctx.fill();
        }
      }
      if (!once && !reduce && vis) raf = requestAnimationFrame(draw);
    }
    const kick = () => { if (!raf) raf = requestAnimationFrame(draw); };
    if (reduce) draw(0, true); else kick();
    return { mode(m) { modeT = m; kick(); }, redraw() { draw(performance.now(), true); } };
  }
  global.Airflow = Airflow;
})(window);
