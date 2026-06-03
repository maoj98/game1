import type { MonsterState, PlayerState, MonsterConfig } from '../types/game';

const GRAVITY = 0.8;

export class AISystem {
  static updateMonster(
    monster: MonsterState,
    config: MonsterConfig,
    players: PlayerState[],
    groundY: number,
    deltaTime: number
  ): { shouldAttack: boolean; shouldShoot: boolean; targetPlayer: PlayerState | null } {
    let nearestPlayer: PlayerState | null = null;
    let nearestDistance = Infinity;

    for (const player of players) {
      const distance = Math.abs(player.x - monster.x);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestPlayer = player;
      }
    }

    if (!nearestPlayer) {
      this.patrol(monster, config, deltaTime);
      return { shouldAttack: false, shouldShoot: false, targetPlayer: null };
    }

    monster.facing = nearestPlayer.x < monster.x ? 'left' : 'right';

    if (nearestDistance <= config.attackRange) {
      monster.aiState = 'attack';
      if (monster.attackCooldown <= 0) {
        monster.attackCooldown = config.attackCooldown;
        if (config.type === 'ranged') {
          return { shouldAttack: false, shouldShoot: true, targetPlayer: nearestPlayer };
        }
        return { shouldAttack: true, shouldShoot: false, targetPlayer: nearestPlayer };
      }
    } else if (nearestDistance <= config.chaseRange) {
      monster.aiState = 'chase';
      this.chase(monster, config, nearestPlayer, deltaTime);
    } else {
      monster.aiState = 'patrol';
      this.patrol(monster, config, deltaTime);
    }

    this.applyGravity(monster, groundY);

    if (monster.attackCooldown > 0) {
      monster.attackCooldown -= deltaTime;
    }

    return { shouldAttack: false, shouldShoot: false, targetPlayer: null };
  }

  private static patrol(monster: MonsterState, config: MonsterConfig, deltaTime: number) {
    const speed = config.speed * (deltaTime / 16.67);
    
    if (monster.x <= monster.patrolStartX - config.patrolRange) {
      monster.facing = 'right';
    } else if (monster.x >= monster.patrolStartX + config.patrolRange) {
      monster.facing = 'left';
    }

    monster.x += monster.facing === 'right' ? speed : -speed;
  }

  private static chase(
    monster: MonsterState,
    config: MonsterConfig,
    target: PlayerState,
    deltaTime: number
  ) {
    const speed = config.speed * 1.5 * (deltaTime / 16.67);
    monster.x += monster.facing === 'right' ? speed : -speed;
  }

  private static applyGravity(monster: MonsterState, groundY: number) {
    const bottomY = groundY - monster.height;
    if (monster.y < bottomY) {
      monster.y += GRAVITY * 3;
      if (monster.y > bottomY) {
        monster.y = bottomY;
      }
    }
  }

  static getDistance(
    a: { x: number; y: number },
    b: { x: number; y: number }
  ): number {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
  }
}
