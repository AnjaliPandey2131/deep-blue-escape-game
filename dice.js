// Sea-Shell Dice Module

import { audio } from './audio.js?v=6';


export class ShellDice {
  constructor(diceContainerId, numberDisplayId, onRollComplete) {
    this.container = document.getElementById(diceContainerId);
    this.numberDisplay = document.getElementById(numberDisplayId);
    this.onRollComplete = onRollComplete;
    this.isRolling = false;
    
    this.init();
  }

  init() {
    if (!this.container) return;
    this.container.addEventListener('click', () => this.roll());
  }

  setEnabled(enabled) {
    if (enabled) {
      this.container.style.pointerEvents = 'auto';
      this.container.style.opacity = '1';
    } else {
      this.container.style.pointerEvents = 'none';
      this.container.style.opacity = '0.5';
    }
  }

  roll() {
    if (this.isRolling) return;
    this.isRolling = true;
    this.setEnabled(false);

    audio.playSplash();

    // 1. Trigger shell rotation animation
    let rotation = 0;
    const duration = 1200; // 1.2 seconds roll
    const startTime = performance.now();
    
    this.numberDisplay.style.opacity = '0';
    this.numberDisplay.style.transform = 'scale(0)';

    // Spawn bubbles in HTML around the shell
    this.spawnBubbleBurst();

    const animateRoll = (time) => {
      const elapsed = time - startTime;
      if (elapsed < duration) {
        // Spin fast and scale pulse
        rotation = (elapsed / duration) * 1440; // 4 full spins
        const scalePulse = 1.25 + Math.sin(elapsed / 60) * 0.2;
        this.container.style.transform = `rotate(${rotation}deg) scale(${scalePulse})`;
        this.container.style.filter = 'drop-shadow(0 0 25px rgba(0, 242, 254, 0.95)) brightness(1.2)';
        
        // Play click sounds rapidly
        if (Math.floor(elapsed / 80) % 2 === 0) {
          audio.playDiceClick();
        }
        
        requestAnimationFrame(animateRoll);
      } else {
        // Stop spinning and decide final value
        const rolledValue = Math.floor(Math.random() * 6) + 1;
        
        this.container.style.transform = 'rotate(0deg) scale(1)';
        this.container.style.filter = 'drop-shadow(0 0 15px rgba(0, 242, 254, 0.6))';
        this.numberDisplay.innerText = rolledValue;
        this.numberDisplay.style.opacity = '1';
        this.numberDisplay.style.transform = 'scale(1.3)';
        
        audio.playBubble();

        setTimeout(() => {
          this.isRolling = false;
          if (this.onRollComplete) {
            this.onRollComplete(rolledValue);
          }
        }, 600);
      }
    };

    requestAnimationFrame(animateRoll);
  }

  spawnBubbleBurst() {
    const rect = this.container.getBoundingClientRect();
    const parent = this.container.parentElement;
    
    for (let i = 0; i < 15; i++) {
      const bubble = document.createElement('div');
      bubble.style.position = 'absolute';
      bubble.style.width = `${Math.random() * 8 + 4}px`;
      bubble.style.height = bubble.style.width;
      bubble.style.borderRadius = '50%';
      bubble.style.background = 'rgba(255, 255, 255, 0.7)';
      bubble.style.border = '1px solid rgba(0, 242, 254, 0.5)';
      bubble.style.left = `${this.container.offsetLeft + 60}px`;
      bubble.style.top = `${this.container.offsetTop + 60}px`;
      bubble.style.pointerEvents = 'none';
      bubble.style.transition = 'all 1s cubic-bezier(0.1, 0.8, 0.3, 1)';
      bubble.style.zIndex = '5';
      
      parent.appendChild(bubble);

      // Force reflow
      bubble.offsetHeight;

      // Explode outwards
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * 80 + 40;
      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance - 30; // float upwards

      bubble.style.transform = `translate(${tx}px, ${ty}px)`;
      bubble.style.opacity = '0';

      setTimeout(() => {
        bubble.remove();
      }, 1000);
    }
  }
}
