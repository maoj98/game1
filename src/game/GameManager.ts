import * as PIXI from 'pixi.js';
import type { Character, MapConfig, MonsterConfig, Difficulty, KeyState, PlayerState, MonsterState, ItemState, Projectile } from '../types/game';
import { CollisionSystem } from './Collision';
import { AISystem } from './AI';

const GRAVITY = 0.8;
const PLAYER_WIDTH = 40;
const PLAYER_HEIGHT = 56;
const ATTACK_COOLDOWN = 400;
const ATTACK_RANGE = 60;
const BASE_MOVE_SPEED = 5;

interface SlashEffect {
  id: string;
  x: number;
  y: number;
  facing: 'left' | 'right';
  age: number;
  maxAge: number;
  color: number;
}

interface SkillEffect {
  id: string;
  x: number;
  y: number;
  type: 'melee_aoe' | 'projectile_burst' | 'dash_shadow' | 'arrow_rain';
  age: number;
  maxAge: number;
  color: number;
  facing: 'left' | 'right';
  radius: number;
}

interface DamageNumber {
  id: string;
  x: number;
  y: number;
  value: number;
  age: number;
  maxAge: number;
  color: number;
}

export class GameManager {
  private app: PIXI.Application;
  private container: HTMLElement;
  private mapConfig: MapConfig;
  private characterConfigs: Record<string, Character>;
  private monsterConfigs: Record<string, MonsterConfig>;
  private difficulty: Difficulty;
  private cameraX = 0;
  private gameWidth = 1280;
  private gameHeight = 720;

  private players: PlayerState[] = [];
  private monsters: MonsterState[] = [];
  private items: ItemState[] = [];
  private projectiles: Projectile[] = [];
  private bossDefeated = false;

  private playerSprites: Map<number, PIXI.Container> = new Map();
  private monsterSprites: Map<string, PIXI.Container> = new Map();
  private itemSprites: Map<string, PIXI.Graphics> = new Map();
  private projectileSprites: Map<string, PIXI.Graphics> = new Map();
  private platformSprites: PIXI.Graphics[] = [];
  private backgroundLayers: PIXI.Graphics[] = [];
  private groundSprite: PIXI.Graphics | null = null;
  private groundTopSprite: PIXI.Graphics | null = null;

  private slashEffects: SlashEffect[] = [];
  private skillEffects: SkillEffect[] = [];
  private damageNumbers: DamageNumber[] = [];
  private effectLayer: PIXI.Container = new PIXI.Container();
  private uiLayer: PIXI.Container = new PIXI.Container();

  private keyStates: Map<number, KeyState> = new Map();
  private lastUpdateTime = 0;
  private lastMonsterUpdateTime = 0;
  private running = false;
  private monsterAiRafId: number | null = null;
  private boundKeyDown: ((e: KeyboardEvent) => void) | null = null;
  private boundKeyUp: ((e: KeyboardEvent) => void) | null = null;

  private onScoreUpdate: ((score: number) => void) | null = null;
  private onPlayerUpdate: ((players: PlayerState[]) => void) | null = null;
  private onGameEnd: ((victory: boolean) => void) | null = null;
  private score = 0;

  constructor(
    container: HTMLElement,
    mapConfig: MapConfig,
    characterConfigs: Record<string, Character>,
    monsterConfigs: Record<string, MonsterConfig>,
    difficulty: Difficulty
  ) {
    this.container = container;
    this.mapConfig = mapConfig;
    this.characterConfigs = characterConfigs;
    this.monsterConfigs = monsterConfigs;
    this.difficulty = difficulty;

    this.app = new PIXI.Application({
      width: this.gameWidth,
      height: this.gameHeight,
      backgroundColor: 0x1a1a2e,
      antialias: false,
      resolution: 1,
    });

    PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
  }

  async init(): Promise<void> {
    this.container.appendChild(this.app.view as unknown as HTMLElement);
    this.app.stage.addChild(this.effectLayer);
    this.app.stage.addChild(this.uiLayer);
    this.setupKeyboardInput();
  }

  setCallbacks(
    onScoreUpdate: (score: number) => void,
    onPlayerUpdate: (players: PlayerState[]) => void,
    onGameEnd: (victory: boolean) => void
  ) {
    this.onScoreUpdate = onScoreUpdate;
    this.onPlayerUpdate = onPlayerUpdate;
    this.onGameEnd = onGameEnd;
  }

  addPlayer(playerId: number, characterId: string, spawnX: number, spawnY: number) {
    const charConfig = this.characterConfigs[characterId];
    if (!charConfig) return;

    const difficultyMultiplier = this.difficulty === 'hard' ? 0.8 : 1;

    const player: PlayerState = {
      id: playerId,
      characterId,
      x: 100 + (playerId - 1) * 60,
      y: this.mapConfig.groundY - PLAYER_HEIGHT,
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT,
      hp: Math.floor(charConfig.stats.hp * difficultyMultiplier),
      mp: charConfig.stats.mp,
      facing: 'right',
      isJumping: false,
      isAttacking: false,
      attackCooldown: 0,
      skillCooldown: 0,
      invincible: 3000,
      buffs: [],
      velocityX: 0,
      velocityY: 0,
    };

    this.players.push(player);
    this.keyStates.set(playerId, {
      left: false,
      right: false,
      up: false,
      down: false,
      attack: false,
      jump: false,
      skill: false,
      jumpLocked: false,
      skillLocked: false,
    });

    this.createPlayerSprite(player, charConfig);
  }

