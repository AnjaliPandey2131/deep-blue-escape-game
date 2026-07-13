// ocean-bg.js — Full-Screen Continuous Ambient Ocean Environment v1.3
// Renders behind ALL UI elements (HUD, board, overlays, victory screen).
// Runs its own requestAnimationFrame loop, completely independent of game state.

export class OceanBackground {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.W = 0;
    this.H = 0;

    // All ambient systems
    this.bubbles = [];
    this.plankton = [];
    this.rays = [];
    this.fishSchools = [];
    this.turtles = [];
    this.jellyfish = [];
    this.octopus = null;
    this.waveTimer = this._rand(30000, 46000);
    this.wave = null;

    this._resize();
    this._init();

    // Independent loop
    this._lastTs = null;
    this._boundTick = this._tick.bind(this);
    requestAnimationFrame(this._boundTick);

    // Handle viewport resize
    window.addEventListener('resize', () => { this._resize(); this._init(); });
  }

  // ─── Utilities ─────────────────────────────────────────────────────────────

  _rand(a, b) { return a + Math.random() * (b - a); }

  _resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.canvas.width = Math.floor(w * dpr);
    this.canvas.height = Math.floor(h * dpr);
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.W = w;
    this.H = h;
  }

  // ─── System Init ───────────────────────────────────────────────────────────

  _init() {
    const W = this.W, H = this.H;

    // 28 background bubbles
    this.bubbles = [];
    for (let i = 0; i < 28; i++) this.bubbles.push(this._makeBubble(true));

    // 40 plankton/dust motes
    this.plankton = [];
    for (let i = 0; i < 40; i++) {
      this.plankton.push({
        x: Math.random() * W, y: Math.random() * H,
        size: this._rand(0.6, 2.2),
        speedX: this._rand(-0.15, 0.15),
        speedY: -(this._rand(0.04, 0.24)),
        opacity: this._rand(0.1, 0.42)
      });
    }

    // 5 volumetric light rays
    this.rays = [];
    for (let i = 0; i < 5; i++) {
      this.rays.push({
        x: W * (0.08 + i * 0.19),
        width: this._rand(40, 82),
        opacity: this._rand(0.018, 0.052),
        speed: this._rand(0.008, 0.022) * (Math.random() > 0.5 ? 1 : -1),
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: this._rand(0.0004, 0.0012)
      });
    }

    // 4 colorful fish schools
    const COLORS = ['#00f2fe', '#f9ca24', '#e17055', '#55efc4', '#a29bfe', '#fd79a8'];
    this.fishSchools = [];
    for (let s = 0; s < 4; s++) {
      const dir = Math.random() > 0.5 ? 1 : -1;
      const speed = this._rand(0.028, 0.07) * dir;
      const fishes = [];
      const count = Math.floor(Math.random() * 6) + 3;
      const col = COLORS[s % COLORS.length];
      for (let f = 0; f < count; f++) {
        fishes.push({
          offsetX: this._rand(-38, 38), offsetY: this._rand(-25, 25),
          size: this._rand(3, 7),
          tailSpeed: this._rand(0.007, 0.014),
          tailAngle: Math.random() * Math.PI * 2
        });
      }
      this.fishSchools.push({
        x: dir > 0 ? -130 : W + 130,
        y: this._rand(H * 0.04, H * 0.88),
        speedX: speed, direction: dir, color: col, fishes
      });
    }

    // 2 sea turtles (staggered)
    this.turtles = [];
    for (let i = 0; i < 2; i++) this.turtles.push(this._makeTurtle(true, i * 18000));

    // 5 jellyfish
    this.jellyfish = [];
    for (let i = 0; i < 5; i++) this.jellyfish.push(this._makeJellyfish(true));

    // 1 distant octopus
    this.octopus = this._makeOctopus();
  }

  // ─── Object Factories ──────────────────────────────────────────────────────

  _makeBubble(randomY) {
    const W = this.W, H = this.H;
    return {
      x: Math.random() * W,
      y: randomY ? Math.random() * H : H + 22,
      size: this._rand(2, 9),
      speedY: this._rand(0.3, 1.35),
      wobble: Math.random() * 100,
      wobbleSpeed: this._rand(0.007, 0.018),
      opacity: this._rand(0.15, 0.36)
    };
  }

  _makeTurtle(randomX, delay) {
    const W = this.W, H = this.H;
    const dir = Math.random() > 0.5 ? 1 : -1;
    return {
      x: randomX ? this._rand(W * 0.1, W * 0.9) : (dir > 0 ? -210 : W + 210),
      y: this._rand(H * 0.06, H * 0.62),
      size: this._rand(30, 50),
      speed: this._rand(0.018, 0.055) * dir,
      direction: dir,
      legAngle: Math.random() * Math.PI * 2,
      delay: delay || 0,
      active: !delay,
      opacity: this._rand(0.1, 0.22)
    };
  }

  _makeJellyfish(randomY) {
    const W = this.W, H = this.H;
    const HUES = [
      'rgba(200,100,255,', 'rgba(255,100,200,',
      'rgba(120,160,255,', 'rgba(100,220,255,'
    ];
    return {
      x: Math.random() * W,
      y: randomY ? this._rand(H * 0.04, H * 0.92) : H + 90,
      size: this._rand(10, 20),
      speedY: -(this._rand(0.09, 0.27)),
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: this._rand(0.001, 0.004),
      hue: HUES[Math.floor(Math.random() * HUES.length)],
      opacity: this._rand(0.07, 0.17),
      tentPhase: Math.random() * Math.PI * 2
    };
  }

  _makeOctopus() {
    const W = this.W, H = this.H;
    const dir = Math.random() > 0.5 ? 1 : -1;
    return {
      x: dir > 0 ? -260 : W + 260,
      y: this._rand(H * 0.5, H * 0.9),
      size: 65,
      speed: this._rand(0.18, 0.38) * dir,
      direction: dir,
      armPhase: 0,
      active: false,
      timer: this._rand(28000, 55000)
    };
  }

  // ─── Loop ──────────────────────────────────────────────────────────────────

  _tick(ts) {
    if (!this._lastTs) this._lastTs = ts;
    const dt = Math.min(ts - this._lastTs, 50);
    this._lastTs = ts;
    this._update(dt);
    this._draw();
    requestAnimationFrame(this._boundTick);
  }

  // ─── Update ────────────────────────────────────────────────────────────────

  _update(dt) {
    const W = this.W, H = this.H;

    this.bubbles.forEach(b => {
      b.y -= b.speedY;
      b.wobble += b.wobbleSpeed;
      b.x += Math.sin(b.wobble) * 0.28;
      if (b.y < -22) Object.assign(b, this._makeBubble(false));
    });

    this.plankton.forEach(p => {
      p.x += p.speedX; p.y += p.speedY;
      if (p.y < -5) { p.y = H + 5; p.x = Math.random() * W; }
      if (p.x < -5 || p.x > W + 5) p.x = Math.random() * W;
    });

    this.rays.forEach(r => {
      r.wobble += r.wobbleSpeed;
      r.x += r.speed + Math.sin(r.wobble) * 0.12;
      if (r.x > W + 130) r.x = -130;
      else if (r.x < -130) r.x = W + 130;
    });

    this.fishSchools.forEach(school => {
      school.x += school.speedX * dt;
      school.fishes.forEach(f => { f.tailAngle += f.tailSpeed * dt; });
      if (school.direction > 0 && school.x > W + 150) {
        school.x = -150; school.y = this._rand(H * 0.04, H * 0.88);
      } else if (school.direction < 0 && school.x < -150) {
        school.x = W + 150; school.y = this._rand(H * 0.04, H * 0.88);
      }
    });

    this.turtles.forEach(t => {
      if (!t.active) { t.delay -= dt; if (t.delay <= 0) t.active = true; return; }
      t.x += t.speed * dt;
      t.legAngle += 0.004 * dt;
      if ((t.direction > 0 && t.x > W + 230) || (t.direction < 0 && t.x < -230))
        Object.assign(t, this._makeTurtle(false, this._rand(14000, 30000)));
    });

    this.jellyfish.forEach(j => {
      j.y += j.speedY; j.wobble += j.wobbleSpeed * dt;
      j.x += Math.sin(j.wobble) * 0.2; j.tentPhase += 0.003 * dt;
      if (j.y < -90) Object.assign(j, this._makeJellyfish(false));
    });

    const oct = this.octopus;
    if (!oct.active) {
      oct.timer -= dt;
      if (oct.timer <= 0) oct.active = true;
    } else {
      oct.x += oct.speed; oct.armPhase += 0.003 * dt;
      if ((oct.direction > 0 && oct.x > W + 290) || (oct.direction < 0 && oct.x < -290))
        this.octopus = this._makeOctopus();
    }

    if (!this.wave) {
      this.waveTimer -= dt;
      if (this.waveTimer <= 0) {
        this.wave = { x: -350, speed: 0.26, opacity: 0, phase: 0 };
        this.waveTimer = this._rand(30000, 46000);
      }
    } else {
      this.wave.x += this.wave.speed * dt;
      this.wave.phase += 0.004 * dt;
      const dist = Math.abs(this.wave.x - W / 2);
      this.wave.opacity = Math.max(0, 0.048 - (dist / (W * 0.6)) * 0.048);
      if (this.wave.x > W + 350) this.wave = null;
    }
  }

  // ─── Draw ──────────────────────────────────────────────────────────────────

  _draw() {
    const ctx = this.ctx;
    const W = this.W, H = this.H;
    ctx.clearRect(0, 0, W, H);

    // 1. Light rays
    this.rays.forEach(r => {
      const grad = ctx.createLinearGradient(r.x, 0, r.x + 175, H);
      grad.addColorStop(0, `rgba(0,242,254,${r.opacity})`);
      grad.addColorStop(0.55, `rgba(0,200,220,${r.opacity * 0.5})`);
      grad.addColorStop(1, 'rgba(0,242,254,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(r.x, 0); ctx.lineTo(r.x + r.width, 0);
      ctx.lineTo(r.x + r.width + 180, H); ctx.lineTo(r.x + 180, H);
      ctx.closePath(); ctx.fill();
    });

    // 2. Wave sweep
    if (this.wave) {
      const wv = this.wave;
      const wG = ctx.createLinearGradient(wv.x - 180, 0, wv.x + 180, 0);
      wG.addColorStop(0, 'rgba(0,180,255,0)');
      wG.addColorStop(0.5, `rgba(0,210,255,${wv.opacity})`);
      wG.addColorStop(1, 'rgba(0,180,255,0)');
      ctx.fillStyle = wG;
      ctx.fillRect(wv.x - 180, 0, 360, H);
      for (let bi = 0; bi < 6; bi++) {
        const bx = wv.x + Math.sin(bi * 1.8 + wv.phase) * 65;
        const by = H * (0.12 + bi * 0.13) - Math.sin(wv.phase + bi) * 22;
        ctx.strokeStyle = `rgba(180,240,255,${wv.opacity * 7})`;
        ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.arc(bx, by, 3 + bi * 0.8, 0, Math.PI * 2); ctx.stroke();
      }
    }

    // 3. Octopus silhouette
    const oct = this.octopus;
    if (oct.active) {
      ctx.save(); ctx.globalAlpha = 0.065; ctx.fillStyle = '#2c3e6a';
      this._drawOctopus(oct.x, oct.y, oct.size, oct.direction, oct.armPhase);
      ctx.restore();
    }

    // 4. Turtles
    this.turtles.forEach(t => {
      if (!t.active) return;
      ctx.save(); ctx.globalAlpha = t.opacity;
      this._drawTurtle(t.x, t.y, t.size, t.direction, t.legAngle);
      ctx.restore();
    });

    // 5. Jellyfish
    this.jellyfish.forEach(j => {
      ctx.save(); ctx.globalAlpha = j.opacity;
      this._drawJellyfish(j.x, j.y, j.size, j.hue, j.wobble, j.tentPhase);
      ctx.restore();
    });

    // 6. Fish schools
    this.fishSchools.forEach(school => {
      ctx.save(); ctx.globalAlpha = 0.16;
      school.fishes.forEach(f => {
        const fx = school.x + f.offsetX, fy = school.y + f.offsetY;
        ctx.save(); ctx.translate(fx, fy);
        if (school.direction < 0) ctx.scale(-1, 1);
        ctx.fillStyle = school.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, f.size, f.size * 0.6, 0, 0, Math.PI * 2); ctx.fill();
        const wag = Math.sin(f.tailAngle) * f.size * 0.32;
        ctx.beginPath();
        ctx.moveTo(-f.size * 0.8, 0);
        ctx.lineTo(-f.size * 1.4, -f.size * 0.42 + wag);
        ctx.lineTo(-f.size * 1.4, f.size * 0.42 + wag);
        ctx.closePath(); ctx.fill();
        ctx.restore();
      });
      ctx.restore();
    });

    // 7. Plankton
    this.plankton.forEach(p => {
      ctx.fillStyle = `rgba(168,230,206,${p.opacity})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
    });

    // 8. Bubbles
    this.bubbles.forEach(b => {
      ctx.fillStyle = `rgba(255,255,255,${b.opacity * 0.11})`;
      ctx.strokeStyle = `rgba(255,255,255,${b.opacity * 0.26})`;
      ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = `rgba(255,255,255,${b.opacity * 0.48})`;
      ctx.beginPath(); ctx.arc(b.x - b.size * 0.28, b.y - b.size * 0.28, b.size * 0.15, 0, Math.PI * 2); ctx.fill();
    });
  }

  // ─── Shape Renderers ───────────────────────────────────────────────────────

  _drawTurtle(x, y, size, dir, legPhase) {
    const ctx = this.ctx;
    ctx.save(); ctx.translate(x, y);
    if (dir < 0) ctx.scale(-1, 1);
    ctx.fillStyle = '#2e6845';
    const flapAmt = Math.sin(legPhase) * 0.35;
    // Flippers
    for (const [tx2, ty2, rot, xm] of [
      [-size * 0.35, -size * 0.28, -0.6 + flapAmt, 1],
      [-size * 0.35,  size * 0.28,  0.6 - flapAmt, 1],
      [ size * 0.3,  -size * 0.22,  0.5 - flapAmt * 0.5, -1],
      [ size * 0.3,   size * 0.22, -0.5 + flapAmt * 0.5, -1]
    ]) {
      ctx.save(); ctx.translate(tx2, ty2); ctx.rotate(rot);
      ctx.beginPath();
      ctx.ellipse(0, 0, size * (xm < 0 ? 0.42 : 0.55), size * (xm < 0 ? 0.16 : 0.2),
        xm < 0 ? 0.3 * xm : 0.4 * Math.sign(ty2), 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    // Shell
    ctx.fillStyle = '#3a7d55';
    ctx.beginPath(); ctx.ellipse(0, 0, size * 0.72, size * 0.52, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(30,80,50,0.5)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.ellipse(0, 0, size * 0.4, size * 0.28, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-size * 0.4, 0); ctx.lineTo(size * 0.4, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -size * 0.3); ctx.lineTo(0, size * 0.3); ctx.stroke();
    // Head
    ctx.fillStyle = '#2e6845';
    ctx.beginPath(); ctx.ellipse(-size * 0.82, 0, size * 0.28, size * 0.22, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#0a1820';
    ctx.beginPath(); ctx.arc(-size * 0.96, -size * 0.07, size * 0.07, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  _drawJellyfish(x, y, size, hue, wobble, tentPhase) {
    const ctx = this.ctx;
    ctx.save(); ctx.translate(x, y);
    const bellG = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
    bellG.addColorStop(0, `${hue} 0.5)`);
    bellG.addColorStop(0.65, `${hue} 0.22)`);
    bellG.addColorStop(1, `${hue} 0.04)`);
    ctx.fillStyle = bellG;
    ctx.beginPath(); ctx.ellipse(0, 0, size, size * 0.58, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = `${hue} 0.1)`;
    ctx.beginPath(); ctx.ellipse(0, -size * 0.17, size * 0.52, size * 0.3, 0, Math.PI, 0); ctx.fill();
    ctx.strokeStyle = `${hue} 0.32)`; ctx.lineWidth = 0.9;
    for (let t = 0; t < 6; t++) {
      const tx2 = (t / 5 - 0.5) * size * 1.6;
      ctx.beginPath(); ctx.moveTo(tx2, 0);
      for (let s = 1; s <= 8; s++) {
        ctx.lineTo(tx2 + Math.sin(tentPhase + s * 0.8 + t * 0.6) * size * 0.35 * (s / 8), s * size * 0.22);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  _drawOctopus(x, y, size, dir, armPhase) {
    const ctx = this.ctx;
    ctx.save(); ctx.translate(x, y);
    if (dir < 0) ctx.scale(-1, 1);
    for (let a = 0; a < 8; a++) {
      const baseAngle = (a / 8) * Math.PI + Math.PI * 0.12;
      ctx.save(); ctx.rotate(baseAngle + Math.sin(armPhase + a * 0.8) * 0.35);
      ctx.beginPath();
      ctx.moveTo(-size * 0.12, 0);
      ctx.bezierCurveTo(-size * 0.08, size * 0.5, -size * 0.04, size * 1.0, 0, size * 1.5);
      ctx.bezierCurveTo(size * 0.04, size * 1.0, size * 0.08, size * 0.5, size * 0.12, 0);
      ctx.closePath(); ctx.fill(); ctx.restore();
    }
    ctx.beginPath(); ctx.ellipse(0, -size * 0.55, size * 0.6, size * 0.72, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, -size * 0.1, size * 0.52, size * 0.4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(8,20,55,0.8)';
    ctx.beginPath(); ctx.arc(-size * 0.2, -size * 0.15, size * 0.12, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(size * 0.2, -size * 0.15, size * 0.12, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}
