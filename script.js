/* ===================================================
   AETHERIA — Scroll-Driven Frame Animation Engine
   =================================================== */

(() => {
  'use strict';

  // ─── Configuration ────────────────────────────────
  // Change these values if you add or remove frames.
  const FRAME_COUNT  = 240;
  const IMAGE_PATH   = './images/ezgif-frame-';
  const IMAGE_EXT    = '.jpg';

  // The total scrollable height = viewport heights × this multiplier.
  // Higher = slower animation per scroll distance.
  const SCROLL_HEIGHT_MULTIPLIER = 6;

  // ─── DOM References ───────────────────────────────
  const canvas   = document.getElementById('frame-canvas');
  const ctx      = canvas.getContext('2d');
  const loader   = document.getElementById('loader');
  const progress = document.getElementById('loader-progress');
  const navbar   = document.getElementById('navbar');

  // ─── State ────────────────────────────────────────
  const images       = [];
  let loadedCount    = 0;
  let currentFrame   = -1;       // Track to avoid redundant redraws
  let rafId          = null;
  let isReady        = false;

  // ─── Helpers ──────────────────────────────────────

  /** Pad a number to 3 digits: 1 → "001" */
  function padNumber(n) {
    return String(n).padStart(3, '0');
  }

  /** Resize canvas to match the window */
  function resizeCanvas() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    // Redraw after resize
    if (isReady) drawFrame(currentFrame === -1 ? 0 : currentFrame, true);
  }

  /** Draw a specific frame, cover-fit to canvas */
  function drawFrame(index, force) {
    if (!force && index === currentFrame) return;
    currentFrame = index;

    const img = images[index];
    if (!img || !img.complete) return;

    const cw = canvas.width;
    const ch = canvas.height;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;

    // Cover-fit calculation
    const scale = Math.max(cw / iw, ch / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    const dx = (cw - dw) / 2;
    const dy = (ch - dh) / 2;

    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, dx, dy, dw, dh);
  }

  // ─── Image Preloading ────────────────────────────

  function preloadImages() {
    return new Promise((resolve) => {
      for (let i = 1; i <= FRAME_COUNT; i++) {
        const img = new Image();
        img.src = `${IMAGE_PATH}${padNumber(i)}${IMAGE_EXT}`;

        img.onload = img.onerror = () => {
          loadedCount++;
          const pct = Math.round((loadedCount / FRAME_COUNT) * 100);
          progress.textContent = `${pct}%`;

          if (loadedCount === FRAME_COUNT) resolve();
        };

        images.push(img);
      }
    });
  }

  // ─── Scroll → Frame Mapping ──────────────────────

  function onScroll() {
    if (!isReady) return;

    const scrollTop   = window.scrollY || document.documentElement.scrollTop;
    const maxScroll   = document.documentElement.scrollHeight - window.innerHeight;
    const scrollFrac  = Math.min(Math.max(scrollTop / maxScroll, 0), 1);
    const frameIndex  = Math.min(
      Math.floor(scrollFrac * FRAME_COUNT),
      FRAME_COUNT - 1
    );

    drawFrame(frameIndex, false);

    // Navbar style
    if (scrollTop > 60) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }

  /** Use rAF to throttle scroll handler */
  function scrollHandler() {
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      onScroll();
      rafId = null;
    });
  }

  // ─── Reveal on Scroll (Intersection Observer) ────

  function initRevealObserver() {
    const revealEls = document.querySelectorAll('.reveal');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);       // Animate only once
          }
        });
      },
      { threshold: 0.15 }
    );

    revealEls.forEach((el) => observer.observe(el));
  }

  // ─── Set Page Height ─────────────────────────────

  function setScrollHeight() {
    // Make #content tall enough so the scroll range maps to all frames
    const content = document.getElementById('content');
    const minHeight = window.innerHeight * SCROLL_HEIGHT_MULTIPLIER;
    content.style.minHeight = `${minHeight}px`;
  }

  // ─── Smooth anchor links ─────────────────────────

  function initSmoothLinks() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(anchor.getAttribute('href'));
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  }

  // ─── Init ─────────────────────────────────────────

  async function init() {
    resizeCanvas();
    setScrollHeight();

    await preloadImages();

    // Hide loader
    isReady = true;
    loader.classList.add('hidden');

    // Draw first frame
    drawFrame(0, true);

    // Attach events
    window.addEventListener('scroll', scrollHandler, { passive: true });
    window.addEventListener('resize', () => {
      resizeCanvas();
      setScrollHeight();
    });

    initRevealObserver();
    initSmoothLinks();

    // Run once in case page starts scrolled
    onScroll();
  }

  // Kick off
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