  private createPlayerSprite(player: PlayerState, charConfig: Character) {
    const container = new PIXI.Container();

    const body = new PIXI.Graphics();
    body.beginFill(charConfig.color);
    body.drawRect(0, 0, player.width, player.height);
    body.endFill();
    container.addChild(body);

    const head = new PIXI.Graphics();
    head.beginFill(charConfig.color);
    head.drawRoundedRect(2, -14, player.width - 4, 18, 4);
    head.endFill();
    container.addChild(head);

    const eye = new PIXI.Graphics();
    eye.beginFill(0xffffff);
    eye.drawRect(player.width * 0.6, -6, 8, 6);
    eye.endFill();
    eye.beginFill(0x000000);
    eye.drawRect(player.width * 0.6 + 3, -4, 4, 4);
    eye.endFill();
    container.addChild(eye);

    const arm = new PIXI.Graphics();
    arm.name = 'arm';
    arm.beginFill(charConfig.color);
    arm.drawRect(player.width, 8, 12, 8);
    arm.endFill();
    container.addChild(arm);

    container.x = player.x;
    container.y = player.y;

    this.app.stage.addChild(container);
    this.playerSprites.set(player.id, container);
  }

  spawnMonsters() {
    const difficultyMultiplier = this.difficulty === 'hard' ? 1.5 : 1;

    this.mapConfig.monsterSpawns.forEach((spawn, index) => {
      const config = this.monsterConfigs[spawn.monsterId];
      if (!config) return;

      const monster: MonsterState = {
        id: `monster_${index}_${Date.now()}`,
        configId: spawn.monsterId,
        type: config.type,
        x: spawn.x,
        y: this.mapConfig.groundY - config.height,
        width: config.width,
        height: config.height,
        hp: Math.floor(config.hp * difficultyMultiplier),
        maxHp: Math.floor(config.hp * difficultyMultiplier),
        facing: 'left',
        aiState: 'patrol',
        patrolStartX: spawn.x,
        attackCooldown: 0,
        hitFlash: 0,
      };

      this.monsters.push(monster);
      this.createMonsterSprite(monster, config);
    });
  }

  spawnBoss() {
    const bossId = this.mapConfig.id === 'level1' ? 'boss1' : 'boss2';
    const config = this.monsterConfigs[bossId];
    if (!config) return;

    const difficultyMultiplier = this.difficulty === 'hard' ? 2 : 1;

    const monster: MonsterState = {
      id: `boss_${Date.now()}`,
      configId: bossId,
      type: 'boss',
      x: this.mapConfig.bossSpawnPoint.x,
      y: this.mapConfig.groundY - config.height,
      width: config.width,
      height: config.height,
      hp: Math.floor(config.hp * difficultyMultiplier),
      maxHp: Math.floor(config.hp * difficultyMultiplier),
      facing: 'left',
      aiState: 'patrol',
      patrolStartX: this.mapConfig.bossSpawnPoint.x,
      attackCooldown: 0,
      hitFlash: 0,
    };

    this.monsters.push(monster);
    this.createMonsterSprite(monster, config);
  }

  private createMonsterSprite(monster: MonsterState, config: MonsterConfig) {
    const container = new PIXI.Container();

    const body = new PIXI.Graphics();
    body.beginFill(config.color);
    if (config.type === 'boss') {
      body.drawRoundedRect(0, 0, monster.width, monster.height, 8);
    } else {
      body.drawRect(0, 0, monster.width, monster.height);
    }
    body.endFill();
    container.addChild(body);

    const eyes = new PIXI.Graphics();
    eyes.beginFill(0xff0000);
    if (config.type === 'ranged') {
      eyes.drawCircle(monster.width * 0.3, 12, 4);
      eyes.drawCircle(monster.width * 0.7, 12, 4);
    } else {
      eyes.drawRect(monster.width * 0.2, 8, 6, 6);
      eyes.drawRect(monster.width * 0.6, 8, 6, 6);
    }
    eyes.endFill();
    container.addChild(eyes);

    if (monster.type === 'boss') {
      const crown = new PIXI.Graphics();
      crown.beginFill(0xffd700);
      crown.moveTo(monster.width * 0.2, 0);
      crown.lineTo(monster.width * 0.3, -18);
      crown.lineTo(monster.width * 0.4, -5);
      crown.lineTo(monster.width * 0.5, -22);
      crown.lineTo(monster.width * 0.6, -5);
      crown.lineTo(monster.width * 0.7, -18);
      crown.lineTo(monster.width * 0.8, 0);
      crown.endFill();
      container.addChild(crown);
    }

    const hpBarBg = new PIXI.Graphics();
    hpBarBg.beginFill(0x333333);
    hpBarBg.drawRect(0, -12, monster.width, 6);
    hpBarBg.endFill();
    hpBarBg.name = 'hpBarBg';
    container.addChild(hpBarBg);

    const hpBar = new PIXI.Graphics();
    hpBar.beginFill(0xff6b6b);
    hpBar.drawRect(0, -12, monster.width, 6);
    hpBar.endFill();
    hpBar.name = 'hpBar';
    container.addChild(hpBar);

    this.app.stage.addChild(container);
    this.monsterSprites.set(monster.id, container);
  }

