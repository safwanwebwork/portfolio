(() => {
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const hasGSAP = !!window.gsap && !!window.ScrollTrigger;

  $('#year').textContent = new Date().getFullYear();

  /* nav */
  const nav = $('#nav'), menu = $('#menu');
  menu.addEventListener('click', () => nav.classList.toggle('open'));
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));

  /* no-GSAP safe fallback: show everything, simple filter, then stop */
  function plainFilter() {
    $$('.filter-btn').forEach(b => b.addEventListener('click', () => {
      $$('.filter-btn').forEach(x => x.classList.remove('active')); b.classList.add('active');
      const f = b.dataset.filter; $$('.project').forEach(p => p.hidden = f !== 'all' && p.dataset.category !== f);
    }));
  }
  if (!hasGSAP || reduce) {
    $('#preloader').style.display = 'none';
    $$('.stack-item').forEach(c => c.addEventListener('pointermove', e => { const r = c.getBoundingClientRect(); c.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%'); c.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%') }));
    plainFilter();
    initThree(null);
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* smooth scroll */
  const lenis = new Lenis({ duration: 1.15, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.stop();
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href'); if (id.length < 2) return;
    const t = $(id); if (!t) return; e.preventDefault(); lenis.scrollTo(t, { offset: id === '#home' ? 0 : -60, duration: 1.4 });
  }));

  /* progress + nav behaviour */
  const prog = $('#progress'), top = $('#top');
  ScrollTrigger.create({ start: 0, end: 'max', onUpdate: s => { prog.style.transform = `scaleX(${s.progress})` } });
  let lastY = 0;
  lenis.on('scroll', ({ scroll }) => {
    const down = scroll > lastY && scroll > 220;
    gsap.to(top, { yPercent: down ? -100 : 0, duration: .45, ease: 'power3.out', overwrite: true });
    lastY = scroll;
  });
  ['home', 'work', 'about', 'stack', 'contact'].forEach(id => {
    const el = document.getElementById(id); if (!el) return;
    ScrollTrigger.create({
      trigger: el, start: 'top 55%', end: 'bottom 55%',
      onToggle: s => { if (s.isActive) $$('.navmid a').forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + id)) }
    });
  });

  /* cursor */
  if (fine) {
    document.documentElement.classList.add('has-cursor');
    const dot = $('#cDot'), ring = $('#cRing');
    const dx = gsap.quickTo(dot, 'x', { duration: .08 }), dy = gsap.quickTo(dot, 'y', { duration: .08 });
    const rx = gsap.quickTo(ring, 'x', { duration: .35, ease: 'power3' }), ry = gsap.quickTo(ring, 'y', { duration: .35, ease: 'power3' });
    addEventListener('pointermove', e => { dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY) }, { passive: true });
    const on = (sel, cls) => $$(sel).forEach(el => { el.addEventListener('pointerenter', () => ring.classList.add(cls)); el.addEventListener('pointerleave', () => ring.classList.remove(cls)) });
    on('a:not(.project), button', 'hover'); on('.project', 'view');
  }

  /* magnetic */
  if (fine) $$('[data-magnetic]').forEach(el => {
    const mx = gsap.quickTo(el, 'x', { duration: .5, ease: 'power3' }), my = gsap.quickTo(el, 'y', { duration: .5, ease: 'power3' });
    el.addEventListener('pointermove', e => { const r = el.getBoundingClientRect(); mx((e.clientX - r.left - r.width / 2) * .28); my((e.clientY - r.top - r.height / 2) * .35) });
    el.addEventListener('pointerleave', () => { mx(0); my(0) });
  });

  /* tilt cards */
  function tilt(el, max, lift) {
    const rx = gsap.quickTo(el, 'rotationX', { duration: .5, ease: 'power3' }), ry = gsap.quickTo(el, 'rotationY', { duration: .5, ease: 'power3' });
    el.addEventListener('pointermove', e => {
      if (e.pointerType === 'touch') return;
      const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      ry((x - .5) * max); rx((.5 - y) * max);
      el.style.setProperty('--gx', x * 100 + '%'); el.style.setProperty('--gy', y * 100 + '%');
      el.style.setProperty('--mx', x * 100 + '%'); el.style.setProperty('--my', y * 100 + '%');
    });
    el.addEventListener('pointerenter', () => gsap.to(el, { z: lift, duration: .4, ease: 'power3.out' }));
    el.addEventListener('pointerleave', () => { rx(0); ry(0); gsap.to(el, { z: 0, duration: .5, ease: 'power3.out' }) });
  }
  if (fine) { $$('.project').forEach(c => tilt(c, 9, 14)); $$('.stack-item').forEach(c => tilt(c, 16, 10)); }
  else $$('.stack-item').forEach(c => c.addEventListener('pointermove', e => { const r = c.getBoundingClientRect(); c.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%'); c.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%') }));

  /* ticker driven by scroll velocity */
  const tween = gsap.to('#tickerTrack', { xPercent: -50, repeat: -1, duration: 26, ease: 'none' });
  lenis.on('scroll', ({ velocity }) => { gsap.to(tween, { timeScale: 1 + Math.min(6, Math.abs(velocity) * .5), duration: .2, overwrite: true }); gsap.to(tween, { timeScale: 1, duration: 1.2, delay: .2 }) });

  /* reveals */
  gsap.set('[data-rv]', { y: 36, opacity: 0 });
  ScrollTrigger.batch('[data-rv]', { start: 'top 88%', once: true, onEnter: b => gsap.to(b, { y: 0, opacity: 1, duration: .9, ease: 'power3.out', stagger: .1 }) });
  gsap.set('.project', { y: 50, opacity: 0 });
  ScrollTrigger.batch('.project', { start: 'top 92%', once: true, onEnter: b => gsap.to(b, { y: 0, opacity: 1, duration: .9, ease: 'power3.out', stagger: .09 }) });
  gsap.set('.stack-item', { y: 24, opacity: 0, scale: .9 });
  ScrollTrigger.batch('.stack-item', { start: 'top 92%', once: true, onEnter: b => gsap.to(b, { y: 0, opacity: 1, scale: 1, duration: .7, ease: 'back.out(1.6)', stagger: .05 }) });
  gsap.set('.step', { y: 24, opacity: 0 });
  ScrollTrigger.create({
    trigger: '.steps', start: 'top 85%', once: true, onEnter: () => {
      gsap.to('#stepsLine', { scaleX: 1, duration: 1.4, ease: 'power3.inOut' });
      gsap.to('.step', { y: 0, opacity: 1, duration: .8, stagger: .15, ease: 'power3.out' });
    }
  });

  /* counters */
  $$('[data-count]').forEach(el => {
    const end = +el.dataset.count, o = { v: 0 }; el.textContent = '0';
    ScrollTrigger.create({ trigger: '#stats', start: 'top 90%', once: true, onEnter: () => gsap.to(o, { v: end, duration: 1.6, ease: 'power2.out', onUpdate: () => el.textContent = Math.round(o.v) }) });
  });

  /* project filter with animated re-layout */
  const cards = $$('.project');
  $$('.filter-btn').forEach(btn => btn.addEventListener('click', () => {
    $$('.filter-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active');
    const f = btn.dataset.filter, out = cards.filter(c => !c.hidden && f !== 'all' && c.dataset.category !== f);
    const swap = () => {
      cards.forEach(c => c.hidden = f !== 'all' && c.dataset.category !== f);
      const vis = cards.filter(c => !c.hidden);
      gsap.fromTo(vis, { y: 36, opacity: 0, scale: .96 }, { y: 0, opacity: 1, scale: 1, duration: .6, stagger: .07, ease: 'power3.out', clearProps: 'scale', onComplete: () => ScrollTrigger.refresh() });
    };
    if (out.length || cards.some(c => c.hidden)) gsap.to(cards.filter(c => !c.hidden), { opacity: 0, y: -14, duration: .25, stagger: .03, ease: 'power2.in', onComplete: swap }); else swap();
  }));

  /* about 3D mini-scene */
  initAbout();

  /* hero intro timeline, then start page */
  const state = { p: 0 };
  const heroLines = $$('h1 .ln > span');
  gsap.set(heroLines, { yPercent: 115 });
  gsap.set('[data-hero="fade"]', { y: 22, opacity: 0 });
  gsap.set('[data-hero="stage"]', { opacity: 0, scale: .94, y: 30 });
  gsap.set('.top', { yPercent: -100 });
  gsap.set('.float', { opacity: 0, y: 14 });

  const pre = { n: 0 };
  const intro = gsap.timeline({ defaults: { ease: 'power3.out' } });
  intro.to('#preBar', { scaleX: 1, duration: 1.5, ease: 'power2.inOut' }, 0)
    .to(pre, { n: 100, duration: 1.5, ease: 'power2.inOut', onUpdate: () => $('#preNum').textContent = Math.round(pre.n) }, 0)
    .to('#preloader', { yPercent: -100, duration: .9, ease: 'power4.inOut', onStart: () => lenis.start() }, '+=.15')
    .to(heroLines, { yPercent: 0, duration: 1.1, stagger: .12, ease: 'power4.out' }, '-=.35')
    .to('[data-hero="fade"]', { y: 0, opacity: 1, duration: .8, stagger: .08 }, '-=.8')
    .to('[data-hero="stage"]', { opacity: 1, scale: 1, y: 0, duration: 1.2 }, '-=1')
    .to('.top', { yPercent: 0, duration: .7 }, '-=.9')
    .to('.float', { opacity: 1, y: 0, duration: .7, stagger: .12 }, '-=.6')
    .set('#preloader', { display: 'none' });

  /* hero scene scroll-scrub + float parallax */
  gsap.to(state, { p: 1, ease: 'none', scrollTrigger: { trigger: '#home', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('#stage', { yPercent: -6, ease: 'none', scrollTrigger: { trigger: '#home', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero-copy', { yPercent: -10, opacity: .35, ease: 'none', scrollTrigger: { trigger: '#home', start: 'top top', end: 'bottom top', scrub: true } });
  $$('.float').forEach((f, i) => gsap.to(f, { y: '+=10', duration: 2.6 + i * .5, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: i * .3 }));
  gsap.to('#logoR', { rotation: 360, duration: 8, repeat: -1, ease: 'none' });

  initThree(state);
  initBackground(lenis);

  /* ---------- Three: hero ---------- */
  function tileTexture(label, accent) {
    const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
    const r = 36; g.beginPath(); g.moveTo(r, 8); g.arcTo(248, 8, 248, 248, r); g.arcTo(248, 248, 8, 248, r); g.arcTo(8, 248, 8, 8, r); g.arcTo(8, 8, 248, 8, r); g.closePath();
    const gr = g.createLinearGradient(0, 0, 256, 256); gr.addColorStop(0, '#2d211a'); gr.addColorStop(1, '#17110e'); g.fillStyle = gr; g.fill();
    g.lineWidth = 3; g.strokeStyle = accent; g.stroke();
    g.fillStyle = accent; g.fillRect(40, 54, 34, 5);
    g.fillStyle = '#f4e8d9'; g.font = '700 ' + (label.length > 6 ? 38 : 56) + 'px DM Mono, monospace'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(label, 128, 134);
    g.fillStyle = '#8b7768'; g.font = '500 20px DM Mono, monospace'; g.fillText('// stack', 128, 206);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
  }
})();

/* The helpers below are hoisted function declarations at script level so both code paths can use them. */
function initThree(state) {
  const canvas = document.getElementById('scene'), stage = document.getElementById('stage');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!window.THREE || !canvas) { if (canvas) canvas.style.display = 'none'; return; }
  try {
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.7)); renderer.setSize(stage.clientWidth, stage.clientHeight, false); renderer.outputColorSpace = THREE.SRGBColorSpace;
    const scene = new THREE.Scene(); scene.fog = new THREE.FogExp2(0x1d140e, .05);
    const camera = new THREE.PerspectiveCamera(36, stage.clientWidth / stage.clientHeight, .1, 100); camera.position.set(0, 0, 8);
    scene.add(new THREE.AmbientLight(0xffd8bd, 1.5));
    const key = new THREE.DirectionalLight(0xffc69a, 4); key.position.set(3, 5, 6); scene.add(key);
    const rim = new THREE.PointLight(0xff4d20, 42, 14); rim.position.set(-3, 1, 3); scene.add(rim);
    const gold = new THREE.PointLight(0xffc18b, 18, 12); gold.position.set(3, -2, 2); scene.add(gold);
    const rig = new THREE.Group(); scene.add(rig);

    /* core */
    const core = new THREE.Group(); rig.add(core);
    const chip = new THREE.Mesh(new THREE.BoxGeometry(1.28, 1.28, .38), new THREE.MeshPhysicalMaterial({ color: 0x27201c, metalness: .86, roughness: .22, clearcoat: 1, clearcoatRoughness: .1, emissive: 0x301005, emissiveIntensity: .55 })); core.add(chip);
    core.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.3, 1.3, .4)), new THREE.LineBasicMaterial({ color: 0xff8a55, transparent: true, opacity: .95 })));
    const inner = new THREE.Mesh(new THREE.OctahedronGeometry(.48, 1), new THREE.MeshPhysicalMaterial({ color: 0xff713d, metalness: .5, roughness: .16, emissive: 0xff3e12, emissiveIntensity: 1.2, clearcoat: 1 })); core.add(inner);
    const wire = new THREE.Mesh(new THREE.OctahedronGeometry(.66, 1), new THREE.MeshBasicMaterial({ color: 0xffc39b, wireframe: true, transparent: true, opacity: .7 })); core.add(wire);
    const glow = new THREE.Mesh(new THREE.SphereGeometry(.9, 32, 32), new THREE.MeshBasicMaterial({ color: 0xff642f, transparent: true, opacity: .07, depthWrite: false })); core.add(glow);

    /* rails */
    const mk = (r, t, c, o, rot) => { const m = new THREE.Mesh(new THREE.TorusGeometry(r, t, 8, 200), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o })); m.rotation.set(...rot); rig.add(m); return m };
    const rA = mk(1.45, .012, 0xff8b54, .78, [1.08, .25, .35]), rB = mk(1.78, .008, 0xffd0a5, .42, [.4, -.9, .2]), rC = mk(2.05, .006, 0xff642f, .55, [-.6, .15, .9]);
    const reticle = new THREE.Mesh(new THREE.RingGeometry(2.28, 2.292, 128), new THREE.MeshBasicMaterial({ color: 0xffb47d, transparent: true, opacity: .2, side: THREE.DoubleSide })); rig.add(reticle);
    const ticks = new THREE.Group(); rig.add(ticks);
    for (let i = 0; i < 64; i++) { const a = i / 64 * Math.PI * 2, r1 = i % 4 === 0 ? 2.14 : 2.19, r2 = 2.25; ticks.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(Math.cos(a) * r1, Math.sin(a) * r1, 0), new THREE.Vector3(Math.cos(a) * r2, Math.sin(a) * r2, 0)]), new THREE.LineBasicMaterial({ color: 0xffa06e, transparent: true, opacity: i % 4 === 0 ? .65 : .22 }))); }

    /* circuit traces */
    const circuit = new THREE.Group(); rig.add(circuit); const dots = [];
    [[[-.68, .3, .05], [-1.12, .3, .05], [-1.12, .72, .05], [-1.48, .72, .05]], [[.68, .3, .05], [1.13, .3, .05], [1.13, .72, .05], [1.48, .72, .05]], [[-.68, -.3, .05], [-1.05, -.3, .05], [-1.05, -.72, .05], [-1.45, -.72, .05]], [[.68, -.3, .05], [1.05, -.3, .05], [1.05, -.72, .05], [1.45, -.72, .05]]].forEach((pts, i) => {
      circuit.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts.map(p => new THREE.Vector3(...p))), new THREE.LineBasicMaterial({ color: i % 2 ? 0xffbd8c : 0xff642f, transparent: true, opacity: .8 })));
      const d = new THREE.Mesh(new THREE.SphereGeometry(.045, 12, 12), new THREE.MeshBasicMaterial({ color: i % 2 ? 0xffd0a5 : 0xff642f })); d.position.set(...pts[pts.length - 1]); circuit.add(d); dots.push(d);
    });

    /* data packets */
    const packets = []; for (let i = 0; i < 10; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(i % 2 ? .075 : .05, i % 2 ? .075 : .05, .07), new THREE.MeshBasicMaterial({ color: i % 3 === 0 ? 0xff642f : 0xffd0a5 })); rig.add(m); packets.push({ m, ph: i / 10 * Math.PI * 2, r: 1.65 + (i % 3) * .18 }); }

    /* tech tiles orbiting */
    const labels = [['PHP', '#8892bf'], ['React', '#61dafb'], ['Next', '#f4e8d9'], ['MySQL', '#4aa3d8'], ['Laravel', '#ff5b4a'], ['API', '#ff8755'], ['Git', '#f05b3c']];
    const tiles = labels.map(([l, c], i) => {
      const t = tileTexture(l, c);
      const m = new THREE.Mesh(new THREE.PlaneGeometry(.62, .62), new THREE.MeshBasicMaterial({ map: t, transparent: true, side: THREE.DoubleSide, depthWrite: false }));
      m.userData = { a: i / labels.length * Math.PI * 2, r: 2.75, y: (i % 2 ? .45 : -.4) + Math.sin(i) * .3, s: .16 + (i % 3) * .03 };
      rig.add(m); return m;
    });
    function tileTexture(label, accent) {
      const cv = document.createElement('canvas'); cv.width = cv.height = 256; const g = cv.getContext('2d');
      const r = 36; g.beginPath(); g.moveTo(r, 8); g.arcTo(248, 8, 248, 248, r); g.arcTo(248, 248, 8, 248, r); g.arcTo(8, 248, 8, 8, r); g.arcTo(8, 8, 248, 8, r); g.closePath();
      const gr = g.createLinearGradient(0, 0, 256, 256); gr.addColorStop(0, '#2d211a'); gr.addColorStop(1, '#17110e'); g.fillStyle = gr; g.fill();
      g.lineWidth = 3; g.strokeStyle = accent; g.stroke(); g.fillStyle = accent; g.fillRect(40, 54, 34, 5);
      g.fillStyle = '#f4e8d9'; g.font = '700 ' + (label.length > 4 ? 44 : 64) + 'px monospace'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(label, 128, 138);
      g.fillStyle = '#8b7768'; g.font = '500 20px monospace'; g.fillText('// stack', 128, 208);
      const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 4; return tx;
    }

    /* particles */
    const N = 700, pos = new Float32Array(N * 3), spd = new Float32Array(N);
    for (let i = 0; i < N; i++) { pos[i * 3] = (Math.random() - .5) * 10; pos[i * 3 + 1] = (Math.random() - .5) * 7; pos[i * 3 + 2] = (Math.random() - .5) * 5; spd[i] = .2 + Math.random() * .65 }
    const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const dust = new THREE.Points(pg, new THREE.PointsMaterial({ color: 0xffc39b, size: .02, transparent: true, opacity: .7, depthWrite: false, blending: THREE.AdditiveBlending })); scene.add(dust);

    /* floating cubes */
    const nodePos = [[-2.45, 1.25, .2], [2.45, .9, -.2], [-2, -1.35, .5], [2.1, -1.45, .3]]; const nodes = new THREE.Group(); scene.add(nodes);
    nodePos.forEach((p, i) => { const g = new THREE.Group(); g.position.set(...p); g.add(new THREE.Mesh(new THREE.BoxGeometry(.28, .28, .28), new THREE.MeshStandardMaterial({ color: i % 2 ? 0x2c211b : 0x5a2c1b, metalness: .5, roughness: .28, emissive: i % 2 ? 0 : 0x3b1205, emissiveIntensity: .4 }))); g.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(.3, .3, .3)), new THREE.LineBasicMaterial({ color: i % 2 ? 0xffbd8c : 0xff642f }))); nodes.add(g) });

    /* pointer + ripple on click */
    const ptr = { x: 0, y: 0, tx: 0, ty: 0 }, rx = document.getElementById('rx'), ry = document.getElementById('ry');
    stage.addEventListener('pointermove', e => { const b = stage.getBoundingClientRect(); ptr.tx = ((e.clientX - b.left) / b.width - .5) * 1.15; ptr.ty = ((e.clientY - b.top) / b.height - .5) * .8 }, { passive: true });
    stage.addEventListener('pointerleave', () => { ptr.tx = 0; ptr.ty = 0 });
    let burst = 0; stage.addEventListener('pointerdown', () => { burst = 1 });

    function resize() { const w = stage.clientWidth, h = stage.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.position.z = w < 500 ? 9.4 : 8.2; camera.updateProjectionMatrix() }
    new ResizeObserver(resize).observe(stage); resize();

    let visible = true; new IntersectionObserver(e => { visible = e[0].isIntersecting }).observe(stage);
    const clock = new THREE.Clock(); let tick = 0;
    (function animate() {
      requestAnimationFrame(animate); if (document.hidden || !visible) return;
      const t = clock.getElapsedTime(), sp = state ? state.p : 0;
      ptr.x += (ptr.tx - ptr.x) * .05; ptr.y += (ptr.ty - ptr.y) * .05; burst *= .94;
      rig.rotation.y = t * .13 + ptr.x * .7 + sp * 1.6; rig.rotation.x = Math.sin(t * .32) * .08 + ptr.y * .6 - sp * .4; rig.rotation.z = Math.sin(t * .2) * .035;
      const sc = 1 - sp * .25 + burst * .12; rig.scale.setScalar(sc);
      core.rotation.y = t * .2; core.rotation.x = Math.sin(t * .45) * .1; inner.rotation.x = -t * .42; inner.rotation.y = t * .55; wire.rotation.x = t * .22; wire.rotation.y = -t * .3;
      glow.scale.setScalar(1 + Math.sin(t * 2) * .06 + burst * .5); glow.material.opacity = .07 + burst * .12;
      rA.rotation.z = t * .18; rB.rotation.z = -t * .13; rC.rotation.x = Math.sin(t * .22) * .22; ticks.rotation.z = -t * .025;
      dots.forEach((d, i) => d.scale.setScalar(1 + Math.sin(t * 4 + i) * .25));
      packets.forEach((p, i) => { const a = t * (.42 + (i % 3) * .08) + p.ph; p.m.position.set(Math.cos(a) * p.r, Math.sin(a * 1.17) * p.r * .68, Math.sin(a * 1.8) * .38); p.m.rotation.set(a, a * .7, -a) });
      tiles.forEach(m => { const u = m.userData, a = u.a + t * u.s; m.position.set(Math.cos(a) * u.r, u.y + Math.sin(t + u.a) * .12, Math.sin(a) * u.r * .55); m.quaternion.copy(camera.quaternion); m.material.opacity = .55 + (Math.sin(a) + 1) * .22 });
      nodes.children.forEach((n, i) => { n.rotation.x = t * .25 + i; n.rotation.y = -t * .22 + i; n.position.y = nodePos[i][1] + Math.sin(t * 1.1 + i) * .08 });
      const a = pg.attributes.position.array; for (let i = 0; i < N; i++) { a[i * 3 + 1] += .0016 * spd[i] * (1 + burst * 6); if (a[i * 3 + 1] > 3.6) a[i * 3 + 1] = -3.6 } pg.attributes.position.needsUpdate = true;
      dust.rotation.y = t * .02;
      camera.position.x = ptr.x * .3; camera.position.y = -ptr.y * .22; camera.lookAt(0, 0, 0); renderer.render(scene, camera);
      if (++tick % 6 === 0) { rx.textContent = ptr.x.toFixed(2); ry.textContent = ptr.y.toFixed(2) }
    })();
  } catch (e) { canvas.style.display = 'none' }
}

