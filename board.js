// Serpentine HTML Board and Ocean Regions Module

export const REGIONS = {
  CORAL_GARDEN: { name: "Coral Garden", min: 1, max: 12, color: "#00f2fe", bg: "rgba(0, 242, 254, 0.08)" },
  KELP_FOREST: { name: "Kelp Forest", min: 13, max: 25, color: "#2ecc71", bg: "rgba(46, 204, 113, 0.08)" },
  ROCKY_REEF: { name: "Rocky Reef", min: 26, max: 38, color: "#95a5a6", bg: "rgba(149, 165, 166, 0.08)" },
  SUNKEN_SHIP: { name: "Sunken Ship Area", min: 39, max: 50, color: "#4facfe", bg: "rgba(79, 172, 254, 0.08)" },
  DEEP_OCEAN: { name: "Deep Ocean", min: 51, max: 63, color: "#3498db", bg: "rgba(52, 152, 219, 0.08)" },
  VOLCANIC_TRENCH: { name: "Volcanic Trench", min: 64, max: 75, color: "#3c6382", bg: "rgba(60, 99, 130, 0.08)" },
  CRYSTAL_CAVE: { name: "Crystal Cave", min: 76, max: 88, color: "#9b59b6", bg: "rgba(155, 89, 182, 0.08)" },
  GOLDEN_PEARL_SANCTUARY: { name: "Golden Pearl Sanctuary", min: 89, max: 100, color: "#f1c40f", bg: "rgba(241, 196, 15, 0.08)" }
};

export class GameBoard {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.gridElement = document.getElementById('board-grid');
    this.cols = 10;
    this.rows = 10;
    this.tileWidth = 0;
    this.tileHeight = 0;
    