  createMap() {
    this.mapConfig.backgroundLayers.forEach((layer, index) => {
      const graphics = new PIXI.Graphics();
      graphics.beginFill(layer.color);
      graphics.drawRect(0, 0, this.gameWidth, this.gameHeight);
      graphics.endFill();
      this.backgroundLayers.push(graphics);
      this.app.stage.addChild(graphics);
    });

    const ground = new PIXI.Graphics();
    ground.beginFill(0x4a3728);
    ground.drawRect(0, 0, this.mapConfig.width, this.gameHeight - this.mapConfig.groundY);
    ground.endFill();
    ground.y = this.mapConfig.groundY;
    this.groundSprite = ground;
    this.app.stage.addChild(ground);

    const groundTop = new PIXI.Graphics();
    groundTop.beginFill(0x6b8e23);
    groundTop.drawRect(0, 0, this.mapConfig.width, 8);
    groundTop.endFill();
    groundTop.y = this.mapConfig.groundY - 8;
    this.groundTopSprite = groundTop;
    this.app.stage.addChild(groundTop);

    this.mapConfig.platforms.forEach((platform) => {
      const platformGraphics = new PIXI.Graphics();
      platformGraphics.beginFill(0x8b4513);
      platformGraphics.drawRect(0, 0, platform.width, platform.height);
      platformGraphics.endFill();
      platformGraphics.beginFill(0x6b8e23);
      platformGraphics.drawRect(0, -4, platform.width, 4);
      platformGraphics.endFill();
      platformGraphics.x = platform.x;
      platformGraphics.y = platform.y;
      this.platformSprites.push(platformGraphics);
      this.app.stage.addChild(platformGraphics);
    });
  }

  private setupKeyboardInput() {
    this.boundKeyDown = this.handleKeyDown.bind(this);
    this.boundKeyUp = this.handleKeyUp.bind(this);
    window.addEventListener('keydown', this.boundKeyDown);
    window.addEventListener('keyup', this.boundKeyUp);
  }

  private handleKeyDown(e: KeyboardEvent) {
    if (this.players.length >= 1) {
      const p1Keys = this.keyStates.get(1);
      const p1 = this.players[0];
      const p1Config = p1 ? this.characterConfigs[p1.characterId] : null;
      if (p1Keys) {
        if (e.key === 'a' || e.key === 'A') p1Keys.left = true;
        if (e.key === 'd' || e.key === 'D') p1Keys.right = true;
        if (e.key === 'w' || e.key === 'W') p1Keys.up = true;
        if (e.key === 's' || e.key === 'S') p1Keys.down = true;
        if (e.key === 'j' || e.key === 'J') p1Keys.attack = true;
        if (e.key === 'k' || e.key === 'K') {
          if (!p1Keys.jumpLocked && p1 && !p1.isJumping) {
            p1Keys.jump = true;
            p1Keys.jumpLocked = true;
          }
        }
        if (e.key === 'l' || e.key === 'L') {
          if (!p1Keys.skillLocked && p1 && p1Config) {
            if (p1.skillCooldown <= 0 && p1.mp >= p1Config.skill.mpCost) {
              p1Keys.skill = true;
              p1Keys.skillLocked = true;
            }
          }
        }
      }
    }
    if (this.players.length >= 2) {
      const p2Keys = this.keyStates.get(2);
      const p2 = this.players[1];
      const p2Config = p2 ? this.characterConfigs[p2.characterId] : null;
      if (p2Keys) {
        if (e.key === 'ArrowLeft') p2Keys.left = true;
        if (e.key === 'ArrowRight') p2Keys.right = true;
        if (e.key === 'ArrowUp') p2Keys.up = true;
        if (e.key === 'ArrowDown') p2Keys.down = true;
        if (e.key === '1') p2Keys.attack = true;
        if (e.key === '2') {
          if (!p2Keys.jumpLocked && p2 && !p2.isJumping) {
            p2Keys.jump = true;
            p2Keys.jumpLocked = true;
          }
        }
        if (e.key === '3') {
          if (!p2Keys.skillLocked && p2 && p2Config) {
            if (p2.skillCooldown <= 0 && p2.mp >= p2Config.skill.mpCost) {
              p2Keys.skill = true;
              p2Keys.skillLocked = true;
            }
          }
        }
      }
    }
  }

  private handleKeyUp(e: KeyboardEvent) {
    if (this.players.length >= 1) {
      const p1Keys = this.keyStates.get(1);
      if (p1Keys) {
        if (e.key === 'a' || e.key === 'A') p1Keys.left = false;
        if (e.key === 'd' || e.key === 'D') p1Keys.right = false;
        if (e.key === 'w' || e.key === 'W') p1Keys.up = false;
        if (e.key === 's' || e.key === 'S') p1Keys.down = false;
        if (e.key === 'j' || e.key === 'J') p1Keys.attack = false;
        if (e.key === 'k' || e.key === 'K') {
          p1Keys.jump = false;
          p1Keys.jumpLocked = false;
        }
        if (e.key === 'l' || e.key === 'L') {
          p1Keys.skill = false;
          p1Keys.skillLocked = false;
        }
      }
    }
    if (this.players.length >= 2) {
      const p2Keys = this.keyStates.get(2);
      if (p2Keys) {
        if (e.key === 'ArrowLeft') p2Keys.left = false;
        if (e.key === 'ArrowRight') p2Keys.right = false;
        if (e.key === 'ArrowUp') p2Keys.up = false;
        if (e.key === 'ArrowDown') p2Keys.down = false;
        if (e.key === '1') p2Keys.attack = false;
        if (e.key === '2') {
          p2Keys.jump = false;
          p2Keys.jumpLocked = false;
        }
        if (e.key === '3') {
          p2Keys.skill = false;
          p2Keys.skillLocked = false;
        }
      }
    }
  }

