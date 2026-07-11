// Particles and Background Effects Module

export class ParticleSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.bubbles = [];
    this.plankton = [];
    this.rays = [];
    this.trailBubbles = [];
    this.fishSchools = [];
    
    this.init();
  }

  init() {
    // Generate initial background bubbles
    for (let i = 0; i < 20; i++) {
      this.bubbles.push(this.createBubble(true));
    }
    
    // Generate initial plankton/dust particles
    for (let i = 0; i < 40; i++) {
      this.plankton.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        size: Math.random() * 2 + 1,
        speedX: Math.random() * 0.4 - 0.2,
        speedY: Math.random() * 0.3 + 0.1,
        opacity: Math.random() * 0.5 + 0.2
      });
    }

    // Generate volumetric light rays
    for (let i = 0; i < 4; i++) {
      this.rays.push({
        x1: Math.random() * this.canvas.width,
        width: Math.random() * 60 + 40,
        opacity: Math.random() * 0.05 + 0.02,
        speed: (Math.random() * 0.02 + 0.01) * (Math.random() > 0.5 ? 1 : -1)
      });
    }

    // Generate schools of background fishes
    for (let s = 0; s < 3; s++) {
      const direction = Math.random() > 0.5 ? 1 : -1;
      const speed = (Math.random() * 0.08 + 0.05) * direction;
      const startX = direction > 0 ? -100 : this.canvas.width + 100;
      const startY = Math.random() * (this.canvas.height - 200) + 100;
      
      const fishes = [];
      const count = Math.floor(Math.random() * 4) + 4; // 4 to 7 fishes per school
      for (let f = 0; f < count; f++) {
        fishes.push({
          offsetX: Math.random() * 60 - 30,
          offsetY: Math.random() * 40 - 20,
          size: Math.random() * 3 + 3,
          tailSpeed: Math.random() * 0.01 + 0.01,
          tailAngle: Math.random() * Math.PI
        });
      }

      this.fishSchools.push({
        x: startX,
        y: startY,
        speedX: speed,
        direction: direction,
        fishes: fishes
      });
    }
  }

  createBubble(randomY = false) {
    return {
      x: Math.random() * this.canvas.width,
      y: randomY ? Math.random() * this.canvas.height : this.canvas.height + 20,
      size: Math.random() * 6 + 2,
      speedY: Math.random() * 1.5 + 0.5,
      wobble: Math.random() * 100,
      wobbleSpeed: Math.random() * 0.02 + 0.01,
      opacity: Math.random() * 0.4 + 0.2
    };
  }

  spawnTrail(x, y, count = 2) {
    for (let i = 0; i < count; i++) {
      this.trailBubbles.push({
        x: x + (Math.random() * 10 - 5),
        y: y + (Math.random() * 10 - 5),
        size: Math.random() * 3 + 1,
        speedX: (Math.random() * 0.8 - 0.4) - 0.5, // drift slightly back
        speedY: (Math.random() * 0.5 - 0.25) - 0.8, // drift up
        life: 1.0,
        decay: Math.random() * 0.03 + 0.02
      });
    }
  }

  update(deltaTime) {
    // 1. Update background bubbles
    this.bubbles.forEach(b => {
      b.y -= b.speedY;
      b.wobble += b.wobbleSpeed;
      b.x += Math.sin(b.wobble) * 0.3;
      
      // Reset if bubble exits screen
      if (b.y < -20) {
        Object.assign(b, this.createBubble(false));
      }
    });

    // 2. Update plankton
    this.plankton.forEach(p => {
      p.x += p.speedX;
      p.y -= p.speedY;
      
      if (p.y < -5) {
        p.y = this.canvas.height + 5;
        p.x = Math.random() * this.canvas.width;
      }
      if (p.x < -5 || p.x > this.canvas.width + 5) {
        p.x = Math.random() * this.canvas.width;
      }
    });

    // 3. Update light rays
    this.rays.forEach(r => {
      r.x1 += r.speed;
      if (r.x1 > this.canvas.width + 100) {
        r.x1 = -100;
      } else if (r.x1 < -100) {
        r.x1 = this.canvas.width + 100;
      }
    });

    // 4. Update bubble trails
    for (let i = this.trailBubbles.length - 1; i >= 0; i--) {
      const tb = this.trailBubbles[i];
      tb.x += tb.speedX;
      tb.y += tb.speedY;
      tb.life -= tb.decay;
      if (tb.life <= 0) {
        this.trailBubbles.splice(i, 1);
      }
    }

    // 5. Update background fish schools
    this.fishSchools.forEach(school => {
      school.x += school.speedX * (deltaTime || 16);
      school.fishes.forEach(f => {
        f.tailAngle += f.tailSpeed * (deltaTime || 16);
      });

      // Reset when offscreen
      if (school.direction > 0 && school.x > this.canvas.width + 150) {
        school.x = -150;
        school.y = Math.random() * (this.canvas.height - 200) + 100;
      } else if (school.direction < 0 && school.x < -150) {
        school.x = this.canvas.width + 150;
        school.y = Math.random() * (this.canvas.height - 200) + 100;
      }
    });
  }

  draw() {
    this.ctx.save();

    // 1. Draw light rays
    this.rays.forEach(r => {
      const grad = this.ctx.createLinearGradient(r.x1, 0, r.x1 + 150, this.canvas.height);
      grad.addColorStop(0, `rgba(0, 242, 254, ${r.opacity})`);
      grad.addColorStop(1, 'rgba(0, 242, 254, 0)');
      
      this.ctx.fillStyle = grad;
      this.ctx.beginPath();
      this.ctx.moveTo(r.x1, 0);
      this.ctx.lineTo(r.x1 + r.width, 0);
      this.ctx.lineTo(r.x1 + r.width + 150, this.canvas.height);
      this.ctx.lineTo(r.x1 + 150, this.canvas.height);
      this.ctx.closePath();
      this.ctx.fill();
    });

    // 2. Draw background fish schools (low opacity)
    this.ctx.save();
    this.ctx.globalAlpha = 0.12;
    this.ctx.fillStyle = "#00f2fe";
    this.fishSchools.forEach(school => {
      school.fishes.forEach(f => {
        const fx = school.x + f.offsetX;
        const fy = school.y + f.offsetY;
        
        this.ctx.save();
        this.ctx.translate(fx, fy);
        if (school.direction < 0) {
          this.ctx.scale(-1, 1);
        }

        // Body
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, f.size, f.size * 0.6, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // Tail
        const wag = Math.sin(f.tailAngle) * (f.size * 0.3);
        this.ctx.beginPath();
        this.ctx.moveTo(-f.size * 0.8, 0);
        this.ctx.lineTo(-f.size * 1.4, -f.size * 0.4 + wag);
        this.ctx.lineTo(-f.size * 1.4, f.size * 0.4 + wag);
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.restore();
      });
    });
    this.ctx.restore();

    // 3. Draw plankton particles
    this.plankton.forEach(p => {
      this.ctx.fillStyle = `rgba(168, 230, 206, ${p.opacity})`;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    });

    // 4. Draw background bubbles
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    this.ctx.lineWidth = 1;
    this.bubbles.forEach(b => {
      this.ctx.fillStyle = `rgba(255, 255, 255, ${b.opacity * 0.15})`;
      this.ctx.beginPath();
      this.ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();

      // Highlight/reflection dot
      this.ctx.fillStyle = `rgba(255, 255, 255, ${b.opacity * 0.5})`;
      this.ctx.beginPath();
      this.ctx.arc(b.x - b.size * 0.3, b.y - b.size * 0.3, b.size * 0.15, 0, Math.PI * 2);
      this.ctx.fill();
    });

    // 4. Draw trail bubbles
    this.trailBubbles.forEach(tb => {
      this.ctx.strokeStyle = `rgba(255, 255, 255, ${tb.life * 0.3})`;
      this.ctx.fillStyle = `rgba(255, 255, 255, ${tb.life * 0.1})`;
      this.ctx.beginPath();
      this.ctx.arc(tb.x, tb.y, tb.size, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();
    });

    this.ctx.restore();
  }
}
