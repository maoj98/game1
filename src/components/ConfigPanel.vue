<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import { monsters as defaultMonsters } from '../config/monsters';
import { maps as defaultMaps } from '../config/maps';
import type { MonsterConfig, MapConfig } from '../types/game';

const emit = defineEmits<{
  close: [];
  save: [monsters: Record<string, MonsterConfig>, maps: Record<string, MapConfig>];
}>();

const activeTab = ref<'monsters' | 'maps'>('monsters');

const editedMonsters = reactive<Record<string, MonsterConfig>>(
  JSON.parse(JSON.stringify(defaultMonsters))
);
const editedMaps = reactive<Record<string, MapConfig>>(
  JSON.parse(JSON.stringify(defaultMaps))
);

const selectedMonsterId = ref<string>(Object.keys(defaultMonsters)[0]);
const selectedMapId = ref<string>(Object.keys(defaultMaps)[0]);

function resetToDefault() {
  Object.assign(editedMonsters, JSON.parse(JSON.stringify(defaultMonsters)));
  Object.assign(editedMaps, JSON.parse(JSON.stringify(defaultMaps)));
}

function saveConfig() {
  emit('save', 
    JSON.parse(JSON.stringify(editedMonsters)),
    JSON.parse(JSON.stringify(editedMaps))
  );
  emit('close');
}

function getMonsterList() {
  return Object.entries(editedMonsters);
}

function getMapList() {
  return Object.entries(editedMaps);
}

function updateMonsterField(id: string, field: string, value: number | string) {
  if (editedMonsters[id]) {
    (editedMonsters[id] as any)[field] = value;
  }
}

function updateMapField(id: string, field: string, value: number) {
  if (editedMaps[id]) {
    (editedMaps[id] as any)[field] = value;
  }
}
</script>

<template>
  <div class="config-overlay">
    <div class="config-panel">
      <div class="panel-header">
        <h2 class="panel-title">游戏配置</h2>
        <button class="close-btn" @click="emit('close')">×</button>
      </div>

      <div class="tabs">
        <button
          :class="['tab-btn', { active: activeTab === 'monsters' }]"
          @click="activeTab = 'monsters'"
        >
          怪物配置
        </button>
        <button
          :class="['tab-btn', { active: activeTab === 'maps' }]"
          @click="activeTab = 'maps'"
        >
          地图配置
        </button>
      </div>

      <div class="panel-content">
        <div v-if="activeTab === 'monsters'" class="config-content">
          <div class="config-sidebar">
            <div
              v-for="[id, monster] in getMonsterList()"
              :key="id"
              :class="['config-item', { active: selectedMonsterId === id }]"
              @click="selectedMonsterId = id"
            >
              <span
                class="item-color"
                :style="{ backgroundColor: '#' + monster.color.toString(16).padStart(6, '0') }"
              ></span>
              <span class="item-name">{{ monster.name }}</span>
              <span class="item-type">{{ monster.type }}</span>
            </div>
          </div>

          <div class="config-form" v-if="editedMonsters[selectedMonsterId]">
            <h3 class="form-title">{{ editedMonsters[selectedMonsterId].name }}</h3>
            
            <div class="form-group">
              <label>生命值 (HP)</label>
              <input
                type="number"
                :value="editedMonsters[selectedMonsterId].hp"
                @input="updateMonsterField(selectedMonsterId, 'hp', Number(($event.target as HTMLInputElement).value))"
              />
            </div>

            <div class="form-group">
              <label>攻击力</label>
              <input
                type="number"
                :value="editedMonsters[selectedMonsterId].attack"
                @input="updateMonsterField(selectedMonsterId, 'attack', Number(($event.target as HTMLInputElement).value))"
              />
            </div>

            <div class="form-group">
              <label>移动速度</label>
              <input
                type="number"
                step="0.1"
                :value="editedMonsters[selectedMonsterId].speed"
                @input="updateMonsterField(selectedMonsterId, 'speed', Number(($event.target as HTMLInputElement).value))"
              />
            </div>

            <div class="form-group">
              <label>巡逻范围</label>
              <input
                type="number"
                :value="editedMonsters[selectedMonsterId].patrolRange"
                @input="updateMonsterField(selectedMonsterId, 'patrolRange', Number(($event.target as HTMLInputElement).value))"
              />
            </div>

            <div class="form-group">
              <label>追击范围</label>
              <input
                type="number"
                :value="editedMonsters[selectedMonsterId].chaseRange"
                @input="updateMonsterField(selectedMonsterId, 'chaseRange', Number(($event.target as HTMLInputElement).value))"
              />
            </div>

            <div class="form-group">
              <label>攻击范围</label>
              <input
                type="number"
                :value="editedMonsters[selectedMonsterId].attackRange"
                @input="updateMonsterField(selectedMonsterId, 'attackRange', Number(($event.target as HTMLInputElement).value))"
              />
            </div>

            <div class="form-group">
              <label>攻击冷却 (ms)</label>
              <input
                type="number"
                :value="editedMonsters[selectedMonsterId].attackCooldown"
                @input="updateMonsterField(selectedMonsterId, 'attackCooldown', Number(($event.target as HTMLInputElement).value))"
              />
            </div>

            <div class="form-group">
              <label>掉落率 (0-1)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="1"
                :value="editedMonsters[selectedMonsterId].dropRate"
                @input="updateMonsterField(selectedMonsterId, 'dropRate', Number(($event.target as HTMLInputElement).value))"
              />
            </div>
          </div>
        </div>

        <div v-if="activeTab === 'maps'" class="config-content">
          <div class="config-sidebar">
            <div
              v-for="[id, map] in getMapList()"
              :key="id"
              :class="['config-item', { active: selectedMapId === id }]"
              @click="selectedMapId = id"
            >
              <span class="item-name">{{ map.name }}</span>
            </div>
          </div>

          <div class="config-form" v-if="editedMaps[selectedMapId]">
            <h3 class="form-title">{{ editedMaps[selectedMapId].name }}</h3>
            
            <div class="form-group">
              <label>地图宽度</label>
              <input
                type="number"
                :value="editedMaps[selectedMapId].width"
                @input="updateMapField(selectedMapId, 'width', Number(($event.target as HTMLInputElement).value))"
              />
            </div>

            <div class="form-group">
              <label>地面高度 (Y轴)</label>
              <input
                type="number"
                :value="editedMaps[selectedMapId].groundY"
                @input="updateMapField(selectedMapId, 'groundY', Number(($event.target as HTMLInputElement).value))"
              />
            </div>

            <div class="form-group">
              <label>平台数量</label>
              <input
                type="number"
                :value="editedMaps[selectedMapId].platforms.length"
                disabled
              />
            </div>

            <div class="form-group">
              <label>怪物数量</label>
              <input
                type="number"
                :value="editedMaps[selectedMapId].monsterSpawns.length"
                disabled
              />
            </div>
          </div>
        </div>
      </div>

      <div class="panel-footer">
        <button class="reset-btn" @click="resetToDefault">恢复默认</button>
        <button class="save-btn" @click="saveConfig">保存配置</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.config-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.config-panel {
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  background: #1a1a2e;
  border: 3px solid #00d9ff;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 2px solid #333;
}