  start() {
    this.running = true;
    this.lastUpdateTime = performance.now();
    this.lastMonsterUpdateTime = performance.now();
    this.render();
    this.app.ticker.add(this.gameLoop);
    this.startMonsterAiLoop();
  }

  stop() {
    this.running = false;
    this.app.ticker.remove(this.gameLoop);
    this.stopMonsterAiLoop();
  }

  private gameLoop = () => {
    if (!this.running) return;
    const now = performance.now();
    const deltaTime = now - this.lastUpdateTime;
    this.lastUpdateTime = now;
    this.update(deltaTime);
    this.render();
  };

  private update(deltaTime: number) {
    this.updatePlayers(deltaTime);
    this.updateProjectiles(deltaTime);
    this.updateItems(deltaTime);
    this.updateEffects(deltaTime);
    this.checkBossSpawn();
    this.checkGameEnd();
    this.updateCamera();
    if (this.onPlayerUpdate) {
      this.onPlayerUpdate([...this.players]);
    }
  }

  private startMonsterAiLoop() {
    const loop = () => {
      if (!this.running) return;
      const now = performance.now();
      const dt = now - this.lastMonsterUpdateTime;
      this.lastMonsterUpdateTime = now;
      this.updateMonsters(dt);
      this.monsterAiRafId = requestAnimationFrame(loop);
    };
    this.monsterAiRafId = requestAnimationFrame(loop);
  }

  private stopMonsterAiLoop() {
    if (this.monsterAiRafId !== null) {
      cancelAnimationFrame(this.monsterAiRafId);
      this.monsterAiRafId = null;
    }
  }

  private updatePlayers(deltaTime: number) {
    this.players.forEach((player) => {
      if (player.hp <= 0) return;
      const keys = this.keyStates.get(player.id);
      if (!keys) return;
      this.updatePlayerMovement(player, keys, deltaTime);
      this.updatePlayerActions(player, keys, deltaTime);
      this.updatePlayerTimers(player, deltaTime);
    });
  }

  private updatePlayerMovement(player: PlayerState, keys: KeyState, deltaTime: number) {
    const charConfig = this.characterConfigs[player.characterId];
    if (!charConfig) return;

    const speed = BASE_MOVE_SPEED * (deltaTime / 16.67);

    if (keys.left) {
      player.velocityX = -speed;
      player.facing = 'left';
    } else if (keys.right) {
      player.velocityX = speed;
      player.facing = 'right';
    } else {
      player.velocityX = 0;
    }

    if (keys.jump && !player.isJumping) {
      player.velocityY = -charConfig.stats.jumpForce;
      player.isJumping = true;
      keys.jump = false;
    }

    player.velocityY += GRAVITY;
    player.x += player.velocityX;
    player.y += player.velocityY;
    player.x = Math.max(0, Math.min(this.mapConfig.width - player.width, player.x));

    let onGround = false;
    for (const platform of this.mapConfig.platforms) {
      const collision = CollisionSystem.checkPlatformCollision(player, platform, this.mapConfig.groundY);
      if (collision.onGround) {
        player.y = collision.newY;
        player.velocityY = 0;
        player.isJumping = false;
        onGround = true;
        break;
      }
    }
    if (!onGround && player.y + player.height >= this.mapConfig.groundY) {
      player.y = this.mapConfig.groundY - player.height;
      player.velocityY = 0;
      player.isJumping = false;
    }
  }

  private updatePlayerActions(player: PlayerState, keys: KeyState, deltaTime: number) {
    const charConfig = this.characterConfigs[player.characterId];
    if (!charConfig) return;

    if (player.attackCooldown > 0) player.attackCooldown -= deltaTime;

    if (keys.attack && player.attackCooldown <= 0) {
      player.attackCooldown = ATTACK_COOLDOWN;
      player.isAttacking = true;
      this.spawnSlashEffect(player, charConfig);
      this.playerAttack(player, charConfig);
      setTimeout(() => { player.isAttacking = false; }, 200);
    }

    if (player.skillCooldown > 0) player.skillCooldown -= deltaTime;

    if (keys.skill && player.skillCooldown <= 0 && player.mp >= charConfig.skill.mpCost) {
      player.skillCooldown = charConfig.skill.cooldown;
      player.mp -= charConfig.skill.mpCost;
      keys.skill = false;
      this.spawnSkillEffect(player, charConfig);
      this.playerUseSkill(player, charConfig);
    }
  }

  private updatePlayerTimers(player: PlayerState, deltaTime: number) {
    if (player.invincible > 0) player.invincible -= deltaTime;
    player.buffs = player.buffs.filter((buff) => {
      buff.duration -= deltaTime;
      return buff.duration > 0;
    });
  }

  private updateMonsters(deltaTime: number) {
    const alivePlayers = this.players.filter((p) => p.hp > 0);

    this.monsters.forEach((monster) => {
      const config = this.monsterConfigs[monster.configId];
      if (!config) return;

      const result = AISystem.updateMonster(monster, config, alivePlayers, this.mapConfig.groundY, deltaTime);

      if (result.shouldShoot && result.targetPlayer) {
        this.createMonsterProjectile(monster, config, result.targetPlayer);
      }
      if (result.shouldAttack && result.targetPlayer) {
        this.monsterAttackPlayer(monster, config, result.targetPlayer);
      }
      if (monster.hitFlash > 0) monster.hitFlash -= deltaTime;
    });
  }

