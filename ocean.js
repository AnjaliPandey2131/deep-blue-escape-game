// ocean.js — Cinematic Event Engine for Deep Blue Escape v1.2 "Living Ocean"
// Handles dramatic visual animations for special tile events.

// ─── Math / Utility Helpers ───────────────────────────────────────────────────

function easeInOut(t) {
  t = Math.max(0, Math.min(1, t));
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

function lerp(a, b, t) {
  t = Math.max(0, Math.min(1, t));
  return a + (b - a) * t;
}

function phaseNorm(p, start, end) {
  if (end <= start) return p >= start ? 1 : 0;
  return Math.max(0, Math.min(1, (p - start) / (end - start)));
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arc(x + w - r, y + r, r, -Math.PI / 2, 0);
  ctx.lineTo(x + w, y + h - r);
  ctx.arc(x + w - r, y + h - r, r, 0, Math.PI / 2);
  ctx.lineTo(x + r, y + h);
  ctx.arc(x + r, y + h - r, r, Math.PI / 2, Math.PI);
  ctx.lineTo(x, y + r);
  ctx.arc(x + r, y + r, r, Math.PI, -Math.PI / 2);
  ctx.closePath();
}

// ─── Shared Drawing Utilities ─────────────────────────────────────────────────

function drawOceanBg(ctx, w, h, alpha) {
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, `rgba(4, 10, 35, ${alpha})`);
  grad.addColorStop(0.55, `rgba(7, 18, 52, ${alpha})`);
  grad.addColorStop(1, `rgba(2, 6, 22, ${alpha})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

/** Draw the player fish (matches player.js visual style) */
function drawFish(ctx, x, y, size, color, shakeAmt) {
  shakeAmt = shakeAmt || 0;
  ctx.save();
  ctx.translate(
    x + (Math.random() - 0.5) * shakeAmt,
    y + (Math.random() - 0.5) * shakeAmt
  );

  // Tail
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-size * 0.75, 0);
  ctx.lineTo(-size * 1.4, -size * 0.55);
  ctx.lineTo(-size * 1.15, 0);
  ctx.lineTo(-size * 1.4, size * 0.55);
  ctx.closePath();
  ctx.fill();

  // Body
  ctx.beginPath();
  ctx.ellipse(0, 0, size, size * 0.65, 0, 0, Math.PI * 2);
  ctx.fill();

  // Dorsal fin
  ctx.beginPath();
  ctx.moveTo(-size * 0.15, -size * 0.55);
  ctx.quadraticCurveTo(-size * 0.45, -size * 1.0, -size * 0.65, -size * 0.55);
  ctx.closePath();
  ctx.fill();

  // Eye white
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.ellipse(size * 0.38, -size * 0.15, size * 0.2, size * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();
  // Pupil
  ctx.fillStyle = '#0f1c3f';
  ctx.beginPath();
  ctx.ellipse(size * 0.43, -size * 0.15, size * 0.1, size * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();
  // Shine
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.ellipse(size * 0.40, -size * 0.19, size * 0.04, size * 0.04, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawSkipHint(ctx, w, h, alpha) {
  if (alpha <= 0.02) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  const tw = 215, th = 30;
  const tx = w / 2 - tw / 2;
  const ty = h - 50;
  // Background pill
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  roundRect(ctx, tx, ty, tw, th, 10);
  ctx.fill();
  // Border
  ctx.strokeStyle = 'rgba(0, 220, 255, 0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();
  // Text
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.font = '13px "Outfit", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Click anywhere to skip  ›', w / 2, ty + th / 2);
  ctx.restore();
}

// ─── Character Shapes ─────────────────────────────────────────────────────────

function drawCoralBranches(ctx, cx, cy, progress, w, h) {
  const armCount = 6;
  const maxRadius = Math.min(w, h) * 0.36;

  for (let arm = 0; arm < armCount; arm++) {
    const baseAngle = (arm / armCount) * Math.PI * 2 + Math.PI / armCount;
    const startDist = maxRadius;
    const endDist = 20;
    const dist = lerp(startDist, endDist, progress);

    const sx = cx + Math.cos(baseAngle) * startDist;
    const sy = cy + Math.sin(baseAngle) * startDist;
    const ex = cx + Math.cos(baseAngle) * dist;
    const ey = cy + Math.sin(baseAngle) * dist;
    const midX = (sx + ex) / 2 + Math.sin(baseAngle) * 18 * (1 - progress);
    const midY = (sy + ey) / 2 - Math.cos(baseAngle) * 18 * (1 - progress);

    const hue = arm % 2 === 0 ? 'rgba(232, 67, 147, 0.75)' : 'rgba(0, 200, 168, 0.75)';
    ctx.save();
    ctx.strokeStyle = hue;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.quadraticCurveTo(midX, midY, ex, ey);
    ctx.stroke();

    // Tip circle
    if (progress > 0.25) {
      ctx.fillStyle = hue;
      ctx.beginPath();
      ctx.ellipse(ex, ey, 3 + progress * 3, 3 + progress * 3, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

function drawDolphin(ctx, x, y, size, angle) {
  angle = angle || 0;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  // Body
  ctx.fillStyle = '#4facfe';
  ctx.beginPath();
  ctx.ellipse(0, 0, size * 1.9, size * 0.52, 0, 0, Math.PI * 2);
  ctx.fill();

  // Belly
  ctx.fillStyle = '#a8dcff';
  ctx.beginPath();
  ctx.ellipse(size * 0.25, size * 0.08, size * 1.1, size * 0.27, 0, 0, Math.PI * 2);
  ctx.fill();

  // Dorsal fin
  ctx.fillStyle = '#3a8fe0';
  ctx.beginPath();
  ctx.moveTo(size * 0.15, -size * 0.42);
  ctx.lineTo(size * 0.6, -size * 1.2);
  ctx.lineTo(size * 0.9, -size * 0.42);
  ctx.closePath();
  ctx.fill();

  // Tail fluke
  ctx.fillStyle = '#3a8fe0';
  ctx.beginPath();
  ctx.moveTo(-size * 1.72, 0);
  ctx.lineTo(-size * 2.35, -size * 0.62);
  ctx.lineTo(-size * 1.95, -size * 0.1);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-size * 1.72, 0);
  ctx.lineTo(-size * 2.35, size * 0.62);
  ctx.lineTo(-size * 1.95, size * 0.1);
  ctx.closePath();
  ctx.fill();

  // Pec fin
  ctx.fillStyle = '#3a8fe0';
  ctx.beginPath();
  ctx.moveTo(size * 0.35, size * 0.3);
  ctx.lineTo(size * 0.8, size * 0.92);
  ctx.lineTo(size * 1.0, size * 0.3);
  ctx.closePath();
  ctx.fill();

  // Snout
  ctx.fillStyle = '#5ab8ff';
  ctx.beginPath();
  ctx.ellipse(size * 1.92, 0, size * 0.42, size * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();

  // Eye
  ctx.fillStyle = '#0a1830';
  ctx.beginPath();
  ctx.ellipse(size * 1.12, -size * 0.13, size * 0.13, size * 0.13, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.beginPath();
  ctx.ellipse(size * 1.09, -size * 0.17, size * 0.05, size * 0.05, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawCrab(ctx, x, y, size, timeP) {
  ctx.save();
  ctx.translate(x, y);
  const legWave = Math.sin(timeP * 38) * 0.28;

  // Legs (3 pairs)
  ctx.strokeStyle = '#c0392b';
  ctx.lineWidth = size * 0.1;
  ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    const ly = (i - 1) * size * 0.35;
    const len = size * 0.9;
    const la = legWave * (i % 2 === 0 ? 1 : -1);
    // Left
    ctx.save();
    ctx.translate(-size * 0.72, ly);
    ctx.rotate(-0.55 + la);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-len, len * 0.45);
    ctx.stroke();
    ctx.restore();
    // Right
    ctx.save();
    ctx.translate(size * 0.72, ly);
    ctx.rotate(0.55 - la);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(len, len * 0.45);
    ctx.stroke();
    ctx.restore();
  }

  // Shell body
  ctx.fillStyle = '#e74c3c';
  ctx.beginPath();
  ctx.ellipse(0, 0, size, size * 0.7, 0, 0, Math.PI * 2);
  ctx.fill();
  // Shell ridge
  ctx.strokeStyle = 'rgba(175, 30, 25, 0.45)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.6, -Math.PI * 0.75, -Math.PI * 0.25);
  ctx.stroke();

  // Claws
  const pinch = Math.sin(timeP * 15) * 0.3;
  // Left claw
  ctx.save();
  ctx.translate(-size * 1.12, -size * 0.42);
  ctx.rotate(-0.5 + pinch);
  ctx.fillStyle = '#c0392b';
  ctx.beginPath();
  ctx.ellipse(0, 0, size * 0.55, size * 0.38, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#a93226';
  ctx.beginPath();
  ctx.ellipse(-size * 0.28, -size * 0.32, size * 0.24, size * 0.15, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(-size * 0.18, size * 0.28, size * 0.2, size * 0.12, 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // Right claw
  ctx.save();
  ctx.translate(size * 1.12, -size * 0.42);
  ctx.rotate(0.5 - pinch);
  ctx.fillStyle = '#c0392b';
  ctx.beginPath();
  ctx.ellipse(0, 0, size * 0.55, size * 0.38, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#a93226';
  ctx.beginPath();
  ctx.ellipse(size * 0.28, -size * 0.32, size * 0.24, size * 0.15, 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(size * 0.18, size * 0.28, size * 0.2, size * 0.12, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Eye stalks + eyes
  ctx.fillStyle = '#8e1a12';
  ctx.fillRect(-size * 0.46, -size * 0.78, size * 0.09, size * 0.32);
  ctx.fillRect(size * 0.37, -size * 0.78, size * 0.09, size * 0.32);
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.ellipse(-size * 0.42, -size * 0.82, size * 0.11, size * 0.11, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(size * 0.42, -size * 0.82, size * 0.11, size * 0.11, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.beginPath();
  ctx.ellipse(-size * 0.38, -size * 0.87, size * 0.04, size * 0.04, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(size * 0.46, -size * 0.87, size * 0.04, size * 0.04, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawShark(ctx, x, y, size) {
  ctx.save();
  ctx.translate(x, y);

  // Pec fin (under)
  ctx.fillStyle = '#3c5464';
  ctx.beginPath();
  ctx.moveTo(size * 0.55, size * 0.22);
  ctx.lineTo(size * 1.15, size * 1.0);
  ctx.lineTo(size * 1.42, size * 0.22);
  ctx.closePath();
  ctx.fill();

  // Body
  ctx.fillStyle = '#5c6e7c';
  ctx.beginPath();
  ctx.moveTo(size * 2.6, 0);
  ctx.bezierCurveTo(size * 3.1, -size * 0.18, size * 2.1, -size * 0.7, 0, -size * 0.65);
  ctx.bezierCurveTo(-size * 2.0, -size * 0.52, -size * 2.6, 0, -size * 2.6, 0);
  ctx.bezierCurveTo(-size * 2.6, 0, -size * 2.0, size * 0.52, 0, size * 0.65);
  ctx.bezierCurveTo(size * 2.1, size * 0.7, size * 3.1, size * 0.18, size * 2.6, 0);
  ctx.closePath();
  ctx.fill();

  // Belly
  ctx.fillStyle = 'rgba(220, 232, 238, 0.28)';
  ctx.beginPath();
  ctx.ellipse(size * 0.4, size * 0.1, size * 1.6, size * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Dorsal fin (iconic)
  ctx.fillStyle = '#4a5e6c';
  ctx.beginPath();
  ctx.moveTo(size * 0.25, -size * 0.6);
  ctx.lineTo(size * 0.85, -size * 2.0);
  ctx.lineTo(size * 1.3, -size * 0.6);
  ctx.closePath();
  ctx.fill();

  // Tail
  ctx.fillStyle = '#4a5e6c';
  ctx.beginPath();
  ctx.moveTo(-size * 2.4, 0);
  ctx.lineTo(-size * 3.1, -size * 0.9);
  ctx.lineTo(-size * 2.6, -size * 0.15);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-size * 2.4, 0);
  ctx.lineTo(-size * 3.1, size * 0.9);
  ctx.lineTo(-size * 2.6, size * 0.15);
  ctx.closePath();
  ctx.fill();

  // Eye
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(size * 1.85, -size * 0.1, size * 0.14, size * 0.14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.beginPath();
  ctx.ellipse(size * 1.82, -size * 0.15, size * 0.06, size * 0.06, 0, 0, Math.PI * 2);
  ctx.fill();

  // Gill slits
  ctx.strokeStyle = 'rgba(65, 85, 98, 0.55)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 3; i++) {
    const gx = size * (0.85 - i * 0.32);
    ctx.beginPath();
    ctx.moveTo(gx, -size * 0.35);
    ctx.lineTo(gx, size * 0.35);
    ctx.stroke();
  }

  ctx.restore();
}

// ─── Individual Cinematic Draw Functions ──────────────────────────────────────

function cinematicCoralTrap(ctx, w, h, p) {
  const cx = w / 2, cy = h / 2;

  // Dark bg fade in
  const bgA = easeInOut(phaseNorm(p, 0, 0.15)) * 0.9;
  drawOceanBg(ctx, w, h, bgA);

  // Zoom in
  const zoom = lerp(1, 1.28, easeInOut(phaseNorm(p, 0.1, 0.32)));
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(zoom, zoom);
  ctx.translate(-cx, -cy);

  // Fish wiggles after corals close
  const wiggle = p > 0.52 ? Math.sin(p * 42) * 6 * Math.min(1, phaseNorm(p, 0.52, 0.78)) : 0;
  ctx.globalAlpha = easeInOut(phaseNorm(p, 0.1, 0.32));
  drawFish(ctx, cx, cy, 20, '#ff6b6b', wiggle);

  // Corals close in
  ctx.globalAlpha = easeInOut(phaseNorm(p, 0.28, 0.5));
  drawCoralBranches(ctx, cx, cy, easeInOut(phaseNorm(p, 0.28, 0.72)), w, h);

  // Bubbles escaping upward
  const bubP = phaseNorm(p, 0.5, 0.82);
  if (bubP > 0) {
    ctx.globalAlpha = 1;
    for (let i = 0; i < 9; i++) {
      const bAngle = -Math.PI / 2 + (i - 4) * 0.22;
      const bDist = 18 + bubP * 52 + i * 6;
      const bx = cx + Math.cos(bAngle) * bDist;
      const by = cy + Math.sin(bAngle) * bDist - bubP * 28;
      const r = (i % 3 + 1) * 1.2;
      ctx.strokeStyle = `rgba(180, 235, 255, ${(1 - bubP) * 0.65})`;
      ctx.fillStyle = `rgba(180, 235, 255, ${(1 - bubP) * 0.1})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(bx, by, r, r, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }

  ctx.restore();

  // Title
  const tA = easeInOut(phaseNorm(p, 0.1, 0.28)) * (1 - easeInOut(phaseNorm(p, 0.74, 0.84)));
  if (tA > 0.02) {
    ctx.save();
    ctx.globalAlpha = tA;
    ctx.fillStyle = '#ff8c69';
    ctx.font = 'bold 24px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(255, 100, 50, 0.8)';
    ctx.shadowBlur = 14;
    ctx.fillText('🪸  Coral Trap!', cx, h * 0.18);
    ctx.restore();
  }
}

function cinematicCrabAttack(ctx, w, h, p) {
  const cx = w / 2, cy = h / 2;

  const bgA = easeInOut(phaseNorm(p, 0, 0.13)) * 0.9;
  drawOceanBg(ctx, w, h, bgA);

  const zoom = lerp(1, 1.22, easeInOut(phaseNorm(p, 0.08, 0.28)));
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(zoom, zoom);
  ctx.translate(-cx, -cy);

  // Fish — shakes during pinch
  const pinchPhase = phaseNorm(p, 0.65, 0.8);
  const shake = pinchPhase > 0 ? Math.sin(pinchPhase * 58) * 7 * pinchPhase : 0;
  ctx.globalAlpha = easeInOut(phaseNorm(p, 0.1, 0.3));
  drawFish(ctx, cx, cy, 20, '#ff6b6b', shake);

  // Crab walk in from right, then walk away proud
  const walkIn = easeInOut(phaseNorm(p, 0.3, 0.58));
  const walkOut = easeInOut(phaseNorm(p, 0.8, 0.97));
  const crabX = cx + lerp(w * 0.42, cx + 58, walkIn) + walkOut * w * 0.5;
  const crabY = cy + Math.sin(p * 22) * 3.5;
  const crabA = easeInOut(phaseNorm(p, 0.3, 0.48)) * (1 - easeInOut(phaseNorm(p, 0.9, 0.99)));
  ctx.globalAlpha = crabA;
  drawCrab(ctx, crabX, crabY, 24, p);

  // Pinch line flash
  if (pinchPhase > 0.15 && pinchPhase < 0.85) {
    ctx.save();
    ctx.globalAlpha = (1 - pinchPhase) * 0.55;
    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 3]);
    ctx.beginPath();
    ctx.moveTo(cx + 22, cy);
    ctx.lineTo(crabX - 28, crabY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  ctx.restore();

  const tA = easeInOut(phaseNorm(p, 0.08, 0.25)) * (1 - easeInOut(phaseNorm(p, 0.74, 0.85)));
  if (tA > 0.02) {
    ctx.save();
    ctx.globalAlpha = tA;
    ctx.fillStyle = '#e74c3c';
    ctx.font = 'bold 24px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(231, 76, 60, 0.85)';
    ctx.shadowBlur = 14;
    ctx.fillText('🦀  Crab Attack!', cx, h * 0.18);
    ctx.restore();
  }
}

function cinematicDolphinRide(ctx, w, h, p) {
  const cx = w / 2, cy = h / 2;

  // Brighter, joyful backdrop
  const bgA = easeInOut(phaseNorm(p, 0, 0.13)) * 0.8;
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, `rgba(0, 28, 75, ${bgA})`);
  bg.addColorStop(1, `rgba(0, 12, 40, ${bgA})`);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Light rays
  ctx.save();
  ctx.globalAlpha = 0.055 * easeInOut(phaseNorm(p, 0.15, 0.65));
  for (let i = 0; i < 6; i++) {
    const rx = w * 0.05 + i * w * 0.16 + Math.sin(p * 3 + i) * 12;
    const rayG = ctx.createLinearGradient(rx, 0, rx + 90, h);
    rayG.addColorStop(0, 'rgba(0, 242, 254, 0.3)');
    rayG.addColorStop(1, 'rgba(0, 242, 254, 0)');
    ctx.fillStyle = rayG;
    ctx.beginPath();
    ctx.moveTo(rx, 0);
    ctx.lineTo(rx + 55, 0);
    ctx.lineTo(rx + 130, h);
    ctx.lineTo(rx + 75, h);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // Zoom out gently
  const zoom = lerp(1, 0.87, easeInOut(phaseNorm(p, 0.06, 0.22)));
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(zoom, zoom);
  ctx.translate(-cx, -cy);

  // Parabolic dolphin arc across screen
  const arcP = easeInOut(phaseNorm(p, 0.2, 0.8));
  const dStartX = w * 0.04, dEndX = w * 0.96;
  const dX = lerp(dStartX, dEndX, arcP);
  const arcH = h * 0.38;
  const dY = cy + arcH - 4 * arcH * arcP * (1 - arcP);
  // Angle of travel
  const arcAngle = Math.atan2(-(arcH * (1 - 2 * arcP) * 4) / w, 1) * 0.55;

  const dA = easeInOut(phaseNorm(p, 0.18, 0.32)) * (1 - easeInOut(phaseNorm(p, 0.78, 0.9)));
  if (dA > 0.02) {
    ctx.globalAlpha = dA;
    drawDolphin(ctx, dX, dY, 26, arcAngle);
    // Fish rides on back — slightly above and behind dorsal
    drawFish(ctx, dX - 8, dY - 24, 13, '#ff6b6b', 0);
  }

  // Splash at landing
  const splashP = phaseNorm(p, 0.74, 0.87);
  if (splashP > 0) {
    ctx.save();
    ctx.globalAlpha = (1 - splashP) * 0.8;
    ctx.strokeStyle = 'rgba(0, 210, 255, 0.85)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 14; i++) {
      const sa = -Math.PI / 2 + (i - 7) * 0.25;
      const sd = splashP * 50;
      ctx.beginPath();
      ctx.moveTo(dX, dY + 5);
      ctx.lineTo(dX + Math.cos(sa) * sd, dY + Math.sin(sa) * sd);
      ctx.stroke();
    }
    ctx.restore();
  }

  ctx.restore();

  const tA = easeInOut(phaseNorm(p, 0.08, 0.22)) * (1 - easeInOut(phaseNorm(p, 0.74, 0.86)));
  if (tA > 0.02) {
    ctx.save();
    ctx.globalAlpha = tA;
    ctx.fillStyle = '#00f2fe';
    ctx.font = 'bold 24px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0, 242, 254, 0.85)';
    ctx.shadowBlur = 16;
    ctx.fillText('🐬  Dolphin Ride!', cx, h * 0.18);
    ctx.restore();
  }
}

