// Fish Players Module — v1.5 (Evolution System)

import { audio } from './audio.js?v=6';
import {
  STAGES, EXPRESSION_DURATION, GROWTH_ANIM_DURATION,
  SCALE_LERP_SPEED
} from './evolution.js?v=6';

export class FishPlayer {
  constructor(id, name, color, baseColor, isComputer = false) {
    this.id = id;
    this.name = name;
    this.color = color;
    this.baseColor = baseColor;
    this.isComputer = isComputer;

    this.tileNum = 1;
    this.targetTile = 1;
    this.isUnlocked = false;
    this.sleeping = true;

    // Smooth rendering coords
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;

    // Status effects
    this.bubbleShield = false;
    this.skipTurns = 0;

    // Base animation state
    this.tailAngle = 0;
    this.floatOffset = Math.random() * 100;
    this.eyeBlink = false;
    this.blinkTimer = Math.random() * 3000 + 2000;
    this.idleBubbleTimer = Math.random() * 3000 + 2500;
    this.idleRotation = 0;

    // Move interpolation
    this.isMoving = false;
    this.moveQueue = [];
    this.moveProgress = 0;
    this.trailTimer = 0;

    // ─── v1.5 Evolution State ──────────────────────────────────────────────
    this.evolutionLevel  = 1;
    this.targetScale     = STAGES[0].sizeScale;   // lerp target
    this.currentScale    = STAGES[0].sizeScale;   // actual rendered scale
    this.tailSpeedBase   = STAGES[0].tailSpeed;
    this.finScale        = STAGES[0].finScale;

    // Expression (auto-reverts after EXPRESSION_DURATION)
    this.expression      = 'normal';
    this.expressionTimer = 0;

    // Phase-progress animations (0 → 1)
    this.growthAnim = null;   // { progress, duration }
    this.shrinkAnim = null;   // { progress, duration, wobbleOnly }
    this.whackAnim  = null;   // { role:'attacker'|'victim'|'bump', progress, duration }

    // Giant bubble crown (3 tiny drifting bubbles)
    this.crownBubbles = [0, 1, 2].map(() => ({ phase: Math.random() * Math.PI * 2 }));
  }

  // ─── Stage shortcut ────────────────────────────────────────────────────────
  get stage() { return STAGES[this.evolutionLevel - 1]; }

  // ─── Reset (game restart) ──────────────────────────────────────────────────
  reset() {
    this.tileNum = 1; this.targetTile = 1;
    this.isUnlocked = false; this.sleeping = true;
    this.bubbleShield = false; this.skipTurns = 0;
    this.isMoving = false; this.moveQueue = [];
    this.evolutionLevel  = 1;
    this.targetScale     = STAGES[0].sizeScale;
    this.currentScale    = STAGES[0].sizeScale;
    this.tailSpeedBase   = STAGES[0].tailSpeed;
    this.finScale        = STAGES[0].finScale;
    this.expression      = 'normal';
    this.expressionTimer = 0;
    this.growthAnim = this.shrinkAnim = this.whackAnim = null;
  }

  // ─── Growth ────────────────────────────────────────────────────────────────
  /** Returns true if level actually increased, false if already Giant */
  grow() {
    const maxed = this.evolutionLevel >= 4;
    if (!maxed) {
      this.evolutionLevel++;
      const s = this.stage;
      this.targetScale   = s.sizeScale;
      this.tailSpeedBase = s.tailSpeed;
      this.finScale      = s.finScale;
    }
    this._setExpression('growing');
    this.growthAnim = { progress: 0, duration: GROWTH_ANIM_DURATION };
    audio.playGrow();
    return !maxed;
  }

