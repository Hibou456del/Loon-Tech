'use strict';

/* ──────────────── UTILITIES ──────────────── */
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const clamp01 = v => clamp(v, 0, 1);
const lerp = (a, b, t) => a + (b - a) * t;
const easeOut3 = t => 1 - Math.pow(1 - t, 3);
const easeInOut3 = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const $ = id => document.getElementById(id);
const $$ = sel => [...document.querySelectorAll(sel)];

/* ──────────────── SCREEN ORDER ──────────────── */
const SCREENS = [
  'screen-hero',
  'screen-services',
  'screen-drum',
  'screen-gallery',
  'screen-contact',
];
let currentScreen = 0;
let isAnimating = false;

/* ──────────────── CURSOR ──────────────── */
const dot  = $('cursor-dot');
const ring = $('cursor-ring');
let mx = window.innerWidth / 2, my = window.innerHeight / 2;
let rx = mx, ry = my;

window.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });

function animCursor() {
  dot.style.left  = mx + 'px';
  dot.style.top   = my + 'px';
  rx = lerp(rx, mx, 0.12);
  ry = lerp(ry, my, 0.12);
  ring.style.left = rx + 'px';
  ring.style.top  = ry + 'px';
  requestAnimationFrame(animCursor);
}
animCursor();

/* ──────────────── LOADER ──────────────── */
const loaderEl   = $('loader');
const loaderFill = $('loader-fill');
const loaderLbl  = $('loader-label');
const MESSAGES   = ['INITIALISATION…', 'CHARGEMENT ASSETS…', 'CONFIGURATION 3D…', 'PRÊT.'];

let loadPct = 0;
function tickLoader() {
  if (loadPct >= 100) { finishLoader(); return; }
  loadPct += Math.random() * 12 + 4;
  loadPct = Math.min(loadPct, 100);
  loaderFill.style.width = loadPct + '%';
  const msgIdx = Math.floor((loadPct / 100) * (MESSAGES.length - 1));
  loaderLbl.textContent = MESSAGES[msgIdx];
  setTimeout(tickLoader, 80 + Math.random() * 120);
}

function finishLoader() {
  loaderEl.style.transition = 'opacity 0.7s ease';
  loaderEl.style.opacity = '0';
  setTimeout(() => {
    loaderEl.style.display = 'none';
    initSite();
  }, 700);
}

setTimeout(tickLoader, 200);