  private updateProjectiles(deltaTime: number) {
    this.projectiles = this.projectiles.filter((proj) => {
      proj.x += proj.velocityX;
      proj.y += proj.velocityY;
      proj.lifetime -= deltaTime;
      if (proj.lifetime <= 0) return false;

      if (proj.isPlayerProjectile) {
        for (const monster of this.monsters) {
          if (CollisionSystem.checkProjectileHit(proj, monster)) {
            this.damageMonster(monster, proj.damage);
            return false;
          }
        }
      } else {
        for (const player of this.players) {
          if (player.hp > 0 && CollisionSystem.checkProjectileHit(proj, player)) {
            this.damagePlayer(player, proj.damage);
            return false;
          }
        }
      }
      return true;
    });
  }

  private updateItems(deltaTime: number) {
    this.items = this.items.filter((item) => {
      if (item.collected) return false;
      for (const player of this.players) {
        if (player.hp > 0 && CollisionSystem.checkPlayerItemCollision(player, item)) {
          this.collectItem(player, item);
          return false;
        }
      }
      return true;
    });
  }

  private updateEffects(deltaTime: number) {
    this.slashEffects = this.slashEffects.filter((e) => {
      e.age += deltaTime;
      return e.age < e.maxAge;
    });

    this.skillEffects = this.skillEffects.filter((e) => {
      e.age += deltaTime;
      return e.age < e.maxAge;
    });

    this.damageNumbers = this.damageNumbers.filter((d) => {
      d.age += deltaTime;
      d.y -= 1.2 * (deltaTime / 16.67);
      return d.age < d.maxAge;
    });
  }

  private spawnSlashEffect(player: PlayerState, charConfig: Character) {
    const effect: SlashEffect = {
      id: `slash_${Date.now()}_${Math.random()}`,
      x: player.x + (player.facing === 'right' ? player.width : -ATTACK_RANGE * 0.6),
      y: player.y + player.height * 0.2,
      facing: player.facing,
      age: 0,
      maxAge: 250,
      color: 0xffffff,
    };
    this.slashEffects.push(effect);
  }

  private spawnSkillEffect(player: PlayerState, charConfig: Character) {
    let type: SkillEffect['type'];
    let radius: number;

    switch (charConfig.id) {
      case 'warrior':
        type = 'melee_aoe';
        radius = charConfig.skill.range;
        break;
      case 'mage':
        type = 'projectile_burst';
        radius = charConfig.skill.range;
        break;
      case 'archer':
        type = 'arrow_rain';
        radius = charConfig.skill.range;
        break;
      case 'ninja':
        type = 'dash_shadow';
        radius = charConfig.skill.range;
        break;
      default:
        type = 'melee_aoe';
        radius = 80;
    }

    const effect: SkillEffect = {
      id: `skill_${Date.now()}_${Math.random()}`,
      x: player.x + player.width / 2,
      y: player.y + player.height / 2,
      type,
      age: 0,
      maxAge: 500,
      color: charConfig.color,
      facing: player.facing,
      radius,
    };
    this.skillEffects.push(effect);
  }

  private spawnDamageNumber(x: number, y: number, damage: number, color: number) {
    const dmg: DamageNumber = {
      id: `dmg_${Date.now()}_${Math.random()}`,
      x: x + Math.random() * 20 - 10,
      y: y - 10,
      value: damage,
      age: 0,
      maxAge: 800,
      color,
    };
    this.damageNumbers.push(dmg);
  }

  private playerAttack(player: PlayerState, charConfig: Character) {
    let damage = charConfig.stats.attack;
    const hasCritBuff = player.buffs.some((b) => b.type === 'crit');
    if (hasCritBuff) damage *= 2;

    for (const monster of this.monsters) {
      if (CollisionSystem.checkPlayerAttackHit(player, monster, ATTACK_RANGE)) {
        this.damageMonster(monster, damage);
      }
    }
  }

  private playerUseSkill(player: PlayerState, charConfig: Character) {
    let damage = charConfig.skill.damage;
    const hasCritBuff = player.buffs.some((b) => b.type === 'crit');
    if (hasCritBuff) damage *= 2;

    if (charConfig.id === 'mage' || charConfig.id === 'archer') {
      const projectile: Projectile = {
        id: `proj_${Date.now()}_${Math.random()}`,
        x: player.x + player.width / 2,
        y: player.y + player.height / 2,
        velocityX: player.facing === 'right' ? 12 : -12,
        velocityY: 0,
        damage,
        isPlayerProjectile: true,
        lifetime: 2000,
      };
      this.projectiles.push(projectile);
      this.createProjectileSprite(projectile, charConfig.color);
    }

    for (const monster of this.monsters) {
      if (CollisionSystem.checkSkillRangeHit(player, monster, charConfig.skill.range)) {
        this.damageMonster(monster, damage);
      }
    }
  }

  private damageMonster(monster: MonsterState, damage: number) {
    monster.hp -= damage;
    monster.hitFlash = 150;
    this.spawnDamageNumber(monster.x + monster.width / 2, monster.y, damage, 0xff4444);

    const sprite = this.monsterSprites.get(monster.id);
    if (sprite) {
      sprite.alpha = 0.5;
      setTimeout(() => {
        if (this.monsterSprites.has(monster.id)) sprite.alpha = 1;
      }, 150);
    }

    if (monster.hp <= 0) {
      this.killMonster(monster);
    }
  }

