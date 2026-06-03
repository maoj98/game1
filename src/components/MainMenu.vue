<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useGameStore } from '../stores/gameStore';
import { characters } from '../config/characters';
import { maps } from '../config/maps';
import { monsters } from '../config/monsters';
import type { Difficulty } from '../types/game';

const emit = defineEmits<{
  startGame: [levelId: string];
  openConfig: [];
}>();

const gameStore = useGameStore();

const selectedLevel = ref<string>('level1');
const selectedDifficulty = ref<Difficulty>('normal');
const playerCount = ref<number>(1);

const unlockedCharacters = computed(() => {
  return Object.values(characters).filter(c => 
    gameStore.state.unlockedCharacters.includes(c.id)
  );
});

const lockedCharacters = computed(() => {
  return Object.values(characters).filter(c => 
    !gameStore.state.unlockedCharacters.includes(c.id)
  );
});

const difficultyLabel = computed(() => {
  return selectedDifficulty.value === 'normal' ? '普通' : '困难';
});

function toggleDifficulty() {
  selectedDifficulty.value = selectedDifficulty.value === 'normal' ? 'hard' : 'normal';
}

function selectLevel(levelId: string) {
  selectedLevel.value = levelId;
}

function togglePlayerCount() {
  playerCount.value = playerCount.value === 1 ? 2 : 1;
}

function startGame() {
  gameStore.setDifficulty(selectedDifficulty.value);
  gameStore.setSelectedCharacters(
    unlockedCharacters.value.slice(0, playerCount.value).map(c => c.id)
  );
  emit('startGame', selectedLevel.value);
}

onMounted(() => {
  gameStore.loadProgress();
});
</script>

<template>
  <div class="main-menu">
    <div class="menu-container">
      <h1 class="game-title">像素闯关</h1>
      <p class="subtitle">PIXEL ACTION</p>

      <div class="menu-section">
        <h2 class="section-title">选择关卡</h2>
        <div class="level-select">
          <div
            v-for="(map, mapId) in maps"
            :key="mapId"
            :class="['level-card', { active: selectedLevel === mapId }]"
            @click="selectLevel(mapId)"
          >
            <span class="level-name">{{ map.name }}</span>
          </div>
        </div>
      </div>

      <div class="menu-section">
        <h2 class="section-title">游戏人数</h2>
        <button class="toggle-btn" @click="togglePlayerCount">
          {{ playerCount }} 人组队
        </button>
      </div>

      <div class="menu-section">
        <h2 class="section-title">难度选择</h2>
        <button class="toggle-btn" @click="toggleDifficulty">
          {{ difficultyLabel }}模式
        </button>
      </div>

      <div class="menu-section">
        <h2 class="section-title">已解锁角色</h2>
        <div class="character-grid">
          <div
            v-for="char in unlockedCharacters"
            :key="char.id"
            class="character-card"
          >
            <div class="char-color" :style="{ backgroundColor: '#' + char.color.toString(16).padStart(6, '0') }"></div>
            <span class="char-name">{{ char.name }}</span>
            <span class="char-skill">{{ char.skill.name }}</span>
          </div>
        </div>
        <div v-if="lockedCharacters.length > 0" class="locked-chars">
          <p class="locked-title">未解锁：{{ lockedCharacters.map(c => c.name).join('、') }}</p>
        </div>
      </div>

      <div class="button-group">
        <button class="start-btn" @click="startGame">
          开始游戏</button>
        <button class="config-btn" @click="emit('openConfig')">
          配置面板
        </button>
      </div>

      <div class="controls-hint">
        <p>操作说明：</p>
        <p>P1: WASD移动 | J攻击 | K跳跃 | L技能</p>
        <p>P2: 方向键移动 | 1攻击 | 2跳跃 | 3技能</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.main-menu {
  width: 100vw;
  height: 100vh;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: auto;
  padding: 20px;
}

.menu-container {
  max-width: 800px;
  width: 100%;
  background: rgba(26, 26, 46, 0.95);
  border: 4px solid #00d9ff;
  border-radius: 8px;
  padding: 40px;
  box-shadow: 0 0 30px rgba(0, 217, 255, 0.3);
}

.game-title {
  font-size: 48px;
  color: #00d9ff;
  text-align: center;
  margin: 0;
  text-shadow: 0 0 20px rgba(0, 217, 255, 0.8);
  letter-spacing: 4px;
}

.subtitle {
  text-align: center;
  color: #ff6b6b;
  font-size: 14px;
  margin: 10px 0 30px;
  letter-spacing: 8px;
}

.menu-section {
  margin-bottom: 25px 0;
}

.section-title {
  color: #fff;
  font-size: 16px;
  margin: 0 0 15px;
  border-bottom: 2px solid #00d9ff;
  padding-bottom: 8px;
}

.level-select {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.level-card {
  flex: 1;
  min-width: 200px;
  padding: 15px;
  background: #16213e;
  border: 3px solid #333;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.level-card:hover {
  border-color: #00d9ff;
  transform: translateY(-2px);
}

.level-card.active {
  border-color: #00d9ff;
  background: #0f3460;
}

.level-name {
  color: #fff;
  font-size: 14px;
}

.toggle-btn {
  width: 100%;
  padding: 12px 24px;
  background: #16213e;
  border: 3px solid #00d9ff;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 6px;
}

.toggle-btn:hover {
  background: #0f3460;
  box-shadow: 0 0 15px rgba(0, 217, 255, 0.5);
}

.character-grid {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.character-card {
  flex: 1;
  min-width: 150px;
  padding: 15px;
  background: #16213e;
  border: 2px solid #333;
  border-radius: 6px;
  text-align: center;
}

.char-color {
  width: 40px;
  height: 50px;
  margin: 0 auto 10px;
  border-radius: 4px;
}

.char-name {
  display: block;
  color: #fff;
  font-size: 14px;
  margin-bottom: 5px;
}

.char-skill {
  display: block;
  color: #00d9ff;
  font-size: 11px;
}

.locked-chars {
  margin-top: 15px;
  padding: 10px;
  background: rgba(255, 107, 107, 0.1);
  border: 1px solid #ff6b6b;
  border-radius: 4px;
}

.locked-title {
  color: #ff6b6b;
  font-size: 12px;
  margin: 0;
}

.button-group {
  display: flex;
  gap: 15px;
  margin-top: 30px 0;
}

.start-btn, .config-btn {
  flex: 1;
  padding: 15px;
  font-size: 18px;
  border: 3px solid;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.start-btn {
  background: #00d9ff;
  color: #1a1a2e;
  border-color: #00d9ff;
}

.start-btn:hover {
  box-shadow: 0 0 20px rgba(0, 217, 255, 0.8);
  transform: scale(1.02);
}

.config-btn {
  background: transparent;
  color: #ff6b6b;
  border-color: #ff6b6b;
}

.config-btn:hover {
  background: rgba(255, 107, 107, 0.2);
  box-shadow: 0 0 15px rgba(255, 107, 107, 0.5);
}

.controls-hint {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #333;
  text-align: center;
}

.controls-hint p {
  color: #888;
  font-size: 12px;
  margin: 5px 0;
}
</style>