/* ──────────────── 3D CANVAS — Particle Field ──────────────── */
function createParticleCanvas(canvasId, color = '#3B82F6', density = 60) {
  const canvas = $(canvasId);
  if (!canvas) return null;
  const ctx = canvas.getContext('2d');

  let W, H, particles = [];

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  function mkParticle() {
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      z: Math.random() * 2 + 0.2,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.8 + 0.3,
      alpha: Math.random() * 0.5 + 0.1,
    };
  }

  for (let i = 0; i < density; i++) particles.push(mkParticle());

  // Build hex color to rgb
  const hexToRgb = hex => {
    const r = parseInt(hex.slice(1,3), 16);
    const g = parseInt(hex.slice(3,5), 16);
    const b = parseInt(hex.slice(5,7), 16);
    return `${r},${g},${b}`;
  };
  const rgb = hexToRgb(color.trim());

  // Connection threshold
  const CONN = 110;

  let running = false;
  function draw() {
    if (!running) return;
    ctx.clearRect(0, 0, W, H);

    for (let p of particles) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < -10) p.x = W + 10;
      if (p.x > W + 10) p.x = -10;
      if (p.y < -10) p.y = H + 10;
      if (p.y > H + 10) p.y = -10;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * p.z, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${rgb},${p.alpha})`;
      ctx.fill();
    }

    // Lines
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < CONN) {
          const alpha = (1 - dist / CONN) * 0.15;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(${rgb},${alpha})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(draw);
  }

  return { start() { running = true; draw(); }, stop() { running = false; } };
}

/* ──────────────── HERO CANVAS — 3D Orbiting rings ──────────────── */
function initHeroCanvas() {
  const canvas = $('hero-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H;

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  let t = 0;
  let cmx = 0.5, cmy = 0.5;
  window.addEventListener('mousemove', e => {
    cmx = e.clientX / window.innerWidth;
    cmy = e.clientY / window.innerHeight;
  });

  function draw() {
    ctx.clearRect(0, 0, W, H);
    t += 0.008;

    // Center
    const cx = W * 0.78 + (cmx - 0.5) * -30;
    const cy = H * 0.5  + (cmy - 0.5) * -30;

    // Glow core
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 220);
    grad.addColorStop(0, 'rgba(59,130,246,0.12)');
    grad.addColorStop(1, 'rgba(59,130,246,0)');
    ctx.beginPath();
    ctx.arc(cx, cy, 220, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Orbit rings
    const rings = [
      { r: 90,  tilt: 0.4,  speed: 1,    color: 'rgba(59,130,246,0.5)',  dots: 5  },
      { r: 145, tilt: -0.6, speed: -0.7, color: 'rgba(96,165,250,0.35)', dots: 7  },
      { r: 200, tilt: 0.25, speed: 0.5,  color: 'rgba(29,78,216,0.4)',   dots: 10 },
      { r: 255, tilt: -0.3, speed: -0.3, color: 'rgba(59,130,246,0.2)',  dots: 12 },
    ];

    for (const ring of rings) {
      // Draw ellipse
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(1, Math.abs(Math.sin(ring.tilt + t * 0.1)));
      ctx.beginPath();
      ctx.arc(0, 0, ring.r, 0, Math.PI * 2);
      ctx.strokeStyle = ring.color;
      ctx.lineWidth = 0.8;
      ctx.stroke();
      ctx.restore();

      // Orbiting dots
      for (let d = 0; d < ring.dots; d++) {
        const angle = (d / ring.dots) * Math.PI * 2 + t * ring.speed;
        const tiltFactor = Math.sin(ring.tilt + t * 0.1);
        const dotX = cx + Math.cos(angle) * ring.r;
        const dotY = cy + Math.sin(angle) * ring.r * Math.abs(tiltFactor);
        const dotAlpha = (Math.sin(angle) * tiltFactor * 0.5 + 0.5) * 0.8 + 0.2;

        ctx.beginPath();
        ctx.arc(dotX, dotY, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = ring.color.replace(/[\d.]+\)$/, `${dotAlpha})`);
        ctx.fill();
      }
    }

    // Inner sphere wireframe
    for (let lat = 0; lat < Math.PI; lat += Math.PI / 8) {
      ctx.beginPath();
      for (let lon = 0; lon <= Math.PI * 2; lon += 0.1) {
        const x = cx + 55 * Math.sin(lat) * Math.cos(lon + t * 0.6);
        const y = cy + 55 * Math.sin(lat) * Math.sin(lon + t * 0.6) * 0.5;
        if (lon === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = 'rgba(59,130,246,0.15)';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }

    requestAnimationFrame(draw);
  }
  draw();
}

/* ──────────────── DRUM MANIFESTO ──────────────── */
const LINES_RAW = [
  { text: "LoonTech est l'agence pour ceux qui",        hl: false },
  { text: "refusent le [médiocre].",                    hl: true  },
  { text: "Nous construisons des [outils digitaux]",    hl: true  },
  { text: "qui [transforment] les entreprises.",        hl: true  },
  { text: "Du code propre, de la [data intelligente],", hl: true  },
  { text: "des identités [mémorables].",                hl: true  },
  { text: "",                                           hl: false },
  { text: "Chaque projet est une [déclaration].",       hl: true  },
  { text: "Pas de template. Pas de [compromis].",       hl: true  },
  { text: "Nous formons, nous créons,",                 hl: false },
  { text: "nous [livrons].",                            hl: true  },
  { text: "",                                           hl: false },
  { text: "ML, sécurité, design, web —",               hl: false },
  { text: "nous maîtrisons [l'ensemble du spectre].",   hl: true  },
  { text: "Votre vision mérite une [exécution parfaite].", hl: true },
  { text: "C'est ce que nous [garantissons].",          hl: true  },
  { text: "",                                           hl: false },
  { text: "Rejoignez les entreprises qui ont choisi",   hl: false },
  { text: "l'[excellence digitale] avec LoonTech.",     hl: true  },
];

function parseLine(raw) {
  // Convert [text] → <span class="hl">text</span>
  return raw.replace(/\[([^\]]+)\]/g, '<span class="hl">$1</span>');
}

let drumScrollProgress = 0;
let drumLerpProgress = 0;
let drumAnimId = null;

function initDrum() {
  const container = $('drum-lines');
  if (!container) return;
  container.innerHTML = '';

  LINES_RAW.forEach((line, idx) => {
    const div = document.createElement('div');
    div.className = 'drum-line';
    div.dataset.idx = idx;
    const p = document.createElement('p');
    p.innerHTML = parseLine(line.text);
    div.appendChild(p);
    container.appendChild(div);
  });

  updateDrum(0);
}

function updateDrum(progress) {
  const container = $('drum-lines');
  if (!container) return;

  const lines = container.querySelectorAll('.drum-line');
  const n = LINES_RAW.length;
  const R = 340;
  const LH = 36;

  // target index
  const targetIdx = clamp01(progress) * (n - 1);

  lines.forEach((line, idx) => {
    const diff = idx - targetIdx;
    const ty = diff * LH;
    const angleRad = ty / R;
    const angleDeg = angleRad * 180 / Math.PI;
    const tz = Math.cos(angleRad) * R - R;
    const scale = 0.76 + Math.cos(angleRad) * 0.24;
    const opacity = Math.max(0, (Math.cos(angleRad) - 0.18) / 0.82);
    const blur = Math.min(7, Math.max(0, (Math.abs(diff) - 1.2) * 0.9));

    line.style.transform = `translateY(${ty}lateZ(${tz}px) rotateX(${-angleDeg * 0.75}deg) scale(${scale})`;
    line.style.opacity = opacity;
    line.style.filter = blur > 0.1 ? `blur(${blur}px)` : '';
    line.classList.toggle('center', Math.abs(diff) < 0.6);
  });
}

/* ──────────────── SCROLL (touch + wheel) ──────────────── */
let scrollProgress = 0; // 0 → SCREENS.length - 1 (continuous)
let lerpedScroll = 0;
let lastTouchY = 0;
let navAnimId = null;

function handleScrollDelta(delta) {
  if (isAnimating) return;
  const speed = 0.0012;
  const next = clamp(scrollProgress + delta * speed, 0, SCREENS.length - 1);
  scrollProgress = next;
}

window.addEventListener('wheel', e => {
  e.preventDefault();
  handleScrollDelta(e.deltaY);
}, { passive: false });

window.addEventListener('touchstart', e => {
  lastTouchY = e.touches[0].clientY;
}, { passive: true });

window.addEventListener('touchmove', e => {
  const dy = lastTouchY - e.touches[0].clientY;
  lastTouchY = e.touches[0].clientY;
  handleScrollDelta(dy * 1.8);
  e.preventDefault();
}, { passive: false });

/* ──────────────── NAVIGATION ──────────────── */
function navigateTo(targetId) {
  const idx = SCREENS.indexOf(targetId);
  if (idx === -1) return;

  const start = scrollProgress;
  const end = idx;
  const dur = 1000;
  const t0 = performance.now();

  if (navAnimId) cancelAnimationFrame(navAnimId);
  isAnimating = true;

  function step(now) {
    const elapsed = now - t0;
    const p = clamp01(elapsed / dur);
    scrollProgress = lerp(start, end, easeInOut3(p));
    if (p < 1) {
      navAnimId = requestAnimationFrame(step);
    } else {
      scrollProgress = end;
      isAnimating = false;
    }
  }
  navAnimId = requestAnimationFrame(step);
}

/* ──────────────── BUTTON WIRING ──────────────── */
function wireNavButtons() {
  $$('[data-target]').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.target;
      navigateTo(target);

      // close mobile nav if open
      const mn = $('mobile-nav');
      if (mn) mn.classList.remove('open');
    });
  });

  const burger = $('burger');
  const mn = $('mobile-nav');
  const mc = $('mobile-close');

  if (burger && mn) burger.addEventListener('click', () => mn.classList.add('open'));
  if (mc && mn) mc.addEventListener('click', () => mn.classList.remove('open'));

  // Logo → hero
  const logoEl = $('nav-logo');
  if (logoEl) logoEl.addEventListener('click', () => navigateTo('screen-hero'));
}

/* ──────────────── DRUM SCROLL PROGRESS (per-screen) ──────────────── */
function drumProgress(sp) {
  // When on drum screen (idx 2), map fractional 0→1 into drum scroll
  const base = 2;
  const frac = clamp01(sp - base); // 0→1 while on drum screen going to next
  return clamp01(sp - base + 0.5); // starts at 0.5 so center line visible immediately
}

/* ──────────────── MAIN RENDER LOOP ──────────────── */
function mainLoop() {
  // Smooth lerp
  lerpedScroll = lerp(lerpedScroll, scrollProgress, 0.07);
  if (Math.abs(lerpedScroll - scrollProgress) < 0.0005) lerpedScroll = scrollProgress;

  const sp = lerpedScroll;
  const screenIdx = Math.round(clamp(sp, 0, SCREENS.length - 1));

  // Activate correct screen
  SCREENS.forEach((id, i) => {
    const el = $(id);
    if (!el) return;
    if (i === screenIdx) {
      el.classList.add('screen-active');
    } else {
      el.classList.remove('screen-active');
    }
  });

  // Dot nav
  $$('.dot').forEach((d, i) => {
    d.classList.toggle('active', i === screenIdx);
  });

  // Progress bar
  const pb = $('progress-bar');
  if (pb) pb.style.width = ((sp / (SCREENS.length - 1)) * 100) + '%';

  // Drum update
  const dp = clamp01((sp - 2) + 0.5);
  updateDrum(dp);

  currentScreen = screenIdx;
  requestAnimationFrame(mainLoop);
}

/* ──────────────── HERO ENTRY ANIMATIONS ──────────────── */
function heroEntryAnim() {
  // Title lines
  $$('.split-inner').forEach((el, i) => {
    setTimeout(() => el.classList.add('in'), 200 + i * 120);
  });
  // Badge
  const badge = $('hero-badge');
  if (badge) setTimeout(() => badge.classList.add('visible'), 100);
  // Desc
  const desc = $('hero-desc');
  if (desc) setTimeout(() => desc.classList.add('visible'), 450);
  // CTA
  const cta = $('hero-cta');
  if (cta) setTimeout(() => cta.classList.add('visible'), 600);
  // Stats
  const stats = $('hero-stats');
  if (stats) setTimeout(() => stats.classList.add('visible'), 750);
  // Scroll hint
  const sh = $('scroll-hint');
  if (sh) setTimeout(() => sh.classList.add('visible'), 1200);
  // Tiles
  $$('.tile').forEach((el, i) => {
    setTimeout(() => el.classList.add('in'), 500 + i * 100);
  });

  // Counter animation
  $$('.stat-num').forEach(el => {
    const target = parseInt(el.dataset.count, 10);
    let current = 0;
    const dur = 1400;
    const start = performance.now();
    function tick(now) {
      const p = clamp01((now - start) / dur);
      current = Math.round(lerp(0, target, easeOut3(p)));
      el.textContent = current;
      if (p < 1) requestAnimationFrame(tick);
    }
    setTimeout(() => requestAnimationFrame(tick), 900);
  });
}

/* ──────────────── SERVICES ENTRY ──────────────── */
let servicesAnimated = false;
function animateServices() {
  if (servicesAnimated) return;
  servicesAnimated = true;
  $$('.service-card').forEach((card, i) => {
    setTimeout(() => card.classList.add('in'), i * 80);
  });
}

/* ──────────────── INTERSECTION OBSERVER for services ──────────────── */
function watchScreens() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting && entry.target.id === 'screen-services') {
        animateServices();
      }
    });
  }, { threshold: 0.3 });

  const servEl = $('screen-services');
  if (servEl) observer.observe(servEl);
}

// Also trigger when screen changes via scroll
let lastScreenForAnim = -1;
function checkScreenAnimations() {
  setInterval(() => {
    if (currentScreen !== lastScreenForAnim) {
      lastScreenForAnim = currentScreen;
      if (currentScreen === 1) animateServices();
    }
  }, 200);
}

/* ──────────────── CONTACT FORM ──────────────── */
function initContactForm() {
  const form = $('contact-form');
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const name    = $('name')?.value.trim();
    const email   = $('email')?.value.trim();
    const message = $('message')?.value.trim();
    if (!name || !email || !message) {
      $('form-feedback').textContent = '⚠ Remplissez tous les champs requis.';
      $('form-feedback').style.color = '#f87171';
      return;
    }
    const subject = `Demande LoonTech — ${name}`;
    const body = `Nom : ${name}%0AEmail : ${email}%0A%0AMessage :%0A${encodeURIComponent(message)}`;
    window.location.href = `mailto:akoueteyannel662@gmail.com?subject=${encodeURIComponent(subject)}&body=${body}`;
    $('form-feedback').textContent = '✓ Ouverture de votre messagerie…';
    $('form-feedback').style.color = '#4ade80';
  });
}

/* ──────────────── FOOTER ──────────────── */
function initFooter() {
  const yearEl = $('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const vcEl = $('visitor-count');
  if (vcEl) {
    let count = parseInt(localStorage.getItem('lt_vc') || '0', 10) + 1;
    localStorage.setItem('lt_vc', count);
    vcEl.textContent = count;
  }
}

/* ──────────────── DARK THEME TOGGLE PRESERVATION ──────────────── */
function initTheme() {
  // Always dark — store it
  localStorage.setItem('loontech_theme', 'dark');
}

/* ──────────────── GALLERY PARALLAX on hover ──────────────── */
function initGalleryParallax() {
  $$('.gallery-item').forEach(item => {
    item.addEventListener('mousemove', e => {
      const rect = item.getBoundingClientRect();
      const px = ((e.clientX - rect.left) / rect.width  - 0.5) * 12;
      const py = ((e.clientY - rect.top)  / rect.height - 0.5) * 12;
      const img = item.querySelector('img');
      if (img) img.style.transform = `scale(1.08) translate(${px}px, ${py}px)`;
    });
    item.addEventListener('mouseleave', () => {
      const img = item.querySelector('img');
      if (img) img.style.transform = '';
    });
  });
}

/* ──────────────── CARD 3D TILT ──────────────── */
function initCardTilt() {
  $$('.service-card, .tile').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width  - 0.5;
      const py = (e.clientY - rect.top)  / rect.height - 0.5;
      card.style.transform = `translateY(-4px) perspective(600px) rotateX(${-py * 6}deg) rotateY(${px * 6}deg)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}

