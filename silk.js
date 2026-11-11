"use strict";
// Clifford attractors drifting on the GPU, adapted from the Clifford Silk wallpaper. It is the ground of the whole page.
//   x' = sin(a y) + c cos(a x),   y' = sin(b x) + d cos(b y)
// Points live on the GPU and take several steps of the map per frame (transform feedback), each landing added into a
// float canvas that fades a little every frame. Brightness is the log of how often the map lands on a pixel; colour is
// the mean direction of those jumps, between Espresso's eye green and her amber. a, b, c, d drift slowly; a CPU check
// spots shapes that collapse and hurries the drift past them.
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

  // The attractor.
  const cv = document.getElementById("silk");
  if (!cv) return;
  const gl = cv.getContext("webgl2", { antialias: false, alpha: false, depth: false, stencil: false });
  if (!gl) return; // the still image stays
  gl.getExtension("EXT_color_buffer_float");
  const floatBlend = !!gl.getExtension("EXT_float_blend");
  const [IFMT, TYPE] = floatBlend ? [gl.RGBA32F, gl.FLOAT] : [gl.RGBA16F, gl.HALF_FLOAT];

  // Espresso: the ground of the page, up through her eye colour (A) or her amber (B), to near white.
  // Which ramp a pixel uses comes from the maths: the direction the map throws the points that land there.
  const PAL_A = [[0.11, 0.09, 0.07], [0.19, 0.19, 0.06], [0.42, 0.48, 0.09], [0.73, 0.81, 0.22], [0.93, 0.96, 0.6], [1, 1, 0.93]];
  const PAL_B = [[0.11, 0.09, 0.07], [0.23, 0.12, 0.06], [0.56, 0.29, 0.09], [0.87, 0.57, 0.2], [0.98, 0.85, 0.58], [1, 0.98, 0.92]];
  const N = small.matches ? 140000 : 320000;
  const DECAY = 0.972;
  // Map steps per frame: each step lands every point somewhere new on the attractor. Backs off on slow machines.
  let K = small.matches ? 3 : 5;

  const HASH = `uint hash(uint x) { x ^= x >> 16u; x *= 0x7feb352du; x ^= x >> 15u; x *= 0x846ca68bu; x ^= x >> 16u; return x; }`;
  const VS_POINTS = `#version 300 es
precision highp float; precision highp int;
in vec2 aPos;
uniform vec4 uP; uniform uint uFrame; uniform uint uReseed; uniform vec4 uMap;
out vec2 vPos; out vec2 vOri;
${HASH}
vec2 stepC(vec2 q) { return vec2(sin(uP.x * q.y) + uP.z * cos(uP.x * q.x), sin(uP.y * q.x) + uP.w * cos(uP.y * q.y)); }
void main() {
  vec2 p = aPos;
  uint h = hash(uint(gl_VertexID) ^ (uFrame * 0x9E3779B9u));
  if ((h % 10000u) < uReseed || any(isnan(p)) || abs(p.x) > 8.0 || abs(p.y) > 8.0) {
    uint h2 = hash(h + 0x68E31DA4u);
    p = vec2(float(h & 0xffffu), float(h2 & 0xffffu)) / 32768.0 - 1.0;
    for (int i = 0; i < 12; i++) p = stepC(p);
  }
  vec2 n = stepC(p);
  // The orientation of the jump (angle doubled, so opposite jumps agree) as cos 2t, sin 2t.
  vec2 d = n - p;
  vec2 u = d / max(length(d), 1e-6);
  vOri = vec2(u.x * u.x - u.y * u.y, 2.0 * u.x * u.y);
  vPos = n;
  gl_Position = vec4(n * uMap.xy + uMap.zw, 0.0, 1.0);
  gl_PointSize = 1.0;
}`;
  const FS_POINTS = `#version 300 es
precision highp float; in vec2 vOri; out vec4 o; void main() { o = vec4(1.0, vOri, 0.0); }`;
  const VS_QUAD = `#version 300 es
void main() { vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2)); gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0); }`;
  const FS_FADE = `#version 300 es
precision highp float; out vec4 o; void main() { o = vec4(0.0); }`;
  const FS_SHOW = `#version 300 es
precision highp float;
uniform sampler2D uAcc; uniform float uInvMean; uniform float uLogMax; uniform float uPhase; uniform vec3 uA[6]; uniform vec3 uB[6];
out vec4 o;
vec3 rampA(float t) { t = clamp(t, 0.0, 1.0) * 5.0; int i = int(min(floor(t), 4.0)); return mix(uA[i], uA[i + 1], t - float(i)); }
vec3 rampB(float t) { t = clamp(t, 0.0, 1.0) * 5.0; int i = int(min(floor(t), 4.0)); return mix(uB[i], uB[i + 1], t - float(i)); }
void main() {
  vec4 a = texelFetch(uAcc, ivec2(gl_FragCoord.xy), 0);
  // Brightness: log of how often the map lands here, so the folds burn white and single threads stay fine.
  float v = clamp(log(1.0 + a.r * uInvMean) / uLogMax, 0.0, 1.0);
  v = v * v * (3.0 - 2.0 * v);
  // Hue: the mean orientation of the jumps that landed here, turning slowly.
  vec2 m = a.r > 0.0 ? a.gb / a.r : vec2(0.0);
  float k = clamp(length(m), 0.0, 1.0);
  float s = k > 1e-4 ? 0.5 + 0.5 * k * cos(atan(m.y, m.x) + uPhase) : 0.5;
  o = vec4(mix(rampA(v), rampB(v), s), 1.0);
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

  let P_POINTS, P_FADE, P_SHOW;
  try {
    P_POINTS = program(VS_POINTS, FS_POINTS, ["vPos"]);
    P_FADE = program(VS_QUAD, FS_FADE);
    P_SHOW = program(VS_QUAD, FS_SHOW);
  } catch (e) { return; }

  const startPos = new Float32Array(N * 2);
  for (let i = 0; i < startPos.length; i++) startPos[i] = Math.random() * 2 - 1;
  const bufs = [0, 1].map(() => {
    const b = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, startPos, gl.DYNAMIC_COPY);
    return b;
  });
  const aPos = gl.getAttribLocation(P_POINTS.p, "aPos");
  const vaos = bufs.map((b) => {
    const v = gl.createVertexArray();
    gl.bindVertexArray(v);
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
    return v;
  });
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  const tfs = bufs.map((b) => {
    const t = gl.createTransformFeedback();
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, t);
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, b);
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
    return t;
  });
  const emptyVao = gl.createVertexArray();

  let acc = null, fbo = null, W = 0, H = 0;
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
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  function params(t) {
    return [
      1.95 * Math.sin(0.0213 * t + 0.4),
      1.95 * Math.sin(0.0171 * t + 2.3),
      1.30 * Math.sin(0.0129 * t + 1.1) + 0.25 * Math.sin(0.031 * t),
      1.30 * Math.sin(0.0097 * t + 4.0) + 0.25 * Math.sin(0.027 * t + 1.0),
    ];
  }
  const health = { ok: true, cx: 0, cy: 0, hx: 2, hy: 2 };
  function check([a, b, c, d]) {
    let x = 0.1, y = 0.13;
    for (let i = 0; i < 300; i++) { const nx = Math.sin(a * y) + c * Math.cos(a * x); y = Math.sin(b * x) + d * Math.cos(b * y); x = nx; }
    const xs = new Float32Array(6000), ys = new Float32Array(6000);
    for (let i = 0; i < 6000; i++) {
      const nx = Math.sin(a * y) + c * Math.cos(a * x); y = Math.sin(b * x) + d * Math.cos(b * y); x = nx;
      xs[i] = x; ys[i] = y;
    }
    const sx = Float32Array.from(xs).sort(), sy = Float32Array.from(ys).sort();
    const x0 = sx[30], x1 = sx[5969], y0 = sy[30], y1 = sy[5969];
    const seen = new Uint8Array(48 * 48);
    let cells = 0;
    for (let i = 0; i < 6000; i++) {
      const gx = Math.min(47, Math.max(0, Math.floor((xs[i] - x0) / (x1 - x0 + 1e-9) * 48)));
      const gy = Math.min(47, Math.max(0, Math.floor((ys[i] - y0) / (y1 - y0 + 1e-9) * 48)));
      if (!seen[gy * 48 + gx]) { seen[gy * 48 + gx] = 1; cells++; }
    }
    health.ok = cells > 160 && (x1 - x0) > 0.6 && (y1 - y0) > 0.6;
    if (health.ok) Object.assign(health, { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, hx: (x1 - x0) / 2 * 1.06, hy: (y1 - y0) / 2 * 1.06 });
  }

  let clock = (Date.now() / 1000) % 100000;
  let frame = 0, step = 0, slow = 0, last = 0, lastCheck = 0, raf = 0, shown = false;
  const LOGMAX = small.matches ? 28 : 48; // hits per pixel, as a multiple of the mean, that reads as full white
  check(params(clock));
  const view = { cx: health.cx, cy: health.cy, hx: health.hx, hy: health.hy };

  // The visitor can play: the pointer bends a and b anywhere on the page; a click on the hero jumps to another stretch of parameter space.
  const bend = { x: 0, y: 0 }, bendTo = { x: 0, y: 0 };
  addEventListener("pointermove", (e) => {
    bendTo.x = (e.clientX / innerWidth - 0.5) * 0.5;
    bendTo.y = (e.clientY / innerHeight - 0.5) * 0.5;
  }, { passive: true });
  document.addEventListener("pointerleave", () => { bendTo.x = 0; bendTo.y = 0; });
  const hero = document.querySelector(".hero");
  hero?.addEventListener("click", (e) => {
    if (e.target.closest("a, button")) return;
    clock += 60 + Math.random() * 140;
    check(params(clock));
  });

  function tick(now) {
    raf = requestAnimationFrame(tick);
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 1 / 60;
    last = now;
    resize();
    if (now - lastCheck > 200) { check(params(clock)); lastCheck = now; }
    clock += dt * (health.ok ? 1 : 30);
    const kb = 1 - Math.exp(-dt / 0.6);
    bend.x += (bendTo.x - bend.x) * kb; bend.y += (bendTo.y - bend.y) * kb;
    const p = params(clock);
    p[0] += bend.x; p[1] += bend.y;
    const k = 1 - Math.exp(-dt / 0.9);
    for (const key of ["cx", "cy", "hx", "hy"]) view[key] += (health[key] - view[key]) * k;

    // Frame the shape on the right on wide screens, so the words on the left stay readable.
    const aspect = W / H, wide = aspect > 1.2;
    const fill = wide ? 0.84 : 0.7;
    let sy = fill / view.hy, sx = sy / aspect;
    const room = wide ? 0.5 : 0.94;
    if (view.hx * sx > room) { const f = room / (view.hx * sx); sx *= f; sy *= f; }
    const shift = wide ? 0.42 : 0;
    const lift = wide ? 0 : 0.25;

    // Drop a step per frame while frames are coming in slow.
    slow = dt > 1 / 40 ? slow + dt : Math.max(0, slow - dt * 0.5);
    if (slow > 1 && K > 1) { K--; slow = 0; }

    const decay = Math.pow(DECAY, dt * 144);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.viewport(0, 0, W, H);
    gl.enable(gl.BLEND);
    gl.useProgram(P_FADE.p);
    gl.bindVertexArray(emptyVao);
    gl.blendFunc(gl.ZERO, gl.CONSTANT_COLOR);
    gl.blendColor(decay, decay, decay, decay);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    gl.useProgram(P_POINTS.p);
    gl.uniform4f(P_POINTS.u.uP, p[0], p[1], p[2], p[3]);
    gl.uniform1ui(P_POINTS.u.uReseed, Math.max(1, Math.round((health.ok ? 60 : 400) / K)));
    gl.uniform4f(P_POINTS.u.uMap, sx, sy, -view.cx * sx + shift, -view.cy * sy + lift);
    gl.blendFunc(gl.ONE, gl.ONE);
    for (let s = 0; s < K; s++) {
      const src = step & 1, dst = src ^ 1;
      gl.uniform1ui(P_POINTS.u.uFrame, step >>> 0);
      gl.bindVertexArray(vaos[src]);
      gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, tfs[dst]);
      gl.beginTransformFeedback(gl.POINTS);
      gl.drawArrays(gl.POINTS, 0, N);
      gl.endTransformFeedback();
      gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
      step++;
    }
    gl.bindVertexArray(null);
    gl.disable(gl.BLEND);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, W, H);
    gl.useProgram(P_SHOW.p);
    gl.bindVertexArray(emptyVao);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, acc);
    gl.uniform1i(P_SHOW.u.uAcc, 0);
    const mean = N * K / (1 - decay) / (W * H);
    gl.uniform1f(P_SHOW.u.uInvMean, 1 / mean);
    gl.uniform1f(P_SHOW.u.uLogMax, Math.log(1 + LOGMAX));
    gl.uniform1f(P_SHOW.u.uPhase, clock * 0.06);
    gl.uniform3fv(P_SHOW.u.uA, PAL_A.flat());
    gl.uniform3fv(P_SHOW.u.uB, PAL_B.flat());
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    frame++;
    if (!shown && frame > 90) { shown = true; cv.classList.add("is-live"); }
  }

  loop(cv.closest("[data-loop]"),
    () => { if (!raf) { last = 0; raf = requestAnimationFrame(tick); } },
    () => { cancelAnimationFrame(raf); raf = 0; });
})();
