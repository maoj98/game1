import type { PlayerState, MonsterState, ItemState, Projectile } from '../types/game';

export class CollisionSystem {
  static checkAABB(
    a: { x: number; y: number; width: number; height: number },
    b: { x: number; y: number; width: number; height: number }
  ): boolean {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  static checkPlayerAttackHit(
    player: PlayerState,
    monster: MonsterState,
    attackRange: number
  ): boolean {
    const attackBox = {
      x: player.facing === 'right' ? player.x + player.width : player.x - attackRange,
      y: player.y,
      width: attackRange,
      height: player.height,
    };
    return this.checkAABB(attackBox, monster);
  }

  static checkPlayerMonsterCollision(
    player: PlayerState,
    monster: MonsterState
  ): boolean {
    return this.checkAABB(player, monster);
  }

  static checkPlayerItemCollision(
    player: PlayerState,
    item: ItemState
  ): boolean {
    return this.checkAABB(player, item);
  }

  static checkProjectileHit(
    projectile: Projectile,
    target: { x: number; y: number; width: number; height: number }
  ): boolean {
    const projectileBox = {
      x: projectile.x - 8,
      y: projectile.y - 8,
      width: 16,
      height: 16,
    };
    return this.checkAABB(projectileBox, target);
  }

  static checkSkillRangeHit(
    player: PlayerState,
    monster: MonsterState,
    range: number
  ): boolean {
    const playerCX = player.x + player.width / 2;
    const playerCY = player.y + player.height / 2;
    const monsterCX = monster.x + monster.width / 2;
    const monsterCY = monster.y + monster.height / 2;
    const dx = playerCX - monsterCX;
    const dy = playerCY - monsterCY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist <= range;
  }

  static checkPlatformCollision(
    entity: { x: number; y: number; width: number; height: number; velocityY: number },
    platform: { x: number; y: number; width: number; height: number },
    groundY: number
  ): { onGround: boolean; newY: number } {
    const entityBottom = entity.y + entity.height;
    const entityCenterX = entity.x + entity.width / 2;

    if (entity.velocityY >= 0) {
      if (
        entityBottom >= platform.y &&
        entityBottom <= platform.y + platform.height + 10 &&
        entityCenterX >= platform.x &&
        entityCenterX <= platform.x + platform.width
      ) {
        return { onGround: true, newY: platform.y - entity.height };
      }
    }

    if (entityBottom >= groundY) {
      return { onGround: true, newY: groundY - entity.height };
    }

    return { onGround: false, newY: entity.y };
  }
}
