import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { GameState, PlayerState, MonsterState, ItemState, Projectile, Difficulty, GamePhase } from '../types/game';

export const useGameStore = defineStore('game', () => {
  const state = ref<GameState>({
    phase: 'menu',
    difficulty: 'normal',
    currentLevel: 1,
    score: 0,
    players: [],
    monsters: [],
    items: [],
    projectiles: [],
    unlockedCharacters: ['warrior'],
    unlockedWeapons: [],
    bossSpawned: false,
    bossDefeated: false,
  });

  const selectedCharacterIds = ref<string[]>(['warrior']);

  const isPlaying = computed(() => state.value.phase === 'playing');
  const isPaused = computed(() => state.value.phase === 'paused');
  const isVictory = computed(() => state.value.phase === 'victory');
  const isDefeat = computed(() => state.value.phase === 'defeat');

  function setPhase(phase: GamePhase) {
    state.value.phase = phase;
  }

  function setDifficulty(difficulty: Difficulty) {
    state.value.difficulty = difficulty;
  }

  function setCurrentLevel(level: number) {
    state.value.currentLevel = level;
  }

  function addScore(points: number) {
    state.value.score += points;
  }

  function addPlayer(player: PlayerState) {
    if (state.value.players.length < 2) {
      state.value.players.push(player);
    }
  }

  function removePlayer(playerId: number) {
    state.value.players = state.value.players.filter(p => p.id !== playerId);
  }

  function updatePlayer(playerId: number, updates: Partial<PlayerState>) {
    const player = state.value.players.find(p => p.id === playerId);
    if (player) {
      Object.assign(player, updates);
    }
  }

  function addMonster(monster: MonsterState) {
    state.value.monsters.push(monster);
  }

  function removeMonster(monsterId: string) {
    state.value.monsters = state.value.monsters.filter(m => m.id !== monsterId);
  }

  function updateMonster(monsterId: string, updates: Partial<MonsterState>) {
    const monster = state.value.monsters.find(m => m.id === monsterId);
    if (monster) {
      Object.assign(monster, updates);
    }
  }

  function addItem(item: ItemState) {
    state.value.items.push(item);
  }

  function removeItem(itemId: string) {
    state.value.items = state.value.items.filter(i => i.id !== itemId);
  }

  function addProjectile(projectile: Projectile) {
    state.value.projectiles.push(projectile);
  }

  function removeProjectile(projectileId: string) {
    state.value.projectiles = state.value.projectiles.filter(p => p.id !== projectileId);
  }

  function setBossSpawned(value: boolean) {
    state.value.bossSpawned = value;
  }

  function setBossDefeated(value: boolean) {
    state.value.bossDefeated = value;
  }

  function unlockCharacter(characterId: string) {
    if (!state.value.unlockedCharacters.includes(characterId)) {
      state.value.unlockedCharacters.push(characterId);
      saveProgress();
    }
  }

  function unlockWeapon(weaponId: string) {
    if (!state.value.unlockedWeapons.includes(weaponId)) {
      state.value.unlockedWeapons.push(weaponId);
      saveProgress();
    }
  }

  function saveProgress() {
    localStorage.setItem('pixelGameProgress', JSON.stringify({
      unlockedCharacters: state.value.unlockedCharacters,
      unlockedWeapons: state.value.unlockedWeapons,
    }));
  }

  function loadProgress() {
    const saved = localStorage.getItem('pixelGameProgress');
    if (saved) {
      const data = JSON.parse(saved);
      state.value.unlockedCharacters = data.unlockedCharacters || ['warrior'];
      state.value.unlockedWeapons = data.unlockedWeapons || [];
    }
  }

  function resetGame() {
    state.value.players = [];
    state.value.monsters = [];
    state.value.items = [];
    state.value.projectiles = [];
    state.value.score = 0;
    state.value.bossSpawned = false;
    state.value.bossDefeated = false;
  }

  function setSelectedCharacters(characterIds: string[]) {
    selectedCharacterIds.value = characterIds.slice(0, 2);
  }

  return {
    state,
    selectedCharacterIds,
    isPlaying,
    isPaused,
    isVictory,
    isDefeat,
    setPhase,
    setDifficulty,
    setCurrentLevel,
    addScore,
    addPlayer,
    removePlayer,
    updatePlayer,
    addMonster,
    removeMonster,
    updateMonster,
    addItem,
    removeItem,
    addProjectile,
    removeProjectile,
    setBossSpawned,
    setBossDefeated,
    unlockCharacter,
    unlockWeapon,
    saveProgress,
    loadProgress,
    resetGame,
    setSelectedCharacters,
  };
});