  /** Returns true if level actually decreased, false if already Tiny (wobble only) */
  shrink() {
    this._setExpression('shrinking');
    const wasTiny = this.evolutionLevel <= 1;
    if (!wasTiny) {
      this.evolutionLevel--;
      const s = this.stage;
      this.targetScale   = s.sizeScale;
      this.tailSpeedBase = s.tailSpeed;
      this.finScale      = s.finScale;
    }
    this.shrinkAnim = { progress: 0, duration: GROWTH_ANIM_DURATION, wobbleOnly: wasTiny };
    audio.playShrink();
    return !wasTiny;
  }

  /** Trigger whack animation. role: 'attacker' | 'victim' | 'bump' */
  triggerWhackAnim(role) {
    this.whackAnim = { role, progress: 0, duration: 1500 };
    if (role === 'attacker')     this._setExpression('whack_winner');
    else if (role === 'victim')  this._setExpression('whack_victim');
    else                         this._setExpression('bump');
  }

  _setExpression(expr) {
    this.expression = expr;
    this.expressionTimer = EXPRESSION_DURATION;
  }

  // ─── Swim ──────────────────────────────────────────────────────────────────
  swimToPath(pathList) {
    this.moveQueue = [...this.moveQueue, ...pathList];
    this.isMoving = true;
    this.isUnlocked = true;
    this.sleeping = false;
  }

  // ─── Update ────────────────────────────────────────────────────────────────
  update(deltaTime, board, particleSystem, opponentTileNum) {
    // 1. Float + tail
    this.floatOffset += 0.003 * deltaTime;
    const tailSpd = this.isMoving
      ? this.tailSpeedBase * 2.8
      : this.tailSpeedBase * 0.55;
    this.tailAngle += tailSpd * deltaTime;

    // 2. Blink
    this.blinkTimer -= deltaTime;
    if (this.blinkTimer <= 0) {
      this.eyeBlink = !this.eyeBlink;
      this.blinkTimer = this.eyeBlink ? 150 : Math.random() * 4000 + 2000;
    }

    // 3. Idle sway
    this.idleRotation = Math.sin(this.floatOffset * 0.45) * 0.055;

    // 4. Smooth scale lerp (GPU-friendly, avoids jarring jumps)
    const sd = this.targetScale - this.currentScale;
    if (Math.abs(sd) > 0.001) this.currentScale += sd * SCALE_LERP_SPEED * deltaTime;
    else this.currentScale = this.targetScale;

    // 5. Expression timer
    if (this.expressionTimer > 0) {
      this.expressionTimer -= deltaTime;
      if (this.expressionTimer <= 0) { this.expression = 'normal'; this.expressionTimer = 0; }
    }

    // 6. Anim progress
    if (this.growthAnim) {
      this.growthAnim.progress += deltaTime / this.growthAnim.duration;
      if (this.growthAnim.progress >= 1) this.growthAnim = null;
    }
    if (this.shrinkAnim) {
      this.shrinkAnim.progress += deltaTime / this.shrinkAnim.duration;
      if (this.shrinkAnim.progress >= 1) this.shrinkAnim = null;
    }
    if (this.whackAnim) {
      this.whackAnim.progress += deltaTime / this.whackAnim.duration;
      if (this.whackAnim.progress >= 1) this.whackAnim = null;
    }

    // 7. Crown bubble drift
    this.crownBubbles.forEach(b => { b.phase += 0.002 * deltaTime; });

    // 8. Position interpolation (unchanged from v1.4)
    if (this.isMoving && this.moveQueue.length > 0) {
      const nextTile = this.moveQueue[0];
      const endCoords = board.getTileCoords(nextTile);
      if (this.moveProgress === 0) audio.playMove();

      this.moveProgress += 0.006 * deltaTime;

      if (this.moveProgress >= 1.0) {
        this.tileNum = nextTile; this.targetTile = nextTile;
        this.x = endCoords.x;   this.y = endCoords.y;
        this.moveProgress = 0;
        this.moveQueue.shift();
        if (this.moveQueue.length === 0) this.isMoving = false;
      } else {
        const t = (1 - Math.cos(this.moveProgress * Math.PI)) / 2;
        const bob = Math.sin(this.moveProgress * Math.PI) * 4;
        const sc = board.getTileCoords(this.tileNum);
        this.x = sc.x + (endCoords.x - sc.x) * t;
        this.y = sc.y + (endCoords.y - sc.y) * t + bob;
        this.trailTimer += deltaTime;
        if (this.trailTimer >= 60) { particleSystem.spawnTrail(this.x, this.y, 1); this.trailTimer = 0; }
      }
    } else {
      const coords = board.getTileCoords(this.tileNum);
      const idleFloat = Math.sin(this.floatOffset) * 4;
      const off = this.tileNum === opponentTileNum ? (this.id === 1 ? -12 : 12) : 0;
      this.x = coords.x + off;
      this.y = coords.y + idleFloat;
      this.idleBubbleTimer -= deltaTime;
      if (this.idleBubbleTimer <= 0 && this.isUnlocked) {
        particleSystem.spawnTrail(this.x + 8, this.y - 8, 2);
        this.idleBubbleTimer = Math.random() * 2500 + 2500;
      }
    }
  }

