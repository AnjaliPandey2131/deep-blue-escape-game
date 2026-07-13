// Core Game Loop & Orchestrator — v1.5 (Evolution & Tail Whack)

import { audio } from './audio.js?v=6';
import { ParticleSystem } from './particles.js?v=5';
import { GameBoard } from './board.js?v=4';
import { FishPlayer } from './player.js?v=6';
import { ShellDice } from './dice.js?v=4';
import { EventManager } from './events.js?v=4';
import { cinematic } from './ocean.js?v=5';
import { OceanBackground } from './ocean-bg.js?v=5';
import { PUSH_TABLE, GROW_EVENTS, SHRINK_EVENTS, EVENT_POPUP_TIMEOUT } from './evolution.js?v=6';

class GameOrchestrator {
  constructor() {
    this.canvas = document.getElementById('fish-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.board = new GameBoard(this.canvas);
    this.particles = new ParticleSystem(this.canvas);
    this.rules = new EventManager(this.board);

    this.players = [];
    this.currentPlayerIndex = 0;
    this.gameMode = 'single';

    this.lastTime = 0;
    this.gameState = 'menu';

    this.dice = null;
    this.uiInit = false;

    // Tail Whack — one per turn
    this.whackUsedThisTurn = false;
    this._bannerTimer = null;
    this._alertTimer  = null;   // auto-dismiss timer handle
  }

  init() {
    this.board.resize();
    window.addEventListener('resize', () => this.board.resize());

    this.players.push(new FishPlayer(1, 'Clownfish (P1)', 'orange', '#ff6b6b', false));
    this.players.push(new FishPlayer(2, 'Neontetra (P2)', 'turquoise', '#00f2fe', true));

    this.dice = new ShellDice('shell-dice-trigger', 'dice-number-display', (val) => this.handleDiceResult(val));
    this.setupUIEvents();
    requestAnimationFrame((t) => this.loop(t));
  }

  setupUIEvents() {
    if (this.uiInit) return;
    this.uiInit = true;

    const allButtons = document.querySelectorAll('button, .btn-glass');
    allButtons.forEach(btn => {
      btn.addEventListener('mouseenter', () => audio.playHover());
      btn.addEventListener('click', () => audio.playClick());
    });

    document.getElementById('btn-singleplayer').addEventListener('click', () => this.startGame('single'));
    document.getElementById('btn-multiplayer').addEventListener('click', () => this.startGame('local'));

    const settingsBtn   = document.getElementById('btn-settings');
    const settingsModal = document.getElementById('settings-modal');
    const closeSettings = document.getElementById('close-settings');
    const musicToggle   = document.getElementById('toggle-music');
    const sfxToggle     = document.getElementById('toggle-sfx');

    settingsBtn.addEventListener('click', () => settingsModal.classList.add('active'));
    closeSettings.addEventListener('click', () => settingsModal.classList.remove('active'));
    musicToggle.addEventListener('change', (e) => audio.toggleMusic(e.target.checked));
    sfxToggle.addEventListener('change', (e) => audio.toggleSFX(e.target.checked));

    document.getElementById('btn-alert-ok').addEventListener('click', () => this.dismissAlert());
    document.getElementById('btn-exit-game').addEventListener('click', () => this.exitToMenu());
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
    this.whackUsedThisTurn = false;

    this.players.forEach(p => {
      const coords = this.board.getTileCoords(1);
      p.x = coords.x + (p.id === 1 ? -12 : 12);
      p.y = coords.y;
    });

    if (mode === 'single') {
      this.players[1].name = 'Otto AI';
      this.players[1].isComputer = true;
    } else {
      this.players[1].name = 'BlueTang (P2)';
      this.players[1].isComputer = false;
    }

    this.currentPlayerIndex = 0;
    this.gameState = 'playing';

    this.stats = {
      turns: 0, biggestRoll: 0, events: 0, obstacles: 0,
      startTime: Date.now()
    };

    document.getElementById('main-menu-screen').classList.remove('active');
    document.getElementById('game-screen').classList.add('active');

    setTimeout(() => {
      this.board.resize();
      this.players.forEach(p => {
        const coords = this.board.getTileCoords(p.tileNum);
        p.x = coords.x + (p.id === 1 ? -12 : 12);
        p.y = coords.y;
      });
    }, 50);

    this.logAction('Game started! Roll a 3 to wake up your fish.', 'system');
    this.updateHUD();
    this.checkTurn();
  }

  exitToMenu() {
    this.gameState = 'menu';
    document.getElementById('game-screen').classList.remove('active');
    document.getElementById('main-menu-screen').classList.add('active');
  }

  logAction(text, styleClass = '') {
    const logBox = document.getElementById('log-box');
    if (!logBox) return;
    const entry = document.createElement('div');
    entry.className = `log-entry ${styleClass}`;
    let bullet = '🔵 ';
    if (styleClass === 'system')   bullet = '⭐ ';
    else if (styleClass === 'obstacle') bullet = '🔴 ';
    else if (styleClass === 'reward')   bullet = '🟢 ';
    else if (styleClass === 'player1')  bullet = '🔵 ';
    else if (styleClass === 'player2')  bullet = '🟣 ';
    entry.innerText = bullet + text;
    logBox.appendChild(entry);
    logBox.scrollTop = logBox.scrollHeight;
  }

  updateHUD() {
    const p1 = this.players[0];
    const p2 = this.players[1];

    document.getElementById('p1-name').innerText = p1.name;
    document.getElementById('p1-pos').innerText  = `Tile: ${p1.tileNum}`;
    document.getElementById('p1-status').innerHTML = !p1.isUnlocked
      ? `<span class="sleep-badge">Sleeping</span>`
      : (p1.bubbleShield ? `<span class="shield-badge">Shielded</span>` : 'Active');

    document.getElementById('p2-name').innerText = p2.name;
    document.getElementById('p2-pos').innerText  = `Tile: ${p2.tileNum}`;
    document.getElementById('p2-status').innerHTML = !p2.isUnlocked
      ? `<span class="sleep-badge">Sleeping</span>`
      : (p2.bubbleShield ? `<span class="shield-badge">Shielded</span>` : 'Active');

    // Stage badges
    const p1Stage = document.getElementById('p1-stage');
    const p2Stage = document.getElementById('p2-stage');
    if (p1Stage) p1Stage.textContent = p1.stage.emoji;
    if (p2Stage) p2Stage.textContent = p2.stage.emoji;

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

  // ─── Evolution Banner ─────────────────────────────────────────────────────
  showEvoBanner(text, duration = 1400) {
    const banner = document.getElementById('evo-banner');
    if (!banner) return;
    banner.textContent = text;
    banner.classList.add('visible');
    clearTimeout(this._bannerTimer);
    this._bannerTimer = setTimeout(() => banner.classList.remove('visible'), duration);
  }

  // ─── Tail Whack ───────────────────────────────────────────────────────────
  /**
   * Compare two fish on the same tile.
   * The larger fish always performs the whack regardless of arrival order.
   * Returns a Promise that resolves when the animation (and any victim push) completes.
   */
  checkTailWhack(mover, opponent) {
    if (!opponent || mover.tileNum !== opponent.tileNum) return Promise.resolve();
    if (this.whackUsedThisTurn) return Promise.resolve();
    this.whackUsedThisTurn = true;

    const ml = mover.evolutionLevel;
    const ol = opponent.evolutionLevel;

    // ── Bump (equal size) ──────────────────────────────────────────────────
    if (ml === ol) {
      mover.triggerWhackAnim('bump');
      opponent.triggerWhackAnim('bump');
      audio.playTailWhack();
      this.logAction(
        `${mover.name} and ${opponent.name} are the same size — funny bump! 💥`,
        'system'
      );
      this.showEvoBanner('💥 Bump!', 900);
      return new Promise(resolve => setTimeout(resolve, 800));
    }

    // ── Tail Whack (size mismatch) ─────────────────────────────────────────
    const attacker = ml > ol ? mover    : opponent;
    const victim   = ml > ol ? opponent : mover;
    const pushDist = (PUSH_TABLE[attacker.evolutionLevel] || {})[victim.evolutionLevel] || 0;

    attacker.triggerWhackAnim('attacker');
    victim.triggerWhackAnim('victim');
    audio.playTailWhack();

    return new Promise(resolve => {
      setTimeout(() => {
        // Move victim back
        if (pushDist > 0) {
          const newTile = Math.max(1, victim.tileNum - pushDist);
          const path = [];
          for (let ti = victim.tileNum - 1; ti >= newTile; ti--) path.push(ti);
          victim.swimToPath(path);
          this.logAction(
            `${attacker.name} 🐟 Tail Whacked ${victim.name}! Pushed back ${pushDist} tiles.`,
            'obstacle'
          );
          this.showEvoBanner(`🐟 Tail Whack! ${victim.name} sent back ${pushDist} tiles!`, 2000);
          this.updateHUD();
        }
        resolve();
      }, 1500);
    });
  }

  checkTurn() {
    this.updateHUD();
    const activePlayer = this.players[this.currentPlayerIndex];

    if (activePlayer.skipTurns > 0) {
      this.logAction(`${activePlayer.name} skipped turn (recovering).`, 'system');
      activePlayer.skipTurns--;
      this.nextTurn();
      return;
    }

    const promptEl = document.querySelector('.roll-prompt');
    if (activePlayer.isComputer) {
      this.dice.setEnabled(false);
      this.logAction(`${activePlayer.name} is thinking...`, 'system');
      if (promptEl) promptEl.innerHTML = `🤖 <em>${activePlayer.name} is thinking...</em>`;
      setTimeout(() => {
        if (this.gameState === 'playing') this.dice.roll();
      }, 1500);
    } else {
      this.dice.setEnabled(true);
      if (promptEl) promptEl.innerHTML = `🐠 <strong>${activePlayer.name}</strong>, click shell to roll!`;
    }
  }

  handleDiceResult(value) {
    const activePlayer = this.players[this.currentPlayerIndex];
    this.logAction(`${activePlayer.name} rolled a ${value}!`, activePlayer.id === 1 ? 'player1' : 'player2');
    if (this.stats) this.stats.biggestRoll = Math.max(this.stats.biggestRoll, value);

    if (!activePlayer.isUnlocked) {
      if (value === 3) {
        activePlayer.isUnlocked = true;
        activePlayer.sleeping = false;
        this.logAction(`${activePlayer.name} woke up and joined the race!`, 'system');
        audio.playDolphin();
        this.movePlayer(activePlayer, 3);
      } else {
        this.logAction(`${activePlayer.name} rolled a ${value}: Still Sleeping...`, 'system');
        this.triggerAlert('Still Sleeping...', `${activePlayer.name} needs a 3 to wake up!`, '😴', () => {
          this.nextTurn();
        });
      }
    } else {
      this.movePlayer(activePlayer, value);
    }
  }

  movePlayer(player, steps) {
    this.gameState = 'animating';
    this.dice.setEnabled(false);
    const path = [];
    let curr = player.tileNum;
    for (let i = 1; i <= steps; i++) {
      if (curr + i <= 100) path.push(curr + i);
    }
    player.swimToPath(path);
  }

  nextTurn() {
    if (this.stats) this.stats.turns++;
    this.whackUsedThisTurn = false;   // reset per-turn whack flag
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
    this.gameState = 'playing';
    this.checkTurn();
  }

  spawnSparkles(tileEl) {
    if (!tileEl) return;
    const colors = ['#00f2fe', '#ffffff', '#f1c40f', '#2ecc71'];
    for (let i = 0; i < 5; i++) {
      const sp = document.createElement('span');
      sp.className = 'tile-sparkle';
      const angle = (i / 5) * Math.PI * 2;
      const dist  = 10 + Math.random() * 14;
      const size  = 3 + Math.random() * 3;
      sp.style.cssText = [
        `left:${45 + Math.cos(angle) * 25}%`,
        `top:${45 + Math.sin(angle) * 25}%`,
        `width:${size}px`, `height:${size}px`,
        `background:${colors[i % colors.length]}`,
        `--tx:${Math.cos(angle) * dist}px`,
        `--ty:${Math.sin(angle) * dist}px`,
        `animation-delay:${i * 70}ms`
      ].join(';');
      tileEl.appendChild(sp);
      setTimeout(() => sp.remove(), 820);
    }
  }

  triggerAlert(title, desc, icon, onConfirm) {
    this.gameState = 'alert';
    document.getElementById('alert-icon').innerText  = icon;
    document.getElementById('alert-title').innerText = title;
    document.getElementById('alert-desc').innerText  = desc;

    const overlay = document.getElementById('game-alert');
    overlay.classList.remove('dismissing');  // reset if re-used quickly
    overlay.classList.add('active');
    this.alertCallback = onConfirm;

    // Auto-dismiss after EVENT_POPUP_TIMEOUT if player does nothing
    clearTimeout(this._alertTimer);
    this._alertTimer = setTimeout(() => this.dismissAlert(), EVENT_POPUP_TIMEOUT);
  }

  dismissAlert() {
    // Guard: ignore if already dismissed or no callback queued
    if (!this.alertCallback) return;

    clearTimeout(this._alertTimer);
    this._alertTimer = null;

    const overlay = document.getElementById('game-alert');
    const cb = this.alertCallback;
    this.alertCallback = null;

    // Animated fade-out: add .dismissing, wait for transition, then hide
    overlay.classList.add('dismissing');
    setTimeout(() => {
      overlay.classList.remove('active', 'dismissing');
      cb();
    }, 370);  // matches CSS transition duration (350ms) + small buffer
  }

  processVictory(winner) {
    this.gameState = 'won';
    audio.playVictory();
    const elapsed  = Date.now() - (this.stats ? this.stats.startTime : Date.now());
    const totalSec = Math.floor(elapsed / 1000);
    const m = Math.floor(totalSec / 60).toString().padStart(2, '0');
    const s = (totalSec % 60).toString().padStart(2, '0');
    if (this.stats) {
      document.getElementById('stat-turns').innerText        = this.stats.turns;
      document.getElementById('stat-biggest-roll').innerText = this.stats.biggestRoll;
      document.getElementById('stat-events').innerText       = this.stats.events;
      document.getElementById('stat-obstacles').innerText    = this.stats.obstacles;
      document.getElementById('stat-time').innerText         = `${m}:${s}`;
    }
    const overlay = document.getElementById('victory-overlay');
    document.getElementById('victory-msg').innerHTML =
      `<strong>${winner.name}</strong> reached the Golden Pearl and won the game!`;
    overlay.classList.add('active');
    for (let i = 0; i < 40; i++) {
      setTimeout(() => {
        this.particles.spawnTrail(
          this.canvas.width / 2 + (Math.random() * 200 - 100),
          this.canvas.height / 2 + (Math.random() * 200 - 100), 5
        );
      }, i * 100);
    }
  }

  updateLeaderCrown() {
    document.querySelectorAll('.tile .leader-crown').forEach(el => el.remove());
    const [p1, p2] = this.players;
    if (!p1 || !p2) return;
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

  // ─── Tile Landing Resolution ─────────────────────────────────────────────
  /**
   * Called after the active player stops AND after the tail-whack check.
   * Contains all the existing tile-evaluation + cinematic + alert flow.
   */
  resolveTileLanding(activePlayer) {
    this.gameState = 'animating';
    const effect = this.rules.evaluateTile(activePlayer, activePlayer.tileNum);

    if (!effect) { this.nextTurn(); return; }

    if (this.stats) {
      this.stats.events++;
      if (effect.type === 'obstacle' || effect.type === 'shield_block') this.stats.obstacles++;
    }

    if (effect.sound === 'shark')         audio.playShark();
    else if (effect.sound === 'whirlpool') audio.playWhirlpool();
    else if (effect.sound === 'dolphin')   audio.playDolphin();
    else if (effect.sound === 'shock')     audio.playShock();
    else                                   audio.playBubble();

    if (effect.gainShield) activePlayer.bubbleShield = true;

    // Identify the tile type for grow/shrink hooks
    const tileSpec = this.board.specialTiles[activePlayer.tileNum];
    const tileType = tileSpec ? tileSpec.type : '';

    const finalResolve = () => {
      // ─ v1.5: Growth / Shrink hooks (fire BEFORE secondary move so anim plays during swim) ─
      if (GROW_EVENTS.has(tileType)) {
        const grew = activePlayer.grow();
        this.showEvoBanner(grew ? '✨ Growth! ✨' : '✨ Already Legendary!', 1500);
        this.updateHUD();
      } else if (SHRINK_EVENTS.has(tileType)) {
        const shrank = activePlayer.shrink();
        this.showEvoBanner(shrank ? '⬇ Shrunk!' : '😅 Tiny Already!', 1300);
        this.updateHUD();
      }

      if (effect.newTile !== activePlayer.tileNum) {
        this.gameState = 'animating';
        const path = [];
        const diff = effect.newTile - activePlayer.tileNum;
        const step = Math.sign(diff);
        let curr   = activePlayer.tileNum;
        while (curr !== effect.newTile) { curr += step; path.push(curr); }
        activePlayer.swimToPath(path);
      } else {
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

    let icon = '🫧';
    if (effect.type === 'obstacle') icon = '⚠️';
    else if (effect.type === 'reward') icon = '🎁';

    const showAlert = () => {
      this.logAction(`${activePlayer.name}: ${effect.title} - ${effect.desc}`, effect.type);
      this.triggerAlert(effect.title, effect.desc, icon, finalResolve);
    };

    const CINEMATIC_EVENTS = new Set([
      'coral_trap', 'crab', 'dolphin', 'shark', 'volcano',
      'whirlpool', 'jellyfish', 'puffer', 'current', 'rocks'
    ]);

    if (tileSpec && CINEMATIC_EVENTS.has(tileSpec.type)) {
      this.gameState = 'cinematic';
      cinematic.play(tileSpec.type, activePlayer.x, activePlayer.y)
        .then(() => showAlert());
    } else {
      showAlert();
    }
  }

  // ─── Main Loop ────────────────────────────────────────────────────────────
  loop(timestamp) {
    const deltaTime = timestamp - this.lastTime;
    this.lastTime = timestamp;

    if (this.gameState !== 'menu') {
      // Auto-resize
      const parent = this.canvas.parentElement;
      if (parent && (this.canvas.width === 0 || parent.clientWidth !== parseInt(this.canvas.style.width))) {
        this.board.resize();
        this.players.forEach(p => {
          const coords = this.board.getTileCoords(p.tileNum);
          p.x = coords.x + (p.id === 1 ? -12 : 12);
          p.y = coords.y;
        });
      }

      this.board.update(deltaTime);
      this.particles.update(deltaTime);

      const [p1, p2] = this.players;
      p1.update(deltaTime, this.board, this.particles, p2.tileNum);
      p2.update(deltaTime, this.board, this.particles, p1.tileNum);

      this.board.draw();
      this.particles.draw();

      // Tile highlights
      document.querySelectorAll('.tile.highlighted').forEach(el => el.classList.remove('highlighted'));
      document.querySelectorAll('.tile.active-player-tile').forEach(el => el.classList.remove('active-player-tile'));

      const activePlayer = this.players[this.currentPlayerIndex];
      if (activePlayer && !activePlayer.isMoving && this.gameState === 'playing') {
        const el = document.getElementById(`tile-${activePlayer.tileNum}`);
        if (el) el.classList.add('active-player-tile');
      }

      this.players.forEach(p => {
        const el = document.getElementById(`tile-${p.tileNum}`);
        if (el) el.classList.add('highlighted');
        if (p.isMoving && p.moveQueue.length > 0) {
          const ne = document.getElementById(`tile-${p.moveQueue[0]}`);
          if (ne) ne.classList.add('highlighted');
        }
      });

      this.updateLeaderCrown();
      this.players.forEach(p => p.draw(this.ctx, this.board));

      // ── Landing detection ──────────────────────────────────────────────────
      if (this.gameState === 'animating') {
        const ap = this.players[this.currentPlayerIndex];
        if (!ap.isMoving) {
          // Visual landing effects
          const landingTile = document.getElementById(`tile-${ap.tileNum}`);
          if (landingTile) {
            landingTile.classList.add('pulse-once');
            setTimeout(() => landingTile.classList.remove('pulse-once'), 600);
            this.spawnSparkles(landingTile);
          }
          this.particles.spawnTrail(ap.x, ap.y, 8);
          audio.playSplash();

          if (ap.tileNum === 100) {
            this.processVictory(ap);
          } else {
            // ── Tail Whack check first, then tile evaluation ────────────────
            this.gameState = 'whacking';
            const opp = this.players.find(p => p.id !== ap.id);
            this.checkTailWhack(ap, opp).then(() => this.resolveTileLanding(ap));
          }
        }
      }
    }

    requestAnimationFrame((t) => this.loop(t));
  }
}

// Bootstrap
document.addEventListener('DOMContentLoaded', () => {
  const oceanBgCanvas = document.getElementById('ocean-bg-canvas');
  if (oceanBgCanvas) new OceanBackground(oceanBgCanvas);

  const game = new GameOrchestrator();
  game.init();
  window.game = game;
});