  private killMonster(monster: MonsterState) {
    const config = this.monsterConfigs[monster.configId];
    if (config) {
      const points = config.type === 'boss' ? 1000 : config.type === 'ranged' ? 150 : 100;
      this.score += points;
      if (this.onScoreUpdate) this.onScoreUpdate(this.score);
      if (Math.random() < config.dropRate) this.spawnItem(monster.x, monster.y);
    }

    if (monster.type === 'boss') this.bossDefeated = true;

    const sprite = this.monsterSprites.get(monster.id);
    if (sprite) {
      this.app.stage.removeChild(sprite);
      this.monsterSprites.delete(monster.id);
    }

    const index = this.monsters.findIndex((m) => m.id === monster.id);
    if (index !== -1) this.monsters.splice(index, 1);
  }

  private spawnItem(x: number, y: number) {
    const type: 'health' | 'crit' = Math.random() > 0.5 ? 'health' : 'crit';
    const item: ItemState = {
      id: `item_${Date.now()}_${Math.random()}`,
      type, x, y: y - 20, width: 24, height: 24, collected: false,
    };
    this.items.push(item);
    this.createItemSprite(item);
  }

  private createItemSprite(item: ItemState) {
    const sprite = new PIXI.Graphics();
    if (item.type === 'health') {
      sprite.beginFill(0xff6b6b);
      sprite.drawRect(0, 0, 10, 24);
      sprite.drawRect(0, 7, 24, 10);
      sprite.endFill();
    } else {
      sprite.beginFill(0xffd700);
      sprite.moveTo(12, 0);
      sprite.lineTo(16, 8);
      sprite.lineTo(24, 10);
      sprite.lineTo(18, 16);
      sprite.lineTo(20, 24);
      sprite.lineTo(12, 20);
      sprite.lineTo(4, 24);
      sprite.lineTo(6, 16);
      sprite.lineTo(0, 10);
      sprite.lineTo(8, 8);
      sprite.endFill();
    }
    this.app.stage.addChild(sprite);
    this.itemSprites.set(item.id, sprite);
  }

  private collectItem(player: PlayerState, item: ItemState) {
    item.collected = true;
    if (item.type === 'health') {
      player.hp = Math.min(player.hp + 30, this.characterConfigs[player.characterId]?.stats.hp || 100);
    } else if (item.type === 'crit') {
      player.buffs.push({ type: 'crit', duration: 10000, value: 2 });
    }
    const sprite = this.itemSprites.get(item.id);
    if (sprite) {
      this.app.stage.removeChild(sprite);
      this.itemSprites.delete(item.id);
    }
  }

  private createMonsterProjectile(monster: MonsterState, config: MonsterConfig, target: PlayerState) {
    const dx = target.x + target.width / 2 - (monster.x + monster.width / 2);
    const dy = target.y + target.height / 2 - (monster.y + monster.height / 2);
    const distance = Math.sqrt(dx * dx + dy * dy);
    const speed = 6;

    const projectile: Projectile = {
      id: `proj_${Date.now()}_${Math.random()}`,
      x: monster.x + monster.width / 2,
      y: monster.y + monster.height / 2,
      velocityX: (dx / distance) * speed,
      velocityY: (dy / distance) * speed,
      damage: config.attack,
      isPlayerProjectile: false,
      lifetime: 3000,
    };
    this.projectiles.push(projectile);
    this.createProjectileSprite(projectile, config.color);
  }

  private createProjectileSprite(projectile: Projectile, color: number) {
    const graphics = new PIXI.Graphics();
    graphics.beginFill(color);
    graphics.drawCircle(0, 0, 8);
    graphics.endFill();
    graphics.beginFill(0xffffff, 0.6);
    graphics.drawCircle(-2, -2, 3);
    graphics.endFill();
    this.app.stage.addChild(graphics);
    this.projectileSprites.set(projectile.id, graphics);
  }

  private monsterAttackPlayer(monster: MonsterState, config: MonsterConfig, player: PlayerState) {
    if (player.invincible <= 0) {
      this.damagePlayer(player, config.attack);
    }
  }

  private damagePlayer(player: PlayerState, damage: number) {
    player.hp -= damage;
    player.invincible = 1000;
    this.spawnDamageNumber(player.x + player.width / 2, player.y, damage, 0xff8844);

    const sprite = this.playerSprites.get(player.id);
    if (sprite) {
      sprite.alpha = 0.3;
      setTimeout(() => {
        if (this.playerSprites.has(player.id)) sprite.alpha = 1;
      }, 1000);
    }
  }

  private checkBossSpawn() {
    const allNormalMonstersDead = this.monsters.every((m) => m.type === 'boss');
    const hasBoss = this.monsters.some((m) => m.type === 'boss');
    if (allNormalMonstersDead && !hasBoss && !this.bossDefeated) {
      const anyPlayerAtBoss = this.players.some((p) => p.x >= this.mapConfig.bossSpawnPoint.x - 300);
      if (anyPlayerAtBoss) this.spawnBoss();
    }
  }

  private checkGameEnd() {
    if (this.bossDefeated) {
      this.running = false;
      if (this.onGameEnd) this.onGameEnd(true);
      return;
    }
    const allPlayersDead = this.players.every((p) => p.hp <= 0);
    if (allPlayersDead) {
      this.running = false;
      if (this.onGameEnd) this.onGameEnd(false);
    }
  }