.panel-title {
  color: #00d9ff;
  font-size: 20px;
  margin: 0;
}

.close-btn {
  background: transparent;
  border: none;
  color: #ff6b6b;
  font-size: 28px;
  cursor: pointer;
  line-height: 1;
  padding: 0 10px;
}

.close-btn:hover {
  color: #ff8e8e;
}

.tabs {
  display: flex;
  border-bottom: 2px solid #333;
}

.tab-btn {
  flex: 1;
  padding: 12px;
  background: transparent;
  border: none;
  color: #888;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn.active {
  color: #00d9ff;
  border-bottom: 2px solid #00d9ff;
  background: rgba(0, 217, 255, 0.1);
}

.tab-btn:hover:not(.active) {
  color: #fff;
}

.panel-content {
  flex: 1;
  overflow: hidden;
}

.config-content {
  display: flex;
  height: 100%;
  min-height: 400px;
}

.config-sidebar {
  width: 180px;
  border-right: 2px solid #333;
  overflow-y: auto;
}

.config-item {
  padding: 12px;
  cursor: pointer;
  border-bottom: 1px solid #333;
  transition: background 0.2s;
}

.config-item:hover {
  background: rgba(0, 217, 255, 0.1);
}

.config-item.active {
  background: rgba(0, 217, 255, 0.2);
  border-left: 3px solid #00d9ff;
}

.item-color {
  display: inline-block;
  width: 16px;
  height: 16px;
  border-radius: 3px;
  margin-right: 8px;
  vertical-align: middle;
}

.item-name {
  color: #fff;
  font-size: 13px;
  display: block;
}

.item-type {
  color: #888;
  font-size: 11px;
}

.config-form {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.form-title {
  color: #fff;
  font-size: 18px;
  margin: 0 0 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid #333;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  color: #888;
  font-size: 12px;
  margin-bottom: 5px;
}

.form-group input {
  width: 100%;
  padding: 10px;
  background: #16213e;
  border: 2px solid #333;
  border-radius: 4px;
  color: #fff;
  font-size: 14px;
}

.form-group input:focus {
  outline: none;
  border-color: #00d9ff;
}

.form-group input:disabled {
  opacity: 0.5;
}

.panel-footer {
  display: flex;
  gap: 15px;
  padding: 15px 20px;
  border-top: 2px solid #333;
}

.reset-btn, .save-btn {
  flex: 1;
  padding: 12px;
  border: 2px solid;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.reset-btn {
  background: transparent;
  color: #888;
  border-color: #444;
}

.reset-btn:hover {
  border-color: #666;
  color: #aaa;
}

.save-btn {
  background: #00d9ff;
  color: #1a1a2e;
  border-color: #00d9ff;
}

.save-btn:hover {
  box-shadow: 0 0 15px rgba(0, 217, 255, 0.5);
}
</style>