/* ──────────────── SERVICES CANVAS ──────────────── */
function initServicesCanvas() {
  const canvas = $('services-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H;
  function resize() { W = canvas.width = canvas.offsetWidth; H = canvas.height = canvas.offsetHeight; }
  resize();
  window.addEventListener('resize', resize);
  let t = 0;
  function draw() {
    ctx.clearRect(0, 0, W, H);
    t += 0.005;
    // Grid lines
    ctx.strokeStyle = 'rgba(59,130,246,0.04)';
    ctx.lineWidth = 1;
    const cols = 12, rows = 8;
    for (let c = 0; c <= cols; c++) {
      ctx.beginPath();
      ctx.moveTo(c / cols * W, 0);
      ctx.lineTo(c / cols * W, H);
      ctx.stroke();
    }
    for (let r = 0; r <= rows; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r / rows * H);
      ctx.lineTo(W, r / rows * H);
      ctx.stroke();
    }
    // Floating hexagons
    for (let i = 0; i < 5; i++) {
      const hx = (Math.sin(t * 0.4 + i * 1.26) * 0.3 + 0.5) * W;
      const hy = (Math.cos(t * 0.3 + i * 0.97) * 0.3 + 0.5) * H;
      const hs = 30 + i * 12;
      ctx.save();
      ctx.translate(hx, hy);
      ctx.rotate(t * 0.3 * (i % 2 ? 1 : -1));
      ctx.beginPath();
      for (let v = 0; v < 6; v++) {
        const angle = v / 6 * Math.PI * 2 - Math.PI / 6;
        const px = Math.cos(angle) * hs;
        const py = Math.sin(angle) * hs;
        v === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.strokeStyle = `rgba(59,130,246,${0.04 + i * 0.01})`;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }
    requestAnimationFrame(draw);
  }
  draw();
}

/* ──────────────── DRUM CANVAS — Digital rain ──────────────── */
function initDrumCanvas() {
  const canvas = $('drum-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H;
  function resize() { W = canvas.width = canvas.offsetWidth; H = canvas.height = canvas.offsetHeight; }
  resize();
  window.addEventListener('resize', resize);

  const chars = '01アイウエオカキクケコサシスセソタチツテトABCDEFGHIJKLMNOP<>{}[]#@&%$';
  const cols = [];
  const colCount = Math.floor(W / 20);
  for (let i = 0; i < colCount; i++) cols.push(Math.random() * H);

  function draw() {
    ctx.fillStyle = 'rgba(5,8,15,0.05)';
    ctx.fillRect(0, 0, W, H);
    ctx.font = '12px JetBrains Mono, monospace';

    cols.forEach((y, i) => {
      const ch = chars[Math.floor(Math.random() * chars.length)];
      const x = i * 20;
      ctx.fillStyle = `rgba(59,130,246,${Math.random() * 0.3 + 0.02})`;
      ctx.fillText(ch, x, y);
      cols[i] = y > H + Math.random() * 5000 ? 0 : y + 20;
    });

    requestAnimationFrame(draw);
  }
  draw();
}

/* ──────────────── CONTACT CANVAS ──────────────── */
function initContactCanvas() {
  const canvas = $('contact-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H;
  function resize() { W = canvas.width = canvas.offsetWidth; H = canvas.height = canvas.offsetHeight; }
  resize();
  window.addEventListener('resize', resize);
  let t = 0;
  function draw() {
    ctx.clearRect(0, 0, W, H);
    t += 0.006;
    // Wave lines
    for (let l = 0; l < 5; l++) {
      ctx.beginPath();
      const amp = 40 + l * 15;
      const freq = 0.008 - l * 0.001;
      const offset = l * 0.4;
      ctx.strokeStyle = `rgba(59,130,246,${0.05 - l * 0.008})`;
      ctx.lineWidth = 1;
      for (let x = 0; x <= W; x += 4) {
        const y = H * 0.6 + Math.sin(x * freq + t + offset) * amp;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    requestAnimationFrame(draw);
  }
  draw();
}

/* ──────────────── GALLERY CANVAS ──────────────── */
function initGalleryCanvas() {
  const canvas = $('gallery-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H;
  function resize() { W = canvas.width = canvas.offsetWidth; H = canvas.height = canvas.offsetHeight; }
  resize();
  window.addEventListener('resize', resize);
  let t = 0;
  const pts = Array.from({ length: 20 }, () => ({
    x: Math.random() * 100, y: Math.random() * 100,
    vx: (Math.random() - 0.5) * 0.1, vy: (Math.random() - 0.5) * 0.1,
  }));
  function draw() {
    ctx.clearRect(0, 0, W, H);
    t += 0.003;
    pts.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > 100) p.vx *= -1;
      if (p.y < 0 || p.y > 100) p.vy *= -1;
    });
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
        const d = Math.sqrt(dx*dx+dy*dy);
        if (d < 25) {
          ctx.beginPath();
          ctx.moveTo(pts[i].x / 100 * W, pts[i].y / 100 * H);
          ctx.lineTo(pts[j].x / 100 * W, pts[j].y / 100 * H);
          ctx.strokeStyle = `rgba(59,130,246,${(1 - d/25) * 0.06})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(draw);
  }
  draw();
}

/* ──────────────── INIT ──────────────── */
function initSite() {
  initTheme();
  initFooter();
  initContactForm();
  initDrum();
  wireNavButtons();
  heroEntryAnim();
  watchScreens();
  checkScreenAnimations();
  initGalleryParallax();
  initCardTilt();

  // Canvases
  initHeroCanvas();
  initServicesCanvas();
  initDrumCanvas();
  initContactCanvas();
  initGalleryCanvas();

  // Start main loop
  mainLoop();
}

/* ──────────────── MASCOT — Personnage animé interactif ──────────────── */
function initMascot() {
  const wrap   = document.getElementById('mascot-wrap');
  const lottie = document.getElementById('mascot-lottie');
  const bubble = document.getElementById('mascot-bubble');
  const textEl = document.getElementById('mascot-text');
  if (!wrap || !lottie || !textEl) return;

  // Messages rotatifs selon le contexte
  const MESSAGES = [
    "Bienvenue chez LoonTech 👋",
    "On construit l'avenir digital 🚀",
    "Défile pour découvrir nos services ↓",
    "Machine Learning · Web · Sécurité ⚡",
    "Prêt à transformer ton projet ? 💡",
    "Formation · Branding · Dev 🎨",
    "Discutons de ton projet ! →",
  ];

  let msgIdx = 0;
  let msgTimer = null;

  function showMessage(txt, duration = 3500) {
    if (!textEl || !bubble) return;
    textEl.textContent = txt;
    bubble.style.opacity = '1';
    bubble.style.transform = 'translateY(0) scale(1)';
    clearTimeout(msgTimer);
    msgTimer = setTimeout(() => {
      bubble.style.opacity = '0';
      bubble.style.transform = 'translateY(4px) scale(0.97)';
      bubble.style.transition = 'opacity 0.4s, transform 0.4s';
    }, duration);
  }

  function cycleMessages() {
    msgIdx = (msgIdx + 1) % MESSAGES.length;
    showMessage(MESSAGES[msgIdx], 3200);
    setTimeout(cycleMessages, 5000);
  }

  // Premier message après l'animation d'entrée
  setTimeout(() => {
    showMessage(MESSAGES[0], 3500);
    setTimeout(cycleMessages, 5000);
  }, 2800);

  // Hover → vitesse max + message
  lottie.addEventListener('mouseenter', () => {
    lottie.speed = 1.8;
    if (lottie.setSpeed) lottie.setSpeed(1.8);
    showMessage("C'est moi le guide LoonTech 😎", 2500);
  });
  lottie.addEventListener('mouseleave', () => {
    if (lottie.setSpeed) lottie.setSpeed(1);
  });

  // Click → petite réaction
  let clickCount = 0;
  const clickReactions = [
    "Hey ! Tu m'as cliqué 😄",
    "Arrête, ça chatouille ! 😂",
    "Ok ok, j'ai compris 😅",
    "Découvre plutôt les services ! →",
    "Sérieusement, défile vers le bas ↓",
  ];
  lottie.addEventListener('click', () => {
    showMessage(clickReactions[clickCount % clickReactions.length], 2500);
    clickCount++;
    // Petite animation de rebond
    lottie.style.transform = 'scale(1.15) rotate(-3deg)';
    setTimeout(() => { lottie.style.transform = ''; }, 300);
  });

  // Masquer le personnage quand on quitte le héro
  setInterval(() => {
    if (wrap) {
      const visible = currentScreen === 0;
      wrap.style.opacity = visible ? '1' : '0';
      wrap.style.pointerEvents = visible ? 'auto' : 'none';
      wrap.style.transition = 'opacity 0.5s ease';
    }
  }, 300);
}

// Appeler initMascot() après initSite()
const _origInitSite = initSite;
function initSite() {
  _origInitSite();
  setTimeout(initMascot, 100);
}