  private updateCamera() {
    if (this.players.length === 0) return;
    const alivePlayers = this.players.filter((p) => p.hp > 0);
    if (alivePlayers.length === 0) return;

    let targetX: number;
    let minCameraX: number;
    let maxCameraX: number;

    if (alivePlayers.length >= 2) {
      const player1X = alivePlayers[0].x + alivePlayers[0].width / 2;
      const player2X = alivePlayers[1].x + alivePlayers[1].width / 2;
      
      const midPoint = (player1X + player2X) / 2;
      targetX = midPoint - this.gameWidth / 2;
      
      const leftMost = Math.min(player1X, player2X);
      const rightMost = Math.max(player1X, player2X);
      const distance = rightMost - leftMost;
      const margin = 100;
      
      minCameraX = rightMost - this.gameWidth + margin;
      maxCameraX = leftMost - margin;
      
      if (minCameraX > maxCameraX) {
        const center = (minCameraX + maxCameraX) / 2;
        minCameraX = center;
        maxCameraX = center;
      }
    } else {
      const playerX = alivePlayers[0].x + alivePlayers[0].width / 2;
      targetX = playerX - this.gameWidth / 2;
      minCameraX = 0;
      maxCameraX = this.mapConfig.width - this.gameWidth;
    }

    this.cameraX += (targetX - this.cameraX) * 0.1;
    this.cameraX = Math.max(0, Math.min(this.mapConfig.width - this.gameWidth, this.cameraX));
    
    if (alivePlayers.length >= 2) {
      this.cameraX = Math.max(minCameraX, Math.min(maxCameraX, this.cameraX));
    }
  }

  private render() {
    this.renderMap();
    this.renderPlayers();
    this.renderMonsters();
    this.renderItems();
    this.renderProjectiles();
    this.renderEffects();
  }

  private renderMap() {
    if (this.groundSprite) this.groundSprite.x = -this.cameraX;
    if (this.groundTopSprite) this.groundTopSprite.x = -this.cameraX;
    this.platformSprites.forEach((sprite, index) => {
      const platform = this.mapConfig.platforms[index];
      if (platform) sprite.x = platform.x - this.cameraX;
    });
  }

  private renderPlayers() {
    this.players.forEach((player) => {
      const sprite = this.playerSprites.get(player.id);
      if (!sprite) return;

      sprite.x = player.x - this.cameraX;
      sprite.y = player.y;
      sprite.scale.x = player.facing === 'left' ? -1 : 1;
      sprite.pivot.x = player.facing === 'left' ? player.width : 0;

      if (player.invincible > 0) {
        sprite.alpha = Math.floor(player.invincible / 80) % 2 === 0 ? 0.4 : 1;
      }

      const arm = sprite.getChildByName('arm') as PIXI.Graphics | undefined;
      if (arm) {
        if (player.isAttacking) {
          arm.rotation = player.facing === 'right' ? -0.8 : 0.8;
          arm.y = 4;
        } else {
          arm.rotation = 0;
          arm.y = 8;
        }
      }
    });
  }

  private renderMonsters() {
    this.monsters.forEach((monster) => {
      const sprite = this.monsterSprites.get(monster.id);
      if (!sprite) return;

      sprite.x = monster.x - this.cameraX;
      sprite.y = monster.y;
      sprite.scale.x = monster.facing === 'left' ? -1 : 1;
      sprite.pivot.x = monster.facing === 'left' ? monster.width : 0;

      if (monster.hitFlash > 0) {
        sprite.alpha = 0.5;
      }

      const hpBar = sprite.getChildByName('hpBar') as PIXI.Graphics;
      if (hpBar) {
        const hpPercent = Math.max(0, monster.hp / monster.maxHp);
        hpBar.clear();
        hpBar.beginFill(hpPercent > 0.5 ? 0x6bff9f : hpPercent > 0.25 ? 0xffd700 : 0xff6b6b);
        hpBar.drawRect(0, -12, monster.width * hpPercent, 6);
        hpBar.endFill();
      }
    });
  }

  private renderItems() {
    this.items.forEach((item) => {
      const sprite = this.itemSprites.get(item.id);
      if (sprite) {
        sprite.x = item.x - this.cameraX;
        sprite.y = item.y + Math.sin(Date.now() / 300) * 4;
      }
    });
  }

  private renderProjectiles() {
    this.projectiles.forEach((proj) => {
      const sprite = this.projectileSprites.get(proj.id);
      if (sprite) {
        sprite.x = proj.x - this.cameraX;
        sprite.y = proj.y;
      }
    });
    this.projectileSprites.forEach((sprite, id) => {
      if (!this.projectiles.find((p) => p.id === id)) {
        this.app.stage.removeChild(sprite);
        this.projectileSprites.delete(id);
      }
    });
  }

