"use strict";
// The ground of the whole page: three equal masses released from rest, simulated live (see below),
// plus the small page behaviours: pausing loops, the nav, reveals, the terminal figures and the work peek.
// Runs only while on screen, with the tab visible, without reduced motion, and until the visitor pauses it.

(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  const small = matchMedia("(max-width: 60rem)");
  const fine = matchMedia("(hover: hover) and (pointer: fine)");

  // Every looping thing on the page: hold it when paused, off screen or under reduced motion.
  function loop(el, start, stop) {
    const btn = el.querySelector("[data-loop-toggle]") ||
      document.querySelector(`[data-loop-toggle][aria-controls="${el.querySelector("canvas")?.id}"]`);
    const s = { seen: false, held: reduce.matches, hidden: document.hidden };
    const sync = () => {
      const run = s.seen && !s.held && !s.hidden;
      run ? start() : stop();
      if (btn) btn.textContent = s.held ? "Play" : "Pause";
    };
    btn?.addEventListener("click", () => { s.held = !s.held; sync(); });
    document.addEventListener("visibilitychange", () => { s.hidden = document.hidden; sync(); });
    new IntersectionObserver(([e]) => { s.seen = e.isIntersecting; sync(); }).observe(el);
    sync();
  }

  // The nav gains its ground once the page has scrolled, and marks the section in view.
  const nav = document.querySelector(".nav");
  if (nav) {
    const onScroll = () => nav.classList.toggle("is-scrolled", scrollY > 24);
    addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    const links = [...nav.querySelectorAll('a[href^="#"]')];
    const sections = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        links.forEach((a) => a.classList.toggle("is-current", a.getAttribute("href") === "#" + e.target.id));
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    links.forEach((a) => { const t = document.querySelector(a.getAttribute("href")); if (t) sections.observe(t); });
  }

  // Groups slide in once, staggered.
  document.querySelectorAll("[data-reveal]").forEach((group) => {
    [...group.children].forEach((el, i) => el.style.setProperty("--i", i));
    new IntersectionObserver(([e], obs) => {
      if (!e.isIntersecting) return;
      group.classList.add("is-in");
      obs.disconnect();
    }, { threshold: 0.1 }).observe(group);
  });

  // Terminal figures type their lines in once they are on screen.
  document.querySelectorAll(".term").forEach((term) => {
    term.querySelectorAll(".line").forEach((l, n) => l.style.setProperty("--i", n));
    new IntersectionObserver(([e], obs) => {
      if (!e.isIntersecting) return;
      term.classList.add("is-in");
      obs.disconnect();
    }, { threshold: 0.3 }).observe(term);
  });

  // The work index: a project's screen follows the pointer over its row.
  const rows = [...document.querySelectorAll(".row[data-img]")];
  if (rows.length && fine.matches && !reduce.matches) {
    const peek = document.createElement("img");
    peek.className = "peek";
    peek.alt = "";
    peek.setAttribute("aria-hidden", "true");
    document.body.appendChild(peek);
    let x = 0, y = 0, raf = 0;
    const place = () => { raf = 0; peek.style.left = x + 28 + "px"; peek.style.top = y + "px"; };
    rows.forEach((row) => {
      const link = row.querySelector("a");
      link.addEventListener("pointerenter", () => {
        const src = row.dataset.img;
        if (peek.getAttribute("src") !== src) peek.src = src;
        peek.classList.toggle("peek--contain", src.endsWith(".svg"));
        peek.classList.add("is-on");
      });
      link.addEventListener("pointerleave", () => peek.classList.remove("is-on"));
      link.addEventListener("pointermove", (e) => {
        x = e.clientX; y = e.clientY;
        if (!raf) raf = requestAnimationFrame(place);
      }, { passive: true });
    });
  }

  // The ground dims past the hero and comes back for the close.
  const ground = document.querySelector(".ground");
  if (ground) {
    const root = document.documentElement;
    let raf = 0;
    const dim = () => {
      raf = 0;
      if (small.matches) { root.style.removeProperty("--ground-dim"); return; }
      const vh = innerHeight, y = scrollY;
      const end = root.scrollHeight - vh;
      const past = Math.min(1, Math.max(0, (y - vh * 0.35) / (vh * 0.65)));
      let d = 1 - 0.84 * past;
      const near = Math.min(1, Math.max(0, 1 - (end - y) / (vh * 0.9)));
      d = Math.max(d, 0.16 + 0.34 * near);
      root.style.setProperty("--ground-dim", d.toFixed(3));
    };
    addEventListener("scroll", () => { if (!raf) raf = requestAnimationFrame(dim); }, { passive: true });
    addEventListener("resize", () => { if (!raf) raf = requestAnimationFrame(dim); });
    dim();
  }

  // The ground: three equal masses released from rest, with a cloud of dust released from rest among them.
  //   r_i'' = sum over j of m_j (r_j - r_i) / |r_j - r_i|^3      (G = 1, very slightly softened)
  // The masses are stepped on the CPU in double precision, with steps that shrink on close passes. The dust is
  // massless (it feels the masses, they don't feel it) and is stepped on the GPU with transform feedback.
  // Everything lands in a float canvas that fades: the dust quickly, the masses' trails slowly. Colour is speed,
  // from night to white heat. When a mass leaves for good, the run fades out and a new triangle is dropped.
  const cv = document.getElementById("silk");
  if (!cv) return;
  const gl = cv.getContext("webgl2", { antialias: false, alpha: false, depth: false, stencil: false });
  if (!gl) return; // the still image stays
  gl.getExtension("EXT_color_buffer_float");
  const floatBlend = !!gl.getExtension("EXT_float_blend");
  const [IFMT, TYPE] = floatBlend ? [gl.RGBA32F, gl.FLOAT] : [gl.RGBA16F, gl.HALF_FLOAT];

  // Night, through ember, to white heat. The first stop is the page's own ground.
  const HEAT = [[0.11, 0.09, 0.07], [0.3, 0.07, 0.34], [0.76, 0.12, 0.4], [0.97, 0.3, 0.13], [1, 0.6, 0.12], [1, 0.87, 0.42], [1, 0.99, 0.9]];
  const MAXB = 5;
  const N = small.matches ? 90000 : 260000;
  let K = small.matches ? 3 : 5; // dust steps per frame; drops on slow machines
  const SPEED = 0.7; // simulated time per second
  const EPS2 = 0.02 * 0.02;
  const DUST_HALF = 0.16, TRAIL_HALF = 6; // seconds to fade to half
  const LOGD = Math.log(1 + 60), GAIN_T = 2.5, LOGT = Math.log(1 + 30);

  const HASH = `uint hash(uint x) { x ^= x >> 16u; x *= 0x7feb352du; x ^= x >> 15u; x *= 0x846ca68bu; x ^= x >> 16u; return x; }`;
  const VS_DUST = `#version 300 es
precision highp float; precision highp int;
in vec4 aS;
uniform vec3 uB[${MAXB}]; uniform int uNB; uniform float uDt; uniform uint uSeed; uniform uint uReseed;
uniform float uR0; uniform float uFar; uniform vec4 uMap;
out vec4 vS; out float vHeat;
${HASH}
vec2 pull(vec2 p) {
  vec2 a = vec2(0.0);
  for (int i = 0; i < ${MAXB}; i++) {
    if (i >= uNB) break;
    vec2 d = uB[i].xy - p;
    float r2 = dot(d, d) + 0.0025;
    a += uB[i].z * d * inversesqrt(r2 * r2 * r2);
  }
  return a;
}
void main() {
  vec4 s = aS;
  uint h = hash(uint(gl_VertexID) ^ (uSeed * 0x9E3779B9u));
  if ((h % 10000u) < uReseed || any(isnan(s)) || dot(s.xy, s.xy) > uFar * uFar) {
    uint h2 = hash(h + 0x68E31DA4u);
    float a = float(h & 0xffffu) / 65536.0 * 6.2831853;
    float r = uR0 * sqrt(float(h2 & 0xffffu) / 65536.0);
    s = vec4(cos(a) * r, sin(a) * r, 0.0, 0.0);
  }
  s.zw += pull(s.xy) * uDt;
  s.xy += s.zw * uDt;
  vS = s;
  float v = length(s.zw);
  vHeat = v / (v + 1.4);
  gl_Position = vec4(s.xy * uMap.xy + uMap.zw, 0.0, 1.0);
  gl_PointSize = 1.0;
}`;
  const FS_DUST = `#version 300 es
precision highp float; in float vHeat; out vec4 o; void main() { o = vec4(1.0, vHeat, 0.0, 0.0); }`;
  const VS_TRAIL = `#version 300 es
precision highp float;
in vec3 aT; uniform vec4 uMap; uniform float uSize; out float vHeat;
void main() { vHeat = aT.z; gl_Position = vec4(aT.xy * uMap.xy + uMap.zw, 0.0, 1.0); gl_PointSize = uSize; }`;
  const FS_TRAIL = `#version 300 es
precision highp float; in float vHeat; uniform float uW; out vec4 o;
void main() { vec2 c = gl_PointCoord * 2.0 - 1.0; float k = uW * max(0.0, 1.0 - dot(c, c)); o = vec4(0.0, 0.0, k, k * vHeat); }`;
  const VS_QUAD = `#version 300 es
void main() { vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2)); gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0); }`;
  const FS_FADE = `#version 300 es
precision highp float; out vec4 o; void main() { o = vec4(0.0); }`;
  const FS_SHOW = `#version 300 es
precision highp float;
uniform sampler2D uAcc; uniform float uInvMean; uniform float uLogD; uniform float uGainT; uniform float uLogT; uniform vec3 uH[7];
out vec4 o;
vec3 heat(float t) { t = clamp(t, 0.0, 1.0) * 6.0; int i = int(min(floor(t), 5.0)); return mix(uH[i], uH[i + 1], t - float(i)); }
void main() {
  vec4 a = texelFetch(uAcc, ivec2(gl_FragCoord.xy), 0);
  // Dust: log of how much lands here, coloured by its mean speed; it stays below white.
  float vd = clamp(log(1.0 + a.r * uInvMean) / uLogD, 0.0, 1.0);
  float hd = a.r > 0.0 ? a.g / a.r : 0.0;
  // The masses' trails: brighter, and the fastest stretches reach white heat.
  float vt = clamp(log(1.0 + a.b * uGainT) / uLogT, 0.0, 1.0);
  float ht = a.b > 0.0 ? a.a / a.b : 0.0;
  // The dust is an undertone: it never climbs past the night colours, and slow dust stays dark.
  float td = vd * 0.26 * smoothstep(0.1, 0.8, hd);
  o = vec4(heat(max(td, vt * (0.45 + 0.75 * ht))), 1.0);
}`;

  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  function program(vs, fs, varyings) {
    const p = gl.createProgram();
    gl.attachShader(p, compile(gl.VERTEX_SHADER, vs));
    gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs));
    if (varyings) gl.transformFeedbackVaryings(p, varyings, gl.SEPARATE_ATTRIBS);
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const u = {};
    const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) {
      const name = gl.getActiveUniform(p, i).name.replace(/\[0\]$/, "");
      u[name] = gl.getUniformLocation(p, name);
    }
    return { p, u };
  }

  let P_DUST, P_TRAIL, P_FADE, P_SHOW;
  try {
    P_DUST = program(VS_DUST, FS_DUST, ["vS"]);
    P_TRAIL = program(VS_TRAIL, FS_TRAIL);
    P_FADE = program(VS_QUAD, FS_FADE);
    P_SHOW = program(VS_QUAD, FS_SHOW);
  } catch (e) { return; }

  // Dust state (x, y, vx, vy), ping-ponged through transform feedback.
  const bufs = [0, 1].map(() => {
    const b = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(N * 4), gl.DYNAMIC_COPY);
    return b;
  });
  const aS = gl.getAttribLocation(P_DUST.p, "aS");
  const vaos = bufs.map((b) => {
    const v = gl.createVertexArray();
    gl.bindVertexArray(v);
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.enableVertexAttribArray(aS);
    gl.vertexAttribPointer(aS, 4, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
    return v;
  });
  const tfs = bufs.map((b) => {
    const t = gl.createTransformFeedback();
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, t);
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, b);
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
    return t;
  });

  // The masses' trails: soft points laid less than half a pixel apart, so the line is solid at any speed.
  const MAXV = 6000;
  const trailData = new Float32Array((MAXB * (MAXV + 1) + MAXB) * 3);
  const trailBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, trailBuf);
  gl.bufferData(gl.ARRAY_BUFFER, trailData.byteLength, gl.DYNAMIC_DRAW);
  const aT = gl.getAttribLocation(P_TRAIL.p, "aT");
  const trailVao = gl.createVertexArray();
  gl.bindVertexArray(trailVao);
  gl.bindBuffer(gl.ARRAY_BUFFER, trailBuf);
  gl.enableVertexAttribArray(aT);
  gl.vertexAttribPointer(aT, 3, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  const emptyVao = gl.createVertexArray();

  let acc = null, fbo = null, W = 0, H = 0, broken = false;
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, small.matches ? 1.5 : 2);
    const r = cv.getBoundingClientRect();
    const w = Math.max(1, Math.round(r.width * dpr)), h = Math.max(1, Math.round(r.height * dpr));
    if (w === W && h === H) return;
    W = w; H = h;
    cv.width = W; cv.height = H;
    if (acc) gl.deleteTexture(acc);
    if (fbo) gl.deleteFramebuffer(fbo);
    acc = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, acc);
    gl.texImage2D(gl.TEXTURE_2D, 0, IFMT, W, H, 0, gl.RGBA, TYPE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, acc, 0);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) broken = true;
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  // The masses.
  const B = { n: 3, x: new Float64Array(MAXB), y: new Float64Array(MAXB), vx: new Float64Array(MAXB), vy: new Float64Array(MAXB),
    m: new Float64Array(MAXB), ax: new Float64Array(MAXB), ay: new Float64Array(MAXB) };
  // Accelerations, and the shortest local orbit time, which sets the next step size.
  function accel() {
    const { n, x, y, m, ax, ay } = B;
    for (let i = 0; i < n; i++) { ax[i] = 0; ay[i] = 0; }
    let tMin = 1;
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      const dx = x[j] - x[i], dy = y[j] - y[i];
      const r2 = dx * dx + dy * dy + EPS2, r = Math.sqrt(r2), inv = 1 / (r2 * r);
      ax[i] += m[j] * dx * inv; ay[i] += m[j] * dy * inv;
      ax[j] -= m[i] * dx * inv; ay[j] -= m[i] * dy * inv;
      tMin = Math.min(tMin, Math.sqrt(r2 * r / (m[i] + m[j])));
    }
    return tMin;
  }
  let tScale = 1;
  function stepB(dt) { // kick, drift, kick
    const { n, x, y, vx, vy, ax, ay } = B;
    for (let i = 0; i < n; i++) { vx[i] += ax[i] * dt * 0.5; vy[i] += ay[i] * dt * 0.5; x[i] += vx[i] * dt; y[i] += vy[i] * dt; }
    tScale = accel();
    for (let i = 0; i < n; i++) { vx[i] += ax[i] * dt * 0.5; vy[i] += ay[i] * dt * 0.5; }
  }
  // A mass has left for good when it is far out, moving away, and faster than the rest can call back.
  function escaped() {
    const { n, x, y, vx, vy, m } = B;
    for (let i = 0; i < n; i++) {
      let M = 0, cx = 0, cy = 0, cvx = 0, cvy = 0;
      for (let j = 0; j < n; j++) if (j !== i) { M += m[j]; cx += m[j] * x[j]; cy += m[j] * y[j]; cvx += m[j] * vx[j]; cvy += m[j] * vy[j]; }
      cx /= M; cy /= M; cvx /= M; cvy /= M;
      const dx = x[i] - cx, dy = y[i] - cy, dvx = vx[i] - cvx, dvy = vy[i] - cvy, r = Math.hypot(dx, dy);
      if (r > 6 * run.R) return true;
      if (r > 3 * run.R && dx * dvx + dy * dvy > 0 && 0.5 * (dvx * dvx + dvy * dvy) - M / r > 0) return true;
    }
    return false;
  }

  const run = { R: 1, age: 0, end: -1, reseedAll: true, clear: false };
  const view = { r: 1.2 };
  const last = new Array(MAXB).fill(null); // last trail vertex per mass: [x, y, heat]
  const heatOf = (i) => { const v = Math.hypot(B.vx[i], B.vy[i]); return v / (v + 1.2); };
  function newRun() {
    let th;
    do { th = [0, 1, 2].map(() => Math.random() * Math.PI * 2).sort((a, b) => a - b); }
    while (Math.min(th[1] - th[0], th[2] - th[1], th[0] + Math.PI * 2 - th[2]) < 1.1);
    B.n = 3;
    let cx = 0, cy = 0;
    for (let i = 0; i < 3; i++) {
      const r = 0.6 + 0.4 * Math.random();
      B.x[i] = r * Math.cos(th[i]); B.y[i] = r * Math.sin(th[i]);
      B.vx[i] = 0; B.vy[i] = 0; B.m[i] = 1;
      cx += B.x[i] / 3; cy += B.y[i] / 3;
    }
    let R = 0;
    for (let i = 0; i < 3; i++) { B.x[i] -= cx; B.y[i] -= cy; R = Math.max(R, Math.hypot(B.x[i], B.y[i])); }
    Object.assign(run, { R, age: 0, end: -1, reseedAll: true, clear: true });
    view.r = R * 1.3;
    last.fill(null);
    tScale = accel();
  }
  newRun();

  // Bodies' positions at the end of each dust step this frame.
  const ck = Array.from({ length: 8 }, () => new Float32Array(MAXB * 3));
  const strips = Array.from({ length: MAXB }, () => []);
  function record(k) {
    const c = ck[k];
    for (let i = 0; i < MAXB; i++) { c[i * 3] = B.x[i]; c[i * 3 + 1] = B.y[i]; c[i * 3 + 2] = i < B.n ? B.m[i] : 0; }
  }
  function advance(T, thr) {
    for (let i = 0; i < B.n; i++) {
      strips[i].length = 0;
      if (!last[i]) last[i] = [B.x[i], B.y[i], heatOf(i)];
      strips[i].push(...last[i]);
    }
    let t = 0, k = 0, iter = 0;
    while (t < T && iter < 4000) {
      const mark = (k + 1) * T / K;
      const dt = Math.max(1e-6, Math.min(0.02 * tScale, 0.01, mark - t));
      stepB(dt); t += dt; iter++;
      for (let i = 0; i < B.n; i++) {
        // Lay points every thr along the step, so a long step leaves a solid line, not a dash.
        const L = last[i], d = Math.hypot(B.x[i] - L[0], B.y[i] - L[1]);
        if (d < thr) continue;
        const h = heatOf(i), ux = (B.x[i] - L[0]) / d, uy = (B.y[i] - L[1]) / d;
        for (let s = thr; s <= d && strips[i].length < MAXV * 3; s += thr) strips[i].push(L[0] + ux * s, L[1] + uy * s, h);
        L[0] = strips[i][strips[i].length - 3]; L[1] = strips[i][strips[i].length - 2]; L[2] = h;
      }
      while (k < K && t >= (k + 1) * T / K - 1e-12) record(k++);
    }
    while (k < K) record(k++); // the step cap was hit on a very close pass: the masses run slow for a moment
  }

  // A click on the hero drops another mass, at rest, where you clicked. Past five, it starts again.
  let map = { sx: 1, sy: 1, zx: 0, zy: 0 };
  const hero = document.querySelector(".hero");
  hero?.addEventListener("click", (e) => {
    if (e.target.closest("a, button")) return;
    if (B.n >= MAXB) { if (run.end < 0) run.end = 0.6; return; }
    const r = cv.getBoundingClientRect();
    const nx = ((e.clientX - r.left) / r.width) * 2 - 1, ny = 1 - ((e.clientY - r.top) / r.height) * 2;
    const i = B.n++;
    B.x[i] = (nx - map.zx) / map.sx; B.y[i] = (ny - map.zy) / map.sy;
    B.vx[i] = 0; B.vy[i] = 0; B.m[i] = 1;
    last[i] = null;
    tScale = accel();
  });

  let frame = 0, step = 0, slow = 0, last_t = 0, raf = 0, shown = false;
  function tick(now) {
    raf = requestAnimationFrame(tick);
    const dt = last_t ? Math.min(0.05, (now - last_t) / 1000) : 1 / 60;
    last_t = now;
    resize();
    if (broken) { cancelAnimationFrame(raf); raf = 0; return; }

    // Drop a dust step per frame while frames are coming in slow.
    slow = dt > 1 / 40 ? slow + dt : Math.max(0, slow - dt * 0.5);
    if (slow > 1 && K > 1) { K--; slow = 0; }

    // Ending: fade out, then drop a new triangle. Runs also end after two minutes.
    run.age += dt;
    if (run.end < 0 && (run.age > 120 || escaped())) run.end = 1.2;
    if (run.end >= 0) { run.end -= dt; if (run.end < 0) newRun(); }

    // Frame the masses on the right on wide screens, so the words on the left stay readable.
    let need = run.R * 1.3;
    if (run.end < 0) for (let i = 0; i < B.n; i++) need = Math.max(need, Math.hypot(B.x[i], B.y[i]) * 1.1);
    need = Math.min(need, run.R * 2.6);
    view.r += (need - view.r) * (1 - Math.exp(-dt / 1.5));
    const aspect = W / H, wide = aspect > 1.2;
    let sy = (wide ? 0.86 : 0.7) / view.r, sx = sy / aspect;
    const room = wide ? 0.5 : 0.94;
    if (view.r * sx > room) { const f = room / (view.r * sx); sx *= f; sy *= f; }
    map = { sx, sy, zx: wide ? 0.42 : 0, zy: wide ? 0 : 0.25 };

    advance(SPEED * dt, 0.4 / (sy * H * 0.5));

    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.viewport(0, 0, W, H);
    if (run.clear) { gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); run.clear = false; }
    gl.enable(gl.BLEND);
    const ending = run.end >= 0;
    const dD = Math.pow(0.5, dt / (ending ? 0.12 : DUST_HALF)), dT = Math.pow(0.5, dt / (ending ? 0.25 : TRAIL_HALF));
    gl.useProgram(P_FADE.p);
    gl.bindVertexArray(emptyVao);
    gl.blendFunc(gl.ZERO, gl.CONSTANT_COLOR);
    gl.blendColor(dD, dD, dT, dT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // The dust, K steps, each in the field of the masses at that moment.
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.useProgram(P_DUST.p);
    gl.uniform1i(P_DUST.u.uNB, B.n);
    gl.uniform1f(P_DUST.u.uDt, SPEED * dt / K);
    gl.uniform1f(P_DUST.u.uR0, run.R * 1.5);
    gl.uniform1f(P_DUST.u.uFar, run.R * 3.5);
    gl.uniform4f(P_DUST.u.uMap, map.sx, map.sy, map.zx, map.zy);
    for (let s = 0; s < K; s++) {
      const src = step & 1, dst = src ^ 1;
      gl.uniform3fv(P_DUST.u.uB, ck[s]);
      gl.uniform1ui(P_DUST.u.uSeed, step >>> 0);
      gl.uniform1ui(P_DUST.u.uReseed, run.reseedAll ? 10000 : Math.max(1, Math.round(30 / K)));
      run.reseedAll = false;
      gl.bindVertexArray(vaos[src]);
      gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, tfs[dst]);
      gl.beginTransformFeedback(gl.POINTS);
      gl.drawArrays(gl.POINTS, 0, N);
      gl.endTransformFeedback();
      gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
      step++;
    }

    // The masses' trails, then a brighter point where each one is now.
    let n = 0;
    const segs = [];
    for (let i = 0; i < B.n; i++) {
      const s = strips[i];
      if (s.length >= 6) { trailData.set(s, n * 3); segs.push([n, s.length / 3]); n += s.length / 3; }
    }
    const heads = n;
    for (let i = 0; i < B.n; i++) { trailData[n * 3] = B.x[i]; trailData[n * 3 + 1] = B.y[i]; trailData[n * 3 + 2] = heatOf(i); n++; }
    gl.useProgram(P_TRAIL.p);
    gl.uniform4f(P_TRAIL.u.uMap, map.sx, map.sy, map.zx, map.zy);
    gl.bindVertexArray(trailVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, trailBuf);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, trailData, 0, n * 3);
    gl.uniform1f(P_TRAIL.u.uW, 1);
    gl.uniform1f(P_TRAIL.u.uSize, Math.max(2, Math.round(H / 450))); // soft-edged, about a CSS pixel wide
    for (const [off, cnt] of segs) gl.drawArrays(gl.POINTS, off + 1, cnt - 1); // the first is last frame's
    gl.uniform1f(P_TRAIL.u.uW, 2.5);
    gl.uniform1f(P_TRAIL.u.uSize, Math.max(2, Math.round(H / 500)));
    gl.drawArrays(gl.POINTS, heads, n - heads);
    gl.bindVertexArray(null);
    gl.disable(gl.BLEND);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, W, H);
    gl.useProgram(P_SHOW.p);
    gl.bindVertexArray(emptyVao);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, acc);
    gl.uniform1i(P_SHOW.u.uAcc, 0);
    gl.uniform1f(P_SHOW.u.uInvMean, (W * H) * (1 - dD) / (N * K));
    gl.uniform1f(P_SHOW.u.uLogD, LOGD);
    gl.uniform1f(P_SHOW.u.uGainT, GAIN_T);
    gl.uniform1f(P_SHOW.u.uLogT, LOGT);
    gl.uniform3fv(P_SHOW.u.uH, HEAT.flat());
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    frame++;
    if (!shown && frame > 60) { shown = true; cv.classList.add("is-live"); }
  }

  loop(cv.closest("[data-loop]"),
    () => { if (!raf) { last_t = 0; raf = requestAnimationFrame(tick); } },
    () => { cancelAnimationFrame(raf); raf = 0; });
})();
