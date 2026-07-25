// ===== SOLVE IT — 3D GALAXY BACKGROUND =====
(function () {
  const canvas = document.getElementById('galaxyCanvas');
  const ctx = canvas.getContext('2d');

  let W, H, cx, cy;
  let stars = [];
  let nebulaClouds = [];
  let shootingStars = [];
  let animFrame;
  const STAR_COUNT = 1400;
  const NEBULA_COUNT = 6;

  // ── Resize ──────────────────────────────────────────
  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    cx = W / 2;
    cy = H / 2;
  }

  // ── Star class (3D spiral galaxy) ───────────────────
  function createStar() {
    const arm     = Math.floor(Math.random() * 3);          // 3 spiral arms
    const radius  = Math.pow(Math.random(), 0.5) * 900;     // clumped toward center
    const angle   = (arm * (Math.PI * 2 / 3))
                  + (radius / 900) * Math.PI * 5            // spiral twist
                  + (Math.random() - 0.5) * 0.8;            // scatter
    const z       = (Math.random() - 0.5) * 200;            // 3-D depth
    const scatter = (Math.random() - 0.5) * 60;

    return {
      x3: Math.cos(angle) * radius + scatter,
      y3: Math.sin(angle) * radius + scatter,
      z3: z,
      size: Math.random() * 1.8 + 0.2,
      baseAlpha: Math.random() * 0.7 + 0.3,
      twinkleSpeed: Math.random() * 0.04 + 0.01,
      twinkleOffset: Math.random() * Math.PI * 2,
      color: pickStarColor(),
      rotAngle: 0,
      rotSpeed: (Math.random() * 0.0003 + 0.00008) * (Math.random() < 0.5 ? 1 : -1),
    };
  }

  function pickStarColor() {
    const palette = [
      'rgba(180,200,255,',   // blue-white
      'rgba(255,220,180,',   // warm yellow
      'rgba(150,220,255,',   // cyan
      'rgba(200,180,255,',   // lavender
      'rgba(255,180,200,',   // pink
      'rgba(255,255,255,',   // pure white
    ];
    return palette[Math.floor(Math.random() * palette.length)];
  }

  // ── Nebula clouds ────────────────────────────────────
  function createNebula() {
    return {
      x: (Math.random() - 0.5) * 700,
      y: (Math.random() - 0.5) * 500,
      r: Math.random() * 280 + 120,
      color: pickNebulaColor(),
      alpha: Math.random() * 0.045 + 0.01,
      drift: Math.random() * 0.00015 + 0.00005,
      phase: Math.random() * Math.PI * 2,
    };
  }

  function pickNebulaColor() {
    const c = [
      '100,80,255',
      '255,60,180',
      '60,200,255',
      '120,60,255',
      '255,120,60',
      '60,255,180',
    ];
    return c[Math.floor(Math.random() * c.length)];
  }

  // ── Shooting stars ───────────────────────────────────
  function spawnShootingStar() {
    const angle = Math.random() * Math.PI * 0.6 + Math.PI * 0.2;
    const speed = Math.random() * 12 + 8;
    return {
      x: Math.random() * W,
      y: Math.random() * H * 0.5,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      len: Math.random() * 120 + 60,
      alpha: 1,
      life: 0,
      maxLife: Math.random() * 40 + 30,
    };
  }

  // ── Init ─────────────────────────────────────────────
  function init() {
    stars = Array.from({ length: STAR_COUNT }, createStar);
    nebulaClouds = Array.from({ length: NEBULA_COUNT }, createNebula);
    shootingStars = [];

    // Occasional shooting stars
    setInterval(() => {
      if (Math.random() < 0.6) shootingStars.push(spawnShootingStar());
    }, 2800);
  }

  // ── Project 3-D → 2-D with rotation ─────────────────
  let globalAngle = 0;

  function project(star, t) {
    // Slowly rotate galaxy
    const ga = globalAngle;
    const cos = Math.cos(ga);
    const sin = Math.sin(ga);

    const rx = star.x3 * cos - star.y3 * sin;
    const ry = star.x3 * sin + star.y3 * cos;
    const rz = star.z3;

    // Perspective
    const fov = 600;
    const scale = fov / (fov + rz + 400);
    const sx = cx + rx * scale;
    const sy = cy + ry * scale * 0.45; // flatten Y for galactic tilt

    const twinkle = 0.5 + 0.5 * Math.sin(t * star.twinkleSpeed + star.twinkleOffset);
    const alpha = star.baseAlpha * (0.6 + 0.4 * twinkle);
    const size  = star.size * scale * (0.8 + 0.4 * twinkle);

    return { sx, sy, scale, alpha, size };
  }

  // ── Draw frame ───────────────────────────────────────
  function draw(t) {
    // Deep space background
    ctx.fillStyle = '#00000f';
    ctx.fillRect(0, 0, W, H);

    // Radial deep-space glow
    const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * 0.7);
    bg.addColorStop(0,   'rgba(20,10,60,0.9)');
    bg.addColorStop(0.4, 'rgba(10,5,30,0.7)');
    bg.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Nebula clouds
    nebulaClouds.forEach(n => {
      const nx = cx + n.x + Math.sin(t * n.drift + n.phase) * 30;
      const ny = cy + n.y + Math.cos(t * n.drift + n.phase) * 20;
      const grad = ctx.createRadialGradient(nx, ny, 0, nx, ny, n.r);
      grad.addColorStop(0,   `rgba(${n.color},${n.alpha})`);
      grad.addColorStop(0.5, `rgba(${n.color},${n.alpha * 0.3})`);
      grad.addColorStop(1,   `rgba(${n.color},0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(nx, ny, n.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Stars
    globalAngle += 0.00025;
    stars.forEach(star => {
      const { sx, sy, alpha, size } = project(star, t);
      if (sx < -20 || sx > W + 20 || sy < -20 || sy > H + 20) return;

      // Glow halo for brighter stars
      if (size > 1.2) {
        const halo = ctx.createRadialGradient(sx, sy, 0, sx, sy, size * 4);
        halo.addColorStop(0,   `${star.color}${alpha * 0.6})`);
        halo.addColorStop(1,   `${star.color}0)`);
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(sx, sy, size * 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Core star dot
      ctx.fillStyle = `${star.color}${alpha})`;
      ctx.beginPath();
      ctx.arc(sx, sy, size, 0, Math.PI * 2);
      ctx.fill();
    });

    // Galactic core glow
    const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 180);
    coreGrad.addColorStop(0,   'rgba(180,160,255,0.18)');
    coreGrad.addColorStop(0.3, 'rgba(100,80,220,0.08)');
    coreGrad.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, 180, 0, Math.PI * 2);
    ctx.fill();

    // Shooting stars
    shootingStars = shootingStars.filter(s => {
      s.x += s.vx;
      s.y += s.vy;
      s.life++;
      s.alpha = 1 - s.life / s.maxLife;

      if (s.alpha <= 0) return false;

      ctx.save();
      ctx.globalAlpha = s.alpha;
      ctx.strokeStyle = 'rgba(180,220,255,1)';
      ctx.lineWidth = 2;
      ctx.shadowColor = 'rgba(150,200,255,0.8)';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x - s.vx * (s.len / Math.hypot(s.vx, s.vy)),
                 s.y - s.vy * (s.len / Math.hypot(s.vx, s.vy)));
      ctx.stroke();
      ctx.restore();
      return true;
    });
  }

  // ── Animation loop ───────────────────────────────────
  function loop(t) {
    draw(t * 0.016);
    animFrame = requestAnimationFrame(loop);
  }

  // ── Mouse parallax ───────────────────────────────────
  let mouseX = 0, mouseY = 0;
  document.addEventListener('mousemove', e => {
    mouseX = (e.clientX - cx) / cx;
    mouseY = (e.clientY - cy) / cy;
    // subtle parallax nudge
    nebulaClouds.forEach((n, i) => {
      n.x += mouseX * 0.08 * (i % 2 === 0 ? 1 : -1);
      n.y += mouseY * 0.08 * (i % 2 === 0 ? 1 : -1);
    });
  });

  // ── Boot ─────────────────────────────────────────────
  window.addEventListener('resize', () => { resize(); });
  resize();
  init();
  requestAnimationFrame(loop);
})();
