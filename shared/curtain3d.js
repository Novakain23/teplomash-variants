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
  float profile(vec3 p, float inflate){            // white body cross-section: rounded box + convex front
    float cyl = length(p.yz - vec2(-.08,-.2)) - (.39+inflate);
    return cyl;
  }
  float mapB(vec3 p){
    float len=L();
    float body = sdRoundBox(p, vec3(len-.03, .155, .19), .045);
    float d = smax(body, profile(p,0.), .03);
    // recessed perforated field on the curved front (inset by ~3 mm, crisp edges)
    float field = sdBox(vec3(p.x, p.y-.004, 0.), vec3(len-.165, .116, 1.));
    float shell = (.386) - length(p.yz - vec2(-.08,-.2));
    d = smax(d, -max(field-.004, shell), .0035);
    // outlet slot
    float slot = sdBox(p - vec3(0.,-.158,.06), vec3(len-.085,.024,.085));
    d = smax(d, -slot, .006);
    // grey end caps, a touch proud of the body
    vec3 q = p; q.x = abs(p.x) - (len-.024);
    float cap = smax(sdRoundBox(q, vec3(.026,.163,.198), .03), profile(p,.007), .03);
    return min(d, cap);
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

  vec3 env(vec3 r){                           // studio environment: floor, sky, two softboxes
    vec3 col = mix(vec3(.42,.39,.36)*uFill, uSky, smoothstep(-.35,.45,r.y));
    col += uKey*1.6*smoothstep(.86,.97,dot(r, normalize(vec3(-.45,.75,.5))));
    col += uSky*.7*smoothstep(.9,.985,dot(r, normalize(vec3(.75,.35,.55))));
    col += uSky*.35*smoothstep(.55,.9,r.y);
    return col;
  }
  vec3 shade(vec3 p, vec3 rd, out float glow){
    vec3 n = nor(p);
    float len=L();
    vec3 alb = uBody; float rough=.28, spec=.045; glow=0.;
    bool cap = abs(p.x) > len-.051;
    bool inSlot = !cap && p.y < -.128 && abs(p.x) < len-.08 && p.z > -.03 && p.z < .15;
    bool inField = !cap && n.z > .15 && abs(p.x) < len-.161 && abs(p.y-.004) < .112;
    if(inSlot){
      float fz = abs(fract(p.z*40.)-.5);
      float fwz = fwidth(p.z*40.)*1.5;
      float blades = smoothstep(.12-fwz,.12+fwz,fz);
      alb = mix(vec3(.03,.032,.036), vec3(.24,.25,.26), blades);
      rough=.5; spec=.03;
      float depth = smoothstep(-.1,.07,p.z)*smoothstep(.15,.03,p.z);
      glow = uHeat * (1.-blades) * (.25+.75*depth) * .9 + uHeat*.06*depth;
    } else if(inField){
      float arc = atan(p.y+.08, p.z+.2)*.386;
      vec2 uv = vec2(p.x, arc) / .0158;
      float d = hexDist(uv);
      float fw = fwidth(d)*1.1;
      float hole = 1.-smoothstep(.27-fw,.27+fw,d);
      float rim  = smoothstep(.27+fw*2.5,.27,d) * (1.-hole);           // tiny bevel around each hole
      vec3 inside = mix(vec3(.05,.052,.056), vec3(.16,.15,.14), uHeat*.25);
      alb = mix(uBody*.985, inside, hole);
      alb *= 1. - rim*.10;
      rough = mix(.3,.9,hole); spec = mix(.045,.0,hole);
      glow = uHeat*hole*.10*smoothstep(.05,-.11,p.y);
    } else if(cap){
      alb = vec3(.80,.815,.83)*uBody/vec3(.93);                      // satin grey side panels
      rough=.45; spec=.04;
      float seam = 1.-smoothstep(.0,.0035,abs(abs(p.x)-(len-.051)));
      alb *= 1.-.45*seam;
    }
    // shallow groove along the top edge of the front panel
    if(!cap && n.z>.1 && abs(p.y-.132)<.0022) alb*=.82;
    // display window + Teplomash red/blue mark under the field
    vec2 bp = vec2(p.x - (len-.27), p.y+.128);
    if(!cap && n.z>.4 && abs(bp.x)<.05 && abs(bp.y)<.0085){ alb = vec3(.06,.07,.08); rough=.15; spec=.06; }
    vec2 mp = vec2(p.x, p.y+.128);
    if(!cap && n.z>.4 && abs(mp.x)<.02 && abs(mp.y)<.009){ alb = mix(vec3(.78,.1,.14), vec3(.12,.2,.6), step(0.,mp.x)); rough=.3; }

    vec3 Lk = normalize(vec3(-.55,.85,.65));
    vec3 Lf = normalize(vec3(.8,.15,.55));
    float dk = clamp(dot(n,Lk),0.,1.);
    float df = clamp(dot(n,Lf),0.,1.);
    float sh = softShadow(p+n*.003, Lk);
    float oc = ao(p,n);
    // diffuse: key with soft shadow, cool fill, sky ambient with AO
    vec3 col = alb*(uKey*dk*sh*1.05 + uFill*df*.28 + uSky*(.55+.45*n.y)*.45*oc);
    // specular: GGX-ish key highlight + environment reflection with Schlick fresnel
    vec3 v = -rd, h = normalize(Lk + v);
    float a2 = rough*rough*rough*rough;
    float nh = clamp(dot(n,h),0.,1.);
    float D = a2 / (3.1416*pow(nh*nh*(a2-1.)+1., 2.));
    float nv = clamp(dot(n,v),0.,1.);
    float F = spec + (1.-spec)*pow(1.-nv, 5.);
    col += uKey * D * F * dk * sh * .35;
    vec3 r = reflect(rd, n);
    col += env(r) * F * mix(1., .25, rough) * oc;
    col += uRim * pow(1.-nv, 4.) * .12;
    col += vec3(1.,.5,.2)*uHeat*.07*clamp(-n.y,0.,1.);
    col += mix(vec3(1.,.36,.06), vec3(1.,.7,.35), glow)*glow*1.15;
    return col;
  }

  vec3 aces(vec3 x){ x*=1.05; return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.); }
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
      col = aces(col);
      o = vec4(pow(col, vec3(1./2.2)), 1.);
    } else {
      float a = 1.-smoothstep(0., px*1.6, dmin);
      if(a<=0.){ o=vec4(0.); return; }
      vec3 col = shade(ro+rd*tmin, rd, glow);
      col = aces(col);
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
