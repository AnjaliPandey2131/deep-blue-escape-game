// Core Game Loop & Orchestrator

import { audio } from './audio.js?v=3';
import { ParticleSystem } from './particles.js?v=3';
import { GameBoard } from './board.js?v=3';
import { FishPlayer } from './player.js?v=3';
import { ShellDice } from './dice.js?v=3';
import { EventManager } from './events.js?v=3';

class GameOrchestrator {
  constructor() {
    this.canvas = document.getElementById('fish-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.board = new GameBoard(this.canvas);
    this.particles = new ParticleSystem(this.canvas);
    this.rules = new EventManager(this.board);
    
    this.players = [];
    this.currentPlayerIndex = 0;
    this.gameMode = 'single'; // 'single' (vs AI) or 'local' (2 player local)
    
    this.lastTime = 0;
    this.gameState = 'menu'; // 'menu', 'playing', 'animating', 'alert', 'won'
    
    this.dice = null;
    this.uiInit = false;
  }

  init() {
    this.board.resize();
    window.addEventListener('resize', () => this.board.resize());

    // Initialize players
    // Player 1 (Orange Fish)
    this.players.push(new FishPlayer(1, "Clownfish (P1)", "orange", "#ff6b6b", false));
    // Player 2 / Computer (Turquoise Fish)
    this.players.push(new FishPlayer(2, "Neontetra (P2)", "turquoise", "#00f2fe", true));

    // Bind Shell Dice
    this.dice = new ShellDice('shell-dice-trigger', 'dice-number-display', (val) => this.handleDiceResult(val));

    this.setupUIEvents();
    
    // Start loop
    requestAnimationFrame((t) => this.loop(t));
  }

  setupUIEvents() {
    if (this.uiInit) return;
    this.uiInit = true;

    // Attach click and hover sound effects to all buttons
    const allButtons = document.querySelectorAll('button, .btn-glass');
    allButtons.forEach(btn => {
      btn.addEventListener('mouseenter', () => audio.playHover());
      btn.addEventListener('click', () => audio.playClick());
    });

    // Menu Play Buttons
    document.getElementById('btn-singleplayer').addEventListener('click', () => {
      this.startGame('single');
    });

    document.getElementById('btn-multiplayer').addEventListener('click', () => {
      this.startGame('local');
    });

    // Settings Toggle
    const settingsBtn = document.getElementById('btn-settings');
    const settingsModal = document.getElementById('settings-modal');
    const closeSettingsBtn = document.getElementById('close-settings');
    const musicToggle = document.getElementById('toggle-music');
    const sfxToggle = document.getElementById('toggle-sfx');

    settingsBtn.addEventListener('click', () => {
      settingsModal.classList.add('active');
    });

    closeSettingsBtn.addEventListener('click', () => {
      settingsModal.classList.remove('active');
    });

    musicToggle.addEventListener('change', (e) => {
      audio.toggleMusic(e.target.checked);
    });

    sfxToggle.addEventListener('change', (e) => {
      audio.toggleSFX(e.target.checked);
    });

    // Modal Alert Okay Button
    document.getElementById('btn-alert-ok').addEventListener('click', () => {
      this.dismissAlert();
    });

    // In-game Exit Button
    document.getElementById('btn-exit-game').addEventListener('click', () => {
      this.exitToMenu();
    });

    // Victory Restart Buttons
    document.getElementById('btn-victory-restart').addEventListener('click', () => {
      document.getElementById('victory-overlay').classList.remove('active');
      this.startGame(this.gameMode);
    });

    document.getElementById('btn-victory-menu').addEventListener('click', () => {
      document.getElementById('victory-overlay').classList.remove('active');
      this.exitToMenu();
    });
  }

  startGame(mode) {
    audio.init();
    audio.startBGM();
    
    this.gameMode = mode;
    this.players[0].reset();
    this.players[1].reset();

    // Position players on Tile 1 center immediately
    this.players.forEach(p => {
      const coords = this.board.getTileCoords(1);
      p.x = coords.x + (p.id === 1 ? -12 : 12);
      p.y = coords.y;
    });
    
    // Set player names & AI flags
    if (mode === 'single') {
      this.players[1].name = "Otto AI";
      this.players[1].isComputer = true;
    } else {
      this.players[1].name = "BlueTang (P2)";
      this.players[1].isComputer = false;
    }

    this.currentPlayerIndex = 0;
    this.gameState = 'playing';
    
    // Initialize statistics tracking
    this.stats = {
      turns: 0,
      biggestRoll: 0,
      events: 0,
      obstacles: 0,
      startTime: Date.now()
    };

    // Switch screen
    document.getElementById('main-menu-screen').classList.remove('active');
    document.getElementById('game-screen').classList.add('active');

    // Force board resize after layout is visible to capture true offsets
    setTimeout(() => {
      this.board.resize();
      // Reposition players to real centers
      this.players.forEach(p => {
        const coords = this.board.getTileCoords(p.tileNum);
        p.x = coords.x + (p.id === 1 ? -12 : 12);
        p.y = coords.y;
      });
    }, 50);

    this.logAction("Game started! Roll a 3 to wake up your fish.", "system");
    this.updateHUD();
    this.checkTurn();
  }

  exitToMenu() {
    this.gameState = 'menu';
    document.getElementById('game-screen').classList.remove('active');
    document.getElementById('main-menu-screen').classList.add('active');
  }

  logAction(text, styleClass = "") {
    const logBox = document.getElementById('log-box');
    if (!logBox) return;
    const entry = document.createElement('div');
    entry.className = `log-entry ${styleClass}`;
    
    let bullet = "🔵 ";
    if (styleClass === 'system') bullet = "⭐ ";
    else if (styleClass === 'obstacle') bullet = "🔴 ";
    else if (styleClass === 'reward') bullet = "🟢 ";
    else if (styleClass === 'player1') bullet = "🔵 ";
    else if (styleClass === 'player2') bullet = "🟣 ";
    
    entry.innerText = bullet + text;
    logBox.appendChild(entry);
    logBox.scrollTop = logBox.scrollHeight;
  }

  updateHUD() {
    const p1 = this.players[0];
    const p2 = this.players[1];

    document.getElementById('p1-name').innerText = p1.name;
    document.getElementById('p1-pos').innerText = `Tile: ${p1.tileNum}`;
    document.getElementById('p1-status').innerHTML = !p1.isUnlocked ? 
      `<span class="sleep-badge">Sleeping</span>` : 
      (p1.bubbleShield ? `<span class="shield-badge">Shielded</span>` : "Active");

    document.getElementById('p2-name').innerText = p2.name;
    document.getElementById('p2-pos').innerText = `Tile: ${p2.tileNum}`;
    document.getElementById('p2-status').innerHTML = !p2.isUnlocked ? 
      `<span class="sleep-badge">Sleeping</span>` : 
      (p2.bubbleShield ? `<span class="shield-badge">Shielded</span>` : "Active");

    const p1Card = document.getElementById('p1-card');
    const p2Card = document.getElementById('p2-card');

    if (this.currentPlayerIndex === 0) {
      p1Card.classList.add('active');
      p2Card.classList.remove('active');
    } else {
      p1Card.classList.remove('active');
      p2Card.classList.add('active');
    }
  }

  checkTurn() {
    this.updateHUD();
    const activePlayer = this.players[this.currentPlayerIndex];
    
    // Check if player has turns to skip
    if (activePlayer.skipTurns > 0) {
      this.logAction(`${activePlayer.name} skipped turn (recovering).`, "system");
      activePlayer.skipTurns--;
      this.nextTurn();
      return;
    }

    const promptEl = document.querySelector('.roll-prompt');
    if (activePlayer.isComputer) {
      this.dice.setEnabled(false);
      this.logAction(`${activePlayer.name} is thinking...`, "system");
      if (promptEl) promptEl.innerHTML = `🤖 <em>${activePlayer.name} is thinking...</em>`;
      setTimeout(() => {
        if (this.gameState === 'playing') {
          this.dice.roll();
        }
      }, 1500);
    } else {
      this.dice.setEnabled(true);
      if (promptEl) promptEl.innerHTML = `🐠 <strong>${activePlayer.name}</strong>, click shell to roll!`;
    }
  }

  handleDiceResult(value) {
    const activePlayer = this.players[this.currentPlayerIndex];
    this.logAction(`${activePlayer.name} rolled a ${value}!`, activePlayer.id === 1 ? 'player1' : 'player2');

    if (this.stats) {
      this.stats.biggestRoll = Math.max(this.stats.biggestRoll, value);
    }

    // Custom Rule: Sleeping fish wakes up ONLY on rolling 3
    if (!activePlayer.isUnlocked) {
      if (value === 3) {
        activePlayer.isUnlocked = true;
        activePlayer.sleeping = false;
        this.logAction(`${activePlayer.name} woke up and joined the race!`, 'system');
        audio.playDolphin();
        this.movePlayer(activePlayer, 3);
      } else {
        this.logAction(`${activePlayer.name} rolled a ${value}: Still Sleeping...`, 'system');
        this.triggerAlert("Still Sleeping...", `${activePlayer.name} needs a 3 to wake up!`, "😴", () => {
          this.nextTurn();
        });
      }
    } else {
      // Normal movement
      this.movePlayer(activePlayer, value);
    }
  }

  movePlayer(player, steps) {
    this.gameState = 'animating';
    this.dice.setEnabled(false);

    // Build incremental path list
    const path = [];
    let curr = player.tileNum;
    for (let i = 1; i <= steps; i++) {
      if (curr + i <= 100) {
        path.push(curr + i);
      }
    }
    
    player.swimToPath(path);
  }

  nextTurn() {
    if (this.stats) {
      this.stats.turns++;
    }
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
    this.gameState = 'playing';
    this.checkTurn();
  }

  triggerAlert(title, desc, icon, onConfirm) {
    this.gameState = 'alert';
    
    document.getElementById('alert-icon').innerText = icon;
    document.getElementById('alert-title').innerText = title;
    document.getElementById('alert-desc').innerText = desc;
    document.getElementById('game-alert').classList.add('active');
    
    this.alertCallback = onConfirm;
  }

  dismissAlert() {
    document.getElementById('game-alert').classList.remove('active');
    if (this.alertCallback) {
      const cb = this.alertCallback;
      this.alertCallback = null;
      cb();
    }
  }

  processVictory(winner) {
    this.gameState = 'won';
    audio.playVictory();
    
    // Format elapsed time
    const elapsed = Date.now() - (this.stats ? this.stats.startTime : Date.now());
    const totalSec = Math.floor(elapsed / 1000);
    const m = Math.floor(totalSec / 60).toString().padStart(2, '0');
    const s = (totalSec % 60).toString().padStart(2, '0');
    const timeStr = `${m}:${s}`;
    
    // Populate stats in DOM
    if (this.stats) {
      document.getElementById('stat-turns').innerText = this.stats.turns;
      document.getElementById('stat-biggest-roll').innerText = this.stats.biggestRoll;
      document.getElementById('stat-events').innerText = this.stats.events;
      document.getElementById('stat-obstacles').innerText = this.stats.obstacles;
      document.getElementById('stat-time').innerText = timeStr;
    }
    
    const overlay = document.getElementById('victory-overlay');
    const desc = document.getElementById('victory-msg');
    
    desc.innerHTML = `<strong>${winner.name}</strong> reached the Golden Pearl and won the game!`;
    overlay.classList.add('active');

    // Spawn victory bubble trail
    for (let i = 0; i < 40; i++) {
      setTimeout(() => {
        this.particles.spawnTrail(this.canvas.width / 2 + (Math.random() * 200 - 100), this.canvas.height / 2 + (Math.random() * 200 - 100), 5);
      }, i * 100);
    }
  }

  updateLeaderCrown() {
    document.querySelectorAll('.tile .leader-crown').forEach(el => el.remove());
    
    const p1 = this.players[0];
    const p2 = this.players[1];
    if (!p1 || !p2) return;
    
    // Only display crown if one player has actually moved past Tile 1
    const maxTile = Math.max(p1.tileNum, p2.tileNum);
    if (maxTile > 1) {
      let leader = null;
      if (p1.tileNum > p2.tileNum) leader = p1;
      else if (p2.tileNum > p1.tileNum) leader = p2;
      
      if (leader) {
        const tileEl = document.getElementById(`tile-${leader.tileNum}`);
        if (tileEl && !tileEl.querySelector('.leader-crown')) {
          const crown = document.createElement('div');
          crown.className = 'leader-crown';
          crown.innerText = '👑';
          tileEl.appendChild(crown);
        }
      }
    }
  }

  loop(timestamp) {
    const deltaTime = timestamp - this.lastTime;
    this.lastTime = timestamp;

    if (this.gameState !== 'menu') {
      // Auto-resize canvas if it's currently 0 or doesn't match wrapper bounds
      const parent = this.canvas.parentElement;
      if (parent && (this.canvas.width === 0 || parent.clientWidth !== parseInt(this.canvas.style.width))) {
        this.board.resize();
        // Recalculate player positions on the newly resized board
        this.players.forEach(p => {
          const coords = this.board.getTileCoords(p.tileNum);
          p.x = coords.x + (p.id === 1 ? -12 : 12);
          p.y = coords.y;
        });
      }

      // 1. Update Board & Particles
      this.board.update(deltaTime);
      this.particles.update(deltaTime);

      // 2. Update Players
      const p1 = this.players[0];
      const p2 = this.players[1];
      p1.update(deltaTime, this.board, this.particles, p2.tileNum);
      p2.update(deltaTime, this.board, this.particles, p1.tileNum);

      // 3. Render
      this.board.draw();
      this.particles.draw();

      // Update DOM tile highlights dynamically (both final position and currently crossed tiles)
      document.querySelectorAll('.tile.highlighted').forEach(el => el.classList.remove('highlighted'));
      document.querySelectorAll('.tile.active-player-tile').forEach(el => el.classList.remove('active-player-tile'));

      // The active player's tile gets the active pulsing glow (if not moving)
      const activePlayer = this.players[this.currentPlayerIndex];
      if (activePlayer && !activePlayer.isMoving && this.gameState === 'playing') {
        const activeTileEl = document.getElementById(`tile-${activePlayer.tileNum}`);
        if (activeTileEl) activeTileEl.classList.add('active-player-tile');
      }

      this.players.forEach(p => {
        const el = document.getElementById(`tile-${p.tileNum}`);
        if (el) el.classList.add('highlighted');
        
        // Glow the tile the player is currently swimming towards
        if (p.isMoving && p.moveQueue.length > 0) {
          const nextEl = document.getElementById(`tile-${p.moveQueue[0]}`);
          if (nextEl) nextEl.classList.add('highlighted');
        }
      });

      this.updateLeaderCrown();
      this.players.forEach(p => p.draw(this.ctx, this.board));

      // 4. Check if player movement finished
      if (this.gameState === 'animating') {
        const activePlayer = this.players[this.currentPlayerIndex];
        if (!activePlayer.isMoving) {
          // Play landing effect (soft scale pulse on tile, bubble burst, soft splash sound)
          const landingTile = document.getElementById(`tile-${activePlayer.tileNum}`);
          if (landingTile) {
            landingTile.classList.add('pulse-once');
            setTimeout(() => landingTile.classList.remove('pulse-once'), 600);
          }
          this.particles.spawnTrail(activePlayer.x, activePlayer.y, 8); // burst of 8 bubbles
          audio.playSplash(); // soft splash landing sound

          // Check for Victory
          if (activePlayer.tileNum === 100) {
            this.processVictory(activePlayer);
          } else {
            // Evaluate tile special effects
            const effect = this.rules.evaluateTile(activePlayer, activePlayer.tileNum);
            
            if (effect) {
              // Update stats
              if (this.stats) {
                this.stats.events++;
                if (effect.type === 'obstacle' || effect.type === 'shield_block') {
                  this.stats.obstacles++;
                }
              }
              // Play matching sound
              if (effect.sound === 'shark') audio.playShark();
              else if (effect.sound === 'whirlpool') audio.playWhirlpool();
              else if (effect.sound === 'dolphin') audio.playDolphin();
              else if (effect.sound === 'shock') audio.playShock();
              else audio.playBubble();

              if (effect.gainShield) activePlayer.bubbleShield = true;
              
              const finalResolve = () => {
                if (effect.newTile !== activePlayer.tileNum) {
                  // Swim to new target (e.g. dolphin ride / swept back)
                  this.gameState = 'animating';
                  const path = [];
                  const diff = effect.newTile - activePlayer.tileNum;
                  const step = Math.sign(diff);
                  let curr = activePlayer.tileNum;
                  
                  while (curr !== effect.newTile) {
                    curr += step;
                    path.push(curr);
                  }
                  
                  activePlayer.swimToPath(path);
                } else {
                  // Move on to next turn
                  if (effect.extraTurn) {
                    this.logAction(`${activePlayer.name} got an extra turn!`, 'system');
                    this.gameState = 'playing';
                    this.checkTurn();
                  } else {
                    if (effect.skipTurns > 0) activePlayer.skipTurns = effect.skipTurns;
                    this.nextTurn();
                  }
                }
              };

              let icon = "🫧";
              if (effect.type === 'obstacle') icon = "⚠️";
              else if (effect.type === 'reward') icon = "🎁";
              
              this.logAction(`${activePlayer.name}: ${effect.title} - ${effect.desc}`, effect.type);
              this.triggerAlert(effect.title, effect.desc, icon, finalResolve);

            } else {
              // Normal land, no obstacle/reward
              this.nextTurn();
            }
          }
        }
      }
    }

    requestAnimationFrame((t) => this.loop(t));
  }
}

// Instantiate and start on load
window.addEventListener('DOMContentLoaded', () => {
  const game = new GameOrchestrator();
  game.init();
});
