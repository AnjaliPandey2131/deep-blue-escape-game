// particles.js — Board-Local Trail Particle System (v1.3)
// Ambient ocean creatures have moved to ocean-bg.js.
// This system handles ONLY player movement trail bubbles on the board canvas.

export class ParticleSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.trailBubbles = [];
  }

  /** Spawn bubble trail at the player's current position */
  spawnTrail(x, y, count) {
    count = count || 2;
    for (let i = 0; i < count; i++) {
      this.trailBubbles.push({
        x: x + (Math.random() * 10 - 5),
        y: y + (Math.random() * 10 - 5),
        size: Math.random() * 3 + 1,
        speedX: (Math.random() * 0.8 - 0.4) - 0.5,
        speedY: (Math.random() * 0.5 - 0.25) - 0.85,
        life: 1.0,
        decay: Math.random() * 0.028 + 0.016
      });
    }
  }

  update(deltaTime) {
    for (let i = this.trailBubbles.length - 1; i >= 0; i--) {
      const tb = this.trailBubbles[i];
      tb.x += tb.speedX;
      tb.y += tb.speedY;
      tb.life -= tb.decay;
      if (tb.life <= 0) this.trailBubbles.splice(i, 1);
    }
  }

  draw() {
    const ctx = this.ctx;
    ctx.save();
    this.trailBubbles.forEach(tb => {
      ctx.strokeStyle = `rgba(255, 255, 255, ${tb.life * 0.32})`;
      ctx.fillStyle   = `rgba(255, 255, 255, ${tb.life * 0.1})`;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(tb.x, tb.y, tb.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
    ctx.restore();
  }
}
