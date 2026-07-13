// evolution.js — All configurable constants for the Fish Evolution System (v1.5)
// Edit these values to balance the game without touching any game logic.

// ─── Growth Stages ─────────────────────────────────────────────────────────────
// sizeScale: multiplied against the base fish radius (board.tileWidth * 0.35)
// tailSpeed: base tail animation speed per millisecond
// finScale: multiplied against the dorsal fin height
export const STAGES = [
  { level: 1, name: 'Tiny',  emoji: '🐠', sizeScale: 0.70, tailSpeed: 0.010, finScale: 0.70 },
  { level: 2, name: 'Small', emoji: '🐟', sizeScale: 0.90, tailSpeed: 0.014, finScale: 0.90 },
  { level: 3, name: 'Large', emoji: '🐡', sizeScale: 1.15, tailSpeed: 0.018, finScale: 1.20 },
  { level: 4, name: 'Giant', emoji: '👑', sizeScale: 1.45, tailSpeed: 0.022, finScale: 1.50 },
];

// ─── Push Distance Table ────────────────────────────────────────────────────────
// PUSH_TABLE[attackerLevel][victimLevel] = number of tiles pushed back
// Equal levels → no push (bump animation only)
export const PUSH_TABLE = {
  2: { 1: 3 },
  3: { 1: 5,  2: 3 },
  4: { 1: 10, 2: 5, 3: 3 },
};

// ─── Event Type Sets ────────────────────────────────────────────────────────────
// User-confirmed: Pearl, Chest, Dolphin, Starfish only grow fish
export const GROW_EVENTS   = new Set(['pearl', 'chest', 'dolphin', 'starfish']);
// Crab and Shark shrink the fish by one stage
export const SHRINK_EVENTS = new Set(['crab', 'shark']);

// ─── Animation Timings (ms) ─────────────────────────────────────────────────────
export const EXPRESSION_DURATION  = 2200;   // how long an expression lasts
export const GROWTH_ANIM_DURATION = 750;    // grow/shrink burst animation
export const WHACK_DURATION       = 1500;   // full tail-whack animation
export const SCALE_LERP_SPEED     = 0.005;  // per-ms lerp speed toward target scale

// Auto-dismiss duration for event popups (ms). Player can still click OK early.
export const EVENT_POPUP_TIMEOUT  = 3000;

