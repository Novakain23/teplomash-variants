/* Curtain3D — a small SDF renderer of a Teplomash-style air curtain.
   No libraries. WebGL2. Usage:
     const c = Curtain3D(canvas, {yaw:-.35, pitch:.12, heat:0, light:'warm'});
     c.set({heat:1});            // 0..1 heater glow in the outlet
     c.target({yaw:.2});         // eased rotation
*/
(function (global) {
  const VS = `#version 300 es
  in vec2 a; void main(){ gl_Position = vec4(a,0.,1.); }`;

  const FS = `#version 300 es
  precision highp float;
  out vec4 o;
  uniform vec2 uRes; uniform float uTime, uYaw, uPitch, uHeat, uZoom, uLen;
  uniform vec3 uKey, uFill, uSky, uBody, uRim;

  mat3 rotY(float a){ float c=cos(a), s=sin(a); return mat3(c,0.,-s, 0.,1.,0., s,0.,c); }
  mat3 rotX(float a){ float c=cos(a), s=sin(a); return mat3(1.,0.,0., 0.,c,s, 0.,-s,c); }
  float sdRoundBox(vec3 p, vec3 b, float r){ vec3 q=abs(p)-b+r; return length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.)-r; }
  float sdBox(vec3 p, vec3 b){ vec3 q=abs(p)-b; return length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.); }
  float smax(float a, float b, float k){ float h=max(k-abs(a-b),0.)/k; return max(a,b)+h*h*k*.25; }

  float L(){ return uLen; }
  float mapB(vec3 p){
    float len=L();
    float body = sdRoundBox(p, vec3(len, .155, .19), .045);
    float cyl  = length(p.yz - vec2(-.08,-.2)) - .39;         // convex front, rounder towards the top
    float d = smax(body, cyl, .03);
    float slot = sdBox(p - vec3(0.,-.158,.06), vec3(len-.075,.024,.085));
    d = smax(d, -slot, .008);
    return d;
  }
  float map(vec3 p){ return mapB(p); }

  vec3 nor(vec3 p){ vec2 e=vec2(.0008,0.);
    return normalize(vec3(map(p+e.xyy)-map(p-e.xyy), map(p+e.yxy)-map(p-e.yxy), map(p+e.yyx)-map(p-e.yyx))); }

  float softShadow(vec3 ro, vec3 rd){
    float res=1., t=.01;
    for(int i=0;i<28;i++){ float h=map(ro+rd*t); res=min(res, 10.*h/t); t+=clamp(h,.01,.08); if(res<.02||t>1.6) break; }
    return clamp(res,0.,1.);
  }
  float ao(vec3 p, vec3 n){ float s=0., w=1.;
    for(int i=1;i<=5;i++){ float h=.012*float(i); s+=w*(h-map(p+n*h)); w*=.7; }
    return clamp(1.-6.*s,0.,1.); }

  float hexDist(vec2 uv){
    vec2 r=vec2(1.,1.7320508), h=r*.5;
    vec2 a=mod(uv,r)-h, b=mod(uv-h,r)-h;
    return length(dot(a,a)<dot(b,b)?a:b);
  }

  vec3 shade(vec3 p, vec3 rd, out float glow){
    vec3 n = nor(p);
    float len=L();
    vec3 alb = uBody; float gloss=.55; glow=0.;
    bool inSlot = p.y < -.128 && abs(p.x) < len-.07 && p.z > -.03 && p.z < .15;
    if(inSlot){
      float fz = abs(fract(p.z*40.)-.5);
      float fwz = fwidth(p.z*40.)*1.5;
      float blades = smoothstep(.12-fwz,.12+fwz,fz);          // wide graphite louvers, thin gaps
      alb = mix(vec3(.035,.038,.042), vec3(.20,.21,.22), blades);
      gloss=.25;
      float depth = smoothstep(-.1,.07,p.z)*smoothstep(.15,.03,p.z);
      glow = uHeat * (1.-blades) * (.25+.75*depth) * .9 + uHeat*.06*depth;
    } else if(n.z > .3 && abs(p.x) < len-.17 && p.y > -.112 && p.y < .128){
      // perforated grille, hex holes on the curved panel (arc-length coords)
      float arc = atan(p.y+.08, p.z+.2)*.39;
      vec2 uv = vec2(p.x, arc) / .0205;
      float d = hexDist(uv);
      float fw = fwidth(d)*1.2;
      float hole = 1.-smoothstep(.30-fw,.30+fw,d);
      alb = mix(uBody*.94, vec3(.11,.12,.13), hole*.92);
      gloss = mix(.5,.05,hole);
      glow = uHeat*hole*.22*smoothstep(.06,-.1,p.y);
      // soft margin where the grille meets the solid wings
      float m = smoothstep(len-.17,len-.24,abs(p.x));
      alb = mix(uBody, alb, m);
    }
    // end caps a hair cooler
    if(abs(p.x) > len-.045) alb *= vec3(.965,.97,.98);
    alb *= 1.-.35*(1.-smoothstep(.0,.004,abs(abs(p.x)-(len-.045))));   // end-cap seam
    // Teplomash badge: small red/blue mark under the grille
    vec2 bp = vec2(p.x, p.y+.133);
    if(n.z>.5 && abs(bp.x)<.022 && abs(bp.y)<.011){
      float s = step(0.,bp.x);
      alb = mix(vec3(.80,.12,.16), vec3(.13,.2,.62), s);
      gloss=.3;
    }

    vec3 Lk = normalize(vec3(-.55,.85,.65));
    vec3 Lf = normalize(vec3(.8,.15,.55));
    float dk = clamp(dot(n,Lk),0.,1.);
    float df = clamp(dot(n,Lf),0.,1.);
    float sh = softShadow(p+n*.003, Lk);
    float oc = ao(p,n);
    vec3 col = alb*(uKey*dk*sh*1.12 + uFill*df*.3 + uSky*(.5+.5*n.y)*.42*oc);
    vec3 h = normalize(Lk - rd);
    col += uKey*pow(clamp(dot(n,h),0.,1.), 70.)*gloss*.6*sh;
    float fr = pow(1.-clamp(dot(n,-rd),0.,1.), 4.);
    // studio softbox reflected along the curved front
    vec3 r = reflect(rd, n);
    float band = smoothstep(.12,.32,r.y)*smoothstep(.78,.5,r.y);
    col += uSky*band*gloss*(.16+.3*fr)*oc;
    col += uRim*fr*.18;
    // warm bounce from the heated stream below
    col += vec3(1.,.5,.2)*uHeat*.08*clamp(-n.y,0.,1.);
    col += mix(vec3(1.,.36,.06), vec3(1.,.7,.35), glow)*glow*1.15;
    return col;
  }

  bool boxHit(vec3 ro, vec3 rd, vec3 b, out float t0, out float t1){
    vec3 m=1./rd, n=m*ro, k=abs(m)*b, a=-n-k, c=-n+k;
    t0=max(max(a.x,a.y),a.z); t1=min(min(c.x,c.y),c.z);
    return t1>max(t0,0.);
  }

  void main(){
    vec2 uv = (gl_FragCoord.xy - .5*uRes)/uRes.y;
    vec3 ro = vec3(0.,0.,3.15/uZoom);
    vec3 rd = normalize(vec3(uv, -2.6));
    mat3 R = rotX(uPitch)*rotY(uYaw);
    ro = R*ro; rd = R*rd;               // orbit the camera around the unit
    float t0,t1;
    if(!boxHit(ro, rd, vec3(L()+.06,.22,.27), t0, t1)){ o=vec4(0.); return; }
    float t=max(t0,0.), dmin=1e9, tmin=t; bool hit=false;
    float px = 1.25/uRes.y/2.6;           // angular size of a pixel
    for(int i=0;i<110;i++){
      vec3 p=ro+rd*t; float d=map(p);
      if(d/t < dmin){ dmin=d/t; tmin=t; }
      if(d<.0004*t){ hit=true; break; }
      t+=d*.9; if(t>t1) break;
    }
    float glow;
    if(hit){
      vec3 col = shade(ro+rd*t, rd, glow);
      col = col/(1.+col*.18);
      o = vec4(pow(col, vec3(1./2.2)), 1.);
    } else {
      float a = 1.-smoothstep(0., px*1.6, dmin);
      if(a<=0.){ o=vec4(0.); return; }
      vec3 col = shade(ro+rd*tmin, rd, glow);
      col = col/(1.+col*.18);
      o = vec4(pow(col, vec3(1./2.2))*a, a);
    }
  }`;

  const LIGHTS = {
    warm:   { key:[1.05,.98,.9],  fill:[.62,.74,.95], sky:[.95,.93,.9],  body:[.93,.925,.915], rim:[1.,.86,.7] },
    cool:   { key:[.95,.98,1.05], fill:[.7,.78,.95],  sky:[.86,.9,.97],  body:[.93,.935,.94],  rim:[.75,.85,1.] },
    studio: { key:[1.,1.,1.],     fill:[.8,.82,.86],  sky:[.92,.92,.93], body:[.94,.94,.935],  rim:[1.,1.,1.] },
    dusk:   { key:[1.,.86,.7],    fill:[.42,.55,.85], sky:[.55,.62,.8],  body:[.9,.9,.9],      rim:[.55,.7,1.] }
  };

  function Curtain3D(canvas, opts) {
    opts = Object.assign({ yaw: -.35, pitch: .14, heat: 0, zoom: 1, len: .8, light: 'warm', interactive: true, sway: true, maxDpr: 2 }, opts || {});
    const gl = canvas.getContext('webgl2', { premultipliedAlpha: true, alpha: true, antialias: false, preserveDrawingBuffer: !!opts.preserve });
    if (!gl) { canvas.dataset.fallback = '1'; return null; }
    const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(x)); return x; };
    const pr = gl.createProgram();
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr); gl.useProgram(pr);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, 'a'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = n => gl.getUniformLocation(pr, n);
    const u = { res: U('uRes'), time: U('uTime'), yaw: U('uYaw'), pitch: U('uPitch'), heat: U('uHeat'), zoom: U('uZoom'), len: U('uLen'), key: U('uKey'), fill: U('uFill'), sky: U('uSky'), body: U('uBody'), rim: U('uRim') };

    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const st = { yaw: opts.yaw, pitch: opts.pitch, heat: opts.heat, zoom: opts.zoom, len: opts.len };
    const tg = Object.assign({}, st);
    let mx = 0, my = 0, visible = true, raf = 0, last = 0, dirty = true;

    function applyLight(name) {
      const l = LIGHTS[name] || LIGHTS.warm;
      gl.uniform3fv(u.key, l.key); gl.uniform3fv(u.fill, l.fill); gl.uniform3fv(u.sky, l.sky); gl.uniform3fv(u.body, l.body); gl.uniform3fv(u.rim, l.rim);
    }
    applyLight(opts.light);

    function size() {
      const dpr = Math.min(opts.maxDpr, window.devicePixelRatio || 1);
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr)), h = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; dirty = true; }
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    function frame(ts) {
      raf = 0;
      const dt = Math.min(.05, (ts - last) / 1000 || .016); last = ts;
      const k = 1 - Math.pow(.0015, dt);
      const swy = opts.sway && !reduce ? Math.sin(ts / 2600) * .06 : 0;
      const ty = tg.yaw + mx * .38 + swy, tp = tg.pitch + my * .12;
      let moving = false;
      for (const [a, b] of [['yaw', ty], ['pitch', tp], ['heat', tg.heat], ['zoom', tg.zoom], ['len', tg.len]]) {
        const d = b - st[a]; if (Math.abs(d) > 1e-4) { st[a] += d * k; moving = true; } else st[a] = b;
      }
      if (moving || dirty || (opts.sway && !reduce)) {
        size();
        gl.uniform2f(u.res, canvas.width, canvas.height); gl.uniform1f(u.time, ts / 1000);
        gl.uniform1f(u.yaw, st.yaw); gl.uniform1f(u.pitch, st.pitch); gl.uniform1f(u.heat, st.heat);
        gl.uniform1f(u.zoom, st.zoom); gl.uniform1f(u.len, st.len);
        gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); gl.drawArrays(gl.TRIANGLES, 0, 3);
        dirty = false;
      }
      if (visible && (moving || (opts.sway && !reduce))) raf = requestAnimationFrame(frame);
    }
    const kick = () => { if (!raf && visible) raf = requestAnimationFrame(frame); };
    if (opts.interactive && !reduce) {
      const host = opts.pointerTarget || canvas;
      host.addEventListener('pointermove', e => { const r = host.getBoundingClientRect(); mx = (e.clientX - r.left) / r.width - .5; my = (e.clientY - r.top) / r.height - .5; kick(); });
      host.addEventListener('pointerleave', () => { mx = 0; my = 0; kick(); });
    }
    new ResizeObserver(() => { dirty = true; kick(); }).observe(canvas);
    new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) kick(); }).observe(canvas);
    kick();
    return {
      set(o) { Object.assign(tg, o); Object.assign(st, o); dirty = true; kick(); },
      target(o) { Object.assign(tg, o); kick(); },
      light(n) { applyLight(n); dirty = true; kick(); },
      get state() { return st; }
    };
  }
  global.Curtain3D = Curtain3D;
})(window);
