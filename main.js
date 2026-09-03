/* Olumide Sajowa — shared site behavior */
gsap.registerPlugin(ScrollTrigger);

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- smooth scroll (Lenis) ---------- */
let lenis;
if (!reduceMotion && window.Lenis) {
  lenis = new Lenis({ duration: 1.1, easing: (t) => 1 - Math.pow(1 - t, 3), smoothWheel: true });
  function raf(time){ lenis.raf(time); requestAnimationFrame(raf); }
  requestAnimationFrame(raf);
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time)=>{ lenis.raf(time*1000); });
  gsap.ticker.lagSmoothing(0);
}

/* ---------- nav ---------- */
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.site-nav nav');
if (navToggle && navMenu) {
  navToggle.addEventListener('click', () => {
    navToggle.classList.toggle('is-open');
    navMenu.classList.toggle('is-open');
  });
  navMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    navToggle.classList.remove('is-open');
    navMenu.classList.remove('is-open');
  }));
}

/* ---------- scroll progress bar ---------- */
(function progressBar(){
  const bar = document.createElement('div');
  bar.className = 'scroll-progress';
  document.body.appendChild(bar);
  ScrollTrigger.create({
    trigger: document.body, start: 'top top', end: 'bottom bottom',
    onUpdate: (self) => { bar.style.transform = `scaleX(${self.progress})`; }
  });
})();

/* ---------- background grid parallax ---------- */
const gridField = document.querySelector('.grid-field');
if (gridField && !reduceMotion) {
  gsap.to(gridField, {
    backgroundPosition: '0px 220px',
    ease: 'none',
    scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 0.6 }
  });
}

/* ---------- section index glow: highlight nav-adjacent line as sections pass ---------- */
document.querySelectorAll('section').forEach((sec) => {
  gsap.fromTo(sec, { filter: 'brightness(0.92)' }, {
    filter: 'brightness(1)', ease: 'none',
    scrollTrigger: { trigger: sec, start: 'top 90%', end: 'top 40%', scrub: 0.5 }
  });
});

/* ---------- generic scroll reveals ---------- */
document.querySelectorAll('.reveal').forEach((el) => {
  gsap.to(el, {
    opacity: 1, y: 0, duration: 1.1, ease: 'power3.out',
    scrollTrigger: { trigger: el, start: 'top 88%' }
  });
});

/* ---------- section headers: scale + clip reveal ---------- */
document.querySelectorAll('.section-head h2, .cs-grid h2, .about-hero h1, .contact-wrap h1').forEach((el) => {
  gsap.fromTo(el, { opacity: 0, y: 34, scale: 0.97 }, {
    opacity: 1, y: 0, scale: 1, duration: 1, ease: 'power3.out',
    scrollTrigger: { trigger: el, start: 'top 92%' }
  });
});

/* ---------- work rows: sequential slide + subtle tilt ---------- */
document.querySelectorAll('.work-row').forEach((el, i) => {
  gsap.fromTo(el, { opacity: 0, x: -28, rotateZ: -0.6 }, {
    opacity: 1, x: 0, rotateZ: 0, duration: 0.85, ease: 'power3.out',
    scrollTrigger: { trigger: el, start: 'top 94%' }
  });
});

/* ---------- cs-section index labels: slide in from the rule ---------- */
document.querySelectorAll('.cs-section .index').forEach((el) => {
  gsap.fromTo(el, { opacity: 0, x: -16 }, {
    opacity: 1, x: 0, duration: 0.7, ease: 'power2.out',
    scrollTrigger: { trigger: el, start: 'top 90%' }
  });
});

/* ---------- stat cells: staggered pop on entry ---------- */
document.querySelectorAll('.stat-strip, .cap-list, .mod-grid, .os-diagram, .agent-row').forEach((group) => {
  const cells = group.children;
  gsap.fromTo(cells, { opacity: 0, y: 16 }, {
    opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', stagger: 0.05,
    scrollTrigger: { trigger: group, start: 'top 92%' }
  });
});

/* ---------- large numerals / hero-style headings: soft parallax drift ---------- */
document.querySelectorAll('.next-project h2').forEach((el) => {
  gsap.fromTo(el, { y: 60, opacity: 0 }, {
    y: 0, opacity: 1, ease: 'power3.out', duration: 1,
    scrollTrigger: { trigger: el, start: 'top 90%' }
  });
});

/* stagger reveals for groups */
document.querySelectorAll('[data-reveal-group]').forEach((group) => {
  const items = group.querySelectorAll('.reveal-item');
  gsap.set(items, { opacity: 0, y: 22 });
  gsap.to(items, {
    opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08,
    scrollTrigger: { trigger: group, start: 'top 85%' }
  });
});

