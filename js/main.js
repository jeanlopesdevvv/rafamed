/**
 * main.js — Landing Page Logic & Animations
 * Rafael Machado Advocacia
 * Skills applied: animejs-animation, design-spells, page-cro
 */

// ── INIT ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initAOS();
  initHeader();
  initHamburger();
  initParticles();
  initBlogGrid();
  initFAQ();
  setCurrentYear();
  initTimelineReveal();
  initWhatsAppFloat();
});

// ── AOS (Scroll Reveal) ───────────────────────────────────
function initAOS() {
  if (typeof AOS !== 'undefined') {
    AOS.init({
      duration: 700,
      easing: 'ease-out-cubic',
      once: true,
      offset: 60,
    });
  }
}

// ── HEADER (Scroll Behavior) ──────────────────────────────
function initHeader() {
  const header = document.getElementById('header');
  if (!header) return;

  const onScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 40);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// ── HAMBURGER MENU ────────────────────────────────────────
function initHamburger() {
  const btn = document.getElementById('hamburger');
  const navList = document.querySelector('.mobile-nav');
  if (!btn || !navList) return;

  btn.addEventListener('click', () => {
    const isOpen = navList.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(isOpen));
    btn.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');

    // Animate hamburger to X
    const spans = btn.querySelectorAll('span');
    if (typeof anime !== 'undefined') {
      if (isOpen) {
        anime({ targets: spans[0], translateY: 7, rotate: 45, duration: 250, easing: 'easeOutQuad' });
        anime({ targets: spans[1], opacity: 0, duration: 150, easing: 'easeOutQuad' });
        anime({ targets: spans[2], translateY: -7, rotate: -45, duration: 250, easing: 'easeOutQuad' });
      } else {
        anime({ targets: spans[0], translateY: 0, rotate: 0, duration: 250, easing: 'easeOutQuad' });
        anime({ targets: spans[1], opacity: 1, duration: 250, easing: 'easeOutQuad' });
        anime({ targets: spans[2], translateY: 0, rotate: 0, duration: 250, easing: 'easeOutQuad' });
      }
    }
  });

  // Close nav when a link is clicked
  navList.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      navList.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    });
  });
}

// ── PARTICLE CANVAS ───────────────────────────────────────
function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let W, H, particles;
  const PARTICLE_COUNT = 55;
  const GOLD = 'rgba(195,161,102,';

  function resize() {
    W = canvas.width = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  function createParticle() {
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.8 + 0.4,
      vx: (Math.random() - 0.5) * 0.25,
      vy: -(Math.random() * 0.4 + 0.1),
      a: Math.random() * 0.5 + 0.1,
    };
  }

  function init() {
    resize();
    particles = Array.from({ length: PARTICLE_COUNT }, createParticle);
  }

  let animationId = null;
  let isRunning = true;

  function draw() {
    if (!isRunning) return;
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = GOLD + p.a + ')';
      ctx.fill();

      p.x += p.vx;
      p.y += p.vy;

      if (p.y < -5) { p.y = H + 5; p.x = Math.random() * W; }
      if (p.x < 0) p.x = W;
      if (p.x > W) p.x = 0;
    });
    animationId = requestAnimationFrame(draw);
  }

  window.pauseParticles = () => {
    isRunning = false;
    window.particlesIsRunning = false;
    if (animationId) cancelAnimationFrame(animationId);
  };

  window.resumeParticles = () => {
    if (isRunning) return;
    isRunning = true;
    window.particlesIsRunning = true;
    draw();
  };

  window.particlesIsRunning = true;

  window.addEventListener('resize', resize, { passive: true });
  init();
  draw();
}

