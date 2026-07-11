// Fish Players Module

import { audio } from './audio.js?v=3';

export class FishPlayer {
  constructor(id, name, color, baseColor, isComputer = false) {
    this.id = id;
    this.name = name;
    this.color = color;
    this.baseColor = baseColor; // Hex string for canvas drawing
    this.isComputer = isComputer;
    
    this.tileNum = 1; // start at tile 1
    this.targetTile = 1;
    this.isUnlocked = false; // milestone 4 correct state
    this.sleeping = true; // map to isUnlocked
    
    // Smooth rendering coords
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;
    
    // Status effects
    this.bubbleShield = false;
    this.skipTurns = 0;
    
    // Animation states
    this.tailAngle = 0;
    this.tailSpeed = 0.15;
    this.floatOffset = Math.random() * 100;
    this.eyeBlink = false;
    this.blinkTimer = Math.random() * 3000 + 2000;
    
    // Trail system
    this.trailTimer = 0;
    
    // Move interpolation
    this.isMoving = false;
    this.moveQueue = [];
    this.moveProgress = 0;
    this.swimSpeed = 0.005; // speed parameter per tile
  }

  reset() {
    this.tileNum = 1;
    this.targetTile = 1;
    this.isUnlocked = false;
    this.sleeping = true;
    this.bubbleShield = false;
    this.skipTurns = 0;
    this.isMoving = false;
    this.moveQueue = [];
  }

  // Enqueue tiles to swim through step-by-step
  swimToPath(pathList) {
    this.moveQueue = [...this.moveQueue, ...pathList];
    this.isMoving = true;
    this.isUnlocked = true;
    this.sleeping = false;
  }

  update(deltaTime, board, particleSystem, opponentTileNum) {
    // 1. Idle float/tail wag update
    this.floatOffset += 0.003 * deltaTime;
    this.tailAngle += (this.isMoving ? 0.35 : 0.06) * deltaTime;
    
    // Eye blinking logic
    this.blinkTimer -= deltaTime;
    if (this.blinkTimer <= 0) {
      this.eyeBlink = !this.eyeBlink;
      this.blinkTimer = this.eyeBlink ? 150 : Math.random() * 4000 + 2000;
    }

    // 2. Handle position interpolation
    if (this.isMoving && this.moveQueue.length > 0) {
      const nextTile = this.moveQueue[0];
      const endCoords = board.getTileCoords(nextTile);
      
      // If just starting this step, capture start positions
      if (this.moveProgress === 0) {
        audio.playMove();
      }

      this.moveProgress += 0.006 * deltaTime;
      
      if (this.moveProgress >= 1.0) {
        // Arrived at next tile in queue
        this.tileNum = nextTile;
        this.targetTile = nextTile;
        this.x = endCoords.x;
        this.y = endCoords.y;
        this.moveProgress = 0;
        this.moveQueue.shift();
        
        if (this.moveQueue.length === 0) {
          this.isMoving = false;
        }
      } else {
        // Smooth sine ease-in-out factor for natural speed-up / slow-down
        const t = (1 - Math.cos(this.moveProgress * Math.PI)) / 2;
        
        // Gentle bobbing bounce during active swimming
        const bob = Math.sin(this.moveProgress * Math.PI) * 4;

        // Interpolate position
        const startCoords = board.getTileCoords(this.tileNum);
        this.x = startCoords.x + (endCoords.x - startCoords.x) * t;
        this.y = startCoords.y + (endCoords.y - startCoords.y) * t + bob;
        
        // Spawn bubbles during swimming
        this.trailTimer += deltaTime;
        if (this.trailTimer >= 60) {
          particleSystem.spawnTrail(this.x, this.y, 1);
          this.trailTimer = 0;
        }
      }
    } else {
      // Idle position at current tile
      const coords = board.getTileCoords(this.tileNum);
      const idleFloat = Math.sin(this.floatOffset) * 4;
      
      // Add slight offset only if both occupy same tile
      let playerOffset = 0;
      if (this.tileNum === opponentTileNum) {
        playerOffset = this.id === 1 ? -12 : 12;
      }

      this.x = coords.x + playerOffset;
      this.y = coords.y + idleFloat;
    }
  }

  draw(ctx, board) {
    ctx.save();
    
    const size = board.tileWidth * 0.35;
    
    // Draw bubble shield if active
    if (this.bubbleShield) {
      ctx.strokeStyle = "rgba(0, 242, 254, 0.8)";
      ctx.fillStyle = "rgba(0, 242, 254, 0.15)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.x, this.y, size * 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Determine fish facing direction
    let angle = 0;
    if (this.isMoving && this.moveQueue.length > 0) {
      const nextTile = this.moveQueue[0];
      const startCoords = board.getTileCoords(this.tileNum);
      const endCoords = board.getTileCoords(nextTile);
      angle = Math.atan2(endCoords.y - startCoords.y, endCoords.x - startCoords.x);
    }
    
    ctx.translate(this.x, this.y);
    ctx.rotate(angle);

    // Draw Sleeping "Zzz"
    if (!this.isUnlocked) {
      ctx.save();
      ctx.rotate(-angle); // undo rotation for Zzz text
      ctx.fillStyle = "#f1c40f";
      ctx.font = "bold 12px 'Outfit'";
      const zOffset = Math.sin(this.floatOffset * 2) * 3;
      ctx.fillText("Zzz...", size, -size + zOffset);
      ctx.restore();
    }

    // Draw Fish Tail (wags using Math.sin)
    ctx.fillStyle = this.baseColor;
    const wag = Math.sin(this.tailAngle) * 0.3;
    ctx.save();
    ctx.translate(-size * 0.8, 0);
    ctx.rotate(wag);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-size * 0.8, -size * 0.5);
    ctx.lineTo(-size * 0.6, 0);
    ctx.lineTo(-size * 0.8, size * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Draw Fish Body (cute oval)
    ctx.beginPath();
    ctx.ellipse(0, 0, size, size * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Draw Dorsal/Pectoral Fin
    ctx.fillStyle = this.baseColor;
    ctx.beginPath();
    ctx.moveTo(-size * 0.2, -size * 0.6);
    ctx.quadraticCurveTo(-size * 0.5, -size * 1.1, -size * 0.7, -size * 0.6);
    ctx.closePath();
    ctx.fill();

    // Draw Cute Eye
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(size * 0.4, -size * 0.15, size * 0.22, 0, Math.PI * 2);
    ctx.fill();

    if (!this.eyeBlink) {
      ctx.fillStyle = "#0f1c3f";
      ctx.beginPath();
      ctx.arc(size * 0.45, -size * 0.15, size * 0.1, 0, Math.PI * 2);
      ctx.fill();
      
      // Eye reflection shine
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(size * 0.42, -size * 0.18, size * 0.04, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Blink line
      ctx.strokeStyle = "#0f1c3f";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(size * 0.3, -size * 0.15);
      ctx.lineTo(size * 0.5, -size * 0.15);
      ctx.stroke();
    }

    // Draw Cute Mouth
    ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(size * 0.7, size * 0.1, size * 0.15, 0, Math.PI);
    ctx.stroke();

    ctx.restore();
  }
}
