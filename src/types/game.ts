export interface Character {
  id: string;
  name: string;
  unlocked: boolean;
  color: number;
  stats: {
    hp: number;
    maxHp: number;
    mp: number;
    maxMp: number;
    attack: number;
    defense: number;
    speed: number;
    jumpForce: number;
  };
  skill: {
    name: string;
    damage: number;
    cooldown: number;
    mpCost: number;
    range: number;
  };
}

export interface MonsterConfig {
  id: string;
  name: string;
  type: 'normal' | 'ranged' | 'boss';
  color: number;
  hp: number;
  attack: number;
  speed: number;
  width: number;
  height: number;
  patrolRange: number;
  chaseRange: number;
  attackRange: number;
  attackCooldown: number;
  dropRate: number;
}

export interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MonsterSpawn {
  x: number;
  y: number;
  monsterId: string;
}

export interface BackgroundLayer {
  color: number;
  scrollSpeed: number;
}

export interface MapConfig {
  id: string;
  name: string;
  width: number;
  height: number;
  groundY: number;
  platforms: Platform[];
  spawnPoints: { x: number; y: number }[];
  bossSpawnPoint: { x: number; y: number };
  monsterSpawns: MonsterSpawn[];
  backgroundLayers: BackgroundLayer[];
}

export type GamePhase = 'menu' | 'playing' | 'paused' | 'victory' | 'defeat';
export type Difficulty = 'normal' | 'hard';
export type BuffType = 'crit' | 'heal';
export type ItemType = 'health' | 'crit';
export type Facing = 'left' | 'right';

export interface Buff {
  type: BuffType;
  duration: number;
  value: number;
}

export interface PlayerState {
  id: number;
  characterId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  hp: number;
  mp: number;
  facing: Facing;
  isJumping: boolean;
  isAttacking: boolean;
  attackCooldown: number;
  skillCooldown: number;
  invincible: number;
  buffs: Buff[];
  velocityX: number;
  velocityY: number;
}

export interface MonsterState {
  id: string;
  configId: string;
  type: 'normal' | 'ranged' | 'boss';
  x: number;
  y: number;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  facing: Facing;
  aiState: 'patrol' | 'chase' | 'attack';
  patrolStartX: number;
  attackCooldown: number;
  hitFlash: number;
}

export interface ItemState {
  id: string;
  type: ItemType;
  x: number;
  y: number;
  width: number;
  height: number;
  collected: boolean;
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  damage: number;
  isPlayerProjectile: boolean;
  lifetime: number;
}

export interface GameState {
  phase: GamePhase;
  difficulty: Difficulty;
  currentLevel: number;
  score: number;
  players: PlayerState[];
  monsters: MonsterState[];
  items: ItemState[];
  projectiles: Projectile[];
  unlockedCharacters: string[];
  unlockedWeapons: string[];
  bossSpawned: boolean;
  bossDefeated: boolean;
}

export interface KeyState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  attack: boolean;
  jump: boolean;
  skill: boolean;
}

export interface GameConfig {
  monsters: Record<string, MonsterConfig>;
  maps: Record<string, MapConfig>;
  characters: Record<string, Character>;
}

export type { MonsterConfig as MonsterType };
