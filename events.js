// Reusable, Object-Oriented Tile Events Architecture

export class BaseEvent {
  constructor(name, icon, description, sound = 'bubble') {
    this.name = name;
    this.icon = icon;
    this.description = description;
    this.sound = sound;
  }

  execute(player) {
    return {
      type: 'neutral',
      name: this.name,
      icon: this.icon,
      title: this.name,
      desc: this.description,
      newTile: player.tileNum,
      skipTurns: 0,
      extraTurn: false,
      gainShield: false,
      sound: this.sound
    };
  }
}

// OBSTACLE EVENTS
export class SharkEvent extends BaseEvent {
  constructor(target) {
    super("Shark Attack! 🦈", "⚠️", "A hungry shark chased you back!", "shark");
    this.target = target;
  }
  execute(player) {
    const res = super.execute(player);
    res.type = 'obstacle';
    res.newTile = this.target;
    return res;
  }
}

export class OctopusEvent extends BaseEvent {
  constructor(target) {
    super("Giant Octopus! 🐙", "⚠️", "Wrapped in tentacles! Slipped backward.", "shark");
    this.target = target;
  }
  execute(player) {
    const res = super.execute(player);
    res.type = 'obstacle';
    res.newTile = this.target;
    return res;
  }
}

export class WhirlpoolEvent extends BaseEvent {
  constructor(target) {
    super("Whirlpool! 🌀", "🌀", "Sucked into a swirling current and spun away!", "whirlpool");
    this.target = target;
  }
  execute(player) {
    const res = super.execute(player);
    res.type = 'obstacle';
    res.newTile = this.target;
    return res;
  }
}

export class VolcanoEvent extends BaseEvent {
  constructor(target) {
    super("Underwater Volcano! 🌋", "⚠️", "An eruption blocked the path, pushing you back!", "shark");
    this.target = target;
  }
  execute(player) {
    const res = super.execute(player);
    res.type = 'obstacle';
    res.newTile = this.target;
    return res;
  }
}

export class CoralTrapEvent extends BaseEvent {
  constructor() {
    super("Coral Trap! 🪸", "⚠️", "Stuck in the coral reef! Miss one turn.", "shock");
  }
  execute(player) {
    const res = super.execute(player);
    res.type = 'obstacle';
    res.skipTurns = 1;
    return res;
  }
}

export class CrabEvent extends BaseEvent {
  constructor() {
    super("Crab Pincher! 🦀", "⚠️", "A crab pinched your tail! Lose your next turn.", "shock");
  }
  execute(player) {
    const res = super.execute(player);
    res.type = 'obstacle';
    res.skipTurns = 1;
    return res;
  }
}

export class JellyfishEvent extends BaseEvent {
  constructor() {
    super("Jellyfish Shock! 🪼", "⚠️", "Zapped! Electric shock skips your next move.", "shock");
  }
  execute(player) {
    const res = super.execute(player);
    res.type = 'obstacle';
    res.skipTurns = 1;
    return res;
  }
}

export class PufferEvent extends BaseEvent {
  constructor() {
    super("Puffer Fish! 🐡", "🫧", "Frightened by the puffer fish! Scuttled randomly.", "bubble");
  }
  execute(player) {
    const res = super.execute(player);
    res.type = 'obstacle';
    const pufferDrift = Math.random() > 0.5 ? 2 : -2;
    res.newTile = Math.max(1, Math.min(99, player.tileNum + pufferDrift));
    res.desc = `Frightened by the puffer fish! Scuttled ${pufferDrift > 0 ? 'forward' : 'backward'} 2 tiles.`;
    return res;
  }
}

export class CurrentEvent extends BaseEvent {
  constructor() {
    super("Ocean Current! 🌊", "⚠️", "Swept by high waves! Drifted randomly.", "whirlpool");
  }
  execute(player) {
    const res = super.execute(player);
    res.type = 'obstacle';
    const currentOffset = Math.random() > 0.5 ? 4 : -4;
    res.newTile = Math.max(1, Math.min(99, player.tileNum + currentOffset));
    res.desc = `Swept by high waves! Drifted ${currentOffset > 0 ? 'forward' : 'backward'} 4 tiles.`;
    return res;
  }
}

export class RocksEvent extends BaseEvent {
  constructor() {
    super("Falling Rocks! 🪨", "⚠️", "Landslide! Falling debris forced you back 5 tiles.", "shark");
  }
  execute(player) {
    const res = super.execute(player);
    res.type = 'obstacle';
    res.newTile = Math.max(1, player.tileNum - 5);
    return res;
  }
}