  // ─── Draw ──────────────────────────────────────────────────────────────────
  draw(ctx, board) {
    ctx.save();

    const baseSize = board.tileWidth * 0.35;
    const size     = baseSize * this.currentScale;   // stage-scaled

    // ── Whack victim: spin + slide ──────────────────────────────────────────
    let extraRot = 0, slideX = 0;
    if (this.whackAnim) {
      const wp = this.whackAnim.progress;
      if (this.whackAnim.role === 'victim') {
        extraRot = wp * Math.PI * 4;                               // 2 full spins
        const se = wp < 0.5 ? 0 : (wp - 0.5) * 2;
        slideX = -se * 28;
      } else if (this.whackAnim.role === 'bump') {
        extraRot = Math.sin(wp * Math.PI * 6) * 0.22;             // wobble
      }
    }

    // Shrink wobble-only
    if (this.shrinkAnim && this.shrinkAnim.wobbleOnly) {
      extraRot += Math.sin(this.shrinkAnim.progress * Math.PI * 8) * 0.32;
    }

    // Growth overshoot burst
    let growthBurst = 1;
    if (this.growthAnim) {
      growthBurst = 1 + Math.sin(this.growthAnim.progress * Math.PI) * 0.20;
    }

    // ── Bubble Shield ────────────────────────────────────────────────────────
    if (this.bubbleShield) {
      ctx.strokeStyle = 'rgba(0,242,254,0.8)';
      ctx.fillStyle   = 'rgba(0,242,254,0.12)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(this.x, this.y, size * 1.55, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }

    // ── Stage 4 glow behind fish ─────────────────────────────────────────────
    if (this.evolutionLevel === 4) {
      const gR = size * 1.85;
      const gGrad = ctx.createRadialGradient(this.x, this.y, size * 0.3, this.x, this.y, gR);
      gGrad.addColorStop(0, this.baseColor + '44');
      gGrad.addColorStop(1, this.baseColor + '00');
      ctx.fillStyle = gGrad;
      ctx.beginPath(); ctx.arc(this.x, this.y, gR, 0, Math.PI * 2); ctx.fill();
    }

    // ── Fish facing angle ────────────────────────────────────────────────────
    let angle = 0;
    if (this.isMoving && this.moveQueue.length > 0) {
      const sc = board.getTileCoords(this.tileNum);
      const ec = board.getTileCoords(this.moveQueue[0]);
      angle = Math.atan2(ec.y - sc.y, ec.x - sc.x);
    }

    ctx.translate(this.x + slideX, this.y);
    const finalRot = (this.isMoving ? angle : angle + this.idleRotation) + extraRot;
    ctx.rotate(finalRot);
    ctx.scale(growthBurst, growthBurst);

    // ── Sleeping Zzz ─────────────────────────────────────────────────────────
    if (!this.isUnlocked) {
      ctx.save(); ctx.rotate(-finalRot);
      ctx.fillStyle = '#f1c40f'; ctx.font = "bold 12px 'Outfit'";
      ctx.fillText('Zzz...', size, -size + Math.sin(this.floatOffset * 2) * 3);
      ctx.restore();
    }

    // ── Tail ─────────────────────────────────────────────────────────────────
    let extraTailSwing = 0;
    if (this.whackAnim && this.whackAnim.role === 'attacker') {
      extraTailSwing = Math.sin(Math.min(this.whackAnim.progress, 0.5) / 0.5 * Math.PI) * 1.4;
    }
    const tailW = size * (0.78 + (this.evolutionLevel - 1) * 0.08);
    const tailH = size * 0.50 * this.finScale;
    const wag   = Math.sin(this.tailAngle) * 0.30 + extraTailSwing;

    ctx.fillStyle = this.baseColor;
    ctx.save();
    ctx.translate(-size * 0.8, 0); ctx.rotate(wag);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-tailW, -tailH); ctx.lineTo(-tailW * 0.72, 0); ctx.lineTo(-tailW, tailH);
    ctx.closePath(); ctx.fill();

    // Giant flowing fin curves
    if (this.evolutionLevel === 4) {
      ctx.strokeStyle = this.baseColor + '88'; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-tailW * 0.38, 0);
      ctx.quadraticCurveTo(-tailW * 1.1, -tailH * 0.65, -tailW * 1.32, -tailH * 0.22);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-tailW * 0.38, 0);
      ctx.quadraticCurveTo(-tailW * 1.1,  tailH * 0.65, -tailW * 1.32,  tailH * 0.22);
      ctx.stroke();
    }
    ctx.restore();

    // ── Body ──────────────────────────────────────────────────────────────────
    const bodyRy = size * (0.65 + (this.evolutionLevel - 1) * 0.04); // wider per stage
    ctx.fillStyle = this.baseColor;
    ctx.beginPath(); ctx.ellipse(0, 0, size, bodyRy, 0, 0, Math.PI * 2); ctx.fill();

    // ── Dorsal fin ───────────────────────────────────────────────────────────
    const finH = size * 0.52 * this.finScale;
    ctx.fillStyle = this.baseColor;
    ctx.beginPath();
    ctx.moveTo(-size * 0.18, -size * 0.6);
    ctx.quadraticCurveTo(-size * 0.5, -(size * 0.6 + finH), -size * 0.7, -size * 0.6);
    ctx.closePath(); ctx.fill();

    // Stage 2+: Pectoral fin
    if (this.evolutionLevel >= 2) {
      ctx.fillStyle = this.baseColor + 'cc';
      ctx.beginPath();
      ctx.moveTo(size * 0.12, size * 0.3);
      ctx.quadraticCurveTo(size * 0.38, size * 0.72, size * 0.58, size * 0.38);
      ctx.closePath(); ctx.fill();
    }

    // ── Eye ──────────────────────────────────────────────────────────────────
    const eyeR = size * (0.185 + (this.evolutionLevel - 1) * 0.01);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(size * 0.4, -size * 0.14, eyeR, 0, Math.PI * 2); ctx.fill();

    if (!this.eyeBlink) {
      ctx.fillStyle = '#0f1c3f';
      ctx.beginPath(); ctx.arc(size * 0.45, -size * 0.14, eyeR * 0.48, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(size * 0.42, -size * 0.17, eyeR * 0.18, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.strokeStyle = '#0f1c3f'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(size * 0.3, -size * 0.14); ctx.lineTo(size * 0.52, -size * 0.14); ctx.stroke();
    }

    // ── Expression-based mouth ────────────────────────────────────────────────
    const mX = size * 0.7, mY = size * 0.1, mR = size * 0.145;
    ctx.lineWidth = 1.5;

    switch (this.expression) {
      case 'growing':
        // Big happy smile + sparkle rays from eye
        ctx.strokeStyle = 'rgba(255,200,20,0.9)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(mX - mR * 0.15, mY - mR * 0.12, mR * 1.1, 0, Math.PI); ctx.stroke();
        ctx.strokeStyle = '#f1c40f'; ctx.lineWidth = 1;
        for (let i = 0; i < 4; i++) {
          const sa = (i / 4) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(size * 0.4 + Math.cos(sa) * eyeR * 1.25, -size * 0.14 + Math.sin(sa) * eyeR * 1.25);
          ctx.lineTo(size * 0.4 + Math.cos(sa) * eyeR * 1.78, -size * 0.14 + Math.sin(sa) * eyeR * 1.78);
          ctx.stroke();
        }
        break;

      case 'shrinking':
        // Sad frown + teardrop
        ctx.strokeStyle = 'rgba(110,130,220,0.85)';
        ctx.beginPath(); ctx.arc(mX - mR * 0.15, mY + mR * 0.32, mR * 0.88, Math.PI, 0); ctx.stroke();
        ctx.fillStyle = 'rgba(120,160,255,0.55)';
        ctx.beginPath(); ctx.arc(size * 0.55, size * 0.02, size * 0.056, 0, Math.PI * 2); ctx.fill();
        break;

      case 'whack_winner':
        // Cool squint + smirk
        ctx.strokeStyle = 'rgba(0,0,0,0.45)';
        ctx.beginPath(); ctx.moveTo(size * 0.28, -size * 0.22); ctx.lineTo(size * 0.54, -size * 0.14); ctx.stroke();
        ctx.beginPath(); ctx.arc(mX - mR * 0.3, mY, mR * 0.72, -0.18, Math.PI * 0.82); ctx.stroke();
        break;

      case 'whack_victim':
        // Dizzy X eyes + shocked O mouth
        ctx.strokeStyle = 'rgba(0,0,0,0.48)'; ctx.lineWidth = 1.5;
        [0, 1].forEach(di => {
          const dx = (di === 0 ? -1 : 1) * eyeR * 0.45;
          const ex = size * 0.4 + dx, ey = -size * 0.14, d = eyeR * 0.28;
          ctx.beginPath(); ctx.moveTo(ex - d, ey - d); ctx.lineTo(ex + d, ey + d); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(ex + d, ey - d); ctx.lineTo(ex - d, ey + d); ctx.stroke();
        });
        ctx.beginPath(); ctx.arc(mX - mR * 0.3, mY, mR * 0.58, 0, Math.PI * 2); ctx.stroke();
        break;

      case 'bump':
        // Surprised O mouth
        ctx.strokeStyle = 'rgba(0,0,0,0.38)';
        ctx.beginPath(); ctx.arc(mX - mR * 0.3, mY, mR * 0.55, 0, Math.PI * 2); ctx.stroke();
        break;

      default:
        // Normal smile
        ctx.strokeStyle = 'rgba(0,0,0,0.28)';
        ctx.beginPath(); ctx.arc(mX, mY, mR, 0, Math.PI); ctx.stroke();
    }

    // ── Stage 4 Bubble Crown (3 tiny upright bubbles) ─────────────────────────
    if (this.evolutionLevel === 4) {
      ctx.save();
      ctx.rotate(-finalRot);  // always upright regardless of fish angle
      this.crownBubbles.forEach((b, i) => {
        const cx2 = (i - 1) * size * 0.38;
        const cy2 = -size * 1.42 + Math.sin(b.phase) * size * 0.11;
        const br  = size * (0.058 + i * 0.013);
        ctx.strokeStyle = 'rgba(255,255,255,0.58)';
        ctx.fillStyle   = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.arc(cx2, cy2, br, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        // Bubble highlight
        ctx.fillStyle = 'rgba(255,255,255,0.38)';
        ctx.beginPath(); ctx.arc(cx2 - br * 0.3, cy2 - br * 0.3, br * 0.22, 0, Math.PI * 2); ctx.fill();
      });
      ctx.restore();
    }

    ctx.restore();
  }
}