function initAbout() {
  const cv = document.getElementById('aboutCanvas'); if (!cv || !window.THREE) return;
  try {
    const host = cv.parentElement, r = new THREE.WebGLRenderer({ canvas: cv, alpha: true, antialias: true });
    r.setPixelRatio(Math.min(devicePixelRatio || 1, 1.6));
    const sc = new THREE.Scene(), cam = new THREE.PerspectiveCamera(40, 1, .1, 50); cam.position.z = 6;
    const ico = new THREE.Mesh(new THREE.IcosahedronGeometry(1.5, 1), new THREE.MeshBasicMaterial({ color: 0xff8755, wireframe: true, transparent: true, opacity: .55 })); sc.add(ico);
    const ico2 = new THREE.Mesh(new THREE.IcosahedronGeometry(1.05, 0), new THREE.MeshBasicMaterial({ color: 0xffd0a5, wireframe: true, transparent: true, opacity: .35 })); sc.add(ico2);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.2, .01, 6, 120), new THREE.MeshBasicMaterial({ color: 0xff642f, transparent: true, opacity: .6 })); ring.rotation.x = 1.2; sc.add(ring);
    const m = { x: 0, y: 0, tx: 0, ty: 0 };
    host.addEventListener('pointermove', e => { const b = host.getBoundingClientRect(); m.tx = ((e.clientX - b.left) / b.width - .5); m.ty = ((e.clientY - b.top) / b.height - .5) });
    host.addEventListener('pointerleave', () => { m.tx = 0; m.ty = 0 });
    const rs = () => { const w = host.clientWidth, h = host.clientHeight; r.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix() };
    new ResizeObserver(rs).observe(host); rs();
    let vis = false; new IntersectionObserver(e => vis = e[0].isIntersecting).observe(host);
    const clock = new THREE.Clock();
    (function loop() { requestAnimationFrame(loop); if (!vis || document.hidden) return; const t = clock.getElapsedTime(); m.x += (m.tx - m.x) * .06; m.y += (m.ty - m.y) * .06; ico.rotation.set(t * .2 + m.y * 1.4, t * .28 + m.x * 1.8, 0); ico2.rotation.set(-t * .3, t * .22, 0); ring.rotation.z = t * .3; r.render(sc, cam) })();
  } catch (e) { cv.style.display = 'none' }
}