// REWARD EVENTS
export class DolphinEvent extends BaseEvent {
  constructor(target) {
    super("Dolphin Ride! 🐬", "🎁", "A friendly dolphin carried you forward swiftly!", "dolphin");
    this.target = target;
  }
  execute(player) {
    const res = super.execute(player);
    res.type = 'reward';
    res.newTile = this.target;
    return res;
  }
}

export class TurtleEvent extends BaseEvent {
  constructor(target) {
    super("Turtle Ride! 🐢", "🎁", "Riding a giant sea turtle ahead to safety!", "dolphin");
    this.target = target;
  }
  execute(player) {
    const res = super.execute(player);
    res.type = 'reward';
    res.newTile = this.target;
    return res;
  }
}

export class PearlEvent extends BaseEvent {
  constructor() {
    super("Golden Pearl Power! ⚪", "🎁", "Collected a shiny pearl! Bonus +3 moves.", "bubble");
  }
  execute(player) {
    const res = super.execute(player);
    res.type = 'reward';
    res.newTile = Math.min(100, player.tileNum + 3);
    return res;
  }
}

export class StarfishEvent extends BaseEvent {
  constructor() {
    super("Lucky Starfish! ⭐", "🎁", "A glowing starfish grants you one extra turn!", "dolphin");
  }
  execute(player) {
    const res = super.execute(player);
    res.type = 'reward';
    res.extraTurn = true;
    return res;
  }
}

export class ShieldEvent extends BaseEvent {
  constructor() {
    super("Bubble Shield! 🛡️", "🎁", "Surrounded by a protective bubble! Blocks the next obstacle.", "bubble");
  }
  execute(player) {
    const res = super.execute(player);
    res.type = 'reward';
    res.gainShield = true;
    return res;
  }
}

export class ChestEvent extends BaseEvent {
  constructor() {
    super("Treasure Chest! 🧰", "🎁", "Opened a chest containing a random reward!", "dolphin");
  }
  execute(player) {
    const res = super.execute(player);
    res.type = 'reward';
    const roll = Math.random();
    if (roll < 0.33) {
      res.gainShield = true;
      res.desc = "Opened a chest and found a Bubble Shield!";
    } else if (roll < 0.66) {
      res.extraTurn = true;
      res.desc = "Opened a chest and found a Starfish for an Extra Turn!";
    } else {
      res.newTile = Math.min(100, player.tileNum + 5);
      res.desc = "Opened a chest containing a water jet! Boosted +5 tiles ahead.";
    }
    return res;
  }
}

// Event Manager Coordinator
export class EventManager {
  constructor(board) {
    this.board = board;
    this.eventsRegistry = {};
    this.initRegistry();
  }

  initRegistry() {
    // Map board special tile definitions to OO Event classes
    for (const key in this.board.specialTiles) {
      const tileNum = parseInt(key);
      const spec = this.board.specialTiles[key];
      
      let ev = null;
      switch (spec.type) {
        case 'whirlpool': ev = new WhirlpoolEvent(spec.target); break;
        case 'shark': ev = new SharkEvent(spec.target); break;
        case 'octopus': ev = new OctopusEvent(spec.target); break;
        case 'volcano': ev = new VolcanoEvent(spec.target); break;
        case 'coral_trap': ev = new CoralTrapEvent(); break;
        case 'crab': ev = new CrabEvent(); break;
        case 'jellyfish': ev = new JellyfishEvent(); break;
        case 'puffer': ev = new PufferEvent(); break;
        case 'current': ev = new CurrentEvent(); break;
        case 'rocks': ev = new RocksEvent(); break;
        case 'dolphin': ev = new DolphinEvent(spec.target); break;
        case 'turtle': ev = new TurtleEvent(spec.target); break;
        case 'pearl': ev = new PearlEvent(); break;
        case 'starfish': ev = new StarfishEvent(); break;
        case 'shield': ev = new ShieldEvent(); break;
        case 'chest': ev = new ChestEvent(); break;
      }

      if (ev) {
        this.eventsRegistry[tileNum] = ev;
      }
    }
  }

  evaluateTile(player, tileNum) {
    const ev = this.eventsRegistry[tileNum];
    if (!ev) return null;

    // Check Bubble Shield absorption
    if (ev.execute(player).type === 'obstacle' && player.bubbleShield) {
      player.bubbleShield = false;
      return {
        type: 'shield_block',
        title: "Bubble Shield Active!",
        desc: `Your bubble shield popped but protected you from the ${ev.name}!`,
        newTile: tileNum,
        skipTurns: 0,
        extraTurn: false,
        gainShield: false,
        sound: 'bubble'
      };
    }

    return ev.execute(player);
  }
}