// ── TIMELINE SCROLL REVEAL ────────────────────────────────
function initTimelineReveal() {
  if (typeof anime === 'undefined') return;

  const steps = document.querySelectorAll('.timeline-step');
  if (!steps.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, idx) => {
      if (entry.isIntersecting) {
        anime({
          targets: entry.target.querySelector('.step-number'),
          scale: [0.5, 1],
          opacity: [0, 1],
          boxShadow: ['0 0 0px rgba(195,161,102,0)', '0 0 30px rgba(195,161,102,0.35)'],
          duration: 600,
          delay: 100,
          easing: 'spring(1, 80, 12, 0)',
        });
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  steps.forEach(step => observer.observe(step));
}

// ── BLOG GRID RENDERER ────────────────────────────────────
function initBlogGrid() {
  const grid = document.getElementById('blog-grid');
  if (!grid || typeof CMS === 'undefined') return;

  const limit = grid.getAttribute('data-limit');
  const posts = limit === 'all' ? CMS.getPosts() : CMS.getPosts().slice(0, 3);

  // Remove skeletons
  grid.innerHTML = '';

  if (!posts.length) {
    grid.innerHTML = '<p class="blog-empty">Nenhum artigo publicado ainda. <a href="admin/index.html">Adicione pelo painel CMS.</a></p>';
    return;
  }

  posts.forEach((post, i) => {
    const card = createBlogCard(post, i);
    grid.appendChild(card);
  });
}

function formatDate(dateStr) {
  try {
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(dateStr + 'T12:00:00'));
  } catch {
    return dateStr;
  }
}

function createBlogCard(post, index) {
  const card = document.createElement('article');
  card.className = 'blog-card';
  card.setAttribute('role', 'listitem');
  card.setAttribute('data-aos', 'fade-up');
  card.setAttribute('data-aos-delay', String(index * 100));
  card.setAttribute('tabindex', '0');

  const imgHtml = post.coverUrl
    ? `<img src="${escapeHtml(post.coverUrl)}" alt="${escapeHtml(post.coverAlt || post.title)}" loading="lazy" />`
    : generatePlaceholderSVG(post.title);

  card.innerHTML = `
    <div class="blog-card-image">${imgHtml}</div>
    <div class="blog-card-body">
      <p class="blog-card-date">${formatDate(post.date)}</p>
      <h3 class="blog-card-title">${escapeHtml(post.title)}</h3>
      <p class="blog-card-excerpt">${escapeHtml(post.excerpt)}</p>
      <span class="blog-card-read-more">
        Ler artigo
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      </span>
    </div>
  `;

  // Click to open full post (basic modal)
  card.addEventListener('click', () => openPostModal(post));
  card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') openPostModal(post); });

  return card;
}

function generatePlaceholderSVG(title) {
  const colors = ['#252830', '#2D3040', '#1A1D26'];
  const bg = colors[Math.floor(Math.random() * colors.length)];
  return `
    <div class="blog-img-placeholder" style="background:${bg};" aria-label="Imagem do artigo: ${escapeHtml(title)}">
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M24 8L8 16v10c0 9 6.7 17.4 16 19 9.3-1.6 16-10 16-19V16L24 8z" stroke="#C3A166" stroke-width="1.5" opacity="0.4"/>
        <path d="M18 24h12M18 28h8" stroke="#C3A166" stroke-width="1.5" stroke-linecap="round" opacity="0.4"/>
      </svg>
    </div>`;
}

// ── POST MODAL ────────────────────────────────────────────
function openPostModal(post) {
  // Remove existing modal
  document.getElementById('post-modal')?.remove();

  const overlay = document.createElement('div');
  overlay.id = 'post-modal';
  overlay.className = 'post-modal-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', post.title);

  const coverHtml = post.coverUrl
    ? `<div class="post-modal-cover-wrap"><img src="${escapeHtml(post.coverUrl)}" alt="${escapeHtml(post.coverAlt || post.title)}" class="post-modal-cover" /></div>`
    : '';

  overlay.innerHTML = `
    <div class="post-modal-content">
      <button class="post-modal-close" aria-label="Fechar artigo">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
      ${coverHtml}
      <p class="post-modal-date">${formatDate(post.date)}</p>
      <h2 class="post-modal-title">${escapeHtml(post.title)}</h2>
      <div class="post-modal-body">${post.content || escapeHtml(post.excerpt)}</div>
      <div class="post-modal-footer">
        <a href="https://wa.me/message/267L3H22YEJVE1" class="btn-primary-pulse post-modal-cta" target="_blank" rel="noopener noreferrer">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.555 4.116 1.528 5.852L0 24l6.335-1.652A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.886 0-3.655-.502-5.186-1.378l-.371-.215-3.757.979.999-3.648-.239-.384A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
          Consultar sobre este tema
        </a>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';
  document.body.classList.add('post-modal-open');

  // Pause particles animation
  if (typeof window.pauseParticles === 'function') {
    window.pauseParticles();
  }

  // Animate in
  if (typeof anime !== 'undefined') {
    anime({ targets: overlay, opacity: [0, 1], duration: 200, easing: 'easeOutQuad' });
    anime({ targets: overlay.querySelector('.post-modal-content'), translateY: [40, 0], opacity: [0, 1], duration: 400, easing: 'easeOutExpo' });
  }

  const close = () => {
    // Resume particles animation
    if (typeof window.resumeParticles === 'function') {
      window.resumeParticles();
    }

    if (typeof anime !== 'undefined') {
      anime({
        targets: overlay,
        opacity: [1, 0],
        duration: 200,
        easing: 'easeInQuad',
        complete: () => {
          overlay.remove();
          document.body.style.overflow = '';
          document.body.classList.remove('post-modal-open');
        }
      });
    } else {
      overlay.remove();
      document.body.style.overflow = '';
      document.body.classList.remove('post-modal-open');
    }
  };

  overlay.querySelector('.post-modal-close').addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', function esc(e) {
    if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); }
  });
}

// ── FAQ ACCORDION (Design Spell: staggered open) ──────────
function initFAQ() {
  const items = document.querySelectorAll('.faq-item');
  items.forEach(item => {
    item.addEventListener('toggle', () => {
      if (item.open && typeof anime !== 'undefined') {
        anime({
          targets: item.querySelector('.faq-answer'),
          opacity: [0, 1],
          translateY: [-8, 0],
          duration: 300,
          easing: 'easeOutQuad',
        });
      }
    });
  });
}

// ── WHATSAPP FLOAT (Design Spell: reveal on scroll) ───────
function initWhatsAppFloat() {
  const btn = document.getElementById('whatsapp-float');
  if (!btn) return;

  // Show after 2s or on first scroll
  let shown = false;
  const show = () => {
    if (shown) return;
    shown = true;
    if (typeof anime !== 'undefined') {
      anime({
        targets: btn,
        scale: [0, 1],
        opacity: [0, 1],
        duration: 500,
        easing: 'spring(1, 80, 10, 0)',
      });
    } else {
      btn.style.opacity = '1';
    }
  };

  btn.style.opacity = '0';
  btn.style.transform = 'scale(0)';
  setTimeout(show, 2500);
  window.addEventListener('scroll', show, { once: true, passive: true });
}

// ── YEAR ──────────────────────────────────────────────────
function setCurrentYear() {
  const el = document.getElementById('current-year');
  if (el) el.textContent = new Date().getFullYear();
}

// ── SECURITY HELPER ───────────────────────────────────────
function escapeHtml(str = '') {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(String(str)));
  return div.innerHTML;
}

// ── POST MODAL CSS (injected programmatically) ─────────────
const modalStyles = `
body.post-modal-open > :not(.post-modal-overlay):not(script):not(style) {
  visibility: hidden !important;
}

.post-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: #061914; /* solid luxurious dark green color to eliminate backdrop blur redraw lag */
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 60px 24px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.post-modal-content {
  position: relative;
  width: 100%;
  max-width: 780px;
  background: #0b221c;
  border: 1px solid rgba(195,161,102,0.35);
  border-radius: 24px;
  padding: 48px;
  box-shadow: none; /* removed heavy blur shadow to save GPU composition overhead during scroll */
  will-change: transform, opacity;
}

.post-modal-cover-wrap {
  width: 100%;
  max-height: 360px;
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 28px;
  border: 1px solid rgba(255,255,255,0.06);
}

.post-modal-cover {
  width: 100%;
  height: 100%;
  max-height: 360px;
  object-fit: cover;
  display: block;
}

.post-modal-close {
  position: absolute;
  top: 24px;
  right: 24px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 50%;
  color: var(--ouro-light, #d4b87a);
  transition: all 250ms ease;
  cursor: pointer;
  z-index: 10;
}

.post-modal-close:hover {
  background: rgba(195,161,102,0.2);
  color: #fff;
  transform: rotate(90deg);
}

.post-modal-date {
  display: block;
  font-family: var(--f-corpo);
  font-size: 0.85rem;
  color: var(--ouro-light, #d4b87a);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 12px;
}

.post-modal-title {
  font-family: var(--f-titulo);
  font-size: clamp(1.8rem, 4.5vw, 2.5rem);
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 28px;
  line-height: 1.25;
}

.post-modal-body {
  font-family: var(--f-corpo);
  font-size: 1.08rem;
  line-height: 1.85;
  color: #e2e8f0;
  margin-bottom: 36px;
}

.post-modal-body h2,
.post-modal-body h3,
.post-modal-body h4 {
  font-family: var(--f-titulo);
  color: #ffffff;
  margin-block: 36px 16px;
  line-height: 1.3;
}

.post-modal-body h2 {
  font-size: 1.6rem;
  border-bottom: 1px solid rgba(195,161,102,0.25);
  padding-bottom: 10px;
}

.post-modal-body h3 {
  font-size: 1.35rem;
  border-bottom: 1px solid rgba(195,161,102,0.15);
  padding-bottom: 8px;
}

.post-modal-body h4 {
  font-size: 1.15rem;
}

.post-modal-body p {
  margin-bottom: 22px;
}

.post-modal-body ul {
  list-style: none;
  padding-left: 0;
  margin-bottom: 22px;
}

.post-modal-body ul li {
  position: relative;
  padding-left: 24px;
  margin-bottom: 12px;
  line-height: 1.6;
}

.post-modal-body ul li::before {
  content: "•";
  color: var(--ouro-light, #d4b87a);
  position: absolute;
  left: 6px;
  font-size: 1.3rem;
  line-height: 1.2;
}

.post-modal-body ol {
  padding-left: 20px;
  margin-bottom: 22px;
}

.post-modal-body ol li {
  margin-bottom: 12px;
  line-height: 1.6;
}

.post-modal-body strong {
  color: var(--ouro-light, #d4b87a);
  font-weight: 700;
}

.post-modal-body blockquote {
  border-left: 4px solid var(--ouro, #C4922A);
  padding: 18px 24px;
  margin: 32px 0;
  font-style: italic;
  font-family: var(--f-titulo);
  font-size: 1.15rem;
  line-height: 1.65;
  color: #cbd5e1;
  background: rgba(196, 146, 42, 0.05);
  border-radius: 0 16px 16px 0;
  box-shadow: inset 2px 0 8px rgba(0, 0, 0, 0.2);
}

.post-modal-body a {
  color: var(--ouro-light, #d4b87a);
  text-decoration: underline;
  transition: color 200ms;
}

.post-modal-body a:hover {
  color: #ffffff;
}

.post-modal-body a.btn-primary-pulse,
.post-modal-body a.post-modal-cta {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 10px !important;
  padding: 16px 36px !important;
  background: #C4922A !important;
  color: #ffffff !important;
  font-family: var(--f-corpo, 'Inter', sans-serif) !important;
  font-size: 0.95rem !important;
  font-weight: 700 !important;
  text-transform: uppercase !important;
  letter-spacing: 0.05em !important;
  border-radius: 8px !important;
  border: 2px solid #C4922A !important;
  text-decoration: none !important;
  box-shadow: 0 4px 15px rgba(196, 146, 42, 0.3) !important;
  transition: all 250ms ease !important;
  cursor: pointer !important;
  animation: ctaPulse 2s infinite !important;
}

.post-modal-body a.btn-primary-pulse:hover,
.post-modal-body a.post-modal-cta:hover {
  background: #d4a843 !important;
  border-color: #d4a843 !important;
  transform: translateY(-2px) !important;
  box-shadow: 0 8px 25px rgba(196, 146, 42, 0.45) !important;
  color: #ffffff !important;
}


.post-modal-body img {
  max-width: 100%;
  height: auto;
  border-radius: 12px;
  margin-block: 20px;
  border: 1px solid rgba(255,255,255,0.06);
  box-shadow: 0 12px 35px rgba(0,0,0,0.45);
}

.post-modal-footer {
  display: flex;
  justify-content: center;
  margin-top: 40px;
  border-top: 1px solid rgba(255,255,255,0.06);
  padding-top: 28px;
}

.post-modal-cta {
  display: inline-flex !important;
  align-items: center;
  gap: 10px;
  padding: 16px 36px;
  background: #C4922A;
  color: #ffffff !important;
  font-family: var(--f-corpo, 'Montserrat', sans-serif);
  font-size: 0.95rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-radius: 8px;
  border: 2px solid #C4922A;
  text-decoration: none !important;
  box-shadow: 0 4px 15px rgba(196, 146, 42, 0.3);
  transition: all 250ms ease;
  cursor: pointer;
  animation: ctaPulse 2s infinite;
}

.post-modal-cta:hover {
  background: #d4a843;
  border-color: #d4a843;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(196, 146, 42, 0.45);
  color: #ffffff !important;
}

.post-modal-cta svg {
  fill: currentColor;
}

@keyframes ctaPulse {
  0% {
    box-shadow: 0 0 0 0 rgba(196, 146, 42, 0.5);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(196, 146, 42, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(196, 146, 42, 0);
  }
}

.blog-empty {
  grid-column: 1 / -1;
  text-align: center;
  color: var(--ouro-light);
  font-size: 0.95rem;
  padding: 40px;
}

.blog-empty a { color: var(--branco); text-decoration: underline; }

@media (max-width: 768px) {
  .post-modal-content {
    padding: 36px 20px 28px 20px;
    border-radius: 20px;
  }
  .post-modal-cover-wrap {
    max-height: 220px;
    margin-bottom: 20px;
  }
  .post-modal-close {
    top: 16px;
    right: 16px;
  }
}
`;

const styleTag = document.createElement('style');
styleTag.textContent = modalStyles;
document.head.appendChild(styleTag);