function cinematicShark(ctx, w, h, p) {
  const cx = w / 2, cy = h / 2;

  // Background — gradually darkens
  const bgA = Math.min(0.92, easeInOut(phaseNorm(p, 0, 0.16)) * 0.92);
  drawOceanBg(ctx, w, h, bgA);

  // Extra darkness during shark pass
  const extraDark = easeInOut(phaseNorm(p, 0.3, 0.52)) * (1 - easeInOut(phaseNorm(p, 0.56, 0.73))) * 0.28;
  ctx.fillStyle = `rgba(0, 0, 0, ${extraDark})`;
  ctx.fillRect(0, 0, w, h);

  const zoom = lerp(1, 1.17, easeInOut(phaseNorm(p, 0.06, 0.27)));
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(zoom, zoom);
  ctx.translate(-cx, -cy);

  // Shadow sweeps first (before shark)
  const shadowP = phaseNorm(p, 0.08, 0.36);
  if (shadowP > 0) {
    const sx = lerp(-w * 0.15, w * 1.15, easeInOut(shadowP));
    const shadowG = ctx.createRadialGradient(sx, cy + 28, 0, sx, cy + 28, 90);
    shadowG.addColorStop(0, `rgba(0, 0, 0, ${shadowP * 0.45})`);
    shadowG.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = shadowG;
    ctx.beginPath();
    ctx.ellipse(sx, cy + 28, 110, 42, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Shark swims across
  const sharkP = phaseNorm(p, 0.3, 0.74);
  if (sharkP > 0) {
    const sharkX = lerp(-w * 0.12, w * 1.12, easeInOut(sharkP));
    const sharkA = easeInOut(Math.min(1, sharkP * 4.5)) * (1 - easeInOut(Math.max(0, (sharkP - 0.82) * 5.5)));
    ctx.globalAlpha = sharkA;
    drawShark(ctx, sharkX, cy * 1.12, 30);
  }

  // Fish trembling
  const fishA = easeInOut(phaseNorm(p, 0.27, 0.42)) * (1 - easeInOut(phaseNorm(p, 0.76, 0.87)));
  const tremble = p > 0.32 && p < 0.76 ? 3.5 : 0;
  ctx.globalAlpha = fishA;
  drawFish(ctx, cx, cy - 12, 17, '#ff6b6b', tremble);

  // Fish escapes quickly
  const escP = easeInOut(phaseNorm(p, 0.74, 0.9));
  if (escP > 0) {
    const ex = cx - escP * w * 0.38;
    ctx.globalAlpha = (1 - escP) * 0.9;
    drawFish(ctx, ex, cy - 12, 17, '#ff6b6b', 0);
    // Speed lines
    ctx.strokeStyle = `rgba(255, 210, 160, ${(1 - escP) * 0.45})`;
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(ex + 24, cy - 12 + (i - 2) * 8);
      ctx.lineTo(ex + 24 + escP * 45, cy - 12 + (i - 2) * 8);
      ctx.stroke();
    }
  }

  ctx.restore();

  const tA = easeInOut(phaseNorm(p, 0.08, 0.24)) * (1 - easeInOut(phaseNorm(p, 0.74, 0.86)));
  if (tA > 0.02) {
    ctx.save();
    ctx.globalAlpha = tA;
    ctx.fillStyle = '#e74c3c';
    ctx.font = 'bold 24px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(231, 76, 60, 0.9)';
    ctx.shadowBlur = 16;
    ctx.fillText('🦈  Shark Encounter!', cx, h * 0.18);
    ctx.restore();
  }
}

function cinematicVolcano(ctx, w, h, p) {
  const cx = w / 2, cy = h / 2;

  // Camera shake 0.08-0.40
  const shakePhase = phaseNorm(p, 0.08, 0.40);
  const intensity = Math.min(shakePhase, 1 - shakePhase) * 2;
  const shakeX = shakePhase > 0 ? Math.sin(p * 88) * 4 * intensity : 0;
  const shakeY = shakePhase > 0 ? Math.cos(p * 72) * 3 * intensity : 0;

  ctx.save();
  ctx.translate(shakeX, shakeY);

  // Dark bg
  const bgA = easeInOut(phaseNorm(p, 0, 0.13)) * 0.9;
  drawOceanBg(ctx, w, h, bgA);

  // Lava glow from below
  const lavaP = easeInOut(phaseNorm(p, 0.14, 0.52)) * (1 - easeInOut(phaseNorm(p, 0.62, 0.82)));
  if (lavaP > 0) {
    const lavG = ctx.createRadialGradient(cx, h, 0, cx, h, h * 0.72);
    lavG.addColorStop(0, `rgba(255, 75, 0, ${lavaP * 0.48})`);
    lavG.addColorStop(0.35, `rgba(255, 140, 0, ${lavaP * 0.22})`);
    lavG.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = lavG;
    ctx.fillRect(0, 0, w, h);
    // Lava flicker
    ctx.fillStyle = `rgba(255, 200, 0, ${lavaP * Math.abs(Math.sin(p * 60)) * 0.08})`;
    ctx.fillRect(0, 0, w, h);
  }

  // Rising rocks
  const rockP = phaseNorm(p, 0.24, 0.72);
  if (rockP > 0) {
    const rockCount = 8;
    for (let i = 0; i < rockCount; i++) {
      const rx = w * (0.12 + (i / rockCount) * 0.76) + Math.sin(i * 2.5) * 22;
      const rRise = rockP * (h * 0.6 + i * 14);
      const ry = h + 12 - rRise;
      const rw = 8 + (i % 3) * 7;
      const rh = 12 + (i % 4) * 6;
      const rockAlpha = Math.min(1, rockP * 3) * (ry > -rh ? 1 : 0);
      if (rockAlpha <= 0 || ry > h + 15) continue;
      ctx.fillStyle = `rgba(72, 55, 38, ${rockAlpha * 0.9})`;
      ctx.beginPath();
      ctx.moveTo(rx, ry + rh);
      ctx.lineTo(rx - rw, ry + rh);
      ctx.lineTo(rx - rw * 0.45, ry);
      ctx.lineTo(rx + rw * 0.35, ry + rh * 0.28);
      ctx.lineTo(rx + rw, ry + rh);
      ctx.closePath();
      ctx.fill();
    }
  }

  // Lava bubbles rising
  const bubR = phaseNorm(p, 0.2, 0.76);
  if (bubR > 0) {
    for (let i = 0; i < 11; i++) {
      const bx = w * (0.08 + ((i * 0.165 + bubR * 0.6) % 0.86));
      const by = h - bubR * h * (0.48 + (i % 3) * 0.17);
      if (by < 0 || by > h) continue;
      const br = 2 + (i % 3) * 2.5;
      ctx.strokeStyle = `rgba(255, 175, 65, ${(1 - bubR * 0.55) * 0.72})`;
      ctx.fillStyle = `rgba(255, 150, 30, ${(1 - bubR * 0.55) * 0.14})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(bx, by, br, br, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }

  // Fish — visible then swims up rapidly
  const fishV = easeInOut(phaseNorm(p, 0.13, 0.32));
  const fishEsc = easeInOut(phaseNorm(p, 0.64, 0.84));
  const fishY = cy + fishEsc * (-cy * 0.82);
  ctx.globalAlpha = fishV * (1 - fishEsc * 0.85);
  drawFish(ctx, cx, fishY, 18, '#ff6b6b', 0);

  ctx.restore();

  const tA = easeInOut(phaseNorm(p, 0.08, 0.23)) * (1 - easeInOut(phaseNorm(p, 0.74, 0.86)));
  if (tA > 0.02) {
    ctx.save();
    ctx.globalAlpha = tA;
    ctx.fillStyle = '#ff7043';
    ctx.font = 'bold 24px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(255, 100, 0, 0.9)';
    ctx.shadowBlur = 16;
    ctx.fillText('🌋  Volcanic Eruption!', cx, h * 0.18);
    ctx.restore();
  }
}

// ─── Jellyfish Bell (large, cinematic) ───────────────────────────────────────

function drawCinematicJellyfish(ctx, x, y, size, timeP) {
  const bellG = ctx.createRadialGradient(x, y, 0, x, y, size);
  bellG.addColorStop(0,   'rgba(180,150,255,0.65)');
  bellG.addColorStop(0.5, 'rgba(120,100,255,0.32)');
  bellG.addColorStop(1,   'rgba(80,70,220,0.06)');
  ctx.fillStyle = bellG;
  ctx.beginPath();
  ctx.ellipse(x, y, size, size * 0.58, 0, Math.PI, 0);
  ctx.fill();
  // Inner pulse
  const ps = size * (0.44 + Math.sin(timeP * 22) * 0.07);
  const innerG = ctx.createRadialGradient(x, y - size * 0.15, 0, x, y - size * 0.15, ps);
  innerG.addColorStop(0, 'rgba(220,190,255,0.45)');
  innerG.addColorStop(1, 'rgba(220,190,255,0)');
  ctx.fillStyle = innerG;
  ctx.beginPath();
  ctx.ellipse(x, y - size * 0.12, ps, ps * 0.6, 0, Math.PI, 0);
  ctx.fill();
  // Tentacles (8)
  ctx.lineWidth = 1;
  for (let t = 0; t < 8; t++) {
    const tx = x + (t / 7 - 0.5) * size * 1.75;
    const tAlpha = 0.38 - (Math.abs(t - 3.5) / 8) * 0.18;
    ctx.strokeStyle = `rgba(180,150,255,${tAlpha})`;
    ctx.beginPath(); ctx.moveTo(tx, y);
    for (let s = 1; s <= 10; s++) {
      ctx.lineTo(
        tx + Math.sin(timeP * 14 + s * 0.9 + t * 0.7) * size * 0.48 * (s / 10),
        y + s * size * 0.28
      );
    }
    ctx.stroke();
  }
}

// ─── Puffer Fish ─────────────────────────────────────────────────────────────

function drawPufferFish(ctx, x, y, inflateP, smiling) {
  const baseS = 11, maxS = 31;
  const sz = lerp(baseS, maxS, inflateP);
  const bodyRx = lerp(baseS * 0.72, maxS, inflateP);

  // Spots
  ctx.fillStyle = '#e8a020';
  ctx.beginPath(); ctx.ellipse(x, y, bodyRx, sz, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(170,80,0,0.38)';
  for (let i = 0; i < 6; i++) {
    const sa = (i / 6) * Math.PI * 2;
    ctx.beginPath(); ctx.arc(x + Math.cos(sa) * bodyRx * 0.62, y + Math.sin(sa) * sz * 0.55, sz * 0.1, 0, Math.PI * 2); ctx.fill();
  }

  // Spikes when inflated
  if (inflateP > 0.2) {
    ctx.strokeStyle = `rgba(200,120,8,${inflateP * 0.82})`; ctx.lineWidth = 1.6;
    for (let i = 0; i < 14; i++) {
      const ang = (i / 14) * Math.PI * 2;
      const spikeLen = inflateP * sz * 0.48;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(ang) * bodyRx * 0.92, y + Math.sin(ang) * sz * 0.92);
      ctx.lineTo(x + Math.cos(ang) * (bodyRx + spikeLen), y + Math.sin(ang) * (sz + spikeLen));
      ctx.stroke();
    }
  }

  // Top fin
  const finH = sz * lerp(0.55, 0.22, inflateP);
  ctx.fillStyle = '#d08c0a';
  ctx.beginPath();
  ctx.moveTo(x, y - sz);
  ctx.lineTo(x - finH * 0.45, y - sz - finH);
  ctx.lineTo(x + finH * 0.45, y - sz - finH * 0.5);
  ctx.closePath(); ctx.fill();

  // Eye
  const eyeX = x + bodyRx * (inflateP > 0.5 ? 0.28 : 0.44);
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(eyeX, y - sz * 0.14, sz * 0.19, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#111';
  ctx.beginPath(); ctx.arc(eyeX + sz * 0.05, y - sz * 0.14, sz * 0.11, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.beginPath(); ctx.arc(eyeX + sz * 0.02, y - sz * 0.19, sz * 0.04, 0, Math.PI * 2); ctx.fill();

  // Smile on deflate
  if (smiling) {
    ctx.strokeStyle = '#444'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(eyeX - sz * 0.12, y + sz * 0.12, sz * 0.19, 0.2, Math.PI - 0.2); ctx.stroke();
  }
}

// ─── Cinematic: Whirlpool ────────────────────────────────────────────────────

function cinematicWhirlpool(ctx, w, h, p) {
  const cx = w / 2, cy = h / 2;

  // Deepen bg
  const bgA = easeInOut(phaseNorm(p, 0, 0.15)) * 0.88;
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, `rgba(0,10,42,${bgA})`);
  bg.addColorStop(1, `rgba(0,4,22,${bgA})`);
  ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);

  // Darkens during pull
  const darkA = easeInOut(phaseNorm(p, 0.28, 0.68)) * (1 - easeInOut(phaseNorm(p, 0.68, 0.8))) * 0.3;
  ctx.fillStyle = `rgba(0,0,20,${darkA})`; ctx.fillRect(0, 0, w, h);

  const spiralP = phaseNorm(p, 0.1, 0.72);
  const rotAng  = spiralP * Math.PI * 6; // 3 full rotations
  // Camera rotation ≤ 8°
  const camRot = easeInOut(Math.min(spiralP, 1 - spiralP) * 2) * (7.5 * Math.PI / 180);
  const zoom   = lerp(1, 1.2, easeInOut(phaseNorm(p, 0.08, 0.34)));

  ctx.save();
  ctx.translate(cx, cy); ctx.rotate(camRot); ctx.scale(zoom, zoom); ctx.translate(-cx, -cy);

  // Spiral rings
  if (spiralP > 0) {
    for (let r = 0; r < 5; r++) {
      const rMax = Math.min(w, h) * (0.14 + r * 0.065);
      const rCur = rMax * (1 - spiralP * 0.62);
      const rA = (1 - r * 0.14) * Math.min(1, spiralP * 3.5) * (1 - easeInOut(phaseNorm(p, 0.69, 0.82)));
      ctx.strokeStyle = `rgba(0,180,245,${rA * 0.44})`;
      ctx.lineWidth = 1.5 + r * 0.45;
      const arcStart = rotAng + r * (Math.PI / 3);
      ctx.beginPath(); ctx.arc(cx, cy, rCur, arcStart, arcStart + Math.PI * 1.72); ctx.stroke();
    }
    // Spiral bubbles
    const bubFade = 1 - easeInOut(phaseNorm(p, 0.68, 0.82));
    for (let i = 0; i < 14; i++) {
      const ang = rotAng + (i / 14) * Math.PI * 2 + p * 9;
      const dist = Math.max(6, Math.min(w, h) * 0.26 * (1 - spiralP * 0.78));
      const bx = cx + Math.cos(ang) * dist * (0.48 + (i % 3) * 0.27);
      const by = cy + Math.sin(ang) * dist * (0.48 + (i % 3) * 0.27);
      const bA = Math.min(1, spiralP * 4) * bubFade;
      ctx.strokeStyle = `rgba(180,235,255,${bA * 0.58})`;
      ctx.fillStyle   = `rgba(180,235,255,${bA * 0.1})`;
      ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.arc(bx, by, 1.5 + (i % 3), 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
  }

  // Fish pulled in + spinning
  const fishA = easeInOut(phaseNorm(p, 0.12, 0.28)) * (1 - easeInOut(phaseNorm(p, 0.6, 0.74)));
  if (fishA > 0.02) {
    ctx.save(); ctx.globalAlpha = fishA;
    ctx.translate(cx, cy); ctx.rotate(spiralP * Math.PI * 4); // fish spins
    drawFish(ctx, 0, 0, 17, '#ff6b6b', 0);
    ctx.restore();
  }

  // Ejection
  const ejectP = easeInOut(phaseNorm(p, 0.72, 0.88));
  if (ejectP > 0) {
    const eDist = ejectP * w * 0.36;
    ctx.save(); ctx.globalAlpha = (1 - ejectP) * 0.9;
    drawFish(ctx, cx + eDist, cy - eDist * 0.38, 17, '#ff6b6b', 0);
    ctx.strokeStyle = `rgba(0,200,255,${(1 - ejectP) * 0.38})`; ctx.lineWidth = 1.5;
    for (let i = 0; i < 4; i++) {
      const sa = -0.38 + (i - 2) * 0.14;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + eDist * 0.65 * Math.cos(sa), cy + eDist * 0.65 * Math.sin(sa)); ctx.stroke();
    }
    ctx.restore();
  }

  ctx.restore();

  const tA = easeInOut(phaseNorm(p, 0.08, 0.22)) * (1 - easeInOut(phaseNorm(p, 0.74, 0.86)));
  if (tA > 0.02) {
    ctx.save(); ctx.globalAlpha = tA;
    ctx.fillStyle = '#00d4ff'; ctx.font = 'bold 24px "Outfit", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,212,255,0.9)'; ctx.shadowBlur = 16;
    ctx.fillText('🌀  Whirlpool!', cx, h * 0.18); ctx.restore();
  }
}

// ─── Cinematic: Jellyfish Encounter ──────────────────────────────────────────

function cinematicJellyfishEvent(ctx, w, h, p) {
  const cx = w / 2, cy = h / 2;

  // Mystical blue-purple bg
  const bgA = easeInOut(phaseNorm(p, 0, 0.14)) * 0.84;
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, `rgba(5,0,32,${bgA})`);
  bg.addColorStop(0.5, `rgba(10,5,52,${bgA})`);
  bg.addColorStop(1, `rgba(2,2,22,${bgA})`);
  ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);

  const jellyAlpha = easeInOut(phaseNorm(p, 0.14, 0.3)) * (1 - easeInOut(phaseNorm(p, 0.72, 0.88)));
  const jellyY = lerp(-80, cy - 28, easeInOut(phaseNorm(p, 0.15, 0.5)));

  // Glow behind jelly
  if (jellyAlpha > 0.02) {
    const gR = 65 + Math.sin(p * 14) * 10;
    const gG = ctx.createRadialGradient(cx, jellyY, 0, cx, jellyY, gR);
    gG.addColorStop(0, `rgba(100,120,255,${jellyAlpha * 0.32})`); gG.addColorStop(1, 'rgba(100,120,255,0)');
    ctx.fillStyle = gG; ctx.fillRect(cx - gR, jellyY - gR, gR * 2, gR * 2);
    ctx.save(); ctx.globalAlpha = jellyAlpha;
    drawCinematicJellyfish(ctx, cx, jellyY, 38 + Math.sin(p * 7) * 2.5, p);
    ctx.restore();
  }

  // Blue electric particles around fish (0.48-0.76)
  const partP = phaseNorm(p, 0.48, 0.76);
  if (partP > 0) {
    for (let i = 0; i < 18; i++) {
      const ang = (i / 18) * Math.PI * 2 + p * 7.5;
      const dist = 24 + Math.sin(p * 11 + i) * 9;
      const pA = Math.sin(partP * Math.PI) * (Math.sin(ang + p * 5.5) * 0.5 + 0.5);
      ctx.fillStyle = `rgba(110,155,255,${pA * 0.72})`;
      ctx.beginPath(); ctx.arc(cx + Math.cos(ang) * dist, cy + Math.sin(ang) * dist, 2.4 + Math.random(), 0, Math.PI * 2); ctx.fill();
    }
  }

  // Fish glows
  const glowP  = easeInOut(phaseNorm(p, 0.5, 0.78));
  const fishA  = easeInOut(phaseNorm(p, 0.2, 0.38)) * (1 - easeInOut(phaseNorm(p, 0.78, 0.9)));
  if (fishA > 0.02) {
    ctx.save(); ctx.globalAlpha = fishA;
    if (glowP > 0) {
      const fG = ctx.createRadialGradient(cx, cy, 0, cx, cy, 30 + glowP * 12);
      fG.addColorStop(0, `rgba(80,130,255,${glowP * 0.48})`); fG.addColorStop(1, 'rgba(80,130,255,0)');
      ctx.fillStyle = fG; ctx.fillRect(cx - 55, cy - 55, 110, 110);
    }
    drawFish(ctx, cx, cy, 18, '#ff6b6b', 0);
    ctx.restore();
  }

  const tA = easeInOut(phaseNorm(p, 0.08, 0.22)) * (1 - easeInOut(phaseNorm(p, 0.74, 0.86)));
  if (tA > 0.02) {
    ctx.save(); ctx.globalAlpha = tA;
    ctx.fillStyle = '#b39ddb'; ctx.font = 'bold 24px "Outfit", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(179,157,219,0.9)'; ctx.shadowBlur = 16;
    ctx.fillText('🪼  Jellyfish Shock!', cx, h * 0.18); ctx.restore();
  }
}

// ─── Cinematic: Puffer Fish ───────────────────────────────────────────────────

function cinematicPuffer(ctx, w, h, p) {
  const cx = w / 2, cy = h / 2;
  const bgA = easeInOut(phaseNorm(p, 0, 0.13)) * 0.86;
  drawOceanBg(ctx, w, h, bgA);

  const zoom = lerp(1, 1.14, easeInOut(phaseNorm(p, 0.05, 0.24)));
  ctx.save(); ctx.translate(cx, cy); ctx.scale(zoom, zoom); ctx.translate(-cx, -cy);

  const swimIn   = easeInOut(phaseNorm(p, 0.15, 0.42));
  const inflateP = easeInOut(phaseNorm(p, 0.42, 0.58));
  const deflateP = easeInOut(phaseNorm(p, 0.68, 0.83));
  const inflation = Math.max(0, inflateP - deflateP);
  const smiling  = deflateP > 0.55;
  const walkOut  = easeInOut(phaseNorm(p, 0.82, 0.97));

  const pufferX  = lerp(w + 85, cx + 55, swimIn) - walkOut * w * 0.55;
  const pufferA  = easeInOut(phaseNorm(p, 0.14, 0.28)) * (1 - easeInOut(phaseNorm(p, 0.88, 0.97)));
  if (pufferA > 0.02) {
    ctx.globalAlpha = pufferA;
    drawPufferFish(ctx, pufferX, cy, inflation, smiling);
  }

  // Fish startled backward on inflation
  const startleP = easeInOut(phaseNorm(p, 0.5, 0.68));
  const fishX    = cx - startleP * 58;
  const fishA    = easeInOut(phaseNorm(p, 0.15, 0.32)) * (1 - easeInOut(phaseNorm(p, 0.84, 0.95)));
  if (fishA > 0.02) {
    ctx.save(); ctx.globalAlpha = fishA;
    const wiggle = inflateP > 0.28 && deflateP < 0.3 ? Math.sin(p * 36) * 5 * inflateP : 0;
    drawFish(ctx, fishX, cy, 18, '#ff6b6b', wiggle);
    // Fright marks
    if (inflateP > 0.22 && deflateP < 0.28) {
      ctx.strokeStyle = `rgba(255,200,50,${inflateP * 0.65})`; ctx.lineWidth = 1.5;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath(); ctx.moveTo(fishX - 24, cy + (i - 1) * 9); ctx.lineTo(fishX - 40, cy + (i - 1) * 9 - 4); ctx.stroke();
      }
    }
    ctx.restore();
  }

  ctx.restore();

  const tA = easeInOut(phaseNorm(p, 0.08, 0.22)) * (1 - easeInOut(phaseNorm(p, 0.74, 0.86)));
  if (tA > 0.02) {
    ctx.save(); ctx.globalAlpha = tA;
    ctx.fillStyle = '#f9ca24'; ctx.font = 'bold 24px "Outfit", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(249,202,36,0.9)'; ctx.shadowBlur = 14;
    ctx.fillText('🐡  Puffer Fish!', cx, h * 0.18); ctx.restore();
  }
}

// ─── Cinematic: Ocean Current ─────────────────────────────────────────────────

function cinematicCurrent(ctx, w, h, p) {
  const cx = w / 2, cy = h / 2;
  const bgA = easeInOut(phaseNorm(p, 0, 0.14)) * 0.86;
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, `rgba(0,15,52,${bgA})`); bg.addColorStop(1, `rgba(0,8,30,${bgA})`);
  ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);

  const strength = easeInOut(phaseNorm(p, 0.18, 0.65));
  // Camera shifts with current
  const camShift = strength * 22;
  ctx.save(); ctx.translate(-camShift, 0);

  // Horizontal streak lines
  if (strength > 0) {
    for (let i = 0; i < 20; i++) {
      const sy = h * (0.04 + (i / 20) * 0.92);
      const spd = 0.48 + (i % 3) * 0.28;
      const len = (55 + (i % 4) * 42) * strength;
      const sx  = ((p * w * spd * 3 + i * 85) % (w + 210)) - 105;
      const sA  = (0.13 + (i % 3) * 0.04) * strength;
      const sG  = ctx.createLinearGradient(sx, 0, sx + len, 0);
      sG.addColorStop(0, 'rgba(0,180,255,0)');
      sG.addColorStop(0.5, `rgba(0,205,255,${sA})`);
      sG.addColorStop(1, 'rgba(0,180,255,0)');
      ctx.fillStyle = sG; ctx.fillRect(sx, sy - 1, len, 2 + (i % 3));
    }
  }

  // Background fish drifting with current
  if (strength > 0.22) {
    ctx.save(); ctx.globalAlpha = 0.13 * strength;
    for (let i = 0; i < 5; i++) {
      const dfx = ((p * w * (1.2 + i * 0.2) * 1.8 + i * 170) % (w + 210)) - 105;
      const dfy = h * (0.18 + i * 0.14); const dfs = 4 + (i % 3) * 2;
      ctx.fillStyle = '#00f2fe';
      ctx.beginPath(); ctx.ellipse(dfx, dfy, dfs, dfs * 0.6, 0, 0, Math.PI * 2); ctx.fill();
      const wag = Math.sin(p * 18 + i) * dfs * 0.3;
      ctx.beginPath();
      ctx.moveTo(dfx - dfs * 0.8, dfy);
      ctx.lineTo(dfx - dfs * 1.4, dfy - dfs * 0.4 + wag);
      ctx.lineTo(dfx - dfs * 1.4, dfy + dfs * 0.4 + wag);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }

  // Fish struggling then swept
  const struggleP = phaseNorm(p, 0.2, 0.72);
  const pushP     = easeInOut(phaseNorm(p, 0.72, 0.88));
  const fishX     = pushP > 0 ? cx + pushP * w * 0.32 : cx + Math.sin(p * 24) * 6 * struggleP;
  const fishTilt  = struggleP * 0.14 * Math.sin(p * 19);
  const fishA     = easeInOut(phaseNorm(p, 0.17, 0.32)) * (1 - easeInOut(phaseNorm(p, 0.84, 0.95)));
  if (fishA > 0.02) {
    ctx.save(); ctx.globalAlpha = fishA;
    ctx.translate(fishX, cy); ctx.rotate(fishTilt);
    drawFish(ctx, 0, 0, 18, '#ff6b6b', 0);
    ctx.restore();
  }

  ctx.restore();

  const tA = easeInOut(phaseNorm(p, 0.08, 0.22)) * (1 - easeInOut(phaseNorm(p, 0.74, 0.86)));
  if (tA > 0.02) {
    ctx.save(); ctx.globalAlpha = tA;
    ctx.fillStyle = '#00bcd4'; ctx.font = 'bold 24px "Outfit", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,188,212,0.9)'; ctx.shadowBlur = 14;
    ctx.fillText('🌊  Ocean Current!', cx, h * 0.18); ctx.restore();
  }
}

// ─── Cinematic: Falling Rocks ─────────────────────────────────────────────────

function cinematicRocks(ctx, w, h, p) {
  const cx = w / 2, cy = h / 2;
  drawOceanBg(ctx, w, h, easeInOut(phaseNorm(p, 0, 0.13)) * 0.9);

  // Warning shiver
  const shiverP = phaseNorm(p, 0.1, 0.3);
  const shakeX  = shiverP > 0 ? Math.sin(p * 98) * 2.8 * shiverP : 0;
  const shakeY2 = shiverP > 0 ? Math.cos(p * 85) * 2.2 * shiverP : 0;
  ctx.save(); ctx.translate(shakeX, shakeY2);

  // Floor crack glow (0.08-0.4)
  const crackP = phaseNorm(p, 0.08, 0.4);
  if (crackP > 0) {
    const crackG = ctx.createLinearGradient(0, h * 0.82, 0, h);
    crackG.addColorStop(0, `rgba(200,140,50,${crackP * 0.18})`);
    crackG.addColorStop(1, 'rgba(200,140,50,0)');
    ctx.fillStyle = crackG; ctx.fillRect(0, h * 0.82, w, h * 0.18);
  }

  // Sand cloud
  const sandP = phaseNorm(p, 0.4, 0.78);
  if (sandP > 0) {
    for (let i = 0; i < 5; i++) {
      const cX = w * (0.14 + i * 0.18) + Math.sin(i * 2.2) * 22;
      const cY = h - sandP * (h * 0.32 + i * 18);
      const cR = 18 + i * 9;
      if (cY < h) {
        const cG = ctx.createRadialGradient(cX, cY, 0, cX, cY, cR);
        cG.addColorStop(0, `rgba(180,150,95,${(1 - sandP * 0.62) * 0.32})`);
        cG.addColorStop(1, 'rgba(180,150,95,0)');
        ctx.fillStyle = cG; ctx.fillRect(cX - cR, cY - cR, cR * 2, cR * 2);
      }
    }
  }

  // Pebbles first (0.08-0.4)
  const pebP = phaseNorm(p, 0.08, 0.4);
  if (pebP > 0) {
    for (let i = 0; i < 14; i++) {
      const px2 = w * (0.07 + (i / 14) * 0.86) + Math.sin(i * 3) * 16;
      const py2 = -8 + pebP * (h * 0.62 + i * 22);
      if (py2 < -8 || py2 > h) continue;
      ctx.fillStyle = `rgba(140,118,88,${pebP * 0.72})`;
      ctx.beginPath(); ctx.ellipse(px2, py2, 3 + (i % 3) * 1.4, 2 + (i % 2) * 1.3, Math.sin(i * 1.4), 0, Math.PI * 2); ctx.fill();
    }
  }

  // Large rocks (0.28-0.76)
  const rockP = phaseNorm(p, 0.28, 0.76);
  if (rockP > 0) {
    for (let i = 0; i < 7; i++) {
      const rx = w * (0.09 + (i / 7) * 0.82) + Math.sin(i * 2.6) * 26;
      const ry = -26 + rockP * (h * 0.75 + i * 20);
      if (ry < -26 || ry > h + 22) continue;
      const rw2 = 12 + (i % 3) * 9, rh2 = 14 + (i % 4) * 8;
      const rA = Math.min(1, rockP * 2.6);
      ctx.save(); ctx.translate(rx, ry); ctx.rotate(Math.sin(i * 1.8) * 0.52);
      ctx.fillStyle = `rgba(78,62,42,${rA * 0.92})`;
      ctx.beginPath();
      ctx.moveTo(-rw2 * 0.4, rh2); ctx.lineTo(-rw2, rh2 * 0.5); ctx.lineTo(-rw2 * 0.65, -rh2 * 0.32);
      ctx.lineTo(0, -rh2); ctx.lineTo(rw2 * 0.62, -rh2 * 0.48); ctx.lineTo(rw2, rh2 * 0.22);
      ctx.lineTo(rw2 * 0.32, rh2); ctx.closePath(); ctx.fill();
      // Highlight
      ctx.strokeStyle = `rgba(140,115,80,${rA * 0.4})`; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(-rw2 * 0.3, -rh2 * 0.2); ctx.lineTo(rw2 * 0.3, -rh2 * 0.4); ctx.stroke();
      ctx.restore();
    }
  }

  // Fish dodging (0.36-0.82)
  const dodgeP = phaseNorm(p, 0.36, 0.82);
  const fishA  = easeInOut(phaseNorm(p, 0.2, 0.36)) * (1 - easeInOut(phaseNorm(p, 0.78, 0.88)));
  if (fishA > 0.02) {
    ctx.save(); ctx.globalAlpha = fishA;
    drawFish(ctx, cx + Math.sin(dodgeP * Math.PI * 4.5) * 32, cy + Math.cos(dodgeP * Math.PI * 3) * 22, 16, '#ff6b6b', 0);
    ctx.restore();
  }

  ctx.restore();

  const tA = easeInOut(phaseNorm(p, 0.08, 0.22)) * (1 - easeInOut(phaseNorm(p, 0.74, 0.86)));
  if (tA > 0.02) {
    ctx.save(); ctx.globalAlpha = tA;
    ctx.fillStyle = '#90a4ae'; ctx.font = 'bold 24px "Outfit", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(144,164,174,0.8)'; ctx.shadowBlur = 14;
    ctx.fillText('🪨  Falling Rocks!', cx, h * 0.18); ctx.restore();
  }
}

const CINEMATICS = {
  coral_trap: cinematicCoralTrap,
  crab:       cinematicCrabAttack,
  dolphin:    cinematicDolphinRide,
  shark:      cinematicShark,
  volcano:    cinematicVolcano,
  whirlpool:  cinematicWhirlpool,
  jellyfish:  cinematicJellyfishEvent,
  puffer:     cinematicPuffer,
  current:    cinematicCurrent,
  rocks:      cinematicRocks
};

// ─── CinematicEngine (exported) ───────────────────────────────────────────────

export class CinematicEngine {
  constructor() {
    /** Tracks event types seen at least once (first occurrence plays in full) */
    this.seenEvents = new Set();
    this._active = false;
  }

  /**
   * Play a cinematic for the given event type.
   * @param {string} eventType  - 'coral_trap' | 'crab' | 'dolphin' | 'shark' | 'volcano'
   * @param {number} playerX    - Player x position on the board canvas
   * @param {number} playerY    - Player y position on the board canvas
   * @returns {Promise<void>}   - Resolves when cinematic finishes (or is skipped+faded)
   */
  play(eventType, playerX, playerY) {
    const drawFn = CINEMATICS[eventType];
    const wrapper = document.getElementById('board-wrapper');

    if (!drawFn || !wrapper || this._active) return Promise.resolve();
    this._active = true;

    const isFirst = !this.seenEvents.has(eventType);
    if (isFirst) this.seenEvents.add(eventType);

    return new Promise(resolve => {
      const ow = wrapper.clientWidth;
      const oh = wrapper.clientHeight;
      const dpr = window.devicePixelRatio || 1;

      // Create overlay canvas
      const oc = document.createElement('canvas');
      oc.width = ow * dpr;
      oc.height = oh * dpr;
      Object.assign(oc.style, {
        position: 'absolute', top: '0', left: '0',
        width: `${ow}px`, height: `${oh}px`,
        zIndex: '50', pointerEvents: 'all',
        borderRadius: '24px', transition: 'opacity 0.42s ease'
      });
      wrapper.appendChild(oc);
      const ctx = oc.getContext('2d');
      ctx.scale(dpr, dpr);

      // Skip state (only non-first occurrences are skippable)
      let skipAvailable = false;
      let skipRequested = false;
      let skipAlpha = 0;
      let skipTimer = null;

      if (!isFirst) {
        skipTimer = setTimeout(() => { skipAvailable = true; }, 500);
        oc.addEventListener('click', () => {
          if (skipAvailable && !skipRequested) skipRequested = true;
        });
      }

      let t = 0;
      let lastTs = null;
      const DURATION = isFirst ? 3400 : 2900;
      const FADE_START = 0.82; // fade begins at 82% progress
      const SKIP_ACCEL = 6;    // how fast we fast-forward on skip

      const finish = () => {
        if (skipTimer) clearTimeout(skipTimer);
        oc.style.opacity = '0';
        setTimeout(() => {
          if (oc.parentElement) oc.remove();
          this._active = false;
          resolve();
        }, 430); // matches CSS transition
      };

      const loop = (ts) => {
        if (!lastTs) lastTs = ts;
        const dt = Math.min(ts - lastTs, 50);
        lastTs = ts;

        if (skipRequested) {
          // Fast-forward to fade-out point then coast
          t += dt * SKIP_ACCEL;
          if (t / DURATION >= FADE_START) {
            t = Math.min(t, DURATION);
          }
        } else {
          t += dt;
        }

        const p = Math.min(1, t / DURATION);
        const fadeAlpha = p >= FADE_START ? 1 - (p - FADE_START) / (1 - FADE_START) : 1;

        ctx.clearRect(0, 0, ow, oh);
        ctx.save();
        ctx.globalAlpha = fadeAlpha;
        drawFn(ctx, ow, oh, p, playerX, playerY);

        // Skip hint
        if (!isFirst && skipAvailable) {
          skipAlpha = Math.min(1, skipAlpha + 0.028);
          drawSkipHint(ctx, ow, oh, skipAlpha * fadeAlpha);
        }
        ctx.restore();

        if (p >= 1) {
          finish();
        } else {
          requestAnimationFrame(loop);
        }
      };

      requestAnimationFrame(loop);
    });
  }
}

export const cinematic = new CinematicEngine();
