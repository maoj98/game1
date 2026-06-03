<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  victory: boolean;
  score: number;
  unlockedItems: string[];
}>();

const emit = defineEmits<{
  restart: [];
  backToMenu: [];
}>();

const title = computed(() => props.victory ? '通关成功！' : '挑战失败');
const subtitle = computed(() => props.victory ? 'VICTORY' : 'DEFEAT');
const titleColor = computed(() => props.victory ? '#00d9ff' : '#ff6b6b');
</script>

<template>
  <div class="result-overlay">
    <div class="result-modal">
      <h1 class="result-title" :style="{ color: titleColor }">{{ title }}</h1>
      <p class="result-subtitle">{{ subtitle }}</p>

      <div class="score-section">
        <span class="score-label">最终得分</span>
        <span class="score-value">{{ score.toString().padStart(6, '0') }}</span>
      </div>

      <div v-if="victory && unlockedItems.length > 0" class="unlock-section">
        <h3 class="unlock-title">解锁内容</h3>
        <div class="unlock-items">
          <div v-for="item in unlockedItems" :key="item" class="unlock-item">
            <span class="unlock-icon">🎊</span>
            <span class="unlock-name">{{ item }}</span>
          </div>
        </div>
      </div>

      <div class="button-group">
        <button class="restart-btn" @click="emit('restart')">
          再来一局
        </button>
        <button class="menu-btn" @click="emit('backToMenu')">
          返回菜单
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.result-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.result-modal {
  background: #1a1a2e;
  border: 4px solid;
  border-radius: 12px;
  padding: 50px;
  text-align: center;
  min-width: 400px;
  animation: scaleIn 0.4s ease;
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.result-title {
  font-size: 48px;
  margin: 0 0 10px;
  text-shadow: 0 0 30px currentColor;
}

.result-subtitle {
  font-size: 18px;
  color: #888;
  margin: 0 0 30px;
  letter-spacing: 8px;
}

.score-section {
  background: #16213e;
  border: 2px solid #333;
  border-radius: 8px;
  padding: 20px 40px;
  margin-bottom: 30px;
}

.score-label {
  display: block;
  color: #888;
  font-size: 14px;
  margin-bottom: 10px;
}

.score-value {
  display: block;
  color: #ffd700;
  font-size: 36px;
  font-weight: bold;
  letter-spacing: 4px;
}

.unlock-section {
  margin-bottom: 30px;
}

.unlock-title {
  color: #00d9ff;
  font-size: 16px;
  margin: 0 0 15px;
}

.unlock-items {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.unlock-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 10px;
  background: rgba(0, 217, 255, 0.1);
  border: 1px solid #00d9ff;
  border-radius: 4px;
  animation: pulse 1s infinite alternate;
}

@keyframes pulse {
  from { box-shadow: 0 0 5px rgba(0, 217, 255, 0.3); }
  to { box-shadow: 0 0 15px rgba(0, 217, 255, 0.6); }
}

.unlock-icon {
  font-size: 24px;
}

.unlock-name {
  color: #fff;
  font-size: 14px;
}

.button-group {
  display: flex;
  gap: 15px;
}

.restart-btn, .menu-btn {
  flex: 1;
  padding: 15px;
  font-size: 16px;
  border: 3px solid;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.restart-btn {
  background: #00d9ff;
  color: #1a1a2e;
  border-color: #00d9ff;
}

.restart-btn:hover {
  box-shadow: 0 0 20px rgba(0, 217, 255, 0.8);
  transform: scale(1.02);
}

.menu-btn {
  background: transparent;
  color: #ff6b6b;
  border-color: #ff6b6b;
}

.menu-btn:hover {
  background: rgba(255, 107, 107, 0.2);
  box-shadow: 0 0 15px rgba(255, 107, 107, 0.5);
}
</style>