/* page-wide faint particle field that drifts with scroll */
function initBackground(lenis) {
  const cv = document.getElementById('bg3d'); if (!cv || !window.THREE) return;
  try {
    const r = new THREE.WebGLRenderer({ canvas: cv, alpha: true, antialias: false }); r.setPixelRatio(Math.min(devicePixelRatio || 1, 1.4));
    const sc = new THREE.Scene(), cam = new THREE.PerspectiveCamera(60, 1, .1, 60); cam.position.z = 10;
    const N = 380, p = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) { p[i * 3] = (Math.random() - .5) * 28; p[i * 3 + 1] = (Math.random() - .5) * 20; p[i * 3 + 2] = (Math.random() - .5) * 14 }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    const pts = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xff8d55, size: .045, transparent: true, opacity: .7, depthWrite: false })); sc.add(pts);
    const rs = () => { r.setSize(innerWidth, innerHeight, false); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix() }; addEventListener('resize', rs); rs();
    let y = 0, vy = 0; lenis.on('scroll', ({ scroll, velocity }) => { y = scroll; vy = velocity });
    const m = { x: 0, y: 0 }; addEventListener('pointermove', e => { m.x = e.clientX / innerWidth - .5; m.y = e.clientY / innerHeight - .5 }, { passive: true });
    const clock = new THREE.Clock();
    (function loop() { requestAnimationFrame(loop); if (document.hidden) return; const t = clock.getElapsedTime(); pts.rotation.y = t * .012 + m.x * .12 + y * .00018; pts.rotation.x = m.y * .08 + y * .00006; pts.position.y = y * .0016; cam.position.z = 10 - Math.min(3, Math.abs(vy) * .06); r.render(sc, cam) })();
  } catch (e) { cv.style.display = 'none' }
}