  private renderEffects() {
    this.effectLayer.removeChildren();
    this.uiLayer.removeChildren();

    this.slashEffects.forEach((effect) => {
      const progress = effect.age / effect.maxAge;
      const alpha = 1 - progress;
      const scale = 0.8 + progress * 0.6;
      const slash = new PIXI.Graphics();

      slash.beginFill(effect.color, alpha * 0.3);
      slash.lineStyle(3, effect.color, alpha);
      slash.arc(0, 0, ATTACK_RANGE * scale * 0.5, -Math.PI * 0.6, Math.PI * 0.6);
      slash.endFill();

      slash.beginFill(0xffffff, alpha * 0.5);
      slash.lineStyle(1, 0xffffff, alpha);
      slash.arc(0, 0, ATTACK_RANGE * scale * 0.3, -Math.PI * 0.4, Math.PI * 0.4);
      slash.endFill();

      slash.x = effect.x - this.cameraX;
      slash.y = effect.y;
      if (effect.facing === 'left') slash.scale.x = -1;

      this.effectLayer.addChild(slash);
    });

    this.skillEffects.forEach((effect) => {
      const progress = effect.age / effect.maxAge;
      const alpha = 1 - progress;

      switch (effect.type) {
        case 'melee_aoe': {
          const g = new PIXI.Graphics();
          const r = effect.radius * (0.5 + progress * 0.5);
          g.beginFill(effect.color, alpha * 0.25);
          g.lineStyle(3, effect.color, alpha);
          g.drawCircle(0, 0, r);
          g.endFill();
          g.beginFill(0xffffff, alpha * 0.15);
          g.drawCircle(0, 0, r * 0.5);
          g.endFill();
          const sweepCount = 6;
          for (let i = 0; i < sweepCount; i++) {
            const angle = (Math.PI * 2 / sweepCount) * i + progress * Math.PI * 2;
            g.lineStyle(2, 0xffffff, alpha * 0.6);
            g.moveTo(0, 0);
            g.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
          }
          g.x = effect.x - this.cameraX;
          g.y = effect.y;
          this.effectLayer.addChild(g);
          break;
        }
        case 'projectile_burst': {
          const g = new PIXI.Graphics();
          const count = 5;
          for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i + progress * Math.PI;
            const dist = 10 + progress * 40;
            const size = 8 * (1 - progress);
            g.beginFill(effect.color, alpha * 0.8);
            g.drawCircle(Math.cos(angle) * dist, Math.sin(angle) * dist, size);
            g.endFill();
            g.beginFill(0xffaa00, alpha * 0.5);
            g.drawCircle(Math.cos(angle) * dist, Math.sin(angle) * dist, size * 0.5);
            g.endFill();
          }
          g.beginFill(0xff6600, alpha * 0.4);
          g.drawCircle(0, 0, 15 * (1 - progress));
          g.endFill();
          g.x = effect.x - this.cameraX;
          g.y = effect.y;
          this.effectLayer.addChild(g);
          break;
        }
        case 'arrow_rain': {
          const g = new PIXI.Graphics();
          const count = 8;
          for (let i = 0; i < count; i++) {
            const offsetX = (i - count / 2) * 25;
            const fallY = -80 + progress * 120;
            const alpha2 = i % 2 === 0 ? alpha : alpha * 0.6;
            g.lineStyle(2, effect.color, alpha2);
            g.moveTo(offsetX, fallY);
            g.lineTo(offsetX, fallY + 20);
            g.beginFill(effect.color, alpha2);
            g.moveTo(offsetX, fallY + 20);
            g.lineTo(offsetX - 4, fallY + 14);
            g.lineTo(offsetX + 4, fallY + 14);
            g.endFill();
          }
          g.beginFill(effect.color, alpha * 0.15);
          g.drawRect(-count * 12.5, 30, count * 25, 10);
          g.endFill();
          g.x = effect.x - this.cameraX;
          g.y = effect.y;
          this.effectLayer.addChild(g);
          break;
        }
        case 'dash_shadow': {
          const g = new PIXI.Graphics();
          for (let i = 0; i < 4; i++) {
            const trailProgress = i / 4;
            const tx = (effect.facing === 'right' ? -1 : 1) * i * 20;
            const a = alpha * (1 - trailProgress);
            g.beginFill(effect.color, a * 0.4);
            g.drawRoundedRect(tx - PLAYER_WIDTH / 2, -PLAYER_HEIGHT / 2, PLAYER_WIDTH, PLAYER_HEIGHT, 4);
            g.endFill();
          }
          g.lineStyle(2, 0x9f6bff, alpha);
          g.moveTo(0, -PLAYER_HEIGHT / 2 - 5);
          g.lineTo(effect.facing === 'right' ? 50 : -50, -PLAYER_HEIGHT / 2 - 5);
          g.moveTo(0, 0);
          g.lineTo(effect.facing === 'right' ? 60 : -60, 0);
          g.moveTo(0, PLAYER_HEIGHT / 2 + 5);
          g.lineTo(effect.facing === 'right' ? 40 : -40, PLAYER_HEIGHT / 2 + 5);
          g.x = effect.x - this.cameraX;
          g.y = effect.y;
          this.effectLayer.addChild(g);
          break;
        }
      }
    });

    this.damageNumbers.forEach((dmg) => {
      const progress = dmg.age / dmg.maxAge;
      const alpha = 1 - progress;
      const text = new PIXI.Text(`-${dmg.value}`, {
        fontFamily: 'Arial',
        fontSize: 18,
        fontWeight: 'bold',
        fill: dmg.color,
        stroke: 0x000000,
        strokeThickness: 3,
      });
      text.alpha = alpha;
      text.anchor.set(0.5);
      text.x = dmg.x - this.cameraX;
      text.y = dmg.y;
      text.zIndex = 100;
      this.uiLayer.addChild(text);
    });
  }

  destroy() {
    this.stop();
    if (this.boundKeyDown) window.removeEventListener('keydown', this.boundKeyDown);
    if (this.boundKeyUp) window.removeEventListener('keyup', this.boundKeyUp);
    this.app.destroy(true);
  }

  getScore(): number {
    return this.score;
  }

  getPlayers(): PlayerState[] {
    return this.players;
  }
}
