<script setup lang="ts">
import { ref, onUnmounted, computed, nextTick } from 'vue';
import { useGameStore } from './stores/gameStore';
import { maps as defaultMaps } from './config/maps';
import { monsters as defaultMonsters } from './config/monsters';
import { characters as defaultCharacters } from './config/characters';
import { GameManager } from './game/GameManager';
import type { PlayerState, MonsterConfig, MapConfig } from './types/game';
import MainMenu from './components/MainMenu.vue';
import GameHUD from './components/GameHUD.vue';
import ConfigPanel from './components/ConfigPanel.vue';
import ResultModal from './components/ResultModal.vue';

const gameStore = useGameStore();

const gamePhase = ref<'menu' | 'playing' | 'paused' | 'result'>('menu');
const showConfig = ref(false);
const gameVictory = ref(false);
const finalScore = ref(0);
const unlockedItems = ref<string[]>([]);
const currentLevelId = ref<string>('level1');

const customMonsters = ref<Record<string, MonsterConfig>>({ ...defaultMonsters });
const customMaps = ref<Record<string, MapConfig>>({ ...defaultMaps });

const gameContainer = ref<HTMLElement | null>(null);
let gameManager: GameManager | null = null;

const players = ref<PlayerState[]>([]);
const score = ref(0);

const currentLevelName = computed(() => {
  return customMaps.value[currentLevelId.value]?.name || '未知关卡';
});

async function startGame(levelId: string) {
  currentLevelId.value = levelId;
  gamePhase.value = 'playing';
  gameVictory.value = false;
  finalScore.value = 0;
  unlockedItems.value = [];
  score.value = 0;
  players.value = [];

  await nextTick();
  await nextTick();
  await initGame();
}

async function initGame() {
  if (gameManager) {
    gameManager.destroy();
    gameManager = null;
  }

  if (!gameContainer.value) return;

  const mapConfig = customMaps.value[currentLevelId.value];
  if (!mapConfig) return;

  gameManager = new GameManager(
    gameContainer.value,
    mapConfig,
    defaultCharacters,
    customMonsters.value,
    gameStore.state.difficulty
  );

  await gameManager.init();

  gameManager.createMap();
  gameManager.spawnMonsters();

  const selectedChars = gameStore.selectedCharacterIds;
  selectedChars.forEach((charId, index) => {
    const spawnPoint = mapConfig.spawnPoints[index] || mapConfig.spawnPoints[0];
    if (gameManager) {
      gameManager.addPlayer(index + 1, charId, spawnPoint.x, spawnPoint.y);
    }
  });

  gameManager.setCallbacks(
    (newScore: number) => {
      score.value = newScore;
    },
    (newPlayers: PlayerState[]) => {
      players.value = newPlayers;
    },
    (victory: boolean) => {
      handleGameEnd(victory);
    }
  );

  gameManager.start();
}

function handleGameEnd(victory: boolean) {
  gameVictory.value = victory;
  finalScore.value = score.value;
  
  if (victory) {
    unlockedItems.value = [];
    
    const allChars = Object.keys(defaultCharacters);
    const unlockedBefore = gameStore.state.unlockedCharacters.length;
    
    if (currentLevelId.value === 'level1' && !gameStore.state.unlockedCharacters.includes('mage')) {
      gameStore.unlockCharacter('mage');
      unlockedItems.value.push('角色：法师');
    }
    if (currentLevelId.value === 'level1' && !gameStore.state.unlockedCharacters.includes('archer')) {
      gameStore.unlockCharacter('archer');
      unlockedItems.value.push('角色：弓箭手');
    }
    if (currentLevelId.value === 'level2' && !gameStore.state.unlockedCharacters.includes('ninja')) {
      gameStore.unlockCharacter('ninja');
      unlockedItems.value.push('角色：忍者');
    }
  }

  gamePhase.value = 'result';
}

function pauseGame() {
  if (gameManager) {
    gameManager.stop();
  }
  gamePhase.value = 'paused';
}

function resumeGame() {
  if (gameManager) {
    gameManager.start();
  }
  gamePhase.value = 'playing';
}

function restartGame() {
  gamePhase.value = 'playing';
  startGame(currentLevelId.value);
}

function backToMenu() {
  if (gameManager) {
    gameManager.destroy();
    gameManager = null;
  }
  gamePhase.value = 'menu';
}

function openConfig() {
  showConfig.value = true;
}

function closeConfig() {
  showConfig.value = false;
}

function saveConfig(newMonsters: Record<string, MonsterConfig>, newMaps: Record<string, MapConfig>) {
  customMonsters.value = newMonsters;
  customMaps.value = newMaps;
}

onUnmounted(() => {
  if (gameManager) {
    gameManager.destroy();
  }
});
</script>

<template>
  <div class="app-container">
    <MainMenu
      v-if="gamePhase === 'menu'"
      @start-game="startGame"
      @open-config="openConfig"
    />

    <div v-if="gamePhase === 'playing' || gamePhase === 'paused'" class="game-wrapper">
      <div ref="gameContainer" class="game-canvas"></div>
      <GameHUD
        :players="players"
        :score="score"
        :level-name="currentLevelName"
        @pause="pauseGame"
      />

      <div v-if="gamePhase === 'paused'" class="pause-overlay">
        <div class="pause-menu">
          <h2 class="pause-title">游戏暂停</h2>
          <button class="pause-btn" @click="resumeGame">继续游戏</button>
          <button class="pause-btn secondary" @click="backToMenu">返回菜单</button>
        </div>
      </div>
    </div>

    <ResultModal
      v-if="gamePhase === 'result'"
      :victory="gameVictory"
      :score="finalScore"
      :unlocked-items="unlockedItems"
      @restart="restartGame"
      @back-to-menu="backToMenu"
    />

    <ConfigPanel
      v-if="showConfig"
      @close="closeConfig"
      @save="saveConfig"
    />
  </div>
</template>

<style scoped>
.app-container {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #1a1a2e;
}

.game-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.game-canvas {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1280px;
  height: 720px;
  z-index: 1;
  position: relative;
}

.game-canvas :deep(canvas) {
  border: 4px solid #00d9ff;
  border-radius: 8px;
  box-shadow: 0 0 30px rgba(0, 217, 255, 0.3);
  display: block !important;
  visibility: visible !important;
}

.pause-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.pause-menu {
  background: #1a1a2e;
  border: 3px solid #00d9ff;
  border-radius: 8px;
  padding: 40px;
  text-align: center;
}

.pause-title {
  color: #00d9ff;
  font-size: 32px;
  margin: 0 0 30px;
  text-shadow: 0 0 20px rgba(0, 217, 255, 0.8);
}

.pause-btn {
  display: block;
  width: 200px;
  padding: 15px;
  margin: 10px auto;
  background: #00d9ff;
  border: none;
  border-radius: 4px;
  color: #1a1a2e;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.pause-btn:hover {
  box-shadow: 0 0 15px rgba(0, 217, 255, 0.8);
  transform: scale(1.02);
}

.pause-btn.secondary {
  background: transparent;
  border: 2px solid #ff6b6b;
  color: #ff6b6b;
}

.pause-btn.secondary:hover {
  background: rgba(255, 107, 107, 0.2);
  box-shadow: 0 0 15px rgba(255, 107, 107, 0.5);
}
</style>
