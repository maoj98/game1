<script setup lang="ts">
import { computed } from 'vue';
import { characters } from '../config/characters';
import type { PlayerState } from '../types/game';

const props = defineProps<{
  players: PlayerState[];
  score: number;
  levelName: string;
}>();

const emit = defineEmits<{
  pause: [];
}>();

const playerInfos = computed(() => {
  return props.players.map((player) => {
    const charConfig = characters[player.characterId];
    return {
      ...player,
      name: charConfig?.name || 'Unknown',
      maxHp: charConfig?.stats.maxHp || 100,
      maxMp: charConfig?.stats.maxMp || 50,
      skillName: charConfig?.skill.name || '技能',
      skillCooldownPercent: Math.max(0, 100 - (player.skillCooldown / (charConfig?.skill.cooldown || 5000)) * 100),
    };
  });
});

const hasCritBuff = (player: PlayerState) => {
  return player.buffs.some((b) => b.type === 'crit');
};
</script>

<template>
  <div class="game-hud">
    <div class="hud-top">
      <div class="level-info">
        <span class="level-name">{{ levelName }}</span>
      </div>
      <div class="score-display">
        <span class="score-label">分数</span>
        <span class="score-value">{{ score.toString().padStart(6, '0') }}</span>
      </div>
      <button class="pause-btn" @click="emit('pause')">暂停</button>
    </div>

    <div class="players-hud">
      <div
        v-for="(player, index) in playerInfos"
        :key="player.id"
        class="player-hud"
        :class="{ dead: player.hp <= 0 }"
      >
        <div class="player-header">
          <span class="player-id">P{{ index + 1 }}</span>
          <span class="player-name">{{ player.name }}</span>
          <div v-if="hasCritBuff(player)" class="buff-indicator">暴击!</div>
        </div>
        
        <div class="stat-bar hp-bar">
          <span class="stat-label">HP</span>
          <div class="bar-bg">
            <div
              class="bar-fill hp-fill"
              :style="{ width: (player.hp / player.maxHp * 100) + '%' }"
            ></div>
          </div>
          <span class="stat-value">{{ Math.max(0, Math.floor(player.hp)) }}/{{ player.maxHp }}</span>
        </div>

        <div class="stat-bar mp-bar">
          <span class="stat-label">MP</span>
          <div class="bar-bg">
            <div
              class="bar-fill mp-fill"
              :style="{ width: (player.mp / player.maxMp * 100) + '%' }"
            ></div>
          </div>
          <span class="stat-value">{{ Math.floor(player.mp) }}/{{ player.maxMp }}</span>
        </div>

        <div class="skill-info">
          <span class="skill-name">{{ player.skillName }}</span>
          <div class="skill-cooldown">
            <div
              class="skill-fill"
              :style="{ width: player.skillCooldownPercent + '%' }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <div class="controls-display">
      <div class="control-group">
        <span class="control-key">J</span><span class="control-desc">攻击</span>
        <span class="control-key">K</span><span class="control-desc">跳跃</span>
        <span class="control-key">L</span><span class="control-desc">技能</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.game-hud {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  padding: 15px;
  pointer-events: none;
  z-index: 100;
}

.hud-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  pointer-events: auto;
}

.level-info {
  background: rgba(26, 26, 46, 0.9);
  padding: 8px 16px;
  border: 2px solid #00d9ff;
  border-radius: 4px;
}

.level-name {
  color: #00d9ff;
  font-size: 14px;
  font-weight: bold;
}

.score-display {
  background: rgba(26, 26, 46, 0.9);
  padding: 8px 16px;
  border: 2px solid #ffd700;
  border-radius: 4px;
  display: flex;
  gap: 10px;
  align-items: center;
}

.score-label {
  color: #ffd700;
  font-size: 12px;
}

.score-value {
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  letter-spacing: 2px;
}

.pause-btn {
  background: rgba(26, 26, 46, 0.9);
  border: 2px solid #ff6b6b;
  color: #ff6b6b;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.pause-btn:hover {
  background: rgba(255, 107, 107, 0.2);
}

.players-hud {
  display: flex;
  gap: 20px;
  pointer-events: none;
}

.player-hud {
  background: rgba(26, 26, 46, 0.9);
  border: 2px solid #00d9ff;
  border-radius: 6px;
  padding: 12px;
  min-width: 220px;
  opacity: 1;
  transition: opacity 0.3s;
}

.player-hud.dead {
  opacity: 0.5;
  filter: grayscale(1);
}

.player-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.player-id {
  background: #00d9ff;
  color: #1a1a2e;
  padding: 2px 8px;
  border-radius: 3px;
  font-size: 12px;
  font-weight: bold;
}

.player-name {
  color: #fff;
  font-size: 14px;
}

.buff-indicator {
  background: #ffd700;
  color: #1a1a2e;
  padding: 2px 8px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: bold;
  animation: pulse 0.5s infinite alternate;
}

@keyframes pulse {
  from { transform: scale(1); }
  to { transform: scale(1.1); }
}

.stat-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.stat-label {
  width: 24px;
  font-size: 12px;
  font-weight: bold;
}

.hp-bar .stat-label {
  color: #ff6b6b;
}

.mp-bar .stat-label {
  color: #6b9fff;
}

.bar-bg {
  flex: 1;
  height: 16px;
  background: #333;
  border-radius: 3px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  transition: width 0.2s;
}

.hp-fill {
  background: linear-gradient(90deg, #ff6b6b, #ff8e8e);
}

.mp-fill {
  background: linear-gradient(90deg, #6b9fff, #9fbdff);
}

.stat-value {
  width: 70px;
  text-align: right;
  font-size: 12px;
  color: #fff;
}

.skill-info {
  margin-top: 8px;
}

.skill-name {
  color: #ffd700;
  font-size: 11px;
  display: block;
  margin-bottom: 4px;
}

.skill-cooldown {
  height: 6px;
  background: #333;
  border-radius: 3px;
  overflow: hidden;
}

.skill-fill {
  height: 100%;
  background: #ffd700;
  transition: width 0.1s;
}

.controls-display {
  position: absolute;
  bottom: 15px;
  right: 15px;
  background: rgba(26, 26, 46, 0.8);
  border: 1px solid #444;
  border-radius: 4px;
  padding: 8px 12px;
  pointer-events: none;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 5px;
}

.control-key {
  background: #444;
  color: #fff;
  padding: 4px 8px;
  border-radius: 3px;
  font-size: 12px;
  font-weight: bold;
  min-width: 24px;
  text-align: center;
}

.control-desc {
  color: #888;
  font-size: 11px;
  margin-right: 10px;
}
</style>