/* ---------- animated counters ---------- */
document.querySelectorAll('[data-count]').forEach((el) => {
  const end = parseFloat(el.dataset.count);
  const decimals = (el.dataset.count.split('.')[1] || '').length;
  const suffix = el.dataset.suffix || '';
  const obj = { val: 0 };
  ScrollTrigger.create({
    trigger: el, start: 'top 90%', once: true,
    onEnter: () => gsap.to(obj, {
      val: end, duration: 1.6, ease: 'power2.out',
      onUpdate: () => el.textContent = obj.val.toFixed(decimals) + suffix
    })
  });
});

/* ---------- nav glass on scroll ---------- */
(function navGlass(){
  const nav = document.querySelector('.site-nav');
  if (!nav) return;
  const onScroll = () => {
    if (window.scrollY > 40) nav.classList.add('is-scrolled');
    else nav.classList.remove('is-scrolled');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

/* ---------- theme toggle (dark / light) ---------- */
(function themeToggle(){
  const root = document.documentElement;
  const stored = localStorage.getItem('theme');
  if (stored === 'light') root.setAttribute('data-theme', 'light');
  const btn = document.querySelector('.theme-toggle');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const isLight = root.getAttribute('data-theme') === 'light';
    if (isLight) { root.removeAttribute('data-theme'); localStorage.setItem('theme', 'dark'); }
    else { root.setAttribute('data-theme', 'light'); localStorage.setItem('theme', 'light'); }
  });
})();

/* ---------- text scramble (hero headline reveal) ---------- */
class Scramble {
  constructor(el){ this.el = el; this.chars = '!<>-_\\/[]{}—=+*^?#'; }
  setText(newText){
    const oldText = this.el.textContent;
    const length = Math.max(oldText.length, newText.length);
    const promise = new Promise((resolve) => this.resolve = resolve);
    this.queue = [];
    for (let i = 0; i < length; i++) {
      const from = oldText[i] || '';
      const to = newText[i] || '';
      const start = Math.floor(Math.random() * 20);
      const end = start + Math.floor(Math.random() * 20);
      this.queue.push({ from, to, start, end });
    }
    cancelAnimationFrame(this.frameReq);
    this.frame = 0;
    this.update();
    return promise;
  }
  update(){
    let output = '';
    let complete = 0;
    for (let i = 0, n = this.queue.length; i < n; i++) {
      let { from, to, start, end, char } = this.queue[i];
      if (this.frame >= end) { complete++; output += to; }
      else if (this.frame >= start) {
        if (!char || Math.random() < 0.28) { char = this.chars[Math.floor(Math.random() * this.chars.length)]; this.queue[i].char = char; }
        output += `<span class="sc">${char}</span>`;
      } else output += from;
    }
    this.el.innerHTML = output;
    if (complete === this.queue.length) this.resolve();
    else { this.frameReq = requestAnimationFrame(() => { this.frame++; this.update(); }); }
  }
}
document.querySelectorAll('[data-scramble]').forEach((el) => {
  const final = el.textContent;
  const fx = new Scramble(el);
  el.textContent = '';
  window.addEventListener('load', () => setTimeout(() => fx.setText(final), 300));
});

/* ---------- hero load-in orchestration ---------- */
if (document.querySelector('.hero')) {
  const tl = gsap.timeline({ delay: 0.15 });
  tl.to('.hero-status', { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, 0)
    .to('.hero h1 .line span', { yPercent: 0, duration: 1.1, ease: 'power4.out', stagger: 0.06 }, 0.15)
    .to('.hero-sub', { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' }, 0.55)
    .to('.hero-scroll', { opacity: 1, duration: 0.8 }, 0.8);
}

/* ---------- subtle 3D tilt on interactive panels ---------- */
if (matchMedia('(hover:hover)').matches && !reduceMotion) {
  document.querySelectorAll('.cap-item, .mod-grid .mod, .stat-strip .cell, .agent-row .a').forEach((el) => {
    el.style.transformStyle = 'preserve-3d';
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      gsap.to(el, { rotateY: px * 6, rotateX: py * -6, duration: 0.4, ease: 'power2.out', transformPerspective: 500 });
    });
    el.addEventListener('mouseleave', () => gsap.to(el, { rotateY: 0, rotateX: 0, duration: 0.6, ease: 'power3.out' }));
  });
}
const clockEl = document.querySelector('[data-clock]');
if (clockEl) {
  function tick(){
    const d = new Date();
    const opts = { hour: '2-digit', minute: '2-digit', hour12: false };
    clockEl.textContent = `LAGOS · ${d.toLocaleTimeString('en-GB', { ...opts, timeZone: 'Africa/Lagos' })} WAT`;
  }
  tick(); setInterval(tick, 15000);
}
