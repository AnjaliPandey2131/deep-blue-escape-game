// Rules Engine - Obstacles and Rewards

export class GameRules {
  constructor(board) {
    this.board = board;
  }

  // Evaluate tile effects for a player landing on it
  evaluateTile(player, tileNum) {
    const special = this.board.specialTiles[tileNum];
    if (!special) return null;

    const result = {
      type: 'neutral',
      name: special.type,
      title: "",
      desc: "",
      newTile: tileNum,
      skipTurns: 0,
      extraTurn: false,
      gainShield: false,
      sound: 'bubble'
    };

    // If it's an obstacle and player has a shield, shield absorbs it!
    const isObstacle = [
      'shark', 'octopus', 'whirlpool', 'volcano', 'coral_trap',
      'crab', 'puffer', 'jellyfish', 'current', 'rocks'
    ].includes(special.type);

    if (isObstacle && player.bubbleShield) {
      player.bubbleShield = false;
      result.type = 'shield_block';
      result.title = "Bubble Shield Active!";
      result.desc = `Your bubble shield popped but protected you from the ${special.type.replace('_', ' ')}!`;
      result.sound = 'bubble';
      return result;
    }

    switch (special.type) {
      // OBSTACLES
      case 'shark':
        result.type = 'obstacle';
        result.title = "Shark Attack! 🦈";
        result.newTile = Math.max(1, special.target);
        result.desc = "A hungry shark chased you back!";
        result.sound = 'shark';
        break;

      case 'octopus':
        result.type = 'obstacle';
        result.title = "Giant Octopus! 🐙";
        result.newTile = Math.max(1, special.target);
        result.desc = "Wrapped in tentacles! Slipped backward.";
        result.sound = 'shark';
        break;

      case 'whirlpool':
        result.type = 'obstacle';
        result.title = "Whirlpool! 🌀";
        result.newTile = special.target;
        result.desc = "Sucked into a swirling current and spun away!";
        result.sound = 'whirlpool';
        break;

      case 'volcano':
        result.type = 'obstacle';
        result.title = "Underwater Volcano! 🌋";
        result.newTile = Math.max(1, special.target);
        result.desc = "An eruption blocked the path, pushing you back!";
        result.sound = 'shark';
        break;

      case 'coral_trap':
        result.type = 'obstacle';
        result.title = "Coral Trap! 🪸";
        result.skipTurns = 1;
        result.desc = "Stuck in the coral reef! Miss one turn.";
        result.sound = 'shock';
        break;

      case 'crab':
        result.type = 'obstacle';
        result.title = "Crab Pincher! 🦀";
        result.skipTurns = 1;
        result.desc = "A crab pinched your tail! Lose your next turn.";
        result.sound = 'shock';
        break;

      case 'jellyfish':
        result.type = 'obstacle';
        result.title = "Jellyfish Shock! 🪼";
        result.skipTurns = 1;
        result.desc = "Zapped! Electric shock skips your next move.";
        result.sound = 'shock';
        break;

      case 'puffer':
        result.type = 'obstacle';
        result.title = "Puffer Fish! 🐡";
        const pufferDrift = Math.random() > 0.5 ? 2 : -2;
        result.newTile = Math.max(1, Math.min(99, tileNum + pufferDrift));
        result.desc = `Frightened by the puffer fish! Scuttled ${pufferDrift > 0 ? 'forward' : 'backward'} 2 tiles.`;
        result.sound = 'bubble';
        break;

      case 'current':
        result.type = 'obstacle';
        result.title = "Ocean Current! 🌊";
        const currentOffset = Math.random() > 0.5 ? 4 : -4;
        result.newTile = Math.max(1, Math.min(99, tileNum + currentOffset));
        result.desc = `Swept by high waves! Drifted ${currentOffset > 0 ? 'forward' : 'backward'} 4 tiles.`;
        result.sound = 'whirlpool';
        break;

      case 'rocks':
        result.type = 'obstacle';
        result.title = "Falling Rocks! 🪨";
        result.newTile = Math.max(1, tileNum - 5);
        result.desc = "Landslide! Falling debris forced you back 5 tiles.";
        result.sound = 'shark';
        break;

      // REWARDS
      case 'dolphin':
        result.type = 'reward';
        result.title = "Dolphin Ride! 🐬";
        result.newTile = special.target;
        result.desc = "A friendly dolphin carried you forward swiftly!";
        result.sound = 'dolphin';
        break;

      case 'turtle':
        result.type = 'reward';
        result.title = "Turtle Ride! 🐢";
        result.newTile = special.target;
        result.desc = "Riding a giant sea turtle ahead to safety!";
        result.sound = 'dolphin';
        break;

      case 'pearl':
        result.type = 'reward';
        result.title = "Golden Pearl Power! ⚪";
        result.newTile = Math.min(100, tileNum + 3);
        result.desc = "Collected a shiny pearl! Bonus +3 moves.";
        result.sound = 'bubble';
        break;

      case 'starfish':
        result.type = 'reward';
        result.title = "Lucky Starfish! ⭐";
        result.extraTurn = true;
        result.desc = "A glowing starfish grants you one extra turn!";
        result.sound = 'dolphin';
        break;

      case 'shield':
        result.type = 'reward';
        result.title = "Bubble Shield! 🛡️";
        result.gainShield = true;
        result.desc = "Surrounded by a protective bubble! Blocks the next obstacle.";
        result.sound = 'bubble';
        break;

      case 'chest':
        result.type = 'reward';
        result.title = "Treasure Chest! 🧰";
        const roll = Math.random();
        if (roll < 0.33) {
          result.gainShield = true;
          result.desc = "Opened a chest and found a Bubble Shield!";
        } else if (roll < 0.66) {
          result.extraTurn = true;
          result.desc = "Opened a chest and found a Starfish for an Extra Turn!";
        } else {
          result.newTile = Math.min(100, tileNum + 5);
          result.desc = "Opened a chest containing a water jet! Boosted +5 tiles ahead.";
        }
        result.sound = 'dolphin';
        break;
    }

    return result;
  }
}