    // Map tile index (1-100) to special features
    this.specialTiles = {};
    this.initSpecialTiles();
    this.generateHTMLBoard();
  }

  resize() {
    const parent = this.canvas.parentElement;
    if (!parent) return;
    const size = Math.min(parent.clientWidth, parent.clientHeight);
    if (size === 0) return;
    
    const dpr = window.devicePixelRatio || 1;
    
    this.canvas.width = size * dpr;
    this.canvas.height = size * dpr;
    this.canvas.style.width = `${size}px`;
    this.canvas.style.height = `${size}px`;
    
    this.ctx.resetTransform();
    this.ctx.scale(dpr, dpr);
    
    this.tileWidth = size / this.cols;
    this.tileHeight = size / this.rows;
  }

  generateHTMLBoard() {
    if (!this.gridElement) return;
    this.gridElement.innerHTML = '';

    const regionIcons = {
      "Coral Garden": "🪸",
      "Kelp Forest": "🌿",
      "Rocky Reef": "🪨",
      "Sunken Ship Area": "⚓",
      "Deep Ocean": "🌌",
      "Volcanic Trench": "🌋",
      "Crystal Cave": "🔮",
      "Golden Pearl Sanctuary": "✨"
    };

    for (let i = 1; i <= 100; i++) {
      const reg = this.getRegion(i);
      const special = this.specialTiles[i];

      // Serpentine coordinates: row from bottom (0-9)
      const index = i - 1;
      const r = Math.floor(index / 10);
      const c = index % 10;
      
      const gridRow = 10 - r;
      const gridCol = (r % 2 === 0) ? c + 1 : 10 - c;

      const isDanger = special && ['shark', 'octopus', 'volcano', 'coral_trap', 'crab', 'jellyfish', 'current', 'rocks', 'whirlpool'].includes(special.type);
      const isReward = special && ['dolphin', 'turtle', 'pearl', 'starfish', 'shield', 'chest'].includes(special.type);

      const tile = document.createElement('div');
      tile.className = `tile ${isDanger ? 'danger' : ''} ${isReward ? 'reward' : ''}`;
      tile.id = `tile-${i}`;
      tile.style.gridRow = gridRow;
      tile.style.gridColumn = gridCol;
      tile.style.borderColor = reg.color + "33"; // 20% opacity region color border
      
      // Ocean-inspired card background gradient
      tile.style.background = `linear-gradient(135deg, ${reg.bg} 0%, rgba(15, 28, 63, 0.75) 100%)`;

      const iconLabel = special ? special.label : (regionIcons[reg.name] || "");
      const displayName = special ? special.type.replace('_', ' ') : reg.name;

      tile.innerHTML = `
        <div class="tile-number">${i}</div>
        <div class="tile-icon">${i === 100 ? "👑" : iconLabel}</div>
        <div class="tile-name">${i === 100 ? "Pearl" : displayName}</div>
      `;

      this.gridElement.appendChild(tile);
    }
  }

  getTileCoords(tileNum) {
    if (!this.gridElement) return { x: 0, y: 0, w: 40, h: 40 };
    const tile = this.gridElement.children[tileNum - 1];
    if (!tile) return { x: 0, y: 0, w: 40, h: 40 };

    const rect = tile.getBoundingClientRect();
    const wrapperRect = this.canvas.parentElement.getBoundingClientRect();

    return {
      x: rect.left - wrapperRect.left + rect.width / 2,
      y: rect.top - wrapperRect.top + rect.height / 2,
      w: rect.width,
      h: rect.height
    };
  }

  getRegion(tileNum) {
    for (const key in REGIONS) {
      const reg = REGIONS[key];
      if (tileNum >= reg.min && tileNum <= reg.max) {
        return reg;
      }
    }
    return REGIONS.CORAL_GARDEN;
  }

  initSpecialTiles() {
    // WHIRLPOOLS
    this.specialTiles[8] = { type: 'whirlpool', target: 4, label: "🌀" };
    this.specialTiles[21] = { type: 'whirlpool', target: 11, label: "🌀" };
    this.specialTiles[43] = { type: 'whirlpool', target: 30, label: "🌀" };
    this.specialTiles[68] = { type: 'whirlpool', target: 55, label: "🌀" };
    this.specialTiles[87] = { type: 'whirlpool', target: 70, label: "🌀" };

    // SHARKS
    this.specialTiles[19] = { type: 'shark', target: 7, label: "🦈" };
    this.specialTiles[47] = { type: 'shark', target: 35, label: "🦈" };
    this.specialTiles[78] = { type: 'shark', target: 60, label: "🦈" };

    // OCTOPUS
    this.specialTiles[33] = { type: 'octopus', target: 22, label: "🐙" };
    this.specialTiles[62] = { type: 'octopus', target: 50, label: "🐙" };
    this.specialTiles[93] = { type: 'octopus', target: 80, label: "🐙" };

    // VOLCANO
    this.specialTiles[74] = { type: 'volcano', target: 58, label: "🌋" };

    // DOLPHINS
    this.specialTiles[6] = { type: 'dolphin', target: 18, label: "🐬" };
    this.specialTiles[25] = { type: 'dolphin', target: 37, label: "🐬" };
    this.specialTiles[51] = { type: 'dolphin', target: 64, label: "🐬" };
    this.specialTiles[76] = { type: 'dolphin', target: 89, label: "🐬" };

    // TURTLES
    this.specialTiles[12] = { type: 'turtle', target: 24, label: "🐢" };
    this.specialTiles[38] = { type: 'turtle', target: 49, label: "🐢" };
    this.specialTiles[60] = { type: 'turtle', target: 73, label: "🐢" };

    // PEARLS
    this.specialTiles[9] = { type: 'pearl', label: "⚪" };
    this.specialTiles[31] = { type: 'pearl', label: "⚪" };
    this.specialTiles[56] = { type: 'pearl', label: "⚪" };
    this.specialTiles[82] = { type: 'pearl', label: "⚪" };

    // STARFISH
    this.specialTiles[14] = { type: 'starfish', label: "⭐" };
    this.specialTiles[46] = { type: 'starfish', label: "⭐" };
    this.specialTiles[72] = { type: 'starfish', label: "⭐" };

    // SHIELDS
    this.specialTiles[17] = { type: 'shield', label: "🛡️" };
    this.specialTiles[44] = { type: 'shield', label: "🛡️" };
    this.specialTiles[66] = { type: 'shield', label: "🛡️" };
    this.specialTiles[88] = { type: 'shield', label: "🛡️" };

    // TREASURE CHESTS
    this.specialTiles[22] = { type: 'chest', label: "🧰" };
    this.specialTiles[59] = { type: 'chest', label: "🧰" };
    this.specialTiles[81] = { type: 'chest', label: "🧰" };

    // TRAPS (Static stuck points)
    this.specialTiles[15] = { type: 'coral_trap', label: "🪸" };
    this.specialTiles[28] = { type: 'crab', label: "🦀" };
    this.specialTiles[36] = { type: 'jellyfish', label: "🪼" };
    this.specialTiles[41] = { type: 'coral_trap', label: "🪸" };
    this.specialTiles[52] = { type: 'crab', label: "🦀" };
    this.specialTiles[65] = { type: 'coral_trap', label: "🪸" };
    this.specialTiles[71] = { type: 'jellyfish', label: "🪼" };
    this.specialTiles[83] = { type: 'crab', label: "🦀" };
    this.specialTiles[91] = { type: 'jellyfish', label: "🪼" };

    // PUFFER FISH
    this.specialTiles[24] = { type: 'puffer', label: "🐡" };
    this.specialTiles[57] = { type: 'puffer', label: "🐡" };
    this.specialTiles[85] = { type: 'puffer', label: "🐡" };

    // CURRENT
    this.specialTiles[54] = { type: 'current', label: "🌊" };
    this.specialTiles[80] = { type: 'current', label: "🌊" };

    // FALLING ROCKS
    this.specialTiles[45] = { type: 'rocks', label: "🪨" };
    this.specialTiles[69] = { type: 'rocks', label: "🪨" };
  }

  update(deltaTime) {}

  draw() {
    // Canvas sizing based on parent container
    const size = Math.min(this.canvas.parentElement.clientWidth, this.canvas.parentElement.clientHeight);
    this.ctx.clearRect(0, 0, size, size);

    // 1. Draw connecting dotted path segment-by-segment using regional colors
    this.ctx.save();
    this.ctx.lineWidth = 2.0;
    this.ctx.setLineDash([4, 4]);
    for (let i = 1; i < 100; i++) {
      const start = this.getTileCoords(i);
      const end = this.getTileCoords(i + 1);
      const reg = this.getRegion(i);
      
      this.ctx.strokeStyle = reg.color + "3d"; // ~24% opacity glowing color
      this.ctx.beginPath();
      this.ctx.moveTo(start.x, start.y);
      this.ctx.lineTo(end.x, end.y);
      this.ctx.stroke();
    }
    this.ctx.restore();

    // 2. Draw movement curve overlays (Dolphin / Shark paths)
    this.drawMovementCurves();
  }

  drawMovementCurves() {
    const ctx = this.ctx;
    ctx.save();
    
    for (const key in this.specialTiles) {
      const spec = this.specialTiles[key];
      if (spec.target) {
        const start = this.getTileCoords(parseInt(key));
        const end = this.getTileCoords(spec.target);
        
        const isGood = spec.type === 'dolphin' || spec.type === 'turtle';
        ctx.strokeStyle = isGood ? "rgba(46, 204, 113, 0.35)" : "rgba(231, 76, 60, 0.35)";
        ctx.lineWidth = 3;
        
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        
        const midX = (start.x + end.x) / 2;
        const midY = (start.y + end.y) / 2 - 25; // arc slightly up
        ctx.quadraticCurveTo(midX, midY, end.x, end.y);
        ctx.stroke();

        ctx.fillStyle = ctx.strokeStyle;
        ctx.beginPath();
        ctx.arc(end.x, end.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    ctx.restore();
  }
}
